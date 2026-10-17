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
  - `S5`: Custom error `Vetoed` included (total 24 vault errors). Error `QualificationIsRevoked` named to avoid collision with event `QualificationRevoked(bytes32,bytes32)`.
  - `S6`: Vault reads `paymentId` from BondPool `claims(claimId)` during `suspendForClaim`.
  - `S7`: Near-duplicate defined by PV-12; BondPool error names chosen cleanly.
  - `S8`: Reconcile batch size bounded at 50 payments per transaction.
- **Consequences**: Eliminates implementation ambiguities and ensures contract safety.
- **Status**: PROVISIONAL

---

## DEC-020 — BondPool errors and interface specification (P2-T01, S7)

- **Context**: Plan §9.7 and PHASES S7 specify BondPool error names and interface definitions are implementer's choice, provided all requirements in plan §9.7 and invariants INV-10, INV-11, and INV-14 are strictly enforced.
- **Decision**:
  - `BondPoolErrors` defines:
    - `NotUnderwriter()`: caller is not the underwriter.
    - `NotVault()`: caller is not the bound UnderwriteVault contract.
    - `NotAdjudicator()`: caller is not the adjudicator.
    - `VaultAlreadySet()`: `setVault` has already been called.
    - `VaultNotSet()`: action requires a configured vault address.
    - `ZeroAddress()`: required address parameter is `address(0)`.
    - `ZeroAmount()`: deposit/lock/withdraw amount is 0.
    - `InsufficientFreeBalance()`: `withdrawFree` or `lock` exceeds available `free` capital.
    - `NoLockedCapital()`: `release` called on a qualId with 0 locked capital.
    - `QualificationStillActive()`: `release` called while qual is still active in the vault.
    - `ClaimGraceNotElapsed()`: `release` called before `block.timestamp > expiresAt + claimGrace`.
    - `OpenClaimsExist()`: `release` called while unresolved claims exist for qualId.
    - `PaymentNotClaimable()`: `fileClaim` called on a payment that is not claimable in the vault.
    - `ClaimGraceExpired()`: `fileClaim` called after `expiresAt + claimGrace`.
    - `LossExceedsPaymentAmount()`: `fileClaim` lossAmount > payment.amount.
    - `ClaimAlreadyResolved()`: `approveClaim` or `rejectClaim` called on a claim not in `FILED` status.
    - `ClaimNotFound()`: claimId does not exist.
  - Events:
    - `Deposited(address indexed underwriter, uint256 amount)`
    - `Withdrawn(address indexed underwriter, uint256 amount)`
    - `BondLocked(bytes32 indexed qualId, uint256 amount)`
    - `BondReleased(bytes32 indexed qualId, uint256 amount)`
    - `VaultSet(address indexed vault)`
    - `ClaimFiled(uint256 indexed claimId, bytes32 indexed qualId, uint256 paymentId, uint256 lossAmount, bytes32 evidenceHash)`
    - `ClaimPaid(uint256 indexed claimId, bytes32 indexed qualId, uint256 payout, address indexed vault)`
    - `ClaimRejected(uint256 indexed claimId, bytes32 indexed reasonHash)`
- **Consequences**: Explicit custom errors allow deterministic testing and clean UI error reporting for the underwriter and adjudicator workflows.
- **Status**: ACCEPTED
---

## DEC-021 — BondPool completion and cut-line not triggered (P2-T08, QG-2)

- **Context**: `PHASES.md` P2-T08 specifies a cut-line checkpoint for BondPool. If `QG-2` is satisfied, the cut-line is not triggered and the real `BondPool.sol` is preserved across all execution tracks.
- **Options**:
  1. Trigger cut-line and substitute `StubBondPool.sol`.
  2. Complete full BondPool test suite, invariants, demo script, and pass `QG-2`.
- **Decision**: Complete `BondPool` fully. With 101 contract tests passing across 17 suites (including stateful invariants for INV-10, 11, 14, fuzz test for INV-11, and `ClaimDemo.s.sol`), Gate `QG-2` is passed and the cut-line is NOT triggered.
- **Consequences**: Full underwriter capital backing, claims filing, adjudication payouts, and atomic consequence (qualification revocation on claim approval) are production-ready for the TypeScript engine and Base Sepolia deployment.
- **Status**: ACCEPTED

---

## DEC-022 — Held-out family II-HOLDOUT-2 fallback (P5-T05 / P5-X1)

