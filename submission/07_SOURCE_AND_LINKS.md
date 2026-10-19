# UNDERWRITE — source and access links

Replace all bracketed values before sending.

| Item | Link |
|---|---|
| Public GitHub repository | `[PUBLIC GITHUB URL]` |
| Public product demo | `[PUBLIC WEB URL OR “Not provided — run locally from README”]` |
| Optional ≤5-minute demo video | `[PUBLIC VIDEO URL OR “Not submitted”]` |
| Team contact | `[TEAM LEADER NAME · EMAIL · PHONE]` |

## Public-chain proof

- Network: Base Sepolia, chain ID `84532`
- Vault: `0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0`
- Exam committed: `0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f`
- Qualification activated: `0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c`
- Payment requested: `0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6`
- Payment executed: `0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712`

The execution is a controlled Tier-2 public-testnet transaction using MockUSDC. It is not mainnet or customer activity.

## Judge verification commands

```bash
cd contracts && forge test
cd ..
pnpm --filter engine test
pnpm --filter engine typecheck
python scripts/qa_submission.py
```

Observed on 19 October 2026: 101 contract tests passed, 159 engine tests passed, 25,600 stateful invariant calls completed with zero handler reverts, and submission QA passed.
