# Unified QA Platform — Architecture and Implementation Plan

## 1. Core facts

1. `nav-flow-map` is already the closest thing to a quality control plane:
   - 36 mapped pages;
   - 372 unique testcases;
   - 17 tracked bugs;
   - a UI for browsing/editing pages, cases, and bugs;
   - a Worker that saves edits and starts Devin promotion sessions.
2. `empty` contains the strongest working QA behavior:
   - the interactive rule is change → save → reload → verify → restore;
   - a reusable exploratory QA skill;
   - run, coverage, bug, backlog, script, and evidence history.
     It is primarily an execution workspace and historical archive, not a distinct product.
3. `playwright-enterprise-qa` has useful foundations:
   - TypeScript Playwright;
   - OTP login and reusable storage state;
   - page objects;
   - GitHub Actions.
     Its only product spec is currently skipped, so zero catalog cases are active automated regressions.
4. `enterprise-self-qa` is only a methodology scaffold. Its useful heuristics and templates can
   be copied; it does not need to remain an active repository.
5. The existing catalog has integrity and governance gaps:
   - testcase definitions are duplicated between Markdown and `testcases.js`;
   - pages are embedded in `index.html`;
   - `BUG-015` references missing `DEVIN-REG07`;
   - `BUG-012` references missing `PREF-REG05`;
   - My Analytics has no linked cases;
   - README says 220 cases while the current catalog contains 372;
   - the Worker is unauthenticated and commits directly to `main`.
6. The current organization has GitHub and Slack integrations installed, plus Playwright and
   Notion MCP. No Pylon MCP is installed and no Devin Automations currently exist.
7. Devin Automations support schedules, GitHub/Slack events, and authenticated custom webhook
   triggers. They are a better operational boundary than creating ad hoc API sessions from every
   failing test.
8. Pylon provides an Issues API and configurable webhooks. A Pylon MCP is not required for the
   proposed workflow.
9. Playwright can replace repeated deterministic execution, but not all exploratory/manual cases
   should become Playwright tests.
10. High-frequency run data, screenshots, videos, and traces should not be committed to Git
    indefinitely. One code repository does not mean every runtime artifact must live in Git.

## 2. Decision

Use **one repository**, with separate modules inside it.

The proposed second repository (`empty`) is an execution process that is used to bootstrap and
maintain automation. The proposed third repository (Playwright) is a test implementation module.
Neither needs an independent repository boundary today.

Keep `nav-flow-map` as the initial repository and evolve it into the unified platform. Renaming it
can happen later; renaming immediately would disrupt GitHub Pages and the current Worker.

Use multiple repositories only if one of these becomes true:

- different teams own the catalog/UI and automation suite;
- access permissions must be separated;
- release schedules are independently managed;
- the Playwright suite becomes large enough to require independent CI infrastructure.

Until then, multiple repositories create more problems than they solve: cross-repo ID drift,
non-atomic changes, API coordination, duplicated metadata, and unclear ownership.

## 3. Important nuance: one repo, hybrid storage

Store **definitions and executable code** in Git:

- pages;
- testcase contracts;
- automation code;
- runner skills;
- bug links and external references;
- schemas and configuration.

Store **high-volume operational data** outside Git:

- run records and per-attempt statuses in Cloudflare D1;
- screenshots, videos, Playwright traces, and reports in R2;
- GitHub Actions artifacts may be used initially, but they expire and are awkward for a live UI;
- customer/support content remains in Pylon, with only sanitized references and classifications
  copied into the QA platform.

This keeps one source repository without turning Git history into a growing test-results database.

## 4. Proposed repository structure

