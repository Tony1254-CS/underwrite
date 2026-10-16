Progress source of truth: PHASES.md

## Handoff — 2026-10-16 15:18 UTC, antigravity-1
Last verified working state: P3-T06 complete (Deterministic policy engine with 24-case decision table, manifest builder, canonical JCS, vendor registry, money and types passing 70 tests in engine)
Active phase: P3 — Engine core (Track B)
Next concrete task: P3-T07 | B | needs: QG-1,P3-T01 | Chain layer (Files: engine/src/chain/*.ts)
Tests run this session: `git rev-parse --is-inside-work-tree; pnpm -v; forge --version; anvil --version` → true, 12.8.1, forge 1.8.5, anvil 1.8.5; `grep -c '^## DEC-' DECISIONS.md` → 21; `diff plan.md AGENTS.md` → exact match for 12 rules; `git check-ignore` → secrets/builds ignored, deployments/evidence tracked; `git ls-files | grep -c gitkeep` → 25 gitkeep files present; `pnpm install && pnpm -r build && pnpm -r lint && pnpm -r typecheck && pnpm -r test` → all exit 0 across workspace; `cd contracts && forge build && forge test && forge fmt --check` → all exit 0; `bash scripts/check_errors.sh` → all 24 custom errors triggered; `bash scripts/check_inv.sh` → 0 missing invariants; `cd contracts && forge test --match-path "*invariant*"` → 6 stateful invariants passed (256 runs, 25,600 calls); `cd contracts && forge test` → 101 tests passed across 17 test suites; `forge fmt --check --root contracts` → clean; `node scripts/export-abi.mjs && pnpm -r typecheck` → exit 0; P1-T15 independent review passed with APPROVE verdict; QG-1 gate passed; P2-T01..P2-T08 complete; QG-2 gate passed.
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs; 101 targeted tests cover all errors and all 14 invariants).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained)
Risks of touching current code: Low (Smart contracts and ABIs sealed and passed QG-2; moving to TypeScript engine core)
Phase checklist: P0 [x] P1 [x] P2 [x] P3 [ ] P4 [ ] P5 [ ] P6 [ ] P7 [ ] P8 [ ] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x] QG-2 [x]

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
