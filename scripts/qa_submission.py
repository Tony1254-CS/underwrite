import hashlib
import json
from pathlib import Path

import fitz
from PIL import Image
from pptx import Presentation


ROOT = Path(__file__).resolve().parents[1]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    expected_pages = {
        "docs/UNDERWRITE_TECHNICAL_DOSSIER.pdf": 15,
        "docs/UNDERWRITE_SECURITY_SELF_ASSESSMENT.pdf": 12,
        "docs/ONCHAIN_EVIDENCE.pdf": 8,
        "docs/deck/UNDERWRITE_PITCH_DECK.pdf": 13,
    }
    for relative, expected in expected_pages.items():
        path = ROOT / relative
        document = fitz.open(path)
        assert len(document) == expected, f"{relative}: expected {expected} pages, got {len(document)}"
        blank = [index + 1 for index, page in enumerate(document) if len(page.get_text().strip()) < 20]
        assert not blank, f"{relative}: blank or nearly blank pages {blank}"
        print(f"PASS pdf {relative}: {len(document)} pages, {sum(len(p.get_links()) for p in document)} links")

    deck = Presentation(ROOT / "docs/deck/UNDERWRITE_PITCH_DECK.pptx")
    assert len(deck.slides) == 13, f"PPTX: expected 13 slides, got {len(deck.slides)}"
    print("PASS pptx: 13 editable slides")

    screen_dir = ROOT / "docs/professional/assets/screens-light"
    required = {"home.png", "dashboard.png", "exam.png", "attack.png", "evidence.png", "experiment.png"}
    present = {path.name for path in screen_dir.glob("*.png")}
    assert required <= present, f"missing light screenshots: {sorted(required - present)}"
    assert not (ROOT / "docs/professional/assets/screens").exists(), "legacy dark screenshot directory still exists"
    for name in sorted(required):
        with Image.open(screen_dir / name) as image:
            assert image.width >= 1200 and image.height >= 700, f"{name}: capture resolution is too low"
    print("PASS screenshots: six light-mode captures; no legacy dark directory")

    artifact_manifest = json.loads((ROOT / "docs/competition/ARTIFACT_MANIFEST.json").read_text(encoding="utf-8-sig"))
    for artifact in artifact_manifest["artifacts"]:
        path = ROOT / artifact["path"]
        assert path.stat().st_size == artifact["bytes"], f"{artifact['path']}: byte count mismatch"
        assert sha256(path) == artifact["sha256"], f"{artifact['path']}: SHA-256 mismatch"
    print(f"PASS artifact manifest: {len(artifact_manifest['artifacts'])} files")

    evidence_manifest = json.loads((ROOT / "evidence/onchain/EVIDENCE_MANIFEST.json").read_text(encoding="utf-8"))
    assert evidence_manifest["network"]["chainId"] == 84532
    for transaction in evidence_manifest["transactions"]:
        assert transaction["receiptStatus"] == 1
        receipt = ROOT / "evidence/onchain" / transaction["receiptFile"]
        assert sha256(receipt) == transaction["receiptSha256"], f"{receipt}: SHA-256 mismatch"
        assert transaction["matchedEvent"], f"{transaction['hash']}: missing matched event"
    execution = evidence_manifest["transactions"][-1]
    assert execution["action"] == "executePending"
    assert execution["decodedInput"] == "executePending(2)"
    assert execution["matchedEvent"] == "PaymentExecuted"
    assert execution["tier"] == 2
    print("PASS evidence manifest: four successful receipts; execution/event rule satisfied")

    print("SUBMISSION QA PASSED")


if __name__ == "__main__":
    main()
