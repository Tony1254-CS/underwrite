import { z } from 'zod';
import { type Document, type PurchaseOrder, type Proposal } from '../types/models.js';
import { type VendorRegistry } from '../mandate/vendorRegistry.js';
import { parseAmount } from '../types/money.js';

// Address pattern: 0x followed by 40 hex chars
const ADDRESS_PATTERN = /0x[a-fA-F0-9]{40}/;

function checkForAddressLike(val: unknown, path = ''): void {
  if (typeof val === 'string') {
    if (ADDRESS_PATTERN.test(val)) {
      throw new Error(`Address-like string detected in input field "${path}": ${val}. Agents cannot pass addresses.`);
    }
  } else if (Array.isArray(val)) {
    val.forEach((item, idx) => checkForAddressLike(item, `${path}[${idx}]`));
  } else if (val !== null && typeof val === 'object') {
    for (const [k, v] of Object.entries(val)) {
      checkForAddressLike(v, path ? `${path}.${k}` : k);
    }
  }
}

// 1. list_inbox
export const ListInboxInputSchema = z.object({}).strict();
export type ListInboxInput = z.infer<typeof ListInboxInputSchema>;

export interface InboxItemSummary {
  docId: string;
  kind: string;
  subjectPreview: string;
}

// 2. read_document
export const ReadDocumentInputSchema = z.object({
  docId: z.string().min(1),
}).strict();
export type ReadDocumentInput = z.infer<typeof ReadDocumentInputSchema>;

export interface ReadDocumentOutput {
  docId: string;
  kind: string;
  untrustedText: string;
}

// 3. lookup_vendor
export const LookupVendorInputSchema = z.object({
  query: z.string(),
}).strict();
export type LookupVendorInput = z.infer<typeof LookupVendorInputSchema>;

export interface VendorLookupResult {
  vendorId: string;
  name: string;
  active: boolean;
  inCooldown: boolean;
}

// 4. lookup_purchase_order
export const LookupPurchaseOrderInputSchema = z.object({
  poNumber: z.string().min(1),
}).strict();
export type LookupPurchaseOrderInput = z.infer<typeof LookupPurchaseOrderInputSchema>;

export interface PurchaseOrderLookupResult {
  poNumber: string;
  vendorId: string;
  amount: string;
  remaining: string;
  status: 'OPEN' | 'CLOSED';
}

// 5. get_wallet_state
export const GetWalletStateInputSchema = z.object({}).strict();
export type GetWalletStateInput = z.infer<typeof GetWalletStateInputSchema>;

export interface WalletStateOutput {
  vaultBalance: string;
  reserveFloor: string;
  bondRemaining: string;
  currentExposure: string;
  windowSpent: string;
  qualification: {
    active: boolean;
    expiresAt: number;
    t1MaxPerTx: string;
    t1MaxPerWindow: string;
    t2MaxPerTx: string;
    t2Allowed: boolean;
  } | null;
}

// 6. propose_payment
export const ProposePaymentInputSchema = z
  .object({
    vendorId: z.string().min(1),
    invoiceNumber: z.string().min(1),
    amount: z.string().min(1),
    poNumber: z.string().optional(),
    rationale: z.string().min(1),
    sourceDocIds: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    try {
      checkForAddressLike(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid address in input';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
      });
    }

    try {
      parseAmount(data.amount);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid decimal amount';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ['amount'],
      });
    }
  });
export type ProposePaymentInput = z.infer<typeof ProposePaymentInputSchema>;

export interface ProposePaymentOutput {
  proposalId: string;
}

// 7. flag_for_review
export const FlagForReviewInputSchema = z
  .object({
    docId: z.string().min(1),
    reason: z.string().min(1),
  })
  .strict()
  .superRefine((data, ctx) => {
    try {
      checkForAddressLike(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid address in input';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
      });
    }
  });
export type FlagForReviewInput = z.infer<typeof FlagForReviewInputSchema>;

export interface FlagForReviewOutput {
  ok: boolean;
}

export const ALLOWED_TOOL_NAMES = [
  'list_inbox',
  'read_document',
  'lookup_vendor',
  'lookup_purchase_order',
  'get_wallet_state',
  'propose_payment',
  'flag_for_review',
] as const;

export type ToolName = (typeof ALLOWED_TOOL_NAMES)[number];

export function isAllowedToolName(name: string): name is ToolName {
  return (ALLOWED_TOOL_NAMES as readonly string[]).includes(name);
}

