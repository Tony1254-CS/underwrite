import { describe, it, expect } from 'vitest';
import {
  ReasonCodeSchema,
  MandateSchema,
  VendorSchema,
  PurchaseOrderSchema,
  DocumentSchema,
  ProposalSchema,
  PolicyDecisionSchema,
  TxRecordSchema,
  ManifestSchema,
  QualificationAttestationSchema,
  ClaimSchema,
  ScenarioSchema,
} from '../src/types/index.js';

describe('Zod Schema Validation & Rejection (P3-T01)', () => {
  it('validates and rejects ReasonCode', () => {
    expect(ReasonCodeSchema.parse('VENDOR_UNKNOWN')).toBe('VENDOR_UNKNOWN');
    expect(ReasonCodeSchema.parse('NEAR_DUPLICATE')).toBe('NEAR_DUPLICATE');
    expect(ReasonCodeSchema.parse('CONFIG_DRIFT')).toBe('CONFIG_DRIFT');
    expect(() => ReasonCodeSchema.parse('INVALID_CODE')).toThrow();
  });

  it('validates and rejects Mandate', () => {
    const valid = {
      chainId: 84532,
      vault: '0x38461fd5B7421cE286bDD337255e55a41A9D6C1A',
      token: '0x9126090d4650bD722FD8763d164D325A270A78F2',
      ownerCeilings: {
        perTx: '300',
        perWindow: '1000',
        t2PerTx: '2000',
      },
      windowSeconds: 86400,
      reserveFloor: '500',
      challengePeriod: 300,
      recipientCooldown: 300,
      riskBudgetPerWindow: '10',
      threatShare: 0.2,
    };
    const parsed = MandateSchema.parse(valid);
    expect(parsed.ownerCeilings.perTx).toBe(300_000_000n);
    expect(parsed.vault).toBe(valid.vault);

    // Reject invalid address
    expect(() => MandateSchema.parse({ ...valid, vault: '0xinvalid' })).toThrow();
    // Reject negative chainId
    expect(() => MandateSchema.parse({ ...valid, chainId: -1 })).toThrow();
  });

  it('validates and rejects Vendor', () => {
    const valid = {
      vendorId: 'vendor-1',
      name: 'Acme Corp',
      payoutAddress: '0x38461fd5B7421cE286bDD337255e55a41A9D6C1A',
      perWindowCap: '500',
      active: true,
      activatesAt: 1000,
    };
    const parsed = VendorSchema.parse(valid);
    expect(parsed.perWindowCap).toBe(500_000_000n);

    // Reject empty vendorId
    expect(() => VendorSchema.parse({ ...valid, vendorId: '' })).toThrow();
    // Reject invalid address
    expect(() => VendorSchema.parse({ ...valid, payoutAddress: '123' })).toThrow();
  });

  it('validates and rejects PurchaseOrder', () => {
    const valid = {
      poNumber: 'PO-2026-001',
      vendorId: 'vendor-1',
      amount: 1000_000_000n,
      remaining: 500_000_000n,
      status: 'OPEN' as const,
    };
    const parsed = PurchaseOrderSchema.parse(valid);
    expect(parsed.amount).toBe(1000_000_000n);

    // Reject invalid status
    expect(() => PurchaseOrderSchema.parse({ ...valid, status: 'PENDING' })).toThrow();
  });

  it('validates and rejects Document', () => {
    const valid = {
      docId: 'doc-1',
      kind: 'INVOICE' as const,
      untrustedText: 'Invoice #101 for $500',
      receivedAt: 123456,
    };
    expect(DocumentSchema.parse(valid).kind).toBe('INVOICE');

    // Reject invalid kind
    expect(() => DocumentSchema.parse({ ...valid, kind: 'RECEIPT' })).toThrow();
  });

  it('validates and rejects Proposal', () => {
    const valid = {
      proposalId: 'prop-1',
      vendorId: 'vendor-1',
      invoiceNumber: 'INV-001',
      amount: '250',
      rationale: 'Pay supplier for approved PO',
      sourceDocIds: ['doc-1'],
    };
    const parsed = ProposalSchema.parse(valid);
    expect(parsed.amount).toBe(250_000_000n);

    // Reject missing rationale
    expect(() => ProposalSchema.parse({ ...valid, rationale: '' })).toThrow();
  });

  it('validates and rejects PolicyDecision', () => {
    const valid = {
      proposalId: 'prop-1',
      tier: 'T1' as const,
      reasons: ['AMOUNT_INVALID' as const],
      invoiceKey: '0x' + '11'.repeat(32),
      recipient: '0x38461fd5B7421cE286bDD337255e55a41A9D6C1A',
    };
    expect(PolicyDecisionSchema.parse(valid).tier).toBe('T1');

    // Reject invalid tier
    expect(() => PolicyDecisionSchema.parse({ ...valid, tier: 'T4' })).toThrow();
    // Reject invalid invoiceKey length
    expect(() => PolicyDecisionSchema.parse({ ...valid, invoiceKey: '0x123' })).toThrow();
  });

  it('validates and rejects TxRecord', () => {
    const valid = {
      proposalId: 'prop-1',
      tier: 'T1' as const,
      status: 'EXECUTED' as const,
      txHash: '0x' + 'aa'.repeat(32),
      paymentId: 1n,
    };
    expect(TxRecordSchema.parse(valid).status).toBe('EXECUTED');

    // Reject invalid status
    expect(() => TxRecordSchema.parse({ ...valid, status: 'UNKNOWN' })).toThrow();
  });

  it('validates and rejects Manifest', () => {
    const valid = {
      schema: 'uw-manifest@2' as const,
      agentImpl: 'scripted',
      systemPromptSha256: '0x' + '22'.repeat(32),
      toolSchemaSha256: '0x' + '33'.repeat(32),
      policySourceHash: '0x' + '44'.repeat(32),
      compilerVersion: '1.0.0',
      vaultSourceVersion: '1.0.0+hash',
      harnessVersion: '1.0.0',
    };
    expect(ManifestSchema.parse(valid).schema).toBe('uw-manifest@2');

    // Reject wrong schema string
    expect(() => ManifestSchema.parse({ ...valid, schema: 'uw-manifest@1' })).toThrow();
  });

  it('validates and rejects QualificationAttestation', () => {
    const valid = {
      qualId: '0x' + '11'.repeat(32),
      vault: '0x38461fd5B7421cE286bDD337255e55a41A9D6C1A',
      agentKey: '0x9126090d4650bD722FD8763d164D325A270A78F2',
      configHash: '0x' + '22'.repeat(32),
      reportHash: '0x' + '33'.repeat(32),
      corpusHash: '0x' + '44'.repeat(32),
      examCommitId: 1n,
      ownerInputsHash: '0x' + '55'.repeat(32),
      t1MaxPerTx: 180_000_000n,
      t1MaxPerWindow: 500_000_000n,
      t2MaxPerTx: 1000_000_000n,
      t2Allowed: true,
      issuedAt: 1000n,
      expiresAt: 2000n,
      examiner: '0x37bd563ad02C907Dc32A2B624e989CCa15f696aE',
    };
    expect(QualificationAttestationSchema.parse(valid).t2Allowed).toBe(true);

    // Reject invalid examiner address
    expect(() => QualificationAttestationSchema.parse({ ...valid, examiner: '0xbad' })).toThrow();
  });

  it('validates and rejects Claim', () => {
    const valid = {
      claimId: 1n,
      qualId: '0x' + '11'.repeat(32),
      paymentId: 1n,
      lossAmount: '150',
      evidenceHash: '0x' + '66'.repeat(32),
      status: 'FILED' as const,
    };
    const parsed = ClaimSchema.parse(valid);
    expect(parsed.lossAmount).toBe(150_000_000n);

    // Reject invalid claim status
    expect(() => ClaimSchema.parse({ ...valid, status: 'CANCELLED' })).toThrow();
  });

  it('validates and rejects Scenario', () => {
    const valid = {
      id: 'BEN-STD-001',
      family: 'BEN-STD',
      class: 'BENIGN' as const,
      split: 'eval' as const,
      origin: 'generator',
      seed: 'seed123',
      inbox: [
        {
          docId: 'doc-1',
          kind: 'INVOICE' as const,
          untrustedText: 'Invoice for goods',
          receivedAt: 100,
        },
      ],
      worldState: {
        vendors: [],
        purchaseOrders: [],
        paidInvoiceKeys: [],
        recipientCooldowns: {},
      },
      expected: [
        {
          kind: 'PAY' as const,
          vendorId: 'vendor-1',
          invoiceNumber: 'INV-1',
          amount: '100',
        },
      ],
      lossIfWrong: 100,
    };
    expect(ScenarioSchema.parse(valid).class).toBe('BENIGN');

    // Reject invalid class
    expect(() => ScenarioSchema.parse({ ...valid, class: 'MALICIOUS' })).toThrow();
  });
});
