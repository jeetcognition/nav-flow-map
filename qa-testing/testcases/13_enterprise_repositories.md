# 13 — Repositories & Permissions

PRD §3.5 (Indexing/DeepWiki), §8.8 (repository-permissions). Pages: `/settings/repositories`, repository-permissions, `/settings/deepwiki`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| REPO-SMK01 | Smoke | P1 | Settings → Repositories | Load cold. | Organization selector renders first with no page errors; repository controls are gated until an organization is selected. |
| REPO-SAN01 | Sanity | P1 | Repositories | Open organization selector and choose `jeet-test-org` without mutating permissions. | Selected organization is shown; repository list/permissions state loads only for that organization. |
| REPO-SAN02 | Sanity | P1 | Repositories → selected org | Inspect repo list, provider/status/permission columns, filters, and available actions. | Rows are associated with the selected org; permissions/actions are clearly labeled. |
| REPO-REG01 | Regression | P1 | Repositories | Search repos with match/no-match, whitespace, Unicode, long, HTML-like, and injection-like text. | Filtering is literal and safe; clearing restores selected organization’s repository list. |
| REPO-REG02 | Regression | P1 | Repositories | Combine provider/status/permission filters, pagination, and organization switching. | Filters reset or persist only as documented; no stale rows from another organization appear. |
| REPO-REG03 | Regression | P1 | Repositories | With approval, add/remove or change permission for a disposable repository/member, reload, then restore. | Permission changes persist for the correct repo/org only; cleanup restores original access. |
| REPO-REG04 | Regression | P0 | Repositories | As restricted user or with tampered org/repo IDs, request or mutate repository permissions. | Server denies unauthorized/cross-tenant access and does not expose private repo metadata. |
| REPO-E2E01 | E2E | P1 | Repositories → session | With approval, grant disposable repo access, start a session that references it, then revoke and retest. | Session access follows repository permissions; revocation prevents new access after cleanup. |
| DWIKI-SMK01 | Smoke | P2 | `/settings/deepwiki` or left nav DeepWiki | Load | DeepWiki renders for an indexed repo (architecture wiki + diagrams). |
| DWIKI-REG01 | Regression | P2 | DeepWiki | Search wiki; XSS in query | Inert; results render. |
