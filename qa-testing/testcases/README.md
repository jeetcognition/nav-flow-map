# Devin Enterprise — Test Case Suite

Structured, repeatable test cases (Smoke / Sanity / Regression / E2E) for pages added or promoted through the navigation-flow-map website. The original 01–17 area files (imported from the `empty` repo's QA suite) were removed after their cases were parsed into [`testcases.js`](../../testcases.js), which is the canonical runtime source; this folder now holds only cases created afterwards.

These Markdown tables are the legacy UI source during the catalog migration. New canonical metadata lives under [`../../catalog/`](../../catalog/); migrate pages incrementally rather than creating another parallel testcase source.

## Test types

| Type | Purpose | When to run | Depth |
|---|---|---|---|
| **Smoke** | "Is it alive?" — page reaches, core element renders, no crash/console error. | Every build, first. If smoke fails, stop. | Shallow, fast, must-pass. |
| **Sanity** | Targeted check that a specific feature/field behaves after a change. | After a change touching that area. | Narrow, functional. |
| **Regression** | Full re-verification incl. edge cases, validation, injection, and previously-found bugs. | Weekly / pre-release. | Broad, includes known-bug checks. |
| **E2E** | A complete real user journey across multiple pages/states. | Pre-release / acceptance. | End-to-end flow. |

## Priority
- **P0** — blocker (login, session start, billing correctness, security exposure).
- **P1** — core feature broken.
- **P2** — secondary feature / edge case.
- **P3** — cosmetic / minor.

## ID convention
`<AREA>-<TYPE><NN>` — e.g. `PREF-SMK01`, `DEVIN-REG03`, `ORG-E2E01`.
TYPE = SMK (smoke), SAN (sanity), REG (regression), E2E. IDs are stable; never renumber.

## Environment
- Base: `https://cog-enterprise-qa.beta.devinenterprise.com`
- Enterprise: `cog-enterprise-qa` (display "Cog Enterprise QA")
- Sub-org under test: display **jeet-test-org**, slug **jeet-devin-qa** (routes use the slug; `/org/jeet-test-org/*` 404s)
- Enterprise settings routes: `/org/cog-enterprise-qa/settings/<page>` (short `/settings/<page>` resolves in the currently-active org context).

## Result legend
PASS · FAIL (link Bug.md) · BLOCKED (precondition unmet) · N/E (not executed — unsafe/destructive; see note).

## Safety rules for executing these cases
Do NOT, without explicit approval + immediate revert: delete/modify real sessions/orgs/users/memberships; save SSO/SAML; rotate/delete secrets or API keys; submit create-org/knowledge/playbook/role forms on live data; force cross-tenant IDOR via replayed requests. Toggle tests must revert in the same case. Never commit screenshots containing live secrets (apk_/cog_ tokens).

## Area files
| File | Pages covered |
|---|---|
| `18_login.md` | Tenant login and hosted authentication page |
| `19_support.md` | Support page |
| `20_auth.md` | Auth (Email + OTP) page |
| `21_landing_search.md` | Landing search / organization selector |
| `22_enterprise_settings.md` | Enterprise Settings root page |
| `23_suborg_secrets.md` | Sub-org Secrets page |

## Known bugs
Canonical bug records, page mappings, and linked test case IDs live in [`bugs.js`](../../bugs.js).
