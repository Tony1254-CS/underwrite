import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const envPath = path.join(rootDir, ".env");

if (fs.existsSync(envPath)) {
  throw new Error(`Refusing to overwrite existing secret file: ${envPath}`);
}

const roles = [
  "DEPLOYER",
  "OWNER",
  "EXAMINER",
  "UNDERWRITER",
  "ADJUDICATOR",
  "GUARDIAN",
  "AGENT",
] as const;

const generated = roles.map((role) => {
  const privateKey = generatePrivateKey();
  return {
    role,
    privateKey,
    address: privateKeyToAccount(privateKey).address,
  };
});

const envLines = [
  "# Generated test-only Base Sepolia wallets. Never commit or share this file.",
  "RPC_URL_BASE_SEPOLIA=https://sepolia.base.org",
  "RPC_URL_BASE_SEPOLIA_SECONDARY=",
  "BASESCAN_API_KEY=",
  "",
  ...generated.map(
    ({ role, privateKey }) => `${role}_PRIVATE_KEY=${privateKey}`
  ),
  "",
];

fs.writeFileSync(envPath, envLines.join("\n"), {
  encoding: "utf8",
  mode: 0o600,
});

console.log(
  "Created .env with new test-only wallets. Fund these public addresses with Base Sepolia ETH:"
);
for (const { role, address } of generated) {
  console.log(`${role}: ${address}`);
}
console.log(
  "Private keys were written only to the gitignored .env file and were not printed."
);
