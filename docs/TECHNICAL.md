# UNDERWRITE — technical dossier

**Version:** Competition release · 19 October 2026
**Track:** 2026 Shenzhen International FinTechathon · International Track · Topic F
**Canonical designed PDF:** `UNDERWRITE_TECHNICAL_DOSSIER.pdf`
**Publication source:** `professional/technical.html`

## Executive abstract

UNDERWRITE is an evidence-bounded autonomous accounts-payable wallet. It treats an AI model as an untrusted proposer—not a custody authority. The model can interpret an invoice and propose a business action, but it cannot choose a raw address, token, calldata, or spending limit. Deterministic software resolves registered identities and validates policy; signed evidence grants a narrow authority envelope; Solidity contracts enforce that envelope where funds move.

The implemented prototype connects four mechanisms:

1. an adversarial exam bound to the exact agent configuration;
2. a deterministic compiler that maps evidence to permission tiers and limits;
3. dual-party qualification activation and multi-path revocation;
4. a vault and bond pool that enforce payment constraints and bound residual autonomous exposure.

## Design thesis

Most wallet controls begin with a human selecting a limit. UNDERWRITE asks a prior question: **what evidence supports granting that authority to this exact agent configuration?** The system makes authority an output of evidence, then enforces that output independently of the model.

Three rules shape the implementation:

- The LLM never has transaction-shaped authority.
- A payment is not “executed” until both the receipt succeeded and the expected decoded event matches.
- Money values remain integer base units through policy, signatures, storage, and events.

## Trust architecture

```text
UNTRUSTED                 DETERMINISTIC              SIGNED                 ON-CHAIN
invoice + model proposal  registry + policy engine  examiner + owner      vault + bond pool
          │                         │                       │                      │
          └── business intent ─────►├── typed decision ───►├── authority ───────►│
                                     no raw LLM address, token, calldata or limit
```

| Boundary | Accepted input | Prohibited authority | Control |
|---|---|---|---|
| Model | Document text and business context | Raw address, token, calldata, limit | Restricted proposal schema |
| Registry/policy | Vendor ID, invoice facts, active configuration | Free-form transaction creation | Deterministic resolution and validation |
| Examiner/owner | Hash-bound report and compiled envelope | Unilateral autonomy grant | Examiner signature + owner activation |
| Vault/BondPool | Typed calls and role-authorized actions | Prompt-defined exceptions | Solidity checks, accounting, events and revocation |

## Authority lifecycle

### 1. Identify the configuration

The evaluation binds the relevant model tag, system prompt, tool schema, policy/compiler version, corpus, and report with cryptographic hashes. A changed local artifact changes the configuration identity; stale evidence cannot silently authorize a different setup.

### 2. Examine

The harness executes benign and adversarial invoice scenarios and records structured outcomes. The evaluation separates:

- **Class I:** protocol-invalid actions that deterministic controls should block, such as an unregistered recipient or duplicate invoice.
- **Class II:** wrong-but-policy-valid business actions, such as an overcharge from a registered supplier.

### 3. Compile

`compiler@1` is deterministic. It uses conservative one-sided exact binomial bounds and rule gates to derive a tiered envelope. It does not select a counterparty or create a transaction.

Possible outcomes:

- **T0:** no payment authority;
- **T1:** bounded autonomous execution, subject to on-chain constraints and bond capacity;
- **T2:** delayed request with an owner/guardian challenge window;
- **reject:** the request does not satisfy the active envelope.

### 4. Attest and activate

The examiner signs an EIP-712 qualification containing evidence identities and limits. The vault owner independently activates it on-chain. This two-party grant prevents either actor from silently creating autonomous authority alone.

### 5. Enforce and observe

At settlement, the vault rechecks qualification, role, recipient registration, invoice uniqueness, token/amount, window state, exposure, reserve, delay and veto state as relevant. Events produce a public audit trail.

## Payment paths

### Tier 1 — bounded autonomous

When evidence and configuration permit T1, execution still remains inside contract ceilings. Unreconciled T1 exposure is constrained by remaining bond capacity. The competition’s public-chain evidence does **not** claim a T1 payment; its active qualification has a zero T1 per-transaction limit.