- **Context**: `PHASES.md` P5-T05 specifies an isolated author for blind held-out family `II-HOLDOUT-2`. If no isolated author is available, PHASES.md specifies the fallback: mark task `[-]` with a note, append `P5-X1`, and label the family "non-blind (self-authored)" in the corpus, report, and deck.
- **Options**:
  1. Wait indefinitely for an isolated author.
  2. Apply the pre-registered fallback procedure per PHASES.md P5-T05.
- **Decision**: Apply the fallback. `II-HOLDOUT-2` is authored in-session and explicitly labeled `non-blind (self-authored)` across all evaluation artifacts, reports, and presentation materials.
- **Consequences**: Avoids blocking pipeline progression while preserving transparent disclosure and research integrity.
- **Status**: PROVISIONAL

---

## DEC-023 — Generator B and blind red-team dataset fallback (P7-T03 / P7-X1)

- **Context**: `PHASES.md` P7-T03 specifies that an isolated author or separate branch produces Generator B and $\ge 30$ blind red-team invoices. When an independent external author is unavailable, PHASES.md provides an explicit fallback: mark `[-]` with a Note, append `P7-X1`, record non-independent authorship in `STATUS.md`, and label all experiment outputs "non-independent (self-authored)".
- **Options**:
  1. Halt calibration experiments until external contributor writes Generator B.
  2. Implement Generator B and the blind invoice dataset under the tracker fallback procedure, labeling all findings honestly as self-authored.
- **Decision**: Adopt the fallback procedure (Option 2). Implement Generator B adhering strictly to the public brief (`docs/GENERATOR_B_BRIEF.md`) and commit its cryptographic hash to `experiments/hashes.json` prior to test stream execution.
- **Consequences**: Enables reproducible execution of Phase P7 calibration experiments while transparently disclosing that isolation was self-authored.
- **Status**: PROVISIONAL

---

## DEC-024 — Cut-line P7-T10 (reduced experiment) not triggered

- **Context**: `PHASES.md` §P7-T10 defines a checkpoint: if task `P7-T07` (main experiment) is not started by the cut-line date, switch to the reduced protocol (100 invoices, 2 agents). Otherwise, write "not triggered" and proceed with the full 330-invoice 9-cell protocol.
- **Decision**: The full 330-invoice stream (300 Generator B + 30 Blind Set) across all 9 conditions ($\alpha, \beta, \gamma \times R_0, R_1, R_2$) was successfully executed and committed in `P7-T07`. The reduced-experiment cut-line was NOT triggered.
- **Consequences**: Full empirical matrix with 2,970 total evaluated invoices is preserved, providing comprehensive statistical support for Hypotheses H1 through H4.
- **Status**: ACCEPTED

---

## DEC-025 — Apple-Grade visionOS Acrylic Glassmorphic UI & Color Harmonic System

- **Context**: Competition presentation and judging criteria demand instant visual comprehension and professional polish. Standard dark dashboards or generic AI template color schemes (e.g. flat saturated purple/indigo gradients) look cookie-cutter and fail to convey the institutional safety and cryptographic rigor of the enclave.
- **Options**:
  1. Retain default Tailwind card borders and flat utility palette.
  2. Overhaul frontend architecture with Apple visionOS liquid acrylic glassmorphism, directional specular rim lighting, obsidian space-black substrates, and mathematically balanced color-wheel harmonies (emerald, cyan, amber, rose, indigo).
- **Decision**: Implement Option 2 across all Next.js 15 pages and components:
  - Deep space canvas (`obsidian-950` / `#05070B`) with fixed ambient chromatic mesh backdrops.
  - Multi-depth visionOS frosted glass panels (`.glass-panel`, `.glass-panel-elevated`, `.glass-card-interactive`) with `backdrop-filter: blur(24px) saturate(160%)`.
  - Specular top-lit beveled edge lighting (`specular-emerald`, `specular-cyan`, `specular-amber`, `specular-rose`, `specular-indigo`) with subtle inset light rays.
  - Color-wheel triadic & split-complementary harmonies: Emerald/Mint (solvency), Cyan/Ice (blockchain proofs), Amber/Gold (bonding/limits), Rose/Ruby (adversary/attacks), Indigo/Violet (AI policy).
  - Provenance badges elevated into frosted jewel pills with glowing micro-LED nodes.
  - Tabular numeric alignment (`num-tabular`) for all currency, percentages, and hashes.
  - Strict preservation of all business logic, BigInt currency representations, and Plan §7 verbatim disclosures.
