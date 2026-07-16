---
name: author-playwright-from-catalog
description: >
  Author verified Playwright specs from the nav-flow-map QA catalog. Use this
  skill when asked to automate QA cases in Playwright, generate Playwright
  specs from the catalog, or turn catalog case IDs into browser tests.
---

# Author Playwright specs from the catalog

Turn selected nav-flow-map catalog cases into small, deterministic, reusable
Playwright tests. Playwright is the only execution engine for this workflow;
do not use desktop testing, Chrome CDP, or the historical exploratory-browser
skill.

This skill authors specs and their automation metadata. Per-case execution
results belong in `qa-testing/results.json`, and human-readable run summaries
belong under `runs/`; those files are populated by the run/CI flow rather than
by the authoring step.

## 1. Source of truth and repository map

Work from the monorepo root. The source of truth is the nav-flow-map catalog:

- `testcases.js`
- `qa-testing/testcases/*.md`

Each case has six canonical fields: `id`, `type`, `pri`, `reach`, `steps`, and
`expected`. Do not add execution metadata to those case objects or rewrite the
catalog to add a test.

Resolve a case to the application in this order:

1. Match the case ID prefix (for example, `PREF` in `PREF-SMK01`) to the
   `prefixes` entry in `BASE_PAGES` in `index.html`.
2. Read that page's route and navigation context from `BASE_PAGES`.
3. Use the existing matching page object/component under
   `playwright/tests/pages/` or `playwright/tests/components/`.
4. If the POM lacks a needed locator, inspect the live app with the
   Playwright MCP and add stable role-, label-, text-, or test-id-based
   locators to the POM. Do not substitute brittle CSS chains merely to get a
   test passing.

The catalog case ID is the single test identity namespace. The former
ad-hoc `ENT-xxx` labels are being replaced by catalog IDs:

| Legacy label | New identity |
|---|---|
| `ENT-006` | The corresponding catalog ID, once identified |
| `ENT-xxx` in titles/comments | `[AREA-SMK01]`, `[AREA-SAN01]`, etc. |

If no catalog case can be identified for a legacy label, do not invent a
replacement ID. Record the mapping question for the lead.

## 2. Select a deterministic scope

Accept any combination of:

- explicit case IDs;
- an ID prefix/area such as `PREF`;
- suite/type such as `Smoke` or `Sanity`;
- priority such as `P0` or `P1`.

If the requester gives no scope, select deterministic, non-destructive
coverage using only P0/P1 Smoke and Sanity cases. Use the helper to inspect
the selection without modifying source files:

```bash
node .agents/skills/author-playwright-from-catalog/scripts/select-cases.mjs \
  --suite Smoke,Sanity --priority P0,P1
```

Sort selected cases by catalog order, then group them by page/area. Avoid
silently broadening scope. Report excluded cases and why they are
manual-only, destructive, blocked, or outside the requested filters.

## 3. Authoring rules

Create one spec per area:

```text
playwright/tests/<area>.spec.ts
```

Every test title must contain its exact catalog ID in brackets, and every test
must carry a suite tag:

```ts
test('@smoke loads preferences [PREF-SMK01]', async ({ page }) => {});
test('@sanity preserves the selected option [PREF-SAN01]', async ({ page }) => {});
```

Use the existing Playwright fixtures, POMs, components, and the configured
admin `storageState`. Keep tests serial and focused on one catalog case.
Translate the catalog's `steps` into observable interactions and assert the
catalog's `expected` result. Prefer accessible roles, labels, and visible
text; keep locators in the relevant POM rather than scattering selectors
through specs.

For stateful cases, read the original value, change it, save, reload, assert
the persisted value and dependent UI, then restore the original value in the
same test. Use `try/finally` for cleanup when a failure could leave state
changed.

Do not author real case specs when the required authenticated environment is
unavailable. A spec that has not run successfully against the admin session is
not ready for automation metadata. This PR ships only the reusable skill and
template; later sessions with credentials author and verify actual specs.

## 4. Safety rubric

Treat these as hard stops. If a case requires one, mark it `manual-only` and
do not automate it without explicit human confirmation:

- never delete organizations, workspaces, sessions, users, or memberships;
- never remove real user accounts or send invites/messages to real addresses;
- never change billing plans, ACU limits, or other production-connected
  commercial settings;
- never rotate, delete, expose, or print secrets/API keys;
- never save, enable, disable, or otherwise change SSO/SAML on an organization
  with active users;
- never push test code or data to a production-connected repository;
- never create throwaway orgs/automations or alter shared integrations without
  explicit approval;
- always revert any setting toggled by a test within that same test.

Use the safety rubric in the historical exploratory QA skill §8 and
`enterprise-self-qa/scope.md` as the source policy. When a case is ambiguous,
stop and flag it rather than guessing that an action is safe.

## 5. Idempotency and write-back

Before creating a file, search for existing automation metadata and spec
coverage:

```bash
rg -n '"PREF-SMK01"|PREF-SMK01' qa-testing/automation.json playwright/tests
```

If `qa-testing/automation.json` already contains the case with an `automation`
spec path, update that spec rather than creating a duplicate. Preserve
unrelated mappings and use the exact path format:

```json
{
  "PREF-SMK01": {
    "state": "automated",
    "spec": "playwright/tests/preferences.spec.ts"
  }
}
```

Only write `"state": "automated"` after the targeted spec has run green with
the authenticated admin session:

```bash
cd playwright
npx playwright test tests/preferences.spec.ts
```

Cases requiring destructive or human-only actions receive:

```json
{ "state": "manual-only" }
```

Do not claim automation for skipped, blocked, or unverified tests. Keep
`results.json` and `runs/` updates in the execution/reporting flow so the
dashboard reflects actual runs rather than authoring intent.

## 6. Verification gate and close-out

For each authored area:

1. Run the narrow spec, then the requested scope.
2. Confirm every test title includes a catalog ID and suite tag.
3. Confirm no test performs a denylisted action and cleanup is reliable.
4. Update `qa-testing/automation.json` only for green tests.
5. Run the relevant Playwright list/type/lint checks and inspect the diff.

At close-out, summarize selected IDs, spec files, POM changes, skipped or
manual-only cases, and verification output. The session then opens a PR into
the monorepo containing the new specs and `automation.json` updates. Do not
include credentials or live secret values in code, logs, screenshots, or the
PR.
