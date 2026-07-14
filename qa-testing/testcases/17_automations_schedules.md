# 17 — Automations & Scheduled Sessions

PRD §5 (Automation). Pages: `/automations` (+ `/create`, `/orgs`), `/settings/schedules`.

## Automations — `/automations`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| AUTO-SMK01 | Smoke | P1 | Left nav → Automations | Load | Automations list + Create button render. |
| AUTO-SAN01 | Sanity | P2 | Automations → Create | Empty name → submit | "Name is required"; blocked. |
| AUTO-REG01 | Regression | P2 | Create | Select each trigger: Slack, GitHub webhook, Linear/Jira, Schedule, Custom webhook | Each trigger reveals its config; webhook shows `X-Webhook-Secret`. |
| AUTO-REG02 | Regression | P1 | Create → Advanced → Network policy | Add domain `javascript:alert(1)`, `<script>`, `http://`, whitespace, valid domain | **BUG-006**: malformed accepted unvalidated. Expected: only valid domains. |
| AUTO-REG03 | Regression | P2 | Create → Advanced | Agent mode, child sessions, run-as-creator, metadata, ACU/rate limits | All render; numeric limits validate (-5/0/decimal). |
| AUTO-REG04 | Regression | P2 | Create | Prompt/playbook + repo/environment selection | Selectable; playbook invokable. |
| AUTO-REG05 | Regression | P2 | Automations | Auto-triage type (Slack channel monitor) | Config renders; channel selectable. |
| AUTO-E2E01 | E2E | P2 | Automations | Create webhook automation → POST to webhook with secret → session spawns | Valid secret → session created; invalid/missing secret → rejected. **N/E** unless approved. |

## Scheduled Sessions — `/settings/schedules`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SCHED-SMK01 | Smoke | P2 | Settings → Schedules | Load | Schedule list + Create render. |
| SCHED-SAN01 | Sanity | P2 | Schedules → Create | Set cron/recurrence + prompt | Valid cron accepted; invalid cron rejected. |
| SCHED-REG01 | Regression | P2 | Schedules | Create one-time + recurring; edit; delete | CRUD persists; next-run time correct. **N/E** on live / delete after. |
| SCHED-E2E01 | E2E | P2 | Schedules | Create near-term schedule → wait for fire | Session spawns at scheduled time; appears in Sessions list. **N/E** unless approved. |
