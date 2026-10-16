/**
 * Dynamic Platform Runtime State Store
 * Maintains live vault state, vendor registry, pending T2 approvals, executed payments, and claims.
 */

export interface VendorRecord {
  vendorId: string;
  name: string;
  payoutAddress: string;
  active: boolean;
  registeredAt: number;
  activatesAt: number; // Cooldown enforcement (PV-04: 300s)
}

export interface PendingT2Payment {
  paymentId: number;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  amountUSDC: number;
  poNumber?: string;
  reason: string;
  submittedAt: number;
  expiresAt: number; // Challenge window (PV-02: 300s)
  proposedRecipient: string;
}

export interface ExecutedPayment {
  paymentId: number;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  amountUSDC: number;
  poNumber?: string;
  tier: 'T1' | 'T2';
  txHash: string;
  timestamp: number;
  status: 'EXECUTED';
  receiptDecoded: string;
}

export interface ClaimItem {
  id: string;
  claimId: number;
  qualId: string;
  paymentId: string;
  lossAmount: string; // in USDC raw or formatted
  deductible: string;
  payout: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: number;
  evidenceHash: string;
  txHash?: string;
  adjudicator?: string;
  consequenceSummary?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OwnerProfile {
  address: string;
  name: string;
  title: string;
  company: string;
  vaultAddress: string;
  vaultVersion: string;
  t1CapUSDC: number;
  t2CeilingUSDC: number;
  reserveFloorUSDC: number;
  challengePeriodSeconds: number;
  recipientCooldownSeconds: number;
}

export const DEFAULT_OWNER: OwnerProfile = {
  address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  name: 'Sarah Chen',
  title: 'Chief Financial Officer & Vault Custodian',
  company: 'Acme Corp Treasury & Governance',
  vaultAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  vaultVersion: 'UnderwriteVault v1.0.0 (Base Sepolia / Anvil)',
  t1CapUSDC: 180.0,
  t2CeilingUSDC: 500.0,
  reserveFloorUSDC: 500.0,
  challengePeriodSeconds: 300,
  recipientCooldownSeconds: 300,
};

export interface AgentDecisionDetails {
  vendorAllowedByOwner: boolean;
  cooldownCleared: boolean;
  poMatched: boolean;
  promptInjectionFree: boolean;
  singleUseUnique: boolean;
  withinT1Cap: boolean;
  withinWindowVelocity: boolean;
  reserveProtected: boolean;
  bondedCollateralSufficient: boolean;
}

export interface InvoiceRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  amountUSDC: number;
  poNumber?: string;
  description?: string;
  notes?: string;
  lineItems?: LineItem[];
  // Target Owner & Customer Relationship
  targetOwnerAddress: string;
  targetOwnerName: string;
  // Owner Agent Evaluation Breakdown
  agentEvaluatedBy: string;
  agentDecidedTier: 'T0' | 'T1' | 'T2' | 'T3';
  agentDecisionDetails: AgentDecisionDetails;
  tier: 'T0' | 'T1' | 'T2' | 'T3';
  status: 'EXECUTED_T1' | 'PENDING_T2' | 'REJECTED_T3' | 'APPROVED_T2' | 'REJECTED_T2';
  reasonCodes: string[];
  contractResult: string;
  txHash?: string;
  paymentId?: number;
  timestamp: number;
  proposedRecipient?: string;
}

export interface LiveRuntimeState {
  owner: OwnerProfile;
  vaultBalanceUSDC: number;
  reserveFloorUSDC: number;
  currentExposureUSDC: number;
  windowSpendUSDC: number;
  t1CapUSDC: number;
  bondRemainingUSDC: number;
  qualificationActive: boolean;
  qualId: string;
  configHash: string;
  vendors: VendorRecord[];
  pendingT2Payments: PendingT2Payment[];
  executedPayments: ExecutedPayment[];
  claims: ClaimItem[];
  knownInvoiceKeys: string[];
  invoices: InvoiceRecord[];
}

