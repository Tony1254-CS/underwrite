/**
 * Formatting helpers for Underwrite UI.
 * USDC base units: 1 USDC = 10^6 units (6 decimals).
 */

export function formatUSDC(baseUnits: string | bigint | number | undefined | null): string {
  if (baseUnits === undefined || baseUnits === null) return "$0.00";
  try {
    const b = BigInt(baseUnits.toString());
    const isNegative = b < 0n;
    const abs = isNegative ? -b : b;
    const whole = abs / 1000000n;
    const fraction = abs % 1000000n;
    const fractionStr = fraction.toString().padStart(6, "0").slice(0, 2);
    const wholeFormatted = whole.toLocaleString("en-US");
    return `${isNegative ? "-" : ""}$${wholeFormatted}.${fractionStr}`;
  } catch {
    return "$0.00";
  }
}

export function formatNumber(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "0";
  try {
    const n = Number(val);
    return isNaN(n) ? "0" : n.toLocaleString("en-US");
  } catch {
    return "0";
  }
}

export function formatPercent(rateStr: string | number | undefined | null): string {
  if (rateStr === undefined || rateStr === null) return "0.0%";
  try {
    const n = Number(rateStr);
    if (isNaN(n)) return "0.0%";
    return `${(n * 100).toFixed(1)}%`;
  } catch {
    return "0.0%";
  }
}

export function formatTimestamp(ts: string | number | undefined | null): string {
  if (!ts) return "N/A";
  try {
    let num = Number(ts);
    if (isNaN(num) || num <= 0) return "N/A";
    // Check if seconds vs milliseconds
    if (num < 10000000000) {
      num *= 1000;
    }
    const d = new Date(num);
    return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  } catch {
    return "N/A";
  }
}

export function truncateHash(hash: string | undefined | null, start = 8, end = 6): string {
  if (!hash) return "";
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
