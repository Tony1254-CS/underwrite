from __future__ import annotations

import json
import hashlib
import math
import re
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts" / "video"
AUDIO = ARTIFACTS / "audio"
CAPTURES = ARTIFACTS / "captures"
BUILD = ARTIFACTS / "build"
CARDS = BUILD / "cards"
SEGMENTS = BUILD / "segments"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

WIDTH = 1920
HEIGHT = 1080
FPS = 30
AUDIO_DELAY = 0.7

BG = "#f4f3ed"
PAPER = "#fffefa"
INK = "#11110f"
MUTED = "#696a62"
LIME = "#d3ff2f"
GREEN = "#17794c"
RED = "#b72521"
AMBER = "#9b6200"

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")


SCENES = [
    {
        "id": 1,
        "duration": 19.0,
        "kind": "card",
        "title": "INTELLIGENCE IS NOT AUTHORITY.",
        "eyebrow": "THE PROBLEM",
        "label": "FINANCIAL ACTION NEEDS A HARD BOUNDARY",
    },
    {
        "id": 2,
        "duration": 21.0,
        "kind": "card",
        "title": "AUTHORITY, EARNED.",
        "eyebrow": "THE SYSTEM",
        "label": "MEASURE → BOUND → ENFORCE → BACK → REVOKE",
    },
    {
        "id": 3,
        "duration": 34.5,
        "kind": "capture",
        "source": "scene-03-authority.webm",
        "source_duration": 55.2,
        "title": "THE AUTHORITY METER",
        "label": "CONTROLLED LOCAL DEMO · SCRIPTED VALUES",
    },
    {
        "id": 4,
        "duration": 39.0,
        "kind": "capture",
        "source": "scene-04-payments.webm",
        "source_duration": 41.2,
        "title": "THREE ROUTES. ONE BOUNDARY.",
        "label": "CONTROLLED LOCAL DEMO · NO REAL FUNDS",
    },
    {
        "id": 5,
        "duration": 30.5,
        "kind": "capture",
        "source": "scene-05-attack.webm",
        "source_duration": 19.76,
        "title": "ASSUME THE KEY IS STOLEN.",
        "label": "SIMULATED ATTACK · SCRIPTED INPUT",
    },
    {
        "id": 6,
        "duration": 27.5,
        "kind": "capture",
        "source": "scene-06-recovery.webm",
        "source_duration": 28.76,
        "title": "CONSEQUENCE, IN ONE TRANSACTION.",
        "label": "CONTROLLED LOCAL DEMO · NO REAL FUNDS",
    },
    {
        "id": 7,
        "duration": 50.0,
        "kind": "proof",
        "title": "PUBLIC-CHAIN PROOF.",
        "label": "REAL BASE SEPOLIA · CONTROLLED MOCKUSDC · TIER 2",
    },
    {
        "id": 8,
        "duration": 36.0,
        "kind": "capture",
        "source": "scene-08-experiment.webm",
        "source_duration": 28.68,
        "title": "MEASURED TRADE-OFFS.",
        "label": "CONTROLLED, NON-INDEPENDENT EVALUATION",
    },
    {
        "id": 9,
        "duration": 23.0,
        "kind": "card",
        "title": "AUTHORITY, EARNED.",
        "eyebrow": "UNDERWRITE",
        "label": "EARNABLE · ENFORCEABLE · REVOCABLE",
    },
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size=size)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str = INK, width: int = 2) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, fill: str = INK, bold: bool = False, anchor: str | None = None) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill, anchor=anchor)


def brand(draw: ImageDraw.ImageDraw, x: int = 112, y: int = 74) -> None:
    text(draw, (x, y), "under", 32, bold=True)
    width = draw.textlength("under", font=font(32, True))
    draw.rounded_rectangle((x + int(width) - 1, y - 2, x + int(width) + 84, y + 37), radius=4, fill=LIME)
    text(draw, (x + int(width) + 2, y), "write", 32, bold=True)


