# 01 — Personal (Preferences & Connections)

PRD: §8.4/§11 Preferences/Profile; §7 personal integrations. Pages: `/settings/preferences`, `/settings/connections`.

## Preferences — `/settings/preferences`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| PREF-SMK01 | Smoke | P1 | Settings → Preferences | Load cold. | Profile, picture, name, email, user ID, display/theme, language, notifications, Git commit author/email, PR behavior, child-session approval, and Devin Review preferences render without page errors. |
| PREF-SAN01 | Sanity | P1 | Preferences | Inspect disabled/read-only identity fields and editable controls without saving. | Email/user ID are not accidentally editable; editable fields and dropdowns have clear current values and labels. |
| PREF-SAN02 | Sanity | P1 | Preferences | Open theme, language, commit-author, PR-open-mode, review-trigger, and comment-language dropdowns. | Options render, current selections are marked, Escape/outside click closes each menu without changing state. |
| PREF-REG01 | Regression | P1 | Preferences → Name | With approval, enter blank, whitespace, long, Unicode, emoji, HTML-like, and injection-like names, then restore original. | Validation is clear; unsafe text stays inert; accepted values persist after reload; cleanup restores the original name. |
| PREF-REG02 | Regression | P1 | Preferences → Picture | With approval, upload valid image, oversized image, unsupported extension, SVG/polyglot, and corrupted image, then restore original. | Valid image persists; invalid files are rejected safely; image metadata or SVG content cannot execute script. |
| PREF-REG03 | Regression | P1 | Preferences → Notifications | Toggle in-app, sound, browser, Slack, newsletter, and child-session approval options, reload, then restore. | Each setting persists independently; browser-permission denial is handled clearly; cleanup restores prior state. |
| PREF-REG04 | Regression | P1 | Preferences → Git/PR settings | Change commit author/email, PR draft behavior, PR-open mode, and review trigger with valid/invalid email inputs. | Valid selections persist; invalid email is rejected; enterprise locks/overrides are shown instead of silently ignored. |
| PREF-E2E01 | E2E | P1 | Preferences → new session/PR flow | With approval, set a disposable preference combination, reload, open composer/PR-related flow, then restore. | Preferences are reflected consistently in downstream UI; cleanup restores all original values. |

## Connections (personal) — `/settings/connections?tab=integrations` / `?tab=mcps`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| PCON-SMK01 | Smoke | P1 | Settings → Personal Connections | Load cold. | Integrations and MCP sections render; GitHub, GitLab, self-hosted GitLab, Slack, Linear, and team-enabled MCP rows show linked/unlinked state without exposing tokens. |
| PCON-SAN01 | Sanity | P1 | Personal Connections | Inspect linked and unlinked provider rows. | Provider names, account labels, Link/Unlink controls, and “Missing integration/MCP” guidance are readable and associated with the correct provider. |
| PCON-REG01 | Regression | P1 | Personal Connections → Link provider | Start OAuth/link flow for each unlinked provider and cancel before authorizing. | Redirect uses the correct provider, scoped callback, valid state, and no open redirect or scriptable parameter echo. |
| PCON-REG02 | Regression | P1 | Personal Connections → self-hosted GitLab | Open link flow and test invalid, non-HTTPS, localhost/private-IP, long, Unicode, and injection-like instance URLs. | Malformed or unsafe URLs are rejected before request; no SSRF-capable protocol or host is accepted. |
| PCON-REG03 | Regression | P1 | Personal Connections → Unlink | With approval, unlink a disposable/personal provider account, reload, then re-link. | UI and server state stay synchronized; no orphaned token remains; cleanup restores the link. |
| PCON-REG04 | Regression | P1 | Personal Connections → MCP | Inspect team-enabled MCP connection rows and start/cancel any available OAuth flow. | MCP descriptions and scopes are clear; OAuth cancellation leaves state unchanged; shared organization identity warnings are visible where applicable. |
| PCON-E2E01 | E2E | P1 | Personal Connections → new session | With approval, connect a disposable provider/MCP, start a session that uses it, then disconnect and retest. | Connected credentials are available only as documented; disconnect prevents new use without leaking credential values. |
