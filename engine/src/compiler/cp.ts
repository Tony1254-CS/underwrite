/**
 * Clopper-Pearson exact one-sided confidence upper bound and fixed-point formatting.
 * Spec: plan §7, PHASES PV-14.
 */

/**
 * Evaluates the cumulative distribution function (CDF) of Binomial(n, p) at k:
 * P(X <= k) = sum_{j=0}^k C(n, j) * p^j * (1 - p)^(n - j)
 */
export function binomialCdf(n: number, k: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  if (p <= 0) return 1;
  if (p >= 1) return 0;

  let term = Math.pow(1 - p, n);
  let sum = term;

  for (let j = 1; j <= k; j++) {
    term = term * ((n - j + 1) / j) * (p / (1 - p));
    sum += term;
  }

  return Math.min(1, Math.max(0, sum));
}

/**
 * Computes exact one-sided Clopper-Pearson upper bound at confidence level c.
 * - Closed form when k = 0: 1 - (1 - c)^(1 / n)
 * - Exact root-finding (bisection on binomial CDF) when k > 0.
 *
 * @param k Number of observed failures
 * @param n Sample size (number of trials)
 * @param c Confidence level in (0, 1), e.g. 0.95 or 0.99
 * @returns Upper bound probability in [0, 1]
 */
export function cpUpper(k: number, n: number, c: number): number {
  if (n <= 0) {
    throw new Error(`Sample size n must be positive, got ${n}`);
  }
  if (k < 0 || k > n) {
    throw new Error(`Failures k must be in [0, n], got k=${k}, n=${n}`);
  }
  if (c <= 0 || c >= 1) {
    throw new Error(`Confidence level c must be in (0, 1), got ${c}`);
  }

  // Exact closed form for k = 0
  if (k === 0) {
    return 1 - Math.pow(1 - c, 1 / n);
  }

  // All failures: upper bound is 1.0
  if (k === n) {
    return 1.0;
  }

  // Exact bisection: BinomialCDF(n, k, p) is strictly decreasing in p.
  // We seek p such that BinomialCDF(n, k, p) = 1 - c.
  let low = 0;
  let high = 1;
  const target = 1 - c;

  for (let i = 0; i < 70; i++) {
    const mid = (low + high) / 2;
    if (binomialCdf(n, k, mid) > target) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Rounds UP a float to 9 decimal places and formats as a standard decimal string (PV-14).
 * Prevents precision drift across platforms and languages.
 */
export function roundUp9(x: number): string {
  if (x < 0) {
    throw new Error(`roundUp9 expects non-negative value, got ${x}`);
  }
  if (x === 0) {
    return '0.000000000';
  }

  // Scale by 1e9, round up (ceil), and convert back to fixed 9 decimal places
  const scaled = Math.ceil(Number((x * 1e9).toFixed(6)));
  const intPart = Math.floor(scaled / 1e9);
  const fracPart = (scaled % 1e9).toString().padStart(9, '0');

  return `${intPart}.${fracPart}`;
}
