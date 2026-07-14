# 12 — Enterprise Connections & MCP Management

PRD §7 (Integrations), §8 (enterprise-mcp-management). Pages: `/settings/connections` (`?tab=integrations` / `?tab=mcps`), `/settings/enterprise-mcp-management`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ECON-SMK01 | Smoke | P1 | Enterprise settings → Connections | Load | Integrations render (GitHub/GitLab/Bitbucket/Slack/Teams/Jira/Linear + self-hosted SCM). |
| ECON-SMK02 | Smoke | P2 | Connections | `?tab=mcps` | MCP list renders. (Known cosmetic: 3 simple-icons CDN 404s — AUTO-058, non-blocking.) |
| ECON-SAN01 | Sanity | P2 | Connections | "Missing an integration?/MCP?" links | Route to correct tab; no open-redirect. |
| ECON-REG01 | Regression | P1 | Connections | **Register GitHub Enterprise app** / OAuth connect | OAuth handshake valid `state`; no open-redirect/XSS in callback. **N/E** (mutates enterprise integration). |
| ECON-REG02 | Regression | P2 | Connections | Org-management / repo-permission mgmt from connection | Renders; changes scoped to enterprise. |
| ECON-MCP-SMK01 | Smoke | P2 | `/settings/enterprise-mcp-management` | Load | Redirects to `connections?tab=mcps`; allow/deny list + server detail pages present. |
| ECON-MCP-REG01 | Regression | P2 | MCP management | Allow/deny an MCP server; open server detail | Policy persists; detail page shows transport (stdio/SSE/HTTP), scopes. **N/E** on live policy. |
| ECON-MCP-REG02 | Regression | P2 | MCP management | Add custom MCP server: malformed URL, XSS in name | Validated; inert. |
| ECON-E2E01 | E2E | P2 | Connections → session | Enable an MCP → start session using its tools | Tools available in-session. |
