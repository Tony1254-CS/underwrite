# UNDERWRITE pitch deck — editorial source map

**Competition:** 2026 Shenzhen International FinTechathon · International Track · Topic F
**Format:** 16:9 · 13 slides · target delivery 8:45 · hard ceiling 10:00
**Final PDF:** `UNDERWRITE_PITCH_DECK.pdf`
**Editable source:** `UNDERWRITE_PITCH_DECK.pptx`
**Rebuild source:** `build_deck.py`

## Narrative spine

The deck follows a judge-oriented sequence:

`control gap → product thesis → working interface → trust boundary → earned authority → permission model → public proof → compromise containment → measured results → assurance → differentiation → close`

It is intentionally not a compressed technical report. Each slide carries one decision-relevant idea; implementation depth is delegated to the technical and security dossiers.

## Slide map

| # | Slide | Job in the argument | Evidence shown |
|---:|---|---|---|
| 1 | Authority must be earned | Establish the category and thesis | Working prototype; real Base Sepolia |
| 2 | Intelligence cannot be its own spending policy | Define the control gap | Prompt injection, hallucinated intent, key compromise |
| 3 | Measure, compile, enforce | Explain the system in one sequence | Exam → compiler → activation → enforcement |
| 4 | Working product | Demonstrate that the boundary is visible | Light-mode local UI; scripted-demo label |
| 5 | Trust architecture | Separate untrusted reasoning from money movement | Untrusted, deterministic, signed, and on-chain layers |
| 6 | Evidence to authority | Show how autonomy is earned or denied | Configuration hash, exam evidence, conservative compiler |
| 7 | Permission ladder | Make the operational policy legible | T0 reject; T1 bounded autonomous; T2 delayed/vetoable |
| 8 | Real execution evidence | Earn the Topic-F chain-proof bonus | Four hashes, decoded events, explorer QR |
| 9 | Assume compromise | Explain containment after model/key failure | Light-mode Attack Lab; contract checks remain authoritative |
| 10 | Controlled evaluation | Present safety/autonomy trade-off honestly | 9 conditions, 2,970 controlled non-independent executions |
| 11 | Assurance case | Replace adjectives with observed evidence | 101 contract tests; 159 engine tests; 25,600 invariant calls |
| 12 | What is distinctive | State differentiated mechanism without monopoly claims | Evidence-authority-bond coupling and explicit non-claims |
| 13 | Do not trust unlimited authority | Leave one memorable principle and verifiable proof | Execution hash and explorer QR |

## Approved proof statements

- The four public transactions are on **Base Sepolia**, chain ID `84532`.
- The payment proof is a controlled **Tier-2** transfer of 35 MockUSDC, not Tier 1 and not mainnet.
- A payment is described as executed only because the receipt status is successful and the matching decoded `PaymentExecuted` event is present.
- The experiment is **controlled, non-independent, and self-authored under DEC-023**.
- Test counts were observed on 19 October 2026: 101 contract tests, 159 engine tests, and 25,600 stateful invariant calls.
- The security report is a self-assessment, not an independent audit.

## Visual system

- Navy, paper, electric blue, cyan, and lime are used as a functional palette: trust boundary, evidence, execution, and decision state.
- Typography is native and editable; layout uses vector shapes and text, not page screenshots.
- All product screenshots used in the deck are **light mode**.
- Screenshot captions explicitly say `light UI` and identify scripted, simulated, or controlled content.
- QR codes point to explorer evidence; full hashes remain present in the evidence dossier.
- Footer numbering lets judges recover quickly after questions.

## Files to send

Send `UNDERWRITE_PITCH_DECK.pdf`. Keep the `.pptx` as the editable source and use `SPEAKER_NOTES.md` for rehearsal. The technical dossier, security self-assessment, and on-chain evidence dossier are separate attachments; they should not be embedded into the slide file.
