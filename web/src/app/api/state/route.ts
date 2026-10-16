import { NextResponse } from "next/server";
import {
  getChainConfig,
  getPublicClient,
  loadDeployment,
  serializeBigInt,
} from "@/lib/chain";
import { UnderwriteVaultAbi, BondPoolAbi, MockUSDCAbi } from "@/lib/abi";
import { getMandateConfig, getExamReports } from "@/lib/evidence";

export const dynamic = "force-dynamic";

export async function GET() {
  const chainConfig = getChainConfig();
  const deployments = loadDeployment(chainConfig.chainId);
  const mandate = getMandateConfig();
  const exams = getExamReports();

  let isConnected = false;
  let vaultBalance = "0";
  let isPaused = false;
  let reserveFloor = "0";
  let ceilings = {
    perTx: "300000000",
    perWindow: "1000000000",
    t2PerTx: "2000000000",
  };
  let activeQualId = exams[0]?.qualId || "0x0000000000000000000000000000000000000000000000000000000000000000";
  let activeQualDetails: any = null;
  let exposure = "0";
  let bondRemaining = "0";
  let windowSpent = "0";

  try {
    const client = getPublicClient();
    // Test connectivity
    await client.getBlockNumber();
    isConnected = true;

    // 1. Vault token balance
    try {
      const balance = await client.readContract({
        address: deployments.token,
        abi: MockUSDCAbi,
        functionName: "balanceOf",
        args: [deployments.vault],
      });
      vaultBalance = balance.toString();
    } catch {
      // fallback
    }

    // 2. Vault paused status
    try {
      isPaused = await client.readContract({
        address: deployments.vault,
        abi: UnderwriteVaultAbi,
        functionName: "paused",
      });
    } catch {
      // fallback
    }

    // 3. Reserve floor
    try {
      const floor = await client.readContract({
        address: deployments.vault,
        abi: UnderwriteVaultAbi,
        functionName: "reserveFloor",
      });
      reserveFloor = floor.toString();
    } catch {
      // fallback
    }

    // 4. Ceilings
    try {
      const c = await client.readContract({
        address: deployments.vault,
        abi: UnderwriteVaultAbi,
        functionName: "ceilings",
      });
      ceilings = {
        perTx: c[0].toString(),
        perWindow: c[1].toString(),
        t2PerTx: c[2].toString(),
      };
    } catch {
      // fallback
    }

    // 5. Active qualification of agentKey
    try {
      const agentKey = deployments.agentKey || "0xDC062a66c9E400f7EAcdE3E1b049E664337538d0";
      const qId = await client.readContract({
        address: deployments.vault,
        abi: UnderwriteVaultAbi,
        functionName: "activeQualOf",
        args: [agentKey],
      });
      if (qId && qId !== "0x" + "00".repeat(32)) {
        activeQualId = qId;
      }
    } catch {
      // fallback
    }

    // 6. Qualification details & exposure
    if (activeQualId && activeQualId !== "0x" + "00".repeat(32)) {
      try {
        const qData = await client.readContract({
          address: deployments.vault,
          abi: UnderwriteVaultAbi,
          functionName: "getQualification",
          args: [activeQualId as `0x${string}`],
        });

        if (qData) {
          activeQualDetails = {
            active: qData.active,
            revoked: qData.revoked,
            activatedAt: qData.activatedAt.toString(),
            effectiveT1MaxPerTx: qData.effectiveT1MaxPerTx.toString(),
            effectiveT1MaxPerWindow: qData.effectiveT1MaxPerWindow.toString(),
            effectiveT2MaxPerTx: qData.effectiveT2MaxPerTx.toString(),
            attestation: {
              qualId: qData.attestation.qualId,
              vault: qData.attestation.vault,
              agentKey: qData.attestation.agentKey,
              configHash: qData.attestation.configHash,
              reportHash: qData.attestation.reportHash,
              corpusHash: qData.attestation.corpusHash,
              examCommitId: qData.attestation.examCommitId.toString(),
              t1MaxPerTx: qData.attestation.t1MaxPerTx.toString(),
              t1MaxPerWindow: qData.attestation.t1MaxPerWindow.toString(),
              t2MaxPerTx: qData.attestation.t2MaxPerTx.toString(),
              t2Allowed: qData.attestation.t2Allowed,
              issuedAt: qData.attestation.issuedAt.toString(),
              expiresAt: qData.attestation.expiresAt.toString(),
              examiner: qData.attestation.examiner,
            },
          };
        }
      } catch {
        // fallback
      }

      // Exposure
      try {
        const exp = await client.readContract({
          address: deployments.vault,
          abi: UnderwriteVaultAbi,
          functionName: "exposure",
          args: [activeQualId as `0x${string}`],
        });
        exposure = exp.toString();
      } catch {
        // fallback
      }

      // Bond remaining
      try {
        const rem = await client.readContract({
          address: deployments.bondPool,
          abi: BondPoolAbi,
          functionName: "remaining",
          args: [activeQualId as `0x${string}`],
        });
        bondRemaining = rem.toString();
      } catch {
        // fallback
      }

      // Current window spent
      try {
        const currentWindowId = BigInt(Math.floor(Date.now() / 1000 / 86400));
        const spent = await client.readContract({
          address: deployments.vault,
          abi: UnderwriteVaultAbi,
          functionName: "qualWindowSpent",
          args: [activeQualId as `0x${string}`, currentWindowId],
        });
        windowSpent = spent.toString();
      } catch {
        // fallback
      }
    }
  } catch {
    isConnected = false;
  }

  // If activeQualDetails is still null, populate with local exam evidence
  if (!activeQualDetails && exams.length > 0) {
    const firstExam = exams[0];
    activeQualDetails = {
      active: true,
      revoked: false,
      activatedAt: firstExam.bounds.issuedAt,
      effectiveT1MaxPerTx: firstExam.bounds.t1MaxPerTx,
      effectiveT1MaxPerWindow: firstExam.bounds.t1MaxPerWindow,
      effectiveT2MaxPerTx: firstExam.bounds.t2MaxPerTx,
      attestation: {
        qualId: firstExam.qualId,
        vault: deployments.vault,
        agentKey: deployments.agentKey,
        configHash: firstExam.configHash,
        reportHash: firstExam.reportHash,
        corpusHash: firstExam.corpusHash,
        examCommitId: "2",
        t1MaxPerTx: firstExam.bounds.t1MaxPerTx,
        t1MaxPerWindow: firstExam.bounds.t1MaxPerWindow,
        t2MaxPerTx: firstExam.bounds.t2MaxPerTx,
        t2Allowed: firstExam.bounds.t2Allowed,
        issuedAt: firstExam.bounds.issuedAt,
        expiresAt: firstExam.bounds.expiresAt,
        examiner: deployments.examiner,
      },
    };
  }

  const response = {
    chain: {
      chainId: chainConfig.chainId,
      name: chainConfig.name,
      rpcUrl: chainConfig.rpcUrl,
      connected: isConnected,
    },
    deployments: {
      vault: deployments.vault,
      bondPool: deployments.bondPool,
      token: deployments.token,
      owner: deployments.owner,
      examiner: deployments.examiner,
      underwriter: deployments.underwriter,
      adjudicator: deployments.adjudicator,
      agentKey: deployments.agentKey,
    },
    walletBalance: {
      vaultUSDC: vaultBalance,
      reserveFloor,
      tokenAddress: deployments.token,
    },
    mandate,
    activeQualification: {
      qualId: activeQualId,
      details: activeQualDetails,
    },
    ceilings,
    windows: {
      windowSeconds: 86400,
      currentWindowSpent: windowSpent,
    },
    unreconciledExposure: exposure,
    bondRemaining,
    paused: isPaused,
  };

  return NextResponse.json(serializeBigInt(response));
}