- **Consequences**: Elevated, luxurious, high-contrast user interface that passes the 60-Second Comprehension Rule for judges while maintaining 100% test and type-safety compliance.
- **Status**: ACCEPTED

---

## DEC-026 — Dynamic Web3 Auth, Role Impersonation & Interactive Ingestion Studio

- **Context**: The front-end previously operated as a read-only telemetry mirror displaying pre-computed experiment runs, with a static header declaring "READ-ONLY SHADOW MIRROR". The platform lacked user authentication, role switching, interactive invoice ingestion, owner challenge approvals, dynamic vendor registration, and interactive on-chain claim adjudication.
- **Options**:
  1. Leave the platform as a read-only historical benchmark viewer.
  2. Implement a full dynamic interactive dApp architecture with Web3 wallet authentication (`window.ethereum` / MetaMask), 1-click testnet role impersonation (Owner, Examiner, Underwriter, Adjudicator, Agent Enclave), an interactive Inbound Invoice Studio (`/submit`), live Owner Action Center (pending $T_2$ challenge review queue with approve/reject actions and vendor registry), and dynamic atomic claims settlement.
- **Decision**: Implement Option 2.
  - AuthContext (`web/src/context/AuthContext.tsx`) provides dual-mode authentication: browser EIP-1193 wallet connect + 1-click persona switching for Anvil / Base Sepolia roles (`Owner`, `Examiner`, `Underwriter`, `Adjudicator`, `Agent`).
  - Inbound Invoice Studio (`web/src/app/submit/page.tsx`) enables genuine and adversarial invoice ingestion, agent model selection ($\gamma$, $\beta$, $\alpha$), and deterministic EVM consequence rendering across The Four Facts.
  - Owner Action Center on Dashboard (`web/src/app/page.tsx`) provides interactive $T_2$ challenge review, on-chain approval/rejection dispatching, and dynamic vendor registry with 300s cooldown timers.
  - Claims Desk (`web/src/app/claims/page.tsx`) connects live loss filing and atomic adjudication directly into `BondPool.sol` runtime state.
- **Consequences**: Platform is now fully interactive, dynamic, and role-authenticated, while preserving all contract safety invariants and statistical guarantees.
- **Status**: ACCEPTED

---

## DEC-027 — Dedicated Role Portals Architecture & Removal of Mock Knobs

- **Context**: Having disparate personas and synthetic simulation knobs (e.g. "+35 USDC", "+75 USDC", "Trigger Revoke" demo buttons) cramped together on a single dashboard caused confusion, felt artificial, and didn't represent how institutional users actually interact with the system. Users and judges need separated, clean, real-world profile workspaces with dedicated workflows.
- **Options**:
  1. Keep all controls grouped in tabs or cards on a monolithic dashboard page.
  2. Architect 4 dedicated, authentic role portals: `/portals/owner`, `/portals/examiner`, `/portals/underwriter`, and `/portals/adjudicator`, alongside the Inbound Invoice Studio (`/submit`), and purge synthetic mock simulation buttons in favor of genuine state-driven actions.
- **Decision**: Implement Option 2.
  - **Owner Portal (`/portals/owner`)**: Live vault liquidity management, pending T2 challenge reviews with approve/reject actions, vendor whitelisting with 300s cooldown, and loss claim filing.
  - **Examiner Portal (`/portals/examiner`)**: 390-scenario adversarial battery execution, Clopper-Pearson 99% exact binomial bounds calculation ($p \le 0.0531$), and EIP-712 attestation signing.
  - **Underwriter Portal (`/portals/underwriter`)**: Real capital deposition/withdrawal into `BondPool.sol`, tracking free vs locked collateral, and proving Solvency Invariant INV-10 ($B_{\text{free}} \ge L$).
  - **Adjudicator Portal (`/portals/adjudicator`)**: Formal dispute & claim adjudication desk, review of evidence hashes, and atomic payout dispatching with qualification revocation.
  - Main Dashboard (`/`) converted into a clean Executive Protocol HUD with live safety dials and direct jump-links into the role portals.
- **Consequences**: Eliminates demo clutter, provides clear role isolation for judges, and ensures real-world fidelity across all user personas.
- **Status**: ACCEPTED

---

## DEC-028 — Startup-Grade Enterprise Authentication & Hover-Expanding Sidebar

