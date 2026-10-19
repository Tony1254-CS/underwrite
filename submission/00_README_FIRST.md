# UNDERWRITE — final submission folder

This folder contains the competition-ready documents. Use the numbered files as the attachment order.

## Required project attachments

| File | Status | Purpose |
|---|---|---|
| `02_UNDERWRITE_Pitch_Deck.pdf` | Ready | Final presentation; 13 slides; designed for a talk under 10 minutes |
| `03_UNDERWRITE_Technical_Dossier.pdf` | Ready | System architecture, core algorithm, deployment and verification |
| `04_UNDERWRITE_Security_Self_Assessment.pdf` | Ready | Permission tiers, threat model, invariants, known risks and production gates |
| `05_UNDERWRITE_Onchain_Evidence.pdf` | Ready | Four real Base Sepolia hashes with receipts, events, continuity and QR links |
| `06_Artifact_Manifest.json` | Ready | SHA-256 integrity record for canonical generated artifacts |
| `07_SOURCE_AND_LINKS.md` | Needs team links | Public repository, optional video, product URL and judge commands |

## Required human/private attachments

These are not committed to Git. Store them under `private/` only while preparing the email:

1. completed International Track registration form;
2. passport bio page for every team member;
3. current student/enrollment proof for every team member.

The official blank registration workbook is copied into `private/` by `scripts/package-submission.ps1` when it is available in Downloads. Complete it in English and rename it only after checking the organizer’s instructions.

## Deployment answer

- **Smart contracts:** already deployed on Base Sepolia. This satisfies the project’s on-chain execution requirement together with the real transaction hashes.
- **Public web application:** not listed as a mandatory deliverable in official Appendix 2. A stable public demo URL is strongly recommended for judge convenience, but the repository, deployment instructions, tests, deck, documents and on-chain hashes are the explicit requirements.
- **Do not delay submission for a fragile frontend deployment.** The deck, light-mode captures, optional video and public receipts provide a complete fallback.

## Before sending

- [ ] Complete the registration workbook in `private/`.
- [ ] Add passport and enrollment files to the email from a secure local location.
- [ ] Replace every placeholder in `07_SOURCE_AND_LINKS.md` and the email draft.
- [ ] Confirm the GitHub repository opens while logged out.
- [ ] If providing a demo/video URL, test it while logged out and on another device.
- [ ] Open all four PDFs and verify page order, QR codes and fonts.
- [ ] Rehearse the pitch below 10 minutes.
- [ ] Send before **20 October 2026, 23:59 Beijing / 21:59 Bangladesh time**.

## Integrity check

`PACKAGE_SHA256.txt` is generated from the ready-to-send public files. Regenerate this folder after any canonical artifact changes:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-submission.ps1
```
