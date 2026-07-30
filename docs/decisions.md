# QA platform decision log

This file is append-only. It records durable questions, answers, rationale, status, and implementation references. New decisions that replace old ones must identify the superseded decision.

## QA-DEC-023 — Source of truth for test-case automation status

- **Date:** 2026-07-19
- **Status:** Accepted
- **Question:** Which repository artifact is the source of truth for whether a test case is currently automated, and how does the UI fixture stay in sync?
- **Answer:** `catalog/pages/*.json` is the source of truth for automation status (`automation.status: active` for cases with a passing Playwright spec). The UI fixture `app/src/data/fixtures/testcases.json` is a downstream snapshot: `automation` is set to `"automated"` only when the matching catalog case is `active`; all other cases are `"manual"` or `"not-automatable"`. An `in-progress` automation value must not be persisted in fixtures.
- **Rationale:** The Navflow UI visualizes coverage and risk based on `automation` and `runResults`. Showing cases as `automated` or `in-progress` when no spec exists makes the dashboard unreliable.
- **Implementation:** `app/src/data/fixtures/testcases.json` (automation flags recalculated from `catalog/pages/login.json`, `auth.json`, and `landing.json`).

## QA-DEC-015 — Selector strategy for E2E specs

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** What locators should Playwright specs use for the Devin Enterprise webapp?
- **Answer:** Prefer semantic locators (`role`, accessible names) and stable `data-testid` attributes (`data-testid="sidebar"`, `data-testid="content"`) over generated IDs or CSS classes. For Radix-like portal tooltips, match the plain `<div>` tooltip text after a deliberate hover.
- **Rationale:** Generated IDs (`radix-_r_*`) change between sessions, while `data-testid` and accessible names survive refactors. Tooltip portals have no stable role, so text matching is the only reliable option.
- **Implementation:** `tests/playwright/pages/org-selector.page.ts`; `tests/playwright/specs/authenticated/landing.spec.ts`.

## QA-DEC-016 — SPA URL matching in Playwright

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** How should client-side route transitions be asserted in Playwright?
- **Answer:** Use regex assertions (`page.waitForURL(/\/org\/fri-5/)`) instead of glob patterns, because client-side history events and trailing slashes can cause glob matching to time out while the UI has already navigated.
- **Rationale:** Globs such as `**/org/fri-5` do not match `/org/fri-5/` and may also fail to trigger on history push state; regex handles both.
- **Implementation:** `tests/playwright/specs/authenticated/landing.spec.ts`.

## QA-DEC-017 — Command palette and All organizations menu structure

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** What are the stable ARIA landmarks for the landing command palette and organization switcher?
- **Answer:** The command palette is a `role="dialog"` containing a `role="combobox"` and a `role="listbox"` grouped under `Actions`, `Navigation`, and `Settings`. The All organizations dropdown is a `role="menu"` containing `Cog Enterprise QA`, `Enterprise settings`, `Invite members`, `Organizations`, `All organizations`, and `Log out`.
- **Rationale:** The command palette and dropdown are rendered by Radix-like components and expose standard ARIA roles rather than `data-testid`s, so specs should rely on role + text.
- **Implementation:** `tests/playwright/pages/org-selector.page.ts`.

## QA-DEC-018 — Sidebar collapse/expand assertions

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** How should the landing sidebar collapse/expand state be verified in Playwright?
- **Answer:** Assert the sidebar width (`getBoundingClientRect().width`) and keyboard shortcut behavior (`Control+b`). The collapse trigger is `button[data-slot="sidebar-trigger"]` inside `data-testid="sidebar"`; the expand control is not exposed as a separate visible button, so measuring width is the deterministic check.
- **Rationale:** Hovering for an "Expand sidebar" tooltip was unreliable because the tooltip is not rendered for a stable DOM element after collapse.
- **Implementation:** `tests/playwright/specs/authenticated/landing.spec.ts`.

