Progress source of truth: PHASES.md

## Handoff — 2026-10-16 14:46 UTC, antigravity-1
Last verified working state: P2-T04 complete (Comprehensive BondPool test suite; 99 tests passing across 16 suites)
Active phase: P2 — BondPool and backing coupling (Track A)
Next concrete task: P2-T05 | A | needs: P2-T03 | Fuzz and invariant tests for INV-10, 11, 14 (Files: contracts/test/invariant/**)
Tests run this session: `git rev-parse --is-inside-work-tree; pnpm -v; forge --version; anvil --version` → true, 12.8.1, forge 1.8.5, anvil 1.8.5; `grep -c '^## DEC-' DECISIONS.md` → 20; `diff plan.md AGENTS.md` → exact match for 12 rules; `git check-ignore` → secrets/builds ignored, deployments/evidence tracked; `git ls-files | grep -c gitkeep` → 25 gitkeep files present; `pnpm install && pnpm -r build && pnpm -r lint && pnpm -r typecheck && pnpm -r test` → all exit 0 across workspace; `cd contracts && forge build && forge test && forge fmt --check` → all exit 0, 1 test passed; `.github/workflows/ci.yml` verified locally; pre-commit hook secret scan verified; QG-0 clean-clone build & test passed; `bash scripts/check_errors.sh` → all 24 custom errors triggered; `bash scripts/check_inv.sh` → 0 missing invariants; `cd contracts && forge test --match-path "*invariant*"` → 4 stateful invariants passed (256 runs, 25,600 calls); `cd contracts && forge test` → 99 tests passed across 16 test suites; `forge fmt --check --root contracts` → clean; `slither` static analysis run on UnderwriteVault and MockUSDC (26 findings triaged in TESTING.md); `node scripts/export-abi.mjs && pnpm -r typecheck` → exit 0; P1-T15 independent review passed with APPROVE verdict; QG-1 gate passed; P2-T01 tests passed (4 tests); P2-T02 claims tests passed (4 tests); P2-T03 integration tests passed (2 tests); P2-T04 comprehensive BondPool suite passed (11 tests).
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs; 99 targeted tests cover all errors and invariants).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events)
Risks of touching current code: Low (All 99 unit & integration tests pass; proceeding to P2-T05 invariant and fuzz tests for INV-10, 11, 14)
Phase checklist: P0 [x] P1 [x] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6 [ ] P7 [ ] P8 [ ] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x]

## Testnet accounts (Base Sepolia throwaways, generated local .env)
- DEPLOYER: `0x9126090d4650bD722FD8763d164D325A270A78F2`
- OWNER: `0x38461fd5B7421cE286bDD337255e55a41A9D6C1A`
- EXAMINER: `0x37bd563ad02C907Dc32A2B624e989CCa15f696aE`
- UNDERWRITER: `0xA43F159DCe29c36Ff872CD3bB84DA79BfDEf4786`
- ADJUDICATOR: `0x6Bf37266F1Db79D5e194D5e2929dcA54aDe76Af9`
- GUARDIAN: `0x768806D8334099cF9594b7c18B25dA54c28E85Ca`

## LLM Provider Configuration
Configured to use Gemini API via OpenAI-compatible endpoint (`OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/`):
- Beta Agent: `gemini-2.5-flash`
- Gamma Agent: `gemini-2.5-pro`
- User only needs to set `GEMINI_API_KEY` (or `OPENAI_API_KEY`) in local `.env`.
