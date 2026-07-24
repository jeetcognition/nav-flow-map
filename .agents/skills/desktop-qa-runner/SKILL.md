---
name: desktop-qa-runner
description: >
  Deterministic executor for specific catalog test-case IDs against the
  enterprise web app, through an already-authenticated Chrome via Playwright-CDP.
  Use this when you are handed explicit case IDs (e.g. DEVIN-REG01) and a target
  environment and must run them exactly as written and record pass/fail/skip
  results — as opposed to open-ended bug hunting (use `exploratory-qa` for that).
---

# Desktop QA runner (catalog case execution)

Runs named catalog cases faithfully and records immutable results. It does NOT
explore, improvise, or edit the case definition during execution. Read
`qa-loop/README.md` for how this fits the loop, and `qa-loop/scope.md` for
environments and the destructive denylist.

## Inputs

- **Case IDs** — one or more `<AREA>-<TYPE><NN>` ids (TYPE ∈ SMK|SAN|REG|E2E).
- **Environment** — `beta` (default) or `staging`.

## Procedure (per the architecture plan §7)

1. Load each case contract from `catalog/pages/*.json` (fall back to
   `app/src/data/fixtures/testcases.json`).
2. Verify preconditions: role, fixture/test data, safety, approval. If unmet,
   mark the case `blocked` with the reason — never guess a result.
3. Connect to the authenticated Chrome via `.agents/skills/scripts/lib.py`
   (`get_page(pw)`; auto port-detect). Bootstrap login with `start_login.py` if
   logged out (manual OTP — never fetched).
4. Execute the steps exactly. For a mutable setting, follow the reversible loop:
   record original → change → save → reload → verify → **restore** → reload → verify cleanup.
5. Record expected vs actual and a `passed`/`failed`/`skipped` result (plus
   `blocked`/`inconclusive` when applicable) into `runResults.json` and a
   `runs.json` record; open/update the linked `BUG-NNN` in `bugs.json` on failure.
6. Register `page.on("dialog", lambda d: d.accept())` before interacting; filter
   cosmetic console noise; screenshot each meaningful state (evidence → outside
   Git long-term; never commit an image with a live secret).

## Reusable action transcript (Playwright base)

While running a candidate case, capture a semantic transcript so a later session
need not rediscover the flow:

```json
[
  { "action": "navigate", "route": "/settings/enterprise-devin" },
  { "action": "click", "locator": { "role": "switch", "name": "Ultra" } },
  { "action": "click", "locator": { "role": "button", "name": "Save" } },
  { "action": "reload" },
  { "assert": "checked", "locator": { "role": "switch", "name": "Ultra" } }
]
```

This is a _base_ for a Playwright spec, not an automatically-trusted test. Only
promote to `tests/playwright/` when the case is deterministic, safe/reversible,
and objectively assertable (architecture plan §8) — every spec title must embed
the catalog ID, e.g. `test("[DEVIN-REG01] Ultra persists after reload", …)`.

## Hard rules

- Never edit a testcase definition during execution.
- Never weaken/rewrite expected behavior to make a case pass.
- Never perform a `qa-loop/scope.md` denylisted action without approval; revert
  any toggled setting in the same case.
- Do not run hundreds of cases in one session — shard 10–20 by page/state domain
  and aggregate child-session results.
