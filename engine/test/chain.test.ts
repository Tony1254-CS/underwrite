import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvilChain } from '../src/chain/client.js';
import { ChainReader } from '../src/chain/reader.js';
import { extractAndDecodeError } from '../src/chain/errors.js';
import { UnderwriteVaultAbi } from '../src/chain/abi/UnderwriteVault.js';
import { BondPoolAbi } from '../src/chain/abi/BondPool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');

const ANVIL_PORT = 8555;
const RPC_URL = `http://127.0.0.1:${ANVIL_PORT}`;

// Anvil default accounts
const OWNER_PK: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account 0
const STRANGER_PK: Hex = '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'; // Account 9
const EXAMINER_ADDR: Address = '0x37bd563ad02C907Dc32A2B624e989CCa15f696aE';
const GUARDIAN_ADDR: Address = '0x768806D8334099cF9594b7c18B25dA54c28E85Ca';
const ADJUDICATOR_ADDR: Address = '0x6Bf37266F1Db79D5e194D5e2929dcA54aDe76Af9';

describe('Chain Layer against local Anvil (P3-T07)', () => {
  let anvilProcess: ChildProcess;
  let vaultAddress: Address;
  let bondPoolAddress: Address;
  let tokenAddress: Address;
  let reader: ChainReader;

  const publicClient = createPublicClient({
    chain: {
      ...anvilChain,
      rpcUrls: {
        default: { http: [RPC_URL] },
        public: { http: [RPC_URL] },
      },
    },
    transport: http(RPC_URL),
  });

  const ownerWallet = createWalletClient({
    account: privateKeyToAccount(OWNER_PK),
    chain: {
      ...anvilChain,
      rpcUrls: {
        default: { http: [RPC_URL] },
        public: { http: [RPC_URL] },
      },
    },
    transport: http(RPC_URL),
  });

  const strangerWallet = createWalletClient({
    account: privateKeyToAccount(STRANGER_PK),
    chain: {
      ...anvilChain,
      rpcUrls: {
        default: { http: [RPC_URL] },
        public: { http: [RPC_URL] },
      },
    },
    transport: http(RPC_URL),
  });

  beforeAll(async () => {
    // 1. Spawn local ephemeral Anvil instance
    anvilProcess = spawn('anvil', ['--port', String(ANVIL_PORT), '--silent'], {
      detached: false,
      stdio: 'ignore',
    });

    // 2. Wait until Anvil RPC is responsive
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        await publicClient.getBlockNumber();
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    if (!ready) {
      throw new Error(`Failed to start local Anvil on port ${ANVIL_PORT}`);
    }

    // 3. Load artifacts
    const usdcArtifact = JSON.parse(
      fs.readFileSync(
        path.join(rootDir, 'contracts/out/MockUSDC.sol/MockUSDC.json'),
        'utf8'
      )
    );
    const bondPoolArtifact = JSON.parse(
      fs.readFileSync(
        path.join(rootDir, 'contracts/out/BondPool.sol/BondPool.json'),
        'utf8'
      )
    );
    const vaultArtifact = JSON.parse(
      fs.readFileSync(
        path.join(rootDir, 'contracts/out/UnderwriteVault.sol/UnderwriteVault.json'),
        'utf8'
      )
    );

    // 4. Deploy MockUSDC
    const usdcDeployTx = await ownerWallet.deployContract({
      abi: usdcArtifact.abi,
      bytecode: usdcArtifact.bytecode.object,
      args: [],
    });
    const usdcReceipt = await publicClient.waitForTransactionReceipt({ hash: usdcDeployTx });
    tokenAddress = usdcReceipt.contractAddress!;

    // 5. Deploy BondPool
    const bondPoolDeployTx = await ownerWallet.deployContract({
      abi: bondPoolArtifact.abi,
      bytecode: bondPoolArtifact.bytecode.object,
      args: [
        ownerWallet.account.address, // underwriter
        ADJUDICATOR_ADDR, // adjudicator
        tokenAddress, // token
        5_000_000n, // deductible: 5 USDC
        500_000_000n, // perClaimCap: 500 USDC
        604800n, // claimGrace: 7 days
      ],
    });
    const bondPoolReceipt = await publicClient.waitForTransactionReceipt({ hash: bondPoolDeployTx });
    bondPoolAddress = bondPoolReceipt.contractAddress!;

    // 6. Deploy UnderwriteVault
    const vaultDeployTx = await ownerWallet.deployContract({
      abi: vaultArtifact.abi,
      bytecode: vaultArtifact.bytecode.object,
      args: [
        ownerWallet.account.address, // owner
        EXAMINER_ADDR, // examiner
        GUARDIAN_ADDR, // guardian
        bondPoolAddress, // bondPool
        tokenAddress, // token
        {
          perTx: 300_000_000n,
          perWindow: 1000_000_000n,
          t2PerTx: 2000_000_000n,
        },
        86400n, // windowSeconds
        500_000_000n, // reserveFloor: 500 USDC
        300n, // challengePeriod: 300 s
        300n, // recipientCooldown: 300 s
      ],
    });
    const vaultReceipt = await publicClient.waitForTransactionReceipt({ hash: vaultDeployTx });
    vaultAddress = vaultReceipt.contractAddress!;

    // 7. Link BondPool -> Vault
    const setVaultTx = await ownerWallet.writeContract({
      address: bondPoolAddress,
      abi: BondPoolAbi,
      functionName: 'setVault',
      args: [vaultAddress],
    });
    await publicClient.waitForTransactionReceipt({ hash: setVaultTx });

    // 8. Initialize ChainReader
    reader = new ChainReader(publicClient, {
      vault: vaultAddress,
      bondPool: bondPoolAddress,
      token: tokenAddress,
    });
  }, 15000);

  afterAll(() => {
    if (anvilProcess) {
      anvilProcess.kill();
    }
  });

  it('reads vault state through ChainReader', async () => {
    expect(await reader.getVersion()).toBe('1.0.0');
    expect(await reader.getOwner()).toBe(ownerWallet.account.address);
    expect(await reader.isPaused()).toBe(false);

    const ceilings = await reader.getCeilings();
    expect(ceilings.perTx).toBe(300_000_000n);
    expect(ceilings.perWindow).toBe(1000_000_000n);
    expect(ceilings.t2PerTx).toBe(2000_000_000n);

    expect(await reader.getReserveFloor()).toBe(500_000_000n);
    expect(await reader.getVaultTokenBalance()).toBe(0n);
  });

  it('decodes known custom errors from reverts', async () => {
    // Calling pay() from strangerWallet (not an agent) must revert with NotAgent()
    const dummyRecipient = '0x1111111111111111111111111111111111111111';
    const dummyKey = ('0x' + 'aa'.repeat(32)) as Hex;
    const dummyMemo = ('0x' + 'bb'.repeat(32)) as Hex;

    let caughtError: unknown;
    try {
      await publicClient.simulateContract({
        account: strangerWallet.account,
        address: vaultAddress,
        abi: UnderwriteVaultAbi,
        functionName: 'pay',
        args: [dummyRecipient, 100_000_000n, dummyKey, dummyMemo],
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    const decoded = extractAndDecodeError(caughtError);
    expect(decoded).toBeDefined();
    expect(decoded?.errorName).toBe('NotAgent');

    // Now pause the vault as owner
    const pauseTx = await ownerWallet.writeContract({
      address: vaultAddress,
      abi: UnderwriteVaultAbi,
      functionName: 'pause',
    });
    await publicClient.waitForTransactionReceipt({ hash: pauseTx });
    expect(await reader.isPaused()).toBe(true);

    // Once paused, even before checking NotAgent (per PV-09 order), it must revert with Paused()
    let pausedErr: unknown;
    try {
      await publicClient.simulateContract({
        account: strangerWallet.account,
        address: vaultAddress,
        abi: UnderwriteVaultAbi,
        functionName: 'pay',
        args: [dummyRecipient, 100_000_000n, dummyKey, dummyMemo],
      });
    } catch (err) {
      pausedErr = err;
    }

    expect(pausedErr).toBeDefined();
    const decodedPaused = extractAndDecodeError(pausedErr);
    expect(decodedPaused).toBeDefined();
    expect(decodedPaused?.errorName).toBe('Paused');
  });
});
