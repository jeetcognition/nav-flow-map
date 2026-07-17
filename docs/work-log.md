# QA platform work log

This file is append-only. Each entry summarizes requested work, completed implementation or analysis, validation, and deferred items. Detailed rationale belongs in `decisions.md`.

## 2026-07-17 — First three catalog pages and Playwright E2E scaffold

### Requested

- Re-author the first three Nav Flow nodes (`login`, `auth`, `landing`) into `catalog/pages/*.json`.
- Use `jeetcognition/playwright-enterprise-qa` as the reference for the login/auth Playwright foundation.
- Create the first Playwright spec from a catalog case.

### Implemented

- Added `catalog/pages/login.json` (6 cases), `auth.json` (9 cases), and `landing.json` (17 cases) conforming to `catalog/schema/page-catalog.schema.json`. Cases are sourced from `app/src/data/fixtures/testcases.json` and the `qa-testing/testcases/*.md` specs, re-authored with risk tags, cadence, environment, executors, automation lifecycle, and cleanup.
- Created `tests/playwright/` as a standalone package:
  - `package.json` with `@playwright/test`, `dotenv`, `imapflow`, `mailparser`.
  - Environment-configurable `playwright.config.ts` with `setup`, `unauthenticated`, and `authenticated` projects.
  - Page objects (`BasePage`, `LoginPage`, `OrgSelectorPage`) and `support/paths.ts`/`support/gmail-otp.ts` (OTP flow adapted from the reference repo).
  - `specs/auth.setup.ts` to capture an admin session.
  - `specs/unauthenticated/login.spec.ts` implementing `LOGIN-SAN01` (Load the Login page) and setting its catalog `automation.status` to `active`.
- All URLs, tenant slugs, and credentials are externalized via `.env`/`.env.example` and `process.env`; specs skip with a clear message when env vars are missing.
- Updated `README.md`, `AGENTS.md`, `CHANGELOG.md`, `catalog/README.md`, `.prettierignore`, and this work-log.

### Validation

- `npm run catalog:validate` passes (3 page files, 32 testcases).
- `npm run format:check` passes.
- `node scripts/validate-data.js` passes.
- `cd app && npx tsc -b --force` passes (no `app/` code changes).
- `cd tests/playwright && npx playwright install chromium` and `npx playwright test --list` succeed; `npx playwright test` skips cleanly without env vars.
- All six `login` node cases are now automated in `tests/playwright/specs/unauthenticated/login.spec.ts` and linked as `active` in `catalog/pages/login.json`. Headed run of the full suite passed against the live Auth0 Universal Login page.
- `app/` `npm run lint` and `npm run build` could not run locally because the `oxlint` / `rolldown` optional native bindings require Node `^20.19.0 || >=22.12.0` and the VM runs Node `v20.18.1`; CI uses Node 22 and will exercise them.

### Deferred

- Remaining landing regression cases not included in the focused subset; auth/landing authenticated specs; catalog → fixture generator; YAML migration; runner skill; D1/R2 runtime storage.

### Decisions

- QA-DEC-013: First catalog pages are seeded from fixtures as `source.type: migration` while the UI still consumes the JSON fixtures; a future generator will make the catalog the single source of truth.
- QA-DEC-014: Playwright specs are split into `unauthenticated/` and `authenticated/` projects; the auth setup is optional and skips when credentials are missing so CI stays green before env vars are configured.

## 2026-07-16 — Repository review and target architecture

### Requested

- Understand `empty`, `playwright-enterprise-qa`, `nav-flow-map`, and `enterprise-self-qa`.
- Design a system that stores testcases in Nav Flow, executes them through `devinBrowser`, promotes repeatable cases to Playwright, triages failures, and later learns from Pylon tickets.
- Re-check the architecture after the Nav Flow repository changed.

### Completed

- Mapped the four repositories and their overlap:
  - `nav-flow-map` is the UI and catalog foundation.
  - `empty` contains the strongest working browser-exploration skill and historical evidence.
  - `playwright-enterprise-qa` contains authentication/CI foundations but no active product regression coverage.
  - `enterprise-self-qa` is a methodology scaffold.
- Recounted the updated Nav Flow catalog: 372 cases and 17 bugs.
- Identified current integrity issues: stale documented case count, broken testcase references from `BUG-012` and `BUG-015`, and no My Analytics cases.
- Exercised the local Nav Flow UI without invoking remote save/promotion. Catalog lookup, bug filtering/navigation, draft persistence, and reset worked; opening Bugs can preserve an old panel scroll position and hide its heading/filters.
- Recommended one modular repository and separate runtime evidence storage.

### Deferred

- Existing data-integrity and panel-scroll issues were documented but not fixed because the requested work was architecture/setup.
- Worker authentication, PR-based promotion, runtime storage, failure triage, notifications, and Pylon intake remain future phases.

### Decisions

- QA-DEC-001 through QA-DEC-007.

## 2026-07-16 — Canonical catalog foundation

### Requested

- Create a Nav Flow feature branch and implement the first two steps: establish the single-repository direction and canonical catalog contract.
- Clarify that current testing covers webapps only; `devinBrowser` means Devin controls Chrome.
- Preserve future questions, answers, and implementation context in repository documentation.

### Implemented

- Added the canonical Draft 7 page/testcase schema and the nine-case Enterprise Settings → Devin pilot.
- Added `surface: webapp` and executor fields for `devinBrowser` and `playwright`.
- Added validation for IDs, mappings, cleanup, cadence, roles, executor eligibility, automation state, source files, bug references, and current legacy mappings.
- Added GitHub Actions catalog validation.
- Added architecture, catalog, decision, and work-log documentation plus repository instructions for future sessions.
- Corrected the README’s legacy testcase count from 220 to 372.

