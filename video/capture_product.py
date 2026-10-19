from __future__ import annotations

import argparse
import asyncio
import json
import shutil
from pathlib import Path

from playwright.async_api import Browser, BrowserContext, Page, async_playwright


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "artifacts" / "video" / "captures"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")

ACCOUNTS = {
    "OWNER": {
        "id": "acc_owner_001",
        "email": "cfo@underwrite.fi",
        "name": "Sarah Chen",
        "title": "Chief Financial Officer & Vault Custodian",
        "department": "Treasury & Corporate Governance (S6)",
        "role": "OWNER",
        "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "badge": "OWNER S6",
        "color": "emerald",
        "avatarSeed": "sarah-cfo",
        "isWeb3Connected": False,
    },
    "AGENT": {
        "id": "acc_agent_005",
        "email": "vendor@cloudcorp.com",
        "name": "CloudCorp Global Logistics",
        "title": "Enterprise Supplier & Authorized AP Invoicing Agent",
        "department": "Global Logistics & Inbound Billing Portal",
        "role": "AGENT",
        "address": "0xDC062a66c9E400f7EAcdE3E1b049E664337538d0",
        "badge": "VENDOR / AP AGENT",
        "color": "rose",
        "avatarSeed": "agent-submitter",
        "isWeb3Connected": False,
    },
    "ADJUDICATOR": {
        "id": "acc_adjudicator_004",
        "email": "adjudicator@underwrite.fi",
        "name": "Hon. Justice K. Thorne",
        "title": "Chief Claims Adjudicator",
        "department": "Disputes, Arbitration & Slashing Board",
        "role": "ADJUDICATOR",
        "address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "badge": "ORACLE / CLAIMS",
        "color": "amber",
        "avatarSeed": "thorne-judge",
        "isWeb3Connected": False,
    },
}


async def pause(page: Page, milliseconds: int = 1800) -> None:
    await page.wait_for_timeout(milliseconds)


async def smooth_scroll(page: Page, y: int, duration: int = 1100) -> None:
    await page.evaluate(
        """([target, duration]) => new Promise(resolve => {
          const start = window.scrollY;
          const delta = target - start;
          const begun = performance.now();
          const tick = now => {
            const p = Math.min(1, (now - begun) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            window.scrollTo(0, start + delta * eased);
            if (p < 1) requestAnimationFrame(tick); else resolve();
          };
          requestAnimationFrame(tick);
        })""",
        [y, duration],
    )


async def prepare(page: Page, url: str) -> None:
    await page.goto(url, wait_until="networkidle", timeout=90_000)
    await page.add_style_tag(
        content="""
          html { scroll-behavior: auto !important; }
          body { cursor: none !important; }
          * { cursor: none !important; }
          nextjs-portal, .nextjs-toast, [data-next-badge-root] { display: none !important; }
          #film-cursor { position: fixed; left: 50%; top: 50%; width: 24px; height: 24px;
            margin: -12px 0 0 -12px; border: 2px solid #111; border-radius: 999px;
            background: rgba(205,255,44,.82); box-shadow: 0 2px 10px rgba(0,0,0,.18);
            pointer-events: none; z-index: 2147483647; transition: transform .12s ease; }
          #film-cursor.is-click { transform: scale(.72); }
        """
    )
    await page.evaluate(
        """() => {
          if (!document.querySelector('#film-cursor')) {
            const c = document.createElement('div'); c.id = 'film-cursor'; document.body.appendChild(c);
            document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
            document.addEventListener('mousedown', () => c.classList.add('is-click'));
            document.addEventListener('mouseup', () => c.classList.remove('is-click'));
          }
        }"""
    )
    await page.mouse.move(1560, 930)
    await pause(page, 1000)


