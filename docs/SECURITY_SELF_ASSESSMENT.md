# UNDERWRITE Security Self-Assessment & Threat Model

> **A Formal Threat Model, Invariant Verification Matrix, and Known Risk Catalog**  
> FinTechathon 2026 — Topic F Security Reference

---

## 1. Threat Model & Adversarial Capabilities

UNDERWRITE models accounts-payable automation as a multi-adversary environment with distinct attacker profiles:

| Adversary | Attacker Capability | System Barrier & Mitigation | Worst-Case Outcome By Design |
|---|---|---|---|
| **External Invoice Attacker** | Crafts malicious invoices, prompts, and spoofed bank details sent via email | • Deterministic Policy Firewall checks supplier registry and cooldowns.<br>• Non-whitelisted addresses are strictly rejected (`POL_RECIPIENT_NOT_ALLOWED`). | Zero funds transferred. Proposal diverted to human T2 review or rejected. |
| **Compromised Registered Supplier** | Compromised legitimate vendor issues overbilling or duplicate invoices | • On-chain invoice key tracking prevents duplicate payment (`INV-5`).<br>• Three-way PO matching catches quantity discrepancies.<br>• Sized $T_1$ caps limit exposure; BondPool covers remaining loss. | Limited to within-envelope loss $\le T_1^{\text{maxPerTx}}$, fully backed by underwriter bond. |
| **Fully Compromised Agent Key** | Attacker extracts agent signing key or executes arbitrary malicious calldata | • Vault entry point restriction: agent key can ONLY call `pay` and `requestPayment`.<br>• Cannot pay unapproved recipients (`INV-1`, `INV-4`).<br>• Cannot exceed $T_1$ window caps (`INV-2`).<br>• Unreconciled exposure cannot exceed available bond (`INV-10`). | Compromised agent can ONLY pay registered vendors up to remaining bond, after which vault reverts. |
| **Compromised Examiner** | Examiner issues overly generous attestations or shops for lucky exam runs | • Examiner cannot activate qualifications; requires owner on-chain activation (`INV-9`).<br>• Pre-commitment: examiner must call `commitExam(configHash, corpusHash)` before exam.<br>• Attestation must reference the LATEST commit (`INV-13`).<br>• Examiner must post capital in BondPool backing the envelope. | Sized authority is capped by owner ceilings and requires real capital commitment. |
| **Malicious / Compromised Adjudicator** | Adjudicator approves false claims or colludes with vault owner | • Claim evidence hash recorded on-chain.<br>• Payout is strictly capped by approved loss, deductible, and remaining locked bond (`INV-11`).<br>• Payout transfers ONLY to the vault (never to an arbitrary external address). | Malicious approval transfers underwriter bond to owner vault (disclosed trust assumption). |
| **Owner Key Compromise** | Attacker gains access to vault owner private key | • Out of scope: owner possesses root authority over treasury vault. | Total loss of vault assets (standard self-custody risk). |

---

## 2. Invariant Verification Matrix (INV-1 through INV-14)

Every security invariant defined in `plan.md` §9.8 is enforced by smart contracts and verified by automated Foundry test suites (including stateful property-based invariant testing and fuzzing):

