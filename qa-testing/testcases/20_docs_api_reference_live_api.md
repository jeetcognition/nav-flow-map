# 20 — Docs: API Reference & live API

Imported from Notion: Devin Enterprise — QA Test Cases (sub-page 20).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| API-DOC-SMK01 | Smoke | P1 | Open overview URL | Load cold | Renders "API Overview"; sections Getting started, API structure (Org/Enterprise base URLs), Session attribution, Legacy v1/v2, Error handling, Support. |
| API-DOC-SMK02 | Smoke | P2 | Left API nav | Expand v3 endpoint groups (sessions, knowledge, playbooks, secrets, users, analytics…) | Each endpoint page renders with method, path, params, example, response schema. |
| API-DOC-SAN01 | Sanity | P2 | Any endpoint page | Use the "try it"/code-sample language switcher (curl/python/JS) | Samples render for each language; copy button copies exact snippet. |
| API-DOC-REG01 | Regression | P2 | Overview | Verify base URLs + `create_as_user_id` example + error-code table | Matches live API; `ImpersonateOrgSessions` note present; 200/201/400/401/403/404/429/500 table correct. |
| API-LIVE-SMK03 | Smoke | P0 | Terminal w/ `cog_` token | `GET /v3/organizations/$ORG/sessions` with valid bearer | 200 + JSON list. |
| API-LIVE-REG02 | Regression | P0 | API | Call with missing / malformed / expired token | 401 (not 500); no stack trace; no token echoed in error. |
| API-LIVE-REG03 | Regression | P1 | API | Call an endpoint the service-user role lacks | 403 Forbidden (RBAC enforced), not 200/500. |
| API-LIVE-REG04 | Regression | P1 | API | `POST /v3/organizations/$ORG/sessions` with `create_as_user_id` of a user in another org (IDOR) | Rejected (403/404); session NOT created cross-tenant. |
| API-LIVE-REG05 | Regression | P1 | API | POST create session: empty prompt, 100k-char prompt, `<script>`, `' OR 1=1 --`, wrong Content-Type | 400 on invalid; payloads stored inert; no injection. |
| API-LIVE-REG06 | Regression | P2 | API | Exceed rate limit (rapid loop) | 429 with retry semantics; no 500; documented limit honored. |
| API-LIVE-REG07 | Regression | P2 | API | Enterprise scope `GET /v3/enterprise/*` with an org-only token | 403; enterprise endpoints gated to enterprise credentials. |
| API-LIVE-REG08 | Regression | P2 | API | Hit legacy `v1`/`v2` endpoints | Still respond (deprecation period) but flagged; migration-guide link accurate. |
| API-LIVE-E2E01 | E2E | P1 | Full API flow | Create service user in console → mint `cog_` key → `POST` a session with `create_as_user_id` → poll session status → confirm it appears in that user's list + counts toward usage | Attribution correct; audit trail records service user; key manageable/revocable in console. **N/E**: creates real key/session → revoke + archive after. |