## QA-DEC-019 — Manual versus automated cases

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** When should a catalog case remain `manual`?
- **Answer:** Keep a case `manual` when it requires an uncontrollable external state (e.g. an expired OTP) or a visual/state assertion that the current UI does not expose deterministically (e.g. a hover-only expand tooltip with no stable DOM target). Update the catalog assertion if the live UI diverges from the original requirement.
- **Rationale:** The catalog is the source of truth; Playwright should not fake assertions. Marking `manual` preserves traceability.
- **Implementation:** `catalog/pages/auth.json` (`AUTH-REG02`); `catalog/pages/landing.json` (`ORGSEL-SAN10` assertion updated to omit absent "Switch account" option).

## QA-DEC-020 — Scoping org row overflow menus

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** How can Playwright reliably target the correct `role="menu"` when multiple menus (overflow, All organizations, help) may be present?
- **Answer:** Use `page.locator('[role="menu"]').filter({ hasText: /Manage settings/ })` for the org row overflow menu. The All organizations dropdown contains `Enterprise settings`/`Invite members`; the help menu contains `Contact support`; only the row overflow menu contains `Manage settings`.
- **Rationale:** Filtering by unique menu text avoids strict-mode violations and hidden-menu collisions.
- **Implementation:** `tests/playwright/pages/org-selector.page.ts` (`overflowMenu()`).

## QA-DEC-021 — Handling server-side persistent pin state

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** How should a Playwright spec test the `Pin organization` toggle without leaving the test account in an unexpected state?
- **Answer:** Read the current menu label (`Pin organization` or `Unpin organization`) at the start of the test, toggle to the desired state, perform the assertion, then toggle back to the original label before the test ends.
- **Rationale:** Pin state is persisted server-side per account, so a test that pins without restoring it will change the baseline for every subsequent run.
- **Implementation:** `tests/playwright/specs/authenticated/landing.spec.ts` (`ORGSEL-REG08`).

## QA-DEC-022 — Catalog assertions versus live UI

- **Date:** 2026-07-18
- **Status:** Accepted
- **Question:** What should happen when the canonical markdown testcase describes UI elements (e.g. "Switch account", "Pin organization") that the deployed app does not currently expose?
- **Answer:** Update the catalog `assertions` to describe the live UI behavior (e.g. "Log out is present and signs the user out"; "Pin or Unpin organization and Manage settings are visible"). Do not fake assertions or skip the case silently.
- **Rationale:** The catalog is the source of truth, but it must be accurate. A divergent assertion is a catalog bug, not a test bug.
- **Implementation:** `catalog/pages/landing.json` (`ORGSEL-SAN04`, `ORGSEL-REG16`).

Status values:

- **Accepted** — approved and safe to implement.
- **Proposed** — recommended but not yet approved.
- **Open** — answer still required.
- **Superseded** — replaced by a later decision.

## QA-DEC-001 — Repository topology

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** Should Nav Flow, Devin-led QA, and Playwright remain in three repositories or become one?
- **Answer:** Use `nav-flow-map` as one modular QA-platform repository. Treat `empty`, `playwright-enterprise-qa`, and `enterprise-self-qa` as migration sources rather than independent systems.
- **Rationale:** The catalog, runner, automation, and triage need one stable ID/data contract. Separate modules provide boundaries without cross-repository drift.
- **Implementation:** `docs/architecture.md`; PR #34.

## QA-DEC-002 — Canonical testcase source

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** Where should testcase definitions live and how should they be structured?
- **Answer:** Store versioned page catalog files under `catalog/pages/`, governed by `catalog/schema/page-catalog.schema.json`. Stable IDs connect the Nav Flow UI, `devinBrowser` execution, bugs, and Playwright.
- **Rationale:** A schema prevents duplicate IDs and missing execution metadata while allowing page-by-page migration from the legacy Markdown and JavaScript sources.
- **Implementation:** The nine Enterprise Settings → Devin cases are the first schema pilot in PR #34. The existing 372-case UI source remains unchanged until generation is implemented.

## QA-DEC-003 — Current product surface

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** What does `devinBrowser` mean, and which product surface is currently in scope?
- **Answer:** Current scope is web applications only. Every current catalog case uses `surface: webapp`.
- **Terminology:** `devinBrowser` means a Devin session opens and controls the webapp in Chrome. `playwright` means deterministic browser automation.
- **Future extension:** Additional application and CLI surfaces may be added later, but they are not enabled now. The testcase `type` field continues to mean Smoke, Sanity, Regression, or E2E.
- **Implementation:** PR #34.

