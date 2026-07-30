# QA loop — how quality is maintained and stays ahead of regressions

This directory holds the **methodology + durable memory** that drive how the app
under test gets explored, remembered, and re-verified. It is the "brain" of the
QA Command Center; the **data** it produces lives in the app's canonical stores
(see [Where memory lives](#where-memory-lives)).

Distilled from two earlier QA repos (`empty` = a working exploratory engine,
`enterprise-self-qa` = a loop blueprint) and folded into this repo so there is
**one place** for cases, bugs, runs, and the exploration strategy.

## The loop

```
1. change-radar.md        → what changed since last run? test those surfaces first
2. memory/surface-map.md  → what does the app currently look like? (drift baseline)
3. heuristics/lenses.md   → pick 2–4 failure-mode lenses for this run
4. run cases              → catalog cases + open-ended exploration (see the skills)
5. expectations/          → diff actual vs expected-behavior; skip anything in known-quirks
6. record findings        → bugs.json + runResults.json (canonical stores, not here)
7. memory/surface-map.md  → diff live app vs map; FLAG new/removed surfaces, then update
8. memory/backlog.md      → park anything too deep/blocked for this run
```

The point of steps 2 + 7 is the thing you asked for: **automatically catch what
was NOT explored before.** The surface map is the memory of "what we've seen";
the end-of-run diff surfaces anything new or newly-missing so it never slips by.

## The two executors (skills in `.agents/skills/`)

| Skill                                                               | Use for                                                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`exploratory-qa`](../.agents/skills/exploratory-qa/SKILL.md)       | Open-ended bug hunting: pick lenses, poke edge cases, find the un-explored.               |
| [`desktop-qa-runner`](../.agents/skills/desktop-qa-runner/SKILL.md) | Deterministic execution of specific catalog case IDs (change→save→reload→verify→restore). |

Both drive an already-authenticated Chrome via Playwright-CDP; they never launch
a new browser or fetch an OTP (the user enters it once per session).

## Where memory lives (no duplicate ledgers)

The old repos kept `coverage.md`, `runs.md`, and `Bug.md`. This repo already has
canonical, UI-rendered stores for that data, so we do **not** re-create parallel
markdown ledgers (duplication was an explicit integrity gap — see
`docs/qa-platform-architecture-plan.md`). Mapping:

| Old markdown ledger       | Canonical home in this repo                                           |
| ------------------------- | --------------------------------------------------------------------- |
| `Bug.md`                  | `app/src/data/fixtures/bugs.json` (`Bug` shape in `app/src/types.ts`) |
| `coverage.md` / `runs.md` | `runs.json` + `runResults.json` (→ Cloudflare D1 later)               |
| testcases                 | `testcases.json` + `catalog/pages/*.json`                             |

Only the two things with **no** canonical home stay here as markdown memory:

- `memory/surface-map.md` — the drift baseline.
- `memory/backlog.md` — parked/blocked test ideas.

## Conventions (agreed)

- **Result vocab:** `passed` / `failed` / `skipped` / `flaky` (`flaky` is a case
  attribute in `testcases.json`; a run also uses `blocked` / `inconclusive` when
  a case cannot be executed — never guess a pass/fail).
- **Bug format:** the `Bug` object in `app/src/types.ts` (`BUG-NNN`, severity
  `S1–S4`, status `open→…→closed`, `environment` `beta`|`staging`, linked
  `caseIds`). Do not invent a second bug format.
- **IDs:** cases are `<AREA>-<TYPE><NN>` where TYPE ∈ `SMK|SAN|REG|E2E`
  (matches `catalog/schema/page-catalog.schema.json`); bugs are `BUG-NNN`. Never
  renumber or reuse an ID.
- **Default environment:** `beta` (`cog-enterprise-qa`, see `scope.md`);
  overridable per run.