async def create_context(browser: Browser, temp_dir: Path, role: str = "OWNER") -> BrowserContext:
    session = {"token": f"uw_film_{role.lower()}", "user": ACCOUNTS[role], "authenticatedAt": 0}
    context = await browser.new_context(
        viewport={"width": 1920, "height": 1080},
        screen={"width": 1920, "height": 1080},
        device_scale_factor=1,
        color_scheme="light",
        reduced_motion="no-preference",
        record_video_dir=str(temp_dir),
        record_video_size={"width": 1920, "height": 1080},
    )
    await context.add_init_script(
        f"""
        localStorage.setItem('uw-theme', 'light');
        localStorage.setItem('underwrite_active_role', {json.dumps(role)});
        localStorage.setItem('underwrite_auth_session', {json.dumps(json.dumps(session))});
        """
    )
    return context


async def capture_scene(browser: Browser, out_dir: Path, name: str, role: str, action) -> None:
    temp = out_dir / "_recording"
    temp.mkdir(parents=True, exist_ok=True)
    context = await create_context(browser, temp, role)
    page = await context.new_page()
    video = page.video
    try:
        await action(page, context)
    finally:
        await page.close()
        await context.close()
    source = await video.path()
    target = out_dir / f"{name}.webm"
    if target.exists():
        target.unlink()
    shutil.move(str(source), target)
    print(f"captured {name}: {target}")


async def authority_scene(page: Page, _context: BrowserContext, base: str) -> None:
    await prepare(page, f"{base}/")
    await pause(page, 2200)
    await smooth_scroll(page, 650)
    await pause(page, 2400)
    await smooth_scroll(page, 1180)
    await pause(page, 1800)
    await prepare(page, f"{base}/exam")
    await pause(page, 2600)
    await smooth_scroll(page, 590)
    await pause(page, 3500)
    await prepare(page, f"{base}/dashboard")
    await pause(page, 3500)
    await smooth_scroll(page, 430)
    await pause(page, 2400)


async def payments_scene(page: Page, context: BrowserContext, base: str) -> None:
    await context.request.post(f"{base}/api/claims", data={"action": "RESET"})
    await prepare(page, f"{base}/portals/vendor")
    await pause(page, 1800)
    for label in ["Cloud compute", "GPU upgrade", "Hostile text"]:
        card = page.get_by_role("button").filter(has_text=label).first
        await card.scroll_into_view_if_needed()
        await card.click()
        await pause(page, 700)
        submit = page.get_by_role("button", name="Send the invoice to Acme Corp")
        await submit.scroll_into_view_if_needed()
        await pause(page, 600)
        await submit.click()
        await pause(page, 4800)
        result = page.get_by_text("The agent at work", exact=True)
        if await result.count():
            await result.scroll_into_view_if_needed()
        await pause(page, 1800)
    await page.get_by_text("Your invoices", exact=True).scroll_into_view_if_needed()
    await pause(page, 3200)


async def attack_scene(page: Page, _context: BrowserContext, base: str) -> None:
    await prepare(page, f"{base}/attack-lab")
    await pause(page, 1500)
    checkbox = page.get_by_role("checkbox")
    await checkbox.check()
    await pause(page, 800)
    await page.get_by_role("button").filter(has_text="Phishing Payee Redirection").click()
    run = page.get_by_role("button", name="Run it against the rules")
    await run.scroll_into_view_if_needed()
    await run.click()
    await pause(page, 2500)
    await page.get_by_text("What happened", exact=True).scroll_into_view_if_needed()
    await pause(page, 3200)
    await page.get_by_role("button").filter(has_text="Duplicate Invoice Replay").click()
    await run.scroll_into_view_if_needed()
    await run.click()
    await pause(page, 2500)
    await page.get_by_text("What happened", exact=True).scroll_into_view_if_needed()
    await pause(page, 3200)


