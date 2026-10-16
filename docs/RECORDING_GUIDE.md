# One-Take Screen Recording Guide (Zero Video Editing)

> **UNDERWRITE Competition Demo Walkthrough**  
> **Target Duration:** 5 to 6 minutes  
> **Method:** Single, continuous, unedited take using OBS Studio, Zoom, or Windows Game Bar (`Win + Alt + R`).  
> **Requirement:** Zero video editing required. Just click through the UI tabs while speaking the script below.

---

## 0. Quick Preparation (Do this before pressing Record)

1. Open a terminal and start the offline demo environment:
   ```bash
   pnpm --filter web start -p 3000
   ```
   *(Ensure local Anvil is running on port 8545 or use `scripts/demo-local.sh`)*.
2. Open your browser to `http://localhost:3000`.
3. Set your browser window to **1920x1080** (Full Screen / F11) or zoom to **100%**.
4. Keep the 7 page tabs ready or click the clean top navigation bar in this order:
   - **Tab 1:** `/` (Dashboard / Authority Meter)
   - **Tab 2:** `/exam` (Exam & Policy Cards)
   - **Tab 3:** `/traces` (Run Traces & 4-State Flow)
   - **Tab 4:** `/attack-lab` (Attack Lab)
   - **Tab 5:** `/claims` (Claims & Atomic Adjudication)
   - **Tab 6:** `/evidence` (Evidence & Verifier)
   - **Tab 7:** `/experiment` (Calibration Experiment)
5. Hit **Record**.

---

## The One-Take Spoken Script (Follow Step-by-Step)

### [0:00 – 0:45] The 60-Second Hook & Problem (Screen on `/`)

**What to do:**
- Start on the **Dashboard** (`http://localhost:3000/`).
- Mouse over the **Authority Meter** gauge and the **Window Spend** bar.

**What to say (verbatim or natural):**
> "Hi judges, I'm Tony presenting UNDERWRITE for FinTechathon 2026 Topic F.
> Today, every autonomous agent wallet on the market asks an operator to guess a spending limit—like arbitrarily setting a $1,000 daily cap. If an agent gets prompt-injected or hallucinates, the business loses $1,000.
> UNDERWRITE solves this fundamental flaw. We are the only system where autonomous authority is not guessed: it is **empirically compiled** from an adversarial exam, **backed** by an underwriter's bond, and **revoked automatically** in the exact transaction that compensates a proven loss.
> Let me show you how this works in 6 quick scenes."

---

### [0:45 – 1:45] Scene 1: Earn (Screen on `/exam`)

**What to do:**
- Click **"Exam & Policy Cards"** in the top navigation bar (`/exam`).
- Scroll smoothly down the page showing Agent $\alpha$, Agent $\beta$, and Agent $\gamma$.
- Point your cursor at the **Three Verbatim Disclosures** box and the **Sensitivity Table**.

**What to say:**
> "Scene 1 is **Earn**. Before an agent touches real money, it sits for an adversarial exam of 390 scenarios covering 15 threat families.
> Our deterministic risk compiler, `compiler@1`, takes the test results and computes exact Clopper-Pearson upper confidence bounds.
> Look at the side-by-side results:
> - Agent Alpha, a naive parser, failed the basic utility gate and is locked in Tier 0—zero autonomous authority.
> - Agent Beta made 4 errors, giving a statistical error bound of 17.4%, so the compiler caps it at $143.60.
> - Agent Gamma, our hardened agent, made zero errors, achieving a 5.8% bound and earning a full $500 per window authority.
> Because Clopper-Pearson bounds contract as sample size increases, authority literally grows with evidence."

---

### [1:45 – 2:30] Scene 2: Work (Screen on `/traces`)

**What to do:**
- Click **"Run Traces"** (`/traces`).
- Scroll through the executed invoices.
- Point to the **4-state status indicators**: Proposed $\to$ Decided $\to$ Contract Result $\to$ Funds Moved.

**What to say:**
> "Scene 2 is **Work**. When legitimate invoices arrive, the agent proposes payments, but has zero direct transaction authority.
> Every proposal passes through a deterministic policy firewall that verifies supplier registration, cooling-down periods, and a three-way match against open purchase orders.
> Notice the 4 distinct states tracked for every invoice: proposed, decided, contract transaction mined, and funds moved.
> Normal payments execute autonomously on Tier 1 within milliseconds, moving money only to pre-registered supplier addresses."

---

### [2:30 – 3:30] Scene 3: Attack (Screen on `/attack-lab`)

