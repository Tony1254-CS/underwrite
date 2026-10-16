import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Account,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../');

export const anvilChain: Chain = {
  id: 31337,
  name: 'Anvil',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

export type SupportedChainName = 'anvil' | 'baseSepolia';

export interface DeploymentAddresses {
  vault: Address;
  bondPool: Address;
  token: Address;
}

export function getChainConfig(chainName: SupportedChainName = 'anvil'): {
  chain: Chain;
  rpcUrl: string;
} {
  if (chainName === 'baseSepolia') {
    const rpcUrl = process.env.RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org';
    return { chain: baseSepolia, rpcUrl };
  }
  const rpcUrl = process.env.RPC_URL_ANVIL || 'http://127.0.0.1:8545';
  return { chain: anvilChain, rpcUrl };
}

export function createChainPublicClient(
  chainName: SupportedChainName = 'anvil'
): PublicClient<Transport, Chain> {
  const { chain, rpcUrl } = getChainConfig(chainName);
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

export function createChainWalletClient(
  privateKey: `0x${string}`,
  chainName: SupportedChainName = 'anvil'
): WalletClient<Transport, Chain, Account> {
  const { chain, rpcUrl } = getChainConfig(chainName);
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}

export function loadDeployments(chainId: number): DeploymentAddresses | undefined {
  const deploymentPath = path.join(rootDir, 'contracts', 'deployments', `${chainId}.json`);
  if (!fs.existsSync(deploymentPath)) {
    return undefined;
  }
  try {
    const raw = fs.readFileSync(deploymentPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      vault: parsed.vault,
      bondPool: parsed.bondPool,
      token: parsed.token,
    };
  } catch {
    return undefined;
  }
}
