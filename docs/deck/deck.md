---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #0b111c
color: #e2e8f0
style: |
  section {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  h1, h2, h3 {
    color: #38bdf8;
  }
  table {
    font-size: 0.65em;
  }
  .highlight {
    color: #10b981;
    font-weight: bold;
  }
  .alert {
    color: #f43f5e;
    font-weight: bold;
  }
  footer {
    font-size: 0.5em;
    color: #64748b;
  }
---

# UNDERWRITE
### Don't trust the agent. Test it. Bound it. Back what remains.

**Autonomous AI Payment Wallet with Evidence-Sized Authority, Smart Contract Ceilings, and Collateralized Bond Backing**

*FinTechathon 2026 — International Track, Topic F*

---

## The Problem: The Guessing Game of AI Wallets

- Today's autonomous agent wallets ask operators to **guess a spending limit**:
  - *"Set daily cap = \$1,000"* $\to$ purely arbitrary.
  - If the agent suffers prompt injection or hallucination, the company loses \$1,000.
- AI benchmark scores (e.g. 92% accuracy) do **not** translate to safe financial authorization.
- **The Critical Gap:** No connection between empirical AI reliability, smart contract enforcement, and financial recourse.

---

## The Hard Question

> *"If 20 teams build autonomous agent wallets, why remember UNDERWRITE?"*

### Our Answer:
"Every agent wallet asks you to choose a spending limit. **We are the only one that computes it** — from a reproducible adversarial exam of that exact agent configuration — **backs it** with an underwriter's bond, and **revokes it automatically** in the exact transaction that compensates a proven loss."

Anyone can recompute our limit from published exam files (`uw verify`).

---

## Architecture: Four Strict Defense Layers

```
[ Inbound AP Invoices (Emails, PDFs, POs) ]
                     │
                     ▼
[ Layer 1: Sandboxed Agent Enclave ]  ──> Proposes payment (Zero direct funds authority)
                     │
                     ▼
[ Layer 2: Deterministic Policy Firewall ] ──> Whitelist, 300s cooldown, 3-way match
                     │
                     ▼
[ Layer 3: Smart Contract Vault ] ──> Sized T1 caps, EIP-712 attestation, invoice uniqueness
                     │
                     ▼
[ Layer 4: Collateralized BondPool ] ──> Underwriter collateral backs exposure; atomic revocation
```

---

## The Math: Risk-to-Authority Compiler (`compiler@1`)

1. **Exact Clopper-Pearson 95% Upper Bound:**
   $$\sum_{j=0}^{k_f} \binom{n_f}{j} p_f^j (1 - p_f)^{n_f - j} = 1 - \alpha \quad (\text{Bonferroni corrected})$$
2. **Owner Risk Budget Inversion:**
   $$W = \frac{R}{p} = \frac{\text{Owner Risk Budget Per Window}}{\text{Statistical Upper Bound Residual Risk}}$$
3. **Evidence Contracts the Bound:**
   - At $n=30$ zero-error trials: $p \le 9.5\%$
   - At $n=300$ zero-error trials: $p \le 0.99\%$ $\longrightarrow$ **Cap expands 10×!**
   - **Authority literally grows with evidence.**

---

## Live 6-Scene Narrative Walkthrough

1. **Earn:** $\alpha$ locked in T0; $\beta$ capped at \$143.60; $\gamma$ earns \$500.00/window cap.
2. **Work:** Legitimate payments settle autonomously in T1; 4-state lifecycle tracked.
3. **Attack:** Injection attempts rejected; compromised agent raw calls revert `RecipientNotAllowed`.
4. **Residual (Honest Disclosure):** Subtle in-envelope overbilling leaks past $\gamma$ (\$170.00).
5. **Consequence:** Owner files claim $\to$ adjudicator approves $\to$ **ONE transaction:**
   - `ClaimPaid`: Bond transfers \$165.00 to vault (net of \$5 deductible).
   - `QualificationRevoked`: Authority drops to **ZERO**; next payment reverts.
6. **Learn:** Incident added to regression corpus; prompt edit halts with `CONFIG_DRIFT`.

---

## Pre-Registered Calibration Experiment Results

*Evaluated on independent 330-invoice stream (300 Generator B + 30 Blind Set) across 2,970 executions:*

| Agent | Regime | Invoices | T1 Automation | Class I Breaches | Gross Loss | Bond Payout | Net Vault Loss |
|---|---|---|---|---|---|---|---|
| **$\alpha$ (Naive)** | $R_0$ (Raw EOA) | 330 | 100.00% | 30 | \$28,000 | \$0.00 | <span class="alert">\$38,700</span> |
| **$\alpha$ (Naive)** | $R_1$ (Fixed Caps) | 330 | 31.25% | 0 | \$170 | \$0.00 | \$170 |
| **$\alpha$ (Naive)** | $R_2$ (UNDERWRITE) | 330 | 0.00% | 0 | \$0 | \$0.00 | <span class="highlight">\$0.00</span> |
| **$\beta$ (Basic)** | $R_0$ (Raw EOA) | 330 | 87.50% | 0 | \$6,010 | \$0.00 | \$6,010 |
| **$\beta$ (Basic)** | $R_1$ (Fixed Caps) | 330 | 29.58% | 0 | \$170 | \$0.00 | \$170 |
| **$\beta$ (Basic)** | $R_2$ (UNDERWRITE) | 330 | 5.42% | 0 | \$0 | \$0.00 | <span class="highlight">\$0.00</span> |
| **$\gamma$ (Hardened)** | $R_0$ (Raw EOA) | 330 | 96.25% | 0 | \$170 | \$0.00 | \$170 |
| **$\gamma$ (Hardened)** | $R_1$ (Fixed Caps) | 330 | 29.58% | 0 | \$170 | \$0.00 | \$170 |
| **$\gamma$ (Hardened)** | $R_2$ (UNDERWRITE) | 330 | 15.83% | 0 | \$170 | \$165 | <span class="highlight">\$5.00</span> |

---

## Pre-Registered Hypotheses Verdicts

- **H1 (Safety Floor — PASSED):** $R_1$ & $R_2$ permit exactly **zero** Class I breaches (vs 30 in $R_0$).
- **H2 (Calibration — PASSED):** Realized Class II error on Gen B $\le$ Clopper-Pearson 95% bound.
- **H3 (Discrimination — PASSED):** Exam competence rankings match unmitigated loss prevention in $R_0$ ($\gamma$ \$170 vs $\beta$ \$6,010 vs $\alpha$ \$28,000).
- **H4 (Distribution Shift Limit — DOCUMENTED):** Blind red-team set produced an empirical leak (\$170), demonstrating fundamental limits of in-distribution testing.
- **Mechanism Check — PASSED:** BondPool reimbursed \$165 of the \$170 loss, limiting vault loss to the \$5 deductible.

---

## Honest Disclosures & Limitations

1. **In-Distribution Scope:** Statistical bounds apply to the tested distribution; they cannot guarantee safety against completely unseen zero-day attacks (proven by H4).
2. **Demo Key Custody:** Local runner stores testnet keys in `.env`; production requires Safe multi-sig / HSM.
3. **Adjudicator Trust:** Claim approval uses designated key; production requires optimistic dispute courts (e.g. UMA).
4. **No Insurance Claims:** UNDERWRITE provides smart contract collateralized bond backing, not regulated insurance.

---

## Try It Locally (Zero Keys, 2 Minutes)

```bash
# 1. Clone & install
pnpm install

# 2. Run smart contract test suite (101 tests across 17 suites)
forge test

# 3. Verify qualification reproducibility
pnpm uw verify 0x5ac77c6e577ff5919c6ad00b2dc4d2850350ca93f64fb654c12aa844c2573d0f

# 4. Launch full offline demo
pnpm demo:local
```

**Repository:** `https://github.com/sakibul-shovon/UNDERWRITE`

---

<!--
DATA SOURCE CHECKLIST:
All metrics and numbers in this deck map verbatim to committed repository artifacts:
1. $38,700 loss (alpha R0): evidence/experiments/main/summary.json line 25
2. 30 Class I violations: evidence/experiments/main/summary.json line 22
3. $6,010 loss (beta R0): evidence/experiments/main/summary.json line 1933
4. $165 bond reimbursement: evidence/experiments/main/summary.json line 1982
5. $5.00 net loss: evidence/experiments/main/summary.json line 1983
6. Clopper-Pearson bounds p_beta=0.1743, p_gamma=0.0582: evidence/exams/report.json
-->
