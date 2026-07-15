# 14 — Guardrails, Secure Mode & Security Swarm

PRD §8.5 (Guardrails), §8.6 (Secure Mode), §6.3 (Security Swarm). Pages: `/settings/guardrails`, `/settings/secure-mode-profiles`, `/code-scan` (org-scoped `/org/<org>/code-scan`).

## Guardrails — `/settings/guardrails`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| GUARD-SMK01 | Smoke | P1 | Settings → Guardrails | Load cold. | Guardrails and Violations tabs, guardrail categories, action selectors, and descriptions render without page errors. |
| GUARD-SAN01 | Sanity | P1 | Guardrails | Inspect available guardrails and current action settings. | Real-time request analysis, threat detection, action execution, privacy controls, and each guardrail action are clearly labeled. |
| GUARD-SAN02 | Sanity | P1 | Guardrails → Violations | Switch to Violations and inspect empty/list state without opening sensitive values. | Violation list, filters/details, and empty state render without displaying secret values unnecessarily. |
| GUARD-REG01 | Regression | P1 | Guardrails → action selectors | With approval, change a disposable/non-production guardrail action, reload, then restore. | Saved action persists and applies only to intended scope; cleanup restores original policy. |
| GUARD-REG02 | Regression | P1 | Guardrails → inputs/selectors | Test search/filter/action controls with no-match, Unicode, long, HTML-like, and injection-like text. | Filtering and labels are literal and safe; unsafe text remains inert. |
| GUARD-REG03 | Regression | P0 | Guardrails → Violations | Inspect violation detail UI, DOM, console, requests, transcripts, and exported/log surfaces using safe disposable markers. | Sensitive content, credentials, secrets, and internal tokens are masked or absent from all user-visible/diagnostic surfaces. |
| GUARD-REG04 | Regression | P1 | Guardrails | Trigger or simulate warn/block/terminate outcomes in a disposable session. | User-facing outcome matches configured action; violation record contains enough metadata without sensitive payload leakage. |
| GUARD-REG05 | Regression | P0 | Guardrails | As non-admin or with tampered enterprise/violation IDs, attempt to read violations or update policy. | Authorization prevents cross-enterprise violation access and unauthorized policy changes. |
| GUARD-E2E01 | E2E | P1 | Guardrails → session | With approval, set a disposable guardrail to warn/block, trigger it in a controlled session, verify violation, then restore. | Enforcement, logging, and cleanup work end to end without leaking sensitive content. |

## Secure Mode Profiles — `/settings/secure-mode-profiles`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SECM-SMK01 | Smoke | P2 | `/settings/secure-mode-profiles` | Load | **Access-gated** — correctly shows "Access denied" for non-authorized (AUTO-057). With permission: profile list renders. |
| SECM-REG01 | Regression | P2 | Secure mode (authorized) | Create profile with network allowlist; assign to org/user | Profile persists; in-session `get_network_allowlist` reflects it; request-access flow works. **N/E**. |

## Security Swarm / Code-Scan — `/org/<org>/code-scan`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SCAN-SMK01 | Smoke | P2 | Org sidebar → Security, or `/org/<org>/code-scan` | Load | Scans / Profiles tabs render; "Start Scan" button. Bare `/code-scan` (no org) → 404 (expected). |
| SCAN-SAN01 | Sanity | P2 | Code-scan | Open **Start Scan** dialog | Repo / profile / auto-scan / interactive-mode options render; Start gated without a repo. |
| SCAN-REG01 | Regression | P2 | Code-scan | Configure Auto-Scan schedule; Profiles CRUD | Schedule + profile persist. |
| SCAN-E2E01 | E2E | P2 | Code-scan → PR | Start scan on a repo → review findings → open fix PR | Threat-model-based findings; fix PR opened; results also via `/v3/code-scans`. |
