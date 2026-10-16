import { NextResponse } from 'next/server';
import { getRuntimeState, registerNewVendor } from '@/lib/runtimeState';

export const dynamic = 'force-dynamic';

export async function GET() {
  const live = getRuntimeState();
  return NextResponse.json({
    success: true,
    vendors: live.vendors,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendorId, name, payoutAddress } = body;

    if (!vendorId || !name || !payoutAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required vendor fields (vendorId, name, payoutAddress)' },
        { status: 400 }
      );
    }

    // Basic address format check
    if (!payoutAddress.startsWith('0x') || payoutAddress.length !== 42) {
      return NextResponse.json(
        { success: false, error: 'Invalid EVM payout address format (must be 0x-prefixed 42-char address)' },
        { status: 400 }
      );
    }

    const newVendor = registerNewVendor({ vendorId, name, payoutAddress });
    const live = getRuntimeState();

    return NextResponse.json({
      success: true,
      vendor: newVendor,
      allVendors: live.vendors,
      message: `Vendor '${name}' registered on-chain. Security cooldown: 300s remaining before T1 autonomy begins (INV-4).`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to register vendor' },
      { status: 500 }
    );
  }
}
