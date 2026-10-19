import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  parseEventLogs,
  stringToHex,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { UnderwriteVaultAbi } from "../src/chain/abi/UnderwriteVault.js";
import { computeReportHash } from "../src/exam/report.js";
import {
  computeQualId,
  signQualificationAttestation,
} from "../src/exam/qualify.js";
import {
  buildExecutionEvidence,
  type OnchainReceipt,
} from "../src/evidence/onchainEvidence.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const envPath = path.join(rootDir, ".env");
const deploymentPath = path.join(rootDir, "contracts/deployments/84532.json");
const receiptsDir = path.join(rootDir, "evidence/onchain/receipts");
const outputPath = path.join(rootDir, "evidence/onchain/EXECUTION_EVIDENCE.md");
const recipient = "0x1111111111111111111111111111111111111111" as Address;
const amount = 35_000_000n;
const invoiceKey = keccak256(stringToHex("UNDERWRITE-BASE-SEPOLIA-DEMO-2"));
const memoHash = keccak256(stringToHex("RPC-VERIFIED-CONTROLLED-DEMO"));

function loadLocalEnv(): void {
  if (!fs.existsSync(envPath))
    throw new Error("Missing .env; run the wallet bootstrap first.");
  for (const sourceLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator);
    const value = line.slice(separator + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requirePrivateKey(name: string): Hex {
  const value = process.env[name];
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value))
    throw new Error(`${name} is missing or invalid`);
  return value as Hex;
}

