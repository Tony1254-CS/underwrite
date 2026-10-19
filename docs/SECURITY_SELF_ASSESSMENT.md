# UNDERWRITE — security self-assessment

**Version:** Competition release · 19 October 2026
**Assessment type:** First-party design and implementation review
**Canonical designed PDF:** `UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf`
**Publication source:** `professional/security.html`

## Assurance statement

UNDERWRITE is a public-testnet prototype, not an audited production custody system. This self-assessment explains the security boundary, maps safety properties to implementation evidence, records observed tests, and lists residual risks and production gates. It does not claim formal verification, regulatory approval, or third-party assurance.

## Scope

In scope:

- `UnderwriteVault.sol` and `BondPool.sol`;
- qualification, attestation, tier selection and compiler outputs;
- registry and policy boundary;
- invoice identity, delayed execution, veto, pause/revoke, exposure and claim consequence;
- evidence recording and competition UI representation.

Out of scope:

- security of browser wallets, operating systems, RPC providers and proprietary model providers;
- economic soundness under production capital scale;
- jurisdiction-specific licensing or compliance conclusions;
- independent audit of deployed bytecode.

## Security objectives

1. Compromise of model output must not create arbitrary transaction authority.
2. Compromise of the agent key must remain bounded by contract policy.
3. Authority must be tied to an exact evaluated configuration and require separate consent.
4. Payment execution must be traceable through successful receipts and matching decoded events.
5. Residual autonomous exposure must be explicitly capacity-constrained.
6. Simulated, scripted, controlled and public-chain evidence must never be conflated.

## Assets and roles

| Asset | Primary risk | Enforcing control |
|---|---|---|
| Vault tokens | unauthorized or excessive transfer | registry, qualification, amount/window, invoice and role checks |
| Qualification | stale, forged or over-broad authority | hash binding, EIP-712 examiner signature, owner activation, expiry/revoke |
| Invoice identity | replay or duplicate settlement | unique invoice key reservation and settlement state |
| Bond capacity | overcommitted autonomous exposure | exposure accounting against remaining backing |
| Evidence record | false execution claim | receipt status + decoded event + stored digest |
| Role keys | unilateral misuse or theft | separation of duties, pause/revoke paths; multisig/HSM remains a production gate |

Roles are owner, agent, examiner, guardian, adjudicator and registered supplier. Each is treated as potentially mistaken or compromised within the limits documented below.

## Trust boundaries

- **Untrusted:** document content, model output, network content and agent intent.
- **Deterministic application boundary:** registry lookup, schema validation, compiler and policy checks.
- **Authorized signer boundary:** examiner attestation, owner activation, guardian/owner veto and emergency actions.
- **On-chain boundary:** custody, state transitions, accounting, event emission and enforcement.

The model has no tool that accepts a raw address, token, calldata or limit. That restriction reduces capability at the first boundary; the contract independently rechecks constraints at the final boundary.

## Threat analysis

| Threat | Attempted consequence | Implemented response | Residual risk |
|---|---|---|---|
| Prompt injection in invoice | redirect or inflate payment | typed proposal, deterministic registry/policy, contract recipient/amount checks | semantically plausible registered-supplier fraud can remain Class II |
| Hallucinated vendor or amount | wrong business payment | ID resolution, PO/policy checks, limits and review routing | source data itself may be wrong |
| Compromised agent key | direct malicious contract calls | caller, qualification, recipient, invoice, limit, window and exposure checks | allowed-envelope abuse remains possible |
| Duplicate/replay | pay one obligation twice | invoice-key state and signature/domain separation | faulty upstream identity normalization can cause collisions or misses |
| Stale qualification | use evidence for changed configuration | config/corpus/report binding and latest-commit checks | proprietary provider internals are not attested |
| Premature Tier-2 execution | bypass human challenge | `readyAt`, veto state and execution-time revalidation | compromised owner/guardian operations |
| Bond overcommitment | create unbacked T1 exposure | free-bond and exposure accounting | market/liquidity/legal enforceability outside prototype |
| False claim approval | transfer bond improperly | payout caps, evidence hash, fixed vault destination | adjudicator is a central trust assumption |
| UI/evidence misrepresentation | claim a simulated result as real | explicit labels, manifest, receipt/event requirement | documentation process remains human-operated |

## Fourteen safety invariants

| ID | Property |
|---|---|
| INV1 | Agent-controlled flows are restricted to defined payment paths; there is no arbitrary execution interface. |
| INV2 | Contract limits dominate model or application suggestions. |
| INV3 | A payment requires a registered recipient and supported token path. |
| INV4 | Qualification activation requires examiner attestation and owner consent. |
| INV5 | Invoice identity cannot be settled twice. |
| INV6 | Integer base-unit accounting is preserved; no floating-point money enters settlement. |
| INV7 | Paused, revoked, expired or otherwise invalid authority cannot execute. |
| INV8 | Tier-2 execution waits until `readyAt`, remains vetoable, and is revalidated at execution. |
| INV9 | Qualification signatures are domain-separated and bound to the intended vault/configuration. |
| INV10 | Unreconciled Tier-1 exposure cannot exceed available bond capacity. |
| INV11 | Approved claim consequence pays only under bounded rules and suspends the affected qualification atomically. |
| INV12 | Window and per-transaction ceilings cannot be bypassed by call sequencing. |
| INV13 | Activation binds to the latest compatible exam commitment and corpus identity. |
| INV14 | A payment is recorded as executed only after success receipt plus matching decoded `PaymentExecuted`. |

Exact test mappings and control references are presented in the designed security PDF. Test names retain `INV<n>_` identifiers so the assurance claim is traceable in the repository.

## Observed verification

The following commands were rerun on 19 October 2026:

| Command | Observed result |
|---|---|
| `cd contracts && forge test` | 101 passed · 17 suites · 0 failed |
| Stateful invariant campaign | 256 runs · 25,600 calls · 0 handler reverts |
| `pnpm --filter engine test` | 159 passed · 26 files · 0 failed |
| `pnpm --filter engine typecheck` | passed |

Passing tests increase confidence in the tested behaviors; they do not establish absence of vulnerabilities.

## Public-chain execution rule

The competition evidence includes a Tier-2 payment only because both conditions are satisfied:

1. Base Sepolia receipt status is successful; and
2. the receipt contains a matching decoded `PaymentExecuted` event.

Execution hash:

`0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712`

The call decodes to `executePending(2)`. The event reports `paymentId=1`; those identifiers belong to separate namespaces. Recipient, amount and invoice identity match the prior request. See `ONCHAIN_EVIDENCE.pdf` and `../evidence/onchain/EVIDENCE_MANIFEST.json`.

## Residual-risk register

| Risk | Current disposition | Production requirement |
|---|---|---|
| No independent audit | accepted for competition prototype | independent contract and application audits |
| Central role keys | disclosed trust assumption | multisig/HSM, key ceremony, rotation and recovery |
| Self-authored evaluation | results labeled non-independent | external corpus and independent red-team replication |
| Model-provider opacity | local hashes cannot attest remote weights | provider assurance or TEE/attested inference where justified |
| Adjudicator discretion | bounded but centralized | dispute policy, multisig/panel or appropriate oracle design |
| Testnet asset/deployment | no production economic assurance | staged deployment, monitoring and incident drills |
| Regulatory uncertainty | no compliance conclusion | jurisdiction-specific legal, AML/sanctions and data review |

## Release recommendation

**Competition demonstration:** suitable with explicit controlled/testnet labels and the documented trust assumptions.
**Production funds:** not approved. Complete the listed production gates before any real-customer or mainnet deployment.
