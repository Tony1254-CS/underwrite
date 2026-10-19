# UNDERWRITE — competition submission master

**2026 Shenzhen International FinTechathon · International Track · Topic F**
**Theme:** AI as a Financial Participant
**Product:** Evidence-bounded autonomous payment wallet
**Status:** Working prototype with public Base Sepolia evidence
**Document date:** 19 October 2026

> This file is the single submission index and copy source. Replace the bracketed team fields before sending. Every quantitative statement is governed by `CLAIM_LEDGER.md`.

## 1. Registration metadata

| Field | Submission value |
|---|---|
| Team name | `[TEAM NAME]` |
| Team leader | `[FULL LEGAL NAME]` |
| University / institution | `[INSTITUTION]` |
| Country / region | Bangladesh |
| Contact email | `[EMAIL]` |
| Contact phone | `[PHONE WITH COUNTRY CODE]` |
| Repository | `[PUBLIC GITHUB URL]` |
| Demonstration video | `[PUBLIC OR ACCESSIBLE VIDEO URL]` |
| Product URL | `[DEPLOYED URL, IF USED]` |

## 2. Form-ready project description

### 50-word summary

UNDERWRITE is an autonomous accounts-payable wallet in which spending authority must be earned. An adversarial exam measures an exact agent configuration; a deterministic compiler converts the evidence into bounded permissions; owner and examiner activate them; and a Solidity vault enforces recipient, invoice, limit, delay, exposure, and bond constraints on-chain.

### 150-word abstract

AI agents can propose useful financial actions, but a prompt is not a custody control. UNDERWRITE separates language reasoning from money movement. The model may interpret a business document and propose intent; it cannot choose a raw address, token, calldata, or spending limit. Deterministic software resolves registered counterparties and checks policy. A reproducible adversarial exam evaluates the exact agent configuration, and a conservative compiler converts the resulting evidence into tiered authority. An examiner signs that envelope, the vault owner activates it, and the contract enforces it at settlement. Tier 2 adds a challenge window with owner/guardian veto. Tier 1 exposure, when granted, is constrained by remaining bond capacity; approved claims reimburse the vault and suspend qualification atomically. The prototype includes a light-mode web interface, 101 passing contract tests, 159 passing engine tests, a controlled 2,970-execution experiment, and four linked Base Sepolia transactions ending in a successful, decoded `PaymentExecuted` event.

### One-sentence value proposition

UNDERWRITE turns evaluation evidence into enforceable financial authority—and makes the remaining autonomous risk collateral-aware.

## 3. Problem and insight

An autonomous wallet has two distinct failure surfaces:

1. **Protocol-invalid actions:** unregistered recipient, duplicate invoice, invalid token, over-limit payment, replay, or unauthorized caller.
2. **Business-valid but wrong actions:** a registered supplier overcharges, an invoice is semantically fraudulent, or the model misreads legitimate context.

Prompt filters alone address neither surface reliably after a key is compromised. Static owner-entered limits improve containment but do not explain why the agent deserves a given level of autonomy. UNDERWRITE’s core insight is that authority should be a compiled output of evidence, not an optimistic configuration value.

## 4. System response

The product uses a narrow, auditable path:

`untrusted document → agent proposal → deterministic policy → signed authority → on-chain enforcement → receipt evidence`

- **The model proposes intent.** It never receives a tool that accepts a raw recipient address, token, calldata, or amount limit.
- **A registry resolves identity.** Business vendor IDs map to owner-controlled, allow-listed payment endpoints.
- **An exam measures the exact configuration.** Prompt, tool schema, model tag, policy version, corpus, and report are hash-bound.
- **A compiler sizes authority.** Conservative statistical bounds map measured behavior to Tier 0, Tier 1, or Tier 2 limits.
- **Two parties grant; several paths revoke.** Examiner attestation plus owner activation is required. Owner, examiner, expiry, pause, or a claim consequence can remove authority.
- **The vault decides at settlement.** Recipient, invoice uniqueness, amount, qualification, time window, exposure, reserve, and challenge-state checks are enforced in Solidity.
- **A bond constrains residual autonomy.** Unreconciled Tier-1 exposure cannot exceed available backing.

## 5. Why it fits Topic F

| Topic F objective | UNDERWRITE evidence |
|---|---|
| Autonomous on-chain wallet | Agent-originated payment workflow with deterministic policy and contract settlement |
| Asset management and execution | Stablecoin vault, supplier registry, invoice identity, per-transaction/window limits, delayed execution |
| Risk control | Exam-derived authority, two-key activation, veto, pause/revoke, exposure accounting and bond pool |
| Real transaction proof | Four linked Base Sepolia receipts with decoded matching events |
| Security and compliance thinking | Threat model, 14 safety invariants, test mapping, trust assumptions and residual-risk register |
| Interaction quality | Judge-oriented light UI showing authority, decisions, evidence and attack outcomes |

## 6. Evidence snapshot

### Engineering assurance observed on 19 October 2026