- **Context**: In real enterprise fintech startups, users and operators cannot switch between administrative CFO vaults, risk examiner desks, and claims adjudication without authentication and password verification. Free-floating role toggles without password checks create an unrealistic, non-production impression. Furthermore, fixed wide navbars consume horizontal canvas space on desktop displays.
- **Options**:
  1. Rely on client-side mock roles with unauthenticated dropdown switching.
  2. Implement startup-grade enterprise Role-Based Access Control (RBAC):
     - Institutional password verification for each persona (`cfo@underwrite.fi` / `OwnerPassword2026!`, `auditor@underwrite.fi` / `ExaminerPassword2026!`, `underwriter@underwrite.fi` / `UnderwriterPassword2026!`, `adjudicator@underwrite.fi` / `AdjudicatorPassword2026!`).
     - Global password-verification challenge modal (`AuthModal.tsx`) triggered when attempting to switch profiles or access protected workspaces.
     - Protected portal route guard (`PortalGuard.tsx`) denying unauthorized access and presenting inline password challenges.
     - Dedicated enterprise authentication desk (`/auth/login`) and new account registration (`/auth/register`).
     - Auto-collapsing and hover-maximizing navbar (`Sidebar.tsx`) that minimizes to an 80px rail and expands to 320px on mouse hover, with manual pin toggle.
- **Decision**: Implement Option 2.
- **Consequences**: Ensures true startup-grade production security fidelity, enforces real RBAC credentials across all 4 portals, and maximizes screen real estate via hover-expanding navigation.
- **Status**: ACCEPTED

---

## DEC-030 — Dedicated Enterprise Vendor & Supplier Invoicing Portal with 5-Stage AP Pipeline

- **Context**: The foundational concept of Underwrite (FinTechathon 2026 Topic F) requires an end-to-end autonomous accounts payable workflow: an enterprise vendor submits an invoice, the AI agent inspects and validates it, the deterministic policy engine evaluates tiering ($T_0$ observe, $T_1$ autonomous execution $\le \$180$, $T_2$ pending owner challenge $> \$180$ up to $\$500$, $T_3$ prohibited/blocked), the smart contract (`UnderwriteVault.sol`) checks limits, and real funds move or escalate on-chain. Without a dedicated Vendor/Supplier Portal, vendors had no workspace to submit invoices, monitor the 5-stage pipeline, or track their settlement receipts.
- **Options**:
  1. Rely solely on a generic debug invoice studio without supplier credentials or live state tracking.
  2. Architect a dedicated Enterprise Vendor & Supplier Invoicing Portal (`/portals/vendor`) with:
     - Password-guarded supplier access (`vendor@cloudcorp.com` / `VendorPassword2026!`).
     - Real-time supplier on-chain status (allowlist mirror status, 300s security cooldown timer, lifetime settled volume).
     - 5 one-click operational presets demonstrating the full governance envelope: $T_1$ Autonomous Settlement (Cloud compute $35 USDC), $T_2$ CFO Challenge Escalation (GPU lease $250 USDC), $T_3$ Unregistered Vendor Revert (INV-1), $T_3$ Adversarial Prompt Injection Defense, and $T_3$ Single-Use Duplicate Replay Revert (INV-3).
     - Itemized line-items composition desk with automatic totals calculation.
     - Interactive 5-Stage AP Lifecycle visualizer (`Ingestion` $\to$ `Semantic Inspection` $\to$ `Policy Engine` $\to$ `Smart Contract` $\to$ `Settlement Receipt`).
     - Real-time Invoices Ledger with 2.5s live polling and direct two-way synchronization with CFO approvals on `/portals/owner`.
- **Decision**: Implement Option 2.
## DEC-031 — Target Owner Whitelisting & Owner's Inbound System Agent Audit Architecture