```text
nav-flow-map/
  apps/
    nav-flow/                       # Current UI, evolved into the QA dashboard

  catalog/
    pages.yaml                      # Routes, parents, ownership, risk tags
    cases/
      auth.yaml
      composer.yaml
      enterprise-devin.yaml
      ...
    bugs.yaml                       # IDs + links; external trackers remain authoritative
    schema/
      page.schema.json
      case.schema.json
      bug.schema.json

  agents/
    skills/
      desktop-qa-runner/SKILL.md
      exploratory-qa/SKILL.md
      failure-triage/SKILL.md
      pylon-ticket-triage/SKILL.md
    prompts/

  tests/
    playwright/
      auth/
      pages/
      specs/
      fixtures/
      playwright.config.ts

  packages/
    catalog/                        # Loader, schema validator, selectors
    runner-contract/                # Run/result/triage types
    action-recorder/                # Semantic transcript from a Devin run
    result-client/                  # D1/R2 result submission

  services/
    worker/
      catalog-api/                  # Authenticated catalog PR operations
      run-api/                      # D1 run/result operations
      artifact-api/                 # Signed R2 uploads/downloads
      pylon-ingest/                 # Signature check, redaction, dedupe

  .github/workflows/
    catalog-validate.yml
    playwright-deploy-gate.yml
    playwright-nightly.yml
    failure-triage.yml
    pages.yml

  scripts/
    qa-select.ts
    qa-run.ts
    catalog-generate.ts
    catalog-validate.ts
    automation-coverage.ts
```

Do not reorganize the current UI on the first day. Introduce these boundaries incrementally while
keeping GitHub Pages working.

## 5. Canonical testcase contract

Every case needs enough structure for both Devin and Playwright:

```yaml
id: DEVIN-REG01
page_id: e-devin
title: Ultra setting persists after reload
type: regression
priority: P1
risk_tags: [persistence, configuration]
cadence: nightly
owner: enterprise-settings

preconditions:
  roles: [enterprise-admin]
  environment: beta
  fixtures: []

steps:
  - Open Enterprise settings > Devin
  - Record the current Ultra setting
  - Change Ultra and save
  - Reload the page

assertions:
  - Save succeeds without a 4xx response
  - The selected value persists after reload

cleanup:
  - Restore the recorded value
  - Reload and verify the original value

execution:
  allowed: [devin, playwright]
  state_change: reversible
  approval_required: true

automation:
  status: candidate
  spec_path: null
  last_verified_at: null

source:
  kind: exploratory
  external_id: null
```

Add `cadence` rather than using priority as the run selector. Currently 279 of 372 cases are P1,
so priority cannot define a useful small deploy gate.

Recommended automation states:

```text
manual
  → desktop_verified
  → candidate
  → implementation_pr
  → active
  → quarantined
```

The latest run and pass rate are derived from D1, not edited into the testcase definition.

## 6. End-to-end operating loop

```text
                        ┌─────────────────────┐
                        │ Canonical catalog   │
                        └──────────┬──────────┘
                                   │ select by cadence/change/risk
                         ┌─────────┴─────────┐
                         │                   │
                 automated cases      adaptive/manual cases
                         │                   │
                 Playwright CI       Devin Desktop runner
                         │                   │
                         └─────────┬─────────┘
                                   │
                             Run/result API
                                   │
                         Nav Flow dashboard
                                   │
                         failed/inconclusive?
                                   │
                        Devin triage automation
                    ┌──────────────┼──────────────┐
                    │              │              │
              product bug     test drift      infra/flaky
                    │              │              │
             bug + notify     test-fix PR    retry/quarantine
```

### Case selection

- deploy gate: a curated 10–20 stable cases;
- nightly: all active deterministic Playwright cases;
- affected-change run: changed page plus neighboring navigation/state cases;
- weekly: rotating desktop exploratory areas and risk lenses;
- on demand: selected page, IDs, suite, or bug regression set.

## 7. Devin Desktop runner

Port the useful behavior from `empty` into `agents/skills/desktop-qa-runner`.

The runner must:

1. Receive explicit case IDs and a target environment.
2. Load the canonical case contract.
3. Verify role, fixture, safety, and approval preconditions.
4. Use the authenticated Desktop Chrome.
5. For mutable settings:
   - record the original value;
   - change and save;
   - reload and verify;
   - restore;
   - reload and verify cleanup.
