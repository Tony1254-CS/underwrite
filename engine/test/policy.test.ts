import { describe, it, expect, beforeEach } from 'vitest';
import { evaluatePolicy } from '../src/policy/engine.js';
import { PolicySnapshot } from '../src/policy/snapshot.js';
import { VendorRegistry } from '../src/mandate/vendorRegistry.js';
import { computeInvoiceKey, computeVendorIdHash } from '../src/types/invoiceKey.js';
import { Proposal, PurchaseOrder } from '../src/types/models.js';

describe('Policy Engine Decision Table (P3-T06, ≥30 cases)', () => {
  let registry: VendorRegistry;
  let baseSnapshot: PolicySnapshot;
  let defaultProposal: Proposal;

  beforeEach(() => {
    registry = new VendorRegistry([
      {
        vendorId: 'vendor-acme',
        name: 'Acme Hardware',
        payoutAddress: '0x1111111111111111111111111111111111111111',
        perWindowCap: 500_000_000n, // 500 USDC
        active: true,
        activatesAt: 0,
      },
      {
        vendorId: 'vendor-cooling',
        name: 'Cooling Vendor',
        payoutAddress: '0x2222222222222222222222222222222222222222',
        perWindowCap: 500_000_000n,
        active: true,
        activatesAt: 2000, // In cooldown if currentTimestamp < 2000
      },
      {
        vendorId: 'vendor-inactive',
        name: 'Inactive Vendor',
        payoutAddress: '0x3333333333333333333333333333333333333333',
        perWindowCap: 500_000_000n,
        active: false,
        activatesAt: 0,
      },
    ]);

    const pos = new Map<string, PurchaseOrder>();
    pos.set('PO-100', {
      poNumber: 'PO-100',
      vendorId: 'vendor-acme',
      amount: 1000_000_000n,
      remaining: 500_000_000n,
      status: 'OPEN',
    });
    pos.set('PO-CLOSED', {
      poNumber: 'PO-CLOSED',
      vendorId: 'vendor-acme',
      amount: 1000_000_000n,
      remaining: 500_000_000n,
      status: 'CLOSED',
    });

    baseSnapshot = {
      currentTimestamp: 1000,
      paused: false,
      configDrift: false,
      vaultBalance: 5000_000_000n,
      reserveFloor: 500_000_000n,
      bondRemaining: 2000_000_000n,
      exposure: 0n,
      qualification: {
        active: true,
        revoked: false,
        expired: false,
        t1MaxPerTx: 180_000_000n, // 180 USDC
        t1MaxPerWindow: 500_000_000n, // 500 USDC
        t2MaxPerTx: 2000_000_000n, // 2000 USDC
        t2Allowed: true,
      },
      qualWindowSpent: 0n,
      recipientWindowSpent: 0n,
      paidInvoiceKeys: new Set(),
      reservedInvoiceKeys: new Set(),
      purchaseOrders: pos,
      recentPayments: [],
      registry,
    };

    defaultProposal = {
      proposalId: 'prop-1',
      vendorId: 'vendor-acme',
      invoiceNumber: 'INV-001',
      amount: 100_000_000n, // 100 USDC
      poNumber: 'PO-100',
      rationale: 'Standard hardware delivery',
      sourceDocIds: ['doc-1'],
    };
  });

  // --- T1 Cases ---
  it('Case 01: Happy path T1 with valid open PO', () => {
    const decision = evaluatePolicy(defaultProposal, baseSnapshot);
    expect(decision.tier).toBe('T1');
    expect(decision.reasons).toEqual([]);
    expect(decision.recipient).toBe('0x1111111111111111111111111111111111111111');
  });

  it('Case 02: Happy path T1 without PO', () => {
    const prop = { ...defaultProposal, poNumber: undefined };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('T1');
    expect(decision.reasons).toEqual([]);
  });

  it('Case 03: T1 exactly at t1MaxPerTx limit', () => {
    const prop = { ...defaultProposal, amount: 180_000_000n };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('T1');
  });

  it('Case 04: T1 exactly at t1MaxPerWindow limit', () => {
    const snapshot = { ...baseSnapshot, qualWindowSpent: 400_000_000n };
    const prop = { ...defaultProposal, amount: 100_000_000n };
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('T1');
  });

  // --- T2 Escalation Cases ---
  it('Case 05: T2 on exceeds T1 per-tx (<= t2MaxPerTx)', () => {
    const prop = { ...defaultProposal, amount: 250_000_000n }; // > 180
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('EXCEEDS_T1_PER_TX');
  });

  it('Case 06: T2 on exceeds T1 window', () => {
    const snapshot = { ...baseSnapshot, qualWindowSpent: 450_000_000n };
    const prop = { ...defaultProposal, amount: 100_000_000n }; // 450 + 100 = 550 > 500
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('EXCEEDS_T1_WINDOW');
  });

  it('Case 07: T2 on exceeds recipient window cap', () => {
    const snapshot = { ...baseSnapshot, recipientWindowSpent: 450_000_000n };
    const prop = { ...defaultProposal, amount: 100_000_000n }; // 450 + 100 = 550 > 500
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('EXCEEDS_RECIPIENT_WINDOW');
  });

  it('Case 08: T2 on insufficient backing (exposure + amount > bondRemaining)', () => {
    const snapshot = { ...baseSnapshot, exposure: 1950_000_000n, bondRemaining: 2000_000_000n };
    const prop = { ...defaultProposal, amount: 100_000_000n }; // 1950 + 100 = 2050 > 2000
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('INSUFFICIENT_BACKING');
  });

  it('Case 09: T2 on reserve floor breach', () => {
    // vaultBalance = 550, reserveFloor = 500, amount = 100 -> post balance = 450 < 500
    const snapshot = { ...baseSnapshot, vaultBalance: 550_000_000n, reserveFloor: 500_000_000n };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('RESERVE_BREACH');
  });

  it('Case 10: T2 on vault balance less than amount', () => {
    const snapshot = { ...baseSnapshot, vaultBalance: 50_000_000n }; // amount = 100
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('RESERVE_BREACH');
  });

  it('Case 11: T2 on vendor cooling down', () => {
    const prop = { ...defaultProposal, vendorId: 'vendor-cooling', poNumber: undefined };
    // currentTimestamp = 1000, activatesAt = 2000
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('VENDOR_COOLING_DOWN');
  });

  it('Case 12: T2 on near-duplicate invoice (PV-12)', () => {
    const vendorHash = computeVendorIdHash('vendor-acme');
    const oldKey = computeInvoiceKey(vendorHash, 'OLD-INV-999');

    const snapshot: PolicySnapshot = {
      ...baseSnapshot,
      recentPayments: [
        {
          vendorId: 'vendor-acme',
          amount: 100_000_000n,
          poNumber: 'PO-100',
          invoiceKey: oldKey,
          timestamp: 950, // 50 seconds ago (<= 30 days)
        },
      ],
    };

    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('NEAR_DUPLICATE');
  });

  it('Case 13: Multiple T2 reasons accumulated together', () => {
    const snapshot = {
      ...baseSnapshot,
      qualWindowSpent: 450_000_000n,
      exposure: 1950_000_000n,
      bondRemaining: 2000_000_000n,
    };
    const prop = { ...defaultProposal, amount: 200_000_000n }; // exceeds per-tx, window, backing
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('T2');
    expect(decision.reasons).toContain('EXCEEDS_T1_PER_TX');
    expect(decision.reasons).toContain('EXCEEDS_T1_WINDOW');
    expect(decision.reasons).toContain('INSUFFICIENT_BACKING');
  });

  it('Case 14: Near-duplicate older than 30 days does NOT trigger T2', () => {
    const vendorHash = computeVendorIdHash('vendor-acme');
    const oldKey = computeInvoiceKey(vendorHash, 'OLD-INV-999');

    const snapshot: PolicySnapshot = {
      ...baseSnapshot,
      currentTimestamp: 1000 + 31 * 86400,
      recentPayments: [
        {
          vendorId: 'vendor-acme',
          amount: 100_000_000n,
          poNumber: 'PO-100',
          invoiceKey: oldKey,
          timestamp: 1000, // 31 days ago
        },
      ],
    };

    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T1');
    expect(decision.reasons).toEqual([]);
  });

  // --- T3 Cases (Governance / Beyond Autonomous Limits) ---
  it('Case 15: T3 on paused vault', () => {
    const snapshot = { ...baseSnapshot, paused: true };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('PAUSED');
  });

  it('Case 16: T3 on configuration drift detected', () => {
    const snapshot = { ...baseSnapshot, configDrift: true };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('CONFIG_DRIFT');
  });

  it('Case 17: T3 on missing qualification', () => {
    const snapshot = { ...baseSnapshot, qualification: undefined };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('NO_ACTIVE_QUALIFICATION');
  });

  it('Case 18: T3 on inactive qualification', () => {
    const snapshot = {
      ...baseSnapshot,
      qualification: { ...baseSnapshot.qualification!, active: false },
    };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('NO_ACTIVE_QUALIFICATION');
  });

  it('Case 19: T3 on revoked qualification', () => {
    const snapshot = {
      ...baseSnapshot,
      qualification: { ...baseSnapshot.qualification!, revoked: true },
    };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('QUALIFICATION_REVOKED');
  });

  it('Case 20: T3 on expired qualification', () => {
    const snapshot = {
      ...baseSnapshot,
      qualification: { ...baseSnapshot.qualification!, expired: true },
    };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('QUALIFICATION_EXPIRED');
  });

  it('Case 21: T3 on amount exceeding t2MaxPerTx', () => {
    const prop = { ...defaultProposal, amount: 2500_000_000n }; // > 2000
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('EXCEEDS_T2_PER_TX');
  });

  it('Case 22: T3 when T1 limits exceeded and t2Allowed is false', () => {
    const snapshot: PolicySnapshot = {
      ...baseSnapshot,
      qualification: {
        ...baseSnapshot.qualification!,
        t2Allowed: false,
      },
    };
    const prop = { ...defaultProposal, amount: 250_000_000n }; // exceeds t1MaxPerTx
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('T3');
    expect(decision.reasons).toContain('EXCEEDS_T1_PER_TX');
    expect(decision.reasons).toContain('T2_NOT_ALLOWED');
  });

  // --- REJECT Cases ---
  it('Case 23: REJECT on unknown vendor', () => {
    const prop = { ...defaultProposal, vendorId: 'vendor-unknown', poNumber: undefined };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('VENDOR_UNKNOWN');
  });

  it('Case 24: REJECT on inactive vendor', () => {
    const prop = { ...defaultProposal, vendorId: 'vendor-inactive', poNumber: undefined };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('VENDOR_INACTIVE');
  });

  it('Case 25: REJECT on invalid amount (zero)', () => {
    const prop = { ...defaultProposal, amount: 0n };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('AMOUNT_INVALID');
  });

  it('Case 26: REJECT on PO not found', () => {
    const prop = { ...defaultProposal, poNumber: 'PO-NONEXISTENT' };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('PO_NOT_FOUND');
  });

  it('Case 27: REJECT on closed PO', () => {
    const prop = { ...defaultProposal, poNumber: 'PO-CLOSED' };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('PO_CLOSED');
  });

  it('Case 28: REJECT on PO vendor mismatch', () => {
    // PO-100 belongs to vendor-acme, but proposal claims vendor-cooling
    const prop = { ...defaultProposal, vendorId: 'vendor-cooling', poNumber: 'PO-100' };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('PO_VENDOR_MISMATCH');
  });

  it('Case 29: REJECT on amount exceeding PO remaining', () => {
    // PO-100 remaining is 500 USDC
    const prop = { ...defaultProposal, amount: 600_000_000n };
    const decision = evaluatePolicy(prop, baseSnapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('AMOUNT_EXCEEDS_PO_REMAINING');
  });

  it('Case 30: REJECT on duplicate invoiceKey (already paid)', () => {
    const vendorHash = computeVendorIdHash('vendor-acme');
    const invoiceKey = computeInvoiceKey(vendorHash, 'INV-001');

    const snapshot: PolicySnapshot = {
      ...baseSnapshot,
      paidInvoiceKeys: new Set([invoiceKey]),
    };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('DUPLICATE_INVOICE');
  });

  it('Case 31: REJECT on duplicate invoiceKey (currently reserved in T2)', () => {
    const vendorHash = computeVendorIdHash('vendor-acme');
    const invoiceKey = computeInvoiceKey(vendorHash, 'INV-001');

    const snapshot: PolicySnapshot = {
      ...baseSnapshot,
      reservedInvoiceKeys: new Set([invoiceKey]),
    };
    const decision = evaluatePolicy(defaultProposal, snapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('DUPLICATE_INVOICE');
  });

  // --- Precedence & Re-parsing Tests ---
  it('Case 32: REJECT takes strict precedence over T2 and T3 conditions', () => {
    // Both paused (T3) and unknown vendor (REJECT)
    const snapshot = { ...baseSnapshot, paused: true };
    const prop = { ...defaultProposal, vendorId: 'vendor-unknown' };
    const decision = evaluatePolicy(prop, snapshot);
    expect(decision.tier).toBe('REJECT');
    expect(decision.reasons).toContain('VENDOR_UNKNOWN');
  });

  it('Case 33: Decimal string amounts re-parsed and validated properly', () => {
    const rawProposal = {
      proposalId: 'prop-decimal',
      vendorId: 'vendor-acme',
      invoiceNumber: 'INV-DECIMAL',
      amount: '150.50', // 150.50 USDC
      rationale: 'Valid decimal proposal',
      sourceDocIds: ['doc-1'],
    };
    const decision = evaluatePolicy(rawProposal, baseSnapshot);
    expect(decision.tier).toBe('T1');
  });
});
