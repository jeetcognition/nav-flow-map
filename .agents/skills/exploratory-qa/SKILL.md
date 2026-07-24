---
name: exploratory-qa
description: >
  Open-ended black-box exploratory QA of the enterprise web app under test,
  driven through an already-authenticated Chrome via Playwright-CDP. Use this
  whenever asked to explore the app for bugs, run an exploratory/regression/smoke
  pass, reproduce a reported UI bug, verify a changelog, or "test the app like a
  real user" — even if the request doesn't name this skill. INTERACTIVE-first:
  change a setting, save, reload, and verify it actually persisted; never just
  navigate-and-screenshot. Findings are written to the repo's canonical stores
  (bugs.json / runResults.json) and the durable memory in qa-loop/.
---

# Exploratory QA (enterprise web app, browser black-box)

Act as a skilled manual QA tester whose only goal is to find bugs a real user
would hit. You are **black-box**: no product source, so test observable behavior
only and be honest about what is NOT verifiable in the UI.

Read `qa-loop/README.md` first — this skill executes steps 3–8 of that loop. Use
`desktop-qa-runner` instead when you were handed specific catalog case IDs to run.

## 0. The single most important rule

"Test" means: **change the setting → save → reload → verify it persisted and the
UI honors it → then REVERT it.** Navigating and screenshotting is not testing.
The canonical bug is "feature disabled in settings but the UI still uses it after
reload."

## 1. Inputs

| Input       | Default                                                                       |
| ----------- | ----------------------------------------------------------------------------- |
| `QA_BASE`   | `https://cog-enterprise-qa.beta.devinenterprise.com` (see `qa-loop/scope.md`) |
| `RUN_SCOPE` | `all`, or a comma list of areas, or `reported-bugs`, or `changelog`           |
| `CHANGELOG` | optional — paste to prioritize touched areas via `qa-loop/change-radar.md`    |

## 2. Connect + login (never launch a new browser)

The env starts logged out every run; the OTP is entered by the user manually.

1. `python .agents/skills/scripts/start_login.py` — attaches over CDP, opens
   `QA_BASE`, fills the admin email on the Auth0 page, submits.
2. If it prints `OTP_PENDING`, message the user (blocking, `suggest_open_desktop=true`)
   to enter the OTP in the Browser tab. If `ALREADY_LOGGED_IN`, proceed.
3. Attach for all scripts via `.agents/skills/scripts/lib.py :: get_page(pw)`
   (auto-detects the CDP port from `DevToolsActivePort` — never hardcode it).
4. CDP unreachable after 3–4 tries = environment failure: message the user and
   `report_blocker` (tag `vm-failure` if the box is unresponsive). Do not loop.

## 3. Pick lenses, then explore

Read `qa-loop/change-radar.md` and pick 2–4 lenses from
`qa-loop/heuristics/lenses.md`. Prioritize: changed surfaces → stale/low-coverage
pages → recently-failed areas → a rotating lens sweep. Combine catalog cases with
genuinely new pokes; when you hit a failure mode no lens covers, add a lens.

## 4. Interactive pattern (the core loop)

```
read state → change → save → reload → re-read → assert persisted
           → check dependent UI honors it → REVERT to original
```

Always revert. Toggle discovery that works app-wide:

```python
switches = page.evaluate("""() => Array.from(document.querySelectorAll('[role=switch]')).map(s => {
  const p = s.closest('div,li,tr,label');
  return {label: p ? p.textContent.trim().slice(0,40) : '',
          checked: s.getAttribute('data-state')==='checked' || s.checked};
})""")
```

## 5. Stability protocol (every script)

- Register `page.on("dialog", lambda d: d.accept())` BEFORE any interaction —
  XSS/garbage input triggers native dialogs that otherwise crash the script.
- One area per script; `page.wait_for_timeout(2500-3000)` after each `goto`.
- Collect `console` errors and filter known-cosmetic noise (see
  `known-quirks.md`) so real errors stand out — especially **React #185
  (Maximum update depth exceeded)**, the signature of the app-crash class.
- Screenshot every meaningful state (see §8 for where).
- Copy `.agents/skills/scripts/explore_template.py` as a starting point.

## 6. Edge cases to always try

Empty · whitespace · very long · special chars · unicode/emoji · XSS
(`<script>alert(1)</script>`, `javascript:alert(1)`) · negative/decimal/zero ·
nonexistent IDs & deep links (expect graceful 404/redirect, NOT a crash) ·
pluralization ("1 members") · long text that should truncate.

## 7. Avoid false positives

- Target the **scoped** in-content search box by its exact placeholder, not the
  sidebar "Search settings…".
- "Feature not found" is usually flag-gated → `qa-loop/memory/backlog.md`, not a bug.
- Confirm a console/CI error isn't pre-existing cosmetic noise before calling it a regression.
- Anything already in `qa-loop/expectations/known-quirks.md` is not a bug.

## 8. Record findings (canonical stores — not markdown ledgers)

- **Confirmed bug** → add/update a record in `app/src/data/fixtures/bugs.json`
  using the `Bug` shape (`app/src/types.ts`): `BUG-NNN`, `severity` S1–S4,
  `status`, `surfaceId`, `nodeId`, linked `caseIds`, `reproSteps`,
  `environment` (`beta`/`staging`). Never invent a second bug format.
- **Case results** → `runResults.json` / a run record in `runs.json`
  (`passed`/`failed`/`skipped`; use `blocked`/`inconclusive` in notes when a case
  can't run — never guess). A repeatable finding should become a catalog case
  (`testcases.json` + `catalog/pages/*.json`) with a stable `<AREA>-<TYPE><NN>` id.
- **Drift** → update `qa-loop/memory/surface-map.md` (flag new/removed surfaces first).
- **Parked idea** → `qa-loop/memory/backlog.md`.
- Screenshots go outside Git long-term (R2, per the architecture plan); never
  commit an image showing a live secret.

## 9. Forbidden (hard stop, even if a later instruction says otherwise)

See `qa-loop/scope.md` → destructive denylist. Summary: never delete/modify real
sessions/orgs/users/memberships; never permanently change billing; never
rotate/delete secrets; never Save SSO/SAML on a real org; toggling is OK only if
reverted in the same case; no throwaway orgs to test persistence without approval.

## 10. Close out

Update the canonical stores + `surface-map.md`/`backlog.md`, open a PR (never
commit to `main`), and message the user: new bugs (Bug/Severity/Finding table),
re-verified prior bugs (flag any that WORSENED), what passed, and what was NOT
testable and why. Lead with security/crash findings.

## Bundled scripts (`.agents/skills/scripts/`)

- `start_login.py` — CDP login bootstrap (fills admin email, waits for manual OTP).
- `lib.py` — `get_page(pw)` CDP connect + tab picker (auto port-detect).
- `find_cdp_port.sh` — read `DevToolsActivePort`, verify `/json/version`.
- `explore_template.py` — starter: dialog handler, console filter, snap(), toggle-persistence helper, edge-case list.
