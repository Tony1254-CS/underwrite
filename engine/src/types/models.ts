import { z } from 'zod';
import { ReasonCodeSchema } from './reasonCode.js';
import { AmountSchema } from './money.js';

// Address regex for 20-byte hex (0x prefixed)
export const AddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM address format') as unknown as z.ZodType<Address>;
export type Address = `0x${string}`;

// Hex string regex (0x prefixed)
export const HexSchema = z
  .string()
  .regex(/^0x([a-fA-F0-9]{2})+$/, 'Invalid hex string') as unknown as z.ZodType<Hex>;
export type Hex = `0x${string}`;

export const Bytes32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid bytes32 hex string') as unknown as z.ZodType<Bytes32>;
export type Bytes32 = `0x${string}`;

// Mandate { chainId, vault, token, ownerCeilings{perTx, perWindow, t2PerTx}, windowSeconds, reserveFloor, challengePeriod, recipientCooldown, riskBudgetPerWindow, threatShare }
export const MandateSchema = z.object({
  chainId: z.number().int().positive(),
  vault: AddressSchema,
  token: AddressSchema,
  ownerCeilings: z.object({
    perTx: AmountSchema,
    perWindow: AmountSchema,
    t2PerTx: AmountSchema,
  }),
  windowSeconds: z.number().int().positive().default(86400),
  reserveFloor: AmountSchema,
  challengePeriod: z.number().int().nonnegative().default(300),
  recipientCooldown: z.number().int().nonnegative().default(300),
  riskBudgetPerWindow: AmountSchema,
  threatShare: z.number().min(0).max(1).default(0.2),
});
export type Mandate = z.infer<typeof MandateSchema>;

// Vendor { vendorId: string; name; payoutAddress: Address; perWindowCap: bigint; active: boolean; activatesAt: number }
export const VendorSchema = z.object({
  vendorId: z.string().min(1),
  name: z.string().min(1),
  payoutAddress: AddressSchema,
  perWindowCap: AmountSchema,
  active: z.boolean(),
  activatesAt: z.number().int().nonnegative(),
});
export type Vendor = z.infer<typeof VendorSchema>;

