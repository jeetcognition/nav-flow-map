# 05 — Devin Review

PRD §6.1 (Devin Review), §6.2 (bot comments). Pages: `/org/cog-enterprise-qa/settings/review`, review UI `/review/...`.

## Review settings — `/settings/review`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| REV-SMK01 | Smoke | P1 | Settings → Review | Load cold. | Devin Review settings, PR descriptions, security scan, PR comments, automatic review, rules, files, repositories, and self-enrolled users render without page errors. |
| REV-SAN01 | Sanity | P1 | Review | Switch Repositories and Self-enrolled users tabs. | Tab counts and lists render; URL/deep link preserves the selected tab. |
| REV-SAN02 | Sanity | P1 | Review | Open Add repo without submitting. | Repository search/selection, mode/host filters, Add gating, and close/cancel controls are visible. |
| REV-REG01 | Regression | P1 | Review → toggles | With approval, toggle PR descriptions, security scan, PR comments, findings categories, and CI checks, reload, then restore. | Each setting persists independently; failed saves preserve prior state. |
| REV-REG02 | Regression | P1 | Review → repositories | Search/filter repositories by host/mode and no-match/special text. | Filtering is literal and safe; current enrollment state remains associated with the correct repo. |
| REV-REG03 | Regression | P1 | Review → auto-review limits | Test blank, zero, negative, decimal, huge, and valid ACU limits, then restore. | Only supported values save; validation is clear and no partial update occurs. |
| REV-REG04 | Regression | P1 | Review → rules/files | Add invalid, duplicate, long, Unicode, and HTML-like rule/file patterns without saving or in disposable scope. | Invalid patterns are rejected; unsafe text is inert; valid patterns are scoped to the intended repository/enterprise. |
| REV-REG05 | Regression | P0 | Review | As non-admin or with tampered repo/user/enterprise IDs, attempt to enroll repos/users or update Review settings. | Server-side authorization denies unauthorized changes and cross-enterprise access. |
| REV-E2E01 | E2E | P1 | Review → Git provider PR | With approval, enroll a disposable repo/user and open a disposable PR. | Devin Review behavior follows saved settings; cleanup removes enrollment and restores original configuration. |

## Review UI — `/review/<owner>/<repo>/pull/<n>`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| REVUI-SMK01 | Smoke | P2 | Sub-org sidebar → Review, or `/review` | Load | Review landing renders; PR URL input present. |
| REVUI-REG01 | Regression | P2 | Review landing | Paste a valid PR URL → click **"Go to pull request"** button | **Known BUG-017**: button never enables; only pressing **Enter** submits. Expected once fixed: button enables on valid URL and submits. |
| REVUI-REG02 | Regression | P2 | Review landing | Enter invalid / nonexistent PR URL → Enter | Graceful "PR Not Found"; no crash. |
| REVUI-E2E01 | E2E | P2 | Review UI | Open a real reviewed PR → view findings → "fix with Devin" | Findings list renders; fix spawns a session. |
