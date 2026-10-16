Progress source of truth: PHASES.md

## Handoff — 2026-10-17 02:05 UTC, antigravity
Last verified working state: 108 / 126 tasks completed (86%); Dedicated Role Portals Architecture completed (DEC-027); Web3 Auth & Role Impersonator (`AuthContext.tsx`, `Header.tsx`) operational with 1-click persona switching (Owner, Examiner, Underwriter, Adjudicator, Agent); Dedicated portals operational at `/portals/owner`, `/portals/examiner`, `/portals/underwriter`, `/portals/adjudicator`; Inbound Invoice Studio operational at `/submit`; Synthetic mock sandbox buttons completely removed; Protocol HUD (`/`) streamlined as real-time institutional status center; Next.js 15 production server actively serving all 16 static/dynamic routes on http://localhost:3000; 157 unit/integration tests passed across 25 test files.
Active phase: P6 Testnet Deployment (Track A+B) & P9 Final Polish (Track C)
Next concrete task: P6-T02 (on-chain broadcast on Base Sepolia once deployer funded with testnet ETH), P9-T07 (human demo video recording), P9-T08 (code freeze checkpoint)
Tests run this session: `pnpm --filter web typecheck` → 0 errors; `pnpm --filter web build` → Next.js 15 production build clean (16/16 routes, 0 type errors); `pnpm -r test` → 157 tests passed across 25 test files (0 failures); `curl.exe` → HTTP 200 on all portals (`/`, `/portals/owner`, `/portals/examiner`, `/portals/underwriter`, `/portals/adjudicator`, `/submit`).
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained), DEC-022 (P5-T05 fallback: II-HOLDOUT-2 self-authored), DEC-023 (P7-T03 fallback: Generator B self-authored), DEC-024 (P7-T10 reduced experiment not triggered), DEC-025 (Apple-grade visionOS Acrylic UI overhaul), DEC-026 (Dynamic Web3 Auth & Interactive Studio), DEC-027 (Dedicated Role Portals Architecture)
Risks of touching current code: Low (contracts/, engine/, and web/ regression suites 100% green; zero conflicts with parallel agent track)
Phase checklist: P0 [x] P1 [x] P2 [x] P3 [x] P4 [x] P5 [x] P6 [ ] P7 [x] P8 [x] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x] QG-2 [x] QG-3 [x] QG-4 [x] QG-5 [x] QG-7 [x] QG-8 [x]

### Experiment Prerequisites Verification (P7-T06)
- **Fact 1 (Protocol Pre-Registration):** `docs/EXPERIMENT.md` committed at `93dfb1a` (2026-10-16 22:51:29 +0600) prior to experimental runs.
- **Fact 2 (Cryptographic Hashes Pre-Committed):** `experiments/hashes.json` committed at `3a6f74c` (2026-10-16 23:02:23 +0600) prior to experimental runs.
- **Fact 3 (Exam Reports Generated):**
  - $\alpha$ (`scripted-naive`): `evidence/exams/0x5ac77c6e577ff5919c6ad00b2dc4d2850350ca93f64fb654c12aa844c2573d0f/report.json` (reportHash: `0x02d317b2510c13bf46383792072df8355dc36fdf7659dd0b5890833129bed083`)
  - $\beta$ (`llm:beta`): `evidence/exams/0x7f7169237f331349adb91af646a622c0dcbb0bc07dd96ff992f0b820cbf9fdac/report.json` (reportHash: `0xa20c4d216d00a7039a2ed3e4f2586b37a62c8977bb70f3f53289756b74626842`)
  - $\gamma$ (`llm:gamma`): `evidence/exams/0x08b492e5c4d130ac5d3f9db120fe5be8f5adc131cbd57e230c1915ae407979c0/report.json` (reportHash: `0xbaab4f10837d40a0b83d894bb8cee2505c14b64507ccaa67d67a8eb6a8b4452a`)

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