def wrap_lines(draw: ImageDraw.ImageDraw, value: str, typeface: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = value.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=typeface) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int, max_width: int, fill: str = INK, bold: bool = False, spacing: int = 12) -> int:
    typeface = font(size, bold)
    lines = wrap_lines(draw, value, typeface, max_width)
    x, y = xy
    line_height = size + spacing
    for index, line in enumerate(lines):
        draw.text((x, y + index * line_height), line, font=typeface, fill=fill)
    return y + len(lines) * line_height


def base_card() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    brand(draw)
    draw.line((112, 132, 1808, 132), fill=INK, width=2)
    return image, draw


def make_problem_card(path: Path) -> None:
    image, draw = base_card()
    text(draw, (112, 202), "THE PROBLEM", 19, MUTED, bold=True)
    text(draw, (112, 249), "Intelligence is not", 78, bold=True)
    draw.rounded_rectangle((111, 340, 694, 434), radius=10, fill=LIME)
    text(draw, (130, 344), "authority.", 78, bold=True)
    draw_wrapped(
        draw,
        (112, 480),
        "A model can understand the invoice and still be the wrong place to hold irreversible financial power.",
        31,
        790,
        fill=MUTED,
        spacing=16,
    )

    nodes = [
        (1030, 287, "UNTRUSTED\nDOCUMENT", RED),
        (1320, 287, "MODEL\nDECISION", AMBER),
        (1610, 287, "MONEY\nMOVED", RED),
    ]
    for x, y, label, color in nodes:
        rounded(draw, (x - 92, y - 70, x + 92, y + 70), 24, PAPER, color, 4)
        first, second = label.split("\n")
        text(draw, (x, y - 20), first, 18, color, True, "mm")
        text(draw, (x, y + 15), second, 18, color, True, "mm")
    draw.line((1125, 287, 1225, 287), fill=RED, width=5)
    draw.polygon([(1225, 287), (1206, 275), (1206, 299)], fill=RED)
    draw.line((1415, 287, 1515, 287), fill=RED, width=5)
    draw.polygon([(1515, 287), (1496, 275), (1496, 299)], fill=RED)

    rounded(draw, (996, 518, 1742, 820), 28, PAPER, INK, 2)
    text(draw, (1042, 564), "A safe system asks a different question:", 23, MUTED)
    draw_wrapped(draw, (1042, 618), "How much authority has this exact agent earned?", 49, 636, bold=True, spacing=14)
    text(draw, (112, 1000), "UNDERWRITE · PRODUCT FILM", 17, MUTED, bold=True)
    text(draw, (1808, 1000), "01 / 09", 17, MUTED, bold=True, anchor="ra")
    image.save(path)


def make_system_card(path: Path) -> None:
    image, draw = base_card()
    text(draw, (112, 202), "THE SYSTEM", 19, MUTED, bold=True)
    text(draw, (112, 250), "Separate intelligence", 72, bold=True)
    text(draw, (112, 337), "from authority.", 72, bold=True)
    text(draw, (112, 454), "The model proposes. Deterministic layers decide what can happen.", 30, MUTED)

    labels = [
        ("01", "MEASURE", "adversarial exam"),
        ("02", "BOUND", "risk-sized limit"),
        ("03", "ENFORCE", "contract boundary"),
        ("04", "BACK", "bonded exposure"),
        ("05", "REVOKE", "authority removed"),
    ]
    start_x = 112
    gap = 22
    box_w = 318
    for index, (number, heading, detail) in enumerate(labels):
        x = start_x + index * (box_w + gap)
        rounded(draw, (x, 596, x + box_w, 808), 24, LIME if index == 2 else PAPER, INK, 2)
        text(draw, (x + 24, 624), number, 18, MUTED, bold=True)
        text(draw, (x + 24, 680), heading, 28, bold=True)
        text(draw, (x + 24, 737), detail, 19, MUTED)
        if index < len(labels) - 1:
            line_x = x + box_w
            draw.line((line_x, 702, line_x + gap, 702), fill=INK, width=3)
    draw.rectangle((112, 861, 1808, 873), fill=INK)
    draw.rectangle((112, 861, 1110, 873), fill=LIME)
    text(draw, (112, 1000), "UNDERWRITE · AUTHORITY, EARNED", 17, MUTED, bold=True)
    text(draw, (1808, 1000), "02 / 09", 17, MUTED, bold=True, anchor="ra")
    image.save(path)