// PurchaseOrder { poNumber; vendorId; amount: bigint; remaining: bigint; status: "OPEN"|"CLOSED" }
export const PurchaseOrderSchema = z.object({
  poNumber: z.string().min(1),
  vendorId: z.string().min(1),
  amount: AmountSchema,
  remaining: AmountSchema,
  status: z.enum(['OPEN', 'CLOSED']),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

// Document { docId; kind: "INVOICE"|"EMAIL"|"GRN"; untrustedText: string; receivedAt }
export const DocumentSchema = z.object({
  docId: z.string().min(1),
  kind: z.enum(['INVOICE', 'EMAIL', 'GRN']),
  untrustedText: z.string(),
  receivedAt: z.number().int().nonnegative(),
});
export type Document = z.infer<typeof DocumentSchema>;

// Proposal { proposalId; vendorId; invoiceNumber; amount: bigint; poNumber?; rationale; sourceDocIds: string[] }
export const ProposalSchema = z.object({
  proposalId: z.string().min(1),
  vendorId: z.string().min(1),
  invoiceNumber: z.string().min(1),
  amount: AmountSchema,
  poNumber: z.string().optional(),
  rationale: z.string().min(1),
  sourceDocIds: z.array(z.string()),
});
export type Proposal = z.infer<typeof ProposalSchema>;

// PolicyDecision { proposalId; tier: "T1"|"T2"|"T3"|"REJECT"; reasons: ReasonCode[]; invoiceKey: Hex; recipient: Address }
export const PolicyDecisionSchema = z.object({
  proposalId: z.string().min(1),
  tier: z.enum(['T1', 'T2', 'T3', 'REJECT']),
  reasons: z.array(ReasonCodeSchema),
  invoiceKey: Bytes32Schema,
  recipient: AddressSchema,
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

// TxRecord { proposalId; tier; txHash?; status: "SUBMITTED"|"EXECUTED"|"REVERTED"|"SUBMIT_FAILED"|"PENDING"|"VETOED"; revertError?; paymentId?; blockNumber? }
export const TxRecordSchema = z.object({
  proposalId: z.string().min(1),
  tier: z.enum(['T1', 'T2', 'T3']),
  txHash: HexSchema.optional(),
  status: z.enum(['SUBMITTED', 'EXECUTED', 'REVERTED', 'SUBMIT_FAILED', 'PENDING', 'VETOED']),
  revertError: z.string().optional(),
  paymentId: z.bigint().optional(),
  blockNumber: z.bigint().optional(),
});
export type TxRecord = z.infer<typeof TxRecordSchema>;

// Manifest { schema:"uw-manifest@2"; agentImpl; provider?; modelId?; temperature?; maxTokens?; systemPromptSha256; toolSchemaSha256; policySourceHash; compilerVersion; vaultSourceVersion; harnessVersion }
export const ManifestSchema = z.object({
  schema: z.literal('uw-manifest@2'),
  agentImpl: z.string().min(1),
  provider: z.string().optional(),
  modelId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  systemPromptSha256: HexSchema,
  toolSchemaSha256: HexSchema,
  policySourceHash: HexSchema,
  compilerVersion: z.string().min(1),
  vaultSourceVersion: z.string().min(1),
  harnessVersion: z.string().min(1),
});
export type Manifest = z.infer<typeof ManifestSchema>;

// QualificationAttestation { qualId; vault; agentKey; configHash; reportHash; corpusHash; examCommitId; ownerInputsHash; t1MaxPerTx; t1MaxPerWindow; t2MaxPerTx; t2Allowed; issuedAt; expiresAt; examiner }
export const QualificationAttestationSchema = z.object({
  qualId: Bytes32Schema,
  vault: AddressSchema,
  agentKey: AddressSchema,
  configHash: Bytes32Schema,
  reportHash: Bytes32Schema,
  corpusHash: Bytes32Schema,
  examCommitId: z.bigint().nonnegative(),
  ownerInputsHash: Bytes32Schema,
  t1MaxPerTx: AmountSchema,
  t1MaxPerWindow: AmountSchema,
  t2MaxPerTx: AmountSchema,
  t2Allowed: z.boolean(),
  issuedAt: z.bigint().nonnegative(),
  expiresAt: z.bigint().nonnegative(),
  examiner: AddressSchema,
});
export type QualificationAttestation = z.infer<typeof QualificationAttestationSchema>;

// Claim { claimId; qualId; paymentId; lossAmount; evidenceHash; status }
export const ClaimSchema = z.object({
  claimId: z.bigint().nonnegative(),
  qualId: Bytes32Schema,
  paymentId: z.bigint().nonnegative(),
  lossAmount: AmountSchema,
  evidenceHash: Bytes32Schema,
  status: z.enum(['FILED', 'APPROVED', 'REJECTED']),
});
export type Claim = z.infer<typeof ClaimSchema>;

// Scenario model per plan §6.2
export const ScenarioExpectedActionSchema = z.object({
  kind: z.enum(['PAY', 'NO_PAY', 'FLAG']),
  vendorId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  amount: AmountSchema.optional(),
});
export type ScenarioExpectedAction = z.infer<typeof ScenarioExpectedActionSchema>;

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  family: z.string().min(1),
  class: z.enum(['BENIGN', 'CLASS_I', 'CLASS_II']),
  split: z.enum(['dev', 'eval']),
  origin: z.string().min(1),
  seed: z.string().min(1),
  inbox: z.array(DocumentSchema),
  worldState: z.object({
    vendors: z.array(VendorSchema),
    purchaseOrders: z.array(PurchaseOrderSchema),
    paidInvoiceKeys: z.array(Bytes32Schema),
    recipientCooldowns: z.record(z.string(), z.number().int()),
  }),
  expected: z.array(ScenarioExpectedActionSchema),
  lossIfWrong: z.number().nonnegative(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;
