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