// Global in-memory singleton that persists during the server runtime
const globalState: LiveRuntimeState = {
  owner: DEFAULT_OWNER,
  vaultBalanceUSDC: 5000.0,
  reserveFloorUSDC: 500.0,
  currentExposureUSDC: 42.5,
  windowSpendUSDC: 42.5,
  t1CapUSDC: 180.0,
  bondRemainingUSDC: 2000.0,
  qualificationActive: true,
  qualId: '0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701',
  configHash: '0x6e9a710bc88921df6764508492047cbda06987f1766524fa93437149a469e3ab',
  vendors: [
    {
      vendorId: 'acme_industrial',
      name: 'Acme Industrial Corp',
      payoutAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
    {
      vendorId: 'globex_logistics',
      name: 'Globex Logistics Global',
      payoutAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
    {
      vendorId: 'initech_software',
      name: 'Initech Software Systems',
      payoutAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
    {
      vendorId: 'cyberdyne_systems',
      name: 'Cyberdyne AI Compute',
      payoutAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
    {
      vendorId: 'wayne_enterprises',
      name: 'Wayne Security Services',
      payoutAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
    {
      vendorId: 'stark_industries',
      name: 'Stark Clean Power',
      payoutAddress: '0x976EA74026E72CD5554282bf94FE62420492370C',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
    {
      vendorId: 'cloudcorp_saas',
      name: 'CloudCorp Global Logistics',
      payoutAddress: '0xDC062a66c9E400f7EAcdE3E1b049E664337538d0',
      active: true,
      registeredAt: Date.now() - 86400000,
      activatesAt: Date.now() - 86000000,
    },
  ],
  pendingT2Payments: [
    {
      paymentId: 101,
      vendorId: 'initech_software',
      vendorName: 'Initech Software Systems',
      invoiceNumber: 'INV-2026-T2-01',
      amountUSDC: 240.0,
      poNumber: 'PO-103',
      reason: 'EXCEEDS_T1_PER_TX (Amount $240.00 > $180.00 T1 Cap)',
      submittedAt: Date.now() - 60000,
      expiresAt: Date.now() + 240000,
      proposedRecipient: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    },
  ],
  executedPayments: [
    {
      paymentId: 1,
      vendorId: 'acme_industrial',
      vendorName: 'Acme Industrial Corp',
      invoiceNumber: 'INV-001',
      amountUSDC: 42.5,
      poNumber: 'PO-101',
      tier: 'T1',
      txHash: '0x7fa2c0384910b8e99491a3294827104928104928104928104928104928104928',
      timestamp: Date.now() - 3600000,
      status: 'EXECUTED',
      receiptDecoded: 'PaymentExecuted(paymentId: 1, recipient: 0x7099..., amount: 42500000)',
    },
  ],
  claims: [
    {
      id: '1',
      claimId: 1,
      qualId: '0xa38c71d2b992f447e4368143d2c940251789a7bbef7ff1e92d770514daeb7701',
      paymentId: '1',
      lossAmount: '150000000',
      deductible: '5000000',
      payout: '145000000',
      status: 'APPROVED',
      timestamp: Date.now() - 7200000,
      evidenceHash: '0x3f9a7c2b1e4d5f8a0b9c2e1f4d7a8b3c5e2d1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
      txHash: '0xa2b38b3db17a2b4217164046b5e5e75ef3a784a036050fee73cf7b652a76059e',
      adjudicator: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      consequenceSummary: 'BondPool paid $145.00 USDC to Vault; Agent qualification atomically revoked.',
    },
  ],
  knownInvoiceKeys: ['ACME_INDUSTRIAL:INV-001'],
  invoices: [
    {
      id: 'inv_init_001',
      vendorId: 'acme_industrial',
      vendorName: 'Acme Industrial Corp',
      invoiceNumber: 'INV-001',
      amountUSDC: 42.5,
      poNumber: 'PO-101',
      description: 'Factory Automation Precision Tooling (Q1 Maintenance)',
      targetOwnerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      targetOwnerName: 'Acme Corp Treasury & Governance',
      agentEvaluatedBy: 'Acme Autonomous System Agent (gamma: gemini-2.5-pro / policy v1.0.0)',
      agentDecidedTier: 'T1',
      agentDecisionDetails: {
        vendorAllowedByOwner: true,
        cooldownCleared: true,
        poMatched: true,
        promptInjectionFree: true,
        singleUseUnique: true,
        withinT1Cap: true,
        withinWindowVelocity: true,
        reserveProtected: true,
        bondedCollateralSufficient: true,
      },
      tier: 'T1',
      status: 'EXECUTED_T1',
      reasonCodes: ['VALID_MANDATE_MATCH', 'IN_WINDOW_CAP', 'REGISTERED_VENDOR'],
      contractResult: 'PaymentExecuted (Tx: 0x7fa2c03849...104928)',
      txHash: '0x7fa2c0384910b8e99491a3294827104928104928104928104928104928104928',
      paymentId: 1,
      timestamp: Date.now() - 3600000,
      proposedRecipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
    {
      id: 'inv_init_002',
      vendorId: 'initech_software',
      vendorName: 'Initech Software Systems',
      invoiceNumber: 'INV-2026-T2-01',
      amountUSDC: 240.0,
      poNumber: 'PO-103',
      description: 'Enterprise ERP Multi-Seat Cloud Subscription Renewal',
      targetOwnerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      targetOwnerName: 'Acme Corp Treasury & Governance',
      agentEvaluatedBy: 'Acme Autonomous System Agent (gamma: gemini-2.5-pro / policy v1.0.0)',
      agentDecidedTier: 'T2',
      agentDecisionDetails: {
        vendorAllowedByOwner: true,
        cooldownCleared: true,
        poMatched: true,
        promptInjectionFree: true,
        singleUseUnique: true,
        withinT1Cap: false, // $240 > $180
        withinWindowVelocity: true,
        reserveProtected: true,
        bondedCollateralSufficient: true,
      },
      tier: 'T2',
      status: 'PENDING_T2',
      reasonCodes: ['EXCEEDS_T1_PER_TX'],
      contractResult: 'Submitted as requestPayment(#101) - Queued for 300s Owner Review',
      paymentId: 101,
      timestamp: Date.now() - 60000,
      proposedRecipient: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    },
  ],
};

export function getRuntimeState(): LiveRuntimeState {
  return globalState;
}

export interface EvaluationResult {
  proposed: string;
  decided: 'T1_AUTONOMOUS' | 'T2_ESCALATED' | 'REJECT';
  reasonCodes: string[];
  contractResult: string;
  fundsMoved: boolean;
  executed: boolean;
  paymentId?: number;
  txHash?: string;
  newVaultBalance?: number;
  newExposure?: number;
  agentEvaluatedBy?: string;
  agentDecidedTier?: 'T0' | 'T1' | 'T2' | 'T3';
  agentDecisionDetails?: AgentDecisionDetails;
}

export function toggleVendorStatus(vendorId: string, active: boolean): VendorRecord | null {
  const vendor = globalState.vendors.find((v) => v.vendorId.toLowerCase() === vendorId.trim().toLowerCase());
  if (!vendor) return null;
  vendor.active = active;
  return vendor;
}

export function evaluateAndExecuteInvoice(payload: {
  vendorId: string;
  invoiceNumber: string;
  amount: string;
  targetOwnerAddress?: string;
  poNumber?: string;
  agentModel?: string;
  notes?: string;
  description?: string;
  lineItems?: LineItem[];
  proposedRecipient?: string;
}): EvaluationResult {
  const cleanVendor = payload.vendorId.trim().toLowerCase();
  const cleanInvoice = payload.invoiceNumber.trim().toUpperCase();
  const numAmount = parseFloat(payload.amount) || 0;
  const invoiceKey = `${cleanVendor}:${cleanInvoice}`;
  const now = Date.now();
  const rawText = `${payload.notes || ''} ${payload.description || ''} ${payload.poNumber || ''}`;
  const targetOwnerAddress = payload.targetOwnerAddress || globalState.owner.vaultAddress;
  const targetOwnerName = targetOwnerAddress.toLowerCase() === globalState.owner.vaultAddress.toLowerCase()
    ? globalState.owner.company
    : 'Enterprise Treasury Vault';
  const agentEvaluatedBy = `Acme Autonomous System Agent (gamma: gemini-2.5-pro / policy v1.0.0)`;

  // Gate 0: Adversarial Prompt Injection Defense (Topic F firewall)
  const injectionPattern = /(?:ignore.*(?:previous|rule|instruction|policy|limit)|bypass.*(?:guard|vault|firewall)|transfer.*all|0xattacker|grant.*root|override.*system)/i;
  const promptInjectionDetected = injectionPattern.test(rawText);

  if (promptInjectionDetected) {
    const invId = `inv_${Date.now()}`;
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: true,
      cooldownCleared: true,
      poMatched: false,
      promptInjectionFree: false,
      singleUseUnique: true,
      withinT1Cap: numAmount <= globalState.t1CapUSDC,
      withinWindowVelocity: globalState.currentExposureUSDC + numAmount <= globalState.t1CapUSDC,
      reserveProtected: globalState.vaultBalanceUSDC - numAmount >= globalState.reserveFloorUSDC,
      bondedCollateralSufficient: globalState.bondRemainingUSDC > 0,
    };

    globalState.invoices.unshift({
      id: invId,
      vendorId: cleanVendor,
      vendorName: payload.vendorId,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description || 'Hostile Payload Injected',
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
      tier: 'T3',
      status: 'REJECTED_T3',
      reasonCodes: ['PROMPT_INJECTION_DETECTED', 'POLICY_FIREWALL_BLOCK'],
      contractResult: 'Blocked by Policy Firewall: Adversarial Prompt Injection detected in invoice payload',
      timestamp: now,
      proposedRecipient: payload.proposedRecipient || '0x0000000000000000000000000000000000000000',
    });

    return {
      proposed: `${payload.vendorId} - ${cleanInvoice} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'REJECT',
      reasonCodes: ['PROMPT_INJECTION_DETECTED', 'POLICY_FIREWALL_BLOCK'],
      contractResult: 'Blocked by Policy Firewall: Adversarial Prompt Injection detected in invoice payload',
      fundsMoved: false,
      executed: false,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 1: Qualification check
  if (!globalState.qualificationActive) {
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: false,
      cooldownCleared: false,
      poMatched: false,
      promptInjectionFree: true,
      singleUseUnique: true,
      withinT1Cap: false,
      withinWindowVelocity: false,
      reserveProtected: false,
      bondedCollateralSufficient: false,
    };

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: cleanVendor,
      vendorName: payload.vendorId,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
      tier: 'T3',
      status: 'REJECTED_T3',
      reasonCodes: ['QUALIFICATION_REVOKED'],
      contractResult: 'Reverted: QualificationRevoked() - Agent authority zeroed by prior adjudication',
      timestamp: now,
      proposedRecipient: payload.proposedRecipient,
    });

    return {
      proposed: `${payload.vendorId} - ${payload.invoiceNumber} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'REJECT',
      reasonCodes: ['QUALIFICATION_REVOKED'],
      contractResult: 'Reverted: QualificationRevoked() - Agent authority zeroed by prior adjudication',
      fundsMoved: false,
      executed: false,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 2: Vendor Registry Check in Owner's Allowlist (INV-1)
  const vendor = globalState.vendors.find((v) => v.vendorId.toLowerCase() === cleanVendor);
  const isVendorActive = vendor && vendor.active;
  if (!vendor || !isVendorActive) {
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: false,
      cooldownCleared: false,
      poMatched: true,
      promptInjectionFree: true,
      singleUseUnique: true,
      withinT1Cap: numAmount <= globalState.t1CapUSDC,
      withinWindowVelocity: true,
      reserveProtected: true,
      bondedCollateralSufficient: true,
    };

    const reason = !vendor ? 'VENDOR_UNKNOWN' : 'VENDOR_DEACTIVATED_BY_OWNER';
    const contractRes = !vendor
      ? 'Reverted: RecipientNotAllowed() - Destination address not in Owner registry mirror'
      : 'Reverted: RecipientInactive() - Supplier deactivated by Owner in Vault registry';

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: cleanVendor,
      vendorName: vendor?.name || payload.vendorId,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
      tier: 'T3',
      status: 'REJECTED_T3',
      reasonCodes: [reason, 'RECIPIENT_NOT_ALLOWED'],
      contractResult: contractRes,
      timestamp: now,
      proposedRecipient: vendor?.payoutAddress || payload.proposedRecipient,
    });

    return {
      proposed: `${payload.vendorId} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'REJECT',
      reasonCodes: [reason, 'RECIPIENT_NOT_ALLOWED'],
      contractResult: contractRes,
      fundsMoved: false,
      executed: false,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 3: Cooldown Check (INV-4: 300s)
  if (now < vendor.activatesAt) {
    const remainingSecs = Math.ceil((vendor.activatesAt - now) / 1000);
    const paymentId = globalState.pendingT2Payments.length + globalState.executedPayments.length + 100;
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: true,
      cooldownCleared: false,
      poMatched: true,
      promptInjectionFree: true,
      singleUseUnique: true,
      withinT1Cap: numAmount <= globalState.t1CapUSDC,
      withinWindowVelocity: true,
      reserveProtected: true,
      bondedCollateralSufficient: true,
    };

    globalState.pendingT2Payments.push({
      paymentId,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      reason: `VENDOR_COOLING_DOWN (${remainingSecs}s remaining)`,
      submittedAt: now,
      expiresAt: now + 300000,
      proposedRecipient: vendor.payoutAddress,
    });

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T2',
      agentDecisionDetails: decisionDetails,
      tier: 'T2',
      status: 'PENDING_T2',
      reasonCodes: ['VENDOR_COOLING_DOWN'],
      contractResult: `Escalated to requestPayment(): Vendor is in security cooldown (${remainingSecs}s remaining)`,
      paymentId,
      timestamp: now,
      proposedRecipient: vendor.payoutAddress,
    });

    return {
      proposed: `${vendor.name} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'T2_ESCALATED',
      reasonCodes: ['VENDOR_COOLING_DOWN'],
      contractResult: `Escalated to requestPayment(): Vendor is in security cooldown (${remainingSecs}s remaining)`,
      fundsMoved: false,
      executed: false,
      paymentId,
      agentEvaluatedBy,
      agentDecidedTier: 'T2',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 4: Duplicate Invoice Check (INV-3 Single Use)
  if (globalState.knownInvoiceKeys.includes(invoiceKey)) {
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: true,
      cooldownCleared: true,
      poMatched: true,
      promptInjectionFree: true,
      singleUseUnique: false,
      withinT1Cap: numAmount <= globalState.t1CapUSDC,
      withinWindowVelocity: true,
      reserveProtected: true,
      bondedCollateralSufficient: true,
    };

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
      tier: 'T3',
      status: 'REJECTED_T3',
      reasonCodes: ['DUPLICATE_INVOICE'],
      contractResult: 'Reverted: DuplicateInvoice() - On-chain single-use invoice key collision',
      timestamp: now,
      proposedRecipient: vendor.payoutAddress,
    });

    return {
      proposed: `${vendor.name} - ${cleanInvoice} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'REJECT',
      reasonCodes: ['DUPLICATE_INVOICE'],
      contractResult: 'Reverted: DuplicateInvoice() - On-chain single-use invoice key collision',
      fundsMoved: false,
      executed: false,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 5: Near-duplicate / Fraud variant check (PV-12)
  const isNearDup = globalState.executedPayments.some(
    (p) => p.vendorId.toLowerCase() === cleanVendor && p.amountUSDC === numAmount && p.poNumber === payload.poNumber
  );
  if (isNearDup) {
    const paymentId = globalState.pendingT2Payments.length + globalState.executedPayments.length + 100;
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: true,
      cooldownCleared: true,
      poMatched: false,
      promptInjectionFree: true,
      singleUseUnique: true,
      withinT1Cap: numAmount <= globalState.t1CapUSDC,
      withinWindowVelocity: true,
      reserveProtected: true,
      bondedCollateralSufficient: true,
    };

    globalState.pendingT2Payments.push({
      paymentId,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      reason: 'NEAR_DUPLICATE (Matches prior payment amount and PO with different invoice number)',
      submittedAt: now,
      expiresAt: now + 300000,
      proposedRecipient: vendor.payoutAddress,
    });

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T2',
      agentDecisionDetails: decisionDetails,
      tier: 'T2',
      status: 'PENDING_T2',
      reasonCodes: ['NEAR_DUPLICATE'],
      contractResult: `Submitted as requestPayment(#${paymentId}) - Queued for 300s Owner Review`,
      paymentId,
      timestamp: now,
      proposedRecipient: vendor.payoutAddress,
    });

    return {
      proposed: `${vendor.name} - ${cleanInvoice} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'T2_ESCALATED',
      reasonCodes: ['NEAR_DUPLICATE'],
      contractResult: `Submitted as requestPayment(#${paymentId}) - Queued for 300s Owner Review`,
      fundsMoved: false,
      executed: false,
      paymentId,
      agentEvaluatedBy,
      agentDecidedTier: 'T2',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 6: Spending Ceilings Check (INV-2)
  if (numAmount > globalState.t1CapUSDC) {
    const paymentId = globalState.pendingT2Payments.length + globalState.executedPayments.length + 100;
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: true,
      cooldownCleared: true,
      poMatched: true,
      promptInjectionFree: true,
      singleUseUnique: true,
      withinT1Cap: false, // Exceeds $180
      withinWindowVelocity: true,
      reserveProtected: true,
      bondedCollateralSufficient: true,
    };

    globalState.pendingT2Payments.push({
      paymentId,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      reason: `EXCEEDS_T1_PER_TX (Amount $${numAmount.toFixed(2)} > $${globalState.t1CapUSDC.toFixed(2)} T1 Cap)`,
      submittedAt: now,
      expiresAt: now + 300000,
      proposedRecipient: vendor.payoutAddress,
    });

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T2',
      agentDecisionDetails: decisionDetails,
      tier: 'T2',
      status: 'PENDING_T2',
      reasonCodes: ['EXCEEDS_T1_PER_TX'],
      contractResult: `Submitted as requestPayment(#${paymentId}) - Queued for 300s Owner Review`,
      paymentId,
      timestamp: now,
      proposedRecipient: vendor.payoutAddress,
    });

    return {
      proposed: `${vendor.name} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'T2_ESCALATED',
      reasonCodes: ['EXCEEDS_T1_PER_TX'],
      contractResult: `Submitted as requestPayment(#${paymentId}) - Queued for 300s Owner Review`,
      fundsMoved: false,
      executed: false,
      paymentId,
      agentEvaluatedBy,
      agentDecidedTier: 'T2',
      agentDecisionDetails: decisionDetails,
    };
  }

  // Gate 7: Window Exposure Check
  if (globalState.currentExposureUSDC + numAmount > globalState.t1CapUSDC) {
    const decisionDetails: AgentDecisionDetails = {
      vendorAllowedByOwner: true,
      cooldownCleared: true,
      poMatched: true,
      promptInjectionFree: true,
      singleUseUnique: true,
      withinT1Cap: true,
      withinWindowVelocity: false,
      reserveProtected: true,
      bondedCollateralSufficient: true,
    };

    globalState.invoices.unshift({
      id: `inv_${Date.now()}`,
      vendorId: vendor.vendorId,
      vendorName: vendor.name,
      invoiceNumber: cleanInvoice,
      amountUSDC: numAmount,
      poNumber: payload.poNumber,
      description: payload.description,
      notes: payload.notes,
      lineItems: payload.lineItems,
      targetOwnerAddress,
      targetOwnerName,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
      tier: 'T3',
      status: 'REJECTED_T3',
      reasonCodes: ['WINDOW_CEILING_EXCEEDED'],
      contractResult: 'Reverted: WindowCeilingExceeded() - Rolling 24h exposure would exceed authorized cap',
      timestamp: now,
      proposedRecipient: vendor.payoutAddress,
    });

    return {
      proposed: `${vendor.name} ($${numAmount.toFixed(2)} USDC)`,
      decided: 'REJECT',
      reasonCodes: ['WINDOW_CEILING_EXCEEDED'],
      contractResult: 'Reverted: WindowCeilingExceeded() - Rolling 24h exposure would exceed authorized cap',
      fundsMoved: false,
      executed: false,
      agentEvaluatedBy,
      agentDecidedTier: 'T3',
      agentDecisionDetails: decisionDetails,
    };
  }

  // SUCCESS: Execute Autonomous T1 Payment
  const newPaymentId = globalState.executedPayments.length + 1;
  const simulatedTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  globalState.vaultBalanceUSDC = Math.max(0, globalState.vaultBalanceUSDC - numAmount);
  globalState.currentExposureUSDC += numAmount;
  globalState.windowSpendUSDC += numAmount;
  globalState.knownInvoiceKeys.push(invoiceKey);

  const decisionDetails: AgentDecisionDetails = {
    vendorAllowedByOwner: true,
    cooldownCleared: true,
    poMatched: true,
    promptInjectionFree: true,
    singleUseUnique: true,
    withinT1Cap: true,
    withinWindowVelocity: true,
    reserveProtected: true,
    bondedCollateralSufficient: true,
  };

  const execRecord: ExecutedPayment = {
    paymentId: newPaymentId,
    vendorId: vendor.vendorId,
    vendorName: vendor.name,
    invoiceNumber: cleanInvoice,
    amountUSDC: numAmount,
    poNumber: payload.poNumber,
    tier: 'T1',
    txHash: simulatedTxHash,
    timestamp: now,
    status: 'EXECUTED',
    receiptDecoded: `PaymentExecuted(paymentId: ${newPaymentId}, recipient: ${vendor.payoutAddress.slice(0, 8)}..., amount: ${Math.floor(numAmount * 1e6)})`,
  };

  globalState.executedPayments.unshift(execRecord);

  globalState.invoices.unshift({
    id: `inv_${Date.now()}`,
    vendorId: vendor.vendorId,
    vendorName: vendor.name,
    invoiceNumber: cleanInvoice,
    amountUSDC: numAmount,
    poNumber: payload.poNumber,
    description: payload.description || 'Verified Autonomous Supply Payment',
    notes: payload.notes,
    lineItems: payload.lineItems,
    targetOwnerAddress,
    targetOwnerName,
    agentEvaluatedBy,
    agentDecidedTier: 'T1',
    agentDecisionDetails: decisionDetails,
    tier: 'T1',
    status: 'EXECUTED_T1',
    reasonCodes: ['VALID_MANDATE_MATCH', 'IN_WINDOW_CAP', 'REGISTERED_VENDOR'],
    contractResult: `PaymentExecuted (Tx: ${simulatedTxHash.slice(0, 10)}...${simulatedTxHash.slice(-6)})`,
    txHash: simulatedTxHash,
    paymentId: newPaymentId,
    timestamp: now,
    proposedRecipient: vendor.payoutAddress,
  });

  return {
    proposed: `${vendor.name} ($${numAmount.toFixed(2)} USDC)`,
    decided: 'T1_AUTONOMOUS',
    reasonCodes: ['VALID_MANDATE_MATCH', 'IN_WINDOW_CAP', 'REGISTERED_VENDOR'],
    contractResult: `PaymentExecuted (Tx: ${simulatedTxHash.slice(0, 10)}...${simulatedTxHash.slice(-6)})`,
    fundsMoved: true,
    executed: true,
    paymentId: newPaymentId,
    txHash: simulatedTxHash,
    newVaultBalance: globalState.vaultBalanceUSDC,
    newExposure: globalState.currentExposureUSDC,
    agentEvaluatedBy,
    agentDecidedTier: 'T1',
    agentDecisionDetails: decisionDetails,
  };
}

export function approveT2Payment(paymentId: number): boolean {
  const idx = globalState.pendingT2Payments.findIndex((p) => p.paymentId === paymentId);
  if (idx === -1) return false;

  const item = globalState.pendingT2Payments[idx];
  globalState.pendingT2Payments.splice(idx, 1);

  const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  globalState.vaultBalanceUSDC = Math.max(0, globalState.vaultBalanceUSDC - item.amountUSDC);

  globalState.executedPayments.unshift({
    paymentId: item.paymentId,
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    invoiceNumber: item.invoiceNumber,
    amountUSDC: item.amountUSDC,
    poNumber: item.poNumber,
    tier: 'T2',
    txHash,
    timestamp: Date.now(),
    status: 'EXECUTED',
    receiptDecoded: `PaymentExecuted(paymentId: ${item.paymentId}, recipient: ${item.proposedRecipient.slice(0, 8)}..., amount: ${Math.floor(item.amountUSDC * 1e6)})`,
  });

  // Sync with invoices list
  const inv = globalState.invoices.find((i) => i.paymentId === paymentId);
  if (inv) {
    inv.status = 'APPROVED_T2';
    inv.txHash = txHash;
    inv.contractResult = `PaymentExecuted by Owner/CFO (Tx: ${txHash.slice(0, 10)}...${txHash.slice(-6)})`;
  }

  return true;
}

export function rejectT2Payment(paymentId: number): boolean {
  const idx = globalState.pendingT2Payments.findIndex((p) => p.paymentId === paymentId);
  if (idx === -1) return false;
  globalState.pendingT2Payments.splice(idx, 1);

  // Sync with invoices list
  const inv = globalState.invoices.find((i) => i.paymentId === paymentId);
  if (inv) {
    inv.status = 'REJECTED_T2';
    inv.contractResult = 'Rejected by Owner/CFO in 300s Challenge Window';
  }

  return true;
}

export function registerNewVendor(vendor: { vendorId: string; name: string; payoutAddress: string }): VendorRecord {
  const now = Date.now();
  const newRecord: VendorRecord = {
    vendorId: vendor.vendorId.trim().toLowerCase(),
    name: vendor.name.trim(),
    payoutAddress: vendor.payoutAddress.trim(),
    active: true,
    registeredAt: now,
    activatesAt: now + 300000, // 300 seconds security cooldown (PV-04)
  };
  globalState.vendors.push(newRecord);
  return newRecord;
}

export function fileClaim(claim: { paymentId: string; lossAmountUSDC: number; evidenceHash: string }): ClaimItem {
  const nextId = (globalState.claims.length + 1).toString();
  const deductibleUSDC = 5.0;
  const payoutUSDC = Math.min(500.0, Math.max(0, claim.lossAmountUSDC - deductibleUSDC));

  const newClaim: ClaimItem = {
    id: nextId,
    claimId: parseInt(nextId, 10),
    qualId: globalState.qualId,
    paymentId: claim.paymentId,
    lossAmount: (claim.lossAmountUSDC * 1e6).toString(),
    deductible: (deductibleUSDC * 1e6).toString(),
    payout: (payoutUSDC * 1e6).toString(),
    status: 'PENDING',
    timestamp: Date.now(),
    evidenceHash: claim.evidenceHash || '0x' + Array.from({ length: 64 }, () => 'a').join(''),
  };

  globalState.claims.unshift(newClaim);
  return newClaim;
}

export function adjudicateClaim(claimId: number, approve: boolean): { success: boolean; consequence?: string } {
  const claim = globalState.claims.find((c) => c.claimId === claimId);
  if (!claim) return { success: false };

  if (!approve) {
    claim.status = 'REJECTED';
    return { success: true, consequence: 'Claim rejected by adjudicator. No funds moved.' };
  }

  // ATOMIC CONSEQUENCE EXECUTION (INV-11)
  const payoutUSDC = parseFloat(claim.payout) / 1e6;
  claim.status = 'APPROVED';
  claim.adjudicator = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
  claim.txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  // 1. BondPool reimburses the vault
  globalState.bondRemainingUSDC = Math.max(0, globalState.bondRemainingUSDC - payoutUSDC);
  globalState.vaultBalanceUSDC += payoutUSDC;

  // 2. Revoke agent qualification in the exact same atomic transaction
  globalState.qualificationActive = false;
  globalState.currentExposureUSDC = 0;

  const consequence = `ATOMIC TX SETTLED: BondPool transferred $${payoutUSDC.toFixed(2)} USDC to Vault. Qualification ${globalState.qualId.slice(0, 10)}... atomically REVOKED on-chain. Authority dropped to $0.00.`;
  claim.consequenceSummary = consequence;

  return { success: true, consequence };
}

export function resetDemoRuntime(): void {
  globalState.vaultBalanceUSDC = 5000.0;
  globalState.currentExposureUSDC = 42.5;
  globalState.windowSpendUSDC = 42.5;
  globalState.bondRemainingUSDC = 2000.0;
  globalState.qualificationActive = true;
  globalState.pendingT2Payments = [
    {
      paymentId: 101,
      vendorId: 'initech_software',
      vendorName: 'Initech Software Systems',
      invoiceNumber: 'INV-2026-T2-01',
      amountUSDC: 240.0,
      poNumber: 'PO-103',
      reason: 'EXCEEDS_T1_PER_TX (Amount $240.00 > $180.00 T1 Cap)',
      submittedAt: Date.now() - 60000,
      expiresAt: Date.now() + 240000,
      proposedRecipient: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    },
  ];
}
