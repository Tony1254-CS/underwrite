/**
 * Route: /api/state
 * P8-T02: Server data layer - Vault, Mandate, Qualification, Window, Exposure, and Bond state
 */

import { NextResponse } from 'next/server';
import { fetchLiveVaultState, serializeBigInt } from '@/lib/chain';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await fetchLiveVaultState();

    const legacyPayload = {
      chain: {
        chainId: state.chainId,
        name: state.chainName,
        rpcUrl: state.chainId === 84532 ? 'https://sepolia.base.org' : 'http://127.0.0.1:8545',
        connected: state.isLiveRpc,
      },
      deployments: {
        vault: state.addresses.vault,
        bondPool: state.addresses.bondPool,
        token: state.addresses.token,
        owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        examiner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        underwriter: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        adjudicator: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        agentKey: state.qualification.agentKey,
      },
      walletBalance: {
        vaultUSDC: state.balances.vaultRaw,
        reserveFloor: state.balances.reserveFloorRaw,
        tokenAddress: state.addresses.token,
      },
      mandate: {
        riskBudgetPerWindow: '1000000000',
        adversarialShare: 0.2,
        ceilings: {
          perTx: '300000000',
          perWindow: '1000000000',
          t2PerTx: '2000000000',
        },
        minUsefulCap: '50000000',
        windowSeconds: 86400,
        challengePeriod: state.mandate.challengePeriodSeconds,
        recipientCooldown: state.mandate.recipientCooldownSeconds,
      },
      activeQualification: {
        qualId: state.qualification.qualId,
        details: {
          active: state.qualification.active,
          revoked: false,
          activatedAt: state.qualification.activatedAt.toString(),
          effectiveT1MaxPerTx: (parseFloat(state.qualification.t1MaxPerTxUSDC) * 1e6).toString(),
          effectiveT1MaxPerWindow: (parseFloat(state.qualification.t1MaxPerWindowUSDC) * 1e6).toString(),
          effectiveT2MaxPerTx: (parseFloat(state.qualification.t2MaxPerTxUSDC) * 1e6).toString(),
          effectiveT2Allowed: state.qualification.t2Allowed,
          expiresAt: state.qualification.expiresAt.toString(),
          attestation: {
            qualId: state.qualification.qualId,
            agentKey: state.qualification.agentKey,
            configHash: state.qualification.configHash,
            reportHash: '0x8b3e819a7123efd6810294821049281049281049281049281049281049281049',
            corpusHash: '0xd7a8fbb307dcee956411c6fce0b8a0d0da35e38d92982d1c86290a158ebff644',
            examCommitId: '1',
            t1MaxPerTx: (parseFloat(state.qualification.t1MaxPerTxUSDC) * 1e6).toString(),
            t1MaxPerWindow: (parseFloat(state.qualification.t1MaxPerWindowUSDC) * 1e6).toString(),
            t2MaxPerTx: (parseFloat(state.qualification.t2MaxPerTxUSDC) * 1e6).toString(),
            t2Allowed: state.qualification.t2Allowed,
            issuedAt: state.qualification.activatedAt.toString(),
            expiresAt: state.qualification.expiresAt.toString(),
            examiner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          },
        },
      },
      ceilings: {
        perTx: '300000000',
        perWindow: '1000000000',
        t2PerTx: '2000000000',
      },
      windows: {
        windowSeconds: 86400,
        currentWindowSpent: state.meter.windowSpendRaw,
      },
      unreconciledExposure: state.meter.currentExposureRaw,
      bondRemaining: state.meter.bondRemainingRaw,
      paused: false,
    };

    return NextResponse.json({
      success: true,
      data: state,
      timestamp: new Date().toISOString(),
      ...legacyPayload,
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
