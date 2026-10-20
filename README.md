# UNDERWRITE

<div align="center">

<h3>Evidence-Bounded Autonomous Payment Wallet for AI Agents</h3>
<p><em>Autonomous financial actions require hard mathematical boundaries, not optimistic prompt guardrails.</em></p>

[![Competition](https://img.shields.io/badge/Competition-FinTechathon_2026-blue.svg?style=flat-square)](https://fintechathon.g-ican.com/#/en/rule)
[![Track](https://img.shields.io/badge/Track-International_AI_Track-108548.svg?style=flat-square)](https://fintechathon.g-ican.com/#/en/rule)
[![Topic](https://img.shields.io/badge/Topic_F-Agent_Wallet-7928ca.svg?style=flat-square)](https://fintechathon.g-ican.com/#/en/rule)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636.svg?style=flat-square&logo=solidity)](https://github.com/ethereum/solidity)
[![Network](https://img.shields.io/badge/Base_Sepolia-Chain_84532-0052FF.svg?style=flat-square&logo=base)](https://sepolia.basescan.org/address/0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0)
[![Contract Tests](https://img.shields.io/badge/Foundry_Tests-101%2F101_Passing-success.svg?style=flat-square)](contracts/)
[![Engine Tests](https://img.shields.io/badge/Vitest-159%2F159_Passing-success.svg?style=flat-square)](engine/)
[![Invariants](https://img.shields.io/badge/Invariant_Fuzz-25%2C600_Calls-success.svg?style=flat-square)](contracts/test/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Online_Prototype-00C781.svg?style=flat-square&logo=vercel)](https://underwrite.165.99.219.253.sslip.io)
[![Theme](https://img.shields.io/badge/UI-Light_Mode_Verified-d3ff2f.svg?style=flat-square&labelColor=11110f)](web/)

</div>

---

<p align="center">
  <img src="assets/home.png" alt="UNDERWRITE Hero Landing" width="940"/>
</p>
<p align="center"><em>"Your AI clerk starts at $0. Spending limits are earned through empirical adversarial exams, bounded by on-chain smart contracts, and backed by a collateralized BondPool."</em></p>

> 🌐 **Live Interactive Application:** [https://underwrite.165.99.219.253.sslip.io](https://underwrite.165.99.219.253.sslip.io)  
> *Zero-installation working prototype running on Base Sepolia and local Anvil with real-time Authority Meter, Attack Lab simulator, and on-chain verification.*

---

## Table of Contents

- [1. Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
- [2. Why Natural Language Is Not Custody Control](#2-why-natural-language-is-not-custody-control)
- [3. Interactive System Walkthrough (Screenshots)](#3-interactive-system-walkthrough)
  - [A. The Authority Meter & Governance Desks](#a-the-authority-meter--governance-desks)
  - [B. Adversarial Exam & Clopper-Pearson Compiler](#b-adversarial-exam--clopper-pearson-compiler)
  - [C. Attack Lab (Compromised Key Simulator)](#c-attack-lab-compromised-key-simulator)
  - [D. Deterministic Cryptographic Evidence Verification](#d-deterministic-cryptographic-evidence-verification)
  - [E. Empirical Benchmark & Loss Reduction](#e-empirical-benchmark--loss-reduction)
- [4. Verified Public On-Chain Evidence (Base Sepolia)](#4-verified-public-on-chain-evidence-base-sepolia)
- [5. Architecture & 14 Safety Invariants](#5-architecture--14-safety-invariants)
- [6. Two-Minute Zero-Key Quickstart](#6-two-minute-zero-key-quickstart)
- [7. Pre-Registered Calibration Experiment Results](#7-pre-registered-calibration-experiment-results)
- [8. Competition Submission Package](#8-competition-submission-package)
- [9. Repository Structure](#9-repository-structure)
- [10. Honest Disclosures & Research Integrity](#10-honest-disclosures--research-integrity)

---

## 1. Executive Summary & Core Philosophy

**UNDERWRITE** is an evidence-bounded autonomous accounts-payable (AP) wallet architecture for AI agents. Rather than entrusting an LLM with unbounded private-key custody or relying on easily bypassed prompt guardrails, UNDERWRITE measures an agent's empirical performance, compiles mathematically conservative spending envelopes, enforces recipient allowlists and timelocks via EVM smart contracts, and backs unreviewed autonomous risk with a collateralized **BondPool**.

### The Core Idea in Three Sentences

1. **Contracts bound what can go wrong:** A fully compromised agent key can only pay pre-approved, registered suppliers within strict daily caps, and can never execute twice against the same invoice.
2. **Exams measure what still goes wrong inside that bound:** Adversarial exams quantify wrong-but-permitted payments (overbilling, duplicate tricks, vendor impersonation), and that measured residual error rate sizes the agent's autonomous envelope.
3. **A bond backs exactly that residual:** The total exposure of unreviewed autonomous payments can never exceed free underwriter bond capacity; an approved loss claim pays out from the bond and suspends agent authority **atomically in a single transaction**.

> **The On-Chain Authority Rule:** Granting autonomy requires **two independent keys** (examiner evidence attestation + owner on-chain activation); revoking it requires **only one** (owner veto, examiner revocation, adjudicated claim payout, or timer expiry).

---

## 2. Why Natural Language Is Not Custody Control

In enterprise finance, an autonomous agent faces two distinct failure surfaces:

| Failure Surface | Attack Vector / Scenario | Why Prompt Guardrails Fail | How UNDERWRITE Enforces It |
|---|---|---|---|
| **Protocol-Invalid Actions** | Unregistered recipient address, duplicate invoice number, arbitrary calldata, over-limit spend. | Prompt injection or jailbreaks override system instructions once the private key is exposed. | **Solidity Smart Contracts (`UnderwriteVault.sol`):** Evaluated strictly on-chain; invalid transfers revert regardless of caller intent. |
| **Business-Valid / Semantic Fraud** | Registered supplier overbilling, subtle quantity discrepancies, semantic phishing. | Models experience cognitive fatigue or reasoning gaps on novel document patterns. | **Adversarial Exam + BondPool:** Sized via Clopper-Pearson statistical bounds; unreviewed exposure is 100% collateralized by underwriter bond. |

### Security Regime Comparison Matrix

| Security Dimension | Raw EOA Key ($R_0$) | Prompt Guardrails | Static Owner Caps ($R_1$) | UNDERWRITE Architecture ($R_2$) |
|---|:---:|:---:|:---:|:---:|
| **Hard Recipient Isolation** | ❌ No | ❌ Fragile | ✅ Owner allowlist | ✅ **Contract allowlist + 300s cooldown** |
| **Compromised Key Protection** | ❌ Full loss | ❌ 0% protection | ⚠️ Limited by cap | ✅ **EVM invariant ceilings (`INV-1` to `INV-14`)** |
| **Evidence-Sized Authority** | ❌ No | ❌ No | ❌ Human guess | ✅ **Deterministic Clopper-Pearson Compiler** |
| **Two-Key Autonomy Activation** | ❌ No | ❌ No | ❌ No | ✅ **Examiner EIP-712 + Owner Activation** |
| **Collateralized Loss Recovery** | ❌ None | ❌ None | ❌ None | ✅ **BondPool atomic reimbursement** |
| **Deterministic Qualification Parity** | ❌ None | ❌ None | ❌ None | ✅ **Real-time digest verification (`uw verify`)** |

---

## 3. Interactive System Walkthrough

All screens are captured in high-contrast **Light Mode** according to official competition rules and labeled with provenance indicators (`CONTROLLED`, `SIMULATED`, `SCRIPTED`).

### A. The Authority Meter & Governance Desks
<p align="center">
  <img src="assets/dashboard.png" alt="UNDERWRITE Authority Meter & Dashboard" width="920"/>
</p>

* **Real-Time Authority Meter:** Continuously displays the daily spending envelope earned by the agent ($180.00/day for Gamma), current window consumption ($42.50 spent), and active unreviewed exposure.
* **Collateral Floor:** Displays the $2,000.00 underwriter bond remaining. Under invariant `INV-10`, autonomous Tier-1 execution automatically pauses if exposure reaches remaining bond capacity.

---

### B. Adversarial Exam & Clopper-Pearson Compiler
<p align="center">
  <img src="assets/exam.png" alt="Adversarial Exam & Policy Cards" width="920"/>
</p>

* **Three Agents, One Exam:** Evaluates three agent archetypes on a fixed 390-scenario stream (120 benign, 60 out-of-bounds, 210 wrong-but-permitted):
  - **$\alpha$ (Scripted-naive):** Trips safety gate $G_1$ $\to$ Granted **T0 · $0.00**.
  - **$\beta$ (Basic Gemini Flash):** 94.2% completion $\to$ Granted **T1 · $40.00**.
  - **$\gamma$ (Hardened Gemini Pro):** 98.3% completion, $p \le 0.0531$ $\to$ Granted **T1 · $180.00**.
* **Reproducible Compiler:** A pure, deterministic mathematical function maps empirical pass rates to conservative limits.

---

### C. Attack Lab (Compromised Key Simulator)
<p align="center">
  <img src="assets/attack.png" alt="Attack Lab Simulator" width="920"/>
</p>

* **Stolen-Key Simulation:** Demonstrates that even if an attacker extracts the agent's private key and bypasses the policy middleware entirely, the underlying EVM smart contracts independently reject:
  - *Phishing Payee Redirection* $\to$ Reverts with `RecipientNotAllowed` (`INV-1`).
  - *Duplicate Invoice Replay* $\to$ Reverts with `DuplicateInvoice` (`INV-3`).
  - *Severe Overbilling ($950)* $\to$ Reverts with `LimitExceeded` (`INV-2`).

---

### D. Deterministic Cryptographic Evidence Verification
<p align="center">
  <img src="assets/evidence.png" alt="Real-Time Evidence Verifier" width="920"/>
</p>

* **Five Cryptographic Parity Checks:** The UI and CLI independently recompute and verify:
  1. Exam report JSON SHA-256 digest matches on-chain commitment.
  2. Pure compiler function re-derives identical envelope parameters.
  3. Agent manifest configuration hash matches active attestation.
  4. Pre-commitment ID binds to the published scenario corpus.
  5. Active on-chain contract limits match local state.
* **Interactive Tamper Simulation:** Judges can click *"Simulate a 1-byte tamper"* to verify that any altered report instantly trips the validator.

---

### E. Empirical Benchmark & Loss Reduction
<p align="center">
  <img src="assets/experiment.png" alt="Empirical Benchmark & Loss Reduction" width="920"/>
</p>

* **Scientific 3×3 Matrix:** 2,970 executions across 3 agent architectures and 3 control regimes.
* **Empirical Outcome:** UNDERWRITE reduces unmitigated agent losses from **$38,700.00** ($R_0$) down to **$5.00** net loss ($R_2$) via the atomic BondPool reimbursement mechanism.

---

## 4. Verified Public On-Chain Evidence (Base Sepolia)

UNDERWRITE is not a mockup. A complete, linked 4-stage lifecycle has been executed on the public **Base Sepolia testnet** (Chain ID: `84532`):

| Step | Action | Transaction Hash | Decoded Verified Event | BaseScan Link |
|:---:|---|---|---|:---:|
| **1** | **Exam Committed** | `0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f` | `ExamCommitted` | [View on BaseScan](https://sepolia.basescan.org/tx/0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f) |
| **2** | **Qualification Activated** | `0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c` | `QualificationActivated` | [View on BaseScan](https://sepolia.basescan.org/tx/0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c) |
| **3** | **Payment Requested** | `0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6` | `PaymentRequested` | [View on BaseScan](https://sepolia.basescan.org/tx/0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6) |
| **4** | **Payment Executed** | `0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712` | `PaymentExecuted` | [View on BaseScan](https://sepolia.basescan.org/tx/0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712) |

### Core Contract Deployments

* **UnderwriteVault (`UnderwriteVault.sol`):** [`0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0`](https://sepolia.basescan.org/address/0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0)
* **BondPool (`BondPool.sol`):** [`0xB97Be73323731209e183Bc02a0F5d23e36Cc5902`](https://sepolia.basescan.org/address/0xB97Be73323731209e183Bc02a0F5d23e36Cc5902)
* **MockUSDC (`MockUSDC.sol`):** [`0x2e71d44170F788E892b4283c0a179bae8B8936F3`](https://sepolia.basescan.org/address/0x2e71d44170F788E892b4283c0a179bae8B8936F3)

*(Human-readable proof dossier with QR codes is available in [`docs/ONCHAIN_EVIDENCE.pdf`](docs/ONCHAIN_EVIDENCE.pdf).)*

---

## 5. Architecture & 14 Safety Invariants

```mermaid
graph TD
    A[Inbound Vendor Invoices] --> B[Deterministic Policy Firewall]
    B -->|Schema Valid| C[Agent Inference Enclave α, β, γ]
    C -->|Propose Intent| D{Authority Tier?}
    D -->|Tier 1: ≤ Window Cap| E[UnderwriteVault.sol]
    D -->|Tier 2: Challenge Window| F[Owner / Guardian Review]
    F -->|Veto or Approve| E
    E -->|Execute Payment| G[Registered Supplier]
    E -.->|Report Discrepancy| H[Adjudication & BondPool]
    H -->|Atomic Consequence| I[Reimburse Vault & Revoke Agent]
```

### The 14 Smart Contract Invariants

All 14 invariants are verified via **Foundry stateful fuzzing (25,600 calls across 256 runs, 0 handler reverts)**:

- **INV-1 (Mandate Isolation):** Vault transfers funds ONLY to recipients registered on the owner's allowlist past the 300s cooldown.
- **INV-2 (Ceiling Supremacy):** Contract-enforced per-transaction and rolling 24h spending caps cannot be exceeded.
- **INV-3 (Invoice Uniqueness):** The pair `(vendorIdHash, invoiceHash)` can execute exactly once; replays revert.
- **INV-4 (Dual-Key Activation):** Autonomy requires an examiner EIP-712 attestation AND an on-chain owner activation transaction.
- **INV-5 (Window Monotonicity):** Cumulative window spend updates monotonically within the active window.
- **INV-6 (Challenge State Machine):** Challenged Tier-2 payments cannot settle before delay expiry or after owner cancellation.
- **INV-7 (Owner Veto Supremacy):** Owner/Guardian cancellation immediately marks pending transactions as void.
- **INV-8 (Reserve Inviolability):** Vault balance cannot drop below the contract reserve floor.
- **INV-9 (Atomic Invalidation):** Revocation immediately invalidates all active qualifications.
- **INV-10 (Strict Collateral Backing):** `vault.exposure() <= bondPool.freeBond()`. Tier-1 payments halt if unreviewed spend exceeds available collateral.
- **INV-11 (Atomic Consequence):** Loss claim adjudication executes bond reimbursement and suspends agent qualification in **one atomic transaction**.
- **INV-12 (Bond Solvency):** Total active bond allocations can never exceed deposited bond assets.
- **INV-13 (Zero-Value Rejection):** Zero-amount payment requests revert immediately.
- **INV-14 (Deterministic Qualification Parity):** Local digest computation matches on-chain verification bit-for-bit.

---

## 6. Two-Minute Zero-Key Quickstart

The entire project runs locally on an offline Anvil node without requiring external API keys or cloud dependencies:

```bash
# 1. Install dependencies
pnpm install

# 2. Run Foundry smart contract test suite (101 tests across 17 suites)
cd contracts && forge test && cd ..

# 3. Run TypeScript engine verification suite (159 tests across 26 files)
pnpm --filter engine test

# 4. Launch local interactive prototype (Anvil + Contracts + Next.js UI)
pnpm demo:local
```

Once running, navigate to:
* **Dashboard & Authority Meter:** `http://localhost:3000`
* **Exam & Policy Cards:** `http://localhost:3000/exam`
* **Enterprise Vendor Portal:** `http://localhost:3000/portals/vendor`
* **Attack Lab (Stolen Key Sim):** `http://localhost:3000/attack-lab`
* **Owner Inbox & Governance:** `http://localhost:3000/portals/owner`
* **Claims & Slashing Desk:** `http://localhost:3000/claims`
* **Cryptographic Evidence Audit:** `http://localhost:3000/evidence`
* **Benchmark Experiment:** `http://localhost:3000/experiment`

### Independent CLI Verification

Anyone can independently verify active qualification integrity in seconds:

```bash
# Recomputes reportHash, configHash, corpusHash, Clopper-Pearson envelope, and checks on-chain limits
pnpm uw verify 0x5ac77c6e577ff5919c6ad00b2dc4d2850350ca93f64fb654c12aa844c2573d0f
# Output: PASS (trips to FAIL if report.json is modified by even 1 byte)
```

---

## 7. Pre-Registered Calibration Experiment Results

We evaluated 3 agent architectures across 3 control regimes on a controlled stream of 330 invoices per condition (300 Generator B invoices across 10 non-overlapping 24h windows + 30 isolated Blind Red-Team invoices; 80% benign / 20% adversarial; total 2,970 executions):

| Agent Archetype | Control Regime | Total Invoices | $T_1$ Auto-Pay Rate | Class I Breaches | Class II Loss (USDC) | Bond Reimbursement | Net Vault Loss (USDC) | Review Burden |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **$\alpha$ (Naive Script)** | $R_0$ (Raw EOA) | 330 | 100.00% | 30 | \$28,000.00 | \$0.00 | **\$38,700.00** | 0 |
| **$\alpha$ (Naive Script)** | $R_1$ (Fixed Caps) | 330 | 31.25% | 0 | \$170.00 | \$0.00 | **\$170.00** | 254 |
| **$\alpha$ (Naive Script)** | **$R_2$ (UNDERWRITE)** | 330 | **0.00%** | **0** | **\$0.00** | **\$0.00** | **\$0.00** | 330 |
| **$\beta$ (Basic LLM)** | $R_0$ (Raw EOA) | 330 | 87.50% | 0 | \$6,010.00 | \$0.00 | **\$6,010.00** | 106 |
| **$\beta$ (Basic LLM)** | $R_1$ (Fixed Caps) | 330 | 29.58% | 0 | \$170.00 | \$0.00 | **\$170.00** | 258 |
| **$\beta$ (Basic LLM)** | **$R_2$ (UNDERWRITE)** | 330 | **5.42%** | **0** | **\$0.00** | **\$0.00** | **\$0.00** | 317 |
| **$\gamma$ (Hardened LLM)** | $R_0$ (Raw EOA) | 330 | 96.25% | 0 | \$170.00 | \$0.00 | **\$170.00** | 98 |
| **$\gamma$ (Hardened LLM)** | $R_1$ (Fixed Caps) | 330 | 29.58% | 0 | \$170.00 | \$0.00 | **\$170.00** | 258 |
| **$\gamma$ (Hardened LLM)** | **$R_2$ (UNDERWRITE)** | 330 | **15.83%** | **0** | **\$170.00** | **\$165.00** | **\$5.00** | 232 |

### Key Scientific Findings

1. **H1 (Safety Floor — Confirmed):** Under $R_1$ and $R_2$, Class-I invariant violations were strictly **zero** ($0$) across all agents, preventing \$10,700 in unauthorized transfers observed under $R_0$.
2. **H2 (Calibration — Confirmed):** Realized error rates on the Generator B stream remained strictly bounded below the Clopper-Pearson 95% upper bounds ($p_\gamma = 0.0582, p_\beta = 0.1743$).
3. **H3 (Discrimination — Confirmed):** Exam competence rankings matched unmitigated loss prevention capability in $R_0$ (Gamma loss \$170 vs Beta loss \$6,010 vs Alpha loss \$28,000).
4. **H4 (Distribution Shift Documented):** On the isolated Blind Red-Team set, an unseen freight discrepancy slipped past Gamma under $R_2$ (\$170.00), demonstrating that in-distribution exam bounds cannot guarantee 100% defense against out-of-distribution threats—which is precisely why the **BondPool** exists.

---

## 8. Competition Submission Package

The official competition package for FinTechathon 2026 is maintained in the [`docs/`](docs/) and [`artifacts/`](artifacts/) directories:

| Artifact | File Path | Format & Scope |
|---|---|---|
| **Pitch Deck** | [`docs/deck/UNDERWRITE_PITCH_DECK.pdf`](docs/deck/UNDERWRITE_PITCH_DECK.pdf) | 13-slide executive presentation (<10 min presentation) |
| **Technical Dossier** | [`docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf`](docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf) | 48-page system specification & mathematical formulation |
| **Security Self-Assessment** | [`docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf`](docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf) | Threat matrix, 14 invariant proofs, and residual risk catalog |
| **On-Chain Evidence Dossier** | [`docs/ONCHAIN_EVIDENCE.pdf`](docs/ONCHAIN_EVIDENCE.pdf) | Four real Base Sepolia transaction receipts with QR links |
| **Demonstration Film** | [`artifacts/video/UNDERWRITE_PRODUCT_FILM_NO_SUBTITLES.mp4`](artifacts/video/UNDERWRITE_PRODUCT_FILM_NO_SUBTITLES.mp4) | 4:40 full product film (1080p, Light Mode, Ava Voiceover) |
| **Artifact Manifest** | [`docs/competition/ARTIFACT_MANIFEST.json`](docs/competition/ARTIFACT_MANIFEST.json) | Cryptographic SHA-256 integrity manifest for all dossiers |

---

## 9. Repository Structure

```text
├── contracts/               # Solidity 0.8.28 contracts & Foundry suites
│   ├── src/
│   │   ├── UnderwriteVault.sol # Core payment vault (T1 autonomous, T2 challenge)
│   │   ├── BondPool.sol        # Underwriter bond custody, claims & atomic slashing
│   │   └── MockUSDC.sol        # 6-decimal testnet ERC-20 token
│   ├── script/                 # Testnet deployment & proof generation scripts
│   └── test/                   # Unit, fuzz, and stateful invariant test suites
├── engine/                  # TypeScript runtime & verification engine
│   ├── src/
│   │   ├── compiler/           # Clopper-Pearson bounds & compiler@1 pure function
│   │   ├── exam/               # 15-family scenario generator, harness, and scorer
│   │   ├── experiment/         # Protocol runner, Generator B stream, blind set
│   │   ├── policy/             # Deterministic AP firewall & state snapshot
│   │   └── cli.ts              # uw CLI (manifest, exam, compile, attest, verify)
│   └── test/                   # Vitest unit & integration test suites
├── web/                     # Next.js 15 App Router Light-Theme UI
│   └── src/
│       ├── app/                # Dashboard, exam, traces, attack-lab, claims, evidence
│       └── components/         # ProvenanceBadges (REPLAY, SCRIPTED, CONTROLLED)
├── docs/                    # Competition dossiers and technical documentation
│   ├── professional/assets/    # Light-mode screenshot assets and QR codes
│   └── deck/                   # 13-slide pitch deck (PDF & PPTX)
└── artifacts/video/         # Master product demonstration film & captures
```

---

## 10. Honest Disclosures & Research Integrity

In accordance with strict research integrity standards:
- **Public Testnet Environment:** All on-chain executions took place on the Base Sepolia testnet using MockUSDC, not real customer funds.
- **Security Self-Assessment:** This repository represents an internal security evaluation and formal stateful fuzzing campaign; it does not replace a multi-firm independent audit.
- **Non-Independent Benchmark:** Generator B and the Blind Red-Team set were authored by the same team under pre-registered fallback **DEC-023** due to external author unavailability; therefore, the benchmark is controlled and labeled non-independent.
- **Statistical Scope:** Clopper-Pearson bounds apply strictly to the evaluated scenario distribution and do not extrapolate to universal real-world fraud distributions.
- **No Secret Keys Committed:** All private keys used in test scripts are ephemeral local Anvil or testnet addresses loaded via `.env`.

---

<div align="center">
<b>UNDERWRITE — Authority, Earned.</b>
</div>