| Invariant | Formal Statement | Foundry Test Enforcement |
|---|---|---|
| **INV-1** | Agent keys can move tokens ONLY through `pay()` and `requestPayment()` $\to$ `executePending()`. No direct transfer, approval, or arbitrary execution tools exist. | • `contracts/test/invariant/Vault.Invariant.t.sol::invariant_INV1_agent_key_moves_tokens_only_through_allowed_paths`<br>• `contracts/test/Vault.Skeleton.t.sol::test_unauthorized_direct_calls` |
| **INV-2** | For every qualification and 24h window: $\sum T_1 \text{ payments} \le \text{effective } t1MaxPerWindow$. | • `contracts/test/invariant/Vault.Invariant.t.sol::invariant_INV2_window_cap_never_exceeded`<br>• `contracts/test/Vault.Fuzz.t.sol::testFuzz_window_cap_enforcement`<br>• `contracts/test/Vault.Pay.t.sol::test_pay_revert_exceeds_window` |
| **INV-3** | Every $T_1$ payment $\le \text{effective } t1MaxPerTx$; every $T_2$ request $\le t2MaxPerTx$. | • `contracts/test/Vault.Pay.t.sol::test_pay_revert_exceeds_t1_per_tx`<br>• `contracts/test/Vault.T2.t.sol::test_revert_request_exceeds_t2_per_tx` |
| **INV-4** | $T_1$ recipients must be active and past mandatory `activatesAt` cooldown (300s); $T_2$ recipients must be active. | • `contracts/test/Vault.Pay.t.sol::test_pay_revert_cooling_down`<br>• `contracts/test/Vault.Pay.t.sol::test_pay_revert_recipient_not_allowed`<br>• `contracts/test/Vault.T2.t.sol::test_revert_execute_after_deactivate_recipient` |
| **INV-5** | Each `invoiceKey` reaches status `PAID` at most once; status `RESERVED` blocks concurrent duplicate execution. | • `contracts/test/invariant/Vault.Invariant.t.sol::invariant_INV5_invoices_reach_paid_at_most_once`<br>• `contracts/test/Vault.Pay.t.sol::test_pay_revert_duplicate_invoice`<br>• `contracts/test/Vault.T2.t.sol::test_veto_by_owner_releases_invoiceKey` |
| **INV-6** | Vault token balance after any agent payment must remain $\ge reserveFloor$. | • `contracts/test/Vault.Pay.t.sol::test_pay_revert_reserve_floor_breached`<br>• `contracts/test/Vault.T2.t.sol::test_revert_execute_reserve_breached` |
| **INV-7** | Zero agent payments permitted while contract is paused, or with an expired, revoked, inactive, or missing qualification. | • `contracts/test/Vault.Pay.t.sol::test_pay_revert_paused`<br>• `contracts/test/Vault.Pay.t.sol::test_pay_revert_expired`<br>• `contracts/test/Vault.Pay.t.sol::test_pay_revert_revoked`<br>• `contracts/test/Vault.T2.t.sol::test_revert_paused` |
| **INV-8** | $T_2$ transactions execute only after `readyAt` delay, only if not vetoed by owner or guardian, with all permissions re-verified at execution time. | • `contracts/test/Vault.T2.t.sol::test_happy_path_t2_lifecycle`<br>• `contracts/test/Vault.T2.t.sol::test_veto_by_owner_releases_invoiceKey`<br>• `contracts/test/Vault.T2.t.sol::test_veto_by_guardian` |
| **INV-9** | Qualification activation requires valid examiner EIP-712 signature AND owner transaction; revocation executable by owner, examiner, BondPool, or expiry. | • `contracts/test/Vault.Qualification.t.sol::test_happy_path_activation`<br>• `contracts/test/Vault.Qualification.t.sol::test_revoke_by_owner`<br>• `contracts/test/Vault.Qualification.t.sol::test_revoke_by_examiner` |
| **INV-10** | For every qualification at all times: $\text{unreconciled } T_1 \text{ exposure} \le bondPool.remaining(qualId)$. Unreviewed payments are strictly collateralized. | • `contracts/test/invariant/Vault.Invariant.t.sol::invariant_INV10_exposure_bounded_by_bond_remaining`<br>• `contracts/test/integration/VaultBondPool.Integration.t.sol::test_exposure_tracking_and_bond_exhaustion` |
| **INV-11** | $\sum \text{payouts for a qual} \le \text{locked amount}$; at most one payout per `paymentId`; all payouts transfer strictly to the vault. | • `contracts/test/invariant/Vault.Invariant.t.sol::invariant_INV11_payout_bounds_and_single_payout`<br>• `contracts/test/BondPool.Fuzz.t.sol::testFuzz_payout_bounds_and_single_payout`<br>• `contracts/test/BondPool.t.sol::test_approveClaim_pays_and_revokes_in_one_tx_with_both_events` |
| **INV-12** | EIP-712 qualification attestations are domain-bound (`chainId`, `vaultAddress`) and single-use. | • `contracts/test/Vault.Qualification.t.sol::test_revert_replay_attestation`<br>• `contracts/test/Vault.Qualification.t.sol::test_revert_wrong_vault_in_attestation`<br>• `contracts/test/Vault.Qualification.t.sol::test_revert_wrong_chain_in_attestation` |
| **INV-13** | Attestations are accepted only if referencing the latest `commitExam` on-chain for that `configHash` with matching `corpusHash`. | • `contracts/test/Vault.Qualification.t.sol::test_revert_stale_exam_commit`<br>• `contracts/test/Vault.Qualification.t.sol::test_commit_exam_and_activation_binds` |
| **INV-14** | Reconciled payments cannot be claimed; each payment is paid out at most once. | • `contracts/test/invariant/Vault.Invariant.t.sol::invariant_INV14_reconciled_payments_unclaimable`<br>• `contracts/test/BondPool.t.sol::test_claim_on_reconciled_payment_rejected`<br>• `contracts/test/BondPool.Claims.t.sol::test_claim_reconciled_reverts` |

