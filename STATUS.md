Progress source of truth: PHASES.md

## Handoff — 2026-10-16 16:55 UTC, antigravity
Last verified working state: Phase P5 100% complete (Gate QG-5 PASSED); Phase P8-T01 & P8-T02 complete (Next.js 15.5.28 App Router + Tailwind scaffolded, Viem server data layer & 4 API routes `/api/state`, `/api/exams`, `/api/traces`, `/api/claims` active and returning live JSON, 0 CDN URLs); Phase P7 pre-registration complete (P7-T01 docs/EXPERIMENT.md, P7-T02 docs/GENERATOR_B_BRIEF.md, DEC-023 fallback).
Active phase: P8 Web UI (Track C) & P7 Calibration Experiment (Track B)
Next concrete task: P8-T03 (Dashboard & Authority Meter), P8-T04 (Exam / Policy Card page), P7-T04 (Experiment runner)
Tests run this session: `pnpm -r test` → 151 tests passed across 23 test files (0 failures); `pnpm -r typecheck` → 0 errors; `forge test` → 101 tests passed across 17 test suites (256 invariant runs, 25,600 calls, 0 reverts); `pnpm uw verify` on Anvil → PASS on genuine artifact, FAIL on 1-byte tampered report; `pnpm --filter web build` → Next.js 15 production build succeeded (10/10 routes active, 0 type errors); `git grep -in "https://" -- web/src` → clean (0 matches).
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained), DEC-022 (P5-T05 fallback: II-HOLDOUT-2 self-authored), DEC-023 (P7-T03 fallback: Generator B self-authored)
Risks of touching current code: Low (contracts/ and engine/src/exam/ compiler/ sealed with full regression suite)
Phase checklist: P0 [x] P1 [x] P2 [x] P3 [x] P4 [x] P5 [x] P6 [ ] P7 [ ] P8 [ ] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x] QG-2 [x] QG-3 [x] QG-4 [x] QG-5 [x]

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
