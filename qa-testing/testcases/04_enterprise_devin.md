# 04 — Enterprise Devin settings

PRD §2/§6.2 (Devin product + bot-comment). Page: `/org/cog-enterprise-qa/settings/enterprise-devin`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| DEVIN-SMK01 | Smoke | P1 | Settings → Devin | Load cold. | Sessions model/mode controls, native deployments, web search, git commit attribution, commit email, lock email, and PR behavior controls render without page errors. |
| DEVIN-SAN01 | Sanity | P1 | Devin | Inspect all switches and dropdowns without saving. | Current values and descriptions are clear; disabled/locked options explain why they cannot be changed. |
| DEVIN-REG01 | Regression | P1 | Devin → model/mode settings | With approval, toggle Ultra/Fast/SWE/GPT/Fusion settings one at a time, reload, then restore. | Each accepted change persists; rejected changes show actionable errors and leave prior state intact. |
| DEVIN-REG02 | Regression | P1 | Devin → tools/deployments | With approval, toggle native deployments and web search, reload, then restore. | New sessions receive allowed tools only according to saved settings; cleanup restores original state. |
| DEVIN-REG03 | Regression | P1 | Devin → Git commit attribution | Open/select each commit-author option and reload, then restore. | Selection persists; descriptions match effective git metadata behavior; enterprise policy overrides are explicit. |
| DEVIN-REG04 | Regression | P1 | Devin → Commit email | Test default/custom email, blank, malformed, long, Unicode, and injection-like values. | Valid email persists; invalid values are rejected server-side and unsafe text stays inert. |
| DEVIN-REG05 | Regression | P1 | Devin → PR behavior | Change Open PRs as option, reload, and restore. | Saved option is reflected consistently in UI and applies to later PR creation as documented. |
| DEVIN-REG06 | Regression | P0 | Devin | As non-admin or with tampered enterprise ID, attempt to update Devin settings. | Server-side authorization prevents unauthorized setting changes and privilege escalation. |
| DEVIN-E2E01 | E2E | P1 | Devin → new session → PR | With approval, set disposable git/PR behavior, create a session that opens a PR, then restore. | PR author/commit metadata follows settings; cleanup restores original enterprise configuration. |
