# UNDERWRITE

> **Don't trust the agent. Test it. Bound it. Back what remains.**

*FinTechathon 2026 — International Track, Topic F*  
*Autonomous AI Payment Wallet with Evidence-Sized Authority, Smart Contract Ceilings, and Collateralized Bond Backing.*

---

## 1. What It Is

An autonomous accounts-payable agent wallet for a small business that pays registered suppliers in stablecoin. Its autonomous spending authority is **not a number someone typed in**. It is computed by a published, deterministic compiler from the agent configuration's adversarial exam results, it is **collateralized by a bond posted by the party that examined the agent**, and it **shrinks automatically, on-chain, in the same transaction that pays out a proven loss**.

### The Core Idea in Three Sentences

1. **Contracts bound what can go wrong:** A fully compromised agent key can only pay registered suppliers, within spending caps, and never twice for the same invoice.
2. **Exams measure what still goes wrong inside that bound:** Adversarial exams measure wrong-but-permitted payments (overbilling, duplicate tricks, vendor impersonation), and that measured residual risk sets the size of the agent's autonomous envelope.
3. **A bond backs exactly that residual:** The total exposure of unreviewed autonomous payments can never exceed the free bond available, and a proven loss pays out from the bond and revokes the agent's authority atomically in a single transaction.

**The On-Chain Authority Rule:** Granting autonomy requires **two keys** (examiner evidence + owner activation); removing it requires **any one** (owner veto, examiner revocation, adjudicated claim payout, or timer expiry).

---

## Competition submission package

| Artifact | Final file |
|---|---|
| 13-slide pitch deck | [`docs/deck/UNDERWRITE_PITCH_DECK.pdf`](docs/deck/UNDERWRITE_PITCH_DECK.pdf) |
| Technical dossier | [`docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf`](docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf) |
| Security self-assessment | [`docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf`](docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf) |
| Real on-chain evidence | [`docs/ONCHAIN_EVIDENCE.pdf`](docs/ONCHAIN_EVIDENCE.pdf) |
| Submission master | [`docs/competition/SUBMISSION_DRAFT.md`](docs/competition/SUBMISSION_DRAFT.md) |

All embedded product screenshots use light mode. Controlled, simulated and public-testnet evidence are labeled separately. Artifact SHA-256 digests are in `docs/competition/ARTIFACT_MANIFEST.json`.

---

## 2. 2-Minute Quickstart (Zero Keys Required, Fully Offline)

The entire project runs locally on an Anvil Ethereum node without network access or third-party API keys:

```bash
# 1. Install dependencies
pnpm install

# 2. Run the full contract test suite (101 tests across 17 suites)
cd contracts && forge test && cd ..

# 3. Run the engine verification suite (159 tests across 26 files)
pnpm --filter engine test

# 4. Launch the local demo (Anvil node + contract deployments + Next.js UI)
pnpm demo:local
```

