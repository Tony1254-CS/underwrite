Progress source of truth: PHASES.md

## Handoff — 2026-10-16 16:22 UTC, antigravity-2
Last verified working state: P8-T09 complete (Next.js 14 Web UI fully functional: interactive Authority Meter, Policy Card compiler, Run Trace visualizer, Attack Lab with Four Facts assessment, Claims adjudication, and Tamper Verification passing build and typecheck on branch p8-web-ui)
Active phase: P8 — Web UI (Track C · branch p8-web-ui)
Next concrete task: P8-T10 | C | needs: QG-4,P8-T06,P8-T07,P6-T10 | scripts/demo-local.sh bring-up
Tests run this session: `pnpm -r test` → 89/89 engine tests pass, web test pass (exit 0); `pnpm --filter web build` → 6 static pages, 5 dynamic API endpoints (`/api/state`, `/api/exams`, `/api/runs`, `/api/claims`, `/api/receipts`), 0 external asset URLs; `pnpm --filter web typecheck` (`tsc --noEmit`) → exit 0; `forge test --root contracts` → 101/101 tests passed across 17 suites (including stateful invariants 256 runs, 25,600 calls, 0 reverts); `bash scripts/progress.sh` → 50/124 done (40% total, P8 69% complete, 0 WIP stale claims, 0 blockers).
Tests NOT run: Playwright e2e (P8-T11 adds end-to-end suite; build and typecheck verified).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained)
Risks of touching current code: Zero to Track B (Web UI lives entirely inside web/ package and on isolated branch p8-web-ui).
Phase checklist: P0 [x] P1 [x] P2 [x] P3 [ ] P4 [ ] P5 [ ] P6 [ ] P7 [ ] P8 [~] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x] QG-2 [x]

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