**What to do:**
- Click **"Attack Lab"** (`/attack-lab`).
- Click **"Simulate Prompt Injection"** (Attack A). Point to `$0.00` funds moved.
- Click **"Simulate Bank Detail Change"** (Attack B). Point to `RecipientCoolingDown` error.
- Toggle the red switch **"Enable Raw Bypass"** and click **"Send Raw Compromised Call"** (Attack C). Point to on-chain `RecipientNotAllowed` revert.

**What to say:**
> "Scene 3 is **Attack**. Let's simulate an adversary trying to steal funds.
> First, Prompt Injection: an attacker crafts an invoice instructing the agent to remit $500 to a new wallet. The policy firewall blocks it immediately: zero funds moved.
> Second, Bank Detail Spoofing: a compromised vendor changes their payout address. The vault places it in a mandatory 300-second cooldown; any Tier 1 attempt strictly reverts with `RecipientCoolingDown`.
> Third, what if an attacker steals the agent's raw private key? Even with raw key access, our smart contract vault verifies the recipient registry on-chain. The call reverts with `RecipientNotAllowed`. Not a single dollar leaves the vault."

---

### [3:30 – 4:30] Scene 4 & 5: Residual & Consequence (Screen on `/claims`)

**What to do:**
- Click **"Claims & Adjudication"** (`/claims`).
- Scroll to the **"Interactive Claim & Revocation Simulation"**.
- Click **"Step 1: Process In-Envelope Error ($170)"**.
- Click **"Step 2: File Claim & Adjudicate Payout"**.
- Point to the dual outcome: **Claim Paid ($165 USDC)** and **Qualification Revoked (REVOKED)**.
- Click **"Step 3: Attempt Next Payment"**. Point to the red revert banner `QualificationRevoked()`.

**What to say:**
> "Scenes 4 and 5: **Residual and Consequence**.
> No AI model is 100% perfect. What happens when an invoice with subtle overbilling slips through inside a legitimate vendor envelope?
> Here in Scene 4, a $170 invoice was paid on Tier 1. This is where other systems leave the business to suffer the loss.
> But in UNDERWRITE, the qualification is backed by an underwriter's bond.
> Watch Scene 5: The owner files a claim with the evidence hash. The adjudicator approves it.
> In **ONE single atomic transaction**:
> First, the BondPool pays out $165 directly to the vault, reimbursing the business minus the $5 deductible.
> Second, the contract immediately revokes the agent's qualification.
> When the agent attempts its next payment, the transaction reverts on-chain with `QualificationRevoked`. The agent is completely disabled until re-examined."

---

### [4:30 – 5:15] Scene 6: Calibration Matrix & Integrity (Screen on `/experiment`)

**What to do:**
- Click **"Calibration Matrix"** (`/experiment`).
- Scroll past the SVG chart to the **3x3 Experimental Matrix table**.
- Highlight the **H1–H4 hypothesis verdicts** at the bottom.

**What to say:**
> "Finally, let's look at the science. We pre-registered our experimental protocol in `docs/EXPERIMENT.md` before running any tests.
> We evaluated 2,970 executions across 9 conditions on a 330-invoice stream including an isolated blind red-team set.
> Look at the numbers:
> - Under an unconstrained EOA ($R_0$), businesses suffered $38,700 in losses.
> - Under fixed caps ($R_1$), automation dropped and review burden spiked.
> - Under UNDERWRITE ($R_2$), realized losses were strictly $0.00, fully collateralized by the bond.
> In our blind red-team test, an unexpected edge case slipped through, proving our Hypothesis H4: statistical bounds on known threats cannot mathematically cover out-of-distribution attacks—which is exactly why on-chain collateral and spending ceilings are indispensable."

---

### [5:15 – 5:45] Conclusion & Verification (Screen on `/evidence`)

**What to do:**
- Click **"Evidence & Verifier"** (`/evidence`).
- Show the **"Live Qualification Artifact Verifier"** with the green `PASS` badge.
- Toggle the **"Simulate 1-Byte Tamper"** switch $\to$ show the red `FAIL` badge.
- Switch back to green `PASS`.

**What to say:**
> "Everything you've seen is 100% reproducible. Anyone can clone our repository, run `pnpm demo:local`, and verify our qualifications with `pnpm uw verify`.
> If anyone tampers with a single byte of an exam report, verification fails instantly.
> Don't trust the agent. Test it. Bound it. Back what remains.
> Thank you."
- **Stop Recording.**

---

## 3. Post-Recording (Zero Editing Needed!)

1. Take the resulting single `.mp4` file (e.g. from OBS `C:\Users\...\Videos\`).
2. Rename it to `underwrite-demo.mp4`.
3. You're done! Upload directly to YouTube / Google Drive / GitHub release asset.
