import { describe, it, expect } from 'vitest';
import { parseAmount, formatAmount } from '../src/types/money.js';
import {
  normalizeInvoiceNumber,
  computeVendorIdHash,
  computeInvoiceKey,
  computeMemoHash,
} from '../src/types/invoiceKey.js';

describe('money utilities (P3-T02)', () => {
  it('parses valid whole and fractional amounts into base units', () => {
    expect(parseAmount('150')).toBe(150_000_000n);
    expect(parseAmount('150.5')).toBe(150_500_000n);
    expect(parseAmount('150.50')).toBe(150_500_000n);
    expect(parseAmount('0.000001')).toBe(1n);
    expect(parseAmount('0.1')).toBe(100_000n);
    expect(parseAmount('0')).toBe(0n);
    expect(parseAmount('1000000')).toBe(1_000_000_000_000n);
  });

  it('formats bigint base units to decimal string', () => {
    expect(formatAmount(150_000_000n)).toBe('150');
    expect(formatAmount(150_500_000n)).toBe('150.5');
    expect(formatAmount(1n)).toBe('0.000001');
    expect(formatAmount(0n)).toBe('0');
  });

  it('rejects invalid amounts: negatives, floats with >6 decimals, scientific notation, empty', () => {
    expect(() => parseAmount('-10')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('1e3')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('1E6')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('10.1234567')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('')).toThrow(/Amount cannot be empty/);
    expect(() => parseAmount('   ')).toThrow(/Amount cannot be empty/);
    expect(() => parseAmount('abc')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('10.2.3')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('NaN')).toThrow(/Invalid amount format/);
    expect(() => parseAmount('Infinity')).toThrow(/Invalid amount format/);
  });
});

describe('invoice normalization table (P3-T02, PV-13)', () => {
  const table = [
    { input: 'INV-001', expected: 'INV1' },
    { input: 'inv 1', expected: 'INV1' },
    { input: 'INV_001', expected: 'INV1' },
    { input: 'inv/001', expected: 'INV1' },
    { input: 'inv.001', expected: 'INV1' },
    { input: 'INV#001', expected: 'INV1' },
    { input: 'INV000', expected: 'INV0' },
    { input: 'INV-000', expected: 'INV0' },
    { input: 'inv 000', expected: 'INV0' },
    { input: '00123', expected: '123' },
    { input: '000', expected: '0' },
    { input: '0', expected: '0' },
    { input: 'INV-100', expected: 'INV100' },
    { input: 'PO#42/A-007', expected: 'PO42A7' },
    { input: 'ABC', expected: 'ABC' },
    { input: '  inv - 42  ', expected: 'INV42' },
  ];

  for (const { input, expected } of table) {
    it(`normalizes "${input}" -> "${expected}"`, () => {
      expect(normalizeInvoiceNumber(input)).toBe(expected);
    });
  }

  it('ensures colliding variants produce identical invoiceKey', () => {
    const vendorHash = computeVendorIdHash('vendor-acme');
    const key1 = computeInvoiceKey(vendorHash, 'INV-001');
    const key2 = computeInvoiceKey(vendorHash, 'inv 1');
    const key3 = computeInvoiceKey(vendorHash, 'INV_001');
    const key4 = computeInvoiceKey(vendorHash, 'inv.001');

    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
    expect(key3).toBe(key4);
    expect(key1).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('computes vendorIdHash and memoHash deterministically', () => {
    const vHash = computeVendorIdHash('vendor-1');
    expect(vHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

    const mHash = computeMemoHash('prop-123');
    expect(mHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });
});
