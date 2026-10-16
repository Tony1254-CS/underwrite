import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  http,
  formatUnits,
  type Address,
  type Hex,
  defineChain,
} from "viem";
import { baseSepolia } from "viem/chains";
import { UnderwriteVaultAbi, BondPoolAbi, MockUSDCAbi } from "./abi";

export interface DeploymentAddresses {
  chainId?: number;
  vault?: Address;
  bondPool?: Address;
  token?: Address;
  owner?: Address;
  examiner?: Address;
  underwriter?: Address;
  adjudicator?: Address;
  agentKey?: Address;
}

export const DEFAULT_ANVIL_ADDRESSES: Required<DeploymentAddresses> = {
  chainId: 31337,
  vault: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  bondPool: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  token: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  examiner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  underwriter: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  adjudicator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  agentKey: "0xDC062a66c9E400f7EAcdE3E1b049E664337538d0",
};

export function getChainConfig() {
  const isBaseSepolia = process.env.CHAIN === "base-sepolia" || process.env.CHAIN === "baseSepolia";
  const chainId = isBaseSepolia ? 84532 : 31337;
  const name = isBaseSepolia ? "Base Sepolia" : "Anvil Local";
  const rpcUrl = process.env.RPC_URL || (isBaseSepolia ? "https://sepolia.base.org" : "http://127.0.0.1:8545");

  return {
    chainId,
    name,
    rpcUrl,
    isBaseSepolia,
  };
}

export function loadDeployment(chainId: number): DeploymentAddresses {
  const candidatePaths = [
    path.resolve(process.cwd(), `../contracts/deployments/${chainId}.json`),
    path.resolve(process.cwd(), `contracts/deployments/${chainId}.json`),
    path.resolve(process.cwd(), `deployments/${chainId}.json`),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, "utf8");
        const parsed = JSON.parse(raw);
        return {
          chainId,
          vault: parsed.vault,
          bondPool: parsed.bondPool,
          token: parsed.token,
          owner: parsed.owner,
          examiner: parsed.examiner,
          underwriter: parsed.underwriter,
          adjudicator: parsed.adjudicator,
          agentKey: parsed.agentKey || DEFAULT_ANVIL_ADDRESSES.agentKey,
        };
      } catch {
        // continue
      }
    }
  }

  return DEFAULT_ANVIL_ADDRESSES;
}

export function getPublicClient(): any {
  const { chainId, name, rpcUrl } = getChainConfig();
  const customChain = defineChain({
    id: chainId,
    name,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
  });

  return createPublicClient({
    chain: customChain,
    transport: http(rpcUrl, {
      timeout: 4000,
    }),
  });
}

export function serializeBigInt<T>(obj: T): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export interface VaultStateResponse {
  chainId: number;
  chainName: string;
  isLiveRpc: boolean;
  addresses: {
    vault: string;
    bondPool: string;
    token: string;
  };
  balances: {
    vaultUSDC: string;
    vaultRaw: string;
    reserveFloorUSDC: string;
    reserveFloorRaw: string;
  };
  mandate: {
    vendorCount: number;
    challengePeriodSeconds: number;
    recipientCooldownSeconds: number;
    ownerCeilings: {
      perTxUSDC: string;
      perWindowUSDC: string;
      t2PerTxUSDC: string;
    };
  };
  qualification: {
    qualId: string;
    active: boolean;
    agentKey: string;
    configHash: string;
    t1MaxPerTxUSDC: string;
    t1MaxPerWindowUSDC: string;
    t2MaxPerTxUSDC: string;
    t2Allowed: boolean;
    expiresAt: number;
    activatedAt: number;
  };
  meter: {
    windowSpendUSDC: string;
    windowSpendRaw: string;
    currentExposureUSDC: string;
    currentExposureRaw: string;
    bondRemainingUSDC: string;
    bondRemainingRaw: string;
    bondLockedUSDC: string;
    bondFreeUSDC: string;
    exposureRatioPercent: number;
  };
}

export async function fetchLiveVaultState(): Promise<VaultStateResponse> {
  const { chainId, name } = getChainConfig();
  const deployments = loadDeployment(chainId);
  const client = getPublicClient();

  const fallbackState: VaultStateResponse = {
    chainId,
    chainName: name,
    isLiveRpc: false,
    addresses: {
      vault: deployments.vault || DEFAULT_ANVIL_ADDRESSES.vault,
      bondPool: deployments.bondPool || DEFAULT_ANVIL_ADDRESSES.bondPool,
      token: deployments.token || DEFAULT_ANVIL_ADDRESSES.token,
    },
    balances: {
      vaultUSDC: "5,000.00",
      vaultRaw: "5000000000",
      reserveFloorUSDC: "500.00",
      reserveFloorRaw: "500000000",
    },
    mandate: {
      vendorCount: 6,
      challengePeriodSeconds: 300,
      recipientCooldownSeconds: 300,
      ownerCeilings: {
        perTxUSDC: "300.00",
        perWindowUSDC: "1,000.00",
        t2PerTxUSDC: "2,000.00",
      },
    },
    qualification: {
      qualId: "0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701",
      active: true,
      agentKey: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      configHash: "0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab",
      t1MaxPerTxUSDC: "180.00",
      t1MaxPerWindowUSDC: "180.00",
      t2MaxPerTxUSDC: "2,000.00",
      t2Allowed: true,
      expiresAt: Math.floor(Date.now() / 1000) + 14 * 86400,
      activatedAt: Math.floor(Date.now() / 1000) - 3600,
    },
    meter: {
      windowSpendUSDC: "42.50",
      windowSpendRaw: "42500000",
      currentExposureUSDC: "42.50",
      currentExposureRaw: "42500000",
      bondRemainingUSDC: "2,000.00",
      bondRemainingRaw: "2000000000",
      bondLockedUSDC: "2,000.00",
      bondFreeUSDC: "0.00",
      exposureRatioPercent: 23.6,
    },
  };

  if (!deployments.vault) {
    return fallbackState;
  }

  try {
    const vaultAddr = deployments.vault;
    const tokenAddr = deployments.token;

    await client.getBlockNumber();

    const reserveFloorRaw = (await client.readContract({
      address: vaultAddr,
      abi: UnderwriteVaultAbi,
      functionName: "reserveFloor",
    })) as bigint;

    let vaultBalanceRaw = 5000000000n;
    if (tokenAddr) {
      vaultBalanceRaw = (await client.readContract({
        address: tokenAddr,
        abi: MockUSDCAbi,
        functionName: "balanceOf",
        args: [vaultAddr],
      })) as bigint;
    }

    return {
      ...fallbackState,
      isLiveRpc: true,
      balances: {
        vaultUSDC: formatUnits(vaultBalanceRaw, 6),
        vaultRaw: vaultBalanceRaw.toString(),
        reserveFloorUSDC: formatUnits(reserveFloorRaw, 6),
        reserveFloorRaw: reserveFloorRaw.toString(),
      },
    };
  } catch {
    return fallbackState;
  }
}
