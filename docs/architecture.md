# Unified QA platform architecture

`nav-flow-map` is the active repository for the QA platform. The `empty`,
`playwright-enterprise-qa`, and `enterprise-self-qa` repositories are migration
sources, not independent systems.

| Source repository          | Material retained here                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| `nav-flow-map`             | UI (`app/`), canonical catalog (`catalog/`), worker, runtime fixtures  |
| `empty`                    | `devinBrowser` exploratory-runner skill and useful historical findings |
| `playwright-enterprise-qa` | Playwright configuration, auth, page objects, specs, CI patterns       |
| `enterprise-self-qa`       | Risk lenses, expectations, and run methodology                         |

## Module boundaries (current)

```text
catalog/                 Canonical page/testcase schema and page catalog files
app/                     QA Command Center — React 19 + Vite + TypeScript
scripts/validate-catalog.mjs
                         Catalog schema and reference validation
worker/                  Cloudflare Worker — commits edits, starts Devin sessions
qa-testing/              Markdown case sources maintained by the AI promotion pass
```

Git stores definitions, automation code, skills, schemas, workflows, and stable
bug references. Mutable run records and large evidence (screenshots, video,
traces) should use an external runtime store rather than growing the repository.

## Long-term target

The full target architecture is documented in
[`qa-platform-architecture-plan.md`](qa-platform-architecture-plan.md). It
introduces:

- `apps/nav-flow/`, `agents/skills/`, `tests/playwright/`, `packages/catalog/`,
  and `services/worker/` boundaries;
- YAML catalog files (`pages.yaml`, `cases/*.yaml`, `bugs.yaml`) and separate
  JSON schemas;
- D1/R2 (or equivalent) for run records and artifacts;
- Custom-webhook Devin Automations for failure triage;
- Pylon webhook ingestion for customer-defect intake.

The first phase keeps the existing React app untouched, uses the JSON
`catalog/pages/*.json` format already validated by `scripts/validate-catalog.mjs`,
and defers the generator, YAML migration, and runtime storage until the schema
is proven.

## Ownership contract

- The catalog defines expected behavior and stable IDs.
- All current cases have `surface: webapp`.
- `devinBrowser` runs control Chrome in a Devin session, consume catalog cases,
  and write immutable results; they do not edit definitions while executing.
- Playwright specs include the catalog ID in each test title.
- Playwright failures trigger retry, fingerprinting, deduplication, and Devin
  triage.
- Triage may propose a maintenance PR but must never weaken expected behavior
  merely to make a test pass.
- The Nav Flow UI aggregates catalog, bugs, automation state, and run status.

## Migration sequence

1. Establish the catalog contract and validator (this PR).
2. Re-author page catalogs fresh against the schema, one page at a time (legacy
   fixtures are reference material, not a mechanical migration source).
3. Generate `app/src/data/fixtures/*.json` from authored catalog files while
   preserving fixtures not yet re-authored.
4. Move the `devinBrowser` runner skill from `empty` into `agents/skills/`.
5. Move Playwright into this repository and activate ID-linked specs.
6. Add runtime result storage, failure triage, notifications, and Pylon intake.

Additional application and CLI testcase surfaces are future extensions, not part
of the current execution scope.
