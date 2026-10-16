import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { runExamHarness } from '../src/exam/harness.js';
import { buildDevCorpus } from '../src/exam/corpus.js';
import { Manifest } from '../src/types/models.js';
import { OwnerInputs } from '../src/compiler/compile.js';
import { verifyQualificationArtifacts, OnChainQualificationRecord } from '../src/exam/verify.js';
import { hashCanonicalJson } from '../src/evidence/canonical.js';

describe('Qualification Verifier & Tamper Tests (P5-T11, P5-T12)', () => {
  const manifest: Manifest = {
    schema: 'uw-manifest@2',
    agentImpl: 'scripted',
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

  it('passes verification when report and on-chain records match exactly', async () => {
    const fullCorpus = buildDevCorpus('corpus-v1');
    const smallCorpus = {
      ...fullCorpus,
      scenarios: fullCorpus.scenarios.slice(0, 10),
    };

    const outDir = path.resolve(process.cwd(), 'temp-verify-test-pass');
    const harnessRes = await runExamHarness({
      agentImpl: 'scripted',
      manifest,
      corpus: smallCorpus,
      ownerInputs,
      bondFree: 5000_000_000n,
      outputDir: outDir,
      skipChainCheck: true,
    });

    const expectedConfigHash = hashCanonicalJson(manifest, 'keccak256');
    const expectedOwnerInputsHash = hashCanonicalJson(ownerInputs, 'keccak256');

    const validRecord: OnChainQualificationRecord = {
      qualId: '0x1234567890123456789012345678901234567890123456789012345678901234',
      vault: '0x0000000000000000000000000000000000000001',
      agentKey: '0x0000000000000000000000000000000000000002',
      configHash: expectedConfigHash,
      reportHash: harnessRes.reportHash,
      corpusHash: harnessRes.report.corpusHash,
      examCommitId: 1n,
      ownerInputsHash: expectedOwnerInputsHash,
      t1MaxPerTx: harnessRes.report.compilerOutput.t1MaxPerTx,
      t1MaxPerWindow: harnessRes.report.compilerOutput.t1MaxPerWindow,
      t2MaxPerTx: harnessRes.report.compilerOutput.t2MaxPerTx,
      t2Allowed: harnessRes.report.compilerOutput.t2Allowed,
      issuedAt: 1000n,
      expiresAt: 2000n,
      active: true,
      revoked: false,
    };

    const check = verifyQualificationArtifacts(outDir, validRecord);
    expect(check.pass).toBe(true);
    expect(check.mismatches.length).toBe(0);

    // Clean up
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('fails verification on 1-byte tamper of report.json (P5-T12)', async () => {
    const fullCorpus = buildDevCorpus('corpus-v1');
    const smallCorpus = {
      ...fullCorpus,
      scenarios: fullCorpus.scenarios.slice(0, 10),
    };

    const outDir = path.resolve(process.cwd(), 'temp-verify-test-tamper');
    const harnessRes = await runExamHarness({
      agentImpl: 'scripted',
      manifest,
      corpus: smallCorpus,
      ownerInputs,
      bondFree: 5000_000_000n,
      outputDir: outDir,
      skipChainCheck: true,
    });

    const reportPath = path.join(outDir, 'report.json');
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Tamper 1 byte: modify benign completion rate
    reportData.benignCompletionRate = '0.999999999';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');

    const record: OnChainQualificationRecord = {
      qualId: '0x1234567890123456789012345678901234567890123456789012345678901234',
      vault: '0x0000000000000000000000000000000000000001',
      agentKey: '0x0000000000000000000000000000000000000002',
      configHash: hashCanonicalJson(manifest, 'keccak256'),
      reportHash: harnessRes.reportHash, // on-chain holds original report hash
      corpusHash: harnessRes.report.corpusHash,
      examCommitId: 1n,
      ownerInputsHash: hashCanonicalJson(ownerInputs, 'keccak256'),
      t1MaxPerTx: harnessRes.report.compilerOutput.t1MaxPerTx,
      t1MaxPerWindow: harnessRes.report.compilerOutput.t1MaxPerWindow,
      t2MaxPerTx: harnessRes.report.compilerOutput.t2MaxPerTx,
      t2Allowed: harnessRes.report.compilerOutput.t2Allowed,
      issuedAt: 1000n,
      expiresAt: 2000n,
      active: true,
      revoked: false,
    };

    const check = verifyQualificationArtifacts(outDir, record);
    expect(check.pass).toBe(false);
    expect(check.mismatches.some((m) => m.includes('reportHash'))).toBe(true);

    // Clean up
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('fails verification on mismatching on-chain limit (P5-T12)', async () => {
    const fullCorpus = buildDevCorpus('corpus-v1');
    const smallCorpus = {
      ...fullCorpus,
      scenarios: fullCorpus.scenarios.slice(0, 10),
    };

    const outDir = path.resolve(process.cwd(), 'temp-verify-test-limits');
    const harnessRes = await runExamHarness({
      agentImpl: 'scripted',
      manifest,
      corpus: smallCorpus,
      ownerInputs,
      bondFree: 5000_000_000n,
      outputDir: outDir,
      skipChainCheck: true,
    });

    const recordWithBadLimits: OnChainQualificationRecord = {
      qualId: '0x1234567890123456789012345678901234567890123456789012345678901234',
      vault: '0x0000000000000000000000000000000000000001',
      agentKey: '0x0000000000000000000000000000000000000002',
      configHash: hashCanonicalJson(manifest, 'keccak256'),
      reportHash: harnessRes.reportHash,
      corpusHash: harnessRes.report.corpusHash,
      examCommitId: 1n,
      ownerInputsHash: hashCanonicalJson(ownerInputs, 'keccak256'),
      t1MaxPerTx: 999_000_000n, // Mismatched! Inflated limit
      t1MaxPerWindow: harnessRes.report.compilerOutput.t1MaxPerWindow,
      t2MaxPerTx: harnessRes.report.compilerOutput.t2MaxPerTx,
      t2Allowed: harnessRes.report.compilerOutput.t2Allowed,
      issuedAt: 1000n,
      expiresAt: 2000n,
      active: true,
      revoked: false,
    };

    const check = verifyQualificationArtifacts(outDir, recordWithBadLimits);
    expect(check.pass).toBe(false);
    expect(check.mismatches.some((m) => m.includes('t1MaxPerTx'))).toBe(true);

    // Clean up
    fs.rmSync(outDir, { recursive: true, force: true });
  });
});
