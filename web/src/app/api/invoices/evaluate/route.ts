import { NextResponse } from 'next/server';
import { evaluateAndExecuteInvoice } from '@/lib/runtimeState';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendorId, invoiceNumber, amount, poNumber, agentModel, notes, description, lineItems, proposedRecipient } = body;

    if (!vendorId || !invoiceNumber || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required invoice parameters (vendorId, invoiceNumber, amount)' },
        { status: 400 }
      );
    }

    const result = evaluateAndExecuteInvoice({
      vendorId: String(vendorId),
      invoiceNumber: String(invoiceNumber),
      amount: String(amount),
      poNumber: poNumber ? String(poNumber) : undefined,
      agentModel: agentModel ? String(agentModel) : undefined,
      notes: notes ? String(notes) : undefined,
      description: description ? String(description) : undefined,
      lineItems: Array.isArray(lineItems) ? lineItems : undefined,
      proposedRecipient: proposedRecipient ? String(proposedRecipient) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Invoice evaluation failed' },
      { status: 500 }
    );
  }
}
