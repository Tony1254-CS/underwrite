# UNDERWRITE competition claim ledger

**Purpose.** This is the editorial control surface for every competition-facing claim. A statement may appear in the deck, technical dossier, security assessment, video, or submission form only when it is listed here with an evidence class and a reproducible source.

**Evidence classes**

- **Observed:** directly produced by a command run against this repository or a public-chain receipt.
- **Derived:** calculated deterministically from stored artifacts.
- **Design:** implemented behavior established by code and tests.
- **Limitation:** an explicit boundary on what is being claimed.

| ID | Competition-facing claim | Class | Evidence | Approved wording |
|---|---|---|---|---|
| CL-01 | The contracts pass 101 tests in 17 suites. | Observed | `cd contracts && forge test` on 2026-10-19 | “101 contract tests passed; 0 failed.” |
| CL-02 | Stateful invariant testing completed 256 runs and 25,600 calls with zero handler reverts. | Observed | `forge test` output on 2026-10-19 | Use exact counts; do not call this a formal proof. |
| CL-03 | The engine passes 159 tests in 26 files. | Observed | `pnpm --filter engine test` on 2026-10-19 | “159 engine tests passed; 0 failed.” |
| CL-04 | Engine TypeScript checking succeeds. | Observed | `pnpm --filter engine typecheck` on 2026-10-19 | “Engine typecheck passed.” |
| CL-05 | Four linked lifecycle transactions succeeded on Base Sepolia. | Observed | Receipts and decoded logs under `evidence/onchain/receipts/`; manifest in `evidence/onchain/EVIDENCE_MANIFEST.json` | “Real Base Sepolia testnet evidence.” Never say mainnet. |
| CL-06 | The payment execution transferred 35,000,000 token base units to the registered controlled recipient in Tier 2. | Observed | Request and execution receipts; execution calldata decodes to `executePending(2)`; matching `PaymentExecuted` log | “35 MockUSDC on Base Sepolia (6-decimal test token).” |
| CL-07 | The experiment contains 9 conditions and 2,970 controlled executions. | Derived | `evidence/experiments/main/protocol-summary.json` | Always append “controlled, non-independent, self-authored under DEC-023.” |
| CL-08 | R2 recorded zero Class-I violations in all three agent conditions. | Derived | Same protocol summary and deterministic rescore artifacts | Restrict the conclusion to this controlled corpus. |
| CL-09 | Gamma R2 recorded a 170 MockUSDC Class-II loss, 165 reimbursement, and 5 net loss. | Derived | Same protocol summary | Call values synthetic MockUSDC accounting, not customer or production losses. |
| CL-10 | UNDERWRITE couples evaluation evidence to on-chain spending authority and bond capacity. | Design | Compiler, attestation, Vault and BondPool implementation plus tests | “Implemented prototype”; do not claim uniqueness or production readiness. |
| CL-11 | Screenshots show a working local product. | Observed | Light-mode captures under `docs/professional/assets/screens-light/` | Caption “light UI · scripted/controlled demonstration” where relevant. |

## Claims deliberately excluded

- “The only secure autonomous wallet” or any unqualified market-superiority claim.
- “Audited,” “production-ready,” “formally verified,” or “provably secure.”
- “Independent evaluation,” because Generator B and the blind set are self-authored under the declared fallback.
- Any live-customer, mainnet, revenue, adoption, or real-loss claim.
- Any Tier-1 public-chain execution claim. The public-chain payment proof is Tier 2; the activated qualification has `t1MaxPerTx = 0`.
- Any execution claim without both a successful receipt and the matching decoded `PaymentExecuted` event.

## Editorial gate

Before export, search the submission package for `independent`, `mainnet`, `audited`, `production-ready`, `the only`, and unsupported currency symbols. Any occurrence must either be removed or explicitly framed as a limitation, non-claim, or test denomination.
