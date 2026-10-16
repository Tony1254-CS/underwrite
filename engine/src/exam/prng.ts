import { keccak256, stringToBytes, type Hex } from 'viem';

/**
 * Deterministic PRNG using keccak256 counter per DEC-012 and PV-15.
 * Guarantees bit-identical random sequences across all platforms.
 */
export class DeterministicPrng {
  private counter = 0;

  constructor(public readonly seed: Hex) {}

  /**
   * Derives a scenario seed per PV-15:
   * scenarioSeed = keccak256(utf8(corpusVersion + "|" + split + "|" + family + "|" + idx))
   */
  public static deriveScenarioSeed(
    corpusVersion: string,
    split: string,
    family: string,
    idx: number
  ): Hex {
    const raw = `${corpusVersion}|${split}|${family}|${idx}`;
    return keccak256(stringToBytes(raw));
  }

  /**
   * Generates a 32-bit unsigned integer uniformly in [0, 2^32 - 1].
   */
  public nextUint32(): number {
    this.counter++;
    const input = `${this.seed}:${this.counter}`;
    const hash = keccak256(stringToBytes(input));
    // Read first 8 hex characters as 32-bit unsigned integer
    return parseInt(hash.slice(2, 10), 16);
  }

  /**
   * Returns a float uniformly distributed in [0, 1).
   */
  public nextFloat(): number {
    return this.nextUint32() / 0x100000000;
  }

  /**
   * Returns an integer uniformly distributed in [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    if (min > max) {
      throw new Error(`min (${min}) must be <= max (${max})`);
    }
    const range = max - min + 1;
    return min + (this.nextUint32() % range);
  }

  /**
   * Picks a random element from an array.
   */
  public pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = this.nextUint32() % items.length;
    return items[idx];
  }

  /**
   * Generates a log-uniform integer in [min, max] (e.g. 20 to 800 USDC).
   */
  public logUniform(min: number, max: number): number {
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const u = this.nextFloat();
    return Math.round(Math.exp(logMin + u * (logMax - logMin)));
  }
}
