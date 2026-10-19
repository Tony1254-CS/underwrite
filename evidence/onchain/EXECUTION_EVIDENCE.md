# UNDERWRITE — real on-chain execution evidence

**Network:** Base Sepolia public testnet
**Chain ID:** `84532`
**Evidence class:** controlled demonstration with real public-chain settlement
**Judge-ready PDF:** `docs/ONCHAIN_EVIDENCE.pdf`
**Machine-readable manifest:** `EVIDENCE_MANIFEST.json`

## Verification rule

UNDERWRITE records a payment as executed only when:

1. the transaction receipt status is successful; and
2. the receipt contains a matching decoded `PaymentExecuted` event.

The four transactions below satisfy the applicable receipt/event condition for their action. Local Anvil output, simulated UI state, and scripted experiment results are not presented as public-chain proof.

## Deployed contracts

| Component | Address | Creation transaction | Source status |
|---|---|---|---|
| MockUSDC | `0x2e71d44170F788E892b4283c0a179bae8B8936F3` | `0x2289b55f808e430a6449359ab0bc1cb0c9f3340342bdd56abf9e239885beb7f6` | explorer verified |
| BondPool | `0xB97Be73323731209e183Bc02a0F5d23e36Cc5902` | `0x645ab04975f1ea23ef66ac784b1e8d83f8efd29ed9b71c105f0a99041213f320` | explorer verified |
| UnderwriteVault | `0x8a1B3BCA25B47A0f375a649b12494a1E011eD1B0` | `0xf138bed8bc5cbc3c95e9bbbe2cbf908ed6aec814f9a0fa67e618e34c94433094` | Sourcify exact match |

## Linked transaction path

| # | UTC time | Action | Block | Transaction | Decoded evidence |
|---:|---|---|---:|---|---|
| 1 | 2026-10-19 08:40:00 | Commit exam | 48,315,456 | [`0x3fd70ecf…b7f58f`](https://sepolia.basescan.org/tx/0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f) | `ExamCommitted`, `commitId=5` |
| 2 | 2026-10-19 08:40:02 | Activate qualification | 48,315,457 | [`0x9e3bef85…ef9d8c`](https://sepolia.basescan.org/tx/0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c) | `QualificationActivated`, T1 max `0`, T2 max `2,000,000,000` base units |
| 3 | 2026-10-19 08:40:04 | Request payment | 48,315,458 | [`0x20a245ff…594f6`](https://sepolia.basescan.org/tx/0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6) | `PaymentRequested(id=2)`, amount `35,000,000` base units |
| 4 | 2026-10-19 08:45:10 | Execute pending | 48,315,611 | [`0xf19d5e20…ad712`](https://sepolia.basescan.org/tx/0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712) | input `executePending(2)`; `PaymentExecuted(paymentId=1, tier=2)` |

## Identity and amount continuity

- Qualification: `0x303f1ad2e95898e7d07cad084339da1d84a6455c19e7d5db86b679680e1bb4a2`
- Controlled registered recipient: `0x1111111111111111111111111111111111111111`
- Amount: `35,000,000` base units = 35 MockUSDC at six decimals
- Invoice key: `0x6c2c9798300b5eac3dda3c6769589743dd77c5ff772200fc1abd410947bb799d`
- Tier: `2`

`PaymentRequested.id = 2` identifies the pending request. `PaymentExecuted.paymentId = 1` is the settlement sequence. They are separate counters by design. The execution calldata explicitly targets pending ID 2, and the request/execution recipient, amount and invoice identity match.

## Receipt integrity

| Stored receipt | SHA-256 |
|---|---|
| `receipts/real-01-exam-committed.json` | `4c4f9889339a0149ccbdcdcfd01f4e887991d5c5e53f266b96c3a24ea98263dc` |
| `receipts/real-02-qualification-activated.json` | `6366405ef548afb2c1d25cff034ccb7c0ec4fc5d3db8f50ef4ab771a4cd7e535` |
| `receipts/real-03-payment-requested.json` | `a3471ae8c2a766bb1bb3e1c2cb0174c8e96e019fb83f43b603aab9d171b7224d` |
| `receipts/real-04-payment-executed.json` | `b2a0533d318a2d174884511de5e2970f25516a3dfa98a9ff6bf41f9a7eb4acc0` |

## Boundary statement

This is genuine public-chain testnet evidence using a controlled token and controlled addresses. It is not a mainnet transaction, customer activity, proof of production readiness, or proof of Tier-1 autonomous execution. The public-chain payment path is Tier 2.
