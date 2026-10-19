# UNDERWRITE — competition recording guide

Use this guide with `DEMO_SCRIPT.md`. The goal is a credible product demonstration, not a cinematic trailer.

## Capture standard

| Item | Standard |
|---|---|
| Resolution | 1920×1080, 16:9, 30 fps |
| UI theme | **Light mode only** |
| Browser | Clean profile; bookmarks bar and personal tabs hidden |
| Zoom | 100% unless a hash needs a deliberate close-up |
| Cursor | Slow, intentional movement; no circling |
| Audio | Quiet room, close microphone, peak below clipping |
| Runtime | Target 4:40; never exceed 5:00 |
| Labels | Persistent `CONTROLLED LOCAL DEMO`, `SIMULATED`, or `REAL BASE SEPOLIA` as appropriate |
| Subtitles | English, reviewed against the final narration |

## Before recording

1. Run the documented tests and retain the terminal output; do not quote a count from memory.
2. Start the web product and set local storage/theme to light.
3. Open only the required routes: `/`, `/dashboard`, `/exam`, `/attack-lab`, `/evidence`, `/experiment`.
4. Open the final Base Sepolia execution in a separate clean explorer tab.
5. Disable notifications and hide wallet extensions, balances, account menus and browser identity.
6. Verify that no secret, private RPC URL, API key, seed phrase, local username or `.env` content can appear.
7. Rehearse once with a stopwatch and once while recording a disposable take.

## Recommended shot list

| Time | Shot | Classification | Required visual |
|---:|---|---|---|
| 0:00 | Home / thesis | Controlled product UI | light mode, product name, four-stage flow |
| 0:25 | Dashboard | Controlled local demo | tier, authority and boundary |
| 1:05 | Exam | Controlled local demo | configuration/evidence identity and compiler outcome |
| 1:50 | Attack Lab | Simulated / controlled | blocked attempt and zero-movement result for that scenario |
| 2:35 | Evidence | Real Base Sepolia | four linked hashes and decoded event status |
| 3:10 | Explorer close-up | Real Base Sepolia | final transaction hash, success and contract/event context |
| 3:35 | Experiment | Controlled, non-independent | 9-condition matrix and trade-off statement |
| 4:15 | Close | Competition summary | test snapshot, limitations, final principle |

## Evidence overlay copy

Use exactly these short labels:

- `CONTROLLED LOCAL DEMO · NO REAL FUNDS`
- `SIMULATED ATTACK · SCRIPTED INPUT`
- `REAL BASE SEPOLIA · CHAIN 84532`
- `CONTROLLED, NON-INDEPENDENT EVALUATION · DEC-023`
- `SECURITY SELF-ASSESSMENT · NOT INDEPENDENTLY AUDITED`

Do not use `mainnet`, `production payment`, `independent evaluation`, `audited`, `formally verified`, or `the only system`.

## Explorer shot

Final execution:

`0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712`

The narration must mention all of the following:

- Base Sepolia public testnet;
- controlled 35 MockUSDC payment;
- `executePending(2)` input;
- successful receipt;
- matching decoded `PaymentExecuted` event;
- Tier 2, not Tier 1.

## Edit and export

- Prefer hard cuts or short dissolves; avoid excessive motion graphics.
- Use one lower-third system and one typeface family.
- Keep hashes on screen long enough to pause and verify.
- Normalize narration, reduce noise conservatively, and keep music absent or very low.
- Export H.264 MP4, 1080p, with a widely supported AAC audio track.
- Watch the exported file from beginning to end, then test the public link in an incognito window and on a phone.

## Final safety check

Pause on every terminal, wallet, explorer and browser frame. If any private identifier or secret is visible, discard the take and record again. Never blur a leaked secret and continue using it; rotate the credential before producing another capture.
