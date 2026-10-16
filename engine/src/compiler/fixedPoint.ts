/**
 * Fixed-point arithmetic utilities for deterministic compiler execution.
 * Spec: plan §7, PHASES PV-14.
 */

export const SCALE_1E9 = 1_000_000_000n; // 1e9 scale for probabilities
export const TEN_WHOLE_USDC = 10_000_000n; // 10 USDC in 6-decimal micro-USDC base units

/**
 * Parses a decimal string (up to 9 decimal places) into a bigint scaled by 1e9.
 */
export function parseFixed9(str: string): bigint {
  const trimmed = str.trim();
  const parts = trimmed.split('.');
  const whole = BigInt(parts[0]);
  let fraction = 0n;

  if (parts.length === 2) {
    const fracStr = parts[1].padEnd(9, '0').slice(0, 9);
    fraction = BigInt(fracStr);
  }

  return whole * SCALE_1E9 + fraction;
}

/**
 * Floors an amount in micro-USDC (6 decimals) to a multiple of 10 whole USDC (10_000_000 base units).
 * Spec: PV-14.
 */
export function floorTo10(amountBaseUnits: bigint): bigint {
  if (amountBaseUnits <= 0n) {
    return 0n;
  }
  return (amountBaseUnits / TEN_WHOLE_USDC) * TEN_WHOLE_USDC;
}
