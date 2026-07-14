# 14 — Guardrails, Secure Mode & Security Swarm

PRD §8.5 (Guardrails), §8.6 (Secure Mode), §6.3 (Security Swarm). Pages: `/settings/guardrails`, `/settings/secure-mode-profiles`, `/code-scan` (org-scoped `/org/<org>/code-scan`).

## Guardrails — `/settings/guardrails`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| GUARD-SMK01 | Smoke | P1 | Enterprise settings → Guardrails | Load | Renders with Violations / Configuration tabs; guardrail list. |
| GUARD-REG01 | Regression | P0 | Guardrails → Violations | Open violation log entries | **BUG-003 (SECURITY)**: API key (`apk_…`) + org-id exposed in plaintext in logs. Expected: masked/redacted. **Never screenshot with the key visible.** |
| GUARD-REG02 | Regression | P2 | Guardrails → Configuration | Set a guardrail action: Log only / Warn / Block / Terminate | Setting persists; scope (all / specific orgs) applies. **N/E** on live policy → revert. |
| GUARD-REG03 | Regression | P2 | Guardrails | Enable/disable a guardrail; scope to specific org | State persists after reload. |
| GUARD-E2E01 | E2E | P2 | Guardrails → session | Set a "Block message" guardrail → trigger it in a session | Message blocked; violation logged with event id/source/confidence/action. |

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
