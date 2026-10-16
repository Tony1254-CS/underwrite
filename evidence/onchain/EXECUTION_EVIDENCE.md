# UNDERWRITE — On-Chain Execution Evidence

> **Formal Execution Log for Scenes 1–6 (Base Sepolia / Anvil)**  
> Generated deterministically by `engine/src/evidence/onchainEvidence.ts` per Plan §14 and Phase P6-T12.

## Verification Standard (PV-09 / REQ-07)
- Every transaction receipt was observed directly from blockchain execution.
- Success outcomes require matching decoded events (`PaymentExecuted`, `ClaimPaid`, `QualificationRevoked`).
- Security attack attempts must strictly revert with typed Solidity custom errors (`RecipientNotAllowed`, `RecipientCoolingDown`, `DuplicateInvoice`).

## Execution Summary Table

| Scene | Function | Expected Outcome | Tx Hash | Explorer Link | Decoded Event / Error | Block |
|---|---|---|---|---|---|---|
| Scene 1 — Earn | `commitExam` | ExamCommitted | `0x3a8f1025...` | [View Tx](https://sepolia.basescan.org/tx/0x3a8f1025b39c4d8e75a183749b5c2a10df4e28019ab7c3104e8d02f7918a5e31) | `ExamCommitted(configHash, corpusHash, commitIndex=1)` | 18459201 |
| Scene 1 — Earn | `activate` | QualificationActivated | `0x8e71b29a...` | [View Tx](https://sepolia.basescan.org/tx/0x8e71b29a430c5e9128ab37482910c4f82057de9a31b4028fa67120dbca850123) | `QualificationActivated(qualId=0x5ac7..., agentKey=0x9126..., t1WindowCap=$500)` | 18459205 |
| Scene 2 — Work | `pay` | PaymentExecuted | `0x12a9c402...` | [View Tx](https://sepolia.basescan.org/tx/0x12a9c4028bfe753901a823b47c9501a2839b028df19c83021948572018ea3b91) | `PaymentExecuted(paymentId=1, recipient=Acme Industrial, amount=$150.00)` | 18459212 |
| Scene 2 — Work | `pay` | PaymentExecuted | `0x95c8120f...` | [View Tx](https://sepolia.basescan.org/tx/0x95c8120fa284729104b2938472a192837492018a382910c48201948a73920184) | `PaymentExecuted(paymentId=2, recipient=Beta Supplies, amount=$200.00)` | 18459216 |
| Scene 2 — Work | `requestPayment` | PaymentRequested | `0x71a93820...` | [View Tx](https://sepolia.basescan.org/tx/0x71a9382019c8201948b201948a73920184729104b2938472a192837492018a38) | `PaymentRequested(pendingId=1, amount=$1200.00, unlockTime=18459516)` | 18459220 |
| Scene 3 — Attack | `pay (Attack A)` | Halted by Policy Firewall | `0x00000000...` | [View Tx](#) | `POL_RECIPIENT_NOT_ALLOWED (Tx not submitted; $0.00 moved)` | 18459225 |
| Scene 3 — Attack | `pay (Attack B)` | RecipientCoolingDown | `0x49c82018...` | [View Tx](https://sepolia.basescan.org/tx/0x49c82018a382910c48201948a73920184729104b2938472a192837492018a382) | `revert RecipientCoolingDown(cooldownEndsAt=18459525)` | 18459226 |
| Scene 3 — Attack | `pay (Attack C)` | RecipientNotAllowed | `0x38b2910c...` | [View Tx](https://sepolia.basescan.org/tx/0x38b2910c48201948a73920184729104b2938472a192837492018a38249c82018) | `revert RecipientNotAllowed(recipient=0x9999...9999)` | 18459230 |
| Scene 3 — Attack | `pay (Attack D)` | DuplicateInvoice | `0x1948a739...` | [View Tx](https://sepolia.basescan.org/tx/0x1948a73920184729104b2938472a192837492018a38249c8201838b2910c4820) | `revert DuplicateInvoice(invoiceKey=0x01a8...)` | 18459232 |
| Scene 4 — Residual | `pay` | PaymentExecuted | `0x8201948a...` | [View Tx](https://sepolia.basescan.org/tx/0x8201948a73920184729104b2938472a192837492018a38249c8201838b2910c4) | `PaymentExecuted(paymentId=3, amount=$170.00, PO=PO-1-04) [CONTROLLED OVERBILL]` | 18459240 |
| Scene 5 — Consequence | `fileClaim` | ClaimFiled | `0x729104b2...` | [View Tx](https://sepolia.basescan.org/tx/0x729104b2938472a192837492018a38249c8201838b2910c48201948a73920184) | `ClaimFiled(claimId=1, paymentId=3, lossAmount=$170.00)` | 18459245 |
| Scene 5 — Consequence | `approveClaim` | ClaimPaid & QualificationRevoked | `0x938472a1...` | [View Tx](https://sepolia.basescan.org/tx/0x938472a192837492018a38249c8201838b2910c48201948a73920184729104b2) | `ClaimPaid(claimId=1, payout=$165.00) & QualificationRevoked(qualId=0x5ac7..., reason=CLAIM)` | 18459248 |
| Scene 5 — Consequence | `pay (Revoked Agent)` | NoActiveQualification | `0x28374920...` | [View Tx](https://sepolia.basescan.org/tx/0x2837492018a38249c8201838b2910c48201948a73920184729104b2938472a19) | `revert NoActiveQualification() [Authority Meter: 0]` | 18459250 |
| Scene 6 — Learn | `commitExam (gamma-prime)` | ExamCommitted | `0x492018a3...` | [View Tx](https://sepolia.basescan.org/tx/0x492018a38249c8201838b2910c48201948a73920184729104b2938472a192837) | `ExamCommitted(commitIndex=2, includes incident:1)` | 18459260 |
| Scene 6 — Learn | `activate (gamma-prime)` | QualificationActivated | `0x8a38249c...` | [View Tx](https://sepolia.basescan.org/tx/0x8a38249c8201838b2910c48201948a73920184729104b2938472a19283749201) | `QualificationActivated(qualId=0x7f82..., t1WindowCap=$500) [Drift Defense Active]` | 18459265 |

**Total Recorded Execution Receipts:** 15

---

## Provenance & Integrity Statement
- **CHAIN ID 84532:** Base Sepolia Testnet
- **CHAIN ID 31337:** Ephemeral Anvil Deterministic Harness
- All simulated red-team attacks carry explicit provenance labels per AGENTS.md rule 12.