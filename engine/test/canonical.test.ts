import { describe, it, expect } from 'vitest';
import {
  canonicalize,
  hashCanonicalJson,
  hashNormalizedText,
  normalizeCrlf,
} from '../src/evidence/canonical.js';

describe('Canonical JSON and hashing utilities (P3-T03)', () => {
  it('guarantees key order independence', () => {
    const objA = { b: 2, a: 1, c: { z: 'foo', y: 'bar' } };
    const objB = { c: { y: 'bar', z: 'foo' }, a: 1, b: 2 };

    const canonA = canonicalize(objA);
    const canonB = canonicalize(objB);

    expect(canonA).toBe(canonB);
    expect(canonA).toBe('{"a":1,"b":2,"c":{"y":"bar","z":"foo"}}');

    const hashA = hashCanonicalJson(objA);
    const hashB = hashCanonicalJson(objB);
    expect(hashA).toBe(hashB);
  });

  it('handles bigint values by serializing as decimal strings (PV-14)', () => {
    const data = {
      amount: 150_000_000n,
      nested: {
        cap: 500_000_000n,
        list: [1n, 2n, 3n],
      },
    };

    const canon = canonicalize(data);
    expect(canon).toBe('{"amount":"150000000","nested":{"cap":"500000000","list":["1","2","3"]}}');

    const hash = hashCanonicalJson(data);
    expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('normalizes CRLF to LF and produces identical hashes', () => {
    const textLf = 'line 1\nline 2\nline 3\n';
    const textCrlf = 'line 1\r\nline 2\r\nline 3\r\n';

    expect(normalizeCrlf(textCrlf)).toBe(textLf);

    const hashLf = hashNormalizedText(textLf, 'sha256');
    const hashCrlf = hashNormalizedText(textCrlf, 'sha256');

    expect(hashLf).toBe(hashCrlf);
    expect(hashLf).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const keccakLf = hashNormalizedText(textLf, 'keccak256');
    const keccakCrlf = hashNormalizedText(textCrlf, 'keccak256');
    expect(keccakLf).toBe(keccakCrlf);
  });
});
