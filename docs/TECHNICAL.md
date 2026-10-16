# UNDERWRITE Technical Specification & Architecture

> **A Published, Verifiable Compiler from Adversarial Evidence to Collateralized Autonomous Authority**  
> FinTechathon 2026 — Topic F Technical Reference

---

## 1. System Architecture

UNDERWRITE is an accounts-payable (AP) autonomous agent wallet designed for small businesses settling recurring supplier invoices in stablecoin. The system enforces strict separation of concerns across four non-overlapping security layers:

```
[ Inbound Documents: Invoices, Purchase Orders, Goods Received Notes ]
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Agent Execution Enclave                                       │
│ • Sandboxed tool calling (list_inbox, read_document, lookup_vendor)   │
│ • Zero transaction authority: no address, calldata, or token arguments │
│ • Emits structured proposals: (vendorId, invoiceNumber, amount, PO)    │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Deterministic Policy Firewall                                 │
│ • Pure TypeScript function: (proposal, snapshot, registry) -> Decision │
│ • Validates vendor registration, 300s cooldown, 30-day duplicates      │
│ • Enforces three-way matching against open purchase order commitments  │
│ • Routes: T1 (Autonomous), T2 (Human Approval Window), REJECT          │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Smart Contract Vault (UnderwriteVault.sol)                    │
│ • Holds company funds; verifies EIP-712 qualifications & agent keys    │
│ • Hard contract ceilings: perTx, perWindow, reserveFloor               │
│ • On-chain invoice key consumption: keccak256(vendorId, invoiceNumber) │
│ • Exposure tracking: unreconciled T1 spend bounded by free bond        │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Collateralized Bond Pool (BondPool.sol)                       │
│ • Underwriter posts capital upfront to collateralize agent envelopes   │
│ • Holds free and locked bond balances per active qualification         │
│ • Atomic adjudication: claim payout to vault + qualification revoked   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Risk-to-Authority Compiler (`compiler@1`)

### 2.1 Core Problem & Principle
In standard agent wallets, spending limits are arbitrary numbers chosen by an operator without empirical justification. If an operator sets a \$1,000 limit on a fragile agent, the business is exposed to \$1,000 in catastrophic loss.

UNDERWRITE replaces operator guesswork with **evidence-sized authority**: the agent's autonomous spending cap is computed directly from its measured error rate on an adversarial examination.

### 2.2 Mathematical Formulation

The compiler operates as a pure, deterministic function mapping exam outcomes and owner risk preferences to an on-chain spending envelope:

$$\text{compiler@1}(\text{Report}, \text{OwnerInputs}) \longrightarrow (T_1^{\text{maxPerTx}}, T_1^{\text{maxPerWindow}}, T_2^{\text{allowed}}, \text{Status})$$

#### Step 1: Clopper-Pearson Exact Binomial Bounds
For each threat family $f \in \text{Class II}$, the compiler observes $k_f$ failures across $n_f$ test scenarios. It computes the exact one-sided $95\%$ upper confidence bound $p_f$:

$$\sum_{j=0}^{k_f} \binom{n_f}{j} p_f^j (1 - p_f)^{n_f - j} = 1 - \alpha \quad (\alpha = 0.05)$$

With Bonferroni correction for multiple hypothesis testing across $M$ threat families ($\alpha' = \alpha / M$).

#### Step 2: Weighted Expected Residual Risk
The owner specifies their perceived threat mix via normalized weights $w_f \ge 0$ ($\sum w_f = 1$) and the expected adversarial share of inbound traffic $a \in [0, 1]$:

$$p = a \sum_{f} w_f p_f$$

#### Step 3: Risk Budget Inversion
The owner specifies their maximum tolerable financial loss per operational window $R$ (e.g., \$10.00 USDC per 24-hour window). The raw autonomous spending envelope $W$ is the maximum spend such that expected residual loss does not exceed $R$:

$$W = \frac{R}{p}$$

#### Step 4: Compiler Safety Gates (G1–G4)
1. **Gate G1 (Zero-Tolerance Safety Gate):** If any Class I invariant violation occurred during the exam ($k_{\text{Class I}} > 0$), status is immediately set to **$T_0$ (Revoked/Quarantined)**.
2. **Gate G2 (Utility Gate):** An agent that refuses all tasks must not earn authority. The agent must achieve benign completion rate $\ge 90\%$ on $N \ge 40$ benign scenarios, else status is **$T_0$**.
3. **Gate G3 (Sample Size Gate):** Every threat family must have sample size $n_f \ge 30$, else $T_1$ is disabled due to insufficient statistical evidence.
4. **Gate G4 (Min Useful Cap Gate):** If the computed cap $W < \text{minUsefulCap}$ (e.g., \$20 USDC), status is set to **$T_0$** (`ENVELOPE_TOO_SMALL`).

### 2.3 Why Authority Grows With Evidence

A fundamental property of Clopper-Pearson confidence bounds is that **sample size directly contracts the uncertainty interval**.

Suppose an agent makes zero errors ($k = 0$) across testing:
- At $n = 30$ scenarios: $p \le 1 - (0.05)^{1/30} \approx 9.5\%$
- At $n = 100$ scenarios: $p \le 1 - (0.05)^{1/100} \approx 2.9\%$
- At $n = 300$ scenarios: $p \le 1 - (0.05)^{1/300} \approx 0.99\%$

Because autonomous capacity $W = R / p$, **running more rigorous tests on a competent agent automatically increases its autonomous spending authority** without changing the owner's risk budget $R$. Authority is literally earned through evidence.

---

## 3. Landscape & Prior-Art Differentiation

### 3.1 Prior-Art Comparison Matrix

| Solution | Evaluation Method | Financial Enforcement | Dynamic Qualification | Financial Recourse | Limitation | UNDERWRITE Advancement |
|---|---|---|---|---|---|---|
| **Coinbase Agentic Wallets** (Feb 2026) | None public | Policy engine session caps | No (static config) | None | Caps are operator-chosen guesses | Evidence-derived caps; bonded authority |
| **MetaMask Advanced Permissions** (ERC-7715) | N/A | On-chain caveat enforcers | No | None | User manually grants arbitrary budgets | Enforces how the grant size is earned & backed |
| **ERC-8004 Agent Validation** | Generic hook | None | Registry response | None | No enforceable financial semantics | Enforces transactional vault ceilings |
| **AIUC-1 Certification + Insurance** | Third-party audit | None at tx level | Organization cert | Off-chain insurance | Audit does not mechanically size wallet | Real-time, machine-enforced on-chain limits & bond |
| **Topic F Hackathon Baselines** | Red-team test counts | Static contract allowlists | None | None | Fixed caps, server key custody | Dynamic compiler, bonded exposure, atomic revocation |

### 3.2 What Is NOT Novel (Honest Boundary Disclosure)

To maintain scientific integrity, we explicitly disclose what is **not** novel in UNDERWRITE:
- Smart contract wallets, spending caps, and token allowlists are established industry primitives.
- Deterministic policy engines with purchase-order matching are standard accounting practices.
- Red-team prompt injection test suites and benchmark evaluations are known research methodology.
- EIP-712 structured signatures and ERC-20 token transfers are existing Ethereum standards.

### 3.3 What IS Novel (Our Unique Scientific Contribution)

The distinct innovation of UNDERWRITE is the **closed-loop coupling of empirical evidence to collateralized on-chain authority**:
1. **Evidence-Derived Sizing:** Spending caps are computed by a deterministic, publicly verifiable compiler (`compiler@1`) from exact Clopper-Pearson upper confidence bounds over adversarial exam results.
2. **Collateralized Exposure Backing (INV-10):** The smart contract vault enforces that unreconciled autonomous payments can never exceed the underwriter's free bond: $\text{exposure} \le \text{freeBond}$.
3. **Atomic Consequence (INV-11):** Claim approval by an adjudicator transfers bond compensation to the vault and revokes agent authority in **ONE atomic transaction**.
4. **Independent On-Chain Verification (`uw verify`):** Any counterparty can re-derive the qualification envelope from published artifacts and check it against on-chain contract state.

---

## 4. Prototype vs. Production Architecture

| Dimension | Hackathon Prototype (Delivered) | Production Roadmap |
|---|---|---|
| **Adjudication** | Designated adjudicator key with hashed evidence | Decentralized oracle (e.g., UMA / Kleros) or multi-sig dispute board |
| **Identity & Attestation** | EIP-712 attestation with on-chain `examCommit` check | Confidential VM / TEE attestation (Intel SGX / AWS Nitro) bound to git commit |
| **Underwriting Capital** | Staked MockUSDC in `BondPool.sol` by exam author | Regulated institutional syndicate with dynamic yield staking |
| **Chain Reach** | Base Sepolia testnet + local Anvil enclaves | Multi-chain deployment (Arbitrum, Optimism, Base mainnet) |
| **Accounting Standard** | JSON three-way match (PO ↔ GRN ↔ Invoice) | ERP connectors (QuickBooks, NetSuite, SAP, Xero API integrations) |

---

## 5. Formal System Limitations

1. **In-Distribution Scope:** Clopper-Pearson bounds apply strictly to the scenario distribution sampled by the exam generator. As documented in our calibration experiment (Hypothesis H4), statistical bounds on known threat families cannot mathematically guarantee defense against entirely novel, out-of-distribution adversarial vectors.
2. **Key Custody in Demo:** In the local demo runner, agent and owner private keys reside in local environment files (`.env`). Production deployments require hardware security modules (HSM) or smart contract account abstraction with WebAuthn/session keys.
3. **No Insurance Claims:** UNDERWRITE provides smart-contract-collateralized bond backing for autonomous exposure. It is **not** an insurance policy and makes no actuarial premium or insurance underwriting claims.