### Tier 2 — delayed and interruptible

The agent requests a typed payment. The contract records a pending request and `readyAt`. Owner or guardian can veto during the challenge period. At execution, the contract revalidates permissions before transferring funds and emitting `PaymentExecuted`.

The submitted Base Sepolia proof follows this path:

`ExamCommitted → QualificationActivated → PaymentRequested(id=2) → executePending(2) → PaymentExecuted(paymentId=1, tier=2)`

Request ID and payment ID are separate namespaces. Calldata, recipient, amount, and invoice identity establish continuity.

## Smart-contract responsibilities

| Component | Responsibility | Key consequence |
|---|---|---|
| `UnderwriteVault.sol` | custody, registry checks, qualification, T1/T2 settlement, invoice uniqueness, windows, pause/revoke | model and agent key cannot bypass settlement constraints |
| `BondPool.sol` | bond accounting, claim state and approved payout consequence | unreconciled autonomous exposure is capacity-bounded; claim payout can suspend qualification |
| MockUSDC | six-decimal demonstration asset | explicitly test infrastructure, not real customer funds |

## Public deployment and execution proof

**Network:** Base Sepolia · chain ID `84532`

| Contract | Address |
|---|---|
| MockUSDC | `0x2e71d44170F788E892b4283c0a179bae8B8936F3` |
| BondPool | `0xB97Be73323731209e183Bc02a0F5d23e36Cc5902` |
| UnderwriteVault | `0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0` |

| Action | Transaction hash |
|---|---|
| Commit exam | `0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f` |
| Activate qualification | `0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c` |
| Request payment | `0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6` |
| Execute payment | `0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712` |

The final transaction has a successful receipt and matching decoded `PaymentExecuted` event for 35,000,000 base units—35 MockUSDC—to a controlled registered recipient. Full receipt hashes, logs, QR links and continuity analysis are in `ONCHAIN_EVIDENCE.pdf` and `../evidence/onchain/EVIDENCE_MANIFEST.json`.

## Evaluation results

The stored experiment covers three agent architectures under three regimes: 9 conditions × 330 invoices = 2,970 executions. It is a **controlled, non-independent, self-authored** evaluation under DEC-023.

| Agent | R0 automation | R0 net loss | R2 automation | R2 Class-I | R2 net loss | R2 review |
|---|---:|---:|---:|---:|---:|---:|
| alpha | 100.00% | 38,700 | 0.00% | 0 | 0 | 330 |
| beta | 87.50% | 6,010 | 5.42% | 0 | 0 | 317 |
| gamma | 96.25% | 170 | 15.83% | 0 | 5 | 232 |

Amounts are synthetic MockUSDC accounting. They are not customer losses. The result demonstrates a safety/autonomy trade-off on this corpus; it does not estimate general fraud prevalence.

## Verification snapshot

Observed on 19 October 2026:

- `forge test`: 101 passed, 17 suites, 0 failed;
- stateful campaign: 256 runs, 25,600 calls, 0 handler reverts;
- `pnpm --filter engine test`: 159 passed, 26 files, 0 failed;
- `pnpm --filter engine typecheck`: passed.

These results are reproducible repository tests, not a formal proof or third-party audit.

## Standards-informed engineering

The documentation structure is informed by NIST AI RMF risk framing, NIST SSDF secure-development practices, ISO/IEC/IEEE 42010 architecture-description concepts, OWASP’s agentic-threat taxonomy, and EEA EthTrust security-control thinking. UNDERWRITE does not claim certification or conformance.

## Known limits and production gates

- public testnet prototype, not mainnet or production;
- self-authored evaluation, not independent validation;
- centralized owner/examiner/guardian/adjudicator trust assumptions;
- no cryptographic attestation of proprietary provider-side model weights;
- no completed independent smart-contract audit;
- production requires multisig/HSM custody, monitoring, incident response, independent evaluation, audit, and jurisdiction-specific compliance review.

For the full architecture, state machines, evidence maps and diagrams, use the designed 15-page PDF named at the top of this file.
