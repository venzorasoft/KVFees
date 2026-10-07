"""Opens the Union Bank KV fee portal in a visible Edge/Chrome window, fills the student's
Unique ID and date of birth, and leaves the cursor in the captcha box. It never touches the
captcha or the Login button: the parent types the captcha and completes the payment.

Run as a subprocess (see routers/portal.py); the details arrive as JSON on stdin so they
never appear in the process list or logs.

    echo {"unique_id": "...", "dob": "2014-05-01"} | python -m app.portal_helper [--headless]
"""
import json
import sys

PORTAL_URL = "https://epay.unionbankofindia.bank.in/kvfee/default.aspx"
FILL_JS = """([uid, dob]) => {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = v;
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
    el.dispatchEvent(new Event('blur', {bubbles: true}));
    return el.value === v;
  };
  return [set('txtStudent', uid), set('txtDateofBirth', dob)];
}"""


def main() -> int:
    from playwright.sync_api import sync_playwright

    headless = "--headless" in sys.argv
    data = json.loads(sys.stdin.read().lstrip("﻿"))
    y, m, d = data["dob"].split("-")
    dob = f"{d}/{m}/{y}"  # the portal wants DD/MM/YYYY

    with sync_playwright() as p:
        browser = None
        for channel in ("msedge", "chrome", None):  # whatever is installed
            try:
                browser = p.chromium.launch(channel=channel, headless=headless)
                break
            except Exception:  # noqa: BLE001 - try the next browser
                continue
        if browser is None:
            print("No Edge/Chrome found", file=sys.stderr)
            return 2
        page = browser.new_context(ignore_https_errors=True, viewport=None).new_page()
        page.goto(PORTAL_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("#txtStudent", timeout=30000)
        ok = page.evaluate(FILL_JS, [data["unique_id"], dob])
        page.focus("#txtCaptcha")
        print(f"filled: unique_id={ok[0]} dob={ok[1]}", flush=True)
        if headless:
            browser.close()
            return 0 if all(ok) else 1
        page.wait_for_event("close", timeout=0)  # stay open until the parent closes the window
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
