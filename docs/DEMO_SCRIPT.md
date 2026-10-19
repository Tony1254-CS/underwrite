# UNDERWRITE — 4:40 judge demo

**Purpose:** optional competition video and live-defense fallback
**Visual rule:** light mode only
**Evidence rule:** keep `CONTROLLED LOCAL DEMO` or `REAL BASE SEPOLIA` visible whenever the classification could be ambiguous

## Evidence legend

- **Controlled local demo:** scripted/replayed product state using demonstration data.
- **Real Base Sepolia:** public testnet receipt with successful status and matching decoded event.
- **Not shown as real:** no mainnet activity, customer payment, independent audit, or Tier-1 public-chain payment.

## 0:00–0:25 · Open on the product home

**Screen:** `/` in light mode.

**Say:**

“An AI can interpret an invoice, but that does not make it a custody authority. UNDERWRITE gives an agent only the spending authority its evidence can support, then enforces that boundary on-chain.”

**Show:** the four-stage product path: exam, compile, activate, enforce.

## 0:25–1:05 · Show the trust boundary

**Screen:** `/dashboard` in light mode. Keep the controlled-demo label visible.

**Say:**

“The model proposes a business action. It never chooses a raw address, token, calldata, or limit. A deterministic registry resolves the vendor, policy checks the request, signed evidence grants an envelope, and the vault remains the only settlement authority.”

**Show:** vendor identity, qualification/tier, and authority meter. Do not imply live customer data.

## 1:05–1:50 · Show how authority is earned

**Screen:** `/exam` in light mode.

**Say:**

“The exam is bound to this exact configuration: prompt, tools, model tag, policy, corpus and report. A deterministic compiler converts measured outcomes into conservative limits. Missing or weak evidence produces Tier 0. Uncertain actions route to Tier 2 with a challenge period.”

**Show:** configuration/report hashes and compiler output. Identify the page as a controlled local demonstration.

## 1:50–2:35 · Show compromise containment

**Screen:** `/attack-lab` in light mode.

**Say:**

“Now assume the model—or its key—is compromised. A malicious invoice proposes a new recipient. The application rejects the unresolved vendor, and the contract independently retains recipient, invoice, amount, qualification, timing and exposure checks. The important property is that model failure does not erase the settlement boundary.”

**Show:** one blocked attack. Keep `SIMULATED / CONTROLLED` visible. State “zero funds moved in this local scenario,” not as a global guarantee.

## 2:35–3:35 · Show the real on-chain path

**Screen:** `/evidence` in light mode, then the explorer link/QR for the final transaction.

**Say:**

“This section is real public testnet evidence. On Base Sepolia we committed the exam, activated the qualification, requested a Tier-2 payment, and executed it after the challenge period. The final call decodes to `executePending(2)`. Its successful receipt contains the matching `PaymentExecuted` event for 35 MockUSDC.”

**Show in order:**

1. `0x3fd70ecf…b7f58f` — `ExamCommitted`
2. `0x9e3bef85…ef9d8c` — `QualificationActivated`
3. `0x20a245ff…594f6` — `PaymentRequested(id=2)`
4. `0xf19d5e20…ad712` — `PaymentExecuted(paymentId=1, tier=2)`

**Continuity line:**

“Request ID 2 and payment ID 1 are separate namespaces; calldata, recipient, amount, and invoice identity match. This is a controlled Base Sepolia transaction, not mainnet and not Tier 1.”

## 3:35–4:15 · Show measured trade-offs

**Screen:** `/experiment` in light mode.

**Say:**

“We also ran a controlled 3-by-3 evaluation: three agents, three regimes, 330 invoices per condition—2,970 executions. It is self-authored and non-independent. R2 recorded zero Class-I violations across all three agents on this corpus. Gamma R2 still recorded a 170 MockUSDC Class-II loss; a 165 reimbursement left 5 net loss. More safety also moved more work to review.”

**Show:** matrix plus the non-independent label. Do not say the results predict real-world fraud.

## 4:15–4:40 · Close on dashboard or title card

**Say:**

“The repository rerun produced 101 passing contract tests, 159 passing engine tests, and 25,600 stateful invariant calls. This is a testnet prototype and self-assessment, not an audit. UNDERWRITE’s contribution is the coupling: evidence sizes authority, the contract enforces it, and bond capacity bounds the residual autonomous exposure.”

End card:

> **Do not trust an agent with unlimited authority. Make authority earnable, enforceable, and revocable.**

## Recording acceptance checklist

- [ ] Runtime is 5:00 or less.
- [ ] Every product view is light mode.
- [ ] Browser zoom is consistent; personal tabs, bookmarks, wallet balances and notifications are hidden.
- [ ] Controlled/scripted and real testnet scenes are visibly labeled.
- [ ] No private key, seed phrase, API key or `.env` content appears.
- [ ] English subtitles are burned in or attached and checked.
- [ ] Explorer hash is readable for at least three seconds.
- [ ] Video and audio were tested on another device while logged out.
