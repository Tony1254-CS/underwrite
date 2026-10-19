Progress source of truth: PHASES.md

## Handoff, 2026-10-19, Codex: professional competition submission package
State: rebuilt the competition-facing documentation around verified evidence and the official Appendix 2 rubric. Canonical deliverables are `docs/deck/UNDERWRITE_PITCH_DECK.pdf` (13 slides plus editable PPTX), `docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf` (15 pages), `docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf` (12 pages), and `docs/ONCHAIN_EVIDENCE.pdf` (8 pages). The submission master, official-rules brief, claim ledger, speaker notes, light-only demo/recording guides, machine-readable transaction manifest, artifact hashes, build script, and automated submission QA are complete.

Evidence discipline: every public-chain statement uses the real four-transaction Base Sepolia Tier-2 path. Payment execution is asserted only with receipt success plus the decoded `PaymentExecuted` event. The experiment is labeled controlled, non-independent, and self-authored under DEC-023. No Tier-1 public-chain, mainnet, audit, production, customer-loss, or uniqueness claim is made.

Visual standard: all six embedded product captures are light mode under `docs/professional/assets/screens-light/`; the legacy dark capture directory was removed. Deck screenshots carry scripted/simulated labels. QR images and PDF/PPTX hyperlinks resolve to the public execution evidence.

Verification: baseline `forge test` = 101/101 passed across 17 suites (256 invariant runs / 25,600 calls / 0 handler reverts); engine tests = 159/159 across 26 files; engine typecheck passed. `scripts/build-competition-package.ps1` completed. `python scripts/qa_submission.py` passed page-count, nonblank-page, editable-slide, light-capture, artifact-digest, receipt-digest, and receipt/event checks.

Packaging: `submission/` contains numbered, ready-to-send public attachments, a source/link sheet, email draft and SHA-256 list. The official blank registration workbook was copied to the gitignored `submission/private/` area; passports and enrollment documents must also remain private and must never be committed.

Open human items: complete the registration workbook; replace bracketed team identity/contact/repository/video fields in `submission/07_SOURCE_AND_LINKS.md` and the email draft; record the optional ≤5-minute video; verify public links logged out; attach registration/identity/enrollment documents; rehearse below 10 minutes; submit by 20 Oct 2026 21:59 Bangladesh time. The three legacy PDF names remain locked by an open viewer and could not be overwritten without killing the user’s browser. The canonical named files above are final; after closing those old PDF tabs run `powershell -ExecutionPolicy Bypass -File scripts/sync-legacy-doc-names.ps1` if legacy filenames are desired.

---

## Handoff, 2026-10-19, Codex: real Base Sepolia deployment and Topic F evidence
State: MockUSDC, BondPool, and UnderwriteVault are deployed on Base Sepolia from locally generated throwaway keys. Deployment receipts/bytecode were RPC-verified. MockUSDC and BondPool source are verified on Blockscout; UnderwriteVault is an exact-match Sourcify verification (Blockscout submission is temporarily rate-limited). Six recipients are active, the vault/bond are funded with controlled MockUSDC, and an honest gamma T2 qualification produced one controlled 35 USDC `PaymentExecuted` event.

Canonical evidence: `evidence/onchain/EXECUTION_EVIDENCE.md` contains exactly four real rows: ExamCommitted, QualificationActivated, PaymentRequested, PaymentExecuted. Final payment tx: `0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712`. Fifteen prior fabricated receipt fixtures were removed. No real money was used; MockUSDC and all activity are CONTROLLED Base Sepolia testnet evidence.

Tests run this session: `forge test` 101/101 passed; targeted `forge fmt --check script/Deploy.s.sol` passed; engine TypeScript check passed; engine tests 159/159 passed before the final evidence broadcast. Final regression rerun is recorded in TESTING.md.

Open items: P6-T03 remains partial until UnderwriteVault also appears verified on Blockscout (Sourcify exact match already passes). P6-T05 is partial because the old `uw verify <report-directory-qualId>` command does not map the new testnet commit-derived qualId; do not claim a verify PASS. P6-T06 still lacks the full specified 3 T1 + 1 T2 + 1 flag sequence; the honest gamma report grants zero T1, so only the T2 path was executed. P6-T07–T11 remain open. Do not fabricate T1 authority or hashes to close them.

Public testnet accounts: DEPLOYER `0x2Fb0E0568c5AD0BD5C84dAE0b5b58a441B1CAec2`; OWNER `0x04Be79C38792ccC922bA9CC757D61B1801e9e373`; EXAMINER `0xe25de67dEc39AB5D7f894D963FF73B48e664F6DB`; UNDERWRITER `0x2F43D120dE22A21ee73d7Be073237B263461eEBa`; ADJUDICATOR `0x14966B9bCe2f636aB1d8ef19656Bed914829ddf5`; GUARDIAN `0x3aB902c1710B9B59c8eb9D0ca4593207E65fF425`; AGENT `0x0Fb2a52212Dc88CE6c29f1Ee91042ACB3eaE0B16`.

---

