import {
  type Address,
  type Hex,
  encodeAbiParameters,
  keccak256,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createChainPublicClient,
  createChainWalletClient,
  type SupportedChainName,
} from '../chain/client.js';
import { UnderwriteVaultAbi } from '../chain/abi/UnderwriteVault.js';

export interface QualificationParams {
  vaultAddress: Address;
  agentKey: Address;
  configHash: Hex;
  corpusHash: Hex;
  reportHash?: Hex;
  ownerInputsHash?: Hex;
  t1MaxPerTx?: bigint;
  t1MaxPerWindow?: bigint;
  t2MaxPerTx?: bigint;
  t2Allowed?: boolean;
  issuedAt?: bigint;
  expiresAt?: bigint;
  examinerPrivateKey: Hex;
  ownerPrivateKey: Hex;
  chainName?: SupportedChainName;
}

export const ATTESTATION_TYPES = {
  QualificationAttestation: [
    { name: 'qualId', type: 'bytes32' },
    { name: 'vault', type: 'address' },
    { name: 'agentKey', type: 'address' },
    { name: 'configHash', type: 'bytes32' },
    { name: 'reportHash', type: 'bytes32' },
    { name: 'corpusHash', type: 'bytes32' },
    { name: 'examCommitId', type: 'uint256' },
    { name: 'ownerInputsHash', type: 'bytes32' },
    { name: 't1MaxPerTx', type: 'uint256' },
    { name: 't1MaxPerWindow', type: 'uint256' },
    { name: 't2MaxPerTx', type: 'uint256' },
    { name: 't2Allowed', type: 'bool' },
    { name: 'issuedAt', type: 'uint256' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'examiner', type: 'address' },
  ],
} as const;

export function computeQualId(configHash: Hex, examCommitId: bigint): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'uint256' }],
      [configHash, examCommitId]
    )
  );
}

/**
 * Commits an exam on-chain as examiner.
 */
export async function commitExamOnChain(options: {
  vaultAddress: Address;
  configHash: Hex;
  corpusHash: Hex;
  examinerPrivateKey: Hex;
  chainName?: SupportedChainName;
}): Promise<bigint> {
  const chainName = options.chainName || 'anvil';
  const publicClient = createChainPublicClient(chainName);
  const walletClient = createChainWalletClient(options.examinerPrivateKey, chainName);

  const hash = await walletClient.writeContract({
    address: options.vaultAddress,
    abi: UnderwriteVaultAbi,
    functionName: 'commitExam',
    args: [options.configHash, options.corpusHash],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') {
    throw new Error(`commitExam transaction failed: ${hash}`);
  }

  // Read latest examCommitId for this configHash
  const commit = await publicClient.readContract({
    address: options.vaultAddress,
    abi: UnderwriteVaultAbi,
    functionName: 'examCommits',
    args: [options.configHash],
  });

  // examCommits returns [commitId, corpusHash, committedAt]
  return commit[0];
}

/**
 * Signs a qualification attestation using EIP-712 typed data as the examiner.
 */
export async function signQualificationAttestation(options: {
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
  examinerPrivateKey: Hex;
  chainId: number;
}): Promise<Hex> {
  const account = privateKeyToAccount(options.examinerPrivateKey);

  const domain = {
    name: 'UnderwriteVault',
    version: '1',
    chainId: options.chainId,
    verifyingContract: options.attestation.vault,
  } as const;

  return account.signTypedData({
    domain,
    types: ATTESTATION_TYPES,
    primaryType: 'QualificationAttestation',
    message: options.attestation,
  });
}

/**
 * Activates a qualification on-chain as the owner.
 */
export async function activateQualificationOnChain(options: {
  vaultAddress: Address;
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
  signature: Hex;
  ownerPrivateKey: Hex;
  chainName?: SupportedChainName;
}): Promise<Hex> {
  const chainName = options.chainName || 'anvil';
  const publicClient = createChainPublicClient(chainName);
  const walletClient = createChainWalletClient(options.ownerPrivateKey, chainName);

  const hash = await walletClient.writeContract({
    address: options.vaultAddress,
    abi: UnderwriteVaultAbi,
    functionName: 'activateQualification',
    args: [options.attestation, options.signature],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') {
    throw new Error(`activateQualification transaction failed: ${hash}`);
  }

  return hash;
}

/**
 * Full helper to commit exam, sign attestation, and activate qualification on-chain.
 */
export async function qualifyAgent(params: QualificationParams): Promise<{
  qualId: Hex;
  examCommitId: bigint;
  signature: Hex;
  activationTxHash: Hex;
}> {
  const chainName = params.chainName || 'anvil';
  const publicClient = createChainPublicClient(chainName);
  const chainId = await publicClient.getChainId();

  const examinerAccount = privateKeyToAccount(params.examinerPrivateKey);

  // 1. Commit exam
  const examCommitId = await commitExamOnChain({
    vaultAddress: params.vaultAddress,
    configHash: params.configHash,
    corpusHash: params.corpusHash,
    examinerPrivateKey: params.examinerPrivateKey,
    chainName,
  });

  // 2. Build attestation struct
  const qualId = computeQualId(params.configHash, examCommitId);
  const now = BigInt(Math.floor(Date.now() / 1000));

  const attestation = {
    qualId,
    vault: params.vaultAddress,
    agentKey: params.agentKey,
    configHash: params.configHash,
    reportHash: params.reportHash || ('0x' + '2'.repeat(64) as Hex),
    corpusHash: params.corpusHash,
    examCommitId,
    ownerInputsHash: params.ownerInputsHash || ('0x' + '3'.repeat(64) as Hex),
    t1MaxPerTx: params.t1MaxPerTx !== undefined ? params.t1MaxPerTx : 180_000_000n,
    t1MaxPerWindow: params.t1MaxPerWindow !== undefined ? params.t1MaxPerWindow : 500_000_000n,
    t2MaxPerTx: params.t2MaxPerTx !== undefined ? params.t2MaxPerTx : 1000_000_000n,
    t2Allowed: params.t2Allowed !== undefined ? params.t2Allowed : true,
    issuedAt: params.issuedAt || now,
    expiresAt: params.expiresAt || (now + 14n * 86400n),
    examiner: examinerAccount.address,
  };

  // 3. Examiner signs attestation
  const signature = await signQualificationAttestation({
    attestation,
    examinerPrivateKey: params.examinerPrivateKey,
    chainId,
  });

  // 4. Owner activates qualification
  const activationTxHash = await activateQualificationOnChain({
    vaultAddress: params.vaultAddress,
    attestation,
    signature,
    ownerPrivateKey: params.ownerPrivateKey,
    chainName,
  });

  return {
    qualId,
    examCommitId,
    signature,
    activationTxHash,
  };
}
