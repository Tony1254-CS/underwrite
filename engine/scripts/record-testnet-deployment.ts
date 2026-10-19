import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const deploymentPath = path.join(rootDir, "contracts/deployments/84532.json");
const broadcastPath = path.join(
  rootDir,
  "contracts/broadcast/Deploy.s.sol/84532/run-latest.json"
);

if (!fs.existsSync(deploymentPath) || !fs.existsSync(broadcastPath)) {
  throw new Error(
    "Deployment record or Base Sepolia broadcast artifact is missing"
  );
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const broadcast = JSON.parse(fs.readFileSync(broadcastPath, "utf8")) as {
  transactions: Array<{
    hash: Hex;
    transactionType: string;
    contractName?: string;
    contractAddress?: Address;
  }>;
  receipts: Array<{
    transactionHash: Hex;
    blockNumber: string;
    status: string;
  }>;
};
const rpcUrl = process.env.RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org";
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

const creations: Record<
  string,
  { address: Address; txHash: Hex; blockNumber: number }
> = {};
for (const transaction of broadcast.transactions.filter(
  (item) => item.transactionType === "CREATE"
)) {
  if (!transaction.contractName || !transaction.contractAddress) continue;
  const receipt = await publicClient.getTransactionReceipt({
    hash: transaction.hash,
  });
  if (receipt.status !== "success")
    throw new Error(`Deployment reverted: ${transaction.hash}`);
  const code = await publicClient.getBytecode({
    address: transaction.contractAddress,
  });
  if (!code || code === "0x")
    throw new Error(`No bytecode at ${transaction.contractAddress}`);
  creations[transaction.contractName] = {
    address: transaction.contractAddress,
    txHash: transaction.hash,
    blockNumber: Number(receipt.blockNumber),
  };
}

for (const required of ["MockUSDC", "BondPool", "UnderwriteVault"]) {
  if (!creations[required])
    throw new Error(`Missing verified ${required} deployment transaction`);
}

deployment.deploymentTransactions = creations;
deployment.rpcVerifiedAt = new Date().toISOString();
fs.writeFileSync(
  deploymentPath,
  `${JSON.stringify(deployment, null, 2)}\n`,
  "utf8"
);
console.log(
  `Recorded and RPC-verified ${Object.keys(creations).length} contract deployments.`
);
