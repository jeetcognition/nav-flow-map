# 01 — Personal (Preferences & Connections)

PRD: §8.4/§11 Preferences/Profile; §7 personal integrations. Pages: `/settings/preferences`, `/settings/connections`.

## Preferences — `/settings/preferences`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| PREF-SMK01 | Smoke | P1 | Logo/avatar → Preferences, or open `/settings/preferences` | Load page cold | Renders sections: Profile, Name, Email, Theme, Display language, Notifications (In-app/Sound/Browser), Slack, Newsletter, Git commit author, Git commit email, Comment language. No console errors. |
| PREF-SAN01 | Sanity | P2 | On Preferences | Change **Theme** System→Dark | UI re-renders dark immediately (colorScheme:dark). |
| PREF-REG01 | Regression | P2 | On Preferences | Set Theme=Dark → reload → then revert to System | Dark persists after reload; revert restores System. |
| PREF-REG02 | Regression | P2 | On Preferences | Change **Display language** to each option; reload | Chosen language persists; UI strings localize (watch partial i18n — prior BUG-008 area). |
| PREF-REG03 | Regression | P1 | On Preferences | In **Name**, enter `<script>alert(1)</script>`, `' OR 1=1 --`, 5000-char string; save; reload | Payloads stored/rendered as inert text (no JS exec, no alert); long string truncated gracefully; DB returns saved value on reload. |
| PREF-REG04 | Regression | P2 | On Preferences | Rapid sequential Name edits (API spam) | No race corruption; last write wins; no duplicate/echoed errors. |
| PREF-REG05 | Regression | P1 | On Preferences | **Profile picture**: upload valid 10MB JPEG/PNG; then 50MB file; then `.exe`/`.svg`/polyglot | Valid image updates + persists; oversized/unsupported rejected with clear error (prior BUG-012: size boundary). No script exec via EXIF/SVG. |
| PREF-REG06 | Regression | P2 | On Preferences | Toggle each **notification** (In-app/Sound/Browser/Slack); reload; revert | Each toggle persists after reload; revert restores. |
| PREF-REG07 | Regression | P2 | On Preferences | **Git commit email**: enter invalid email, empty, 2000-char, `' OR 1=1 --` | Malformed rejected with validation; valid accepted + persists. |
| PREF-REG08 | Regression | P2 | On Preferences | **Git commit author** dropdown: select each option; reload | Selection persists; matches enterprise policy (if enterprise locks it, personal is overridden). |
| PREF-E2E01 | E2E | P2 | Fresh session | Set name + theme + language + commit author + notifications → reload → open a new session composer | All prefs reflected consistently across app; composer uses chosen commit author. |

## Connections (personal) — `/settings/connections?tab=integrations` / `?tab=mcps`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| PCON-SMK01 | Smoke | P1 | `/settings/connections` | Load Integrations tab | Providers render: GitHub, GitLab (+ self-hosted `gitlab.sbx.itsdev.in`), Slack, Linear; each shows Link or Unlink state. |
| PCON-SMK02 | Smoke | P2 | Connections | Switch to **MCPs** tab (`?tab=mcps`) | MCP list renders; no console errors (prior cosmetic CDN icon 404s acceptable). |
| PCON-SAN01 | Sanity | P2 | Connections | Click "Missing an integration?" / "Missing an MCP?" | Routes to `?tab=integrations` / `?tab=mcps` respectively; no open-redirect. |
| PCON-REG01 | Regression | P1 | Connections | **Link GitHub** | Redirect to GitHub OAuth with valid `state`; no XSS/open-redirect in redirect params. |
| PCON-REG02 | Regression | P1 | Connections | **Unlink** a linked account (GitLab/Slack) then re-link | API 200; UI shows "No account linked"; persists after reload; re-link restores. (N/E on shared QA acct unless approved.) |
| PCON-REG03 | Regression | P2 | Connections | Link **self-hosted GitLab**: enter instance URL — very long, `' OR 1=1 --`, non-https protocol | Malformed/instance URL validated; no SSRF to arbitrary protocol. |
| PCON-REG04 | Regression | P2 | Connections | Double-click Unlink (race) | Exactly one unlink; no orphaned token / zombie link. |
| PCON-REG05 | Regression | P2 | Connections | Force 403/404/500 during unlink | UI shows graceful error; no stack trace; state not desynced. |
| PCON-E2E01 | E2E | P1 | Connections → new session | Link GitHub → start session referencing a private repo | Session can access repo; PR opens under configured author. |
