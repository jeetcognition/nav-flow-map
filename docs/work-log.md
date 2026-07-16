# QA platform work log

This file is append-only. Each entry summarizes requested work, completed implementation or analysis, validation, and deferred items. Detailed rationale belongs in `decisions.md`.

## 2026-07-16 — Repository review and target architecture

### Requested

- Understand `empty`, `playwright-enterprise-qa`, `nav-flow-map`, and `enterprise-self-qa`.
- Design a system that stores testcases in Nav Flow, executes them through Devin-controlled Chrome, promotes repeatable cases to Playwright, triages failures, and later learns from Pylon tickets.
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
- Clarify that current testing covers webapps only; Devin uses Chrome and does not test a desktop application.
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