6. Record expected versus actual results.
7. Upload evidence and write an immutable result.
8. Never edit the testcase definition during execution.
9. Mark a case `blocked` or `inconclusive` rather than guessing.

Do not run 372 cases in one Devin session. The orchestrator should shard 10–20 cases by page and
state domain, then aggregate child-session results.

### Reusable automation transcript

While Devin exercises a candidate case, capture a semantic action transcript:

```json
[
  { "action": "navigate", "route": "/settings/enterprise-devin" },
  { "action": "click", "locator": { "role": "switch", "name": "Ultra" } },
  { "action": "click", "locator": { "role": "button", "name": "Save" } },
  { "action": "reload" },
  { "assert": "checked", "locator": { "role": "switch", "name": "Ultra" } }
]
```

This is the "base" for Playwright. It prevents a later session from rediscovering the flow, but it
is not automatically trusted as a finished test. Devin converts it into an idiomatic TypeScript
spec with fixtures, assertions, cleanup, and stable locators, then opens a PR.

## 8. What should become Playwright

Automate a case only when it is:

- deterministic;
- repeatable;
- safe or reliably reversible;
- supported by stable setup/cleanup;
- valuable enough to justify maintenance;
- objectively assertable.

Keep these with Devin/human execution:

- visual-quality judgment;
- open-ended exploration;
- destructive billing/security actions without isolated fixtures;
- CAPTCHA or hardware/device-specific checks;
- rapidly changing experimental UI;
- ambiguous expected behavior.

Therefore, the goal is not “automate every case Devin ran.” The goal is “automate every stable,
valuable case so Devin is reserved for change, ambiguity, and exploration.”

Every Playwright title must include the catalog ID:

```ts
test("[DEVIN-REG01] Ultra setting persists after reload", async ({ page }) => {
  // implementation
});
```

CI must fail if:

- an `active` automation ID is absent from the Playwright test list;
- Playwright references an unknown ID;
- multiple specs claim the same ID;
- the catalog case lacks cleanup or environment metadata;
- a bug references a missing case or page.

## 9. Playwright failure triage

Do not automatically modify a failing test so that it passes. That can silently erase a real
regression.

Use this state machine:

1. Playwright fails and retains trace, screenshot, video, console, and network evidence.
2. Retry once in a clean context.
3. Generate a failure fingerprint from:
   - testcase ID;
   - failed assertion;
   - normalized error;
   - route;
   - environment.
4. If the same fingerprint maps to an open known bug, update its occurrence count without starting
   another Devin session.
5. Otherwise, GitHub Actions sends a normalized payload to a Devin Automation webhook.
6. Devin reads the evidence and reproduces only the failed case in Desktop mode.
7. Classify:

| Classification             | Action                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| Product regression         | Create/update bug, preserve test, notify Slack                    |
| Selector/test drift        | Open Playwright maintenance PR, rerun                             |
| Intentional product change | Require linked product decision; update catalog first, then spec  |
| Environment/auth/fixture   | Mark infrastructure failure; do not file product bug              |
| Flaky/timing               | Record flake, improve synchronization, quarantine after threshold |
| Inconclusive               | Notify with evidence; do not self-heal                            |

Only test implementation may be automatically proposed. Expected behavior must not change without
an explicit catalog/product decision.

Use Devin Automations rather than raw one-off session creation because Automations provide:

- webhook secrets;
- rate limits and invocation windows;
- a consistent prompt and repository selection;
- Slack notification support;
- managed schedules;
- easier auditing.

## 10. Sanity and regression runs

### On-demand

The Nav Flow UI provides **Run** actions for a page, selected IDs, or a named suite.

The run service:

