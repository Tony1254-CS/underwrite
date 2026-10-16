/**
 * Route: /api/claims
 * Server data layer & action desk - BondPool claims, payouts, and atomic consequence events
 */

import { NextResponse } from 'next/server';
import {
  getChainConfig,
  getPublicClient,
  loadDeployment,
  serializeBigInt,
} from '@/lib/chain';
import { BondPoolAbi } from '@/lib/abi';
import {
  getRuntimeState,
  fileClaim,
  adjudicateClaim,
  resetDemoRuntime,
} from '@/lib/runtimeState';

export const dynamic = 'force-dynamic';

export async function GET() {
  const chainConfig = getChainConfig();
  const deployments = loadDeployment(chainConfig.chainId);
  const runtime = getRuntimeState();

  let isConnected = false;
  let perClaimCap = '500000000';
  let deductible = '5000000';
  let openClaimsCount = runtime.claims.filter((c) => c.status === 'PENDING').length.toString();

  try {
    const client = getPublicClient();
    await client.getBlockNumber();
    isConnected = true;

    if (deployments.bondPool) {
      try {
        const cap = await client.readContract({
          address: deployments.bondPool,
          abi: BondPoolAbi,
          functionName: 'perClaimCap',
        });
        perClaimCap = cap.toString();
      } catch {
        // fallback
      }

      try {
        const ded = await client.readContract({
          address: deployments.bondPool,
          abi: BondPoolAbi,
          functionName: 'deductible',
        });
        deductible = ded.toString();
      } catch {
        // fallback
      }
    }
  } catch {
    isConnected = false;
  }

  const response = {
    success: true,
    chain: {
      chainId: chainConfig.chainId,
      connected: isConnected,
      bondPool: deployments.bondPool || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    },
    bondStatus: {
      underwriter: '0xA43F159DCe29c36Ff872CD3bB84DA79BfDEf4786',
      adjudicator: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      deductibleUSDC: '5.00',
      perClaimCapUSDC: '500.00',
      claimGracePeriodDays: 7,
      totalPayoutsUSDC: (145.0 + (runtime.claims.length > 1 ? 295.0 : 0.0)).toFixed(2),
      bondRemainingUSDC: runtime.bondRemainingUSDC.toFixed(2),
    },
    poolConfig: {
      perClaimCap,
      deductible,
      openClaimsCount,
    },
    totalClaims: runtime.claims.length,
    claims: runtime.claims,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(serializeBigInt(response));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, paymentId, lossAmountUSDC, evidenceHash, claimId, approve } = body;

    if (action === 'FILE') {
      const numLoss = parseFloat(lossAmountUSDC) || 0;
      if (numLoss <= 0) {
        return NextResponse.json({ success: false, error: 'Loss amount must be positive' }, { status: 400 });
      }
      const newClaim = fileClaim({
        paymentId: String(paymentId || '101'),
        lossAmountUSDC: numLoss,
        evidenceHash: evidenceHash || '0x' + Array.from({ length: 64 }, () => 'f').join(''),
      });
      return NextResponse.json({ success: true, claim: newClaim });
    }

    if (action === 'ADJUDICATE') {
      const result = adjudicateClaim(Number(claimId), Boolean(approve));
      return NextResponse.json(result);
    }

    if (action === 'RESET') {
      resetDemoRuntime();
      return NextResponse.json({ success: true, message: 'Runtime state reset' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error processing claim' },
      { status: 500 }
    );
  }
}
