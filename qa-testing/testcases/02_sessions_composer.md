# 02 — Home Composer, Sessions & Session Tools

PRD §2 (Sessions), §2.3 (Progress tab tools), §2.8 (DANA), §8.9 (enterprise-sessions). Pages: home `/`, `/search` (Ask), session page, `/settings/enterprise-sessions`.

## Home Composer — `/` (org home)

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| COMP-SMK01 | Smoke | P0 | Land on org home | Load home | Composer renders (prompt box, mode dropdown, repo/add-context, send). No console errors. |
| COMP-SMK02 | Smoke | P0 | Home | Type a prompt → Send | Session is created and opens; navigates to session page. |
| COMP-SAN01 | Sanity | P1 | Home | Click Send with empty box, then whitespace-only | Send disabled/blocked for empty AND whitespace-only (contenteditable). |
| COMP-SAN02 | Sanity | P1 | Home | Toggle **Ask / Agent** | URL reflects `?mode=ask` / `?mode=agent`; composer switches modes. |
| COMP-REG01 | Regression | P1 | Home | Open **mode dropdown** | Lists modes (Normal/Ultra/Agent/Standard + Mode/Speed groupings); selecting changes mode; no crash. |
| COMP-REG02 | Regression | P2 | Home | Open **Add context** menu | ~9 items render (files/repos/knowledge/etc.); each selectable. |
| COMP-REG03 | Regression | P2 | Home | Open **repo selector**, search with XSS/emoji/nonexistent | Inert filtering; no exec; no-match handled. |
| COMP-REG04 | Regression | P2 | Home | Send options → "Start session in background" | Option present; background start works. |
| COMP-REG05 | Regression | P1 | Home | Paste 10,000-char prompt; special chars/Unicode/`<script>` | Accepts/handles large input; renders inert; no crash. |
| COMP-E2E01 | E2E | P0 | Home → session | Enter prompt + select repo + playbook → Send → observe plan | Interactive plan proposed; session runs; can message mid-session. |

## Sessions list & Enterprise Sessions — `/settings/enterprise-sessions`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| SESS-SMK01 | Smoke | P1 | Settings → Sessions | Load cold. | Sessions list, search, Display, Creator, Archived Status, Updated date filters, Clear filters, counts, and rows render without page errors. |
| SESS-SAN01 | Sanity | P1 | Sessions | Inspect session rows. | Title/prompt preview, organization, date, status grouping, and navigation actions are readable and do not expose sensitive hidden content. |
| SESS-SAN02 | Sanity | P1 | Sessions | Open Display, Creator, Archived Status, and Updated date filters without applying destructive actions. | Options render, current filters are shown in URL/UI, and clearing filters resets only this page’s filter state. |
| SESS-REG01 | Regression | P1 | Sessions → Search | Search with matching title, no-match, whitespace, Unicode, long, HTML-like, and injection-like values. | Filtering is literal and safe; no-match is clear; stored session titles/prompts render inertly. |
| SESS-REG02 | Regression | P1 | Sessions → Filters | Combine creator, archived status, date, display, and search; refresh and Back/Forward. | Results remain consistent; URL/deep link restores filter state; Clear filters removes all criteria. |
| SESS-REG03 | Regression | P1 | Sessions | Open a session row, then use Back/Forward. | Navigation opens the correct session; returning restores prior filters, scroll, and list state. |
| SESS-REG04 | Regression | P0 | Sessions | As a restricted user or with tampered creator/session/enterprise IDs, request sessions outside the enterprise. | Server denies cross-enterprise or unauthorized session access; no prompt, transcript, attachment, or secret-derived data leaks. |
| SESS-REG05 | Regression | P1 | Sessions | Force list/search/filter API 403/404/500 or slow responses. | Loading and error states are scoped to the list; stale results are not presented as current. |
| SESS-E2E01 | E2E | P1 | Sessions | Filter to a known creator/date, open a session, return, then clear filters. | End-to-end session discovery and return navigation work without losing state. |

## Session Progress tools (PRD §2.3)

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| STOOL-SMK01 | Smoke | P1 | Open any running session | Load Progress tab | Shell / IDE(Editor) / Browser / Planner tabs render. |
| STOOL-SAN01 | Sanity | P2 | Session → Shell | Take over, type a command | Command executes; output streams. |
| STOOL-SAN02 | Sanity | P2 | Session → Browser | Open devinBrowser control for the session. | Can control Devin's Chrome (login/2FA). |
| STOOL-E2E01 | E2E | P2 | Session lifecycle | Prompt → plan → code → PR → offered test/video | PR created; end-to-end test + video recording offered/attached. |
