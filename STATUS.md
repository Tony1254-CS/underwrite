Progress source of truth: PHASES.md

## Handoff — 2026-10-16 17:15 UTC, antigravity
Last verified working state: Phase P4 & P5 100% complete (Gates QG-4 & QG-5 PASSED); Phase P7 complete through P7-T05 (pre-registration in docs/EXPERIMENT.md, Generator B brief, pre-committed hashes in experiments/hashes.json, R0/R1/R2 experiment runner, deterministic rescore mode); Phase P8 complete through P8-T09 (Next.js App Router + Tailwind, Authority Meter dashboard, Policy Card sensitivity compiler, Run Traces visualizer, Attack Lab with Four Facts assessment, Claims adjudication demo, Evidence & 1-byte Tamper Verification, Badges).
Active phase: P8 Web UI (P8-T10 demo script), P7 Calibration Experiment, P6 Deployment
Next concrete task: P8-T10 | C | needs: QG-4,P8-T06,P8-T07,P6-T10 | scripts/demo-local.sh bring-up
Tests run this session: `pnpm -r test` → 156 tests passed; `forge test --root contracts` → 101/101 tests passed across 17 suites; Next.js web build passes with 0 errors.
Tests NOT run: Live Base Sepolia execution (P6); full calibration run with real LLMs (P7-T06); Playwright e2e (P8-T11).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained), DEC-022 (P5-T05 fallback: II-HOLDOUT-2 self-authored), DEC-023 (P7-T03 fallback: Generator B self-authored)
Risks of touching current code: Low (contracts, engine, exam, compiler, experiment, and web UI synchronized).
Phase checklist: P0 [x] P1 [x] P2 [x] P3 [x] P4 [x] P5 [x] P6 [ ] P7 [~] P8 [~] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x] QG-2 [x] QG-3 [x] QG-4 [x] QG-5 [x]

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
