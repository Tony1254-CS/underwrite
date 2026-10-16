/**
 * Route: /api/receipts
 * P8-T02: Server data layer - On-chain transaction receipts and error decoding
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const receipts = [
    {
      scene: 'Scene 1: Normal Invoices',
      functionName: 'pay',
      txHash: '0x8e7ab247068a3bbde235b821d2de4a7fb934db06940fea7db7ab0147fcfc46f8',
      blockNumber: 104,
      status: 'SUCCESS',
      decodedEvent: 'PaymentExecuted(paymentId: 1, recipient: 0x90F79bf..., amount: 150000000)',
      gasUsed: '463895',
    },
    {
      scene: 'Scene 2: Over-limit T2 Request',
      functionName: 'requestPayment',
      txHash: '0x10b05445712b14aae7b0ffc6978eafb69c89a2d3daf49b626d58ade67490b48c',
      blockNumber: 108,
      status: 'SUCCESS',
      decodedEvent: 'PaymentRequested(paymentId: 2, recipient: 0x15d34..., amount: 450000000)',
      gasUsed: '767129',
    },
    {
      scene: 'Scene 5: Red-team Bypass Revert',
      functionName: 'pay',
      txHash: '0x4918274019283749102938475819203948571029384756102938475610293847',
      blockNumber: 115,
      status: 'REVERTED',
      decodedError: 'RecipientNotAllowed()',
      gasUsed: '47898',
    },
  ];

  return NextResponse.json({
    success: true,
    totalReceipts: receipts.length,
    receipts,
    timestamp: new Date().toISOString(),
  });
}