Once running, navigate to:
- **Dashboard & Authority Meter:** [http://localhost:3000](http://localhost:3000)
- **Exam & Policy Cards:** [http://localhost:3000/exam](http://localhost:3000/exam)
- **Run Traces (4-State Lifecycle):** [http://localhost:3000/traces](http://localhost:3000/traces)
- **Attack Lab (Compromised Key Simulator):** [http://localhost:3000/attack-lab](http://localhost:3000/attack-lab)
- **Claims & Atomic Settlement:** [http://localhost:3000/claims](http://localhost:3000/claims)
- **Evidence & Field-by-Field Verifier:** [http://localhost:3000/evidence](http://localhost:3000/evidence)
- **Calibration Experiment Results:** [http://localhost:3000/experiment](http://localhost:3000/experiment)

---

## 3. Architecture & Core Invariants

UNDERWRITE splits safety across four independent enforcement layers:

```
[ Inbound Documents (Invoices, POs, Emails) ]
                     │
                     ▼
[ 1. Agent Enclave (α, β, γ) ] ──> Proposes payment (Vendor ID, Invoice #, Amount, Rationale)
                     │
                     ▼
[ 2. Deterministic Policy Firewall ] ──> Checks registry, active cooldowns, duplicate hashes, PO matching
                     │
                     ▼
[ 3. Smart Contract Vault (UnderwriteVault.sol) ] ──> Verifies EIP-712 attestation, window caps, expiry
                     │
                     ▼
[ 4. Collateralized Bond Pool (BondPool.sol) ] ──> Backs unreviewed payments; atomic payout & revocation
```

### Core Invariants Enforced on Smart Contracts

- **INV-1 (Mandate Isolation):** Vault transfers funds ONLY to recipients registered on the owner's `VendorRegistry` after a mandatory 300s cooldown.
- **INV-2 (Ceiling Supremacy):** Contract-enforced per-transaction and per-window spending caps cannot be exceeded regardless of agent calldata.
- **INV-3 (Invoice Uniqueness):** The pair `(vendorIdHash, invoiceHash)` can execute exactly once; replays revert with `DuplicateInvoice()`.
- **INV-4 (Dual-Key Activation):** Autonomous execution requires an attestation signed by the authorized examiner AND an on-chain activation transaction by the vault owner.
- **INV-10 (Strict Backing):** `vault.exposure() <= bondPool.freeBond()`. The vault refuses $T_1$ payments if unreviewed payments exceed available collateral.
- **INV-11 (Atomic Consequence):** Adjudicator approval of a valid loss claim executes bond payout to vault and revokes the agent's qualification in **ONE atomic transaction**.

---

## 4. Pre-Registered Calibration Experiment Results

We evaluated 3 agent architectures across 3 control regimes on a controlled, non-independent 330-invoice stream per condition (300 Generator B invoices across 10 non-overlapping 24h windows + 30 isolated Blind Red-Team invoices, 80% benign / 20% adversarial). Generator B and the blind set were self-authored under the pre-registered fallback in DEC-023:

| Agent | Regime | Invoices | $T_1$ Automation Rate | Class I Breaches | Class II Loss (USDC) | Bond Reimbursement | Net Vault Loss (USDC) | Review Burden |
|---|---|---|---|---|---|---|---|---|
| **$\alpha$ (Naive Script)** | $R_0$ (Raw EOA) | 330 | 100.00% (240/240) | 30 | \$28,000.00 | \$0.00 | **\$38,700.00** | 0 |
| **$\alpha$ (Naive Script)** | $R_1$ (Fixed Caps) | 330 | 31.25% (75/240) | 0 | \$170.00 | \$0.00 | **\$170.00** | 254 |
| **$\alpha$ (Naive Script)** | $R_2$ (UNDERWRITE) | 330 | 0.00% (0/240) | 0 | \$0.00 | \$0.00 | **\$0.00** | 330 |
| **$\beta$ (Basic LLM)** | $R_0$ (Raw EOA) | 330 | 87.50% (210/240) | 0 | \$6,010.00 | \$0.00 | **\$6,010.00** | 106 |
| **$\beta$ (Basic LLM)** | $R_1$ (Fixed Caps) | 330 | 29.58% (71/240) | 0 | \$170.00 | \$0.00 | **\$170.00** | 258 |
| **$\beta$ (Basic LLM)** | $R_2$ (UNDERWRITE) | 330 | 5.42% (13/240) | 0 | \$0.00 | \$0.00 | **\$0.00** | 317 |
| **$\gamma$ (Hardened LLM)** | $R_0$ (Raw EOA) | 330 | 96.25% (231/240) | 0 | \$170.00 | \$0.00 | **\$170.00** | 98 |
| **$\gamma$ (Hardened LLM)** | $R_1$ (Fixed Caps) | 330 | 29.58% (71/240) | 0 | \$170.00 | \$0.00 | **\$170.00** | 258 |
| **$\gamma$ (Hardened LLM)** | $R_2$ (UNDERWRITE) | 330 | 15.83% (38/240) | 0 | \$170.00 | \$165.00 | **\$5.00** | 232 |

### Key Experimental Findings

1. **H1 (Safety Floor — Confirmed):** Under $R_1$ and $R_2$, Class I invariant violations were strictly **zero** ($0$) across all agents, preventing \$10,700 in unauthorized transfers seen in $R_0$.
2. **H2 (Calibration — Confirmed):** Realized error rates on Generator B stream remained bounded below Clopper-Pearson 95% upper bounds ($p_\gamma = 0.0582, p_\beta = 0.1743$).
3. **H3 (Discrimination — Confirmed):** Exam competence rankings matched unmitigated loss prevention capability in $R_0$ (Gamma loss \$170 vs Beta loss \$6,010 vs Alpha loss \$28,000).
4. **H4 (Distribution Shift Limit — Documented):** On the isolated Blind Red-Team set, an unseen freight discrepancy leaked past Gamma under $R_2$ (\$170.00), demonstrating that in-distribution exam bounds cannot guarantee 100% defense against out-of-distribution threats.
5. **Controlled Mechanism Check (Passed):** In the scripted $R_2$ experiment, the \$170.00 synthetic MockUSDC loss was claimed by the owner, approved by the adjudicator, and reimbursed \$165.00 by `BondPool.sol`, leaving a \$5.00 deductible. This is not a public-chain or production-loss claim.

---

## 5. Verifiable Reproducibility

### A. Independent Qualification Verification (`uw verify`)

Anyone can independently verify that an active on-chain qualification matches its exact exam artifacts:

```bash
# Recomputes canonical report hash, configHash, corpusHash, Clopper-Pearson envelope, and checks on-chain limits
pnpm uw verify 0x5ac77c6e577ff5919c6ad00b2dc4d2850350ca93f64fb654c12aa844c2573d0f
# Output: PASS (or FAIL with exact field mismatch if report.json is modified by even 1 byte)
```

### B. Deterministic Experiment Rescoring (`uw experiment rescore`)

All metrics in `docs/EXPERIMENT.md` are deterministically re-derived from committed JSONL trace files:

```bash
pnpm uw experiment rescore evidence/experiments/main/alpha_R0
```

---

## 6. Repository Layout

```
├── contracts/               # Solidity 0.8.28 contracts & Foundry tests
│   ├── src/
│   │   ├── UnderwriteVault.sol # Core payment vault (T1 autonomous, T2 dual-approval)
│   │   ├── BondPool.sol        # Underwriter bond custody, claims & atomic revocation
│   │   └── MockUSDC.sol        # 6-decimal ERC-20 token
│   ├── script/                 # Deploy & ClaimDemo forge scripts
│   └── test/                   # Unit, fuzz, and stateful invariant test suites
├── engine/                  # TypeScript runtime & verification engine
│   ├── src/
│   │   ├── compiler/           # Clopper-Pearson bounds & compiler@1 pure function
│   │   ├── exam/               # 15-family scenario generator, harness, scorer & report
│   │   ├── experiment/         # Protocol runner, Generator B stream, blind set
│   │   ├── policy/             # Deterministic AP firewall & state snapshot
│   │   └── cli.ts              # uw CLI (manifest, exam, compile, attest, activate, verify)
│   └── test/                   # Vitest unit & integration test suites
├── web/                     # Next.js 15 App Router Web UI (0 external CDNs/fonts)
│   └── src/
│       ├── app/                # Dashboard, exam, traces, attack-lab, claims, evidence, experiment
│       └── components/         # ProvenanceBadges (REPLAY, SCRIPTED, CONTROLLED, SIMULATED)
├── docs/                    # Technical specifications & competition documents
│   ├── EXPERIMENT.md           # Pre-registered protocol & empirical results
│   ├── TECHNICAL.md            # Mathematical architecture & compiler formulation
│   └── SECURITY_SELF_ASSESSMENT.md # Invariant mapping & known risks catalog
└── evidence/                # Canonical audit trail (exams, experiments, on-chain receipts)
```

---

## 7. Honest Disclosures & Limitations

Per AGENTS.md Rule 12 and research integrity requirements:
- **No Private Keys in Context:** All private keys are testnet/Anvil throwaways loaded from `.env`.
- **Simulation Labels:** All synthetic scenarios, replay traces, and scripted adjudicators are visually labeled with provenance badges (`REPLAY`, `SCRIPTED`, `CONTROLLED`, `SIMULATED`).
- **Generator Isolation:** Because an external author was not available, Generator B and the Blind Red-Team set were self-authored under pre-registered fallback **DEC-023** and are labeled `non-independent (self-authored)`.
- **Evaluation Bounds:** Statistical upper bounds describe performance on the exam distribution only and do not extrapolate to general real-world fraud base rates.
