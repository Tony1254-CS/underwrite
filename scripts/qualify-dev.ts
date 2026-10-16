import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Hex, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { qualifyAgent } from '../engine/test/helpers/qualify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  const deploymentFile = path.join(rootDir, 'contracts', 'deployments', '31337.json');
  if (!fs.existsSync(deploymentFile)) {
    console.error(`Error: Deployment file not found at ${deploymentFile}. Run deploy script first.`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const vaultAddress = deployment.vault as Address;

  // Anvil test keys
  const ownerPk = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as Hex; // Account 1
  const examinerPk = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' as Hex; // Account 2
  const agentPk = '0x8b3a350cf5c34c9194ca8582f6427fa75f8163ab4b87854631e140d211019f78' as Hex; // Account 5
  const agentKey = privateKeyToAccount(agentPk).address;

  const configHash = ('0x' + '1'.repeat(64)) as Hex;
  const corpusHash = ('0x' + 'c'.repeat(64)) as Hex;

  console.log(`Activating test qualification for agent ${agentKey} on vault ${vaultAddress}...`);

  const result = await qualifyAgent({
    vaultAddress,
    agentKey,
    configHash,
    corpusHash,
    examinerPrivateKey: examinerPk,
    ownerPrivateKey: ownerPk,
    t1MaxPerTx: 180_000_000n,
    t1MaxPerWindow: 500_000_000n,
    t2MaxPerTx: 1000_000_000n,
    t2Allowed: true,
  });

  console.log(`Qualification activated successfully!`);
  console.log(`Qual ID: ${result.qualId}`);
  console.log(`Exam Commit ID: ${result.examCommitId}`);
  console.log(`Activation Tx: ${result.activationTxHash}`);
}

main().catch((err) => {
  console.error('Failed to qualify agent:', err);
  process.exit(1);
});
