# 16 — Sub-org (jeet-test-org / slug jeet-devin-qa)

From R6 exploration. Reach: `/org/cog-enterprise-qa/org-selector` → search "jeet-test-org" → click. Sidebar: New session, Automations, Security, Review, Wiki. Slug `jeet-devin-qa` (display-name routes `/org/jeet-test-org/*` 404).

## Entry & Navigation

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-SAN01 | Sanity | P1 | Sub-org home | Open the Landing Repo Page after selecting `jeet-test-org`. | Top-left header shows the Devin logo, selected organization name `jeet-test-org`, and organization-menu control. |
| SUB-SAN02 | Sanity | P1 | Sub-org home | Inspect the **Recent** section. | Recent heading, search control, and overflow menu are visible and properly aligned. |
| SUB-SAN03 | Sanity | P1 | Sub-org home | Inspect the left sidebar navigation. | **New session**, **Automations**, **Security**, **Review**, and **Wiki** options are visible with the correct icons and readable labels. |

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
| SUB-RV-REG01 | Regression | P2 | Review | Paste valid PR URL → click "Go to pull request" | **BUG-017**: button never enables; Enter submits (then works incl. graceful "PR Not Found"). |

## Wiki — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-WK-SMK01 | Smoke | P2 | Sidebar → Wiki | Load | Wiki renders; search present. |
| SUB-WK-REG01 | Regression | P2 | Wiki | Search XSS/emoji; open repo wiki | XSS-safe; repo wiki TOC renders. |

## Top Left Menu & Org panel — sub-org

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SUB-IM-SAN01 | Sanity | P1 | Top-left organization menu | Open the organization dropdown. | Enterprise name/member count, **Enterprise settings**, **Invite members**, organization list, **Switch account**, and **Log out** are visible and readable. |
| SUB-IM-SAN02 | Sanity | P1 | Top-left organization menu | Inspect the organization list and current selection. | **All organizations** is clearly selected with a checkmark; organization names and add/search controls are visible without overlap or truncation. |
| SUB-IM-REG01 | Regression | P1 | Top-left organization menu | Select another organization from the list. | The selected organization opens and its name/context replaces the previous organization throughout the page. |
| SUB-IM-REG03 | Regression | P1 | Top-left organization menu | Click the `+` control beside **Organizations**. | User is navigated to the **Create organization** page. |
| SUB-IM-REG04 | Regression | P1 | Top-left organization menu | Click **Enterprise settings** and **Invite members**. | Each action opens the correct enterprise page or dialog without losing the current organization context. |
| SUB-IM-REG05 | Regression | P1 | Top-left organization menu | Click **Switch account**. | Account-selection flow opens safely and protected organization data is not exposed. |
| SUB-IM-REG06 | Regression | P0 | Top-left organization menu | Click **Log out**, then use browser Back. | The user is signed out and protected organization content cannot be reopened from browser history. |
| SUB-IM-REG07 | Regression | P1 | Top-left organization menu | Open and close the dropdown using its trigger, outside click, and Escape. | The menu opens/closes reliably, remains inside the viewport, and restores focus to its trigger. |
| SUB-IM-REG08 | Regression | P0 | Top-left organization menu | Inspect the dropdown UI, URL, and console while switching organizations/accounts. | No credentials, tokens, private organization data, or internal errors are exposed. |
| SUB-OS-SMK01 | Smoke | P1 | Settings → Organizations → `jeet-test-org` | Open Sub-orgs and Settings root cold. | Sub-org heading, preferences/settings copy, Products, Resources, Administration sections, and child links render without page errors. |
| SUB-OS-SAN01 | Sanity | P1 | Sub-orgs and Settings | Inspect visible child links. | General, Connections, Devin, Knowledge, Environment, Playbooks, Skills & Rules, Secrets, Repositories, Membership, Devin API, and Analytics are grouped under correct headings. |
| SUB-OS-REG01 | Regression | P1 | Sub-orgs and Settings | Click each visible child link and Back to the root without saving. | Each route opens the correct sub-org settings page and Back/return restores the root. |
| SUB-OS-REG02 | Regression | P1 | Sub-orgs and Settings | Deep-link, refresh, and browser Back/Forward on the root and child routes. | The selected sub-org remains `jeet-test-org`; navigation does not jump to enterprise-level pages unexpectedly. |
| SUB-OS-REG03 | Regression | P1 | Sub-orgs and Settings | Use global settings search with child-page labels, no-match, Unicode, long, HTML-like, and injection-like text. | Matching settings are found literally; unsafe text is inert; no unrelated tenant routes appear. |
| SUB-OS-REG04 | Regression | P0 | Sub-orgs and Settings | As a user without access or with tampered org slug, request the root and child settings pages. | Server denies unauthorized/cross-org access and does not expose settings metadata from another sub-org. |
| SUB-OS-E2E01 | E2E | P1 | Enterprise Organizations → Sub-orgs and Settings | Navigate from Organizations to `jeet-test-org`, open several child settings pages, then return to Organizations. | Cross-level navigation preserves enterprise/sub-org context and does not lose the selected organization. |
