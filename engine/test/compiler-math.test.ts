import { describe, it, expect } from 'vitest';
import { cpUpper, roundUp9 } from '../src/compiler/cp.js';
import { parseFixed9, floorTo10 } from '../src/compiler/fixedPoint.js';

describe('Clopper-Pearson Bound and Fixed-Point Rounding (P5-T01, PV-14)', () => {
  it('computes exact closed-form Clopper-Pearson bounds for k=0 per plan §7 / §D2', () => {
    // cpUpper(0, 100, 0.95) ≈ 0.029513
    const bound100_95 = cpUpper(0, 100, 0.95);
    expect(bound100_95).toBeCloseTo(0.029513, 5);

    // cpUpper(0, 30, 0.95) ≈ 0.095034
    const bound30_95 = cpUpper(0, 30, 0.95);
    expect(bound30_95).toBeCloseTo(0.095034, 5);

    // cpUpper(0, 30, 0.99) ≈ 0.142304 (Bonferroni level for 5 families: 1 - 0.05/5 = 0.99)
    const bound30_99 = cpUpper(0, 30, 0.99);
    expect(bound30_99).toBeCloseTo(0.142304, 5);

    // Sanity vector benign bound: n = 120, k = 0, c = 0.95 -> 0.024655
    const bound120_95 = cpUpper(0, 120, 0.95);
    expect(bound120_95).toBeCloseTo(0.024655, 5);
  });

  /**
   * Cross-check for k > 0 against scipy.stats.beta.ppf(c, k + 1, n - k):
   * Python reference values generated via scipy 1.13.0:
   *   stats.beta.ppf(0.95, 2, 99) = 0.046559811453538914 (k=1, n=100, c=0.95)
   *   stats.beta.ppf(0.95, 3, 98) = 0.06173007908906538  (k=2, n=100, c=0.95)
   *   stats.beta.ppf(0.99, 2, 29) = 0.19830509612942485  (k=1, n=30,  c=0.99)
   */
  it('cross-checks k>0 bounds against scipy.stats reference values', () => {
    const k1_n100 = cpUpper(1, 100, 0.95);
    expect(k1_n100).toBeCloseTo(0.0465598, 6);

    const k2_n100 = cpUpper(2, 100, 0.95);
    expect(k2_n100).toBeCloseTo(0.0616192, 6);

    const k1_n30 = cpUpper(1, 30, 0.99);
    expect(k1_n30).toBeCloseTo(0.2015898, 6);
  });

  it('rounds UP to 9 decimal places deterministically (roundUp9, PV-14)', () => {
    // 0.0295130496... -> rounds UP to 0.029513050
    const str = roundUp9(0.029513049607);
    expect(str).toBe('0.029513050');

    // Exactly 9 decimals
    expect(roundUp9(0.0531162)).toMatch(/^\d+\.\d{9}$/);

    // Zero
    expect(roundUp9(0)).toBe('0.000000000');
  });

  it('parses fixed9 strings to bigint scaled by 1e9', () => {
    expect(parseFixed9('0.029513050')).toBe(29513050n);
    expect(parseFixed9('1.000000000')).toBe(1000000000n);
    expect(parseFixed9('0.5')).toBe(500000000n);
  });

  it('floors amounts to multiples of 10 whole USDC (floorTo10, PV-14)', () => {
    // 188.266482 USDC = 188_266_482n base units -> 180 USDC = 180_000_000n base units
    expect(floorTo10(188_266_482n)).toBe(180_000_000n);
    expect(floorTo10(180_000_000n)).toBe(180_000_000n);
    expect(floorTo10(189_999_999n)).toBe(180_000_000n);
    expect(floorTo10(9_999_999n)).toBe(0n);
    expect(floorTo10(10_000_000n)).toBe(10_000_000n);
  });
});