| Check | Observed result |
|---|---:|
| Foundry contract tests | 101 passed · 17 suites · 0 failed |
| Stateful invariant campaign | 256 runs · 25,600 calls · 0 handler reverts |
| Engine tests | 159 passed · 26 files · 0 failed |
| Engine typecheck | Passed |

These are repository test results, not an independent audit or formal verification.

### Controlled experiment

Nine conditions were evaluated: three agent architectures under three control regimes, 330 invoices per condition, 2,970 executions total. The corpus and blind set were self-authored under the preregistered fallback in DEC-023; therefore the experiment is **controlled and non-independent**.

- R2 recorded zero Class-I violations for alpha, beta, and gamma on this corpus.
- Gamma R2 recorded one 170 MockUSDC Class-II loss, 165 reimbursement, and 5 net loss.
- Increased safety came with a visible review-burden trade-off.
- Values are synthetic MockUSDC accounting, not production or customer losses.

The report makes no claim that these rates generalize to real-world fraud distributions.

## 7. Real public-chain evidence

**Network:** Base Sepolia · chain ID `84532` · public testnet
**Vault:** `0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0`
**BondPool:** `0xB97Be73323731209e183Bc02a0F5d23e36Cc5902`
**MockUSDC:** `0x2e71d44170F788E892b4283c0a179bae8B8936F3`

| Sequence | Action | Transaction hash | Verified condition |
|---:|---|---|---|
| 1 | Exam committed | `0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f` | Success receipt + matching `ExamCommitted` |
| 2 | Qualification activated | `0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c` | Success receipt + matching `QualificationActivated` |
| 3 | Payment requested | `0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6` | Success receipt + matching `PaymentRequested` |
| 4 | Payment executed | `0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712` | Success receipt + matching `PaymentExecuted` |

The payment is a controlled Tier-2 transfer of `35,000,000` token base units—35 MockUSDC at six decimals—to the registered demonstration recipient. The execution input decodes to `executePending(2)`. `PaymentRequested.id = 2` and `PaymentExecuted.paymentId = 1` are intentionally separate contract namespaces; recipient, amount, and invoice identity match. No Tier-1 public-chain payment is claimed.

Judge-ready proof: `docs/ONCHAIN_EVIDENCE.pdf`
Machine-readable proof: `evidence/onchain/EVIDENCE_MANIFEST.json`

## 8. Submission package

| Priority | Artifact | Final file | Purpose |
|---:|---|---|---|
| 1 | Presentation | `docs/deck/UNDERWRITE_PITCH_DECK.pdf` | 13-slide, sub-10-minute competition narrative |
| 2 | Technical dossier | `docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf` | Architecture, authority lifecycle, compiler, contracts, data and verification |
| 3 | Security self-assessment | `docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf` | Threat model, invariants, control coverage, residual risks and production gates |
| 4 | On-chain evidence dossier | `docs/ONCHAIN_EVIDENCE.pdf` | Human-readable transaction continuity and receipt proof |
| 5 | Editable deck | `docs/deck/UNDERWRITE_PITCH_DECK.pptx` | Source presentation with vector-native layout |
| 6 | Repository | `[PUBLIC GITHUB URL]` | Source, tests, setup, deployments, experiment and evidence |
| 7 | Video | `[VIDEO URL]` | Optional ≤5-minute product demonstration |

Canonical source pages for the three dossiers are under `docs/professional/`. Product screenshots embedded in competition artifacts are light-mode captures and are labeled when scripted, simulated, or controlled.

## 9. Two-minute judge verification

```bash
# contracts
cd contracts
forge test

# engine
cd ..
pnpm --filter engine test
pnpm --filter engine typecheck

# evidence integrity
Get-FileHash evidence/onchain/receipts/*.json -Algorithm SHA256
```

Compare receipt digests with `evidence/onchain/EVIDENCE_MANIFEST.json`, then open the execution transaction in the explorer from the QR/link in `docs/ONCHAIN_EVIDENCE.pdf`.

## 10. Honest boundaries

- Prototype on a public testnet; not production or mainnet activity.
- Security self-assessment; no independent smart-contract audit completed.
- Controlled, self-authored evaluation; not independent research.
- Central examiner, owner, guardian, and adjudicator roles remain trust assumptions.
- Proprietary-model weights and provider-side changes are not cryptographically attested.
- MockUSDC and controlled demonstration addresses are not real customer funds or counterparties.
- Production launch requires independent audit, multisig/HSM custody, monitoring, incident response, compliance review, and operational key ceremonies.

## 11. Final send checklist

- [ ] Replace every bracketed team field.
- [ ] Confirm repository and video links open while logged out.
- [ ] Attach registration form, passport bio pages, and current enrollment proof for every member.
- [ ] Open all four final PDFs on another device and verify links, fonts, and page order.
- [ ] Rehearse the 13-slide deck using `docs/deck/SPEAKER_NOTES.md`; remain below 10 minutes.
- [ ] Ensure every video/product screenshot shown in supporting material is light mode.
- [ ] Send before **20 October 2026, 23:59 Beijing time / 21:59 Bangladesh time** and retain the sent-email record.
