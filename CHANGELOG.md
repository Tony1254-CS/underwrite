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
