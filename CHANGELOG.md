# Changelog

All notable changes to the UNDERWRITE project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `plan.md`: Authoritative design specification for FinTechathon 2026 Topic F.
- `PHASES.md`: 124-task phased execution tracker with quality gates QG-0 to QG-9.
- `AGENT_PROMPT.md`: Universal boot prompt for multi-agent autonomous engineering.
- `scripts/progress.sh`: Read-only execution progress and next-task analyzer.
- `.gitattributes`: Repository normalization for LF line endings.
- `TESTING.md`: Environment tool snapshot and verification audit log.
- `STATUS.md`: Agent handoff block and live operational status.
- `DECISIONS.md`: Architectural Decision Records DEC-001 through DEC-019.
- `CHANGELOG.md`: Change tracking log.
- `UnderwriteVault.sol`: implement `pay` (T1 execution) with strict PV-09 revert order, exposure tracking, window spend tracking, invoice uniqueness, and `PaymentExecuted` event.
- `contracts/test/Vault.Pay.t.sol`: 13 unit tests verifying T1 payment happy path and all 12 PV-09 revert error conditions.
- `UnderwriteVault.sol`: implement T2 flow (`requestPayment`, `executePending`, `veto`) with invoice reservation, challenge period enforcement, post-delay re-validation, and veto release.
- `contracts/test/Vault.T2.t.sol`: 13 unit tests verifying full T2 lifecycle, owner/guardian veto, invoiceKey release, stranger veto rejection, and all PV-09 revert conditions.
- `UnderwriteVault.sol`: implement `reconcile` (bounded at 50 payments per transaction per S8), `isClaimable` (tier 1, unreconciled, unclaimed), and sequential per-qual payment tracking with exposure reduction.
- `contracts/test/Vault.Reconcile.t.sol`: 7 unit tests verifying exposure dynamics, insufficient backing unblocking via reconcile, already reconciled guards, stranger rejection, batch bounding at 50, and claim suspension interaction.
- `scripts/check_errors.sh`: automated audit script verifying all 24 custom errors are triggered in unit test suites with `vm.expectRevert`.
- `contracts/test/Vault.Edge.t.sol`: 12 unit tests verifying edge cases from plan §5.5 (exact boundaries, window rollover, single-block payments, T2 revalidation, mid-window ceiling reduction, boundary bursts, reconcile unblocking, and stale commit rejection).
- `contracts/test/Vault.Fuzz.t.sol`: property-based fuzz tests with 512 runs each verifying INV-2 (window limit), INV-3 (per-tx limits), INV-5 (invoice single-use), and INV-6 (reserve floor preservation).
- `contracts/test/invariant/`: stateful invariant test suite with `InvariantHandler` executing 25,600 random actions across 256 runs, validating `invariant_INV1_*`, `invariant_INV2_*`, `invariant_INV5_*`, and `invariant_INV10_*`.
- `contracts/test/Vault.Matrix.t.sol`: dedicated invariant coverage suite ensuring INV-4, INV-7, INV-8, INV-9, INV-12, INV-13, and INV-14 are explicitly covered by named tests.
- `TESTING.md`: Slither static analysis triage for UnderwriteVault and MockUSDC across 26 findings, and recording forge formatting clean pass and coverage status.
- `scripts/export-abi.mjs`: node script to export contract JSON and typed TypeScript ABIs from Foundry build artifacts to `engine/src/chain/abi/`.
- `engine/src/chain/abi/`: generated `UnderwriteVault.json`, `UnderwriteVault.ts`, `MockUSDC.json`, and `MockUSDC.ts`.
- `scripts/check_inv.sh`: automated check verifying all mandatory invariants INV-1..10, 12..14 are present in test suites.
- `TESTING.md`: independent review of `UnderwriteVault.sol` for task P1-T15 by `antigravity-reviewer-1` approving vault implementation for quality gate QG-1.
- `PHASES.md`: Phase 1 Quality Gate QG-1 passed; all 16 Phase 1 tasks verified and green.
- `contracts/src/BondPool.sol`: implemented BondPool core with underwriter deposits, unencumbered withdrawals, vault-only bond locks, remaining views, expiration/grace-bounded releases, and one-time vault binding.
- `contracts/test/BondPool.Core.t.sol`: 4 unit tests verifying deposit/withdraw, lock bounds, release rules, and single-use setVault.
- `DECISIONS.md`: recorded DEC-020 defining custom errors and events for BondPool.
- `contracts/src/BondPool.sol`: implemented claims lifecycle (`fileClaim`, `approveClaim`, `rejectClaim`, `suspendForClaim`), loss caps, deductible flooring, remaining caps, and payout transfer to vault.
- `contracts/test/BondPool.Claims.t.sol`: 4 unit tests verifying claim filing, expiration checks, adjudication payout calculation, and atomic suspension.
- `contracts/test/integration/VaultBondPool.Integration.t.sol`: integration tests combining MockUSDC, BondPool, and UnderwriteVault verifying lock on activation, BondLockFailed, and InsufficientBacking with live BondPool.
- `contracts/test/BondPool.t.sol`: comprehensive test suite with 11 tests verifying all plan §12.2 P2 requirements (lock failure, payout caps, duplicate claim rejection, T2/owner/reconciled claim rejection, atomic claim approve + revoke, insufficient backing drain, exhausted bond claim, release rules).
- `contracts/test/invariant/`: stateful invariant suite with live BondPool executing 25,600 calls across 256 runs, validating INV-1, INV-2, INV-5, INV-10, INV-11, and INV-14 with interleaved pay, reconcile, claim filing, approval, rejection, and time warps; added property fuzz `testFuzz_INV11_payout_bounded_and_transferred_to_vault` (512 runs) to `contracts/test/BondPool.t.sol`.
- `contracts/script/ClaimDemo.s.sol` and `scripts/claim-demo.sh`: implemented and executed Anvil demonstration showing T1 payment, claim filing, atomic payout and revocation in a single transaction, followed by reversion on subsequent payment attempts.
- `contracts/test/BondPool.Fuzz.t.sol`: property-based fuzz test `testFuzz_INV11_payout_bounds_and_single_payout` (512 runs) verifying exact min-cap payouts, locked ceiling, vault credit, and duplicate resolution rejection.
- `scripts/export-abi.mjs`: extended to export `BondPool.json` and `BondPool.ts` to `engine/src/chain/abi/`.
- `engine/src/chain/abi/`: exported `BondPool.json` and `BondPool.ts`.
- `DECISIONS.md`: recorded DEC-021 confirming BondPool completion ahead of schedule and cut-line not triggered.
- `PHASES.md`: Phase 2 Quality Gate QG-2 passed; all 9 Phase 2 tasks complete and 101 contract tests passing across 17 suites.
- `engine/src/types/`: implemented Zod schemas for models (`Proposal`, `PolicyDecision`, `TxRecord`, `Manifest`, `QualificationAttestation`, `Scenario`, `Claim`, `Mandate`, `Vendor`, `PurchaseOrder`) and `ReasonCode` enum.
- `engine/src/types/money.ts` & `invoiceKey.ts`: strict 6-decimal USDC bigint parser and RFC-aligned `normalizeInvoiceNumber` / `computeInvoiceKey`.
- `engine/src/evidence/canonical.ts`: RFC 8785 canonical JSON serialization (JCS), keccak256/sha256 utilities, CRLF-normalizing file hashing.
- `engine/src/mandate/`: mandate parser and `VendorRegistry` address isolation.
- `engine/src/manifest/`: manifest builder computing deterministic `configHash` for `uw-manifest@2`.
- `engine/src/policy/`: pure deterministic policy evaluation engine (`evaluatePolicy`) enforcing limits, exposure, cooldowns, PO matching, and near-duplicate detection.
- `engine/src/chain/`: Viem public/wallet client providers, `ChainReader` state queries, custom error decoder (`decodeErrorResult`), and explicit-gas transaction sender.
- `engine/src/signer/`: `AgentSigner` enforcing calldata isolation and checking `CONFIG_DRIFT` against on-chain qualification.
- `engine/src/executor/`: `TransactionExecutor` requiring decoded `PaymentExecuted` event for successful execution receipts.
- `engine/src/evidence/store.ts`: JSON/JSONL trace writer, run-id directories, and SHA-256 directory checksums.
- `engine/src/cli.ts`: CLI skeleton supporting `run`, `manifest`, `keys new`, and Anvil-guarded `--bypass-policy` mode.
- `engine/fixtures/`: created basic (5 docs) and attack (3 docs) fixtures with expected outcomes.
- `contracts/script/Deploy.s.sol`: deployment script for MockUSDC, BondPool, and UnderwriteVault on local Anvil and testnets.
- `scripts/dev.sh` & `scripts/qualify-dev.ts`: local development bring-up script and EIP-712 qualification activation helper.
- `PHASES.md`: Phase 3 Quality Gate QG-3 passed; all 13 Phase 3 tasks complete, 109 vitest tests passing across 14 suites, 101 foundry tests passing across 17 suites.
- `engine/src/agent/tools.ts`: implemented 7 strict tools (`list_inbox`, `read_document`, `lookup_vendor`, `lookup_purchase_order`, `get_wallet_state`, `propose_payment`, `flag_for_review`) with strict address rejection and untrusted document wrapping.
- `engine/src/agent/scripted.ts`: implemented `scripted` (careful PO/vendor verifier) and `scripted-naive` (α blind extractor) agents.
- `engine/src/agent/runner.ts`: agent runner connecting tool calls, policy checks, on-chain execution, and JSONL trace generation.
- `engine/src/agent/llm.ts` & `llmClient.ts`: provider-agnostic LLM adapter with strict tool schemas, model verification (`MODEL_DRIFT` halt), and native OpenAI/Gemini support.
- `engine/src/agent/prompts/`: minimal prompt `beta.md` and hardened security prompt `gamma.md`.
- `engine/src/agent/replay.ts`: transcript loader and replayer with SHA-256 integrity check and `[REPLAY]` badging.
- `engine/test/agent-sweep.test.ts`: test suite verifying all 5 required test cases for Phase 4.
- `PHASES.md`: Phase 4 Quality Gate QG-4 passed; 144 vitest tests passing across 20 suites, 101 foundry tests passing across 17 suites.



