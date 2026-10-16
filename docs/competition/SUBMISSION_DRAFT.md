# UNDERWRITE — FinTechathon 2026 Submission Package
**Theme:** AI as a Financial Participant  
**Track:** International Track — Topic F (Agent Wallet / Autonomous On-Chain Wallet)  
**Submission Deadline:** 20 October 2026 23:59 Beijing Time (UTC+8) / 21:59 Bangladesh Time (UTC+6)  

---

## 1. Project Overview & Pitch

### Project Name
**UNDERWRITE**

### Tagline
*Don't trust the agent. Test it. Bound it. Back what remains.*

### Elevator Pitch (60 Seconds)
Giving an AI agent a crypto wallet with raw private keys and unrestricted execution authority is like handing an unbonded intern the master treasury keys. Prompts drift, models hallucinate, and prompt injection can bypass text-level filters. 

**UNDERWRITE** solves the fundamental risk of autonomous financial agents by introducing an evidence-based, mechanically bound, and collateralized execution wallet. The agent’s autonomous spending authority is **not an arbitrary number typed into a config**. It is derived deterministically by a published compiler from adversarial exam results, bounded on-chain by Solidity smart contracts that restrict recipients to registered suppliers and prevent double-payments, and backed 100% by an underwriter bond that reimburses proven losses and atomically revokes the compromised agent's spending authority in a single transaction.

### The Core Idea in Three Sentences
1. **Contracts bound what can go wrong:** A fully compromised agent can only pay registered suppliers, within spending caps, never twice for the same invoice.
2. **Exams measure what still goes wrong inside that bound:** Adversarial evaluation measures residual wrong-but-permitted payments (e.g. overbilling or duplicate billing from legitimate suppliers), setting the empirical size of the autonomous envelope.
3. **A bond backs what remains:** Unreconciled autonomous exposure cannot exceed the available bond, and an adjudicated claim reimburses the vault and revokes the agent's authority in the exact same transaction.

---

## 2. Key Technical Innovations

### Innovation 1: Two Keys to Grant Autonomy, Any One Key to Revoke
- **Granting Autonomy ($2/2$ Threshold):** Autonomous authority requires cryptographic evidence from the Examiner (EIP-712 typed attestation committing to `configHash`, `corpusHash`, `reportHash`, and compiled envelope limits) **plus** explicit on-chain activation by the Vault Owner.
- **Revoking Autonomy ($1/4$ Threshold):** Autonomy is instantly revoked by any of four independent triggers:
  1. The Owner calls `revoke()`.
  2. The Examiner calls `revoke()`.
  3. The Guardian calls `emergencyPause()`.
  4. The BondPool calls `suspendForClaim()` upon an adjudicated claim payout, or the qualification expires.

### Innovation 2: "Authority Grows With Evidence" (`compiler@1`)
Rather than relying on human optimism, the autonomous spending envelope is calculated using one-sided exact Clopper-Pearson binomial confidence bounds at 95% confidence across adversarial attack families. An agent with no evaluation receives zero autonomous authority ($T_0$). An agent with a small evaluation corpus receives a conservative envelope, and authority expands only as statistical confidence increases across rigorous test streams.

### Innovation 3: Exposure Invariant & Atomic Consequence
- **Exposure Invariant ($INV-10$):** `unreconciled T1 exposure ≤ bond remaining`. An agent cannot execute unreviewed payments beyond what the underwriter has bonded.
- **Atomic Consequence ($INV-11$):** `approveClaim()` on `BondPool.sol` transfers reimbursement to the vault and immediately calls `vault.suspendForClaim(qualId, claimId)`, revoking the qualification and removing the compromised payment from exposure in a single atomic Ethereum transaction. A compromised agent can never drain the vault twice.

---

## 3. Architecture & Verification Summary

