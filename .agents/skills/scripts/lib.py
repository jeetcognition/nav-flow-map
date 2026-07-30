"""Shared CDP connect helper for exploratory-webapp-qa.

Attaches to the ALREADY-AUTHENTICATED Chrome over CDP. Never launches a new
browser (that would lose the session and burn an OTP). Auto-detects the CDP port
from DevToolsActivePort so it survives env/port changes.
"""
import os
import sys
import urllib.request

DATA_DIR = os.environ.get("BROWSER_DATA_DIR", "/home/ubuntu/.browser_data_dir")


def detect_cdp_url():
    # Explicit override wins.
    if os.environ.get("CDP_URL"):
        return os.environ["CDP_URL"]
    # DevToolsActivePort file: first line is the port.
    port_file = os.path.join(DATA_DIR, "DevToolsActivePort")
    try:
        with open(port_file) as f:
            port = f.readline().strip()
        if port:
            return f"http://127.0.0.1:{port}"
    except FileNotFoundError:
        pass
    # Last resort: common ports used historically.
    for port in (41851, 9222, 29229):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=2)
            return f"http://127.0.0.1:{port}"
        except Exception:
            continue
    raise RuntimeError("Could not detect CDP port. Is the browser running?")


def get_page(pw, base_substr="devinenterprise.com"):
    cdp = detect_cdp_url()
    b = pw.chromium.connect_over_cdp(cdp)
    ctx = b.contexts[0]
    pages = ctx.pages
    target = None
    for p in pages:
        if base_substr in p.url:
            target = p
    if target is None and pages:
        target = pages[0]
    if target is None:
        target = ctx.new_page()
    return b, target


if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    print("CDP:", detect_cdp_url())
    with sync_playwright() as pw:
        b, page = get_page(pw)
        print("URL:", page.url)
        print("TITLE:", page.title())
        for p in b.contexts[0].pages:
            print("  tab:", p.url)