---

## 3. Known Risks & Disclosures (KR-1 through KR-6)

In compliance with hackathon security standards and honest disclosure rules:

### KR-1: Owner Key Custody in Demo
- **Risk:** In the local demo runner (`scripts/demo-local.sh`), the owner private key resides unencrypted in memory and environment files.
- **Mitigation:** Production deployment requires smart contract account abstraction (ERC-4337 / Safe multi-sig) or hardware security modules (HSM) for owner transactions.

### KR-2: Agent Private Keys on Local Disk
- **Risk:** Agent keys generated by `uw keys new` are saved in `.keys/` on the local file system.
- **Mitigation:** Protected by `.gitignore` to prevent secret leakage. For enterprise use, agent keys should reside inside a secure enclave or cloud KMS.

### KR-3: Adjudicator Trust & Collusion Vector
- **Risk:** In the current release, claims are approved by a designated adjudicator key. If an adjudicator colludes with the vault owner, they could approve frivolous claims to transfer underwriter collateral into the vault.
- **Mitigation:** Documented as an explicit trust assumption. Production implementations should replace the single adjudicator key with an optimistic dispute oracle (e.g., UMA / Kleros) or an independent arbitration panel.

### KR-4: Remote LLM Configuration Drift Limits
- **Risk:** The runtime validates local prompt bytes, tool schema hashes, and provider-reported model strings. However, it cannot cryptographically guarantee provider-side neural network weights or unannounced model updates by proprietary LLM providers.
- **Mitigation:** The system halts with `CONFIG_DRIFT` if local hashes or model tags change. Formal proof of inference requires TEE remote attestation, which is designated for future research.

### KR-5: Lack of Commercial External Audit
- **Risk:** Smart contracts have not yet been audited by an independent third-party blockchain security firm.
- **Mitigation:** Mitigated by 101 Foundry tests, 25,600 automated stateful invariant calls, and strict compiler gate checks. Commercial mainnet deployment must follow an external security audit.

### KR-6: In-Distribution Statistical Limits
- **Risk:** Clopper-Pearson bounds provide mathematical confidence guarantees over the scenario distribution sampled by the exam. They cannot mathematically guarantee safety against completely novel zero-day attack methodologies.
- **Mitigation:** Demonstrated empirically in our calibration experiment (Hypothesis H4), proving why smart contract ceilings (INV-2) and collateralized bond backing (INV-10) are essential complements to empirical AI evaluation.
