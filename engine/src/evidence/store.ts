import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Hex } from 'viem';
import { canonicalize, hashNormalizedText } from './canonical.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../');
const evidenceDir = path.join(rootDir, 'evidence');

export type EvidenceCategory = 'transcripts' | 'exams' | 'experiments' | 'onchain';

export interface TraceLine {
  scenarioId?: string;
  stepIndex?: number;
  toolCall?: {
    toolName: string;
    input: unknown;
  };
  modelOutput?: unknown;
  providerModelId?: string;
  policyDecision?: {
    tier: string;
    reasons: string[];
  };
  txHash?: Hex;
  receiptStatus?: string;
  decodedEvents?: unknown[];
  decodedErrors?: unknown[];
  balancesBefore?: {
    vault: string;
    agent?: string;
    recipient?: string;
  };
  balancesAfter?: {
    vault: string;
    agent?: string;
    recipient?: string;
  };
  timestamp: number;
}

/**
 * Returns the absolute path for an evidence run directory.
 */
export function getRunDirectory(category: EvidenceCategory, runId: string): string {
  return path.join(evidenceDir, category, runId);
}

/**
 * Creates the run directory if it does not already exist.
 */
export function createRunDirectory(category: EvidenceCategory, runId: string): string {
  const dir = getRunDirectory(category, runId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Appends a trace record to trace.jsonl in the run directory.
 */
export function writeTraceLine(runDir: string, line: TraceLine): void {
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }
  const tracePath = path.join(runDir, 'trace.jsonl');
  const serialized = canonicalize(line) + '\n';
  fs.appendFileSync(tracePath, serialized, 'utf8');
}

/**
 * Reads all trace lines from trace.jsonl.
 */
export function readTraceLines(runDir: string): TraceLine[] {
  const tracePath = path.join(runDir, 'trace.jsonl');
  if (!fs.existsSync(tracePath)) {
    return [];
  }
  const raw = fs.readFileSync(tracePath, 'utf8');
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as TraceLine);
}

/**
 * Writes a canonical JSON document under the evidence hierarchy.
 */
export function writeEvidenceJson(filePath: string, data: unknown): void {
  const parent = path.dirname(filePath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  const content = JSON.stringify(JSON.parse(canonicalize(data)), null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * Reads and parses an evidence JSON file.
 */
export function readEvidenceJson<T = unknown>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

/**
 * Computes SHA-256 for all trace and data files in a run directory.
 */
export function listTraceFilesWithHashes(runDir: string): Array<{ fileName: string; sha256: Hex }> {
  if (!fs.existsSync(runDir)) {
    return [];
  }
  const entries = fs.readdirSync(runDir, { withFileTypes: true });
  const results: Array<{ fileName: string; sha256: Hex }> = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(runDir, entry.name);
      const content = fs.readFileSync(fullPath, 'utf8');
      const sha256 = hashNormalizedText(content, 'sha256');
      results.push({
        fileName: entry.name,
        sha256,
      });
    }
  }

  return results.sort((a, b) => a.fileName.localeCompare(b.fileName));
}
