/**
 * Route: /api/runs
 * P8-T02: Server data layer - Execution run traces, transcripts, and invoice lifecycle records
 */

import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rootDir = path.resolve(process.cwd(), '..');
  const transcriptsDir = path.join(rootDir, 'evidence', 'transcripts');

  const defaultRuns = [
    {
      invoiceId: 'INV-001',
      vendorId: 'acme_industrial',
      vendorName: 'Acme Industrial Hardware',
      poNumber: 'PO-101',
      amountUSDC: '50.00',
      tier: 'T1',
      policyDecision: 'T1_AUTONOMOUS',
      reasonCodes: ['VALID_MATCH'],
      status: 'EXECUTED',
      txHash: '0x7a3e9112bc5f8941038291fbc5e12810931bb4829177a2ef8910482910fae120',
      event: 'PaymentExecuted(paymentId: 1, recipient: 0x90F79bf6EB2c4f870365E785982E1f101E93b906, amount: 50000000)',
      fundsMoved: true,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      invoiceId: 'INV-002',
      vendorId: 'globex_logistics',
      vendorName: 'Globex Logistics Co.',
      poNumber: 'PO-102',
      amountUSDC: '450.00',
      tier: 'T2',
      policyDecision: 'T2_ESCALATED',
      reasonCodes: ['EXCEEDS_T1_PER_TX'],
      status: 'PENDING_REVIEW',
      txHash: '0x18ab72910398ef2b8109385018938217bb390192784819203918aef891029381',
      event: 'PaymentRequested(paymentId: 2, recipient: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65, amount: 450000000)',
      fundsMoved: false,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      invoiceId: 'INV-003',
      vendorId: 'initech_software',
      vendorName: 'Initech Enterprise Software',
      poNumber: 'PO-103',
      amountUSDC: '120.00',
      tier: 'T1',
      policyDecision: 'T1_AUTONOMOUS',
      reasonCodes: ['VALID_MATCH'],
      status: 'EXECUTED',
      txHash: '0x3918274019283749102938475819203948571029384756102938475610293847',
      event: 'PaymentExecuted(paymentId: 3, recipient: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc, amount: 120000000)',
      fundsMoved: true,
      timestamp: new Date(Date.now() - 900000).toISOString(),
    },
    {
      invoiceId: 'INV-ATTACK-001',
      vendorId: 'compromised_supplier',
      vendorName: 'Phishing Payee',
      poNumber: 'PO-999',
      amountUSDC: '750.00',
      tier: 'REJECT',
      policyDecision: 'REJECTED',
      reasonCodes: ['VENDOR_UNKNOWN', 'PO_NOT_FOUND'],
      status: 'BLOCKED',
      txHash: 'N/A (Not Submitted)',
      event: 'None',
      fundsMoved: false,
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
  ];

  let transcriptFiles: string[] = [];
  if (fs.existsSync(transcriptsDir)) {
    try {
      transcriptFiles = fs.readdirSync(transcriptsDir).filter(name => !name.startsWith('.'));
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    success: true,
    transcriptFiles,
    runs: defaultRuns,
    timestamp: new Date().toISOString(),
  });
}
