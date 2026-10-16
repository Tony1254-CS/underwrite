# UNDERWRITE — Test & Verification Log (`TESTING.md`)

## Environment (observed 2026-10-16)

```text
git: git version 2.54.0.windows.1
node: v22.19.0
pnpm: 12.8.1
forge: forge 1.8.5 (51a52c59cf 2026-10-05T17:01:32.131957300Z)
anvil: anvil 1.8.5 (51a52c59cf 2026-10-05T17:01:32.131957300Z)
cast: cast 1.8.5 (51a52c59cf 2026-10-05T17:01:32.131957300Z)
python: Python 3.13.7
OS: Windows 11 / PowerShell 5.1 / Git Bash
```

## Known-failing tests

None.

## Verification Log

- 2026-10-16 12:25 UTC | commit: a9f6329 | `git rev-parse --is-inside-work-tree; pnpm -v; forge --version; anvil --version; cast --version` -> true, 12.8.1, forge 1.8.5, anvil 1.8.5, cast 1.8.5. All required tools detected and verified.
- 2026-10-16 12:28 UTC | commit: 293cd04 | `grep -c '^## DEC-' DECISIONS.md; test -f STATUS.md && test -f DECISIONS.md && test -f TESTING.md && test -f CHANGELOG.md` -> 19, all four files exist.
- 2026-10-16 12:30 UTC | commit: d300685 | `sed -n '875,888p' plan.md | diff -u - <(head -n 13 AGENTS.md); test -f AGENTS.md && test -f CLAUDE.md && test -f GEMINI.md` -> 12 rules match line for line; all 3 files exist.
- 2026-10-16 12:31 UTC | commit: 0a782e3 | `git check-ignore -v .env .keys/x contracts/broadcast/x; git check-ignore .env.example evidence/onchain/x contracts/deployments/84532.json` -> all 3 ignored properly; tracked files print nothing.
- 2026-10-16 12:32 UTC | commit: 71ec0e8 | `git ls-files | grep -c gitkeep` -> 25 gitkeep files present; all 25 skeleton directories and README.md created.
- 2026-10-16 12:38 UTC | commit: 835f50b | `pnpm install && pnpm -r build && pnpm -r lint && pnpm -r typecheck && pnpm -r test` -> all 5 commands exit 0 across engine and web workspace packages; smoke test passed (1 test).
- 2026-10-16 12:47 UTC | commit: e0c43a5 | `cd contracts && forge build && forge test && forge fmt --check` -> compiled with solc 0.8.28; 1 test passed (test_smoke_arithmetic); formatting check clean.
- 2026-10-16 12:49 UTC | commit: a890c87 | `.github/workflows/ci.yml created; verified all CI commands locally: forge fmt, build, test, and pnpm install --frozen-lockfile, lint, typecheck, test` -> all exit 0.
- 2026-10-16 12:51 UTC | commit: 149d46d | `.githooks/pre-commit and scripts/setup-hooks.sh verified; staging mock private key blocked commit with ERROR exit 1; normal commit passes after cleanup.`
- 2026-10-16 12:53 UTC | commit: 8cdb3bc | `QG-0 clean-clone build`: cloned to `../underwrite-cleanclone`; contracts built and passed (1 test); pnpm install --frozen-lockfile, build, test passed (1 test); `git log -p --all | grep -nE "PRIVATE_KEY=[^ ]+"` found no real secrets. All commands exited 0. Clone removed.
- 2026-10-16 13:12 UTC | commit: 11df926 | `cd contracts && forge build && forge test` -> MockUSDC decimals()==6, mint works, MockBondPool controls work; 4 tests passed.
- 2026-10-16 13:17 UTC | commit: a8b0199 | `cd contracts && forge build && forge test` -> UnderwriteVault skeleton compiles; VERSION() == "1.0.0", domainSeparator changes with chainId, immutables verified; 7 tests passed.
- 2026-10-16 13:21 UTC | commit: 73f1856 | `cd contracts && forge test --match-path "*Admin*"` -> 5 tests passed: add/deactivate recipient, pause/unpause, ceilings/params updates, ownerTransfer, NotOwner/NotGuardianOrOwner revert checks.
- 2026-10-16 13:27 UTC | commit: 70835ab | `cd contracts && forge test --match-path "*Qualification*"` -> 9 tests passed: happy path, AttestationUsed, BadSignature, WrongVault, QualificationExpired, StaleExamCommit, BondLockFailed, min(attested, ceilings), supersede, revoke by owner and examiner, stranger rejected. Total 21 tests pass across 5 suites.
- 2026-10-16 13:31 UTC | commit: e397452 | `cd contracts && forge test --match-path "*Pay*"` -> 13 tests passed: happy path T1 payment, duplicate invoice, exceeds per tx, exceeds qual window, exceeds recipient window, insufficient backing, no active qual, not agent, paused, qual expired, recipient cooling down, recipient not allowed, reserve breached. Total 34 tests pass across 6 suites.
- 2026-10-16 13:38 UTC | commit: 29af22a | `cd contracts && forge test --match-path "*T2*"` -> 13 tests passed: happy path T2 lifecycle, veto by owner releases invoiceKey, veto by guardian, stranger cannot veto, NotPending, Paused, QualificationIsRevoked, RecipientNotAllowed, QualificationExpired, ReserveBreached, T2NotAllowed, ExceedsPerTx (request and execute). Total 47 tests pass across 7 suites.
- 2026-10-16 13:42 UTC | commit: 5971c82 | `cd contracts && forge test --match-path "*Reconcile*"` -> 7 tests passed: exposure dynamics, insufficient backing unblocking via reconcile, already reconciled error, stranger cannot reconcile, T2 not claimable, claimed payment not claimable & no double deduction, 50-payment batch bounding. Total 54 tests pass across 8 suites.
- 2026-10-16 13:45 UTC | commit: 03a8b0d | `bash scripts/check_errors.sh` -> 24/24 custom errors triggered by tests; `cd contracts && forge test` -> 54 tests passed across 8 suites.
