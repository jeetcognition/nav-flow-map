# 15 — Enterprise Settings: Devin API, Infrastructure, Skills & Rules

Pages: `/org/cog-enterprise-qa/settings/devin-api`, `/org/cog-enterprise-qa/settings/infrastructure`, `/org/cog-enterprise-qa/settings/enterprise-skills`.

## Devin API — `/org/cog-enterprise-qa/settings/devin-api`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---:|---|---|---|
| API-SMK01 | Smoke | P1 | Settings → Devin API | Load Service users cold. | Service users and Legacy API tabs, counts, search, organization/role filters, Provision, table columns, Copy role ID, and Delete actions render without page errors. |
| API-SAN01 | Sanity | P1 | Devin API → Service users | Inspect table rows. | Name, scope, organization, role, created/expires timestamps, and actions are readable without displaying API token values. |
| API-SAN02 | Sanity | P1 | Devin API → Legacy API | Switch to Legacy API tab. | Legacy token list/state renders; token values are masked or only shown according to documented one-time behavior. |
| API-SAN03 | Sanity | P1 | Devin API → Provision | Open Provision without submitting. | Name, scope, organization, role, expiration, create/cancel controls, and gated submission are visible. |
| API-REG01 | Regression | P1 | Devin API → Search/filter | Search and filter by organization/role with no-match, whitespace, Unicode, long, duplicate-name, and HTML-like text. | Filtering is literal and safe; duplicate display names remain distinguishable by metadata. |
| API-REG02 | Regression | P1 | Devin API → Provision | With approval, test blank, duplicate, long, Unicode, HTML-like names; invalid scope/role/expiration; then cancel or delete disposable user. | Validation is clear; unsafe text is inert; invalid service users are not created. |
| API-REG03 | Regression | P0 | Devin API | With approval, create a disposable service user and inspect UI, DOM, console, network, transcript, and logs. | Token is shown only once where intended, then masked; no full token is stored or exposed diagnostically. |
| API-REG04 | Regression | P1 | Devin API → Delete | With approval, delete a disposable service user: cancel once, then confirm. | Confirmation identifies exact user/scope; cancel changes nothing; confirm revokes only selected credentials. |
| API-REG05 | Regression | P0 | Devin API | As non-admin or with tampered service-user/enterprise IDs, attempt list/create/delete/legacy-token operations. | Server-side authorization prevents unauthorized key access, IDOR, and privilege escalation. |

## Infrastructure — `/org/cog-enterprise-qa/settings/infrastructure`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---:|---|---|---|
| INFRA-SMK01 | Smoke | P1 | Settings → Infrastructure | Load cold. | Infrastructure heading, hypervisor/capacity health copy, Refresh action, and empty/list state render without page errors. |
| INFRA-SAN01 | Sanity | P1 | Infrastructure | Inspect current VPC/tenant/hypervisor state. | Empty state such as “No VPC data available” is clear, or populated rows show tenant/hypervisor/capacity status accurately. |
| INFRA-REG01 | Regression | P1 | Infrastructure → Refresh | Click Refresh repeatedly and during slow/error network conditions. | Refresh is idempotent; loading/error state is clear; stale health data is not shown as current after failure. |
| INFRA-REG02 | Regression | P1 | Infrastructure | If list/search/filter controls are present, test no-match, Unicode, long, HTML-like, and injection-like values. | Filters are literal and safe; no cross-tenant infrastructure identifiers appear. |
| INFRA-REG03 | Regression | P0 | Infrastructure | As restricted user or with tampered tenant/hypervisor IDs, request infrastructure health data. | Server denies unauthorized/cross-tenant infra visibility and does not expose internal host details unnecessarily. |

## Skills & Rules — `/org/cog-enterprise-qa/settings/enterprise-skills`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---:|---|---|---|
| SKILL-SMK01 | Smoke | P1 | Settings → Skills & Rules | Load cold. | Skills analytics, runtime filter, date filter, usage over time, most invoked skills, task types, search, and table render without page errors. |
| SKILL-SAN01 | Sanity | P1 | Skills & Rules | Inspect analytics cards and table rows. | Invocation/session/user/last-used metrics are readable; repository/source names are associated with the correct skill. |
| SKILL-SAN02 | Sanity | P1 | Skills & Rules | Open runtime and date-range filters. | Current selections and available ranges are clear; closing filters without selection leaves data unchanged. |
| SKILL-REG01 | Regression | P1 | Skills & Rules → Search | Search skills/sources with match/no-match, whitespace, Unicode, long, HTML-like, and injection-like text. | Filtering is literal and safe; no-match state is clear; clearing restores all rows. |
| SKILL-REG02 | Regression | P1 | Skills & Rules | Switch Cloud/local runtime and date ranges. | Charts/table refetch consistently; stale data is not shown as current; empty ranges render cleanly. |
| SKILL-REG03 | Regression | P1 | Skills & Rules | Click View sessions or skill detail for a row, then return. | Navigation opens the correct filtered sessions/details view and Back restores filters/search. |
| SKILL-REG04 | Regression | P0 | Skills & Rules | As restricted user or with tampered skill/source/session IDs, request analytics/details. | Server denies unauthorized data access and does not expose private session prompts or repository metadata. |
