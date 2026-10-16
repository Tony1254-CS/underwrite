import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { runExamHarness } from '../src/exam/harness.js';
import { buildDevCorpus } from '../src/exam/corpus.js';
import { Manifest } from '../src/types/models.js';
import { OwnerInputs } from '../src/compiler/compile.js';
import { hashCanonicalJson } from '../src/evidence/canonical.js';
import { qualifyAgent } from '../src/exam/qualify.js';
import { loadDeployments } from '../src/chain/client.js';

describe('Reproducibility and cross-language EIP-712 check (P5-T13)', () => {
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

  it('runs scripted-naive twice on the same corpus and yields identical reportHash', async () => {
    const fullCorpus = buildDevCorpus('corpus-v1');
    const smallCorpus = {
      ...fullCorpus,
      scenarios: fullCorpus.scenarios.slice(0, 10),
    };

    const outDir1 = path.resolve(process.cwd(), 'temp-repro-run-1');
    const outDir2 = path.resolve(process.cwd(), 'temp-repro-run-2');

    const res1 = await runExamHarness({
      agentImpl: 'scripted-naive',
      manifest,
      corpus: smallCorpus,
      ownerInputs,
      bondFree: 5000_000_000n,
      outputDir: outDir1,
      skipChainCheck: true,
    });

    const res2 = await runExamHarness({
      agentImpl: 'scripted-naive',
      manifest,
      corpus: smallCorpus,
      ownerInputs,
      bondFree: 5000_000_000n,
      outputDir: outDir2,
      skipChainCheck: true,
    });

    expect(res1.reportHash).toBeDefined();
    expect(res2.reportHash).toBeDefined();
    expect(res1.reportHash).toBe(res2.reportHash);

    // Verify report.json content identity
    const report1Raw = fs.readFileSync(path.join(outDir1, 'report.json'), 'utf8');
    const report2Raw = fs.readFileSync(path.join(outDir2, 'report.json'), 'utf8');
    expect(report1Raw).toBe(report2Raw);

    // Cleanup temp dirs
    fs.rmSync(outDir1, { recursive: true, force: true });
    fs.rmSync(outDir2, { recursive: true, force: true });
  });

  it('verifies that TypeScript-signed EIP-712 attestation is accepted by the Solidity vault (PV-07 cross-check)', async () => {
    const deployment = loadDeployments(31337);
    if (!deployment?.vault) {
      console.warn('Skipping live chain check: no Anvil deployment found');
      return;
    }

    const configHash = hashCanonicalJson(manifest, 'keccak256');
    const fullCorpus = buildDevCorpus('corpus-v1');
    const corpusHash = hashCanonicalJson(fullCorpus, 'keccak256');

    // Run qualification on Anvil: commitExam -> EIP-712 signTypedData -> activateQualification
    const qualResult = await qualifyAgent({
      vaultAddress: deployment.vault,
      agentKey: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      configHash,
      corpusHash,
      t1MaxPerTx: 0n,
      t1MaxPerWindow: 0n,
      t2MaxPerTx: 1000_000_000n,
      t2Allowed: true,
      issuedAt: BigInt(Math.floor(Date.now() / 1000)),
      expiresAt: BigInt(Math.floor(Date.now() / 1000) + 14 * 86400),
      examinerPrivateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      ownerPrivateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      chainName: 'anvil',
    });

    expect(qualResult.qualId).toBeDefined();
    expect(qualResult.activationTxHash).toBeDefined();
    expect(qualResult.activationTxHash.startsWith('0x')).toBe(true);
    expect(qualResult.signature).toBeDefined();
  });
});