def make_proof_card(path: Path) -> None:
    source = ARTIFACTS / "review" / "scene-07-evidence-24s.png"
    screenshot = Image.open(source).convert("RGB")
    screenshot = screenshot.resize((1540, 866), Image.Resampling.LANCZOS)
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    image.paste(screenshot, (58, 150))
    draw.rectangle((58, 150, 1598, 1016), outline=INK, width=2)
    draw.rectangle((58, 150, 1598, 198), fill=PAPER)
    text(draw, (82, 164), "PUBLIC EXPLORER · BASE SEPOLIA", 17, MUTED, bold=True)
    brand(draw, 58, 48)
    rounded(draw, (1618, 150, 1862, 1016), 22, PAPER, INK, 2)
    text(draw, (1642, 183), "VERIFIED", 18, GREEN, bold=True)
    draw.ellipse((1640, 232, 1684, 276), fill=GREEN)
    text(draw, (1662, 254), "✓", 24, PAPER, True, "mm")
    text(draw, (1642, 306), "SUCCESS", 25, bold=True)
    text(draw, (1642, 349), "executePending", 18, MUTED)
    draw.line((1642, 397, 1838, 397), fill="#d8d8d0", width=2)
    text(draw, (1642, 431), "35", 58, bold=True)
    text(draw, (1642, 497), "MockUSDC", 19, MUTED, bold=True)
    text(draw, (1642, 570), "REQUEST", 15, MUTED, bold=True)
    text(draw, (1838, 566), "2", 23, bold=True, anchor="ra")
    text(draw, (1642, 622), "PAYMENT", 15, MUTED, bold=True)
    text(draw, (1838, 618), "1", 23, bold=True, anchor="ra")
    text(draw, (1642, 674), "TIER", 15, MUTED, bold=True)
    text(draw, (1838, 670), "T2", 23, bold=True, anchor="ra")
    draw.line((1642, 718, 1838, 718), fill="#d8d8d0", width=2)
    draw_wrapped(draw, (1642, 752), "Successful receipt + matching PaymentExecuted event", 18, 188, fill=INK, bold=True, spacing=9)
    text(draw, (58, 1050), "REAL BASE SEPOLIA · CONTROLLED MOCKUSDC · NOT MAINNET OR CUSTOMER ACTIVITY", 16, MUTED, bold=True)
    image.save(path)


def make_close_card(path: Path) -> None:
    image, draw = base_card()
    text(draw, (112, 205), "CURRENT VERIFIED RERUN", 19, MUTED, bold=True)
    metrics = [
        ("101", "CONTRACT TESTS"),
        ("159", "ENGINE TESTS"),
        ("25,600", "INVARIANT CALLS"),
    ]
    x = 112
    for value, label in metrics:
        rounded(draw, (x, 258, x + 532, 477), 26, PAPER, INK, 2)
        text(draw, (x + 28, 296), value, 68, bold=True)
        text(draw, (x + 28, 402), label, 18, MUTED, bold=True)
        x += 582
    rounded(draw, (112, 560, 1808, 866), 28, LIME, INK, 3)
    text(draw, (155, 610), "Do not give an AI a blank check.", 38, bold=True)
    text(draw, (155, 695), "Make authority", 55, bold=True)
    text(draw, (155, 768), "earnable, enforceable, and revocable.", 55, bold=True)
    text(draw, (112, 948), "TESTNET PROTOTYPE · SECURITY SELF-ASSESSMENT · NOT AN INDEPENDENT AUDIT", 17, MUTED, bold=True)
    text(draw, (1808, 1000), "underwrite", 28, INK, bold=True, anchor="ra")
    image.save(path)


