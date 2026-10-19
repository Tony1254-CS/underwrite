# UNDERWRITE — On-Chain Execution Evidence

> **RPC-verified execution log (Base Sepolia / explicitly labeled local Anvil)**  
> Generated from stored receipt records by `engine/src/evidence/onchainEvidence.ts`.

## Verification Standard
- Every Base Sepolia row has a non-zero transaction hash resolved through RPC.
- Successful actions require a matching decoded contract event.
- Simulated or local-only actions are explicitly labeled and are not represented as public-chain evidence.

## Execution Summary Table

| Scene | Function | Expected Outcome | Tx Hash | Explorer Link | Decoded Event / Error | Block |
|---|---|---|---|---|---|---|
| Scene 1 — Earn | `commitExam` | ExamCommitted | `0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f` | [View Tx](https://sepolia.basescan.org/tx/0x3fd70ecf8a582df153abf99eaf900c2dad569cb3c813617329155640b6b7f58f) | `ExamCommitted(configHash=0x07711e2d0f1c8fdfcb6db33d55fd19b2acc75fa4ffe36b17654c4a1d64f5342e, corpusHash=0xa0637ec69a9a1bb90cb641188b268c47a8135d6882d2fdee42a2c96320646512, commitId=5)` | 48315456 |
| Scene 1 — Earn | `activateQualification` | QualificationActivated | `0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c` | [View Tx](https://sepolia.basescan.org/tx/0x9e3bef8566dd60885a2b63c39a2c96f8d05879a101bf24ef3963267b1eef9d8c) | `QualificationActivated(qualId=0x303f1ad2e95898e7d07cad084339da1d84a6455c19e7d5db86b679680e1bb4a2, agentKey=0x0Fb2a52212Dc88CE6c29f1Ee91042ACB3eaE0B16, t1=0, t2MaxPerTx=2000000000)` | 48315457 |
| Scene 2 — Work | `requestPayment` | PaymentRequested | `0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6` | [View Tx](https://sepolia.basescan.org/tx/0x20a245ff8141a3be094dce092db2da67583f529b1eae713b0898bb0a1b3594f6) | `PaymentRequested(id=2, recipient=0x1111111111111111111111111111111111111111, amount=35000000, readyAt=1792399504)` | 48315458 |
| Scene 2 — Work | `executePending` | PaymentExecuted | `0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712` | [View Tx](https://sepolia.basescan.org/tx/0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712) | `PaymentExecuted(paymentId=1, recipient=0x1111111111111111111111111111111111111111, amount=35000000, invoiceKey=0x6c2c9798300b5eac3dda3c6769589743dd77c5ff772200fc1abd410947bb799d, tier=2)` | 48315611 |

**Total Recorded Execution Receipts:** 4

## Provenance & Integrity Statement
- **CHAIN ID 84532:** Base Sepolia Testnet.
- **CHAIN ID 31337:** Ephemeral Anvil harness, only when explicitly labeled.
- Receipt status and decoded events are checked before a Base Sepolia record is written.
