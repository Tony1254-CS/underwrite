import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "professional" / "assets" / "screens-light"
OUT.mkdir(parents=True, exist_ok=True)
BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3001").rstrip("/")
chrome_candidates = [
    Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
    Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Google/Chrome/Application/chrome.exe",
    Path(os.environ.get("LOCALAPPDATA", "")) / "Google/Chrome/Application/chrome.exe",
]
chrome_path = next((path for path in chrome_candidates if path.is_file()), None)
if chrome_path is None:
    raise FileNotFoundError("Google Chrome is required for deterministic light-mode capture.")

routes = {
    "home": "/",
    "dashboard": "/dashboard",
    "exam": "/exam",
    "attack": "/attack-lab",
    "evidence": "/evidence",
    "experiment": "/experiment",
}

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=str(chrome_path),
        headless=True,
    )
    context = browser.new_context(
        viewport={"width": 1600, "height": 900},
        device_scale_factor=1,
        color_scheme="light",
        reduced_motion="reduce",
    )
    context.add_init_script("localStorage.setItem('uw-theme', 'light')")
    page = context.new_page()
    for name, route in routes.items():
        page.goto(f"{BASE_URL}{route}", wait_until="networkidle")
        page.wait_for_timeout(500)
        assert page.locator("html").get_attribute("data-theme") == "light"
        page.screenshot(path=OUT / f"{name}.png", full_page=False)
        print(f"captured light: {name}")
    browser.close()
