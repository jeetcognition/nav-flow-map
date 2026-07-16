# QA platform decision log

This file is append-only. It records durable questions, answers, rationale, status, and implementation references. New decisions that replace old ones must identify the superseded decision.

Status values:

- **Accepted** — approved and safe to implement.
- **Proposed** — recommended but not yet approved.
- **Open** — answer still required.
- **Superseded** — replaced by a later decision.

## QA-DEC-001 — Repository topology

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** Should Nav Flow, Devin-led QA, and Playwright remain in three repositories or become one?
- **Answer:** Use `nav-flow-map` as one modular QA-platform repository. Treat `empty`, `playwright-enterprise-qa`, and `enterprise-self-qa` as migration sources rather than independent systems.
- **Rationale:** The catalog, runner, automation, and triage need one stable ID/data contract. Separate modules provide boundaries without cross-repository drift.
- **Implementation:** `docs/architecture.md`; PR #34.

## QA-DEC-002 — Canonical testcase source

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** Where should testcase definitions live and how should they be structured?
- **Answer:** Store versioned page catalog files under `catalog/pages/`, governed by `catalog/schema/page-catalog.schema.json`. Stable IDs connect the Nav Flow UI, `devinBrowser` execution, bugs, and Playwright.
- **Rationale:** A schema prevents duplicate IDs and missing execution metadata while allowing page-by-page migration from the legacy Markdown and JavaScript sources.
- **Implementation:** The nine Enterprise Settings → Devin cases are the first schema pilot in PR #34. The existing 372-case UI source remains unchanged until generation is implemented.

## QA-DEC-003 — Current product surface

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** What does `devinBrowser` mean, and which product surface is currently in scope?
- **Answer:** Current scope is web applications only. Every current catalog case uses `surface: webapp`.
- **Terminology:** `devinBrowser` means a Devin session opens and controls the webapp in Chrome. `playwright` means deterministic browser automation.
- **Future extension:** Additional application and CLI surfaces may be added later, but they are not enabled now. The testcase `type` field continues to mean Smoke, Sanity, Regression, or E2E.
- **Implementation:** PR #34.

## QA-DEC-004 — Repeatable versus adaptive execution

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** How can recurring checks avoid repeatedly spending Devin tokens?
- **Answer:** Promote stable, deterministic catalog cases to Playwright. Reserve `devinBrowser` sessions for exploratory testing, changed surfaces, ambiguous behavior, and Playwright failure triage.
- **Guardrail:** Do not automate visual, destructive, unstable, or assertion-ambiguous cases until deterministic fixtures and cleanup exist.

## QA-DEC-005 — Failed Playwright cases

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** Should every Playwright failure immediately become a product bug or rewrite the test?
- **Answer:** No. Retry once in a clean context, fingerprint and deduplicate the failure, then have a `devinBrowser` session reproduce the exact catalog case.
- **Classification:** Product regression, selector/test drift, intentional product change, infrastructure/auth/fixture, flaky/timing, or inconclusive.
- **Guardrail:** The system may propose a test-maintenance PR but must never weaken expected behavior merely to make a test pass.

## QA-DEC-006 — Definitions versus runtime evidence

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** Should testcase definitions, test runs, reports, screenshots, videos, and traces all be committed to Git?
- **Answer:** Keep catalog definitions, schemas, automation code, skills, workflows, and stable bug references in Git. Store mutable run records in D1 (or equivalent) and large evidence in R2 (or equivalent).
- **Rationale:** Git remains reviewable while high-volume runtime artifacts remain queryable without unbounded repository growth.

## QA-DEC-007 — Customer-ticket intake

- **Date:** 2026-07-16
- **Status:** Proposed
- **Question:** How should Pylon customer issues become regression coverage?
- **Answer:** Use authenticated Pylon webhook/API intake, redact private data, deduplicate similar reports, reproduce in QA with Devin, and create a linked bug/testcase only after confirmation. Promote only deterministic behavior to Playwright.
- **Guardrail:** Do not create a Devin session for every raw support message; prioritize tagged/high-severity candidates and batch lower-severity review.

## QA-DEC-008 — Durable project memory

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** How will future sessions know every relevant question, answer, decision, and implementation direction?
- **Answer:** Maintain append-only `docs/decisions.md` and `docs/work-log.md`, enforced by root `AGENTS.md`. Update these documents before completing future work.
- **Privacy boundary:** Preserve durable context, not secrets, raw customer content, authentication material, or transient command output.
- **Implementation:** PR #34.

## QA-DEC-009 — devinBrowser terminology

- **Date:** 2026-07-16
- **Status:** Accepted
- **Question:** What term should schema, code, testcases, and documentation use for a Devin session controlling Chrome?
- **Answer:** Use `devinBrowser` everywhere. Do not use a device or application-surface label as shorthand for this executor.
- **Rationale:** Executor identity and product surface are separate concepts: `devinBrowser` executes the case, while `surface: webapp` identifies what is under test.
- **Implementation:** PR #34.

## Open questions

### QA-OPEN-001 — Runtime data platform

- **Status:** Open
- **Question:** Confirm Cloudflare D1/R2 as the runtime store and define retention, access control, and backup requirements.

### QA-OPEN-002 — Catalog authoring flow

- **Status:** Open
- **Question:** Should Nav Flow UI edits create a catalog PR directly, or first save an authenticated draft that a promotion service converts into a PR?

### QA-OPEN-003 — Execution triggers

- **Status:** Open
- **Question:** Confirm the exact deploy-gate, nightly, weekly, and on-demand suites after the first end-to-end pilot.
