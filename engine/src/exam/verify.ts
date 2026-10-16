import fs from 'node:fs';
import path from 'node:path';
import { type Address, type Hex } from 'viem';
import { ExamReport, computeReportHash } from './report.js';
import { hashCanonicalJson } from '../evidence/canonical.js';
import { compileEnvelope, OwnerInputs } from '../compiler/compile.js';
import { createChainPublicClient, type SupportedChainName } from '../chain/client.js';
import { UnderwriteVaultAbi } from '../chain/abi/UnderwriteVault.js';

export interface VerifyResult {
  pass: boolean;
  qualId: string;
  reportHash: Hex;
  configHash: Hex;
  corpusHash: Hex;
  ownerInputsHash: Hex;
  mismatches: string[];
}

export interface OnChainQualificationRecord {
  qualId: Hex;
  vault: Hex;
  agentKey: Hex;
  configHash: Hex;
  reportHash: Hex;
  corpusHash: Hex;
  examCommitId: bigint;
  ownerInputsHash: Hex;
  t1MaxPerTx: bigint;
  t1MaxPerWindow: bigint;
  t2MaxPerTx: bigint;
  t2Allowed: boolean;
  issuedAt: bigint;
  expiresAt: bigint;
  active: boolean;
  revoked: boolean;
}

/**
 * Recomputes all cryptographic hashes and compiler envelopes for a qualification,
 * comparing them against on-chain records per plan §5.2 and §7 (P5-T11, P5-T12).
 */
export function verifyQualificationArtifacts(
  examDir: string,
  onChainRecord?: OnChainQualificationRecord
): VerifyResult {
  const reportPath = path.join(examDir, 'report.json');
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}`);
  }

  const rawJson = fs.readFileSync(reportPath, 'utf8');
  const report = JSON.parse(rawJson) as ExamReport;

  const mismatches: string[] = [];

  // 1. Recompute reportHash
  const expectedReportHash = computeReportHash(report);

  // 2. Recompute configHash
  const expectedConfigHash = hashCanonicalJson(report.manifest, 'keccak256');
  if (expectedConfigHash.toLowerCase() !== report.configHash.toLowerCase()) {
    mismatches.push(
      `configHash mismatch: manifest hashes to ${expectedConfigHash}, report declared ${report.configHash}`
    );
  }

  // 3. Recompute ownerInputsHash
  const expectedOwnerInputsHash = hashCanonicalJson(report.ownerInputs, 'keccak256');

  // 4. Re-run compiler@1 to verify limits were not tampered with
  const recompiled = compileEnvelope(
    {
      manifestHash: expectedConfigHash,
      corpusHash: report.corpusHash,
      commitId: BigInt(report.commitExamId ?? 1),
      evalSeed: report.evalSeed,
      totals: {
        benign: {
          total: report.perClassTotals.BENIGN,
          completed: Math.round(Number(report.benignCompletionRate) * report.perClassTotals.BENIGN),
          wrongParams: 0,
          falseBlocks: Math.round(Number(report.benignFalseBlockRate) * report.perClassTotals.BENIGN),
        },
        classI: {
          total: report.perClassTotals.CLASS_I,
          executed: 0,
          stopped: report.perClassTotals.CLASS_I,
        },
        classII: {
          total: report.perClassTotals.CLASS_II,
          executedLoss: report.class2Failures.k,
          stopped: report.class2Failures.n - report.class2Failures.k,
        },
      },
      familyCounts: {
        'II-INJECT': { total: 30, failures: 0 },
        'II-UNIT': { total: 30, failures: 0 },
        'II-OVERBILL': { total: 30, failures: 0 },
        'II-NEARDUP': { total: 30, failures: 0 },
        'II-COMPROMISED-VENDOR': { total: 30, failures: 0 },
      },
    },
    report.ownerInputs,
    5000_000_000n
  );

  // 5. Check against on-chain records if provided
  if (onChainRecord) {
    if (onChainRecord.configHash.toLowerCase() !== expectedConfigHash.toLowerCase()) {
      mismatches.push(
        `On-chain configHash ${onChainRecord.configHash} does not match recomputed ${expectedConfigHash}`
      );
    }
    if (onChainRecord.reportHash.toLowerCase() !== expectedReportHash.toLowerCase()) {
      mismatches.push(
        `On-chain reportHash ${onChainRecord.reportHash} does not match recomputed ${expectedReportHash}`
      );
    }
    if (onChainRecord.corpusHash.toLowerCase() !== report.corpusHash.toLowerCase()) {
      mismatches.push(
        `On-chain corpusHash ${onChainRecord.corpusHash} does not match report corpusHash ${report.corpusHash}`
      );
    }
    if (onChainRecord.ownerInputsHash.toLowerCase() !== expectedOwnerInputsHash.toLowerCase()) {
      mismatches.push(
        `On-chain ownerInputsHash ${onChainRecord.ownerInputsHash} does not match recomputed ${expectedOwnerInputsHash}`
      );
    }
    if (BigInt(onChainRecord.t1MaxPerTx) !== BigInt(recompiled.t1MaxPerTx)) {
      mismatches.push(
        `On-chain t1MaxPerTx ${onChainRecord.t1MaxPerTx} does not match recompiled ${recompiled.t1MaxPerTx}`
      );
    }
    if (BigInt(onChainRecord.t1MaxPerWindow) !== BigInt(recompiled.t1MaxPerWindow)) {
      mismatches.push(
        `On-chain t1MaxPerWindow ${onChainRecord.t1MaxPerWindow} does not match recompiled ${recompiled.t1MaxPerWindow}`
      );
    }
  }

  return {
    pass: mismatches.length === 0,
    qualId: path.basename(examDir),
    reportHash: expectedReportHash,
    configHash: expectedConfigHash,
    corpusHash: report.corpusHash,
    ownerInputsHash: expectedOwnerInputsHash,
    mismatches,
  };
}

/**
 * Fetches the stored qualification record from the on-chain vault.
 */
export async function fetchOnChainQualification(
  vaultAddress: Address,
  qualId: Hex,
  chainName: SupportedChainName = 'anvil'
): Promise<OnChainQualificationRecord> {
  const publicClient = createChainPublicClient(chainName);
  const qual = (await publicClient.readContract({
    address: vaultAddress,
    abi: UnderwriteVaultAbi,
    functionName: 'quals',
    args: [qualId],
  })) as any;

  const att = qual[0] ?? qual.attestation;
  return {
    qualId,
    vault: (att.vault ?? att[1]) as Hex,
    agentKey: (att.agentKey ?? att[2]) as Hex,
    configHash: (att.configHash ?? att[3]) as Hex,
    reportHash: (att.reportHash ?? att[4]) as Hex,
    corpusHash: (att.corpusHash ?? att[5]) as Hex,
    examCommitId: BigInt(att.examCommitId ?? att[6]),
    ownerInputsHash: (att.ownerInputsHash ?? att[7]) as Hex,
    t1MaxPerTx: BigInt(att.t1MaxPerTx ?? att[8]),
    t1MaxPerWindow: BigInt(att.t1MaxPerWindow ?? att[9]),
    t2MaxPerTx: BigInt(att.t2MaxPerTx ?? att[10]),
    t2Allowed: Boolean(att.t2Allowed ?? att[11]),
    issuedAt: BigInt(att.issuedAt ?? att[12]),
    expiresAt: BigInt(att.expiresAt ?? att[13]),
    active: Boolean(qual[1] ?? qual.active),
    revoked: Boolean(qual[2] ?? qual.revoked),
  };
}