export interface ToolExecutionContext {
  inbox: Document[];
  vendorRegistry: VendorRegistry;
  purchaseOrders: Map<string, PurchaseOrder>;
  currentTimestamp?: number;
  getWalletState?: () => Promise<WalletStateOutput> | WalletStateOutput;
  onProposePayment?: (proposal: Proposal) => Promise<string> | string;
  onFlagForReview?: (docId: string, reason: string) => Promise<void> | void;
}

/**
 * Executes a tool call strictly within the policy and authorization boundaries.
 */
export async function executeToolCall(
  name: string,
  rawArgs: unknown,
  ctx: ToolExecutionContext
): Promise<unknown> {
  if (!isAllowedToolName(name)) {
    throw new Error(`Unauthorized or unknown tool: "${name}". Allowed tools: ${ALLOWED_TOOL_NAMES.join(', ')}`);
  }

  // Pre-validate for any address-like strings in arguments
  checkForAddressLike(rawArgs);

  switch (name) {
    case 'list_inbox': {
      ListInboxInputSchema.parse(rawArgs);
      return ctx.inbox.map((d): InboxItemSummary => {
        const preview = d.untrustedText.slice(0, 100).replace(/\r?\n/g, ' ');
        return {
          docId: d.docId,
          kind: d.kind,
          subjectPreview: preview,
        };
      });
    }

    case 'read_document': {
      const { docId } = ReadDocumentInputSchema.parse(rawArgs);
      const doc = ctx.inbox.find((d) => d.docId === docId);
      if (!doc) {
        throw new Error(`Document not found: ${docId}`);
      }
      // Wrap strictly in untrusted document markers (plan §9.6)
      const wrappedText = `<UNTRUSTED_DOCUMENT id="${doc.docId}" kind="${doc.kind}">\n${doc.untrustedText}\n</UNTRUSTED_DOCUMENT>`;
      return {
        docId: doc.docId,
        kind: doc.kind,
        untrustedText: wrappedText,
      };
    }

    case 'lookup_vendor': {
      const { query } = LookupVendorInputSchema.parse(rawArgs);
      const now = ctx.currentTimestamp || Math.floor(Date.now() / 1000);
      return ctx.vendorRegistry.queryForAgent(query, now);
    }

    case 'lookup_purchase_order': {
      const { poNumber } = LookupPurchaseOrderInputSchema.parse(rawArgs);
      const po = ctx.purchaseOrders.get(poNumber);
      if (!po) {
        return null;
      }
      return {
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        amount: (Number(po.amount) / 1_000_000).toFixed(2),
        remaining: (Number(po.remaining) / 1_000_000).toFixed(2),
        status: po.status,
      };
    }

    case 'get_wallet_state': {
      GetWalletStateInputSchema.parse(rawArgs);
      if (ctx.getWalletState) {
        return await ctx.getWalletState();
      }
      return {
        vaultBalance: '5000.00',
        reserveFloor: '500.00',
        bondRemaining: '2000.00',
        currentExposure: '0.00',
        windowSpent: '0.00',
        qualification: {
          active: true,
          expiresAt: Math.floor(Date.now() / 1000) + 14 * 86400,
          t1MaxPerTx: '180.00',
          t1MaxPerWindow: '500.00',
          t2MaxPerTx: '1000.00',
          t2Allowed: true,
        },
      };
    }

    case 'propose_payment': {
      const args = ProposePaymentInputSchema.parse(rawArgs);
      const amount = parseAmount(args.amount);
      const proposal: Proposal = {
        proposalId: `prop-${args.sourceDocIds[0] || 'doc'}-${args.invoiceNumber}`,
        vendorId: args.vendorId,
        invoiceNumber: args.invoiceNumber,
        amount,
        poNumber: args.poNumber,
        rationale: args.rationale,
        sourceDocIds: args.sourceDocIds,
      };

      let pid = proposal.proposalId;
      if (ctx.onProposePayment) {
        pid = await ctx.onProposePayment(proposal);
      }
      return { proposalId: pid };
    }

    case 'flag_for_review': {
      const { docId, reason } = FlagForReviewInputSchema.parse(rawArgs);
      if (ctx.onFlagForReview) {
        await ctx.onFlagForReview(docId, reason);
      }
      return { ok: true };
    }

    default:
      throw new Error(`Unhandled tool: ${name}`);
  }
}
