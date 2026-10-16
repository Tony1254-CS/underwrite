import {
  type Address,
  Proposal,
  ProposalSchema,
  PolicyDecision,
  PolicyDecisionSchema,
  ReasonCode,
} from '../types/index.js';
import { computeInvoiceKey, computeVendorIdHash } from '../types/invoiceKey.js';
import { VendorRegistry } from '../mandate/vendorRegistry.js';
import { PolicySnapshot } from './snapshot.js';

const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
const THIRTY_DAYS_SECONDS = 30 * 86400;

/**
 * Deterministic policy evaluation function (plan §5.3, §9.3 TB2, PV-10..PV-12).
 * Pure function: (proposal, snapshot) -> PolicyDecision.
 * Re-validates proposal with zod, computes invoiceKey, and resolves recipient via registry.
 */
export function evaluatePolicy(
  rawProposal: unknown,
  snapshot: PolicySnapshot,
  explicitRegistry?: VendorRegistry
): PolicyDecision {
  const proposal: Proposal = ProposalSchema.parse(rawProposal);
  const registry = explicitRegistry || snapshot.registry;

  if (!registry) {
    throw new Error('Vendor registry is required for policy evaluation');
  }

  const rejectReasons: ReasonCode[] = [];
  const t2Reasons: ReasonCode[] = [];
  const t3Reasons: ReasonCode[] = [];

  // 1. Compute invoiceKey and vendorHash
  const vendorHash = computeVendorIdHash(proposal.vendorId);
  const invoiceKey = computeInvoiceKey(vendorHash, proposal.invoiceNumber);

  // 2. Resolve recipient via VendorRegistry
  const vendor = registry.getVendor(proposal.vendorId);
  let recipient: Address = ZERO_ADDRESS;

  if (!vendor) {
    rejectReasons.push('VENDOR_UNKNOWN');
  } else {
    recipient = vendor.payoutAddress;
    if (!vendor.active) {
      rejectReasons.push('VENDOR_INACTIVE');
    } else if (snapshot.currentTimestamp < vendor.activatesAt) {
      // Cooling down prevents T1, escalates to T2 per plan §9.8 (INV-4)
      t2Reasons.push('VENDOR_COOLING_DOWN');
    }
  }

  // 3. Amount validity check
  if (proposal.amount <= 0n) {
    rejectReasons.push('AMOUNT_INVALID');
  }

  // 4. Purchase Order checks
  if (proposal.poNumber) {
    const po = snapshot.purchaseOrders.get(proposal.poNumber);
    if (!po) {
      rejectReasons.push('PO_NOT_FOUND');
    } else {
      if (po.status === 'CLOSED') {
        rejectReasons.push('PO_CLOSED');
      }
      if (po.vendorId !== proposal.vendorId) {
        rejectReasons.push('PO_VENDOR_MISMATCH');
      }
      if (proposal.amount > po.remaining) {
        rejectReasons.push('AMOUNT_EXCEEDS_PO_REMAINING');
      }
    }
  }

  // 5. Duplicate invoice check
  if (snapshot.paidInvoiceKeys.has(invoiceKey) || snapshot.reservedInvoiceKeys.has(invoiceKey)) {
    rejectReasons.push('DUPLICATE_INVOICE');
  }

  // If ANY reject condition is met, return REJECT immediately
  if (rejectReasons.length > 0) {
    const decision: PolicyDecision = {
      proposalId: proposal.proposalId,
      tier: 'REJECT',
      reasons: rejectReasons,
      invoiceKey,
      recipient,
    };
    return PolicyDecisionSchema.parse(decision);
  }

  // 6. Near-duplicate check (PV-12)
  // same vendorId AND same amount AND same poNumber (or both absent) as a payment/proposal
  // recorded in the last 30 days, but a different invoiceKey -> tier T2 with NEAR_DUPLICATE
  const isNearDuplicate = snapshot.recentPayments.some((rec) => {
    const isSameVendor = rec.vendorId === proposal.vendorId;
    const isSameAmount = rec.amount === proposal.amount;
    const isSamePo = (rec.poNumber || undefined) === (proposal.poNumber || undefined);
    const isDiffKey = rec.invoiceKey !== invoiceKey;
    const isWithin30Days =
      snapshot.currentTimestamp >= rec.timestamp &&
      snapshot.currentTimestamp - rec.timestamp <= THIRTY_DAYS_SECONDS;

    return isSameVendor && isSameAmount && isSamePo && isDiffKey && isWithin30Days;
  });

  if (isNearDuplicate) {
    t2Reasons.push('NEAR_DUPLICATE');
  }

  // 7. T3 Blocker checks (Governance, qualification status, circuit breakers)
  if (snapshot.paused) {
    t3Reasons.push('PAUSED');
  }
  if (snapshot.configDrift) {
    t3Reasons.push('CONFIG_DRIFT');
  }

  const qual = snapshot.qualification;
  if (!qual || !qual.active) {
    t3Reasons.push('NO_ACTIVE_QUALIFICATION');
  } else {
    if (qual.revoked) {
      t3Reasons.push('QUALIFICATION_REVOKED');
    }
    if (qual.expired) {
      t3Reasons.push('QUALIFICATION_EXPIRED');
    }
    if (proposal.amount > qual.t2MaxPerTx) {
      t3Reasons.push('EXCEEDS_T2_PER_TX');
    }
  }

  if (t3Reasons.length > 0) {
    const decision: PolicyDecision = {
      proposalId: proposal.proposalId,
      tier: 'T3',
      reasons: t3Reasons,
      invoiceKey,
      recipient,
    };
    return PolicyDecisionSchema.parse(decision);
  }

  // 8. T1 Limit and Backing Checks
  if (qual) {
    if (proposal.amount > qual.t1MaxPerTx) {
      t2Reasons.push('EXCEEDS_T1_PER_TX');
    }
    if (snapshot.qualWindowSpent + proposal.amount > qual.t1MaxPerWindow) {
      t2Reasons.push('EXCEEDS_T1_WINDOW');
    }
    if (vendor && snapshot.recipientWindowSpent + proposal.amount > vendor.perWindowCap) {
      t2Reasons.push('EXCEEDS_RECIPIENT_WINDOW');
    }
    if (snapshot.exposure + proposal.amount > snapshot.bondRemaining) {
      t2Reasons.push('INSUFFICIENT_BACKING');
    }
    if (
      snapshot.vaultBalance < proposal.amount ||
      snapshot.vaultBalance - proposal.amount < snapshot.reserveFloor
    ) {
      t2Reasons.push('RESERVE_BREACH');
    }
  }

  // 9. Resolve T2 vs T1
  if (t2Reasons.length > 0) {
    if (!qual?.t2Allowed) {
      // If T2 is not permitted, escalate to T3 owner action
      const decision: PolicyDecision = {
        proposalId: proposal.proposalId,
        tier: 'T3',
        reasons: [...t2Reasons, 'T2_NOT_ALLOWED'],
        invoiceKey,
        recipient,
      };
      return PolicyDecisionSchema.parse(decision);
    }

    const decision: PolicyDecision = {
      proposalId: proposal.proposalId,
      tier: 'T2',
      reasons: t2Reasons,
      invoiceKey,
      recipient,
    };
    return PolicyDecisionSchema.parse(decision);
  }

  // 10. Autonomous T1 Payment
  const decision: PolicyDecision = {
    proposalId: proposal.proposalId,
    tier: 'T1',
    reasons: [],
    invoiceKey,
    recipient,
  };
  return PolicyDecisionSchema.parse(decision);
}
