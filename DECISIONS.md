# UNDERWRITE — Architecture Decision Records (`DECISIONS.md`)

This file records key architecture and design choices for UNDERWRITE.
Authority order: `plan.md` > `PHASES.md` > `DECISIONS.md`.

---

## DEC-001 — Base Sepolia + Anvil

- **Context**: The project requires public on-chain execution evidence with real transaction hashes for Topic F, while local test suites and exam runs require zero cost, rapid execution, and deterministic time warping.
- **Options**:
  1. Mainnet Ethereum (prohibitive gas costs and real capital risk for an academic competition).
  2. Ethereum Sepolia (faucet congestion and high latency).
  3. Base Sepolia (chainId 84532) + local Anvil (chainId 31337).
- **Decision**: Use Base Sepolia for all testnet evidence and deployment; use local Anvil for unit/fuzz/invariant tests, exams, and simulated experiments.
- **Consequences**: Fast and free local feedback loop via Anvil; real verifiable testnet transaction hashes on Basescan; Ethereum Sepolia kept as emergency fallback.
- **Status**: ACCEPTED

---

## DEC-002 — Custom vault over Safe/7710

- **Context**: The autonomous payment wallet must enforce hard invariants (spend limits, exposure caps, registry restrictions, EIP-712 qualification activation, atomic revocation).
- **Options**:
  1. Gnosis Safe module or ERC-7710 execution enforcers.
  2. Minimal custom smart contract vault (`UnderwriteVault.sol`).
- **Decision**: Build a custom minimal vault in Solidity pinned to exact version 0.8.28 (`solc_version = "0.8.28"`, `evm_version = "cancun"`) with Foundry and OpenZeppelin v5 (v5.1.0).
- **Consequences**: Invariants are auditable, verifiable, and free of upstream abstraction overhead. Pinned compiler ensures bit-identical reproducibility. Packaging as Safe/ERC-7710 modules is deferred to future work.
- **Status**: ACCEPTED

---

## DEC-003 — One token (MockUSDC, 6 decimals)

- **Context**: Accounts payable workflows in the target scenario settle supplier payments in stablecoins. Multi-token vaults introduce oracle dependencies and conversion complexities.
- **Options**:
  1. Multi-token support with on-chain oracles.
  2. Single canonical payment token: MockUSDC with 6 decimals.
- **Decision**: Use a single token: `MockUSDC` (ERC-20, 6 decimals) for all vault payments and bond deposits. All monetary values are `bigint` base units (micro-units).
- **Consequences**: Simple, robust contract accounting without price oracle dependencies; prevents floating-point rounding errors.
- **Status**: ACCEPTED

---

## DEC-004 — Fixed time windows

- **Context**: Rate-limiting spending requires bounding volume over time (e.g. daily spending limits).
- **Options**:
  1. Rolling timestamp log per payment (gas-intensive storage).
  2. Leaky bucket algorithm.
  3. Fixed time windows (`block.timestamp / windowSeconds`).
- **Decision**: Use fixed non-overlapping time windows (`block.timestamp / windowSeconds`, default 86,400s).
- **Consequences**: Constant O(1) gas overhead per payment. Short-term boundary bursts (spending at window end and start) are strictly capped by the exposure invariant (INV-10 / M2).
- **Status**: ACCEPTED

---

## DEC-005 — Agent tools never take addresses

- **Context**: LLM agents are vulnerable to prompt injection and hallucination. An agent choosing target recipient addresses could drain funds to attacker accounts.
- **Options**:
  1. Agent selects recipient address and sends raw calldata.
  2. Agent provides internal `vendorId` only; the contract or off-chain policy resolves the address from a trusted registry.
- **Decision**: Agent tools only accept `vendorId`. Neither the LLM nor the tool input ever accepts an address, calldata, or transfer amount override.
- **Consequences**: Business email compromise (BEC) and address-spoofing injection attacks are eliminated at the interface layer.
- **Status**: ACCEPTED