## Handoff, 2026-10-17, Claude (Sonnet 5.5): workspace redesign (UI track, follows the landing page below)
Branch: `feat/ui-landing-redesign`. NOTHING from this step is committed or pushed.
State: all 16 workspace routes plus the shared shell are redesigned in the landing page's identity (DEC-033, PROVISIONAL, awaiting owner approval). Page logic is unchanged apart from the items listed in DEC-033 (claims filter fix, experiment page now reads the recorded summary, traces "Not recorded", two confirm dialogs, two link targets). API routes, `lib/`, `context/`, `engine/`, `contracts/` untouched. `web/src/app/globals.css` deleted (unreferenced).
Tests run this session: isolated `next build` (20/20, types valid), `tsc --noEmit` (no errors in src), `pnpm -r test` (engine 157 of 157), axe-core (0 violations, 16 routes x light/dark x 1440/390/320), 47 behaviour checks (all pass), per-file parity audit against HEAD, reduced-motion check. Details and gaps: TESTING.md section 6.
Tests NOT run: `forge test`, `forge coverage`, Playwright, screen readers, Safari / Firefox, a real phone. The test scripts live in session scratch space, not in the repo.
Open items for a human: (1) approve or reject DEC-033 by using the app (the experiment page numbers changed to the recorded ones; check you are happy with that); (2) approve DEC-032 if not done; (3) the earlier P6-T02 Base Sepolia receipt finding.
Risks of touching current code: pages now use the UI kit (`web/src/components/ui`) and `app.css`; do not add Tailwind class strings or glass styles to them.

---

## Handoff, 2026-10-17, Claude (Sonnet 5.5): landing page redesign (UI track, separate from PHASES.md tasks)
Branch: `feat/ui-landing-redesign` (created from `main`; NOTHING committed, nothing pushed, `main` untouched).
State: the landing page `/` is redesigned and verified (see TESTING.md section 5). All 16 other pages and 8 API routes are verified unchanged (24 of 24 identical to the pre-change production build). DEC-032 is PROVISIONAL: the owner has not yet approved the look. The rest of the UI redesign (`ui-redesign.md`) is NOT started and must not start until the owner approves this landing page.
Tests run this session: `pnpm -r test` (engine 157 of 157 passed), isolated `next build` (clean, 20/20), axe-core (0 violations), 32 behaviour checks, 18 truth checks. Tests NOT run: `forge test`, `forge coverage`, Playwright, screen readers, Safari / Firefox, real phone.
Open items for a human: (1) approve or reject DEC-032 by looking at the page; (2) the earlier finding that two Base Sepolia hashes in `evidence/onchain/receipts` return null from the public RPC while P6-T02 is still open; the landing page now says the testnet broadcast "has not been run yet"; (3) the verification scripts should be committed under `web/tests/` so the result is reproducible; (4) the landing page and the workspace look different until the redesign continues (deliberate seam).
Uncommitted working-tree changes that pre-date this session (evidence summaries, `contracts/deployments/31337.json`) were left exactly as found.

---

## Previous handoff
## Handoff — 2026-10-17 04:12 UTC, antigravity
Last verified working state: 110 / 126 tasks completed (88%); Target Owner Whitelisting & Owner's Inbound System Agent Audit Architecture completed (DEC-031); Vendor portal explicitly targets Sarah Chen / Acme Corp Treasury Vault (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`); Dynamic allowlist status pill with cooldown calculation; 4-step execution lifecycle diagram added; Owner Portal updated with live Inbound Agent Audit Ledger showing all incoming invoices, Owner agent decisions (T0-T3), and real-time vendor allowlist toggle buttons (`Revoke ✕` / `Reactivate ✓`) with instant on-chain rejection (`INV-1: RecipientNotAllowed / RecipientInactive`); Next.js 15 production build clean (20/20 routes, 0 type errors); 157 unit/integration tests passed across 25 test files; Production server active on http://localhost:3000.
Active phase: P6 Testnet Deployment (Track A+B) & P9 Final Polish (Track C)
Next concrete task: P6-T02 (on-chain broadcast on Base Sepolia once deployer funded with testnet ETH), P9-T07 (human demo video recording), P9-T08 (code freeze checkpoint)
Tests run this session: `pnpm --filter web build` → Next.js 15 production build clean (20/20 routes, 0 type errors); `pnpm -r test` → 157 tests passed across 25 test files (0 failures); `Invoke-RestMethod` end-to-end tests: T1 auto-execution ($35 USDC → PaymentExecuted txHash returned), T3 unwhitelisted rejection (`INV-1: RecipientNotAllowed`), T2 escalation ($250 USDC → queued in Owner challenge window), Owner approval of T2 payment ($250 USDC approved), and vendor allowlist toggle (PATCH `/api/vendors` revoking CloudCorp → instant rejection with `RecipientInactive()`, reactivating → active).
Tests NOT run: `forge coverage` (solc 0.8.28 non-via-ir stack-too-deep on EIP-712 structs).
Known failures: None
Outstanding decisions: DEC-018 (PROVISIONAL), DEC-019 (PROVISIONAL), DEC-020 (BondPool custom errors & events), DEC-021 (Cut-line not triggered; real BondPool retained), DEC-022 (P5-T05 fallback: II-HOLDOUT-2 self-authored), DEC-023 (P7-T03 fallback: Generator B self-authored), DEC-024 (P7-T10 reduced experiment not triggered), DEC-025 (Apple-grade visionOS Acrylic UI overhaul), DEC-026 (Dynamic Web3 Auth & Interactive Studio), DEC-027 (Dedicated Role Portals Architecture), DEC-028 (Enterprise Authentication & Hover Sidebar), DEC-029 (Commercial Startup Landing & Compact Navbar), DEC-030 (Dedicated Vendor & Supplier Invoicing Portal with 5-Stage AP Pipeline), DEC-031 (Target Owner Whitelisting & Owner's Inbound System Agent Audit Architecture)
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