## QA-DEC-004 — Repeatable versus adaptive execution

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** How can recurring checks avoid repeatedly spending Devin tokens?
- **Answer:** Promote stable, deterministic catalog cases to Playwright. Reserve `devinBrowser` sessions for exploratory testing, changed surfaces, ambiguous behavior, and Playwright failure triage.
- **Guardrail:** Do not automate visual, destructive, unstable, or assertion-ambiguous cases until deterministic fixtures and cleanup exist.

## QA-DEC-005 — Failed Playwright cases

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** Should every Playwright failure immediately become a product bug or rewrite the test?
- **Answer:** No. Retry once in a clean context, fingerprint and deduplicate the failure, then have a `devinBrowser` session reproduce the exact catalog case.
- **Classification:** Product regression, selector/test drift, intentional product change, infrastructure/auth/fixture, flaky/timing, or inconclusive.
- **Guardrail:** The system may propose a test-maintenance PR but must never weaken expected behavior merely to make a test pass.

## QA-DEC-006 — Definitions versus runtime evidence

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** Should testcase definitions, test runs, reports, screenshots, videos, and traces all be committed to Git?
- **Answer:** Keep catalog definitions, schemas, automation code, skills, workflows, and stable bug references in Git. Store mutable run records in D1 (or equivalent) and large evidence in R2 (or equivalent).
- **Rationale:** Git remains reviewable while high-volume runtime artifacts remain queryable without unbounded repository growth.

## QA-DEC-007 — Customer-ticket intake

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** How should Pylon customer issues become regression coverage?
- **Answer:** Use authenticated Pylon webhook/API intake, redact private data, deduplicate similar reports, reproduce in QA with Devin, and create a linked bug/testcase only after confirmation. Promote only deterministic behavior to Playwright.
- **Guardrail:** Do not create a Devin session for every raw support message; prioritize tagged/high-severity candidates and batch lower-severity review.

## QA-DEC-008 — Durable project memory

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** How will future sessions know every relevant question, answer, decision, and implementation direction?
- **Answer:** Maintain append-only `docs/decisions.md` and `docs/work-log.md`, enforced by root `AGENTS.md`. Update these documents before completing future work.
- **Privacy boundary:** Preserve durable context, not secrets, raw customer content, authentication material, or transient command output.
- **Implementation:** PR #34.

## QA-DEC-009 — devinBrowser terminology

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** What term should schema, code, testcases, and documentation use for a Devin session controlling Chrome?
- **Answer:** Use `devinBrowser` everywhere. Do not use a device or application-surface label as shorthand for this executor.
- **Rationale:** Executor identity and product surface are separate concepts: `devinBrowser` executes the case, while `surface: webapp` identifies what is under test.
- **Implementation:** PR #34.

