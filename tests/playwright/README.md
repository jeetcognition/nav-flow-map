# Playwright E2E tests

End-to-end tests for the Devin Enterprise web app, driven by the canonical catalog in `catalog/pages/`.

## Structure

```text
tests/playwright/
├── pages/          # Page objects (BasePage, LoginPage, OrgSelectorPage)
├── support/        # Environment routes (paths.ts) and Gmail-OTP helper (gmail-otp.ts)
├── specs/          # Test specs and auth setup
│   ├── auth.setup.ts
│   └── unauthenticated/
│       └── login.spec.ts   # LOGIN-SAN01 — Load the Login page
├── playwright.config.ts
├── .env.example
└── package.json
```

## Environment

Copy `.env.example` to `.env` and fill in the values:

- `BASE_URL` — product under test (e.g. `https://cog-enterprise-qa.beta.devinenterprise.com`)
- `DEVIN_ADMIN_EMAIL` — the account to log in
- `GMAIL_APP_PASSWORD` — Google _App Password_ for IMAP OTP reading
- `GMAIL_IMAP_USER` — inbox address (defaults to `DEVIN_ADMIN_EMAIL`)
- `ENTERPRISE_SLUG`, `TEST_SUBORG` — tenant/org names for route helpers

Do **not** commit `.env` or `.auth/`.

## Running tests

```bash
cd tests/playwright
npm install
npx playwright install chromium

# Run the unauthenticated catalog spec (no credentials needed when BASE_URL is set)
npx playwright test

# Capture an authenticated session for the authenticated project
npm run auth
```

## Design notes

- The `setup` project captures an admin session once.
- `unauthenticated` specs (e.g. `login.spec.ts`) run independently and skip when `BASE_URL` is unset.
- `authenticated` specs reuse `.auth/admin.json` and skip their prerequisites when auth env vars are missing.
- All page objects use accessible locators; route and tenant slugs are read from `process.env` via `support/paths.ts`.
