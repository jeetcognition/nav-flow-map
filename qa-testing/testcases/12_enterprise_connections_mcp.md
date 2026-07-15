# 12 — Enterprise Connections & MCP Management

PRD §7 (Integrations), §8 (enterprise-mcp-management). Pages: `/settings/connections` (`?tab=integrations` / `?tab=mcps`), `/settings/enterprise-mcp-management`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ECON-SMK01 | Smoke | P1 | Settings → Connections | Load Integrations cold. | Git providers, communication, and task-management providers render with counts/status and no page errors. |
| ECON-SAN01 | Sanity | P1 | Connections | Inspect GitHub, GitLab, Bitbucket, Azure DevOps, Slack, Teams, Linear, and Jira cards. | Each provider shows a clear connected/not-connected/user-linked state and the correct Configure action. |
| ECON-SAN02 | Sanity | P1 | Connections → MCP servers | Switch to MCP servers. | MCP count/list renders; tab state is reflected in URL/deep link; returning to Integrations restores its content. |
| ECON-REG01 | Regression | P1 | Connections → Configure provider | Start and cancel each Configure/OAuth flow. | Correct provider is targeted; callback/state is safe; cancellation does not create a partial connection. |
| ECON-REG02 | Regression | P1 | Connections | Search/filter integration and MCP lists with no-match, whitespace, Unicode, long, HTML-like, and injection-like text. | Filtering is literal and safe; empty/no-match state is clear; clearing restores the full active tab. |
| ECON-MCP-REG01 | Regression | P1 | Connections → MCP servers | Open server details or policy controls without saving. | Transport, scopes, access policy, and usage details render without exposing secrets or credentials. |
| ECON-MCP-REG02 | Regression | P1 | Connections → MCP servers | With approval, allow/deny or connect/disconnect a disposable MCP server, reload, then restore. | Policy persists, affects new sessions as documented, and cleanup returns the server to its original state. |
| ECON-MCP-REG03 | Regression | P1 | Connections → custom/server config | Test malformed URL, non-HTTPS/local/private hosts, long names, duplicate names, and HTML-like fields. | Invalid server definitions are rejected safely; unsafe text is inert; no SSRF-capable endpoint is accepted. |
| ECON-E2E01 | E2E | P1 | Connections → new session | With approval, enable a disposable integration/MCP and start a new session that attempts to use it. | Tool/credential availability matches the enterprise and personal connection state; cleanup removes access. |
