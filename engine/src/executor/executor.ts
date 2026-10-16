import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
  parseEventLogs,
} from 'viem';
import { UnderwriteVaultAbi } from '../chain/abi/UnderwriteVault.js';
import { decodeContractError } from '../chain/errors.js';
import { AgentSigner, PayCallParams } from '../signer/signer.js';
import { TxRecord } from '../types/models.js';

export interface ExecutorOptions {
  maxRetries?: number;
  initialBackoffMs?: number;
  gasLimit?: bigint;
}

export class TransactionExecutor {
  constructor(
    public readonly publicClient: PublicClient,
    public readonly walletClient: WalletClient<Transport, Chain, Account>,
    public readonly vaultAddress: Address,
    public readonly defaultOptions: ExecutorOptions = { maxRetries: 3, initialBackoffMs: 200 }
  ) {}

  /**
   * Executes a T1 instant payment with receipt and PaymentExecuted event verification.
   */
  public async executeT1(
    proposalId: string,
    signer: AgentSigner,
    params: PayCallParams,
    options?: ExecutorOptions
  ): Promise<TxRecord> {
    return this._executeWithRetry(proposalId, 'T1', async (gas) => {
      return signer.signAndSendPay(this.walletClient, this.vaultAddress, params, gas);
    }, params, options);
  }

  /**
   * Executes a T2 delayed payment request.
   */
  public async executeT2(
    proposalId: string,
    signer: AgentSigner,
    params: PayCallParams,
    options?: ExecutorOptions
  ): Promise<TxRecord> {
    return this._executeWithRetry(proposalId, 'T2', async (gas) => {
      return signer.signAndSendRequestPayment(this.walletClient, this.vaultAddress, params, gas);
    }, params, options);
  }

  private async _executeWithRetry(
    proposalId: string,
    tier: 'T1' | 'T2',
    sendFn: (gas?: bigint) => Promise<Hex>,
    params: PayCallParams,
    options?: ExecutorOptions
  ): Promise<TxRecord> {
    const maxRetries = options?.maxRetries ?? this.defaultOptions.maxRetries ?? 3;
    const initialBackoff = options?.initialBackoffMs ?? this.defaultOptions.initialBackoffMs ?? 200;
    const gasLimit = options?.gasLimit ?? this.defaultOptions.gasLimit;

    let lastError: Error | undefined;
    let txHash: Hex | undefined;

    // Submission with retry and exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        txHash = await sendFn(gasLimit);
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Check if error is a contract revert (starts with custom error data)
        const errorData = (err as { data?: Hex })?.data;
        if (errorData) {
          const decoded = decodeContractError(errorData);
          return {
            proposalId,
            tier,
            status: 'REVERTED',
            revertError: decoded ? decoded.errorName : 'ContractReverted',
          };
        }
        if (attempt < maxRetries) {
          const delay = initialBackoff * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!txHash) {
      return {
        proposalId,
        tier,
        status: 'SUBMIT_FAILED',
        revertError: lastError?.message || 'Submission failed after retries',
      };
    }

    // Wait for receipt
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status === 'reverted') {
        return {
          proposalId,
          tier,
          txHash,
          status: 'REVERTED',
          blockNumber: receipt.blockNumber,
          revertError: 'TransactionRevertedOnChain',
        };
      }

      // Check success receipt
      if (receipt.status === 'success') {
        if (tier === 'T1') {
          // Rule 6: Never mark payment executed without matching decoded PaymentExecuted event
          const logs = parseEventLogs({
            abi: UnderwriteVaultAbi,
            eventName: 'PaymentExecuted',
            logs: receipt.logs,
          });

          const matchingEvent = logs.find((l) => {
            const args = l.args as {
              recipient: Address;
              amount: bigint;
              invoiceKey: Hex;
              paymentId: bigint;
            };
            return (
              args.recipient.toLowerCase() === params.recipient.toLowerCase() &&
              args.amount === params.amount &&
              args.invoiceKey.toLowerCase() === params.invoiceKey.toLowerCase()
            );
          });

          if (!matchingEvent) {
            return {
              proposalId,
              tier,
              txHash,
              status: 'REVERTED',
              blockNumber: receipt.blockNumber,
              revertError: 'MISSING_MATCHING_PAYMENT_EXECUTED_EVENT',
            };
          }

          const args = matchingEvent.args as { paymentId: bigint };
          return {
            proposalId,
            tier,
            txHash,
            status: 'EXECUTED',
            paymentId: args.paymentId,
            blockNumber: receipt.blockNumber,
          };
        } else {
          // T2 requestPayment emits PaymentRequested
          const logs = parseEventLogs({
            abi: UnderwriteVaultAbi,
            eventName: 'PaymentRequested',
            logs: receipt.logs,
          });

          if (logs.length === 0) {
            return {
              proposalId,
              tier,
              txHash,
              status: 'REVERTED',
              blockNumber: receipt.blockNumber,
              revertError: 'MISSING_PAYMENT_REQUESTED_EVENT',
            };
          }

          const args = logs[0].args as { id: bigint };
          return {
            proposalId,
            tier,
            txHash,
            status: 'PENDING',
            paymentId: args.id,
            blockNumber: receipt.blockNumber,
          };
        }
      }

      return {
        proposalId,
        tier,
        txHash,
        status: 'SUBMIT_FAILED',
        revertError: 'Unknown receipt status',
      };
    } catch (err: unknown) {
      return {
        proposalId,
        tier,
        txHash,
        status: 'SUBMIT_FAILED',
        revertError: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
