# UNDERWRITE — Product Film Truth Ledger

| Claim | Classification | Canonical source | Required wording boundary |
|---|---|---|---|
| Scripted-naive $0, basic $40, hardened $180 | Scripted product values | `web/src/app/(app)/exam/page.tsx` | Always display `SCRIPTED DEMO VALUES`. |
| Local $35 T1, $250 T2 and hostile/replay examples | Controlled local runtime | `web/src/app/(app)/portals/vendor/page.tsx` | Never describe these UI hashes as public-chain transactions. |
| Application-bypass reverts | Simulated local EVM | `web/src/app/(app)/attack-lab/page.tsx` | Say zero funds moved **in this scenario**, not globally. |
| Supplier 300-second cooldown | Implemented policy/contract behavior | `contracts/src/UnderwriteVault.sol`; owner portal | Do not imply it prevents every BEC attack. |
| Claim payout plus revocation | Implemented atomic contract behavior | `BondPool.sol`; claims tests | Recovery is subject to deductible, caps and bond remaining. |
| Four linked transactions | Real controlled Base Sepolia | `evidence/onchain/EXECUTION_EVIDENCE.md` | Public testnet, controlled MockUSDC, Tier 2. |
| Final execution | Real controlled Base Sepolia | receipt `real-04-payment-executed.json` | Must show receipt success **and** decoded matching `PaymentExecuted`. |
| Request ID 2 / payment ID 1 | Real controlled Base Sepolia | execution evidence continuity section | Explain that they are separate namespaces. |
| 2,970 evaluations | Controlled, self-authored, non-independent | `docs/EXPERIMENT.md` | Do not generalize to real-world fraud frequency. |
| Gamma R2 $170 loss, $165 payout, $5 net | Controlled experiment | experiment summary | Use MockUSDC; do not call it customer loss. |
| 101 contract tests | Locally rerun | `forge test` from `contracts/` | Current observed count only. |
| 159 engine tests | Locally rerun | `pnpm -r test` | Web package command is a smoke placeholder; state engine count. |
| 25,600 invariant calls | Locally rerun | Foundry invariant output | State zero handler reverts only when paired with this run. |

## Prohibited claims

- first, only, unique or industry-leading architecture
- production-ready, audited or formally verified
- mainnet or customer payment
- real Tier One public-chain execution
- guaranteed complete recovery
- independent benchmark or independent red team

