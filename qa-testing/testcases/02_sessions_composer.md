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
| SESS-SMK01 | Smoke | P1 | `/settings/enterprise-sessions` | Load | List renders; filter params (creator/archived/updatedDate) in URL; no console errors. |
| SESS-SAN01 | Sanity | P2 | Sessions | Use **Display** dropdown; select each option | View updates; no race on rapid open/close. |
| SESS-REG01 | Regression | P1 | Sessions | Search bar: `"><script>alert(1)</script>`, `SELECT * FROM sessions`, 10,000-char | Sanitized/handled; no exec; no buffer crash. |
| SESS-REG02 | Regression | P2 | Sessions | Filters (Creator/Archived/Date): inject `' OR 1=1 --`, empty, whitespace | Literal filtering; no 500; combining filters has no logic conflict/500. |
| SESS-REG03 | Regression | P2 | Sessions | Clear filters → reload | Filters purged; not cached in localStorage; URL clean. |
| SESS-REG04 | Regression | P2 | Sessions | Modify `?id=`/`?creator=` to another tenant's id (IDOR) | Server rejects cross-tenant; no data leak. |
| SESS-REG05 | Regression | P1 | Sessions | Session titles containing `<img src=x onerror=alert(1)>` | Rendered inert (stored-XSS safe). |
| SESS-REG06 | Regression | P2 | Sessions | Rapid double-click a session link | Exactly one navigation. |
| SESS-E2E01 | E2E | P2 | Sessions | Filter by creator+date → open a session → back | Filtered result correct; Back restores filter state. |

## Session Progress tools (PRD §2.3)

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| STOOL-SMK01 | Smoke | P1 | Open any running session | Load Progress tab | Shell / IDE(Editor) / Browser / Planner tabs render. |
| STOOL-SAN01 | Sanity | P2 | Session → Shell | Take over, type a command | Command executes; output streams. |
| STOOL-SAN02 | Sanity | P2 | Session → Browser | "Live Desktop" take-over | Can control Devin's Chrome (login/2FA). |
| STOOL-E2E01 | E2E | P2 | Session lifecycle | Prompt → plan → code → PR → offered test/video | PR created; end-to-end test + video recording offered/attached. |
