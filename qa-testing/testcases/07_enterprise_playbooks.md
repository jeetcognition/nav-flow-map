# 07 — Enterprise Playbooks

PRD §3.4 (Playbooks). Page: `/org/cog-enterprise-qa/settings/playbooks`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| PLAY-SMK01 | Smoke | P1 | Enterprise settings → Playbooks | Load | Renders "Playbooks"; tabs Enterprise (count) / System (count); table with playbook rows. |
| PLAY-SAN01 | Sanity | P2 | Playbooks | Click System tab / deep-link `?tab=community` | Switches to System list. |
| PLAY-SAN02 | Sanity | P2 | Playbooks | Deep-link invalid `?tab=zzz` | Falls back to Enterprise tab (no crash). |
| PLAY-REG01 | Regression | P1 | Playbooks | Search: `<script>`, `<img onerror>`, `' OR 1=1 --`, emoji, whitespace, 5000-char, no-match | Inert; no exec/crash; no-match empty state. |
| PLAY-REG02 | Regression | P1 | Playbooks | Load list containing a playbook literally named `<script>alert(1)</script>` | Row renders as inert text; no alert on load. |
| PLAY-REG03 | Regression | P2 | Playbooks | Sort by columns (name/updated) | Sort toggles asc/desc; stable. |
| PLAY-REG04 | Regression | P2 | Playbooks | **Create** playbook: empty name, XSS name, long body | Empty name blocked; XSS stored inert; persists. (N/E on live / delete after.) |
| PLAY-REG05 | Regression | P2 | Playbooks | **Edit** + **Delete** + **Duplicate** a test playbook | Each persists; reload confirms. |
| PLAY-E2E01 | E2E | P2 | Playbooks → composer | Create a playbook → invoke via `/` in prompt box | Playbook template inserts; session follows it. |
