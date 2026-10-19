# Competition document build

This directory contains the publication sources for the designed technical, security, and on-chain evidence PDFs. The pitch deck source is `../deck/build_deck.py`.

## Windows toolchain

- Python 3.11+
- packages in `requirements.txt`
- Google Chrome for HTML-to-PDF rendering and deterministic light-mode capture
- Microsoft PowerPoint for editable PPTX-to-PDF export
- the UNDERWRITE web product running when screenshots are recaptured

## Build

```powershell
python -m pip install -r docs/professional/requirements.txt
powershell -ExecutionPolicy Bypass -File scripts/build-competition-package.ps1
```

To refresh every product screenshot first, run the app on port 3001 and use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-competition-package.ps1 -CaptureLightScreens -WebBaseUrl http://127.0.0.1:3001
```

The capture script forces `uw-theme=light`, requests a light browser color scheme, and fails if the rendered document does not report `data-theme="light"`.

## QA

```powershell
python scripts/qa_submission.py
```

QA checks page and slide counts, blank pages, the editable PPTX, required light captures, removal of the legacy dark-capture directory, artifact hashes, receipt hashes, successful receipt status, decoded event presence, and the final Tier-2 execution rule.

The build refreshes `docs/competition/ARTIFACT_MANIFEST.json`. Generated canonical PDFs and PPTX are committed so judges do not need the document toolchain.
