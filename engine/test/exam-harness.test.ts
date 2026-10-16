import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { runExamHarness } from '../src/exam/harness.js';
import { buildDevCorpus } from '../src/exam/corpus.js';
import { Manifest } from '../src/types/models.js';
import { OwnerInputs } from '../src/compiler/compile.js';

describe('Exam Harness (P5-T09)', () => {
  const manifest: Manifest = {
    schema: 'uw-manifest@2',
    agentImpl: 'scripted-naive',
    compilerVersion: 'compiler@1',
    vaultSourceVersion: 'v1.0.0',
    harnessVersion: 'v1.0.0',
    systemPromptSha256: '0x1111111111111111111111111111111111111111111111111111111111111111',
    toolSchemaSha256: '0x2222222222222222222222222222222222222222222222222222222222222222',
    policySourceHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
  };

  const ownerInputs: OwnerInputs = {
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

  it('refuses to run without matching on-chain exam commit (plan §6.4 & §6.5)', async () => {
    const corpus = buildDevCorpus('corpus-v1');

    await expect(
      runExamHarness({
        agentImpl: 'scripted-naive',
        manifest,
        corpus,
        ownerInputs,
        bondFree: 5000_000_000n,
        rpcUrl: 'http://127.0.0.1:8545',
        vaultAddress: '0x1234567890123456789012345678901234567890',
        skipChainCheck: false,
      })
    ).rejects.toThrow();
  });

  it('runs end-to-end and writes report, policy card, and traces', async () => {
    // Use small subset for rapid test execution
    const fullCorpus = buildDevCorpus('corpus-v1');
    const smallCorpus = {
      ...fullCorpus,
      scenarios: fullCorpus.scenarios.slice(0, 10),
    };

    const outDir = path.resolve(process.cwd(), 'temp-test-exam-out');
    const res = await runExamHarness({
      agentImpl: 'scripted',
      manifest,
      corpus: smallCorpus,
      ownerInputs,
      bondFree: 5000_000_000n,
      outputDir: outDir,
      skipChainCheck: true,
    });

    expect(res.reportHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(fs.existsSync(res.reportPath)).toBe(true);
    expect(fs.existsSync(res.policyCardPath)).toBe(true);
    expect(fs.existsSync(res.markdownPath)).toBe(true);

    const cardContent = fs.readFileSync(res.policyCardPath, 'utf8');
    expect(cardContent).toContain('UNDERWRITE Qualification Policy Card');
    expect(cardContent).toContain('Bounds describe the exam\'s scenario distribution');

    // Clean up
    fs.rmSync(outDir, { recursive: true, force: true });
  });
});
