Progress source of truth: PHASES.md

## Handoff — 2026-10-16 14:18 UTC, antigravity-reviewer-1
Last verified working state: P1-T15 complete (Independent review of UnderwriteVault approved for QG-1)
Active phase: P1 — UnderwriteVault + MockUSDC (Track A)
Next concrete task: QG-1 | A | needs: P1-T14, P1-T15 | GATE P1: vault is safe to build on
Tests run this session: `forge test --root contracts` → 78 passed across 12 suites (including 4 stateful invariants, 256 runs, 25,600 calls); `bash scripts/check_errors.sh` → all 24 custom errors verified; `bash scripts/check_inv.sh` → 0 missing invariants (INV-1..10, 12..14 covered).
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs; 78 targeted tests cover all errors and invariants).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL)
Risks of touching current code: Low (P1-T15 review complete, proceeding to QG-1 quality gate)
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