### Validation

- `npm run check`
- `node --check scripts/validate-catalog.mjs`
- Draft 7 schema validation for the Enterprise Devin pilot
- `git diff --check`
- Existing `testcases.js` remains at 372 cases

### Implementation reference

- PR #34: `Add canonical QA catalog foundation`
- Decisions QA-DEC-001, QA-DEC-002, QA-DEC-003, and QA-DEC-008.

## 2026-07-16 — devinBrowser terminology normalization

### Requested

- Replace QA-executor references with `devinBrowser` across schema, code, testcases, and documentation.

### Implemented

- Standardized the executor key and `devinBrowser_verified` lifecycle terminology.
- Removed ambiguous application/device terminology from current QA-platform documentation.
- Kept `surface: webapp` separate from executor identity.
- Updated the browser-control testcase wording in both legacy sources.

### Validation

- Repository-wide case-insensitive terminology scan
- `npm run check`
- `git diff --check`

### Decision

- QA-DEC-009.

## 2026-07-16 — Revive PR #34 onto current main

### Requested

- Salvage the closed, conflicting PR #34 (canonical catalog foundation): rebase onto main, fix the review finding, and repair references made stale by PR #36.

### Implemented

- Rebased all PR #34 commits onto main (post PR #35/#36); resolved CHANGELOG/README conflicts and kept `qa-testing/testcases/02_sessions_composer.md` deleted as on main.
- Scoped the validator's legacy `testcases.js` cross-check and the `source.reference` file-existence check to `source.type: migration` only (QA-DEC-010, review finding on PR #34).
- Updated the nine pilot cases' `source.reference` from the deleted `qa-testing/testcases/04_enterprise_devin.md` to `testcases.js` (QA-DEC-011).

### Validation

- `npm run catalog:validate` passes (1 page, 9 testcases).
- Verified a synthetic `customer-ticket` case with an external URL reference passes validation (then removed it).

### Deferred

- Catalog generation into the UI dataset; runner skill; Playwright pilot specs (next vertical-slice steps).

## 2026-07-16 — Strip case data; ship architecture only

### Requested

- Remove the migrated Enterprise Settings → Devin pilot data (and similar data changes) from the foundation PR; case data will be re-authored fresh on the firm architecture (QA-DEC-012).

### Implemented

- Deleted `catalog/pages/enterprise-devin.json`; `catalog/pages/` now ships empty with `.gitkeep`.
- Validator accepts an empty catalog (removed the at-least-one-page requirement).
- Reverted `testcases.js` to main (dropped the `STOOL-SAN02` wording edit).
- Reworded README, `catalog/README.md`, CHANGELOG, and the architecture migration sequence from "migrate" to "re-author fresh".

### Validation

- `npm run check` passes (0 page files, 0 testcases).

### Deferred

- Fresh page-catalog authoring (page by page); catalog → UI generation; runner skill; Playwright pilot specs.

## 2026-07-17 — Revive catalog foundation onto current React app

### Requested

- Port the `catalog-foundation-revived` branch onto the latest `main`, which now has a React 19 app under `app/` and JSON fixtures in `app/src/data/fixtures/`.
- Flow the `qa-platform-architecture-plan.md` target into repository documentation.

### Completed

- Created a new branch from `main` and copied only the non-destructive foundation pieces from `catalog-foundation-revived`:
  - `catalog/schema/page-catalog.schema.json`, `catalog/README.md`, and empty `catalog/pages/`;
  - `scripts/validate-catalog.mjs` (adapted to read `app/src/data/fixtures/bugs.json` and `testcases.json` instead of root `bugs.js`/`testcases.js`);
  - `docs/decisions.md`, `docs/work-log.md`, `docs/architecture.md`, `docs/README.md`, and `docs/qa-platform-architecture-plan.md`;
  - updated `AGENTS.md`, `README.md`, `CHANGELOG.md`, root `package.json`, and `.github/workflows/validate.yml`.
- Preserved `app/` and `worker/` unchanged so GitHub Pages and the existing promotion pipeline keep working.
- Left `catalog/pages/` empty per QA-DEC-012; page catalogs will be re-authored fresh.

### Validation

- `npm run catalog:validate` passes (0 page files, 0 testcases).
- `npm run format:check` passes after `npm run format`.
- `node scripts/validate-data.js` passes.
- `app/` `npx tsc -b --force` passes (no app code changed).
- `app/` `npm run lint` and `npm run build` could not run locally because the `oxlint` / `rolldown` optional native bindings did not install under the VM's Node 20; CI runs Node 22 and will exercise them.

### Deferred

- Catalog → fixture generator; YAML migration; runner skill; Playwright import; D1/R2 runtime storage; failure triage automation; Pylon intake.

## 2026-07-17 — Audit and refactor validator for engineering discipline

### Requested

- Ensure the catalog foundation is not "vibe coded" and follows an engineered structure.

### Implemented

- Audited the validator for god files and hard-coded paths.
- Split `scripts/validate-catalog.mjs` (353 lines) into focused modules under `scripts/catalog-lib/`:
  - `config.mjs`: repository and fixture paths.
  - `schema.mjs`: catalog constants and regex patterns.
  - `checks.mjs`: generic validation helpers.
  - `fixtures.mjs`: fixture loading.
  - `document.mjs`: page and testcase validation logic (under 300 lines).
- Rewrote `scripts/validate-catalog.mjs` as a 40-line entry point.

### Validation

- `npm run catalog:validate` passes.
- `npm run format:check` passes.
- `node scripts/validate-data.js` passes.
- PR #61 CI passes (lint, typecheck, build, validate).

### Deferred

- Add unit tests for the validator once a test runner is selected; integrate catalog generation with `app/` fixtures.
