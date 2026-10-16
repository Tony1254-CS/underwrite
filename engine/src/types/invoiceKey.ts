import { encodeAbiParameters, keccak256, stringToBytes, type Hex } from 'viem';

/**
 * Normalizes an invoice number per plan §9.5 and PV-13:
 * 1. Convert to uppercase.
 * 2. Strip whitespace and separator characters: - _ / . #
 * 3. Strip leading zeros from the numeric tail while keeping at least one digit (INV000 -> INV0).
 */
export function normalizeInvoiceNumber(invoiceNumber: string): string {
  if (typeof invoiceNumber !== 'string') {
    throw new Error('Invoice number must be a string');
  }

  // 1 & 2: uppercase and strip whitespace and separators (- _ / . #)
  const cleaned = invoiceNumber.toUpperCase().replace(/[\s\-_/.#]/g, '');

  if (!cleaned) {
    throw new Error('Invoice number cannot be empty after stripping separators');
  }

  // 3: strip leading zeros of numeric tail, keeping at least one digit
  return cleaned.replace(/(\d+)$/, (match) => {
    return match.replace(/^0+(?=\d)/, '');
  });
}

/**
 * Computes the vendorIdHash per PV-08: keccak256(bytes(vendorId)).
 */
export function computeVendorIdHash(vendorId: string): Hex {
  if (!vendorId) {
    throw new Error('VendorId cannot be empty');
  }
  return keccak256(stringToBytes(vendorId));
}

/**
 * Computes the memoHash per PV-08: keccak256(utf8(proposalId)).
 */
export function computeMemoHash(proposalId: string): Hex {
  if (!proposalId) {
    throw new Error('ProposalId cannot be empty');
  }
  return keccak256(stringToBytes(proposalId));
}

/**
 * Computes invoiceKey per PV-08 & plan §9.5:
 * invoiceKey = keccak256(abi.encode(vendorIdHash, normalize(invoiceNumber)))
 */
export function computeInvoiceKey(vendorIdHash: Hex, rawOrNormalizedInvoiceNumber: string): Hex {
  const normalized = normalizeInvoiceNumber(rawOrNormalizedInvoiceNumber);
  return keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'string' }],
      [vendorIdHash, normalized]
    )
  );
}
