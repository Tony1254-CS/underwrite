import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  http,
  type Address,
  type Hex,
  defineChain,
} from "viem";
import { UnderwriteVaultAbi, BondPoolAbi, MockUSDCAbi } from "./abi";

export interface DeploymentAddresses {
  chainId: number;
  vault: Address;
  bondPool: Address;
  token: Address;
  owner?: Address;
  examiner?: Address;
  underwriter?: Address;
  adjudicator?: Address;
  agentKey?: Address;
}

const DEFAULT_ANVIL_ADDRESSES: DeploymentAddresses = {
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
  const isBaseSepolia = process.env.CHAIN === "base-sepolia";
  const chainId = isBaseSepolia ? 84532 : 31337;
  const name = isBaseSepolia ? "Base Sepolia" : "Anvil Local";
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";

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
    `d:/bbb/china/contracts/deployments/${chainId}.json`,
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
        // continue to next candidate
      }
    }
  }

  return DEFAULT_ANVIL_ADDRESSES;
}

export function getPublicClient() {
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
