/**
 * Route: /api/claims
 * P8-T02: Server data layer - BondPool claims, payouts, and atomic consequence events
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const defaultClaims = [
    {
      claimId: 1,
      qualId: '0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701',
      paymentId: 1,
      lossAmountUSDC: '150.00',
      deductibleUSDC: '5.00',
      payoutUSDC: '145.00',
      status: 'APPROVED',
      txHash: '0xa2b38b3db17a2b4217164046b5e5e75ef3a784a036050fee73cf7b652a76059e',
      events: [
        'ClaimPaid(claimId: 1, qualId: 0xa38c..., payout: 145000000, vault: 0x5FbDB2...)',
        'QualificationRevoked(qualId: 0xa38c..., reason: CLAIM_APPROVED)',
      ],
      consequence: 'Agent qualification atomically revoked in the exact same transaction (INV-11 / INV-14)',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return NextResponse.json({
    success: true,
    bondStatus: {
      underwriter: '0xA43F159DCe29c36Ff872CD3bB84DA79BfDEf4786',
      adjudicator: '0x6Bf37266F1Db79D5e194D5e2929dcA54aDe76Af9',
      deductibleUSDC: '5.00',
      perClaimCapUSDC: '500.00',
      claimGracePeriodDays: 7,
      totalPayoutsUSDC: '145.00',
    },
    claims: defaultClaims,
    timestamp: new Date().toISOString(),
  });
}