1. creates a D1 run record;
2. splits selected cases by executor;
3. dispatches Playwright via GitHub Actions `workflow_dispatch`;
4. invokes the Desktop QA Devin Automation for non-automated cases;
5. aggregates results in the UI.

### Scheduled

- every deployment: deploy-gate Playwright suite;
- nightly: deterministic regression;
- weekly: sharded Devin exploratory run;
- monthly: stale-case review and automation health audit.

## 11. Exploratory testing loop

The exploratory skill should not merely execute catalog cases. It should combine:

- changed surfaces from release notes/changelog;
- pages with stale or missing coverage;
- recent flaky or failed areas;
- open Pylon themes;
- rotating heuristics: permissions, persistence, validation, tenant isolation, errors,
  accessibility, and state transitions.

When Devin finds something:

1. reproduce it;
2. distinguish bug, known quirk, intended behavior, and testability gap;
3. create/update the bug record;
4. create a regression case;
5. assign an executor and automation eligibility;
6. generate a Playwright candidate only if deterministic;
7. notify only after confirmation.

“Devin cannot do it” must be recorded with a reason:

- missing role/account;
- unsafe/destructive;
- external dependency;
- no deterministic assertion;
- device/hardware requirement;
- product behavior undefined;
- missing fixture/setup API.

That reason tells you whether to build a fixture, use Playwright/API automation, leave it manual,
or clarify expected behavior.

## 12. Pylon customer-ticket loop

Pylon supports both an Issues API and webhooks. Use a controlled intake rather than creating a
Devin session for every customer message.

Recommended flow:

```text
Pylon issue tagged product-bug-candidate
  → Pylon webhook
  → pylon-ingest Worker
  → verify signature/custom auth
  → redact secrets and customer PII
  → dedupe/cluster
  → Devin Automation
  → reproduce in QA tenant
  → confirmed bug?
       yes → bug + catalog case + optional Playwright PR
       no  → support/config/docs classification
```

Guardrails:

- do not copy raw ticket content into Git;
- store Pylon ID/URL and a sanitized summary;
- batch low-severity tickets nightly to reduce ACU use;
- trigger immediately only for high severity or repeated fingerprints;
- cluster duplicates before reproduction;
- do not create a Playwright test from a ticket until the defect is reproduced and expected
  behavior is known.

Slack is already installed in the organization, so confirmed results can be posted to a dedicated
quality channel. Pylon itself does not need to be an MCP if its webhook/API feeds the normalized
triage payload.

## 13. Nav Flow UI as the control plane

Each graph node should eventually show:

- total cases;
- manual versus automated coverage;
- latest result;
- pass rate;
- stale coverage;
- open bugs;
- Pylon escapes;
- automation health;
- last exploratory run.

Add views for:

- Runs;
- Triage queue;
- Automation candidates;
- Flaky/quarantined tests;
- Customer escapes;
- Missing/stale coverage.

The current UI edit path must change from unauthenticated direct-to-main commits to:

```text
authenticated edit → schema validation → branch/PR → CI → merge → generated UI
```

Run result ingestion writes to D1 and does not create a source-control PR.

## 14. Cost controls

Playwright saves Devin ACUs only if the automation is reliable. A large brittle suite merely moves
cost from execution to constant maintenance.

Controls:

- trigger Devin triage only after a clean retry fails;
- dedupe known failure fingerprints;
- apply automation invocation limits;
- shard only affected manual cases;
- run broad exploration on a rotating schedule;
- keep the deploy gate intentionally small;
- batch low-severity Pylon tickets;
- track Playwright flake rate and maintenance time;
- retire low-value cases.

## 15. Migration plan

### Phase 0 — freeze and decide

- Use `nav-flow-map` as the consolidation base.
- Make `empty`, `enterprise-self-qa`, and `playwright-enterprise-qa` read-only after migration.
- Preserve them as archives; do not copy their accumulated evidence into active Git history.
- Write an architecture decision record for the one-repo/hybrid-storage model.

Exit criterion: one agreed repository and ownership model.

