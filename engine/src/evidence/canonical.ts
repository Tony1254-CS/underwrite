import { keccak256, sha256, stringToBytes, type Hex } from 'viem';

/**
 * Normalizes text by replacing CRLF with LF.
 */
export function normalizeCrlf(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

/**
 * Recursively prepares an object for JCS serialization:
 * - Converts all bigint values to decimal strings per PV-14.
 */
export function prepareForCanonicalization(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(prepareForCanonicalization);
  }
  if (typeof value === 'object') {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        res[k] = prepareForCanonicalization(v);
      }
    }
    return res;
  }
  return value;
}

/**
 * Pure RFC 8785 JSON Canonicalization Scheme (JCS) implementation.
 * Guarantees:
 * 1. Whitespace removed.
 * 2. Object keys sorted lexicographically by UTF-16 code units.
 * 3. Consistent IEEE 754 number formatting.
 * 4. BigInt values serialized as decimal strings (per PV-14).
 */
export function canonicalize(value: unknown): string {
  const prepared = prepareForCanonicalization(value);
  return _serializeJcs(prepared);
}

function _serializeJcs(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'string') return JSON.stringify(val);
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new Error(`Cannot canonicalize non-finite number: ${val}`);
    }
    return val.toString();
  }
  if (Array.isArray(val)) {
    return '[' + val.map(_serializeJcs).join(',') + ']';
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val as Record<string, unknown>).sort();
    const parts = keys.map(
      (k) => `${JSON.stringify(k)}:${_serializeJcs((val as Record<string, unknown>)[k])}`
    );
    return '{' + parts.join(',') + '}';
  }
  throw new Error(`Unsupported value type for JCS: ${typeof val}`);
}

/**
 * Computes sha256 over string or byte input, returning 0x hex string.
 */
export function sha256Hex(data: string | Uint8Array): Hex {
  const bytes = typeof data === 'string' ? stringToBytes(data) : data;
  return sha256(bytes);
}

/**
 * Computes keccak256 over string or byte input, returning 0x hex string.
 */
export function keccak256Hex(data: string | Uint8Array): Hex {
  const bytes = typeof data === 'string' ? stringToBytes(data) : data;
  return keccak256(bytes);
}

/**
 * Hashes a document/object using canonical JSON representation (JCS).
 */
export function hashCanonicalJson(
  value: unknown,
  algorithm: 'keccak256' | 'sha256' = 'keccak256'
): Hex {
  const canonicalStr = canonicalize(value);
  return algorithm === 'sha256' ? sha256Hex(canonicalStr) : keccak256Hex(canonicalStr);
}

/**
 * Hashes text after normalizing CRLF to LF.
 */
export function hashNormalizedText(
  text: string,
  algorithm: 'keccak256' | 'sha256' = 'sha256'
): Hex {
  const normalized = normalizeCrlf(text);
  return algorithm === 'sha256' ? sha256Hex(normalized) : keccak256Hex(normalized);
}
