# Playwright agent playbook

Instructions for any LLM/agent working in `tests/playwright/`. This file covers the full loop:

1. [Authoring new automated test cases](#authoring-new-test-cases) (Page Object Model, anti-flakiness rules)
2. [Running the suite and reading reports](#running-the-suite-and-reports)
3. [Post-execution triage](#post-execution-triage) — classify every failure as an app issue or a script issue
4. [Fix PRs for locator drift](#fix-prs-for-locator-drift) — script-side fixes only
5. [Per-run memory](#per-run-memory) — one committed `.md` file per run

Read the root `AGENTS.md` and `tests/playwright/README.md` first. Repo-wide rules (branch + PR,
one concern per PR, prettier gate) apply here too.

## Layout and conventions

```text
tests/playwright/
├── PLAYWRIGHT-AGENT.md   # this file
├── playwright.config.ts  # projects: setup / unauthenticated / authenticated; list+html+json reporters
├── pages/                # page objects — one class per page + barrel index.ts
├── specs/
│   ├── auth.setup.ts     # captures .auth/admin.json storage state (run via `npm run auth`)
│   ├── unauthenticated/  # public pages (login)
│   └── authenticated/    # reuse the saved admin storage state
├── support/              # paths.ts (routes/slugs from env), gmail-otp.ts, gitlab.ts, guardrails-api.ts
├── memory/               # one committed md per agent run (see "Per-run memory")
└── .env                  # local only — never commit
```

- **Catalog is the source of truth.** Every test corresponds to a case in
  `catalog/pages/<page-id>.json`, mirrored in `app/src/data/fixtures/testcases.json`. Test titles
  are `<PREFIX>-<TYPE><NN> — <Title>` (e.g. `SESS-SMK01 — Load cold`), TYPE ∈
  SMK / SAN / REG / E2E. IDs are stable — never renumber. When you automate a case, update its
  catalog entry (`automation.status`, `automation.specPath`) plus the fixtures mirror, and run
  `npm run catalog:validate`. Never mark a case automated unless the spec actually covers it, and
  never hand-edit `navmap-edits.json` (pipeline-owned — changes go through the app's save flow).
- **One spec file per page**, named after the catalog page id: `catalog/pages/e-sessions.json` →
  `specs/authenticated/e-sessions.spec.ts`. A new page under test means a new spec file — never
  append another page's cases to an existing spec.
- **Environment-driven.** `BASE_URL`, slugs, and credentials come from `.env`
  (see `.env.example`) through `support/paths.ts`. Specs guard missing prerequisites with
  `test.skip(condition, "reason")`.

## Authoring new test cases

### Procedure

1. **Explore existing conventions before writing anything.** Read `playwright.config.ts`,
   `pages/base.page.ts`, two or three neighboring page objects and specs, `support/paths.ts`, and
   the barrel `pages/index.ts`. Match these patterns — do not invent a parallel structure.
2. **Read the catalog case fully before writing any code.** Locate the case by ID in
   `catalog/pages/<page-id>.json` and record its title, type, priority, preconditions, steps,
   assertions, cleanup, environment targets, roles, and `executors`. If `executors.playwright` is
   `blocked`, stop and ask the user whether to keep the case manual or relax the blocker. Check
   `linkedBugIds` and `externalReferences` for known behavior. The spec title must match the
   catalog id and title.
3. **Manually reproduce the flow once against the live app** with the correct role/session before
   automating (agent browser, or `npx playwright codegen $BASE_URL` to discover locators — then
   hand-edit them up the priority order below). Note URLs, candidate locators, button/menu text,
   toasts, and loading states; identify every side effect (created item, changed setting, pinned
   org); run the case's cleanup steps and confirm the app returns to the exact pre-action default
   state; note timing concerns (network requests, animations, redirects, OTP/IMAP delays). If the
   app behaves unexpectedly (clicking X lands on Y, surprise logouts, error states not in the
   catalog), report it to the user immediately — do not automate around an unreported issue. When
   the live DOM is unreachable, leave a clearly-commented scaffold with best-guess role/label
   locators and a note on how to confirm them, matching the repo's existing scaffold style.
4. **Model the page as a Page Object** (`pages/<name>.page.ts`) extending `BasePage`:
   - `protected readonly path` comes from `routes` in `support/paths.ts` — add a route helper
     there if missing; never inline URLs.
   - Declare locators as `readonly Locator` fields with a one-line JSDoc each, initialized in the
     constructor. Specs never build their own locators for elements a page object should own.
   - Expose one `async` method per user action or flow (`search(term)`, `openSession(nth)`), so
     specs read as business steps.
   - Export the class from `pages/index.ts`. Add helpers to `support/` only if no existing helper
     covers the need.
5. **Reuse instead of duplicating:**
   - Same action on different targets → one method taking the target `Locator` as a parameter,
     e.g. `openFilterMenu(filter: Locator)` in `pages/sessions.page.ts` serves all four filter
     chips.
   - Same action used by 2+ specs → promote it to a page-object method.
   - Same element spanning pages (nav, org switcher) → model it once in a shared page object and
     compose it, rather than re-declaring locators per page.
   - Never copy-paste an existing test and change only strings — engineer each case from its
     catalog steps.
6. **Build locators in this priority order:**
   1. `getByRole(role, { name })` — mirrors users and assistive tech; survives DOM refactors
   2. `getByLabel` (form fields)
   3. `getByPlaceholder`
   4. `getByText` (non-interactive text)
   5. `getByTestId` — ask devs to add `data-testid` when role/text is ambiguous
   6. `page.locator('css/xpath')` — last resort only
      Prefer regex or `{ exact: true }` names plus chaining/`.filter()` to disambiguate instead of
      `.nth()` indices or structural CSS. Avoid selectors that depend on capitalization or dynamic
      IDs.
7. **Implement one engineered test mapped 1:1 to the catalog case.** Set up the pre-state
   explicitly; execute each catalog step through page-object methods; assert **every** item in
   the case's `assertions` list; if the action mutates state, undo it and verify the default
   state is restored within the same test or a `test.afterEach`/`finally` block. Authenticated
   specs reuse the `setup` project's storage state — unless the case tests the login flow itself,
   which starts from an anonymous context. Shared navigation/seeding goes in `test.beforeEach`.
   Each test must pass alone and in any order.
8. **Assert user-visible outcomes** — text, URL, visibility — with web-first auto-retrying
   assertions: `await expect(locator).toBeVisible()`, `.toHaveText()`, `.toHaveURL()`. Use
   `expect.soft()` for independent checks you want batched. Do not assert CSS classes or DOM
   structure.
9. **Wait on state, never on time.** Locator actions auto-wait; otherwise use `expect(...)`,
   `page.waitForURL(...)`, or `page.waitForResponse(...)`.
10. **Make it idempotent.** The test must run twice back-to-back without manual intervention.
    Generate collision-free test data (run-prefixed names like `RUN_PREFIX` in
    `specs/authenticated/s-secrets.spec.ts`) — never hardcode emails, org names, or slugs that
    can collide across runs. If cleanup is impossible through the UI (e.g. an irreversible
    delete), create and restore baseline data through an API helper
    (`support/guardrails-api.ts` is the precedent) and document why in a short code comment.
11. **Respect the QA safety rules** (`qa-testing/testcases/README.md`): no destructive operations
    on live tenant data without explicit approval; toggle tests revert in the same case; never
    commit screenshots containing live secrets.

### Forbidden

- Writing spec code before reading the catalog case and manually trying the flow.
- `page.waitForTimeout()` or any fixed sleep to "fix" timing. The suite currently has zero — keep
  it that way. `page.pause()` and trial-and-error selectors are equally banned.
- Brittle CSS/XPath chains (`div:nth-child(2) > .x > input`) when a role/label/test-id locator
  works.
- Hardcoded URLs, org slugs, emails, passwords, or tokens in specs or page objects.
- Raw locators or assertions in specs for shared elements a page object should own.
- `{ force: true }` without a comment justifying the actionability quirk it bypasses
  (existing precedent: the secrets dialog overlay, documented in `pages/s-secrets.page.ts`).
- Adding retries, `.or()` fallbacks, or broadened regexes to mask a real flaky selector instead of
  fixing it.
- Weakening any assertion to turn a failing test green (`catalog/README.md` rule).
- Leaving changed state behind because "the next test probably does not care."
- Committing `.env`, `.auth/`, or any credentials.
- Marking a catalog case automated when the spec does not actually cover it.

### Validation before pushing

There is no standalone tsc/ESLint config in this folder; Playwright transpiles the TypeScript at
run time, so errors surface when the spec runs.

```bash
cd tests/playwright
npm run auth                                                            # if storage state is missing/stale
npx playwright test specs/<project>/<page-id>.spec.ts --repeat-each=3   # ≥3 consecutive passes
npx playwright test                                                     # full suite — no regressions
npx playwright test specs/<project>/<page-id>.spec.ts                   # re-run: idempotency + cleanup
cd ../.. && npx prettier --check .                                      # root CI gate
npm run catalog:validate                                                # after updating automation metadata
```

Then update the case's `automation.status`/`automation.specPath` in
`catalog/pages/<page-id>.json` and the `app/src/data/fixtures/testcases.json` mirror — only once
the spec genuinely covers the case.

## Running the suite and reports

```bash
cd tests/playwright
npm install && npx playwright install chromium   # first time
npm run auth                                     # once, to capture .auth/admin.json
npx playwright test                              # full suite
npx playwright test specs/authenticated/e-sessions.spec.ts   # one page
```

Every run produces:

- **Console `list` output** — quick pass/fail per test.
- **HTML report** at `playwright-report/` — open with `npx playwright show-report`.
- **JSON results** at `test-results/results.json` — machine-readable; parse this to build the
  results table for the memory file (`suites[..].specs[..].tests[..].results[..].status`).
- **Traces / screenshots / videos** under `test-results/` for failures — open traces with
  `npx playwright show-trace <path>`.

After **every** agent-driven run — pass or fail — complete the
[post-execution triage](#post-execution-triage) and write a [memory file](#per-run-memory).

## Post-execution triage

For each failure, gather evidence first: the error and stack from `test-results/results.json`, the
failure screenshot, the video, and the trace. Then classify:

| Classification                   | Typical signals                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App issue**                    | Page errors, console errors, 4xx/5xx API responses; element genuinely absent from the DOM; wrong data or behavior while the locator still resolves.                                               |
| **Script issue — locator drift** | Screenshot/trace shows the page rendered and the element visibly present, but the locator resolves 0 elements (role/name/text/attribute changed), or a strict-mode violation from new duplicates. |
| **Script issue — other**         | Bad test assumption (data, ordering, timing), missing `await`, state leakage between tests.                                                                                                       |
| **Infrastructure**               | Auth/OTP failure, network timeouts to the environment, missing env vars.                                                                                                                          |
| **Flaky**                        | Passes on retry or on `--repeat-each` re-run with no code change.                                                                                                                                 |
| **Inconclusive**                 | Cannot determine from evidence — flag for a human.                                                                                                                                                |

This maps to the triage taxonomy in `catalog/README.md` (product regression, test drift,
intentional change, infrastructure, flakiness, inconclusive).

Decision checklist, in order:

1. Did the page load at all (trace/screenshot)? No → app issue or infrastructure.
2. Is the element visually present but the locator resolves nothing? → script issue (locator
   drift). Confirm by inspecting the DOM snapshot in the trace for the changed attribute/text.
3. Does the element exist and match, but behavior/data is wrong? → app issue.
4. Re-run the single failing test. Passes now? → flaky; note it, do not silently retry-mask.
5. Still unsure → inconclusive; record what was checked and stop.

Hard rules:

- **Never weaken assertions** to get green — no loosened regexes, no removed checks, no
  unconditional skips.
- **App issues are reported, never patched around.** Record them in the memory file, tell the
  user, and leave the test failing — a red test on a real regression is doing its job.
- A confirmed **intentional product change** is handled as a script fix (update locators or
  expected values to the new intended behavior) and must cite the change in the PR body.

## Fix PRs for locator drift

Only script-side failures get automatic fix PRs. Scope: locator drift and clear script bugs.

1. Branch from the current default branch: `fix/playwright-<page-id>-locators`
   (e.g. `fix/playwright-e-sessions-locators`). Never commit to `main` (root `AGENTS.md`).
2. Fix in the **page object**, not the spec, so every spec inherits the repair. Keep the locator
   priority order — replace a broken locator with the best available option, not the quickest.
3. Keep the diff scoped to the affected page object/spec. One concern per PR; never renumber or
   edit unrelated test cases.
4. Validate: the affected spec passes `--repeat-each=3`, and `npx prettier --check .` is green at
   the root.
5. Open the PR following `.github/pull_request_template.md`. The body must include:
   - failed test IDs and the run date;
   - root cause (what changed in the app DOM);
   - an old → new locator table;
   - evidence references (report/trace paths, screenshot description);
   - a link to the run's memory file.
6. App issues never get PRs from this workflow — they are only reported.

## Per-run memory

One committed markdown file per agent run, in `tests/playwright/memory/`:

```text
memory/YYYY-MM-DD-HHmm-<scope>.md      # scope = page id, spec name, or "full-suite"
```

Do not put secrets, tokens, OTP contents, or raw storage state in memory files. Reference
screenshots/traces by path — never commit the binaries.

Template:

```markdown
# Run memory — YYYY-MM-DD HH:mm — <scope>

## Run metadata

| Field    | Value                                   |
| -------- | --------------------------------------- |
| Date     | YYYY-MM-DD HH:mm (timezone)             |
| Agent    | <model / agent and version>             |
| Trigger  | <user request / scheduled / post-merge> |
| Command  | `npx playwright test …`                 |
| Base URL | <host only, no credentials>             |
| Scope    | <spec files run>                        |

## Results

| Total | Passed | Failed | Flaky | Skipped |
| ----- | ------ | ------ | ----- | ------- |
| n     | n      | n      | n     | n       |

## Failure triage

| Test ID    | Error (short)               | Classification         | Evidence                                  | Action |
| ---------- | --------------------------- | ---------------------- | ----------------------------------------- | ------ |
| SESS-REG01 | locator resolved 0 elements | script — locator drift | trace: chip renamed "Archived" → "Status" | PR #NN |

## Actions taken

- PRs opened: <links, or "none">
- App issues flagged: <test IDs + one-line description, or "none">
- Quarantine / skip recommendations: <or "none">

## Learnings for next run

- <locator patterns that changed, env quirks, data assumptions, timing notes>
```

Keep entries factual and short — this folder is the durable run history that future agents read
before their next run. Before running the suite, skim the most recent memory files for known
issues and open PRs so you do not re-triage the same failure.
