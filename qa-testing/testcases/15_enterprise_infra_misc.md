# 15 — Enterprise Infra & Admin misc

PRD §8.3 (Service users/API keys), §8.8 (Outposts/VPC/Infra), §8.9 (Rollout/Sessions), §8.10 (Categories). Pages: `/settings/{devin-api, enterprise-members, enterprise-rollout, infrastructure, outpost-pools, enterprise-sessions, enterprise-skills}`.

## Devin API / Service users — `/settings/devin-api`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| API-SMK01 | Smoke | P1 | Enterprise settings → Devin API | Load | Service users list renders with `cog_*`/scoped tokens (masked). |
| API-REG01 | Regression | P2 | Devin API | Check for duplicate service-user names | **BUG-002** (WORSENED to 4×): multiple "test-api key" rows. Expected: unique or warn. |
| API-REG02 | Regression | P1 | Devin API | Create service user; verify token masked; scope permissions | Token shown once then masked; scopes enforced. **N/E** (creates real key) / delete after. |
| API-REG03 | Regression | P0 | Devin API | Confirm no full token/secret in DOM or logs | No plaintext token persisted in UI. |

## Enterprise Rollout — `/settings/enterprise-rollout`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ROLL-SMK01 | Smoke | P2 | `/settings/enterprise-rollout` | Load | **Access-gated** — "Access denied" for non-authorized (AUTO-057); with permission staged-rollout controls render. |

## Enterprise Sessions — `/settings/enterprise-sessions`
See `02_sessions_composer.md` (SESS-*).

## Outpost Pools / VPC / Infrastructure

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| OUT-SMK01 | Smoke | P2 | `/settings/outpost-pools` | Load | Outpost pool list / hypervisors render (or empty state if none). |
| VPC-SMK01 | Smoke | P2 | `/settings/vpc-monitoring` | Load | VPC monitoring renders (or empty state). |
| INFRA-SMK01 | Smoke | P2 | `/settings/infrastructure` | Load | Infrastructure page renders; no console errors. |
| INFRA-REG01 | Regression | P2 | Infrastructure | Any list search/filter | Inert to injection; filters apply. |

## Enterprise Skills — `/settings/enterprise-skills`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SKILL-SMK01 | Smoke | P2 | `/settings/enterprise-skills` (or sidebar Skills & Rules) | Load | Skills hub / skills analytics render. |
| SKILL-REG01 | Regression | P2 | Skills | View skill analytics; filter by repo/org | Charts render; filters apply. |

## Categories & Tags

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| TAG-SMK01 | Smoke | P3 | Enterprise categories page | Load | Categories/tags list renders for reporting. |
| TAG-REG01 | Regression | P3 | Categories | Create/rename a tag with XSS/long name | Inert; validated. **N/E** on live. |
