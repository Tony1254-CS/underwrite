import { NextResponse } from 'next/server';
import { approveT2Payment, rejectT2Payment, getRuntimeState } from '@/lib/runtimeState';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, paymentId } = body;

    if (!paymentId || !action) {
      return NextResponse.json({ success: false, error: 'Missing action or paymentId' }, { status: 400 });
    }

    const id = Number(paymentId);
    let ok = false;

    if (action === 'APPROVE') {
      ok = approveT2Payment(id);
    } else if (action === 'REJECT') {
      ok = rejectT2Payment(id);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action. Must be APPROVE or REJECT' }, { status: 400 });
    }

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Payment proposal not found in pending queue' }, { status: 404 });
    }

    const live = getRuntimeState();

    return NextResponse.json({
      success: true,
      message: `Payment #${id} successfully ${action.toLowerCase()}d by Owner`,
      vaultBalanceUSDC: live.vaultBalanceUSDC,
      pendingT2Payments: live.pendingT2Payments,
      executedPayments: live.executedPayments,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process invoice action' },
      { status: 500 }
    );
  }
}
