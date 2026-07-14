# 05 — Devin Review

PRD §6.1 (Devin Review), §6.2 (bot comments). Pages: `/org/cog-enterprise-qa/settings/review`, review UI `/review/...`.

## Review settings — `/settings/review`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| REV-SMK01 | Smoke | P1 | Enterprise settings → Review | Load | Renders "Devin Review"; 7 toggles: PR descriptions, Security scan, Bugs, Flags (investigate), Flags (note), Post GitHub CI checks, Post as PR comments, + Automatic review + spend limit. |
| REV-SMK02 | Smoke | P2 | Review | Switch Repositories / Self-enrolled tabs | Tabs render lists; no crash. |
| REV-SAN01 | Sanity | P2 | Review | Toggle **PR descriptions** ON→reload→revert | Persists after reload; revert restores. |
| REV-REG01 | Regression | P1 | Review | Toggle each of the 7 → reload → revert | Each persists; 4xx/5xx during save shows graceful error, state not desynced. (Enterprise-wide → revert each.) |
| REV-REG02 | Regression | P2 | Review | **Automatic review** repo/user enrollment tabs: add/remove a repo | Enrollment persists; search filters list. |
| REV-REG03 | Regression | P2 | Review | **Limit spend on automatic reviews**: enter -5/0/decimal/huge | Validated; invalid rejected or save gated. |
| REV-REG04 | Regression | P2 | Review | XSS in any config field/DOM attribute | Inert; no exec. |
| REV-E2E01 | E2E | P1 | Review → GitHub PR | Enable automatic review for a repo → open a PR there | Devin Review posts severity-ranked findings + PR comments per settings. |

## Review UI — `/review/<owner>/<repo>/pull/<n>`

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| REVUI-SMK01 | Smoke | P2 | Sub-org sidebar → Review, or `/review` | Load | Review landing renders; PR URL input present. |
| REVUI-REG01 | Regression | P2 | Review landing | Paste a valid PR URL → click **"Go to pull request"** button | **Known BUG-015**: button never enables; only pressing **Enter** submits. Expected once fixed: button enables on valid URL and submits. |
| REVUI-REG02 | Regression | P2 | Review landing | Enter invalid / nonexistent PR URL → Enter | Graceful "PR Not Found"; no crash. |
| REVUI-E2E01 | E2E | P2 | Review UI | Open a real reviewed PR → view findings → "fix with Devin" | Findings list renders; fix spawns a session. |
