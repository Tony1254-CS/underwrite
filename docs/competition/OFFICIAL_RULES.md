# 2026 Shenzhen International FinTechathon — International Track rules brief

**Primary source:** `PBCSF Appendix 2-Problem Description and Competition Rules for International Track.pdf`
**Official notice:** <https://ird.oou.cmu.ac.th/2026-shenzhen-international-fintech-competition/>
**Reviewed:** 19 October 2026

This file separates explicit organizer requirements from UNDERWRITE’s submission strategy. The PDF remains authoritative if this brief differs.

## Organizer requirements — explicit

### Theme and Topic F

- International Track theme: **AI as a Financial Participant**.
- Teams choose one of six topics.
- Topic F: **Agent Wallet / Autonomous On-chain Wallet**.
- The requested capability is an AI wallet agent that autonomously executes on-chain operations, including asset management, transaction execution, and risk control.
- Topic F can receive a **0–5 point challenge bonus** for on-chain exploration.

### Scoring

| Criterion | Weight |
|---|---:|
| Task completion | 40% |
| Security and compliance | 30% |
| Innovation and interaction | 30% |
| On-chain challenge bonus | 0–5 points |

The source states that the six topics share the same core capability requirements and scoring criteria; choosing Topic F does not otherwise change scoring.

### Mandatory submission package

1. **Technical documentation:** system architecture, core algorithm description, and security design.
2. **Presentation deck:** final presentation no longer than 10 minutes.
3. **Demo video:** optional, no longer than 5 minutes.
4. **Source code:** README, GitHub repository link, deployment instructions, and test cases.
5. **Security self-assessment:** permission-tier implementation and known-risk list.
6. **Execution evidence:** for Topic F, real on-chain transaction hashes.

### Eligibility and language

- Full-time students at eligible overseas universities/research institutions may enter.
- Teams contain 2–5 students.
- At least 60% of members should be non-Chinese nationals; organizer determines track assignment from nationality and institution information.
- Each person may join only one team across the Domestic and International Tracks.
- English is the official language for submission, presentation, and review.

### Deadline and update rule

- Registration and submission deadline: **20 October 2026, 23:59 Beijing time (UTC+8)**.
- Bangladesh equivalent: **20 October 2026, 21:59 (UTC+6)**.
- Submissions may be updated before the deadline; the latest version received prevails.
- No changes are accepted after the deadline.

### Review and final

- Online review begins 20 October.
- Finalists are announced 31 October.
- Check-in and WeBank headquarters visit: 20 November in Shenzhen.
- Grand Final and awards: 21–23 November in Shenzhen.
- At least one member of each finalist team must attend in person unless the organizer accepts a valid justification.

### Contact

- Competition website: <https://fintechathon.g-ican.com>
- Contact email listed in the rulebook: `wangyr@pbcsf.tsinghua.edu.cn`

## UNDERWRITE interpretation — submission strategy

The following are our editorial response to the rubric, not extra organizer rules:

| Rubric | What judges need to see quickly | Artifact |
|---|---|---|
| Task completion | a coherent payment journey ending in verifiable settlement | pitch slides 4, 7 and 8; on-chain dossier |
| Security/compliance | explicit trust boundary, permission tiers, threat model, known risks and test evidence | security self-assessment |
| Innovation/interaction | evidence-derived authority and bond coupling explained through a usable product | pitch slides 3–6, 9, 10 and 12 |
| On-chain bonus | successful public-chain receipts, decoded events and continuity | four Base Sepolia hashes and manifest |

We use a public testnet because the requirement is “real on-chain transaction hashes,” not production funds or mainnet activity. Every competition artifact labels this boundary explicitly.
