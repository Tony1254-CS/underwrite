import {
  encodeFunctionData,
  type Address,
  type Hex,
  type Account,
  type WalletClient,
  type Transport,
  type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { UnderwriteVaultAbi } from '../chain/abi/UnderwriteVault.js';
import { ChainReader } from '../chain/reader.js';

export interface PayCallParams {
  recipient: Address;
  amount: bigint;
  invoiceKey: Hex;
  memoHash: Hex;
}

export class AgentSigner {
  private readonly account: Account;

  constructor(private readonly privateKey: Hex) {
    this.account = privateKeyToAccount(privateKey);
  }

  public get address(): Address {
    return this.account.address;
  }

  /**
   * Verifies that the agent key has an active qualification on-chain
   * whose configHash exactly matches the local expected configHash.
   * Throws CONFIG_DRIFT error if any mismatch is detected.
   */
  public async verifyConfiguration(
    reader: ChainReader,
    expectedConfigHash: Hex
  ): Promise<{ qualId: Hex; configHash: Hex }> {
    const qualId = await reader.getActiveQualOf(this.address);
    if (!qualId || qualId === '0x' + '00'.repeat(32)) {
      throw new Error(`NO_ACTIVE_QUALIFICATION: Agent key ${this.address} has no active qualification on chain`);
    }

    const qual = await reader.getQualification(qualId);
    if (!qual || !qual.active) {
      throw new Error(`QUALIFICATION_INACTIVE: Qualification ${qualId} is not active`);
    }

    if (qual.revoked) {
      throw new Error(`QUALIFICATION_REVOKED: Qualification ${qualId} is revoked`);
    }

    const onChainConfigHash = qual.attestation.configHash;
    if (onChainConfigHash.toLowerCase() !== expectedConfigHash.toLowerCase()) {
      throw new Error(
        `CONFIG_DRIFT: On-chain configHash (${onChainConfigHash}) does not match local manifest (${expectedConfigHash})`
      );
    }

    return { qualId, configHash: onChainConfigHash };
  }

  /**
   * Builds calldata ONLY for pay (T1).
   */
  public buildPayCalldata(params: PayCallParams): Hex {
    return encodeFunctionData({
      abi: UnderwriteVaultAbi,
      functionName: 'pay',
      args: [params.recipient, params.amount, params.invoiceKey, params.memoHash],
    });
  }

  /**
   * Builds calldata ONLY for requestPayment (T2).
   */
  public buildRequestPaymentCalldata(params: PayCallParams): Hex {
    return encodeFunctionData({
      abi: UnderwriteVaultAbi,
      functionName: 'requestPayment',
      args: [params.recipient, params.amount, params.invoiceKey, params.memoHash],
    });
  }

  /**
   * Signs and executes a pay transaction via wallet client.
   */
  public async signAndSendPay(
    walletClient: WalletClient<Transport, Chain, Account>,
    vaultAddress: Address,
    params: PayCallParams,
    gas?: bigint
  ): Promise<Hex> {
    return walletClient.writeContract({
      address: vaultAddress,
      abi: UnderwriteVaultAbi,
      functionName: 'pay',
      args: [params.recipient, params.amount, params.invoiceKey, params.memoHash],
      account: this.account,
      chain: walletClient.chain,
      ...(gas ? { gas } : {}),
    });
  }

  /**
   * Signs and executes a requestPayment transaction via wallet client.
   */
  public async signAndSendRequestPayment(
    walletClient: WalletClient<Transport, Chain, Account>,
    vaultAddress: Address,
    params: PayCallParams,
    gas?: bigint
  ): Promise<Hex> {
    return walletClient.writeContract({
      address: vaultAddress,
      abi: UnderwriteVaultAbi,
      functionName: 'requestPayment',
      args: [params.recipient, params.amount, params.invoiceKey, params.memoHash],
      account: this.account,
      chain: walletClient.chain,
      ...(gas ? { gas } : {}),
    });
  }
}
