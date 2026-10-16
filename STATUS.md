Progress source of truth: PHASES.md

## Handoff — 2026-10-16 13:22 UTC, antigravity-1
Last verified working state: a8b0199 — P1-T02 verified with VaultSkeleton tests
Active phase: P1 — UnderwriteVault + MockUSDC (Track A)
Next concrete task: P1-T04 | A | needs: P1-T02 | commitExam, activateQualification, revoke, suspendForClaim (Files: contracts/src/UnderwriteVault.sol contracts/test/Vault.Qualification.t.sol)
Tests run this session: `git rev-parse --is-inside-work-tree; pnpm -v; forge --version; anvil --version` → true, 12.8.1, forge 1.8.5, anvil 1.8.5; `grep -c '^## DEC-' DECISIONS.md` → 19; `diff plan.md AGENTS.md` → exact match for 12 rules; `git check-ignore` → secrets/builds ignored, deployments/evidence tracked; `git ls-files | grep -c gitkeep` → 25 gitkeep files present; `pnpm install && pnpm -r build && pnpm -r lint && pnpm -r typecheck && pnpm -r test` → all exit 0 across workspace; `cd contracts && forge build && forge test && forge fmt --check` → all exit 0, 1 test passed; `.github/workflows/ci.yml` verified locally; pre-commit hook secret scan verified; QG-0 clean-clone build & test passed; `cd contracts && forge test` → 12 tests passed (MockUSDC, MockBondPool, VaultSkeleton, VaultAdmin). Note: web/package.json is stubbed for P8.
Tests NOT run: Full invariant suites (to be added in P1/P2)
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL)
Risks of touching current code: Low (contracts/src empty, ready for P1 implementation)
Phase checklist: P0 [x] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6 [ ] P7 [ ] P8 [ ] P9 [ ] P10 [ ] QG-0 [x]

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