### 4-Layer Defense Architecture
| Layer | Component | Function |
|---|---|---|
| **Layer 0** | `UnderwriteVault.sol` + `BondPool.sol` | On-chain execution, invariant enforcement, atomic claim payout & qualification revocation |
| **Layer 1** | Deterministic Policy Engine | Off-chain rule checks (limits, cool-down, duplicates); strictly isolates agent from raw recipient addresses |
| **Layer 2** | Adversarial Exam Harness | Evaluates agent configurations across 15 attack families (Class I protocol violations and Class II business-logic residual fraud) |
| **Layer 3** | `compiler@1` & Verifier | Pure mathematical compiler computing conservative envelope; EIP-712 attestation generator and public verification (`uw verify`) |

### Empirical Verification (9-Condition Calibration Matrix)
Evaluated across 330 invoices (300 Generator B + 30 Blind Red-Team Set):
- **$R_0$ (Unmitigated Baseline):** 30 Class I breaches ($10,700 loss) under $\alpha$.
- **$R_1$ (Contract Controls Only):** Zero Class I breaches across all agents; Class II residual fraud capped by owner limits.
- **$R_2$ (Contract + Exam + Bond):** Zero Class I breaches; Class II losses bounded within statistical limits; an unseen blind-set loss ($170.00) reimbursed to vault ($165.00 payout after $5 deductible), resulting in net vault loss of only $5.00.

---

## 4. Deliverables & Documentation Index

| Deliverable | Repository Path | Description |
|---|---|---|
| **Source Code** | `/contracts`, `/engine`, `/web` | Complete monorepo (Foundry + Node.js/TypeScript + Next.js 15) |
| **Technical Specification** | `docs/TECHNICAL.md` (`.pdf`, `.html`) | 4-layer architecture, compiler mathematics, prior art matrix, limitations |
| **Security Self-Assessment** | `docs/SECURITY_SELF_ASSESSMENT.md` (`.pdf`, `.html`) | Multi-attacker threat model, 14 formal invariants mapped to Foundry tests, known risks |
| **Presentation Deck** | `docs/deck/deck.md` (`.pdf`, `.html`) | 10-minute Marp slide deck with data source verification checklist |
| **Demo Script & Rehearsal** | `docs/DEMO_SCRIPT.md` | Scene-by-scene walkthrough for Scenes 1–6 (Earn, Work, Attack, Residual, Consequence, Learn) |
| **Empirical Experiment Report** | `docs/EXPERIMENT.md` | Pre-registered protocol, empirical 3x3 matrix, H1–H4 hypothesis verdicts |
| **On-Chain Evidence** | `evidence/onchain/EXECUTION_EVIDENCE.md` | Testnet and Anvil execution receipts, decoded events, transaction hashes |
| **Qualification Evidence** | `evidence/exams/` | Machine-readable `report.json`, EIP-712 attestations, and traces for $\alpha, \beta, \gamma$ |

---

## 5. Verification Commands for Judges (Offline & Reproducible)

### 2-Minute Local Demo (Zero Setup, No API Keys Required)
```bash
# Starts local chain, deploys contracts, seeds qualification, runs full demo
pnpm demo:local
# Visit http://localhost:3000 to interact with the Dashboard, Authority Meter, Attack Lab, and Claims
```

### Smart Contract Invariants & Tests (Foundry)
```bash
cd contracts && forge test
# 101 tests passed across 17 test suites (256 invariant runs, 25,600 calls, 0 reverts)
```

### Engine & TypeScript Verification
```bash
pnpm -r test
# 157 unit and integration tests passed across 25 files
```

### Cryptographic Qualification Verification
```bash
pnpm uw verify evidence/exams/0x5ac77c6e577ff5919c6ad00b2dc4d2850350ca93f64fb654c12aa844c2573d0f
# Output: PASS (all hashes, compiler bounds, and signatures verified)
```

### Deterministic Experiment Rescore
```bash
pnpm uw experiment rescore evidence/experiments/main/alpha_R0
# Bit-for-bit exact reproduction of summary metrics without LLM calls
```
