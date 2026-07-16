# Canonical QA catalog

`catalog/pages/*.json` is the versioned testcase contract for the unified QA platform. Each page file contains page metadata and its cases; `catalog/schema/page-catalog.schema.json` defines the accepted shape.

The initial pilot is Enterprise Settings → Devin. The legacy Markdown tables and `testcases.js` remain the live Nav Flow UI source until the next migration step adds generation from this catalog. During this transition, do not delete or bulk-convert the remaining legacy cases.

## Required testcase metadata

- stable testcase and page IDs;
- title, type, priority, owner, risk tags, and cadence;
- navigation, preconditions, ordered steps, assertions, and cleanup;
- target environments and roles;
- Desktop and Playwright eligibility;
- automation lifecycle and Playwright spec path;
- source, linked bugs, external references, version, and review date.

## Lifecycle

```text
manual
  → desktop_verified
  → candidate
  → implementation_pr
  → active
  → quarantined
```

`active` and `implementation_pr` cases must have a Playwright spec path. A failed test must not weaken its assertions automatically; failures are triaged separately as product regressions, test drift, intentional changes, infrastructure, flakiness, or inconclusive results.

## Validate

```bash
npm run catalog:validate
```

The validator checks schema-level requirements, IDs, page mappings, source files, bug links, cleanup, executor constraints, automation state, and duplicate references.
