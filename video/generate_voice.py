from __future__ import annotations

import argparse
import asyncio
import json
import re
import subprocess
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "docs" / "video" / "FINAL_NARRATION.md"
DEFAULT_OUT = ROOT / "artifacts" / "video" / "audio"


def parse_scenes(markdown: str) -> list[dict[str, str]]:
    scenes: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    for raw in markdown.splitlines():
        line = raw.strip()
        if line.startswith("## "):
            if current:
                current["text"] = re.sub(r"\s+", " ", current["text"]).strip()
                scenes.append(current)
            heading = line[3:]
            current = {"heading": heading, "text": ""}
            continue
        if current and line and not line.startswith("#"):
            clean = line.replace("**", "").replace("`", "")
            current["text"] += " " + clean
    if current:
        current["text"] = re.sub(r"\s+", " ", current["text"]).strip()
        scenes.append(current)
    return scenes


async def render_scene(text: str, media_path: Path, subtitle_path: Path, voice: str, rate: str, pitch: str) -> None:
    communicate = edge_tts.Communicate(
        text,
        voice=voice,
        rate=rate,
        pitch=pitch,
        boundary="SentenceBoundary",
    )
    submaker = edge_tts.SubMaker()
    with media_path.open("wb") as media:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                media.write(chunk["data"])
            elif chunk["type"] in {"SentenceBoundary", "WordBoundary"}:
                submaker.feed(chunk)
    subtitle_path.write_text(submaker.get_srt(), encoding="utf-8")


def duration_seconds(media_path: Path, ffmpeg: str) -> float:
    wav_path = media_path.with_suffix(".duration.wav")
    subprocess.run(
        [ffmpeg, "-y", "-loglevel", "error", "-i", str(media_path), "-ac", "1", "-ar", "16000", str(wav_path)],
        check=True,
    )
    with wave.open(str(wav_path), "rb") as handle:
        duration = handle.getnframes() / handle.getframerate()
    wav_path.unlink()
    return duration


async def main() -> None:
    parser = argparse.ArgumentParser(description="Render the approved female narration scene by scene.")
    parser.add_argument("--voice", default="en-US-AvaMultilingualNeural")
    parser.add_argument("--rate", default="-2%")
    parser.add_argument("--pitch", default="-2Hz")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    scenes = parse_scenes(SCRIPT.read_text(encoding="utf-8"))
    args.out.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    manifest: list[dict[str, object]] = []

    for index, scene in enumerate(scenes, start=1):
        stem = f"scene-{index:02d}"
        media_path = args.out / f"{stem}.mp3"
        subtitle_path = args.out / f"{stem}.srt"
        await render_scene(scene["text"], media_path, subtitle_path, args.voice, args.rate, args.pitch)
        duration = duration_seconds(media_path, ffmpeg)
        entry = {
            "index": index,
            "heading": scene["heading"],
            "text": scene["text"],
            "words": len(scene["text"].split()),
            "durationSeconds": round(duration, 3),
            "audio": media_path.name,
            "subtitles": subtitle_path.name,
        }
        manifest.append(entry)
        print(f"{stem}: {duration:.2f}s · {entry['words']} words")

    total = sum(float(item["durationSeconds"]) for item in manifest)
    payload = {
        "voice": args.voice,
        "rate": args.rate,
        "pitch": args.pitch,
        "totalSpeechSeconds": round(total, 3),
        "scenes": manifest,
    }
    (args.out / "voice-manifest.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"total speech: {total:.2f}s")


if __name__ == "__main__":
    asyncio.run(main())