async def recovery_scene(page: Page, _context: BrowserContext, base: str) -> None:
    await prepare(page, f"{base}/portals/owner")
    await pause(page, 2200)
    approve = page.get_by_role("button", name="Approve").first
    if await approve.count():
        await approve.scroll_into_view_if_needed()
        await approve.click()
        await pause(page, 2200)
    await page.get_by_text("Suppliers", exact=True).scroll_into_view_if_needed()
    await pause(page, 2200)
    await page.get_by_text("File a loss claim", exact=True).scroll_into_view_if_needed()
    await page.get_by_label("Payment ID").fill("1")
    await page.get_by_label("Loss incurred (USDC)").fill("170.00")
    await page.get_by_label("Evidence hash").fill("0xbaadf00d00000000000000000000000000000000000000000000000000000001")
    await page.get_by_role("button", name="File the claim").click()
    await pause(page, 2600)

    session = {"token": "uw_film_adjudicator", "user": ACCOUNTS["ADJUDICATOR"], "authenticatedAt": 0}
    await page.evaluate(
        "([role, session]) => { localStorage.setItem('underwrite_active_role', role); localStorage.setItem('underwrite_auth_session', JSON.stringify(session)); }",
        ["ADJUDICATOR", session],
    )
    await prepare(page, f"{base}/portals/adjudicator")
    await pause(page, 2200)
    decision = page.get_by_role("button", name="Approve and revoke").first
    if await decision.count():
        await decision.click()
        await pause(page, 1000)
        await page.get_by_role("button", name="Approve and revoke").last.click()
        await pause(page, 3200)
    await smooth_scroll(page, 900)
    await pause(page, 2200)


async def evidence_scene(page: Page, _context: BrowserContext, base: str) -> None:
    await prepare(page, f"{base}/evidence")
    await pause(page, 2400)
    await page.get_by_role("button", name="Simulate a 1-byte tamper").click()
    await page.get_by_role("button", name="Re-verify").click()
    await pause(page, 2600)
    await page.get_by_role("button", name="Tamper test is on").click()
    await page.get_by_role("button", name="Re-verify").click()
    await pause(page, 2200)
    await smooth_scroll(page, 720)
    await pause(page, 2200)

    tx = "0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712"
    await prepare(page, f"https://base-sepolia.blockscout.com/tx/{tx}")
    await pause(page, 6500)
    await smooth_scroll(page, 520)
    await pause(page, 4200)


async def experiment_scene(page: Page, _context: BrowserContext, base: str) -> None:
    await prepare(page, f"{base}/traces")
    await pause(page, 2500)
    await smooth_scroll(page, 480)
    await pause(page, 2400)
    await prepare(page, f"{base}/experiment")
    await pause(page, 3200)
    await smooth_scroll(page, 520)
    await pause(page, 3400)
    automation = page.get_by_role("button", name="Automation (%)")
    if await automation.count():
        await automation.click()
        await pause(page, 2600)
        await page.get_by_role("button", name="Net loss (USDC)").click()
    await smooth_scroll(page, 1320)
    await pause(page, 3000)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Capture deterministic light-mode product interactions.")
    parser.add_argument("--base", default="http://127.0.0.1:3000")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--scenes",
        default="03,04,05,06,07,08",
        help="Comma-separated scene numbers to capture.",
    )
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    if not CHROME.exists():
        raise FileNotFoundError(f"Chrome not found: {CHROME}")

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=str(CHROME),
            headless=True,
            args=["--disable-gpu-vsync", "--hide-scrollbars"],
        )
        selected = {part.strip() for part in args.scenes.split(",") if part.strip()}
        jobs = {
            "03": ("scene-03-authority", "OWNER", authority_scene),
            "04": ("scene-04-payments", "AGENT", payments_scene),
            "05": ("scene-05-attack", "OWNER", attack_scene),
            "06": ("scene-06-recovery", "OWNER", recovery_scene),
            "07": ("scene-07-evidence", "OWNER", evidence_scene),
            "08": ("scene-08-experiment", "OWNER", experiment_scene),
        }
        for scene_id in ["03", "04", "05", "06", "07", "08"]:
            if scene_id not in selected:
                continue
            name, role, action = jobs[scene_id]
            await capture_scene(browser, args.out, name, role, lambda p, c, fn=action: fn(p, c, args.base))
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
