/**
 * Route: /api/state
 * P8-T02: Server data layer - Vault, Mandate, Qualification, Window, Exposure, and Bond state
 */

import { NextResponse } from 'next/server';
import { fetchLiveVaultState } from '@/lib/chain';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await fetchLiveVaultState();
    return NextResponse.json({
      success: true,
      data: state,
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
