/**
 * Route: /api/state
 * P8-T02: Server data layer - Vault, Mandate, Qualification, Window, Exposure, and Bond state
 */

import { NextResponse } from 'next/server';
import { fetchLiveVaultState, serializeBigInt } from '@/lib/chain';
import { getRuntimeState } from '@/lib/runtimeState';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await fetchLiveVaultState();

    const live = getRuntimeState();

    // Sync state with live runtime adjustments
    state.balances.vaultUSDC = live.vaultBalanceUSDC.toFixed(2);
    state.balances.vaultRaw = Math.floor(live.vaultBalanceUSDC * 1e6).toString();
    state.meter.currentExposureUSDC = live.currentExposureUSDC.toFixed(2);
    state.meter.currentExposureRaw = Math.floor(live.currentExposureUSDC * 1e6).toString();
    state.meter.windowSpendUSDC = live.windowSpendUSDC.toFixed(2);
    state.meter.windowSpendRaw = Math.floor(live.windowSpendUSDC * 1e6).toString();
    state.meter.bondRemainingUSDC = live.bondRemainingUSDC.toFixed(2);
    state.meter.bondRemainingRaw = Math.floor(live.bondRemainingUSDC * 1e6).toString();
    state.qualification.active = live.qualificationActive;
    state.mandate.vendorCount = live.vendors.length;

    return NextResponse.json({
      success: true,
      data: state,
      vendors: live.vendors,
      pendingT2Payments: live.pendingT2Payments,
      executedPayments: live.executedPayments,
      invoices: live.invoices || [],
      qualificationActive: live.qualificationActive,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch state',
      },
      { status: 500 }
    );
  }
}
