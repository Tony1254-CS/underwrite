import { describe, it, expect } from 'vitest';
import { DeterministicPrng } from '../src/exam/prng.js';
import { generateScenario } from '../src/exam/generator.js';
import { ScenarioSchema } from '../src/types/models.js';

describe('DeterministicPrng (DEC-012, PV-15)', () => {
  it('derives scenario seed deterministically per PV-15', () => {
    const seed1 = DeterministicPrng.deriveScenarioSeed('corpus-v1', 'dev', 'BEN-STD', 0);
    const seed2 = DeterministicPrng.deriveScenarioSeed('corpus-v1', 'dev', 'BEN-STD', 0);
    expect(seed1).toBe(seed2);
    expect(seed1).toMatch(/^0x[0-9a-f]{64}$/);

    const seedDiff = DeterministicPrng.deriveScenarioSeed('corpus-v1', 'dev', 'BEN-STD', 1);
    expect(seed1).not.toBe(seedDiff);
  });

  it('generates identical sequence from the same seed', () => {
    const seed = '0x1111111111111111111111111111111111111111111111111111111111111111' as const;
    const prng1 = new DeterministicPrng(seed);
    const prng2 = new DeterministicPrng(seed);

    for (let i = 0; i < 20; i++) {
      expect(prng1.nextUint32()).toBe(prng2.nextUint32());
    }
  });

  it('nextInt generates values in bounded range inclusive', () => {
    const seed = '0x2222222222222222222222222222222222222222222222222222222222222222' as const;
    const prng = new DeterministicPrng(seed);

    for (let i = 0; i < 100; i++) {
      const val = prng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });
});

describe('Scenario Generator & Families (P5-T03, P5-T04)', () => {
  const ALL_FAMILIES = [
    // Benign
    'BEN-STD',
    'BEN-PARTIAL',
    'BEN-NOISY',
    // Class I
    'I-PAYEE',
    'I-BANKCHANGE',
    'I-DUP',
    'I-SPLIT',
    'I-TOOL',
    'I-STALE',
    // Class II
    'II-INJECT',
    'II-UNIT',
    'II-OVERBILL',
    'II-NEARDUP',
    'II-COMPROMISED-VENDOR',
    'II-HOLDOUT-1',
  ];

  it('generates valid scenarios for every family matching ScenarioSchema', () => {
    for (const family of ALL_FAMILIES) {
      const scenario = generateScenario('corpus-v1', 'dev', family, 0);
      const parsed = ScenarioSchema.safeParse(scenario);
      expect(parsed.success, `Family ${family} failed schema parse`).toBe(true);

      if (family.startsWith('BEN-')) {
        expect(scenario.class).toBe('BENIGN');
        expect(scenario.expected[0].kind).toBe('PAY');
        expect(scenario.lossIfWrong).toBe(0);
      } else if (family.startsWith('I-')) {
        expect(scenario.class).toBe('CLASS_I');
        expect(scenario.expected[0].kind).toBe('NO_PAY');
        expect(scenario.lossIfWrong).toBeGreaterThan(0);
      } else if (family.startsWith('II-')) {
        expect(scenario.class).toBe('CLASS_II');
        expect(scenario.expected[0].kind).toBe('NO_PAY');
        expect(scenario.lossIfWrong).toBeGreaterThan(0);
      }
    }
  });

  it('guarantees identical scenario across runs with same seed (P5-T03)', () => {
    const s1 = generateScenario('corpus-v1', 'dev', 'BEN-STD', 42);
    const s2 = generateScenario('corpus-v1', 'dev', 'BEN-STD', 42);
    expect(s1).toEqual(s2);
  });
});
