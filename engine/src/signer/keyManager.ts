import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { type Address, type Hex } from 'viem';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../');
const keysDir = path.join(rootDir, '.keys');

export interface StoredKeyData {
  configHash: Hex;
  address: Address;
  privateKey: Hex;
  createdAt: string;
}

export function generateAgentKey(configHash: Hex): StoredKeyData {
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  const cleanHash = configHash.toLowerCase();
  const keyFilePath = path.join(keysDir, `${cleanHash}.json`);

  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const keyData: StoredKeyData = {
    configHash,
    address: account.address,
    privateKey,
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(keyFilePath, JSON.stringify(keyData, null, 2) + '\n', 'utf8');
  return keyData;
}

export function loadAgentKey(configHash: Hex): StoredKeyData {
  const cleanHash = configHash.toLowerCase();
  const keyFilePath = path.join(keysDir, `${cleanHash}.json`);

  if (!fs.existsSync(keyFilePath)) {
    throw new Error(`Agent key file not found for configHash: ${configHash} at ${keyFilePath}`);
  }

  const raw = fs.readFileSync(keyFilePath, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed as StoredKeyData;
}
