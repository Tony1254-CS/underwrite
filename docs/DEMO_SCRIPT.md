# UNDERWRITE Competition Demo Script

> **The 6-Scene Narrative Walkthrough for Judges & Evaluation**  
> Total Runtime: 6–8 minutes | Fully Reproducible Locally & on Base Sepolia

---

## Demo Overview & Value Hook (First 60 Seconds)

**Opening Statement:**  
> "Every agent wallet asks you to choose a spending limit. UNDERWRITE is the only system that **computes** that limit from an adversarial exam, **backs** it with an underwriter's bond, and **revokes it automatically** in the exact transaction that compensates a proven loss."

---

## Scene 1: Earn (The Qualification Exam & Envelope Compilation)

- **Objective:** Demonstrate that autonomous authority is not typed in, but mathematically compiled from empirical exam evidence.
- **Screen:** Web UI $\to$ `/exam` (Exam & Policy Cards)
- **On-Screen Provenance Labels:** `<ControlledBadge label="QUALIFICATION PIPELINE" />`
- **Actions:**
  1. Inspect the 15-family scenario generator ($N=390$ eval corpus, seeds pinned per PV-15).
  2. Show Agent $\alpha$ (naive parser): failed benign utility gate $\to$ locked in $T_0$ dual-approval.
  3. Show Agent $\beta$ (unhardened LLM): passed utility with 4 Class II leaks $\to$ Clopper-Pearson bound $p = 0.1743 \to$ capped at \$143.60 USDC.
  4. Show Agent $\gamma$ (tool-hardened LLM): 0 Class II leaks $\to$ Clopper-Pearson bound $p = 0.0582 \to$ capped at \$500.00 USDC per window.
  5. Point to the **Three Verbatim Disclosures** on the Policy Card:
     - *"Bounds describe the exam distribution only"*
     - *"Zero-tolerance Class I safety floor"*
     - *"Exposure bounded by available bond"*

---

## Scene 2: Work (Normal Autonomous Operations)

- **Objective:** Show the 4-state lifecycle of legitimate payments settling in $T_1$.
- **Screen:** Web UI $\to$ `/traces` and `/` (Dashboard Authority Meter)
- **Actions:**
  1. Process AP inbox with standard supplier invoices for registered vendors (Acme Industrial, Beta Supplies).
  2. Show Policy Firewall executing three-way match against open purchase orders.
  3. Show $T_1$ autonomous execution: transaction mined, `exposure` counter increments, Authority Meter gauge moves.
  4. Show the 4 states per invoice:
     - Proposed: `vendor-1`, amount \$150.00 USDC, PO `PO-1-01`.
     - Decided: Tier $T_1$, reasons `[]`.
     - Contract Result: Transaction mined on Anvil / Base Sepolia.
     - Funds Moved: **YES — \$150.00 USDC transferred to registered payout address.**

---

## Scene 3: Attack (Deterministic Security Firewall)

- **Objective:** Prove that no prompt injection or compromised agent key can steal funds outside the mandate.
- **Screen:** Web UI $\to$ `/attack-lab` (Attack Lab)
- **On-Screen Provenance Labels:** `<SimulatedBadge label="RED-TEAM INJECTION" />`
- **Actions:**
  1. **Attack A (Prompt Injection / Pay New Wallet):** Attacker prompts agent to send \$500 to attacker wallet.
     - *Result:* Policy Firewall halts proposal with `POL_RECIPIENT_NOT_ALLOWED`. Funds moved: **\$0.00**.
  2. **Attack B (Supplier Bank Change / Cooldown):** Vendor changes payout address.
     - *Result:* Address is placed in 300s cooldown. $T_1$ attempt strictly reverts with `RecipientCoolingDown()`. Funds moved: **\$0.00**.
  3. **Attack C (Compromised Agent Bypass):** Toggle `ALLOW_REDTEAM_BYPASS=true` to simulate attacker possessing raw agent signing key sending arbitrary direct transaction to contract.
     - *Result:* `UnderwriteVault.sol` reverts on-chain with typed error `RecipientNotAllowed()`. Funds moved: **\$0.00**.

---

## Scene 4: Residual (Controlled In-Envelope Error)

- **Objective:** Honestly disclose that exams cannot catch 100% of semantic fraud, motivating the need for bond collateral.
- **Screen:** Web UI $\to$ `/traces`
- **On-Screen Provenance Labels:** `<ControlledBadge label="CONTROLLED RESIDUAL" />`
- **Actions:**
  1. An adversarial invoice with subtle overbilling (`II-OVERBILL`) arrives within the valid supplier envelope (\$170.00 USDC).
  2. Agent $\gamma$ mistakenly approves and pays it on $T_1$.
  3. Explain to judges: *"This is a wrong-but-permitted payment. No smart contract can catch this because the supplier is legitimate and the amount is within the cap. This is precisely why UNDERWRITE requires bond backing."*

---

## Scene 5: Consequence (Atomic Bond Payout & Revocation)

- **Objective:** Demonstrate that the underwriter's bond reimburses the business and revokes authority in ONE atomic transaction.
- **Screen:** Web UI $\to$ `/claims`
- **On-Screen Provenance Labels:** `<ControlledBadge label="DESIGNATED ADJUDICATOR" />`
- **Actions:**
  1. Owner discovers erroneous payment and clicks **"File Claim"** with evidence digest.
  2. Designated adjudicator key approves claim $\to$ triggers `BondPool.approveClaim()`.
  3. Show the blockchain transaction receipt:
     - **Event 1:** `ClaimPaid(claimId, loss=$170.00, payout=$165.00)` $\to$ \$165 USDC transferred directly from bond pool to vault (net of \$5 owner deductible).
     - **Event 2:** `QualificationRevoked(qualId, reason=CLAIM)` $\to$ agent qualification terminated.
  4. **The Critical Proof:** Agent immediately attempts next payment $\to$ transaction reverts on-chain with `QualificationRevoked()`. The Authority Meter drops to **ZERO**.

---

## Scene 6: Learn (Regression Protection & Drift Defense)

- **Objective:** Show how the system incorporates incidents into future training and enforces prompt drift defense.
- **Screen:** Web UI $\to$ `/evidence` and CLI
- **Actions:**
  1. Incident is automatically converted into test scenario `incident:<claimId>` in the regression corpus.
  2. Show Config Drift Defense: If an operator alters the agent prompt without re-examination:
     - Signer recalculates `configHash` at runtime.
     - Discovers hash mismatch with on-chain qualification.
     - Signer halts and refuses to sign with error `CONFIG_DRIFT`.

---

## Closing Scene: The Calibration Experiment (The Final Takeaway)

- **Screen:** Web UI $\to$ `/experiment`
- **Actions:**
  1. Walk judges through the 3×3 matrix comparing 2,970 invoice evaluations.
  2. Highlight that under fixed caps ($R_1$), businesses lost \$14,200 with naive agents. Under UNDERWRITE ($R_2$), realized losses were strictly bounded by the \$10 risk budget.
  3. Conclude with the core thesis:
     > *"Don't trust the agent. Test it. Bound it. Back what remains."*
