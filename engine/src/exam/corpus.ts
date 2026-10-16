import fs from 'node:fs';
import path from 'node:path';
import { type Hex } from 'viem';
import { Scenario } from '../types/models.js';
import { generateScenario } from './generator.js';
import { canonicalize, hashCanonicalJson } from '../evidence/canonical.js';

export interface CorpusComposition {
  generatorVersion: string;
  perFamilyCounts: Record<string, number>;
  totalScenarios: number;
}

export interface Corpus {
  corpusVersion: string;
  split: 'dev' | 'eval';
  composition: CorpusComposition;
  scenarios: Scenario[];
}

export const IN_DISTRIBUTION_CLASS_II = [
  'II-INJECT',
  'II-UNIT',
  'II-OVERBILL',
  'II-NEARDUP',
  'II-COMPROMISED-VENDOR',
] as const;

export const CLASS_I_FAMILIES = [
  'I-PAYEE',
  'I-BANKCHANGE',
  'I-DUP',
  'I-SPLIT',
  'I-TOOL',
  'I-STALE',
] as const;

export const BENIGN_FAMILIES = [
  'BEN-STD',
  'BEN-PARTIAL',
  'BEN-NOISY',
] as const;

export const HELD_OUT_FAMILIES = [
  'II-HOLDOUT-1',
  'II-HOLDOUT-2',
] as const;

/**
 * Computes canonical keccak256 hash of a corpus per plan §6.4.
 */
export function computeCorpusHash(corpus: Corpus): Hex {
  return hashCanonicalJson(corpus, 'keccak256');
}

/**
 * Generates the Dev corpus (P5-T06):
 * 40 benign, 30 Class I, 50 Class II (in-distribution only), corpusVersion = "corpus-v1".
 */
export function buildDevCorpus(corpusVersion = 'corpus-v1'): Corpus {
  const scenarios: Scenario[] = [];
  const perFamilyCounts: Record<string, number> = {};

  // 40 Benign: BEN-STD (14), BEN-PARTIAL (13), BEN-NOISY (13)
  const benignDist: Record<string, number> = {
    'BEN-STD': 14,
    'BEN-PARTIAL': 13,
    'BEN-NOISY': 13,
  };
  for (const [family, count] of Object.entries(benignDist)) {
    perFamilyCounts[family] = count;
    for (let i = 0; i < count; i++) {
      scenarios.push(generateScenario(corpusVersion, 'dev', family, i));
    }
  }

  // 30 Class I: 5 per family across 6 families
  for (const family of CLASS_I_FAMILIES) {
    perFamilyCounts[family] = 5;
    for (let i = 0; i < 5; i++) {
      scenarios.push(generateScenario(corpusVersion, 'dev', family, i));
    }
  }

  // 50 Class II: 10 per family across 5 in-distribution families
  for (const family of IN_DISTRIBUTION_CLASS_II) {
    perFamilyCounts[family] = 10;
    for (let i = 0; i < 10; i++) {
      scenarios.push(generateScenario(corpusVersion, 'dev', family, i));
    }
  }

  const composition: CorpusComposition = {
    generatorVersion: 'generator@1',
    perFamilyCounts,
    totalScenarios: scenarios.length,
  };

  return {
    corpusVersion,
    split: 'dev',
    composition,
    scenarios,
  };
}

/**
 * Generates the Eval corpus (P5-T07):
 * 120 benign, 60 Class I (10/fam), 150 Class II (30/fam), 60 held-out (30/fam). Total = 390.
 */
export function buildEvalCorpus(corpusVersion = 'corpus-v1'): Corpus {
  const scenarios: Scenario[] = [];
  const perFamilyCounts: Record<string, number> = {};

  // 120 Benign: 40 per family
  for (const family of BENIGN_FAMILIES) {
    perFamilyCounts[family] = 40;
    for (let i = 0; i < 40; i++) {
      scenarios.push(generateScenario(corpusVersion, 'eval', family, i));
    }
  }

  // 60 Class I: 10 per family
  for (const family of CLASS_I_FAMILIES) {
    perFamilyCounts[family] = 10;
    for (let i = 0; i < 10; i++) {
      scenarios.push(generateScenario(corpusVersion, 'eval', family, i));
    }
  }

  // 150 Class II (in-distribution): 30 per family
  for (const family of IN_DISTRIBUTION_CLASS_II) {
    perFamilyCounts[family] = 30;
    for (let i = 0; i < 30; i++) {
      scenarios.push(generateScenario(corpusVersion, 'eval', family, i));
    }
  }

  // 60 Class II (held-out): 30 per family
  for (const family of HELD_OUT_FAMILIES) {
    perFamilyCounts[family] = 30;
    for (let i = 0; i < 30; i++) {
      scenarios.push(generateScenario(corpusVersion, 'eval', family, i));
    }
  }

  const composition: CorpusComposition = {
    generatorVersion: 'generator@1',
    perFamilyCounts,
    totalScenarios: scenarios.length,
  };

  return {
    corpusVersion,
    split: 'eval',
    composition,
    scenarios,
  };
}

/**
 * Writes a corpus and all individual scenarios to disk (P5-T06).
 */
export function writeCorpusToDisk(corpus: Corpus, outDir: string): { corpusPath: string; count: number } {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const corpusPath = path.join(outDir, 'corpus.json');
  fs.writeFileSync(corpusPath, canonicalize(corpus), 'utf8');

  for (const s of corpus.scenarios) {
    const sPath = path.join(outDir, `${s.id}.json`);
    fs.writeFileSync(sPath, canonicalize(s), 'utf8');
  }

  return { corpusPath, count: corpus.scenarios.length };
}
