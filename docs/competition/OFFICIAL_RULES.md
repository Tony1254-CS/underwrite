# FinTechathon 2026 — Topic F Official Rules & Guidelines Summary
**Source:** 2026 Shenzhen International FinTech Competition (FinTechathon) — International Track  
**Theme:** AI as a Financial Participant  
**Direction:** Topic F — Agent Wallet / Autonomous On-Chain Wallet  
**Host:** Tsinghua University PBC School of Finance & WeBank  
**Notice URL:** https://ird.oou.cmu.ac.th/2026-shenzhen-international-fintech-competition/  

---

## 1. Competition Timeline (Verified)
- **Registration & Submission Deadline:** 20 October 2026 23:59 Beijing Time (UTC+8) = 21:59 Bangladesh Time (UTC+6)
- **Online Preliminary Review:** 20–31 October 2026
- **Finalists Announced:** 31 October 2026
- **Grand Final & On-Site Defense:** 20–23 November 2026 (Shenzhen, China)

---

## 2. Topic F Scope & Problem Definition
- **Theme:** AI moves from a financial *tool* to an autonomous financial *participant*.
- **Direction:** AI Agent Wallet — autonomous on-chain wallet for asset management, transaction execution, and risk control.
- **Challenge Bonus:** Topic F carries an explicit 0–5 point challenge bonus for genuine on-chain autonomous execution.

---

## 3. Evaluation Criteria (Corroborated)
1. **Task Completion (40%):**
   - End-to-end execution of practical financial tasks (accounts payable, supplier payments, invoices).
   - Real transaction execution and settlement with verifiable receipts.
   - Robust handling of dual-approval / pending request workflows.
2. **Security & Compliance (30%):**
   - Tiered permission architecture ($T_0$ to $T_3$).
   - Defenses against prompt injection, hallucinated recipients, and unauthorized transfers.
   - Private key isolation: raw keys never exposed to LLM context, prompts, or tool schemas.
   - Full immutable audit trail and reproducible qualification reports.
3. **Innovation & Interaction (30%):**
   - Novelty in risk control and autonomy bounding (evidence-based authority compilation).
   - Bond collateralization and atomic revocation mechanism.
   - User experience: responsive Web UI, transparent Authority Meter, and accessible local demonstration.

---

## 4. Mandatory Deliverables Checklist
- [ ] Public GitHub repository with README, setup guide, and tests (anonymous visibility still needs a human check).
- [x] Real on-chain execution evidence (`evidence/onchain/EXECUTION_EVIDENCE.md`).
- [x] Technical specification document (`docs/TECHNICAL.md`, `.pdf`, `.html`).
- [x] Security self-assessment report (`docs/SECURITY_SELF_ASSESSMENT.md`, `.pdf`, `.html`).
- [x] Presentation deck ($\le 10$ minutes) (`docs/deck/deck.md`, `.pdf`, `.html`).
- [ ] Self-contained demo video (MP4, with subtitles) recorded by team human.
- [x] Pre-registration and empirical experiment results (`docs/EXPERIMENT.md`).

See `docs/competition/SUBMISSION_CHECKLIST.md` for the email address, required identity documents, exact subject format, and final human checks.
