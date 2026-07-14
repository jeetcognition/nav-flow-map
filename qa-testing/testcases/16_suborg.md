# 16 — Sub-org (jeet-test-org / slug jeet-devin-qa)

From R6 exploration. Reach: `/org/cog-enterprise-qa/org-selector` → search "jeet-test-org" → click. Sidebar: New session, Automations, Security, Review, Wiki. Slug `jeet-devin-qa` (display-name routes `/org/jeet-test-org/*` 404).

## Entry & Navigation

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-SMK01 | Smoke | P1 | Org-selector | Search "jeet-test-org" → click | Enters sub-org; home layout changes; sidebar shows New session/Automations/Security/Review/Wiki. |
| SUB-SMK02 | Smoke | P2 | Sub-org | Top-left logo/name menu | Shows Invite members + Enterprise settings entries. |
| SUB-REG01 | Regression | P2 | Sub-org | Visit `/org/jeet-test-org/...` (display name) | 404 (expected); slug `jeet-devin-qa` resolves. Document any place UI links the display name. |

## New session (composer) — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-NS-SMK01 | Smoke | P1 | Sub-org home | Load composer | Renders; Send gated on empty/whitespace. |
| SUB-NS-REG01 | Regression | P2 | Composer | Mode dropdown (Normal/Ultra/Agent/Standard), 9 add-context items, Ask toggle | All render/select; no crash. |
| SUB-NS-REG02 | Regression | P2 | Sidebar | Look for a Sessions list entry | **BUG-011**: no Sessions list in sub-org sidebar; direct route falls back to personal settings. Expected: Sessions accessible. |

## Automations — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-AU-SMK01 | Smoke | P1 | Sidebar → Automations | Load | Automations list + Create render. |
| SUB-AU-SAN01 | Sanity | P2 | Automations → Create | Submit with empty name | "Name is required"; creation blocked. |
| SUB-AU-REG01 | Regression | P2 | Create → Advanced | Expand Advanced (agent mode, child sessions, run-as-creator, network policy, metadata, ACU/rate limits) | All controls render. |
| SUB-AU-REG02 | Regression | P1 | Create → Advanced → Network policy | Add domain `javascript:alert(1)`, `<script>`, `http://`, whitespace | **BUG-006**: accepted unvalidated. Expected: reject malformed/non-allowlisted. |
| SUB-AU-REG03 | Regression | P2 | Create | Webhook trigger | Inline URL + `X-Webhook-Secret` notice present. |
| SUB-AU-E2E01 | E2E | P2 | Automations | Create schedule/webhook automation → trigger → session spawns | Event spawns a session; delivery target (Slack) receives result. **N/E** unless approved. |

## Security (code-scan) — sub-org
See `14_...` SCAN-*. Sub-org: Start-scan gating + Auto-Scan schedules + Profiles verified working (R6).

## Review — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-RV-SMK01 | Smoke | P2 | Sidebar → Review | Load | Review renders; PR URL input (dismiss intro modal — BL-043). |
| SUB-RV-REG01 | Regression | P2 | Review | Paste valid PR URL → click "Go to pull request" | **BUG-015**: button never enables; Enter submits (then works incl. graceful "PR Not Found"). |

## Wiki — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-WK-SMK01 | Smoke | P2 | Sidebar → Wiki | Load | Wiki renders; search present. |
| SUB-WK-REG01 | Regression | P2 | Wiki | Search XSS/emoji; open repo wiki | XSS-safe; repo wiki TOC renders. |

## Invite members & Org panel — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-IM-SMK01 | Smoke | P2 | Logo menu → Invite members | Open dialog | Renders email input (placeholder "Ex."). |
| SUB-IM-REG01 | Regression | P2 | Invite dialog | Empty email (Add disabled), invalid email (rejected on Add), valid | Gated/validated; no invite on invalid. (Don't send real invite → N/E.) |
| SUB-OS-SMK01 | Smoke | P2 | Logo → Enterprise settings → Organizations → jeet-test-org | Open right panel | Org panel + all 15 org-settings sub-pages render error-free. |
| SUB-OS-REG01 | Regression | P3 | Org panel | Membership link | **BL-041**: silently redirects to Enterprise Membership. Analytics heading says "Usage" (BL-042). |
