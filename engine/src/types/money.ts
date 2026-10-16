import { z } from 'zod';

const MONEY_REGEX = /^\d+(\.\d{1,6})?$/;

/**
 * Parses a decimal string representation of USDC into base units (6 decimals).
 * Rejects negative numbers, scientific notation ('1e3'), more than 6 decimal places,
 * empty strings, non-numeric characters, and invalid float representations.
 *
 * @param str String representation of amount in whole USDC (e.g. "150", "150.50", "0.000001")
 * @returns bigint in 6 decimal base units (e.g. 150000000n, 150500000n, 1n)
 */
export function parseAmount(str: string): bigint {
  if (typeof str !== 'string') {
    throw new Error('Amount must be a string');
  }

  const trimmed = str.trim();
  if (!trimmed) {
    throw new Error('Amount cannot be empty');
  }

  if (!MONEY_REGEX.test(trimmed)) {
    throw new Error(`Invalid amount format: "${str}". Must be non-negative with at most 6 decimal places.`);
  }

  const parts = trimmed.split('.');
  const wholePart = BigInt(parts[0]);
  let fractionalPart = 0n;

  if (parts.length === 2) {
    const fractionStr = parts[1].padEnd(6, '0');
    fractionalPart = BigInt(fractionStr);
  }

  return wholePart * 1_000_000n + fractionalPart;
}

/**
 * Formats bigint base units (6 decimals) into a standard decimal string.
 */
export function formatAmount(amount: bigint): string {
  if (amount < 0n) {
    throw new Error('Negative amount cannot be formatted');
  }
  const whole = amount / 1_000_000n;
  const fraction = amount % 1_000_000n;
  if (fraction === 0n) {
    return whole.toString();
  }
  const fracStr = fraction.toString().padStart(6, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

/**
 * Zod schema for amounts: accepts bigint directly or parses valid decimal string to bigint base units.
 */
export const AmountSchema = z.union([
  z.bigint().nonnegative(),
  z.string().transform((val, ctx) => {
    try {
      return parseAmount(val);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid amount';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
      return z.NEVER;
    }
  }),
]);
