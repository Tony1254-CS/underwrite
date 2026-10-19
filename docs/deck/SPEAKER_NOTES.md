# UNDERWRITE — 8:45 competition talk track

**Delivery target:** 8 minutes 45 seconds
**Hard limit:** 10 minutes
**Demo rule:** The deck is self-contained. If a live demo fails, continue; the light-mode captures and public-chain proof preserve the argument.

## 1 · Authority must be earned — 0:00–0:35

“AI agents are becoming financial participants, but intelligence is not authority. UNDERWRITE is an autonomous payment wallet where spending authority is measured, enforced on-chain, and collateral-aware. Our principle is simple: authority must be earned.”

## 2 · The control gap — 0:35–1:10

“A model can be useful and still be manipulated, mistaken, or compromised. Prompt injection can turn invoice text into an instruction. A model can hallucinate business intent. A stolen agent key can bypass the model entirely. So the question is not whether the model can pay. It is who measured, granted, bounded, and can revoke that authority.”

## 3 · The thesis — 1:10–1:45

“We use four steps. First, test the exact agent configuration against benign and adversarial cases. Second, compile conservative risk bounds into permission tiers. Third, require an examiner signature and owner activation. Fourth, enforce the same envelope in the vault. The model proposes; deterministic software decides; the contract settles.”

## 4 · Working product — 1:45–2:20

“This is the working local interface in light mode. A business user starts with an invoice and vendor identity, not a raw address. The UI exposes the path from agent proposal through deterministic policy to the contract. Scripted and public-chain evidence are labeled separately so a judge can see exactly what is real.”

## 5 · Trust architecture — 2:20–2:58

“The language model sits in the untrusted zone. It never chooses a raw address, token, calldata, or limit. A deterministic registry resolves counterparties and validates policy. Role keys attest and consent. Only the on-chain vault and bond pool can move funds. This narrow path is our main security boundary.”

## 6 · Evidence to authority — 2:58–3:40

“An exam is bound to the prompt, tool schema, model tag, policy, corpus, and report by hashes. The compiler uses conservative one-sided bounds. Weak or missing evidence produces Tier 0. Stronger evidence may earn bounded Tier 1; uncertain cases route to delayed Tier 2. The compiler never produces a recipient or transaction.”

## 7 · Permission ladder — 3:40–4:15

“Tier 0 rejects. Tier 1 is autonomous but must remain inside recipient, invoice, amount, window, exposure, and bond constraints. Tier 2 creates a pending request with a challenge period and owner or guardian veto. The real public-chain example today is Tier 2; we do not claim a Tier-1 testnet execution.”

## 8 · Real execution evidence — 4:15–5:05

“Here is the Topic-F proof. Four Base Sepolia transactions commit the exam, activate the qualification, request payment, and execute the pending request. Every row has a successful receipt and a matching decoded event. The final call decodes to `executePending(2)` and emits `PaymentExecuted` for 35 MockUSDC. The QR opens the public explorer.”

If questioned about IDs: “The request ID is 2 and the payment ID is 1 because the contract uses separate namespaces. Calldata, recipient, amount, and invoice continuity match.”

## 9 · Assume compromise — 5:05–5:43

“The security model assumes the model—or even the agent key—can fail. The contract still rejects unregistered recipients, duplicate invoices, excessive amounts, invalid qualifications, premature Tier-2 execution, and exposure beyond backing. The screenshot is a controlled local Attack Lab demonstration, clearly labeled.”

## 10 · Controlled evaluation — 5:43–6:37

“We evaluated three agent architectures under three regimes: 9 conditions, 330 invoices each, 2,970 controlled executions. The study is self-authored and non-independent. R2 recorded zero Class-I violations for all three agents on this corpus. Gamma R2 still had one 170 MockUSDC Class-II loss; a 165 reimbursement left 5 net loss. Safety improved by routing more work to review, so we show the trade-off instead of hiding it.”

## 11 · Assurance case — 6:37–7:20

“On 19 October we reran the repository: 101 Foundry tests passed across 17 suites, 159 engine tests passed across 26 files, and the stateful campaign completed 25,600 calls with zero handler reverts. The assessment maps 14 safety invariants to tests and discloses central-role and key-custody risks. This is not an independent audit.”

## 12 · What is distinctive — 7:20–8:05

“Many wallets let an owner type a limit, and smart accounts can enforce policies. UNDERWRITE’s contribution is the mechanical coupling: an exam and compiler size authority; the vault enforces that envelope; and bond capacity limits unreconciled autonomous exposure. We do not claim to be the only secure wallet or production-ready. We claim a working, verifiable coupling.”

## 13 · Close — 8:05–8:45

“Do not trust an agent with unlimited authority. Give it the authority its evidence can support, then enforce the boundary where the money moves. This final QR is the successful Base Sepolia execution. The technical dossier, security assessment, evidence dossier, source, and tests are all included. Thank you.”

## Question anchors

- **Why not rely on an LLM guardrail?** A guardrail shares the model’s failure surface; settlement constraints must be deterministic and enforceable after key compromise.
- **Is the evaluation independent?** No. It is controlled and self-authored under the documented fallback. Independent replication is a next step.
- **Is this audited?** No. It is a security self-assessment backed by tests; independent audit is a production gate.
- **Why a bond?** It turns residual autonomous exposure into an explicit capacity constraint instead of an unbounded externality.
- **What is real?** The code, tests, light-mode product, deployment, four Base Sepolia receipts, decoded events, and linked Tier-2 execution. Customer activity and mainnet use are not claimed.