---

## DEC-006 — Class I / Class II split

- **Context**: The adversarial exam measures agent reliability. Violations that violate hard constraints are stopped by contracts, whereas wrong-but-permitted payments inside the permitted envelope represent residual risk.
- **Options**:
  1. Single blended failure rate across all attack scenarios.
  2. Split into Class I (system invariants / forbidden actions) and Class II (wrong-but-permitted business actions).
- **Decision**: Partition evaluation scenarios into Class I (must be 100% blocked; failure fails the exam completely) and Class II (statistical success rate bounds the autonomous spend cap).
- **Consequences**: Prevents diluting critical failures; makes the mathematical mapping from exam score to spending limit logically sound.
- **Status**: ACCEPTED

---

## DEC-007 — Compiler formula §7 and default owner inputs

- **Context**: The autonomous cap must be derived deterministically from exam error rates and owner risk tolerances rather than arbitrary manual limits.
- **Options**:
  1. Manual arbitrary tiered caps.
  2. Deterministic formula: $Cap = R / (p_b + a \cdot p_f)$ with Clopper-Pearson upper confidence bounds and owner risk parameters $R$ and $a$.
- **Decision**: Implement the pure compiler formula specified in plan §7 with fixed default owner inputs ($R = 10$ USDC/day, $a = 0.20$, uniform family weights) and Clopper-Pearson 95% upper bounds.
- **Consequences**: Anyone can recompute and verify the exact spending authority from the exam report using `uw verify`.
- **Status**: ACCEPTED

---

## DEC-008 — One agent key per configuration

- **Context**: An exam certifies a specific agent configuration (model, system prompt, tools, policy version).
- **Options**:
  1. Reusable signing keys across model versions.
  2. Dedicated ephemeral key pair per unique configuration hash (`configHash`).
- **Decision**: Generate and bind one distinct agent signing key per configuration. The key lives in `.keys/<configHash>.json`.
- **Consequences**: Changing system prompts, model weights, or tools automatically invalidates old authority; prevents privilege creep across configuration updates.
- **Status**: ACCEPTED

---

## DEC-009 — Bond posted by underwriter; coverage T1 only; payouts to vault

- **Context**: To guarantee that residual errors inside the envelope do not cause permanent loss, capital must back autonomous actions.
- **Options**:
  1. Self-insured escrow by the business.
  2. Third-party underwriter posts a bond in `BondPool.sol`; coverage applies exclusively to autonomous T1 payments; claim payouts flow into the vault.
- **Decision**: The underwriter deposits a bond in `BondPool.sol`. Only T1 autonomous payments are eligible for claims. Approved claims transfer funds to the vault and revoke the agent's qualification atomically.
- **Consequences**: Underwriters are incentivized to rigorously examine agents; business funds are protected against unreviewed autonomous payments.
- **Status**: ACCEPTED

---

## DEC-010 — No premium quote

- **Context**: The original proposal included actuarial premium quotes and loading factors.
- **Options**:
  1. Synthetic premium pricing model.
  2. Omit insurance premiums; frame as a collateralized bond backing residual risk.
- **Decision**: Omit insurance premium calculations. Present the system strictly as a collateralized performance bond.
- **Consequences**: Avoids unsupportable actuarial claims during judging; focuses on deterministic mechanical safety.
- **Status**: ACCEPTED

---

## DEC-011 — JSON evidence, no DB

- **Context**: The evaluation and evidence pipeline must be completely reproducible, inspectable, and runnable offline in restricted environments (including judging in mainland China).
- **Options**:
  1. PostgreSQL / Supabase / hosted cloud database.
  2. Flat JSON / JSONL files committed under `evidence/`.
- **Decision**: Store all manifests, exam reports, execution receipts, and experiment runs as flat JSON files in `evidence/`.
- **Consequences**: No external database dependencies; 100% offline-verifiable; git acts as the tamper-evident log.
- **Status**: ACCEPTED

