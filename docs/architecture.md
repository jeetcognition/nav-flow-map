# Unified QA platform architecture

`nav-flow-map` is the active repository for the QA platform. The existing repositories are migration sources, not parallel systems:

| Source repository | Material retained here |
|---|---|
| `nav-flow-map` | UI, navigation graph, testcase and bug catalog |
| `empty` | Devin browser-based exploratory runner skill and useful historical findings |
| `playwright-enterprise-qa` | Playwright configuration, authentication, page objects, and specs |
| `enterprise-self-qa` | Risk lenses, expectations, and run methodology |

## Module boundaries

```text
catalog/                 Canonical page, testcase, bug, and execution metadata
index.html               Nav Flow control-plane UI
devin-browser/           Devin session runner controlling Chrome (planned migration)
playwright/              Deterministic browser automation (planned migration)
services/                Run ingestion, triage, notification, and Pylon adapters (planned)
catalog/schema/          Contracts validated before merge
```

Git stores definitions, automation source, skills, schemas, workflows, and stable bug references. Mutable run records and large evidence such as screenshots, video, and traces will use D1/R2 or an equivalent runtime store rather than growing the repository.

## Ownership contract

- The catalog defines expected behavior and stable IDs.
- All current cases have `surface: webapp`.
- Devin browser runs control Chrome in a Devin session, consume catalog cases, and write immutable results; they do not edit definitions while executing.
- Playwright specs include the catalog ID in each test title.
- Playwright failures trigger retry, fingerprinting, deduplication, and Devin triage.
- Triage may propose a maintenance PR but must never weaken expected behavior merely to make a test pass.
- The Nav Flow UI aggregates catalog, bugs, automation state, and run status.

## Migration sequence

1. Establish the catalog contract and validator.
2. Migrate one page at a time, beginning with Enterprise Settings → Devin.
3. Generate Nav Flow UI data from migrated catalog files while preserving unmigrated legacy cases.
4. Move the Devin browser runner skill from `empty`.
5. Move Playwright into this repository and activate ID-linked specs.
6. Add runtime result storage, failure triage, notifications, and Pylon intake.

Desktop-application and CLI testcase surfaces are future extensions, not part of the current execution scope.
