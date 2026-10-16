import { NextResponse } from "next/server";
import {
  getChainConfig,
  getPublicClient,
  loadDeployment,
  serializeBigInt,
} from "@/lib/chain";
import { BondPoolAbi } from "@/lib/abi";

export const dynamic = "force-dynamic";

const CLAIM_STATUS_MAP: Record<number, string> = {
  0: "FILED",
  1: "APPROVED",
  2: "REJECTED",
  3: "PAID",
};

export async function GET() {
  const chainConfig = getChainConfig();
  const deployments = loadDeployment(chainConfig.chainId);

  let isConnected = false;
  let claims: any[] = [];
  let openClaimsCount = "0";
  let perClaimCap = "0";
  let deductible = "0";

  try {
    const client = getPublicClient();
    await client.getBlockNumber();
    isConnected = true;

    // Read BondPool parameters
    try {
      const cap = await client.readContract({
        address: deployments.bondPool,
        abi: BondPoolAbi,
        functionName: "perClaimCap",
      });
      perClaimCap = cap.toString();
    } catch {
      // fallback
    }

    try {
      const ded = await client.readContract({
        address: deployments.bondPool,
        abi: BondPoolAbi,
        functionName: "deductible",
      });
      deductible = ded.toString();
    } catch {
      // fallback
    }

    try {
      const openCount = await client.readContract({
        address: deployments.bondPool,
        abi: BondPoolAbi,
        functionName: "openClaimsCount",
      });
      openClaimsCount = openCount.toString();
    } catch {
      // fallback
    }

    // Read claims list
    try {
      const nextId = await client.readContract({
        address: deployments.bondPool,
        abi: BondPoolAbi,
        functionName: "nextClaimId",
      });

      const count = Number(nextId);
      for (let i = 1; i < count; i++) {
        try {
          const claim = await client.readContract({
            address: deployments.bondPool,
            abi: BondPoolAbi,
            functionName: "getClaim",
            args: [BigInt(i)],
          });

          claims.push({
            id: claim.id.toString(),
            qualId: claim.qualId,
            paymentId: claim.paymentId.toString(),
            lossAmount: claim.lossAmount.toString(),
            evidenceHash: claim.evidenceHash,
            statusCode: claim.status,
            status: CLAIM_STATUS_MAP[claim.status] || `UNKNOWN_${claim.status}`,
            payout: claim.payout.toString(),
          });
        } catch {
          // skip invalid claim
        }
      }
    } catch {
      // fallback
    }
  } catch {
    isConnected = false;
  }

  // If no claims exist yet on-chain, provide informative structured response
  const response = {
    chain: {
      chainId: chainConfig.chainId,
      connected: isConnected,
      bondPool: deployments.bondPool,
    },
    poolConfig: {
      perClaimCap,
      deductible,
      openClaimsCount,
    },
    totalClaims: claims.length,
    claims,
  };

  return NextResponse.json(serializeBigInt(response));
}
