import {
  type ToolExecutionContext,
  executeToolCall,
  type InboxItemSummary,
  type ReadDocumentOutput,
  type VendorLookupResult,
  type PurchaseOrderLookupResult,
} from './tools.js';

export interface ScriptedAgentStep {
  toolName: string;
  toolArgs: unknown;
  result: unknown;
}

export interface AgentRunResult {
  agentName: string;
  stepsExecuted: number;
  proposalsMade: string[];
  flagsMade: string[];
}

/**
 * Parses simple key-value fields from untrusted document text.
 */
export function extractInvoiceFields(text: string): {
  vendorId: string;
  invoiceNumber: string;
  amountStr: string;
  poNumber?: string;
} {
  const lines = text.split('\n');
  let vendorId = 'vendor-unknown';
  let invoiceNumber = 'INV-UNKNOWN';
  let amountStr = '0.00';
  let poNumber: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (lower.startsWith('vendor:')) {
      vendorId = trimmed.split(':')[1].trim();
    } else if (trimmed.toUpperCase().includes('INVOICE #')) {
      const match = trimmed.match(/INVOICE\s*#\s*([A-Za-z0-9-_]+)/i);
      if (match) {
        invoiceNumber = match[1];
      }
    } else if (lower.startsWith('amount:')) {
      const amtMatch = trimmed.match(/\$?([0-9]+(?:\.[0-9]{1,6})?)/);
      if (amtMatch) {
        amountStr = amtMatch[1];
      }
    } else if (lower.startsWith('po number:') || lower.startsWith('po:')) {
      poNumber = trimmed.split(':')[1].trim();
    }
  }

  return { vendorId, invoiceNumber, amountStr, poNumber };
}

/**
 * Scripted careful agent (plan §8.2):
 * Deterministic agent for fixtures, CI, and the no-key demo.
 * Reads documents, queries vendor registry and PO, verifies status & remaining balance,
 * proposes payment only when consistent, and flags suspicious/closed POs for review.
 */
export async function runScriptedCarefulAgent(
  ctx: ToolExecutionContext
): Promise<AgentRunResult> {
  const proposalsMade: string[] = [];
  const flagsMade: string[] = [];
  let stepsCount = 0;

  // 1. List inbox
  stepsCount++;
  const inbox = (await executeToolCall('list_inbox', {}, ctx)) as InboxItemSummary[];

  // 2. Process each document in strict order
  for (const item of inbox) {
    stepsCount++;
    const doc = (await executeToolCall(
      'read_document',
      { docId: item.docId },
      ctx
    )) as ReadDocumentOutput;

    const fields = extractInvoiceFields(doc.untrustedText);

    // Look up vendor
    stepsCount++;
    const vendors = (await executeToolCall(
      'lookup_vendor',
      { query: fields.vendorId },
      ctx
    )) as VendorLookupResult[];

    const vendor = vendors.find((v) => v.vendorId === fields.vendorId);
    if (!vendor || !vendor.active || vendor.inCooldown) {
      stepsCount++;
      await executeToolCall(
        'flag_for_review',
        { docId: item.docId, reason: `Vendor ${fields.vendorId} invalid, inactive, or in cooldown` },
        ctx
      );
      flagsMade.push(item.docId);
      continue;
    }

    // Check PO if present
    if (fields.poNumber) {
      stepsCount++;
      const po = (await executeToolCall(
        'lookup_purchase_order',
        { poNumber: fields.poNumber },
        ctx
      )) as PurchaseOrderLookupResult | null;

      if (!po || po.status !== 'OPEN') {
        stepsCount++;
        await executeToolCall(
          'flag_for_review',
          { docId: item.docId, reason: `Purchase Order ${fields.poNumber} is not open or not found` },
          ctx
        );
        flagsMade.push(item.docId);
        continue;
      }

      if (Number(fields.amountStr) > Number(po.remaining)) {
        stepsCount++;
        await executeToolCall(
          'flag_for_review',
          { docId: item.docId, reason: `Amount ${fields.amountStr} exceeds PO remaining ${po.remaining}` },
          ctx
        );
        flagsMade.push(item.docId);
        continue;
      }
    }

    // Consistent: propose payment
    stepsCount++;
    const propRes = (await executeToolCall(
      'propose_payment',
      {
        vendorId: fields.vendorId,
        invoiceNumber: fields.invoiceNumber,
        amount: fields.amountStr,
        poNumber: fields.poNumber,
        rationale: 'Verified vendor active and PO valid and open',
        sourceDocIds: [item.docId],
      },
      ctx
    )) as { proposalId: string };

    proposalsMade.push(propRes.proposalId);
  }

  return {
    agentName: 'scripted',
    stepsExecuted: stepsCount,
    proposalsMade,
    flagsMade,
  };
}

/**
 * Scripted naive agent α (plan §8.2):
 * Pays whatever the document says via the same tools (vendorId only).
 * Performs NO PO lookups, ignores cooldowns and vendor state, and blindly calls propose_payment.
 */
export async function runScriptedNaiveAgent(
  ctx: ToolExecutionContext
): Promise<AgentRunResult> {
  const proposalsMade: string[] = [];
  const flagsMade: string[] = [];
  let stepsCount = 0;

  // 1. List inbox
  stepsCount++;
  const inbox = (await executeToolCall('list_inbox', {}, ctx)) as InboxItemSummary[];

  // 2. Blindly propose whatever each document says
  for (const item of inbox) {
    stepsCount++;
    const doc = (await executeToolCall(
      'read_document',
      { docId: item.docId },
      ctx
    )) as ReadDocumentOutput;

    const fields = extractInvoiceFields(doc.untrustedText);

    try {
      stepsCount++;
      const propRes = (await executeToolCall(
        'propose_payment',
        {
          vendorId: fields.vendorId,
          invoiceNumber: fields.invoiceNumber,
          amount: fields.amountStr,
          poNumber: fields.poNumber,
          rationale: 'Naive extraction from document text',
          sourceDocIds: [item.docId],
        },
        ctx
      )) as { proposalId: string };

      proposalsMade.push(propRes.proposalId);
    } catch {
      // If tool rejects (e.g. invalid amount format or address in field)
      stepsCount++;
      await executeToolCall(
        'flag_for_review',
        { docId: item.docId, reason: 'Extraction failed or invalid field format' },
        ctx
      );
      flagsMade.push(item.docId);
    }
  }

  return {
    agentName: 'scripted-naive',
    stepsExecuted: stepsCount,
    proposalsMade,
    flagsMade,
  };
}
