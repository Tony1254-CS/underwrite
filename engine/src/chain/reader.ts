import {
  type Address,
  type Hex,
  type PublicClient,
  type Transport,
  type Chain,
} from 'viem';
import { UnderwriteVaultAbi } from './abi/UnderwriteVault.js';
import { BondPoolAbi } from './abi/BondPool.js';
import { MockUSDCAbi } from './abi/MockUSDC.js';

export interface ChainAddresses {
  vault: Address;
  bondPool?: Address;
  token?: Address;
}

export interface StoredQualView {
  qualId: Hex;
  active: boolean;
  revoked: boolean;
  activatedAt: bigint;
  effectiveT1MaxPerTx: bigint;
  effectiveT1MaxPerWindow: bigint;
  effectiveT2MaxPerTx: bigint;
  expiresAt: bigint;
  t2Allowed: boolean;
  configHash: Hex;
  agentKey: Address;
  attestation: {
    qualId: Hex;
    vault: Address;
    agentKey: Address;
    configHash: Hex;
    reportHash: Hex;
    corpusHash: Hex;
    examCommitId: bigint;
    ownerInputsHash: Hex;
    t1MaxPerTx: bigint;
    t1MaxPerWindow: bigint;
    t2MaxPerTx: bigint;
    t2Allowed: boolean;
    issuedAt: bigint;
    expiresAt: bigint;
    examiner: Address;
  };
}

export interface RecipientView {
  active: boolean;
  perWindowCap: bigint;
  activatesAt: bigint;
}

export class ChainReader {
  public readonly publicClient: PublicClient<Transport, Chain>;
  public readonly vault: Address;
  public readonly bondPool?: Address;
  public readonly token?: Address;

  constructor(publicClient: PublicClient<Transport, Chain>, addresses: ChainAddresses) {
    this.publicClient = publicClient;
    this.vault = addresses.vault;
    this.bondPool = addresses.bondPool;
    this.token = addresses.token;
  }

  public async getOwner(): Promise<Address> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'owner',
    }) as Promise<Address>;
  }

  public async getVersion(): Promise<string> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'VERSION',
    }) as Promise<string>;
  }

  public async isPaused(): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'paused',
    }) as Promise<boolean>;
  }

  public async getReserveFloor(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'reserveFloor',
    }) as Promise<bigint>;
  }

  public async getCeilings(): Promise<{
    perTx: bigint;
    perWindow: bigint;
    t2PerTx: bigint;
  }> {
    const res = (await this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'ceilings',
    })) as [bigint, bigint, bigint];
    return {
      perTx: res[0],
      perWindow: res[1],
      t2PerTx: res[2],
    };
  }

  public async getActiveQualOf(agentKey: Address): Promise<Hex> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'activeQualOf',
      args: [agentKey],
    }) as Promise<Hex>;
  }

  public async getQualification(qualId: Hex): Promise<StoredQualView | undefined> {
    try {
      const q = (await this.publicClient.readContract({
        address: this.vault,
        abi: UnderwriteVaultAbi,
        functionName: 'getQualification',
        args: [qualId],
      })) as {
        attestation: {
          qualId: Hex;
          vault: Address;
          agentKey: Address;
          configHash: Hex;
          reportHash: Hex;
          corpusHash: Hex;
          examCommitId: bigint;
          ownerInputsHash: Hex;
          t1MaxPerTx: bigint;
          t1MaxPerWindow: bigint;
          t2MaxPerTx: bigint;
          t2Allowed: boolean;
          issuedAt: bigint;
          expiresAt: bigint;
          examiner: Address;
        };
        active: boolean;
        revoked: boolean;
        activatedAt: bigint;
        effectiveT1MaxPerTx: bigint;
        effectiveT1MaxPerWindow: bigint;
        effectiveT2MaxPerTx: bigint;
      };

      if (!q || q.attestation.qualId === '0x' + '00'.repeat(32)) {
        return undefined;
      }

      return {
        qualId: q.attestation.qualId,
        active: q.active,
        revoked: q.revoked,
        activatedAt: q.activatedAt,
        effectiveT1MaxPerTx: q.effectiveT1MaxPerTx,
        effectiveT1MaxPerWindow: q.effectiveT1MaxPerWindow,
        effectiveT2MaxPerTx: q.effectiveT2MaxPerTx,
        expiresAt: q.attestation.expiresAt,
        t2Allowed: q.attestation.t2Allowed,
        configHash: q.attestation.configHash,
        agentKey: q.attestation.agentKey,
        attestation: q.attestation,
      };
    } catch {
      return undefined;
    }
  }

  public async getExposure(qualId: Hex): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'exposure',
      args: [qualId],
    }) as Promise<bigint>;
  }

  public async getQualWindowSpent(qualId: Hex, windowId: bigint): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'qualWindowSpent',
      args: [qualId, windowId],
    }) as Promise<bigint>;
  }

  public async getRecipientWindowSpent(recipient: Address, windowId: bigint): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'recipientWindowSpent',
      args: [recipient, windowId],
    }) as Promise<bigint>;
  }

  public async getRecipient(recipient: Address): Promise<RecipientView> {
    const res = (await this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'recipients',
      args: [recipient],
    })) as [boolean, bigint, bigint];
    return {
      active: res[0],
      perWindowCap: res[1],
      activatesAt: res[2],
    };
  }

  public async getInvoiceState(invoiceKey: Hex): Promise<number> {
    return this.publicClient.readContract({
      address: this.vault,
      abi: UnderwriteVaultAbi,
      functionName: 'invoiceState',
      args: [invoiceKey],
    }) as Promise<number>;
  }

  public async getVaultTokenBalance(): Promise<bigint> {
    if (!this.token) {
      const tokenAddr = (await this.publicClient.readContract({
        address: this.vault,
        abi: UnderwriteVaultAbi,
        functionName: 'token',
      })) as Address;
      return this.publicClient.readContract({
        address: tokenAddr,
        abi: MockUSDCAbi,
        functionName: 'balanceOf',
        args: [this.vault],
      }) as Promise<bigint>;
    }
    return this.publicClient.readContract({
      address: this.token,
      abi: MockUSDCAbi,
      functionName: 'balanceOf',
      args: [this.vault],
    }) as Promise<bigint>;
  }

  public async getBondRemaining(qualId: Hex): Promise<bigint> {
    let poolAddr = this.bondPool;
    if (!poolAddr) {
      poolAddr = (await this.publicClient.readContract({
        address: this.vault,
        abi: UnderwriteVaultAbi,
        functionName: 'bondPool',
      })) as Address;
    }
    return this.publicClient.readContract({
      address: poolAddr,
      abi: BondPoolAbi,
      functionName: 'remaining',
      args: [qualId],
    }) as Promise<bigint>;
  }
}
