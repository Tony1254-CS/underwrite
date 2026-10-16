import {
  type Address,
  type Hex,
  type WalletClient,
  type PublicClient,
  type Transport,
  type Chain,
  type Account,
  type Hash,
} from 'viem';
import { UnderwriteVaultAbi } from './abi/UnderwriteVault.js';

export interface SendPaymentOptions {
  vault: Address;
  recipient: Address;
  amount: bigint;
  invoiceKey: Hex;
  memoHash: Hex;
  explicitGasLimit?: bigint;
}

/**
 * Sends a T1 pay transaction with optional explicit gas limit (PV-19).
 */
export async function sendPayTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  options: SendPaymentOptions
): Promise<Hash> {
  const request: Record<string, unknown> = {
    address: options.vault,
    abi: UnderwriteVaultAbi,
    functionName: 'pay',
    args: [options.recipient, options.amount, options.invoiceKey, options.memoHash],
    account: walletClient.account,
  };

  if (options.explicitGasLimit !== undefined) {
    request.gas = options.explicitGasLimit;
  }

  return (walletClient.writeContract as (args: unknown) => Promise<Hash>)(request);
}

/**
 * Sends a T2 requestPayment transaction with optional explicit gas limit (PV-19).
 */
export async function sendRequestPaymentTransaction(
  walletClient: WalletClient<Transport, Chain, Account>,
  options: SendPaymentOptions
): Promise<Hash> {
  const request: Record<string, unknown> = {
    address: options.vault,
    abi: UnderwriteVaultAbi,
    functionName: 'requestPayment',
    args: [options.recipient, options.amount, options.invoiceKey, options.memoHash],
    account: walletClient.account,
  };

  if (options.explicitGasLimit !== undefined) {
    request.gas = options.explicitGasLimit;
  }

  return (walletClient.writeContract as (args: unknown) => Promise<Hash>)(request);
}

/**
 * Waits for transaction receipt and checks execution outcome.
 */
export async function waitForReceipt(
  publicClient: PublicClient<Transport, Chain>,
  hash: Hash
) {
  return publicClient.waitForTransactionReceipt({ hash });
}
