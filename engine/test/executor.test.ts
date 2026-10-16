import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
  encodeEventTopics,
} from 'viem';
import { TransactionExecutor } from '../src/executor/executor.js';
import { AgentSigner } from '../src/signer/signer.js';
import { UnderwriteVaultAbi } from '../src/chain/abi/UnderwriteVault.js';

describe('TransactionExecutor with receipt verification (P3-T09)', () => {
  const pk = generatePrivateKey();
  const signer = new AgentSigner(pk);
  const vaultAddress: Address = '0x38461fd5B7421cE286bDD337255e55a41A9D6C1A';
  const recipient: Address = '0x1111111111111111111111111111111111111111';
  const amount = 100_000_000n;
  const invoiceKey: Hex = '0x' + 'aa'.repeat(32);
  const memoHash: Hex = '0x' + 'bb'.repeat(32);

  const payParams = { recipient, amount, invoiceKey, memoHash };

  it('marks EXECUTED only when success receipt contains matching PaymentExecuted event', async () => {
    // Generate valid PaymentExecuted event topics and data
    // PaymentExecuted(uint256 indexed paymentId, bytes32 indexed qualId, address indexed recipient, uint256 amount, bytes32 invoiceKey, uint8 tier)
    const topics = encodeEventTopics({
      abi: UnderwriteVaultAbi,
      eventName: 'PaymentExecuted',
      args: {
        paymentId: 42n,
        qualId: '0x' + '11'.repeat(32),
        recipient,
      },
    });

    const mockReceipt = {
      status: 'success' as const,
      blockNumber: 12345n,
      logs: [
        {
          address: vaultAddress,
          topics,
          // data: amount (32 bytes) + invoiceKey (32 bytes) + tier (32 bytes)
          data:
            '0x' +
            amount.toString(16).padStart(64, '0') +
            invoiceKey.slice(2) +
            (1).toString(16).padStart(64, '0'),
        },
      ],
    };

    const mockPublicClient = {
      waitForTransactionReceipt: async () => mockReceipt,
    };

    const mockWalletClient = {
      chain: { id: 31337 },
      writeContract: async () => '0x' + '99'.repeat(32) as Hex,
    };

    const executor = new TransactionExecutor(
      mockPublicClient as any,
      mockWalletClient as any,
      vaultAddress
    );

    const record = await executor.executeT1('prop-1', signer, payParams);
    expect(record.status).toBe('EXECUTED');
    expect(record.paymentId).toBe(42n);
    expect(record.blockNumber).toBe(12345n);
    expect(record.txHash).toBe('0x' + '99'.repeat(32));
  });

  it('rejects execution (NOT marked EXECUTED) if success receipt lacks matching PaymentExecuted event', async () => {
    // Receipt has status: 'success' but NO PaymentExecuted event
    const mockReceipt = {
      status: 'success' as const,
      blockNumber: 12345n,
      logs: [], // Empty logs!
    };

    const mockPublicClient = {
      waitForTransactionReceipt: async () => mockReceipt,
    };

    const mockWalletClient = {
      chain: { id: 31337 },
      writeContract: async () => '0x' + '88'.repeat(32) as Hex,
    };

    const executor = new TransactionExecutor(
      mockPublicClient as any,
      mockWalletClient as any,
      vaultAddress
    );

    const record = await executor.executeT1('prop-2', signer, payParams);
    expect(record.status).toBe('REVERTED');
    expect(record.revertError).toBe('MISSING_MATCHING_PAYMENT_EXECUTED_EVENT');
  });

  it('records REVERTED with decoded error when transaction reverts on chain', async () => {
    const mockReceipt = {
      status: 'reverted' as const,
      blockNumber: 12345n,
      logs: [],
    };

    const mockPublicClient = {
      waitForTransactionReceipt: async () => mockReceipt,
    };

    const mockWalletClient = {
      chain: { id: 31337 },
      writeContract: async () => '0x' + '77'.repeat(32) as Hex,
    };

    const executor = new TransactionExecutor(
      mockPublicClient as any,
      mockWalletClient as any,
      vaultAddress
    );

    const record = await executor.executeT1('prop-3', signer, payParams);
    expect(record.status).toBe('REVERTED');
    expect(record.revertError).toBe('TransactionRevertedOnChain');
  });

  it('records SUBMIT_FAILED after 3 failed retry attempts', async () => {
    let callCount = 0;
    const mockWalletClient = {
      chain: { id: 31337 },
      writeContract: async () => {
        callCount++;
        throw new Error('Network timeout');
      },
    };

    const executor = new TransactionExecutor(
      {} as any,
      mockWalletClient as any,
      vaultAddress,
      { maxRetries: 3, initialBackoffMs: 10 }
    );

    const record = await executor.executeT1('prop-4', signer, payParams);
    expect(callCount).toBe(3);
    expect(record.status).toBe('SUBMIT_FAILED');
    expect(record.revertError).toMatch(/Network timeout/);
  });
});
