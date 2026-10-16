Progress source of truth: PHASES.md

## Handoff — 2026-10-16 15:52 UTC, Tony1254-CS
Last verified working state: Phase P3 complete & Gate QG-3 passed (ChainReader, AgentSigner, TransactionExecutor, EvidenceStore, CLI uw run with policy/bypass modes, basic & attack fixtures, local Anvil deployment & qualify helper verified; 109 vitest tests passing across 14 suites, 101 foundry tests passing across 17 suites)
Active phase: P4 — Agents and tools (Track B)
Next concrete task: P4-T02 | B | needs: P3-T06,P3-T01 | Tool layer (propose_payment, read_document, lookup_vendor)
Tests run this session: `& "C:\Program Files\Git\bin\bash.exe" scripts/dev.sh` → Anvil started, MockUSDC, BondPool, UnderwriteVault deployed, cooldown warped, qualification activated; `pnpm -C engine uw run --agent scripted --inbox fixtures/basic --chain anvil` → 5/5 processed (3 T1, 1 T2, 1 REJECT); `pnpm -C engine uw run --agent scripted --inbox fixtures/attack --chain anvil` → 3/3 processed (1 REJECT, 2 policy guarded); `$env:ALLOW_REDTEAM_BYPASS="true"; pnpm -C engine uw run --agent scripted --inbox fixtures/attack --chain anvil --bypass-policy` → 3/3 reverted with on-chain errors (RecipientNotAllowed, RecipientCoolingDown, DuplicateInvoice); `pnpm -r test` → 109 unit tests passed across 14 test files; `pnpm -r typecheck` → 0 errors; `forge test` → 101 tests passed across 17 test suites (INV-1..14 verified, stateful invariant fuzz 25,600 calls / 0 reverts).
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs; 101 targeted tests cover all errors and all 14 invariants).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained)
Risks of touching current code: Low (Engine core verified against live Anvil nodes)
Phase checklist: P0 [x] P1 [x] P2 [x] P3 [x] P4 [ ] P5 [ ] P6 [ ] P7 [ ] P8 [ ] P9 [ ] P10 [ ] QG-0 [x] QG-1 [x] QG-2 [x] QG-3 [x]

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
