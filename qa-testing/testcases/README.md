# Devin Enterprise — Test Case Suite

Structured, repeatable test cases (Smoke / Sanity / Regression / E2E) for every page in this repo's QA scope and every page we've visited across runs R1–R7. Derived from the Enterprise PRD (`devin-enterprise-prd.md`), the Notion ENT-QA Guide, and observed application behavior.

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
- Automation drivers: `qa-testing/r*_*.py` (CDP-attached Chrome via `r6lib.py`).

## Result legend
PASS · FAIL (link Bug.md) · BLOCKED (precondition unmet) · N/E (not executed — unsafe/destructive; see note).

## Safety rules for executing these cases
Do NOT, without explicit approval + immediate revert: delete/modify real sessions/orgs/users/memberships; save SSO/SAML; rotate/delete secrets or API keys; submit create-org/knowledge/playbook/role forms on live data; force cross-tenant IDOR via replayed requests. Toggle tests must revert in the same case. Never commit screenshots containing live secrets (apk_/cog_ tokens).

## Area files
| File | Pages covered |
|---|---|
| `01_personal.md` | Preferences (Profile), Connections (personal integrations/MCP) |
| `02_sessions_composer.md` | Home composer, Ask/Agent, Sessions list, session Progress tools |
| `03_enterprise_general_sso.md` | General, SSO/SAML/OIDC, domain verification |
| `04_enterprise_devin.md` | Devin product settings (toggles, commit attribution, PR behavior) |
| `05_enterprise_review.md` | Devin Review settings + review UI |
| `06_enterprise_knowledge.md` | Knowledge tree/items |
| `07_enterprise_playbooks.md` | Playbooks (Enterprise/System) |
| `08_enterprise_environment.md` | Environment: Configuration/Blueprint/Snapshots/Golden/Upkeep/Builds |
| `09_enterprise_membership_roles.md` | Membership (Members/Roles/Groups-IdP), Roles detail |
| `10_enterprise_organizations.md` | Organizations list + create/edit org |
| `11_enterprise_analytics.md` | Analytics: Usage/Consumption/Categories |
| `12_enterprise_connections_mcp.md` | Connections/Integrations, MCP management |
| `13_enterprise_repositories.md` | Repositories & permissions |
| `14_enterprise_security_guardrails.md` | Guardrails + Violations, Secure Mode Profiles, Code-Scan/Security Swarm |
| `15_enterprise_infra_misc.md` | Enterprise Sessions, Rollout, Outpost Pools, VPC, Infrastructure, Devin API/Service users |
| `16_suborg.md` | Sub-org: New session, Automations, Security, Review, Wiki, Invite, org panel |
| `17_automations_schedules.md` | Automations (triggers), Scheduled sessions |
| `18_login.md` | Tenant login and hosted authentication page |
| `21_landing_search.md` | Landing search / organization selector |
| `22_enterprise_settings.md` | Enterprise Settings root page |

## Known bugs folded in as regression checks
BUG-002 (dup service-user name), BUG-003 (apk_+org-id exposed in Guardrails logs — P0 security), BUG-004 ("1 members" grammar), BUG-005 (idp "provider." text), BUG-006 (automation network-policy accepts javascript:/`<script>`/http:// unvalidated), BUG-011 (no Sessions list in sub-org sidebar), BUG-013 (Env Upkeep 404), BUG-014 (Devin Ultra/Fast toggle 400, no persist), BUG-015 (Review "Go to pull request" button never enables).

## Organization observations reserved for bug tracking
- Duplicate organization display names are visible in the table (including `ok1` and `p1`), making row identity ambiguous when names are the only visible identifier. Previously tracked as BUG-001.
- The Manage organization modal accepts an extremely large positive ACU limit client-side, then returns only a generic **Failed to update organization** response. The UI does not state the supported maximum before submission.
