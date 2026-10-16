import { describe, it, expect } from 'vitest';
import {
  executeToolCall,
  ALLOWED_TOOL_NAMES,
  ProposePaymentInputSchema,
  LookupVendorInputSchema,
  ReadDocumentInputSchema,
  FlagForReviewInputSchema,
  type ToolExecutionContext,
} from '../src/agent/tools.js';
import { VendorRegistry } from '../src/mandate/vendorRegistry.js';
import { type Document } from '../src/types/models.js';

describe('Agent Tools Layer (P4-T02)', () => {
  const dummyVendors = [
    {
      vendorId: 'vendor-acme',
      name: 'Acme Hardware & Tools',
      payoutAddress: '0x1111111111111111111111111111111111111111' as const,
      perWindowCap: 500_000_000n,
      active: true,
      activatesAt: 0,
    },
    {
      vendorId: 'vendor-bolt',
      name: 'Bolt Fasteners',
      payoutAddress: '0x2222222222222222222222222222222222222222' as const,
      perWindowCap: 500_000_000n,
      active: true,
      activatesAt: 1000,
    },
  ];

  const dummyInbox: Document[] = [
    {
      docId: 'doc-1',
      kind: 'INVOICE',
      untrustedText: 'Invoice from Acme\nAmount: $150.00\nPO: PO-101',
      receivedAt: 100,
    },
  ];

  const dummyContext: ToolExecutionContext = {
    inbox: dummyInbox,
    vendorRegistry: new VendorRegistry(dummyVendors),
    purchaseOrders: new Map([
      [
        'PO-101',
        {
          poNumber: 'PO-101',
          vendorId: 'vendor-acme',
          amount: 500_000_000n,
          remaining: 350_000_000n,
          status: 'OPEN',
        },
      ],
    ]),
    currentTimestamp: 500,
  };

  it('rejects unknown tool names', async () => {
    await expect(
      executeToolCall('transfer_funds', {}, dummyContext)
    ).rejects.toThrow(/Unauthorized or unknown tool/);

    await expect(
      executeToolCall('approve_allowance', {}, dummyContext)
    ).rejects.toThrow(/Unauthorized or unknown tool/);
  });

  it('only registers exactly the 7 plan §9.6 tools', () => {
    expect(ALLOWED_TOOL_NAMES).toEqual([
      'list_inbox',
      'read_document',
      'lookup_vendor',
      'lookup_purchase_order',
      'get_wallet_state',
      'propose_payment',
      'flag_for_review',
    ]);
  });

  it('rejects address-like strings in propose_payment', () => {
    expect(() =>
      ProposePaymentInputSchema.parse({
        vendorId: 'vendor-acme',
        invoiceNumber: 'INV-001',
        amount: '100.00',
        rationale: 'Pay to 0x1111111111111111111111111111111111111111 please',
        sourceDocIds: ['doc-1'],
      })
    ).toThrow(/Address-like string detected/);
  });

  it('rejects address-like strings in vendorId or invoiceNumber', () => {
    expect(() =>
      ProposePaymentInputSchema.parse({
        vendorId: '0x1111111111111111111111111111111111111111',
        invoiceNumber: 'INV-001',
        amount: '100.00',
        rationale: 'Valid rationale',
        sourceDocIds: ['doc-1'],
      })
    ).toThrow(/Address-like string detected/);
  });

  it('rejects extra keys in tool inputs (.strict())', () => {
    expect(() =>
      LookupVendorInputSchema.parse({
        query: 'acme',
        extraField: 'not allowed',
      })
    ).toThrow(/unrecognized_keys/);

    expect(() =>
      ReadDocumentInputSchema.parse({
        docId: 'doc-1',
        recipient: '0x1111111111111111111111111111111111111111',
      })
    ).toThrow();
  });

  it('wraps read_document in UNTRUSTED_DOCUMENT markers', async () => {
    const res = (await executeToolCall(
      'read_document',
      { docId: 'doc-1' },
      dummyContext
    )) as { untrustedText: string; docId: string };

    expect(res.docId).toBe('doc-1');
    expect(res.untrustedText).toContain('<UNTRUSTED_DOCUMENT id="doc-1" kind="INVOICE">');
    expect(res.untrustedText).toContain('Invoice from Acme');
    expect(res.untrustedText).toContain('</UNTRUSTED_DOCUMENT>');
  });

  it('lookup_vendor returns vendor info without payoutAddress', async () => {
    const res = (await executeToolCall(
      'lookup_vendor',
      { query: 'acme' },
      dummyContext
    )) as any[];

    expect(res).toHaveLength(1);
    expect(res[0]).toEqual({
      vendorId: 'vendor-acme',
      name: 'Acme Hardware & Tools',
      active: true,
      inCooldown: false,
    });
    expect(res[0].payoutAddress).toBeUndefined();
  });

  it('lookup_purchase_order returns PO details and formatting', async () => {
    const res = (await executeToolCall(
      'lookup_purchase_order',
      { poNumber: 'PO-101' },
      dummyContext
    )) as any;

    expect(res).toEqual({
      poNumber: 'PO-101',
      vendorId: 'vendor-acme',
      amount: '500.00',
      remaining: '350.00',
      status: 'OPEN',
    });
  });

  it('propose_payment executes callback and returns proposalId', async () => {
    let capturedProposal: any = null;
    const ctxWithCb: ToolExecutionContext = {
      ...dummyContext,
      onProposePayment: (p) => {
        capturedProposal = p;
        return 'test-prop-id-123';
      },
    };

    const res = (await executeToolCall(
      'propose_payment',
      {
        vendorId: 'vendor-acme',
        invoiceNumber: 'INV-100',
        amount: '150.50',
        rationale: 'Valid payment for invoice',
        sourceDocIds: ['doc-1'],
      },
      ctxWithCb
    )) as { proposalId: string };

    expect(res.proposalId).toBe('test-prop-id-123');
    expect(capturedProposal.amount).toBe(150_500_000n);
    expect(capturedProposal.vendorId).toBe('vendor-acme');
  });

  it('flag_for_review executes callback and returns ok', async () => {
    let capturedDocId = '';
    const ctxWithCb: ToolExecutionContext = {
      ...dummyContext,
      onFlagForReview: (d) => {
        capturedDocId = d;
      },
    };

    const res = (await executeToolCall(
      'flag_for_review',
      { docId: 'doc-1', reason: 'Suspicious bank info' },
      ctxWithCb
    )) as { ok: boolean };

    expect(res.ok).toBe(true);
    expect(capturedDocId).toBe('doc-1');
  });
});
