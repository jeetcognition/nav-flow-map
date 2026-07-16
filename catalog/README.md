# Canonical QA catalog

`catalog/pages/*.json` is the versioned testcase contract for the unified QA platform. Each page file contains page metadata and its cases; `catalog/schema/page-catalog.schema.json` defines the accepted shape.

The initial pilot is Enterprise Settings → Devin. The legacy Markdown tables and `testcases.js` remain the live Nav Flow UI source until the next migration step adds generation from this catalog. During this transition, do not delete or bulk-convert the remaining legacy cases.

## Required testcase metadata

- stable testcase and page IDs;
- surface (`webapp` is the only currently supported value);
- title, type, priority, owner, risk tags, and cadence;
- navigation, preconditions, ordered steps, assertions, and cleanup;
- target environments and roles;
- `devinBrowser` and Playwright eligibility;
- automation lifecycle and Playwright spec path;
- source, linked bugs, external references, version, and review date.

## Lifecycle

```text
manual
  → devinBrowser_verified
  → candidate
  → implementation_pr
  → active
  → quarantined
```

`active` and `implementation_pr` cases must have a Playwright spec path. A failed test must not weaken its assertions automatically; failures are triaged separately as product regressions, test drift, intentional changes, infrastructure, flakiness, or inconclusive results.

The current platform tests web applications only. `devinBrowser` means a Devin session controls Chrome to execute the webapp case. Additional application and CLI surfaces can be added to the schema later without being enabled now.

`surface` identifies what is under test; the existing `type` field continues to mean Smoke, Sanity, Regression, or E2E.

## Validate

```bash
npm run catalog:validate
```

The validator checks schema-level requirements, IDs, page mappings, source files, bug links, cleanup, executor constraints, automation state, and duplicate references.
