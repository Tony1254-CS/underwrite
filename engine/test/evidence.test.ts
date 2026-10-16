import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { type Hex } from 'viem';
import {
  createRunDirectory,
  getRunDirectory,
  writeTraceLine,
  readTraceLines,
  writeEvidenceJson,
  readEvidenceJson,
  listTraceFilesWithHashes,
  TraceLine,
} from '../src/evidence/store.js';
import { hashCanonicalJson, hashNormalizedText } from '../src/evidence/canonical.js';

const testRunId = 'test-run-p3t10';
const testRunDir = getRunDirectory('transcripts', testRunId);

describe('Evidence store (P3-T10, PV-23)', () => {
  afterAll(() => {
    if (fs.existsSync(testRunDir)) {
      fs.rmSync(testRunDir, { recursive: true, force: true });
    }
  });

  it('creates run directory under evidence/ hierarchy', () => {
    const dir = createRunDirectory('transcripts', testRunId);
    expect(fs.existsSync(dir)).toBe(true);
    expect(dir).toContain(path.join('evidence', 'transcripts', testRunId));
  });

  it('round-trips trace line records with exact hash preservation', () => {
    const sampleLine: TraceLine = {
      scenarioId: 'BEN-STD-001',
      stepIndex: 1,
      toolCall: {
        toolName: 'propose_payment',
        input: {
          vendorId: 'vendor-acme',
          invoiceNumber: 'INV-100',
          amount: '150',
        },
      },
      modelOutput: { thought: 'Invoice verified against PO and GRN.' },
      providerModelId: 'gemini-2.5-flash',
      policyDecision: {
        tier: 'T1',
        reasons: [],
      },
      txHash: ('0x' + 'aa'.repeat(32)) as Hex,
      receiptStatus: 'success',
      decodedEvents: [{ name: 'PaymentExecuted', paymentId: '42' }],
      decodedErrors: [],
      balancesBefore: {
        vault: '5000000000',
        agent: '0',
        recipient: '0',
      },
      balancesAfter: {
        vault: '4850000000',
        agent: '0',
        recipient: '150000000',
      },
      timestamp: 1700000000,
    };

    // Write trace line
    writeTraceLine(testRunDir, sampleLine);

    // Read trace lines
    const lines = readTraceLines(testRunDir);
    expect(lines).toHaveLength(1);
    const readLine = lines[0];

    expect(readLine.scenarioId).toBe(sampleLine.scenarioId);
    expect(readLine.providerModelId).toBe(sampleLine.providerModelId);
    expect(readLine.txHash).toBe(sampleLine.txHash);
    expect(readLine.balancesAfter?.vault).toBe('4850000000');

    // Canonical hash round-trip: hash(sample) === hash(readBack)
    const hashOriginal = hashCanonicalJson(sampleLine);
    const hashRead = hashCanonicalJson(readLine);
    expect(hashRead).toBe(hashOriginal);
  });

  it('round-trips evidence JSON files with canonical formatting', () => {
    const testJsonPath = path.join(testRunDir, 'report.json');
    const reportData = {
      manifestHash: '0x' + '11'.repeat(32),
      corpusHash: '0x' + '22'.repeat(32),
      results: {
        benignComplete: 120,
        class1Stopped: 60,
        class2Loss: 0,
      },
      limitations: ['Synthetic corpus evaluation only'],
    };

    writeEvidenceJson(testJsonPath, reportData);
    expect(fs.existsSync(testJsonPath)).toBe(true);

    const readData = readEvidenceJson<typeof reportData>(testJsonPath);
    expect(readData.manifestHash).toBe(reportData.manifestHash);
    expect(readData.results.benignComplete).toBe(120);

    const hash1 = hashCanonicalJson(reportData);
    const hash2 = hashCanonicalJson(readData);
    expect(hash2).toBe(hash1);
  });

  it('lists trace files with SHA-256 hashes', () => {
    const fileHashes = listTraceFilesWithHashes(testRunDir);
    expect(fileHashes.length).toBeGreaterThanOrEqual(2); // trace.jsonl and report.json

    const traceEntry = fileHashes.find((f) => f.fileName === 'trace.jsonl');
    expect(traceEntry).toBeDefined();
    expect(traceEntry?.sha256).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Verify hash matches actual file content
    const rawContent = fs.readFileSync(path.join(testRunDir, 'trace.jsonl'), 'utf8');
    const expectedSha = hashNormalizedText(rawContent, 'sha256');
    expect(traceEntry?.sha256).toBe(expectedSha);
  });
});
