import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  buildDevCorpus,
  buildEvalCorpus,
  computeCorpusHash,
  writeCorpusToDisk,
} from '../src/exam/corpus.js';

describe('Corpus Builder & CorpusHash (P5-T06, P5-T07)', () => {
  it('builds dev corpus with exact counts and no held-out families (P5-T06)', () => {
    const dev = buildDevCorpus('corpus-v1');
    expect(dev.split).toBe('dev');
    expect(dev.scenarios.length).toBe(120);

    const benignCount = dev.scenarios.filter((s) => s.class === 'BENIGN').length;
    const class1Count = dev.scenarios.filter((s) => s.class === 'CLASS_I').length;
    const class2Count = dev.scenarios.filter((s) => s.class === 'CLASS_II').length;

    expect(benignCount).toBe(40);
    expect(class1Count).toBe(30);
    expect(class2Count).toBe(50);

    // Verify held-out families are strictly absent
    const hasHoldout1 = dev.scenarios.some((s) => s.family === 'II-HOLDOUT-1');
    const hasHoldout2 = dev.scenarios.some((s) => s.family === 'II-HOLDOUT-2');
    expect(hasHoldout1).toBe(false);
    expect(hasHoldout2).toBe(false);

    // Deterministic hash check
    const hash1 = computeCorpusHash(dev);
    const hash2 = computeCorpusHash(dev);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('builds eval corpus with exact counts per plan §6.4 (P5-T07)', () => {
    const evalCorpus = buildEvalCorpus('corpus-v1');
    expect(evalCorpus.split).toBe('eval');
    expect(evalCorpus.scenarios.length).toBe(390);

    const benignCount = evalCorpus.scenarios.filter((s) => s.class === 'BENIGN').length;
    const class1Count = evalCorpus.scenarios.filter((s) => s.class === 'CLASS_I').length;
    const class2Count = evalCorpus.scenarios.filter((s) => s.class === 'CLASS_II').length;

    expect(benignCount).toBe(120);
    expect(class1Count).toBe(60);
    expect(class2Count).toBe(210); // 150 in-distribution + 60 held-out

    const holdout1Count = evalCorpus.scenarios.filter((s) => s.family === 'II-HOLDOUT-1').length;
    const holdout2Count = evalCorpus.scenarios.filter((s) => s.family === 'II-HOLDOUT-2').length;
    expect(holdout1Count).toBe(30);
    expect(holdout2Count).toBe(30);

    const hash = computeCorpusHash(evalCorpus);
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('changing any scenario changes the corpusHash', () => {
    const corpus1 = buildDevCorpus('corpus-v1');
    const hash1 = computeCorpusHash(corpus1);

    const corpus2 = buildDevCorpus('corpus-v1');
    corpus2.scenarios[0].lossIfWrong += 1;
    const hash2 = computeCorpusHash(corpus2);

    expect(hash1).not.toBe(hash2);
  });

  it('writes dev corpus to scenarios/dev directory (P5-T06)', () => {
    const dev = buildDevCorpus('corpus-v1');
    const { corpusPath, count } = writeCorpusToDisk(dev, path.resolve(process.cwd(), '../scenarios/dev'));
    expect(count).toBe(120);
    expect(fs.existsSync(corpusPath)).toBe(true);

    const loadedRaw = fs.readFileSync(corpusPath, 'utf8');
    const loaded = JSON.parse(loadedRaw);
    expect(loaded.scenarios.length).toBe(120);
    expect(loaded.split).toBe('dev');
  });
});