def make_capture_overlay(scene: dict, path: Path) -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    # The border reserves a clean editorial frame without hiding product state.
    draw.rectangle((0, 0, WIDTH, 53), fill=BG)
    draw.rectangle((0, HEIGHT - 53, WIDTH, HEIGHT), fill=BG)
    draw.rectangle((0, 0, 95, HEIGHT), fill=BG)
    draw.rectangle((WIDTH - 95, 0, WIDTH, HEIGHT), fill=BG)
    text(draw, (96, 16), scene["title"], 18, INK, bold=True)
    badge_font = font(15, True)
    badge_w = int(draw.textlength(scene["label"], font=badge_font)) + 30
    draw.rounded_rectangle((WIDTH - 96 - badge_w, 10, WIDTH - 96, 42), radius=8, fill=LIME, outline=INK, width=1)
    text(draw, (WIDTH - 111, 18), scene["label"], 15, INK, bold=True, anchor="ra")
    text(draw, (96, HEIGHT - 36), f"UNDERWRITE · {scene['id']:02d} / 09", 14, MUTED, bold=True)
    image.save(path)


def build_cards() -> None:
    CARDS.mkdir(parents=True, exist_ok=True)
    make_problem_card(CARDS / "scene-01.png")
    make_system_card(CARDS / "scene-02.png")
    make_proof_card(CARDS / "scene-07.png")
    make_close_card(CARDS / "scene-09.png")
    for scene in SCENES:
        if scene["kind"] == "capture":
            make_capture_overlay(scene, CARDS / f"scene-{scene['id']:02d}-overlay.png")


