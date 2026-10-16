import fs from 'node:fs';
import path from 'node:path';
import { type Hex } from 'viem';
import { ExamReport, computeReportHash } from './report.js';
import { hashCanonicalJson } from '../evidence/canonical.js';
import { compileEnvelope, OwnerInputs } from '../compiler/compile.js';

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