function bigintJson(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

function findGammaReport(): { path: string; report: any } {
  const examsDir = path.join(rootDir, "evidence/exams");
  for (const entry of fs.readdirSync(examsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const reportPath = path.join(examsDir, entry.name, "report.json");
    if (!fs.existsSync(reportPath)) continue;
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    if (report.manifest?.agentImpl === "llm:gamma")
      return { path: reportPath, report };
  }
  throw new Error("No llm:gamma report found");
}

function writeEvidenceRecord(
  fileName: string,
  record: OnchainReceipt,
  rawReceipt: TransactionReceipt
): void {
  fs.mkdirSync(receiptsDir, { recursive: true });
  fs.writeFileSync(
    path.join(receiptsDir, fileName),
    `${JSON.stringify({ ...record, rawReceipt }, bigintJson, 2)}\n`,
    "utf8"
  );
}

async function main(): Promise<void> {
  loadLocalEnv();
  if (!fs.existsSync(deploymentPath))
    throw new Error(`Missing deployment record: ${deploymentPath}`);

  const rpcUrl = process.env.RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org";
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const chainId = await publicClient.getChainId();
  if (chainId !== 84532)
    throw new Error(`Wrong chain: expected 84532, got ${chainId}`);

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as {
    vault: Address;
    owner: Address;
    examiner: Address;
  };
  const code = await publicClient.getBytecode({ address: deployment.vault });
  if (!code || code === "0x")
    throw new Error(`No Base Sepolia bytecode at vault ${deployment.vault}`);

  const ownerPk = requirePrivateKey("OWNER_PRIVATE_KEY");
  const examinerPk = requirePrivateKey("EXAMINER_PRIVATE_KEY");
  const agentPk = requirePrivateKey("AGENT_PRIVATE_KEY");
  const owner = privateKeyToAccount(ownerPk);
  const examiner = privateKeyToAccount(examinerPk);
  const agent = privateKeyToAccount(agentPk);
  if (owner.address.toLowerCase() !== deployment.owner.toLowerCase())
    throw new Error("Owner key does not match deployment");
  if (examiner.address.toLowerCase() !== deployment.examiner.toLowerCase())
    throw new Error("Examiner key does not match deployment");

  const ownerWallet = createWalletClient({
    account: owner,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const examinerWallet = createWalletClient({
    account: examiner,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const agentWallet = createWalletClient({
    account: agent,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const { path: reportPath, report } = findGammaReport();
  if (
    report.compilerOutput.t1MaxPerTx !== "0" ||
    report.compilerOutput.t1MaxPerWindow !== "0"
  ) {
    throw new Error(
      "Expected the current honest gamma report to grant zero T1 authority"
    );
  }
  if (report.compilerOutput.t2Allowed !== true)
    throw new Error("Gamma report does not grant T2 authority");

  console.log(`Using report: ${path.relative(rootDir, reportPath)}`);
  console.log(`Agent public address: ${agent.address}`);

  const commitHash = await examinerWallet.writeContract({
    address: deployment.vault,
    abi: UnderwriteVaultAbi,
    functionName: "commitExam",
    args: [report.configHash as Hex, report.corpusHash as Hex],
  });
  const commitReceipt = await publicClient.waitForTransactionReceipt({
    hash: commitHash,
  });
  if (commitReceipt.status !== "success")
    throw new Error(`commitExam reverted: ${commitHash}`);
  const commitLogs = parseEventLogs({
    abi: UnderwriteVaultAbi,
    eventName: "ExamCommitted",
    logs: commitReceipt.logs,
  });
  const commitLog = commitLogs.find(
    (log) =>
      log.args.configHash?.toLowerCase() === report.configHash.toLowerCase() &&
      log.args.corpusHash?.toLowerCase() === report.corpusHash.toLowerCase()
  );
  if (!commitLog?.args.commitId)
    throw new Error("Missing matching ExamCommitted event");
  const commitId = commitLog.args.commitId;
  writeEvidenceRecord(
    "real-01-exam-committed.json",
    {
      scene: "Scene 1 — Earn",
      function: "commitExam",
      expectedOutcome: "ExamCommitted",
      txHash: commitHash,
      explorerLink: `https://sepolia.basescan.org/tx/${commitHash}`,
      decodedResult: `ExamCommitted(configHash=${report.configHash}, corpusHash=${report.corpusHash}, commitId=${commitId})`,
      blockNumber: Number(commitReceipt.blockNumber),
      status: "SUCCESS",
      chainId,
      verification: {
        source: "rpc",
        verifiedAt: new Date().toISOString(),
        matchingEvent: true,
      },
    },
    commitReceipt
  );

  const qualId = computeQualId(report.configHash as Hex, commitId);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const attestation = {
    qualId,
    vault: deployment.vault,
    agentKey: agent.address,
    configHash: report.configHash as Hex,
    reportHash: computeReportHash(report),
    corpusHash: report.corpusHash as Hex,
    examCommitId: commitId,
    ownerInputsHash: report.compilerOutput.ownerInputsHash as Hex,
    t1MaxPerTx: 0n,
    t1MaxPerWindow: 0n,
    t2MaxPerTx: BigInt(report.compilerOutput.t2MaxPerTx),
    t2Allowed: true,
    issuedAt: now,
    expiresAt: now + 14n * 86_400n,
    examiner: examiner.address,
  };
  const signature = await signQualificationAttestation({
    attestation,
    examinerPrivateKey: examinerPk,
    chainId,
  });
  const activationHash = await ownerWallet.writeContract({
    address: deployment.vault,
    abi: UnderwriteVaultAbi,
    functionName: "activateQualification",
    args: [attestation, signature],
    // Public RPC read replicas can briefly lag the sequencer after commitExam.
    // The sequencer enforces StaleExamCommit and all signature checks on-chain.
    gas: 800_000n,
  });
  const activationReceipt = await publicClient.waitForTransactionReceipt({
    hash: activationHash,
  });
  if (activationReceipt.status !== "success")
    throw new Error(`activateQualification reverted: ${activationHash}`);
  const activationLogs = parseEventLogs({
    abi: UnderwriteVaultAbi,
    eventName: "QualificationActivated",
    logs: activationReceipt.logs,
  });
  const activationLog = activationLogs.find(
    (log) =>
      log.args.qualId?.toLowerCase() === qualId.toLowerCase() &&
      log.args.agentKey?.toLowerCase() === agent.address.toLowerCase()
  );
  if (!activationLog)
    throw new Error("Missing matching QualificationActivated event");
  writeEvidenceRecord(
    "real-02-qualification-activated.json",
    {
      scene: "Scene 1 — Earn",
      function: "activateQualification",
      expectedOutcome: "QualificationActivated",
      txHash: activationHash,
      explorerLink: `https://sepolia.basescan.org/tx/${activationHash}`,
      decodedResult: `QualificationActivated(qualId=${qualId}, agentKey=${agent.address}, t1=0, t2MaxPerTx=${attestation.t2MaxPerTx})`,
      blockNumber: Number(activationReceipt.blockNumber),
      status: "SUCCESS",
      chainId,
      notes:
        "Honest gamma report grants T0/T2 only; no T1 authority was fabricated.",
      verification: {
        source: "rpc",
        verifiedAt: new Date().toISOString(),
        matchingEvent: true,
      },
    },
    activationReceipt
  );

  const requestHash = await agentWallet.writeContract({
    address: deployment.vault,
    abi: UnderwriteVaultAbi,
    functionName: "requestPayment",
    args: [recipient, amount, invoiceKey, memoHash],
    // Avoid a stale read-only RPC backend incorrectly estimating this call as
    // NotAgent immediately after QualificationActivated. The sequencer still
    // enforces every contract guard when it executes the transaction.
    gas: 500_000n,
  });
  const requestReceipt = await publicClient.waitForTransactionReceipt({
    hash: requestHash,
  });
  if (requestReceipt.status !== "success")
    throw new Error(`requestPayment reverted: ${requestHash}`);
  const requestLogs = parseEventLogs({
    abi: UnderwriteVaultAbi,
    eventName: "PaymentRequested",
    logs: requestReceipt.logs,
  });
  const requestLog = requestLogs.find(
    (log) =>
      log.args.recipient?.toLowerCase() === recipient.toLowerCase() &&
      log.args.amount === amount &&
      log.args.qualId?.toLowerCase() === qualId.toLowerCase()
  );
  if (!requestLog?.args.id || !requestLog.args.readyAt)
    throw new Error("Missing matching PaymentRequested event");
  writeEvidenceRecord(
    "real-03-payment-requested.json",
    {
      scene: "Scene 2 — Work",
      function: "requestPayment",
      expectedOutcome: "PaymentRequested",
      txHash: requestHash,
      explorerLink: `https://sepolia.basescan.org/tx/${requestHash}`,
      decodedResult: `PaymentRequested(id=${requestLog.args.id}, recipient=${recipient}, amount=${amount}, readyAt=${requestLog.args.readyAt})`,
      blockNumber: Number(requestReceipt.blockNumber),
      status: "SUCCESS",
      chainId,
      notes: "CONTROLLED Base Sepolia demo payment using MockUSDC.",
      verification: {
        source: "rpc",
        verifiedAt: new Date().toISOString(),
        matchingEvent: true,
      },
    },
    requestReceipt
  );

  while (true) {
    const latest = await publicClient.getBlock();
    if (latest.timestamp >= requestLog.args.readyAt) break;
    const remaining = requestLog.args.readyAt - latest.timestamp;
    console.log(`Challenge window: ${remaining}s remaining`);
    await new Promise((resolve) =>
      setTimeout(resolve, Number(remaining > 30n ? 30n : remaining + 1n) * 1000)
    );
  }

  const executeHash = await agentWallet.writeContract({
    address: deployment.vault,
    abi: UnderwriteVaultAbi,
    functionName: "executePending",
    args: [requestLog.args.id],
    gas: 500_000n,
  });
  const executeReceipt = await publicClient.waitForTransactionReceipt({
    hash: executeHash,
  });
  if (executeReceipt.status !== "success")
    throw new Error(`executePending reverted: ${executeHash}`);
  const paymentLogs = parseEventLogs({
    abi: UnderwriteVaultAbi,
    eventName: "PaymentExecuted",
    logs: executeReceipt.logs,
  });
  const paymentLog = paymentLogs.find(
    (log) =>
      log.args.recipient?.toLowerCase() === recipient.toLowerCase() &&
      log.args.amount === amount &&
      log.args.invoiceKey?.toLowerCase() === invoiceKey.toLowerCase() &&
      log.args.tier === 2
  );
  if (!paymentLog) throw new Error("Missing matching PaymentExecuted event");
  writeEvidenceRecord(
    "real-04-payment-executed.json",
    {
      scene: "Scene 2 — Work",
      function: "executePending",
      expectedOutcome: "PaymentExecuted",
      txHash: executeHash,
      explorerLink: `https://sepolia.basescan.org/tx/${executeHash}`,
      decodedResult: `PaymentExecuted(paymentId=${paymentLog.args.paymentId}, recipient=${recipient}, amount=${amount}, invoiceKey=${invoiceKey}, tier=2)`,
      blockNumber: Number(executeReceipt.blockNumber),
      status: "SUCCESS",
      chainId,
      notes: "CONTROLLED Base Sepolia demo payment using MockUSDC.",
      verification: {
        source: "rpc",
        verifiedAt: new Date().toISOString(),
        matchingEvent: true,
      },
    },
    executeReceipt
  );

  const result = buildExecutionEvidence(receiptsDir, outputPath);
  console.log(
    `SUCCESS: wrote ${result.totalReceipts} RPC-verified evidence rows.`
  );
  console.log(`PaymentExecuted transaction: ${executeHash}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