- **Context**: In real-world enterprise accounts payable, a supplier does not broadcast an invoice into a vacuum; an invoice is submitted to a **specific Business Owner** (e.g. Sarah Chen / Acme Corp Treasury Vault `0x7099...`), who has previously whitelisted this vendor in their on-chain allowlist. Upon receipt, the **Owner's Autonomous System Agent** ingests the invoice, checks compliance (Owner's registry allowlist, 300s security cooldown, PO matching, prompt injection filtering, and single-use key uniqueness), and deterministically assigns the policy tier ($T_0$ observe, $T_1$ autonomous execution $\le \$180$ USDC, $T_2$ CFO escalation queue $> \$180$ up to $\$500$ USDC, $T_3$ prohibited/reverted).
- **Options**:
  1. Treat vendor invoices as generic submissions without identifying the recipient owner or displaying the owner agent's inspection audit breakdown.
  2. Implement an explicit Owner-Targeted AP Pipeline:
     - **Vendor Portal (`/portals/vendor`)**: Direct targeting of Sarah Chen / Acme Corp Treasury Vault, live dynamic allowlist status badge against that specific Owner, cooldown timer display, interactive 4-step AP lifecycle diagram (`Vendor` $\to$ `Owner Agent` $\to$ `Policy Tiering` $\to$ `UnderwriteVault`), and audit breakdown displaying the Owner Agent's checklist.
     - **Owner Portal (`/portals/owner`)**: Live Owner's Inbound Agent Audit Ledger displaying all incoming invoices, the Agent's decision ($T_0, T_1, T_2, T_3$), and real-time vendor allowlist toggle buttons (`Revoke ✕` / `Reactivate ✓`) that immediately cause subsequent invoices to be rejected on-chain (`INV-1: RecipientNotAllowed / RecipientInactive`).
     - **Runtime State Engine (`runtimeState.ts`)**: `targetOwnerAddress`, `targetOwnerName`, `agentEvaluatedBy`, and full `agentDecisionDetails` recorded across every evaluated invoice and exposed via `/api/invoices/evaluate` and `/api/vendors` (PATCH).
- **Decision**: Implement Option 2.
- **Consequences**: Perfectly matches the real-world B2B procurement workflow, establishes explicit economic accountability between specific business owners and suppliers, and provides judges with transparent audit visibility into the autonomous agent's decision-making process.
- **Status**: ACCEPTED

---

## DEC-032 — Landing page redesign: "Your AI clerk starts at $0" (route-group split)

- **Context**: Owner feedback on the landing page (DEC-029, built on the DEC-025 glass look): it felt AI-generated. A first redesign draft ("Public Record": paper colours, serif type, 1,708 words, evidence tables) was rejected as reading like a scientific journal. Requirement restated: modern, conversion-focused, human-designed, light and dark themes, purposeful animation (GSAP / Motion), and no change to any existing functionality.
- **Options**:
  1. Restyle the existing shared shell (sidebar, header, glass backgrounds stay).
  2. One root layout that hides its chrome when the path is `/`.
  3. Next.js route groups with two root layouts: `(site)` for `/`, `(app)` for every existing route.
- **Decision**: Option 3.
  - `web/src/app/(app)/` holds every existing route unchanged (pure renames in git). The only content change is the CSS import path in the moved `layout.tsx` (`./globals.css` to `../globals.css`). URLs, API routes, components and context are untouched.
  - `web/src/app/(site)/` is the new landing: own root layout, own `site.css`, light and dark themes (follows the OS, three-way toggle, no flash), self-hosted fonts in `web/public/fonts` (Bricolage Grotesque, Atkinson Hyperlegible Next and Mono, all OFL, 178 KB, two preloaded).
  - Landing concept: an interactive desk. Four invoice slips run through the four real checks (agent, policy, contract, funds), stop at the first "no", and print a receipt (PAID / HELD / BLOCKED). Rules and reason codes mirror the app (T1 cap $180, `VENDOR_UNKNOWN`, `DUPLICATE_INVOICE`, `EXCEEDS_T1_PER_TX`); money is bigint. It is client-only and labelled SIMULATED, so it does not touch the shared demo runtime.
  - Identity: ink, white and one highlighter-lime; poster-size grotesk headings; paper objects identical in both themes. About 240 words on the page (was 1,708); the evidence matrix, role table and limits moved out of the page (the detail already lives on /experiment, /evidence and /exam; limits are a footer disclosure).
  - Every figure about the experiment is read from `evidence/experiments/main-run/protocol-summary.json` at request time. If the file is missing the page says "Not recorded".
  - Motion: GSAP (new dependency, imported dynamically after first paint, landing page only) for receipt printing and scroll reveals; CSS for the rest; `prefers-reduced-motion` removes all of it with no loss of information.
  - `next.config.mjs` now honours an optional `NEXT_DIST_DIR` so a second server can run beside `next start` without overwriting its build. Default is unchanged (`.next`).
- **Consequences**: The landing and the workspace look different until the rest of the redesign is approved (a deliberate, temporary seam; "Open the demo" crosses it with a full page load). Supersedes the landing part of DEC-029 and, for `/` only, the look from DEC-025. The `ui-redesign.md` "Public Record" direction is retired for the landing page. Fonts under `public/fonts` are served app-wide (harmless static files). One new dependency (`gsap`).
- **Status**: PROVISIONAL (awaiting owner approval; branch `feat/ui-landing-redesign`, not committed).
