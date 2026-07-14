# 06 — Enterprise Knowledge

PRD §3.1 (Knowledge). Page: `/org/cog-enterprise-qa/settings/knowledge`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| KNOW-SMK01 | Smoke | P1 | Enterprise settings → Knowledge | Load | Renders "Knowledge"; System / Enterprise folders present; no console errors. |
| KNOW-SAN01 | Sanity | P2 | Knowledge | Expand/collapse a folder | Tree expands; item rows render (trigger + body preview). |
| KNOW-SAN02 | Sanity | P2 | Knowledge | Search `knowledge` term | List filters to matches; clear restores. |
| KNOW-REG01 | Regression | P1 | Knowledge | Search: `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `' OR 1=1 --`, `{"$ne":null}`, emoji, whitespace-only, 5000-char, no-match | All inert (no alert), no crash, no 500; no-match shows empty state. |
| KNOW-REG02 | Regression | P1 | Knowledge | Load a note whose name/body contains XSS/Unicode/RTL-override | Rendered as inert text on load; no exec. |
| KNOW-REG03 | Regression | P2 | Knowledge | **Create** a note: empty trigger, XSS in body, 5000-char | Validation for empty; body stored inert; persists. (Data mutation → delete after, or N/E on live.) |
| KNOW-REG04 | Regression | P2 | Knowledge | **Edit** then **Delete** a test note | Edit persists; delete removes row; reload confirms. (N/E on real notes.) |
| KNOW-REG05 | Regression | P2 | Knowledge | Repo-scope a note; pin a note | Scope/pin persists; note surfaces only in scoped repo sessions. |
| KNOW-E2E01 | E2E | P2 | Knowledge → session | Add an org-wide "always do X" note → run a matching session | Devin references the note; post-session knowledge suggestion appears + approve/reject. |
