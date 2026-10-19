import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const envPath = path.join(rootDir, ".env");

for (const sourceLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = sourceLine.trim();
  if (!line || line.startsWith("#")) continue;
  const separator = line.indexOf("=");
  if (separator > 0)
    process.env[line.slice(0, separator)] ??= line.slice(separator + 1).trim();
}

function key(name: string): Hex {
  const value = process.env[name];
  if (!value || !/^0x[0-9a-fA-F]{64}$/.test(value))
    throw new Error(`${name} missing or invalid`);
  return value as Hex;
}

const rpcUrl = process.env.RPC_URL_BASE_SEPOLIA || "https://sepolia.base.org";
const deployer = privateKeyToAccount(key("DEPLOYER_PRIVATE_KEY"));
const recipients = ["OWNER", "EXAMINER", "UNDERWRITER", "AGENT"].map(
  (role) => ({
    role,
    address: privateKeyToAccount(key(`${role}_PRIVATE_KEY`)).address,
  })
);
// Base Sepolia currently charges a very small L2 gas price. Keep most of the
// faucet allocation with the deployer while giving each transaction-sending
// role enough gas for the controlled evidence run.
const amountPerRole = parseEther("0.0001");
const reserve = parseEther("0.0004");

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account: deployer,
  chain: baseSepolia,
  transport: http(rpcUrl),
});
const chainId = await publicClient.getChainId();
if (chainId !== 84532) throw new Error(`Wrong chain: ${chainId}`);

const balance = await publicClient.getBalance({ address: deployer.address });
const required = amountPerRole * BigInt(recipients.length) + reserve;
console.log(
  `Deployer ${deployer.address}: ${formatEther(balance)} Base Sepolia ETH`
);
if (balance < required) {
  throw new Error(
    `Need at least ${formatEther(required)} Base Sepolia ETH before role funding`
  );
}

for (const recipient of recipients) {
  const existing = await publicClient.getBalance({
    address: recipient.address,
  });
  if (existing >= amountPerRole) {
    console.log(
      `${recipient.role}: already funded (${formatEther(existing)} ETH)`
    );
    continue;
  }
  const hash = await walletClient.sendTransaction({
    to: recipient.address,
    value: amountPerRole - existing,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success")
    throw new Error(`${recipient.role} funding reverted: ${hash}`);
  console.log(`${recipient.role}: funded in ${hash}`);
}