def run(command: list[str]) -> None:
    print(" ".join(command[:8]), "...", flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def render_card(scene: dict, output: Path) -> None:
    source = CARDS / f"scene-{scene['id']:02d}.png"
    narration = AUDIO / f"scene-{scene['id']:02d}.mp3"
    duration = scene["duration"]
    fade_out = duration - 0.28
    video_filter = (
        f"[0:v]zoompan=z='min(zoom+0.000025,1.012)':"
        f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={WIDTH}x{HEIGHT}:fps={FPS},"
        f"trim=duration={duration},setpts=PTS-STARTPTS,"
        f"fade=t=in:st=0:d=0.28:color=white,fade=t=out:st={fade_out}:d=0.28:color=white[v];"
        f"[1:a]adelay={int(AUDIO_DELAY * 1000)}|{int(AUDIO_DELAY * 1000)},apad,atrim=0:{duration},"
        f"afade=t=in:st={AUDIO_DELAY}:d=0.18,afade=t=out:st={fade_out}:d=0.22[a]"
    )
    run([
        FFMPEG, "-y", "-loglevel", "warning", "-loop", "1", "-i", str(source), "-i", str(narration),
        "-filter_complex", video_filter, "-map", "[v]", "-map", "[a]", "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(output),
    ])


def render_capture(scene: dict, output: Path) -> None:
    source = CAPTURES / scene["source"]
    overlay = CARDS / f"scene-{scene['id']:02d}-overlay.png"
    narration = AUDIO / f"scene-{scene['id']:02d}.mp3"
    duration = scene["duration"]
    ratio = duration / scene["source_duration"] if scene["source_duration"] < duration else 1.0
    fade_out = duration - 0.28
    video_filter = (
        f"[0:v]scale=1728:972:flags=lanczos,pad={WIDTH}:{HEIGHT}:96:54:color=0x{BG[1:]},"
        f"setpts={ratio:.7f}*PTS,fps={FPS},trim=duration={duration},"
        f"tpad=stop_mode=clone:stop_duration={duration},trim=duration={duration},setpts=PTS-STARTPTS[base];"
        f"[base][1:v]overlay=0:0:format=auto,"
        f"fade=t=in:st=0:d=0.28:color=white,fade=t=out:st={fade_out}:d=0.28:color=white[v];"
        f"[2:a]adelay={int(AUDIO_DELAY * 1000)}|{int(AUDIO_DELAY * 1000)},apad,atrim=0:{duration},"
        f"afade=t=in:st={AUDIO_DELAY}:d=0.18,afade=t=out:st={fade_out}:d=0.22[a]"
    )
    run([
        FFMPEG, "-y", "-loglevel", "warning", "-i", str(source), "-loop", "1", "-i", str(overlay),
        "-i", str(narration), "-filter_complex", video_filter, "-map", "[v]", "-map", "[a]", "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(output),
    ])


def srt_time_to_seconds(value: str) -> float:
    hours, minutes, rest = value.strip().split(":")
    seconds, millis = rest.split(",")
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(millis) / 1000


def ass_time(seconds: float) -> str:
    centiseconds = round(seconds * 100)
    hours, rem = divmod(centiseconds, 360000)
    minutes, rem = divmod(rem, 6000)
    secs, cents = divmod(rem, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{cents:02d}"


def ass_escape(value: str) -> str:
    value = value.replace("{", "(").replace("}", ")")
    words = re.sub(r"\s+", " ", value).strip().split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        candidate = " ".join(current + [word])
        if len(candidate) <= 62 or not current:
            current.append(word)
        else:
            lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    if len(lines) > 2:
        midpoint = math.ceil(len(words) / 2)
        lines = [" ".join(words[:midpoint]), " ".join(words[midpoint:])]
    return r"\N".join(lines)


def build_ass(path: Path) -> None:
    header = """[Script Info]
Title: UNDERWRITE Product Film
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,43,&H0011110F,&H0011110F,&H00FFFFFF,&H18FFFFFF,-1,0,0,0,100,100,0,0,3,1,0,2,260,260,62,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events: list[str] = []
    offset = 0.0
    block_pattern = re.compile(
        r"\d+\s*\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\s*\n(.*?)(?=\n\s*\n|\Z)",
        re.DOTALL,
    )
    for scene in SCENES:
        srt = (AUDIO / f"scene-{scene['id']:02d}.srt").read_text(encoding="utf-8-sig")
        for start, end, caption in block_pattern.findall(srt):
            start_s = offset + AUDIO_DELAY + srt_time_to_seconds(start)
            end_s = offset + AUDIO_DELAY + srt_time_to_seconds(end)
            clean = ass_escape(caption.replace("\n", " "))
            events.append(f"Dialogue: 0,{ass_time(start_s)},{ass_time(end_s)},Default,,0,0,0,,{clean}")
        offset += scene["duration"]
    path.write_text(header + "\n".join(events) + "\n", encoding="utf-8")


def build_srt(path: Path) -> None:
    entries: list[str] = []
    offset = 0.0
    sequence = 1
    block_pattern = re.compile(
        r"\d+\s*\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\s*\n(.*?)(?=\n\s*\n|\Z)",
        re.DOTALL,
    )

    def srt_time(seconds: float) -> str:
        millis = round(seconds * 1000)
        hours, rem = divmod(millis, 3_600_000)
        minutes, rem = divmod(rem, 60_000)
        secs, ms = divmod(rem, 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"

    for scene in SCENES:
        source = (AUDIO / f"scene-{scene['id']:02d}.srt").read_text(encoding="utf-8-sig")
        for start, end, caption in block_pattern.findall(source):
            start_s = offset + AUDIO_DELAY + srt_time_to_seconds(start)
            end_s = offset + AUDIO_DELAY + srt_time_to_seconds(end)
            clean = re.sub(r"\s+", " ", caption).strip()
            entries.append(f"{sequence}\n{srt_time(start_s)} --> {srt_time(end_s)}\n{clean}\n")
            sequence += 1
        offset += scene["duration"]
    path.write_text("\n".join(entries), encoding="utf-8")


def generate_soundbed(path: Path, duration: float) -> None:
    sample_rate = 48_000
    scene_starts = np.cumsum([0.0] + [float(s["duration"]) for s in SCENES[:-1]])
    chords = [
        (55.00, 82.41, 110.00),
        (49.00, 73.42, 98.00),
        (41.20, 61.74, 82.41),
        (46.25, 69.30, 92.50),
    ]
    rng = np.random.default_rng(20261020)
    phases = rng.uniform(0, math.tau, size=3)
    total_samples = int(duration * sample_rate)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        chunk = sample_rate
        for start in range(0, total_samples, chunk):
            count = min(chunk, total_samples - start)
            t = (np.arange(count, dtype=np.float64) + start) / sample_rate
            chord = chords[int((start / sample_rate) // 24) % len(chords)]
            signal = np.zeros(count, dtype=np.float64)
            for index, frequency in enumerate(chord):
                signal += np.sin(math.tau * frequency * t + phases[index]) * (0.32 / (index + 1))
            signal *= 0.026 * (0.72 + 0.28 * np.sin(math.tau * 0.035 * t) ** 2)
            # Gentle scene-change shimmer; it reads as sound design, not a melody.
            for scene_start in scene_starts[1:]:
                dt = t - scene_start
                active = (dt >= 0) & (dt < 1.8)
                if np.any(active):
                    signal[active] += 0.018 * np.exp(-2.6 * dt[active]) * np.sin(math.tau * 704 * dt[active])
            fade = np.minimum(1.0, np.minimum(t / 2.5, (duration - t) / 3.0))
            signal *= np.clip(fade, 0.0, 1.0)
            left = signal * (0.97 + 0.03 * np.sin(math.tau * 0.07 * t))
            right = signal * (0.97 + 0.03 * np.cos(math.tau * 0.061 * t))
            stereo = np.column_stack((left, right))
            pcm = np.clip(stereo * 32767, -32768, 32767).astype("<i2")
            output.writeframes(pcm.tobytes())


def render_segments() -> list[Path]:
    SEGMENTS.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    for scene in SCENES:
        output = SEGMENTS / f"scene-{scene['id']:02d}.mp4"
        print(f"Rendering scene {scene['id']:02d} / 09", flush=True)
        if scene["kind"] == "capture":
            render_capture(scene, output)
        else:
            render_card(scene, output)
        outputs.append(output)
    return outputs


def concat_segments(segments: list[Path], output: Path) -> None:
    manifest = BUILD / "concat.txt"
    manifest.write_text("\n".join(f"file '{path.as_posix()}'" for path in segments) + "\n", encoding="utf-8")
    run([FFMPEG, "-y", "-loglevel", "warning", "-f", "concat", "-safe", "0", "-i", str(manifest), "-c", "copy", str(output)])


def final_master(rough: Path, bed: Path, ass: Path, output: Path) -> None:
    ass_relative = ass.relative_to(ROOT).as_posix()
    video_filter = f"ass={ass_relative}"
    audio_filter = (
        "[0:a]aresample=48000:async=1000:first_pts=0,asetpts=N/SR/TB,volume=1.0[narration];"
        "[1:a]aresample=48000:first_pts=0,asetpts=N/SR/TB,volume=0.55[bed];"
        "[narration][bed]amix=inputs=2:duration=first:dropout_transition=0,"
        "asetpts=N/SR/TB,loudnorm=I=-16:LRA=7:TP=-1.8[a]"
    )
    run([
        FFMPEG, "-y", "-loglevel", "warning", "-i", str(rough), "-i", str(bed),
        "-vf", video_filter, "-filter_complex", audio_filter, "-map", "0:v", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", str(output),
    ])


def write_manifest(output: Path, ass: Path, srt: Path, bed: Path) -> None:
    payload = {
        "title": "UNDERWRITE — Authority, Earned",
        "durationSeconds": sum(float(scene["duration"]) for scene in SCENES),
        "resolution": f"{WIDTH}x{HEIGHT}",
        "fps": FPS,
        "voice": "en-US-AvaMultilingualNeural",
        "theme": "light",
        "burnedCaptions": ass.name,
        "sidecarCaptions": srt.name,
        "soundbed": bed.name,
        "output": output.name,
        "outputSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "evidencePolicy": "Controlled, simulated, and public-chain evidence are labeled in-frame.",
        "scenes": SCENES,
    }
    (ARTIFACTS / "film-manifest.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    BUILD.mkdir(parents=True, exist_ok=True)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    build_cards()
    ass = ARTIFACTS / "UNDERWRITE_PRODUCT_FILM.ass"
    build_ass(ass)
    srt = ARTIFACTS / "UNDERWRITE_PRODUCT_FILM.srt"
    build_srt(srt)
    bed = BUILD / "underwrite-soundbed.wav"
    total_duration = sum(float(scene["duration"]) for scene in SCENES)
    generate_soundbed(bed, total_duration)
    segments = render_segments()
    rough = BUILD / "underwrite-rough.mp4"
    concat_segments(segments, rough)
    output = ARTIFACTS / "UNDERWRITE_PRODUCT_FILM.mp4"
    final_master(rough, bed, ass, output)
    write_manifest(output, ass, srt, bed)
    print(f"Rendered {output} ({total_duration:.1f}s)", flush=True)


if __name__ == "__main__":
    main()
