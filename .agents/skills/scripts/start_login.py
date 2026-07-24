"""Login bootstrap for exploratory-webapp-qa.

The QA env has no persistent auth session, so every run starts logged out.
Devin's part: open QA_BASE in the already-running Chrome, fill the admin email
on the Auth0 identifier page, and submit — then STOP and ask the user to enter
the OTP manually in the Browser tab. Never try to fetch the OTP yourself.

Usage: python start_login.py [email]
Email defaults to $DEVIN_ADMIN_EMAIL, falling back to the QA admin address.
"""
import os
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import get_page

QA_BASE = os.environ.get("QA_BASE", "https://cog-enterprise-qa.beta.devinenterprise.com")
EMAIL = (sys.argv[1] if len(sys.argv) > 1 else None) or os.environ.get(
    "DEVIN_ADMIN_EMAIL", "jeet.bangoria@partners.cognition.ai"
)


def main() -> int:
    with sync_playwright() as pw:
        b, page = get_page(pw)
        page.set_default_timeout(30000)
        page.goto(QA_BASE + "/", wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        if "auth" not in page.url and "login" not in page.url.lower():
            print("ALREADY_LOGGED_IN:", page.url)
            return 0
        page.fill("input[name=username], input[type=email]", EMAIL)
        page.wait_for_timeout(500)
        page.click("button[type=submit]")
        page.wait_for_timeout(5000)
        page.bring_to_front()
        print("OTP_PENDING:", page.url)
        print("Email submitted. Ask the user to enter the OTP in the Browser tab.")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
