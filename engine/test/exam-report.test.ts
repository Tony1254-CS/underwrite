import { describe, it, expect } from 'vitest';
import {
  buildReport,
  computeReportHash,
  renderPolicyCard,
  renderReportMarkdown,
  VERBATIM_POLICY_CARD_NOTES,
} from '../src/exam/report.js';
import { Manifest } from '../src/types/models.js';
import { compileEnvelope, OwnerInputs } from '../src/compiler/compile.js';
import { ScenarioAggregatedScore } from '../src/exam/scorer.js';

describe('Report Builder & Policy Card (P5-T10)', () => {
  const dummyManifest: Manifest = {
    schema: 'uw-manifest@2',
    agentImpl: 'scripted-naive',
    compilerVersion: 'compiler@1',
    vaultSourceVersion: 'v1.0.0',
    harnessVersion: 'v1.0.0',
    systemPromptSha256: '0x1111111111111111111111111111111111111111111111111111111111111111',
    toolSchemaSha256: '0x2222222222222222222222222222222222222222222222222222222222222222',
    policySourceHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
  };

  const dummyOwnerInputs: OwnerInputs = {
    riskBudgetPerWindow: 10_000_000n, // 10 USDC
    adversarialShare: 0.2,
    familyWeights: {
      'II-INJECT': 0.2,
      'II-UNIT': 0.2,
      'II-OVERBILL': 0.2,
      'II-NEARDUP': 0.2,
      'II-COMPROMISED-VENDOR': 0.2,
    },
    ceilings: {
      perTx: 300_000_000n,
      perWindow: 1000_000_000n,
      t2PerTx: 2000_000_000n,
    },
    minUsefulCap: 20_000_000n,
  };

  const dummyCompilerOutput = compileEnvelope(
    {
      manifestHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      corpusHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      commitId: 1n,
      evalSeed: 'seed123',
      totals: {
        benign: { total: 120, completed: 120, wrongParams: 0, falseBlocks: 0 },
        classI: { total: 60, executed: 0, stopped: 60 },
        classII: { total: 150, executedLoss: 0, stopped: 150 },
      },
      familyCounts: {
        'II-INJECT': { total: 30, failures: 0 },
        'II-UNIT': { total: 30, failures: 0 },
        'II-OVERBILL': { total: 30, failures: 0 },
        'II-NEARDUP': { total: 30, failures: 0 },
        'II-COMPROMISED-VENDOR': { total: 30, failures: 0 },
      },
    },
    dummyOwnerInputs,
    5000_000_000n
  );

  const dummyScores: ScenarioAggregatedScore[] = [
    {
      scenarioId: 'BEN-STD-001',
      scenarioClass: 'BENIGN',
      worstLabel: 'SAFE_COMPLETE',
      totalLoss: 0,
      runs: [],
    },
    {
      scenarioId: 'I-PAYEE-001',
      scenarioClass: 'CLASS_I',
      worstLabel: 'CLASS_I_STOPPED@policy',
      totalLoss: 0,
      runs: [],
    },
    {
      scenarioId: 'II-INJECT-001',
      scenarioClass: 'CLASS_II',
      worstLabel: 'CLASS_II_STOPPED@agent',
      totalLoss: 0,
      runs: [],
    },
  ];

  it('builds canonical ExamReport object', () => {
    const report = buildReport({
      manifest: dummyManifest,
      configHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      corpusVersion: 'corpus-v1',
      corpusHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      evalSeed: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      r: 1,
      scores: dummyScores,
      compilerOutput: dummyCompilerOutput,
      ownerInputs: dummyOwnerInputs,
      traceFiles: [{ path: 'traces/run-1.jsonl', sha256: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' }],
    });

    expect(report.manifest.agentImpl).toBe('scripted-naive');
    expect(report.compilerOutput.t1MaxPerWindow).toBe(180_000_000n);
    expect(report.perClassTotals.BENIGN).toBe(1);
    expect(report.perClassTotals.CLASS_I).toBe(1);
    expect(report.perClassTotals.CLASS_II).toBe(1);

    const hash1 = computeReportHash(report);
    const hash2 = computeReportHash(report);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('renders Policy Card containing the three verbatim notes of plan §7', () => {
    const report = buildReport({
      manifest: dummyManifest,
      configHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      corpusVersion: 'corpus-v1',
      corpusHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      evalSeed: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      r: 1,
      scores: dummyScores,
      compilerOutput: dummyCompilerOutput,
      ownerInputs: dummyOwnerInputs,
      traceFiles: [],
    });

    const cardMd = renderPolicyCard(report);

    for (const note of VERBATIM_POLICY_CARD_NOTES) {
      expect(cardMd).toContain(note);
    }

    expect(cardMd).toContain('Sensitivity Table');
    expect(cardMd).toContain('a = 0.01');
    expect(cardMd).toContain('a = 0.05');
    expect(cardMd).toContain('a = 0.20');
  });

  it('renders report markdown with benchmark summary', () => {
    const report = buildReport({
      manifest: dummyManifest,
      configHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      corpusVersion: 'corpus-v1',
      corpusHash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      evalSeed: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      r: 1,
      scores: dummyScores,
      compilerOutput: dummyCompilerOutput,
      ownerInputs: dummyOwnerInputs,
      traceFiles: [],
    });

    const md = renderReportMarkdown(report);
    expect(md).toContain('UNDERWRITE Exam Report');
    expect(md).toContain('T1 Window Cap');
    expect(md).toContain('180 USDC');
  });
});
