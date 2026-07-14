# 13 — Repositories & Permissions

PRD §3.5 (Indexing/DeepWiki), §8.8 (repository-permissions). Pages: `/settings/repositories`, repository-permissions, `/settings/deepwiki`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| REPO-SMK01 | Smoke | P1 | Enterprise settings → Repositories | Load | Renders "Repositories"; main panel shows an **org-selector list first** (BL-045: no repo/permission/filter controls at top level until an org is chosen). |
| REPO-SAN01 | Sanity | P2 | Repositories | Select an org from the list | That org's repo list + permission controls load. |
| REPO-REG01 | Regression | P2 | Repositories (org selected) | Search repos / filter by git provider + permission | Search filters (XSS/SQLi inert); provider & permission filters apply. |
| REPO-REG02 | Regression | P2 | Repositories | Add / remove a repo; change per-repo/user permission | Change persists; reload confirms. **N/E** (permission mutation). |
| REPO-REG03 | Regression | P2 | Repositories | Index a repo | Indexing starts; status updates; enables semantic search. **N/E** unless approved. |
| REPO-REG04 | Regression | P2 | Repositories | IDOR: request another tenant's repo permissions via API/URL | Server denies; no leak. |
| DWIKI-SMK01 | Smoke | P2 | `/settings/deepwiki` or left nav DeepWiki | Load | DeepWiki renders for an indexed repo (architecture wiki + diagrams). |
| DWIKI-REG01 | Regression | P2 | DeepWiki | Search wiki; XSS in query | Inert; results render. |
| REPO-E2E01 | E2E | P2 | Repositories → Ask Devin | Index a repo → Ask Devin a codebase question → "convert to session" | Semantic answer with context; session created carrying context. |
