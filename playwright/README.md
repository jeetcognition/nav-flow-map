# Enterprise QA — Playwright smoke scaffold

Black-box smoke suite for **Devin Enterprise** (beta/staging). No source-code access required —
it drives the running web app and API. Built to be **finished and maintained by Claude Code**.

## What's here

```
playwright.config.ts          # setup + tests projects, video on failure
tests/auth.setup.ts           # logs in once and saves .auth/admin.json
tests/smoke.landing.spec.ts   # ENT-006 member propagation scaffold (skipped)
scripts/api-health.mjs        # nightly API health smoke (ENT-021/022/043), cron-ready
.env.example                  # config + (optional) credentials
```

Each test references the test-case IDs from your Notion DB (e.g. `[ENT-003]`) so runs map back to coverage.

## One-time setup

```bash
npm install
npx playwright install chromium
cp .env.example .env          # then edit BASE_URL + TEST_SUBORG (+ creds/keys if you have them)
```

## Run it

```bash
# Capture a logged-in admin session (headed) — saves .auth/admin.json
npm run auth

# Run the test suite (setup runs first, then all tests reuse the saved session)
npm run test             # headless
npm run test -- --headed # watch it click through

# See the report (with failure videos to attach alongside Jam)
npm run report

# API health smoke (separate, fully deterministic)
npm run api:health
```

Switch environments by changing `BASE_URL` (staging ↔ beta).

## Login credentials

`tests/auth.setup.ts` runs the full email-OTP login flow and saves the resulting admin session. Set these in `.env`:

- `DEVIN_ADMIN_EMAIL` — the address you type into the login form.
- `GMAIL_APP_PASSWORD` — a Gmail App Password (Account → Security → 2-Step Verification → App passwords),
  *not* your normal Gmail password. The test reads the one-time code from the Gmail inbox over IMAP.

For OTP mode you can narrow which email is read with `OTP_FROM_INCLUDES` / `OTP_SUBJECT_INCLUDES`,
and change the code pattern with `OTP_CODE_REGEX` (default: a 6-digit code). See `.env.example`.

## Let Claude Code finish the selectors (the important part)

If the login or org-selector selectors in `tests/pages/` fail on the live UI, have Claude Code read
the **live accessibility tree** via the Playwright MCP and update the locators in `tests/pages/login.page.ts`
and `tests/pages/org-selector.page.ts` — keep selectors role/text based, don't hardcode brittle CSS.
Run `npm run test` and iterate until green.

Drop the `CLAUDE.md` from the QA bundle into this folder first so Claude Code uses our severity rubric,
bug template, and "surgical changes" rules while it works.

## Next specs to add (in order)

1. **Secure mode** [ENT-037] — toggle on in settings, prompt a session to deploy to devinapps.com, assert refusal. High value, deterministic, security-critical.
2. **Member propagation** [ENT-006] — the skipped scaffold in `smoke.landing.spec.ts`; needs an admin context + a member context. Build with two `storageState` files.
3. **Auto-copy git permissions** [ENT-035/036] — toggle + create org + assert inheritance.

Keep the suite serial and small. Every customer-found escape from Pylon becomes a new spec here.