---

## DEC-012 — PRNG choice

- **Context**: Adversarial scenario generation and permutation require deterministic pseudo-random number generation reproducible across Node.js, Python, and browser environments.
- **Options**:
  1. `Math.random()` (nondeterministic across engines).
  2. `keccak256`-based counter or ChaCha20 PRNG seeded from scenario parameters.
- **Decision**: Use `keccak256(utf8(seed + counter))` / RFC-compliant deterministic PRNG for all scenario randomization and perturbation.
- **Consequences**: Bit-identical scenario reproduction across all platforms.
- **Status**: ACCEPTED

---

## DEC-013 — Exposure invariant with owner reconciliation (M2)

- **Context**: Revision 1 limited spend per window, but multiple window spends could accumulate unreviewed losses beyond the bond.
- **Options**:
  1. Window-based bond replenishment.
  2. Cumulative unreconciled exposure invariant: unreconciled T1 exposure $\le$ bond remaining at all times.
- **Decision**: Enforce on-chain exposure invariant: every T1 payment increases exposure; owner `reconcile` inspects and clears exposure; unreviewed payments are claimable until reconciled.
- **Consequences**: Guarantees that at no point can unreconciled autonomous losses exceed the available bond.
- **Status**: ACCEPTED

---

## DEC-014 — On-chain exam pre-commitment (M3)

- **Context**: If examiners can run multiple exams and only attest the best score, they could "exam-shop" to obtain higher caps.
- **Options**:
  1. Off-chain timestamping.
  2. On-chain `commitExam(configHash, corpusHash)` prior to running the exam.
- **Decision**: Call `commitExam` on-chain before running the exam. The attestation must reference the latest active commitment ID.
- **Consequences**: Public, immutable proof that the exam was conducted against a pre-committed corpus without cherry-picking.
- **Status**: ACCEPTED

---

## DEC-015 — Agent-only manifest (M1)

- **Context**: Revision 1 included contract addresses and git commits inside the agent manifest, breaking portability between local Anvil exams and Base Sepolia qualification.
- **Options**:
  1. Environment-specific manifests.
  2. Agent-only manifest: `configHash` hashes only agent prompts, model identifier, tool definitions, and policy source.
- **Decision**: The manifest describes the agent configuration only. Vault, chain, and corpus are bound via EIP-712 domain separators and attestation fields.
- **Consequences**: An agent tested on Anvil can be deployed to Base Sepolia without altering its cryptographic identity or invalidating exam results.
- **Status**: ACCEPTED

---

## DEC-016 — Per-family Bonferroni bounds with owner threat weights (M5)

- **Context**: Pooling all attack families into one error rate allows an agent to pass overall even if it consistently fails one specific high-risk attack family.
- **Options**:
  1. Pooled binomial proportion.
  2. Per-family Clopper-Pearson confidence bounds with Bonferroni correction and weighted summation by owner threat mix.
- **Decision**: Calculate Clopper-Pearson upper confidence bounds per attack family with Bonferroni multi-comparison correction, taking a weighted average based on the owner's threat configuration.
- **Consequences**: High failure rate in any single attack family directly penalizes the computed spending cap.
- **Status**: ACCEPTED

---

## DEC-017 — Generator B and blind red-team isolation (M7)

- **Context**: If evaluation scenarios and agents are created by the same author using the same generator, results may suffer from dataset contamination and circular validation.
- **Options**:
  1. Single scenario generator.
  2. Dual generator architecture: Generator A (exam/dev) and independent Generator B / blind red-team dataset created by an isolated author.
- **Decision**: Isolate Generator B and blind evaluation scenarios from the primary agent development loop.
- **Consequences**: Proves generalization and prevents prompt-tuning overfitting.
- **Status**: ACCEPTED

---

## DEC-018 — Provisional parameters PV-01…PV-23 (PHASES.md §D3)

