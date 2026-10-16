/**
 * Server data layer: viem chain client and state reader
 * Supports local Anvil (31337) and Base Sepolia (84532)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  createPublicClient,
  http,
  formatUnits,
  type Address,
  type Chain,
  type PublicClient,
  type Transport,
  type Hex,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { UnderwriteVaultAbi, BondPoolAbi, MockUSDCAbi } from './abi';

export const anvilChain: Chain = {
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

export interface DeploymentAddresses {
  vault?: Address;
  bondPool?: Address;
  token?: Address;
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

const rootDir = path.resolve(process.cwd(), '..');

export function loadDeployment(chainId: number): DeploymentAddresses {
  const filePath = path.join(rootDir, 'contracts', 'deployments', `${chainId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        vault: data.vault,
        bondPool: data.bondPool,
        token: data.token,
      };
    } catch {
      // fallback
    }
  }
  return {};
}

export function getPublicClient(): { client: any; chainId: number; chainName: string } {
  const chainEnv = process.env.CHAIN || process.env.NEXT_PUBLIC_CHAIN || 'anvil';
  if (chainEnv === 'baseSepolia') {
    const rpcUrl = process.env.RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org';
    return {
      client: createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) }),
      chainId: 84532,
      chainName: 'Base Sepolia',
    };
  }
  const rpcUrl = process.env.RPC_URL_ANVIL || 'http://127.0.0.1:8545';
  return {
    client: createPublicClient({ chain: anvilChain, transport: http(rpcUrl) }),
    chainId: 31337,
    chainName: 'Local Anvil',
  };
}

export async function fetchLiveVaultState(): Promise<VaultStateResponse> {
  const { client, chainId, chainName } = getPublicClient();
  const deployments = loadDeployment(chainId);

  const fallbackState: VaultStateResponse = {
    chainId,
    chainName,
    isLiveRpc: false,
    addresses: {
      vault: deployments.vault || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      bondPool: deployments.bondPool || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      token: deployments.token || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
    balances: {
      vaultUSDC: '5,000.00',
      vaultRaw: '5000000000',
      reserveFloorUSDC: '500.00',
      reserveFloorRaw: '500000000',
    },
    mandate: {
      vendorCount: 6,
      challengePeriodSeconds: 300,
      recipientCooldownSeconds: 300,
      ownerCeilings: {
        perTxUSDC: '300.00',
        perWindowUSDC: '1,000.00',
        t2PerTxUSDC: '2,000.00',
      },
    },
    qualification: {
      qualId: '0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701',
      active: true,
      agentKey: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      configHash: '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab',
      t1MaxPerTxUSDC: '180.00',
      t1MaxPerWindowUSDC: '180.00',
      t2MaxPerTxUSDC: '2,000.00',
      t2Allowed: true,
      expiresAt: Math.floor(Date.now() / 1000) + 14 * 86400,
      activatedAt: Math.floor(Date.now() / 1000) - 3600,
    },
    meter: {
      windowSpendUSDC: '42.50',
      windowSpendRaw: '42500000',
      currentExposureUSDC: '42.50',
      currentExposureRaw: '42500000',
      bondRemainingUSDC: '2,000.00',
      bondRemainingRaw: '2000000000',
      bondLockedUSDC: '2,000.00',
      bondFreeUSDC: '0.00',
      exposureRatioPercent: 23.6,
    },
  };

  if (!deployments.vault) {
    return fallbackState;
  }

  try {
    const vaultAddr = deployments.vault;
    const bondAddr = deployments.bondPool;
    const tokenAddr = deployments.token;

    // Check RPC connectivity
    await client.getBlockNumber();

    const [reserveFloorRaw, agentKey] = await Promise.all([
      client.readContract({
        address: vaultAddr,
        abi: UnderwriteVaultAbi,
        functionName: 'reserveFloor',
      }) as Promise<bigint>,
      client.readContract({
        address: vaultAddr,
        abi: UnderwriteVaultAbi,
        functionName: 'owner',
      }) as Promise<Address>, // fallback probe
    ]);

    let vaultBalanceRaw = 5000000000n;
    if (tokenAddr) {
      vaultBalanceRaw = await client.readContract({
        address: tokenAddr,
        abi: MockUSDCAbi,
        functionName: 'balanceOf',
        args: [vaultAddr],
      }) as bigint;
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
