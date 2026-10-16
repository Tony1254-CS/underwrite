import { decodeErrorResult, type Hex } from 'viem';
import { UnderwriteVaultAbi } from './abi/UnderwriteVault.js';
import { BondPoolAbi } from './abi/BondPool.js';

export const CombinedErrorAbi = [
  ...UnderwriteVaultAbi.filter((item) => item.type === 'error'),
  ...BondPoolAbi.filter((item) => item.type === 'error'),
] as const;

export interface DecodedContractError {
  errorName: string;
  args?: readonly unknown[];
}

/**
 * Decodes contract custom error data (4-byte selector + args) using UnderwriteVault and BondPool ABIs.
 */
export function decodeContractError(data: Hex): DecodedContractError | undefined {
  if (!data || data === '0x' || data.length < 10) {
    return undefined;
  }
  try {
    const decoded = decodeErrorResult({
      abi: CombinedErrorAbi,
      data,
    });
    return {
      errorName: decoded.errorName,
      args: decoded.args,
    };
  } catch {
    return undefined;
  }
}

/**
 * Extracts and decodes custom error from unknown exception (e.g. viem ContractFunctionExecutionError or RPC revert).
 */
export function extractAndDecodeError(err: unknown): DecodedContractError | undefined {
  if (!err || typeof err !== 'object') {
    return undefined;
  }

  // 1. Check direct data field
  const anyErr = err as Record<string, unknown>;
  if (typeof anyErr.data === 'string' && anyErr.data.startsWith('0x')) {
    const res = decodeContractError(anyErr.data as Hex);
    if (res) return res;
  }

  // 2. Check nested cause.data or error.data
  const nestedError = (anyErr.cause || anyErr.error) as Record<string, unknown> | undefined;
  if (nestedError) {
    if (typeof nestedError.data === 'string' && nestedError.data.startsWith('0x')) {
      const res = decodeContractError(nestedError.data as Hex);
      if (res) return res;
    }
  }

  // 3. Search error message / details for hex data matching a selector
  const message = anyErr.message || anyErr.details || anyErr.shortMessage;
  if (typeof message === 'string') {
    const hexMatches = message.match(/0x[a-fA-F0-9]{8,}/g);
    if (hexMatches) {
      for (const hexStr of hexMatches) {
        const res = decodeContractError(hexStr as Hex);
        if (res) return res;
      }
    }
  }

  return undefined;
}