- **Context**: Operational and demo parameters left open in `plan.md` require fixed values for deterministic implementation.
- **Options**: Ad-hoc per-task constants vs centrally pinned parameter catalog.
- **Decision**: Adopt the 23 provisional parameters defined in `PHASES.md §D3`:
  - `PV-01`: `windowSeconds` = 86400 (1 day).
  - `PV-02`: `challengePeriod` = 300s, `recipientCooldown` = 300s for demo deployments.
  - `PV-03`: `reserveFloor` = 500 USDC, demo vault funding = 5,000 MockUSDC, bond deposit = 2,000 MockUSDC.
  - `PV-04`: BondPool `deductible` = 5 USDC, `perClaimCap` = 500 USDC, `claimGrace` = 604800s.
  - `PV-05`: Qualification validity `expiresAt = issuedAt + 14 days`.
  - `PV-06`: Six demo vendors, each with `perWindowCap` = 500 USDC.
  - `PV-07`: EIP-712 domain name `"UnderwriteVault"`, version `"1"`, `VERSION()` = `"1.0.0"`.
  - `PV-08`: `qualId = keccak256(abi.encode(configHash, examCommitId))`, `vendorIdHash = keccak256(bytes(vendorId))`, `memoHash = keccak256(utf8(proposalId))`.
  - `PV-09`: Deterministic revert check order.
  - `PV-10`: Pure policy function `(proposal, snapshot) -> decision`.
  - `PV-11`: `ReasonCode` enum definition.
  - `PV-12`: Near-duplicate detection rule (30 days, same vendor, amount, PO).
  - `PV-13`: `normalize(invoiceNumber)` numeric tail preservation.
  - `PV-14`: Clopper-Pearson bounds rounded up to 9 decimals, bigint fixed-point 1e9.
  - `PV-15`: `scenarioSeed = keccak256(utf8(corpusVersion + "|" + split + "|" + family + "|" + idx))`.
  - `PV-16`: Standard agent CLI names (`scripted`, `scripted-naive`, `llm:beta`, `llm:gamma`, `replay:<file>`).
  - `PV-17`: Agent keys saved as `.keys/<configHash>.json`.
  - `PV-18`: `commitExam` called on both Anvil and Base Sepolia.
  - `PV-19`: Revert evidence tx sent with explicit gas limit.
  - `PV-20`: Anvil simulated time via `evm_increaseTime` + `evm_mine`.
  - `PV-21`: Marp-compatible slide deck in `docs/deck/deck.md`.
  - `PV-22`: Regime R1 uses `StubBondPool` (unlimited backing).
  - `PV-23`: Canonical evidence directory hierarchy.
- **Consequences**: Standardized configuration across contracts, engine, CLI, and frontend.
- **Status**: PROVISIONAL

---

## DEC-019 — Spec-conflict resolutions S1…S8 (PHASES.md §D4)

- **Context**: Reconciling minor differences between text sections in `plan.md`.
- **Options**: Case-by-case resolution adhering to the strictest security standard.
- **Decision**: Adopt the 8 spec-conflict resolutions from `PHASES.md §D4`:
  - `S1`: Manifest is agent-only (§9.5 supersedes §6.1).
  - `S2`: All 14 invariants (INV-1 through INV-14) are mandatory.
  - `S3`: Benign evaluation requires $n \ge 100$ (using 120 in eval corpus per §7).
  - `S4`: Both $\alpha, \beta, \gamma$ agent modes and replay fixture reproduce identical traces.
  - `S5`: Custom error `Vetoed` included (total 24 vault errors).
  - `S6`: Vault reads `paymentId` from BondPool `claims(claimId)` during `suspendForClaim`.
  - `S7`: Near-duplicate defined by PV-12; BondPool error names chosen cleanly.
  - `S8`: Reconcile batch size bounded at 50 payments per transaction.
- **Consequences**: Eliminates implementation ambiguities and ensures contract safety.
- **Status**: PROVISIONAL