### Phase 1 — canonical catalog and safety

- Add the YAML/JSON schema.
- Convert all 372 cases and 36 pages.
- Generate the UI's testcase/page data from the catalog.
- Add validators for IDs, mappings, references, duplicates, and generated drift.
- Fix the known broken references and stale documentation.
- Authenticate the Worker.
- Replace direct-to-main promotion with PR creation.

Exit criterion: one editable source; invalid catalog changes cannot merge.

### Phase 2 — import the Playwright foundation

- Move the useful Playwright auth, page objects, config, and workflow under `tests/playwright`.
- Normalize testcase IDs to the canonical Nav Flow IDs.
- Establish dedicated QA accounts and isolated fixtures.
- Select and implement a 10–20 case deploy gate.
- Publish results to the run API and surface them in Nav Flow.

Exit criterion: on-demand and CI deploy-gate results are visible by testcase ID.

### Phase 3 — import and harden the Devin runner

- Port the exploratory skill from `empty`.
- Add the canonical case loader, safety checks, evidence uploader, and immutable result writer.
- Add semantic action transcripts.
- Pilot the nine Devin-settings cases.
- Generate two Playwright candidate PRs from successful runs.

Exit criterion: selected cases run from catalog → Desktop → UI result → Playwright candidate.

### Phase 4 — failure triage automation

- Create a custom-webhook Devin Automation.
- Add retry, evidence collection, fingerprints, and dedupe to GitHub Actions.
- Implement the classification state machine.
- Post confirmed product failures to a Slack quality channel.
- Test the pipeline with seeded product, selector, fixture, and flaky failures.

Exit criterion: a Playwright failure is classified correctly without masking regressions.

### Phase 5 — exploratory scheduling

- Add changed-surface selection.
- Schedule rotating weekly exploratory runs.
- Add coverage-staleness and risk dashboards.
- Create candidate cases from confirmed discoveries.

Exit criterion: Devin spends ACUs mainly on new risk, changed areas, and ambiguity.

### Phase 6 — Pylon intake

- Configure a Pylon trigger/webhook for tagged candidate defects.
- Build signature verification, redaction, dedupe, and batching.
- Reuse the same triage/reproduction pipeline.
- Track customer escapes and regression conversion.

Exit criterion: a confirmed Pylon defect produces a linked bug, regression case, and—when
appropriate—a Playwright PR.

## 16. First vertical slice

Do not migrate everything and then try to prove it works. Pilot one page end to end:

**Enterprise settings → Devin**

1. Convert its nine cases to the canonical schema.
2. Run them with the Desktop runner.
3. Store results/evidence outside Git.
4. Mark stable cases as automation candidates.
5. Implement two Playwright cases.
6. Deliberately break a selector and validate test-drift triage.
7. Deliberately change expected behavior in a test environment and validate product-regression
   triage.
8. Display all statuses in Nav Flow.

If that vertical slice works, scale by page and risk.

## 17. Metrics

Measure outcomes, not raw testcase count:

- deploy-gate duration and reliability;
- Playwright flake rate;
- percentage of cases with explicit cleanup;
- manual/automated coverage by page and risk;
- time from failure to classification;
- confirmed regressions caught before customers;
- Pylon customer escapes by area;
- escape-to-regression conversion rate;
- stale cases not verified within their cadence;
- Devin ACUs spent per confirmed issue.

## Final recommendation

Build a **single QA platform repository** with:

- Nav Flow as the UI/control plane;
- one canonical catalog;
- the `empty` skill converted into an internal Desktop runner;
- Playwright as an internal execution module;
- Devin Automations for triage and scheduled adaptive work;
- Pylon webhooks for sanitized customer-defect intake;
- D1/R2 for mutable run data and evidence.

The crucial guardrail is:

> Playwright failures may automatically trigger investigation and a test-maintenance PR, but the
> system must never automatically weaken or rewrite expected behavior just to make a failing test
> pass.