## QA-DEC-010 — Legacy cross-checks apply only to migrated cases

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** Should the catalog validator require every case to exist in the legacy `testcases.js` dataset and reference an existing repo file?
- **Answer:** No. The legacy presence/consistency comparison and the `source.reference` file-existence check apply only when `source.type` is `migration`. Cases authored from other sources (`manual`, `exploratory`, `customer-ticket`, `production-bug`) have no legacy counterpart, and their reference may be an external identifier such as a ticket URL.
- **Rationale:** The unconditional check (flagged in PR #34 review) would have blocked the documented catalog workflows for customer tickets, exploratory findings, and manually authored cases.
- **Implementation:** PR #34 revival (this branch).

## QA-DEC-011 — Migrated pilot cases reference `testcases.js`

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** What should the nine pilot cases use as `source.reference` now that `qa-testing/testcases/04_enterprise_devin.md` was deleted (PR #36)?
- **Answer:** Reference `testcases.js`, the surviving canonical source the markdown was parsed into.
- **Implementation:** PR #34 revival (this branch).

## QA-DEC-012 — Architecture-only foundation; case data re-authored fresh

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** Should the foundation PR carry migrated case data (the nine Enterprise Settings → Devin pilot cases), or ship architecture only?
- **Answer:** Architecture only. The pilot data and the `STOOL-SAN02` legacy edit were removed from the branch; `catalog/pages/` ships empty (`.gitkeep` only) and the validator accepts an empty catalog. Page catalogs will be re-authored fresh against the schema, page by page, using legacy data as reference material rather than a mechanical migration source. This supersedes the pilot-migration portion of QA-DEC-011 (the nine pilot cases no longer exist in the catalog); QA-DEC-010's validator scoping remains in force for any future `migration`-sourced cases.
- **Rationale:** Re-authoring on a firm architecture avoids carrying legacy inconsistencies (duplicate sources, priority inflation, uneven step quality) into the canonical catalog.

## QA-DEC-013 — Revive catalog foundation onto the React app

- **Date:** 2026-07-17
- **Status:** Accepted
- **Question:** How should the pre-`newui` `catalog-foundation-revived` branch be ported to the current `main`, which now has a React app and JSON fixtures?
- **Answer:** Create a new branch from `main` and copy only the non-destructive foundation pieces: `catalog/schema/page-catalog.schema.json`, `catalog/README.md`, empty `catalog/pages/`, `scripts/validate-catalog.mjs`, durable docs, and CI. Leave `app/` and `worker/` unchanged. Use the existing JSON `catalog/pages/*.json` format for the first pass; the full `docs/qa-platform-architecture-plan.md` YAML/module structure remains the documented long-term target.
- **Rationale:** The `catalog-foundation-revived` branch predates `newui`; a direct merge would delete the React app and revert the worker. Starting with the proven JSON schema avoids adding a YAML parser dependency before the catalog contract is validated, while the plan still guides later phases.
- **Supersedes:** QA-DEC-002's file-format details (JSON vs YAML) and QA-DEC-011's `testcases.js` reference; QA-DEC-010's validator scoping remains in force.
- **Implementation:** This PR.

## Open questions

### QA-OPEN-001 — Runtime data platform

- **Status:** Answered — see QA-DEC-024
- **Question:** Confirm Cloudflare D1/R2 as the runtime store and define retention, access control, and backup requirements.

### QA-OPEN-002 — Catalog authoring flow

- **Status:** Open
- **Question:** Should Nav Flow UI edits create a catalog PR directly, or first save an authenticated draft that a promotion service converts into a PR?

### QA-OPEN-003 — Execution triggers

- **Status:** Open
- **Question:** Confirm the exact deploy-gate, nightly, weekly, and on-demand suites after the first end-to-end pilot.

### QA-OPEN-004 — Catalog-to-fixture generation mapping

- **Status:** Open
- **Question:** How should the richer catalog case fields (e.g., `surface`, `type`, `steps` array, `assertions`) map onto the current `app/src/data/fixtures/testcases.json` shape (`surfaceId`, `suite`, `steps` string, `expected`) when generation is implemented?

## QA-DEC-013 — Seeding the first catalog pages from fixtures

- **Date:** 2026-07-17
- **Status:** Accepted
- **Question:** Should the first catalog pages be hand-written or seeded from existing fixtures?
- **Answer:** Seed the first three pages (`login`, `auth`, `landing`) from `app/src/data/fixtures/testcases.json` and `qa-testing/testcases/*.md`, then curate them with the richer schema fields. Use `source.type: migration` and keep the fixtures as the live UI source until a generator is built.
- **Rationale:** Writing 30+ cases by hand is error-prone and slow; a controlled, auditable seed plus human curation gets the first pages into the catalog quickly while preserving provenance.
- **Implementation:** `catalog/pages/login.json`, `catalog/pages/auth.json`, `catalog/pages/landing.json`.

## QA-DEC-014 — Playwright project layout and optional authentication

- **Date:** 2026-07-17
- **Status:** Accepted
- **Question:** How should the Playwright suite be structured so it can run in CI before auth secrets are configured?
- **Answer:** Separate `setup`, `unauthenticated`, and `authenticated` projects. The first catalog spec (`LOGIN-SAN01`) lives in `tests/playwright/specs/unauthenticated/` and only needs `BASE_URL`. `specs/auth.setup.ts` captures an admin session for authenticated specs and skips cleanly when `DEVIN_ADMIN_EMAIL` / `GMAIL_APP_PASSWORD` are absent.
- **Rationale:** Keeps CI green before credentials are provisioned, while still importing the email+OTP login flow from `playwright-enterprise-qa` as reusable infrastructure.
- **Implementation:** `tests/playwright/playwright.config.ts`, `tests/playwright/specs/auth.setup.ts`, `tests/playwright/specs/unauthenticated/login.spec.ts`.

## QA-DEC-024 — Backend platform: standardize on the Cloudflare stack

- **Date:** 2026-07-22
- **Status:** Accepted
- **Question:** What backend technology should nav-flow-map use for runtime capabilities (run results, incident intake, verification labels, auth, artifacts)? Answers QA-OPEN-001.
- **Answer:** Standardize on the Cloudflare developer platform around the already-deployed save worker: TypeScript Workers for all HTTP APIs (adopt Hono once routes multiply beyond the current handful), D1 (SQLite) for mutable runtime records (run results, incident verification labels, coverage feedback, rate-limit state), R2 for large evidence artifacts (screenshots, videos, traces), KV only for simple counters/flags, and Cron Triggers or GitHub Actions for scheduled jobs. Git remains canonical for catalog, fixtures, and config per QA-DEC-006, whose storage split is hereby elevated to Accepted. Auth: worker-side email OTP (e.g. Resend free tier) issuing HMAC-signed session tokens, with roles in a D1 table — no separate auth vendor (Supabase/Firebase/Auth0) and no always-on Node server unless a concrete blocker appears. Batch/analytical jobs that don't fit Workers (e.g. the Python Pylon pipeline) run in GitHub Actions and either commit derived JSON to git or POST to a worker API.
- **Rationale:** The worker is already in production with wrangler auth and CORS wired to the Pages origin; D1 shares the SQLite mental model with the local Pylon pipeline DB; R2 has free egress for evidence; the whole stack has zero fixed cost at this scale; and a solo maintainer with agent-driven development is best served by one boring platform instead of a second vendor. The static GitHub Pages frontend continues unchanged.
- **Consequences:** Future server-side capabilities default to "a Workers route + a D1 table"; artifacts default to R2; secrets live as wrangler secrets or GitHub Actions secrets, never in the repo or browser. Classifier gold labels (human verifications) belong in D1, not committed to the public repo.
- **Implementation:** `worker/worker.js` (existing); future `wrangler.toml` D1/R2 bindings as each capability lands.

## QA-DEC-025 — Deterministic ticket classifier, LLM-refined

- **Date:** 2026-07-22
- **Status:** Accepted
- **Question:** How are Pylon tickets classified as application issues for the Incidents feed (concretizing QA-DEC-007's intake)?
- **Answer:** A deterministic, pure-code rule classifier (`ticket_classifier.py`: weighted signals — error signatures, phrase patterns, Pylon `question_type`/`priority`/`tags`/`brand`) with NO LLM in the inference path. Verdicts: `definite-bug` / `possible-bug` / `not-app-issue`, each with confidence and the list of fired rules. The LLM's role is authoring: build the initial ruleset by reviewing the 60-day corpus, then periodically refine the rules from human verification labels (gold, from the UI flow) and low-confidence disagreements — every rule change gated by a labeled eval harness (precision/recall must not regress). Intake is batch pull (60-day backfill + daily incremental) for v1; QA-DEC-007's authenticated webhook remains the later target and its guardrail (no Devin session per raw message) stands. UI flow: `possible-bug` → "needs verification" → human confirms → convert to test case; `definite-bug` → pre-drafted test case ready to accept; accepted drafts ride the existing Save-to-repo → Devin promotion pipeline into the canonical fixtures.
- **Rationale:** Ticket classification is high-volume, latency-insensitive, and largely separable with surface patterns; deterministic rules are free to run, auditable, and diffable in git. Concentrating LLM use in the refinement loop (where labeled disagreements carry real information) minimizes ongoing LLM cost while letting accuracy improve over time.
- **Implementation:** `ticket_classifier.py`, `labels/eval_set.json`, `eval_classifier.py` (initial versions in the pylon pipeline; to be imported into this repo).

## QA-DEC-026 — Engineered Pylon intake flow (no vibe-coded changes)

- **Date:** 2026-07-22
- **Status:** Implemented
- **Question:** The first Pylon intake iteration was built ad hoc: pipeline modules unversioned outside the repo, manual export runs, direct-to-main commit, no tests on the PII sanitizer. What is the engineered flow, per the user's directive that no changes be vibe coded?
- **Answer:** (1) The pipeline lives in-repo at `pipelines/pylon/` (DB and `.env` gitignored). (2) The PII sanitizer, classifier bands, and node mapping have hermetic unit tests on synthetic tickets (`test_pipeline.py`) run by the Validate workflow on every PR. (3) Classifier rule edits are gated mechanically by `eval_classifier.py --gate` (hard floors: precision ≥ 90%, recall ≥ 85%, definite-band ≥ 95%, ≥ 100 scored). (4) `scripts/validate-data.js` validates incidents.json referential integrity and fails CI on PII leaks (emails, unmasked org/session links, enterprise hosts) — negative-tested. (5) The daily `pylon-intake.yml` workflow runs fetch → tests → eval gate → export → format → validate and opens a PR; it never pushes to main. (6) The worker's Devin promotion prompt now also opens auto-merge PRs instead of committing to main (QA-DEC-021-era decision, landed; effective after `wrangler deploy` on 2026-07-22). (7) Branch protection and `Allow auto-merge` are enabled on `main` as of 2026-07-22: required PR, required `validate` and `app — lint, typecheck, build` checks, no force-pushes/deletions, admins may bypass.
- **Rationale:** Gates must be mechanical, not disciplinary: a public repo carrying support-ticket-derived text needs a leak scan that fails CI, classifier accuracy needs a regression gate the refiner cannot skip, and automated writers need the same PR path as humans.
- **Implementation:** `pipelines/pylon/`, `.github/workflows/pylon-intake.yml`, `.github/workflows/validate.yml`, `scripts/validate-data.js`, `worker/worker.js`.

## QA-DEC-027 — Port the exploratory QA loop into `.agents/skills/` + `qa-loop/`

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** The `empty` (working exploratory engine + history) and `enterprise-self-qa` (methodology scaffold) repos are to be retired. What of their "juice" moves into nav-flow-map, and how, without recreating the duplicate-ledger integrity gap?
- **Answer:** Extract the _methodology + durable memory_ and the _browser runner skills_, not the data stores. New `.agents/skills/exploratory-qa/` (open-ended bug hunting, ported from `empty`'s `exploratory-webapp-qa`) and `.agents/skills/desktop-qa-runner/` (deterministic catalog-case execution per architecture plan §7), sharing CDP scripts in `.agents/skills/scripts/`. New `qa-loop/` holds the loop brain: `scope.md`, `change-radar.md`, `heuristics/lenses.md` (evolvable L1–L7), `expectations/{expected-behavior,known-quirks}.md` (the oracle + suppression list), and `memory/{surface-map,backlog}.md`. The surface-map drift diff at end-of-run is the mechanism for automatically catching un-explored/new surfaces. Conflicts resolved per the user: (1) result vocab `passed/failed/skipped/flaky` (+ `blocked`/`inconclusive` for un-runnable cases); (2) bug format = the existing `Bug` object in `app/src/types.ts` / `bugs.json` (BUG-NNN), no second format; (3) IDs = existing `<AREA>-<TYPE><NN>` (SMK|SAN|REG|E2E) per the catalog schema, no new scheme; (4) default env `beta` (`cog-enterprise-qa`), overridable.
- **Rationale:** `empty`'s `coverage.md`/`runs.md`/`Bug.md` markdown ledgers would duplicate the app's canonical `bugs.json`/`runs.json`/`runResults.json` — the exact duplication flagged as an integrity gap in the architecture plan. So only the two artifacts with no canonical home (surface-map, backlog) persist as markdown; everything else writes to the existing stores. Stale tool-specific references (Claude CLI, Jam, Safari, Linear, 1Password, root `/Cognition/CLAUDE.md`) were dropped and re-expressed as Devin-native.
- **Consequences:** `empty` and `enterprise-self-qa` can be archived after this lands. The existing 372-case UI and fixtures are untouched by this PR (additive only). Future: wire the surface-map drift + change-radar into scheduled exploratory runs (architecture plan §11, Phase 5).
- **Implementation:** `.agents/skills/exploratory-qa/`, `.agents/skills/desktop-qa-runner/`, `.agents/skills/scripts/`, `qa-loop/**`, plus README/AGENTS pointers.
