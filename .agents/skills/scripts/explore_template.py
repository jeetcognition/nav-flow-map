"""Starter template for an exploratory-webapp-qa script.

Copy to WORKDIR as r{N}_explore{k}.py and fill in the AREAS. Bakes in the
stability protocol (dialog handler, console filter), screenshot + body helpers,
a toggle-persistence checker, and the standard edge-case input list.
"""
from lib import get_page
from playwright.sync_api import sync_playwright

BASE = "https://cog-enterprise-qa.beta.devinenterprise.com"

# Console noise that is known-cosmetic and should be filtered out.
NOISE = ("apple-mobile-web-app", "VideoFrame was garbage collected", "simple-icons")

# Standard edge-case inputs to try on text/number fields.
EDGE_INPUTS = [
    "",                       # empty
    "   ",                    # whitespace only
    "a" * 500,                # very long
    "<script>alert(1)</script>",  # XSS
    "javascript:alert(1)",    # scheme injection
    "日本語 emoji 🎉",         # unicode
    "-5", "0", "1.5",         # numeric edge (for number fields)
]


def main():
    with sync_playwright() as pw:
        b, page = get_page(pw)
        page.set_default_timeout(15000)

        console_errors = []
        page.on("console", lambda m: console_errors.append(f"[{m.type}] {m.text[:140]}")
                if m.type == "error" else None)
        # CRITICAL: without this, XSS/garbage inputs that trigger a native
        # dialog will crash the script.
        page.on("dialog", lambda d: d.accept())

        def snap(name):
            page.screenshot(path=f"evidence/{name}.png", full_page=True)

        def body():
            return page.evaluate("() => document.body.innerText")

        def real_errors():
            return [e for e in console_errors if not any(n in e for n in NOISE)]

        def check_toggle_persistence(label_substr):
            """Toggle a [role=switch] by label, reload, assert it persisted, revert."""
            def read():
                return page.evaluate("""(sub) => {
                    const s = Array.from(document.querySelectorAll('[role=switch]'))
                      .find(x => (x.closest('div,li,tr,label')?.textContent||'').includes(sub));
                    if (!s) return null;
                    const r = s.getBoundingClientRect();
                    return {checked: s.getAttribute('data-state')==='checked' || s.checked,
                            x: r.x + r.width/2, y: r.y + r.height/2};
                }""", label_substr)
            before = read()
            if not before:
                print(f"  toggle '{label_substr}' not found"); return
            page.mouse.click(before['x'], before['y']); page.wait_for_timeout(1500)
            after = read()
            page.reload(); page.wait_for_timeout(3000)
            post = read()
            if post and after and post['checked'] != after['checked']:
                print(f"  *** PERSISTENCE BUG: '{label_substr}' reverted after reload")
            else:
                print(f"  '{label_substr}' persisted OK ({before['checked']} -> {after['checked'] if after else '?'})")
            # revert
            now = read()
            if now and now['checked'] != before['checked']:
                page.mouse.click(now['x'], now['y']); page.wait_for_timeout(1000)

        # ------------------------------------------------------------------
        # AREAS UNDER TEST — fill these in.
        # ------------------------------------------------------------------
        print("=== EXAMPLE: Preferences notification toggle persistence ===")
        page.goto(BASE + "/settings/preferences", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        snap("tmpl-preferences")
        check_toggle_persistence("In-app notifications")
        print("  real console errors:", real_errors())

        print("\nDONE")


if __name__ == "__main__":
    main()
