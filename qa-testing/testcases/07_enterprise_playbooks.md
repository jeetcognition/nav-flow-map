# 07 — Enterprise Playbooks

PRD §3.4 (Playbooks). Page: `/org/cog-enterprise-qa/settings/playbooks`.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| PLAY-SMK01 | Smoke | P1 | Enterprise settings → Playbooks | Load the page cold. | Heading, description/documentation, Enterprise/System tabs with counts, search, and table render without a page or console error. |
| PLAY-SAN01 | Sanity | P1 | Playbooks → Enterprise | Inspect the Enterprise list. | Create playbook, Name/Macro/Created by/Last updated columns, and Enterprise rows are visible and readable. |
| PLAY-SAN02 | Sanity | P1 | Playbooks → System | Inspect the System list. | System count and Cognition Team playbooks are visible; Create playbook is unavailable for the read-only System collection. |
| PLAY-SAN03 | Sanity | P1 | Playbooks → Enterprise | Click **Create playbook**. | Breadcrumb, Back to playbooks, name, author, Edit/Preview, editor, macro, Devin mode, Cancel, Save, and fullscreen controls are visible. |
| PLAY-SAN04 | Sanity | P1 | Playbooks → New playbook | Inspect the default editor content. | Overview, Procedure, Advice & Pointers, and Forbidden actions template sections plus the character counter are visible. |
| PLAY-REG01 | Regression | P1 | Playbooks | Search with matching, no-match, whitespace, emoji, long, HTML-like, and injection-like input; then clear. | Results filter safely; no-match state is clear; input remains inert; clearing restores the full list. |
| PLAY-REG02 | Regression | P0 | Playbooks | Load names, macros, and bodies containing HTML-like, Unicode, and RTL text. | Values render as inert text; no script executes or sensitive/internal data is exposed. |
| PLAY-REG03 | Regression | P1 | Playbooks | Sort each supported column repeatedly. | Sorting toggles ascending/descending, remains stable, and does not duplicate or omit rows. |
| PLAY-REG04 | Regression | P1 | Playbooks | Switch Enterprise/System tabs → refresh and deep-link each tab → open an invalid tab value. | Correct tab persists after reload; invalid values safely fall back without a crash. |
| PLAY-REG05 | Regression | P1 | Playbooks → New playbook | Attempt creation with blank name/body, duplicate name, excessive-length values, and HTML-like text. | Required validation is clear; unsafe text remains inert; no incomplete playbook is created. |
| PLAY-REG06 | Regression | P1 | Playbooks → New playbook | Try macros without `!`, with spaces, duplicates, unsupported characters, and excessive length. | Invalid or duplicate macros are rejected clearly; a valid unique macro is accepted. |
| PLAY-REG07 | Regression | P1 | Playbooks → New playbook | Create `qa-temp-playbook-<timestamp>` → verify in Enterprise/search → edit name/body/macro/mode → reload and verify → delete. | Create/read/update/delete persists correctly; cleanup confirms the disposable playbook is absent. |
| PLAY-REG08 | Regression | P1 | Playbooks → New or disposable playbook | Enter Markdown → switch Edit/Preview → enter and exit fullscreen. | Preview renders headings and lists safely; editor text is retained; fullscreen preserves content and controls. |
| PLAY-REG09 | Regression | P1 | Playbooks → New or disposable playbook | Add/remove editor text and paste a long body. | Character counter updates accurately; supported limits are enforced without unexpected truncation or lost content. |
| PLAY-REG10 | Regression | P1 | Playbooks → System | Attempt to open/edit a System playbook as admin and non-admin. | System playbooks remain readable but protected from modification; no hidden write path succeeds. |
| PLAY-REG11 | Regression | P1 | Playbooks → New or disposable playbook | Make unsaved changes, then use Back, Cancel, or another page. | A warning or documented discard behavior occurs; changes are not silently saved or lost. |
| PLAY-REG12 | Regression | P1 | Disposable playbook | Select each available Devin mode → save and reload → launch a session from the playbook → delete it. | Selected mode persists and the launched session uses that mode; cleanup removes the disposable playbook. |
| PLAY-REG13 | Regression | P0 | Playbooks | As an unauthorized user or with a tampered playbook ID, request enterprise playbook details, update, and delete. | Access is denied; private content and cross-organization playbooks are not exposed or changed. |
| PLAY-E2E01 | E2E | P0 | Playbooks → Create playbook → New session | Create a disposable playbook with a unique instruction and `!qa_temp_<timestamp>` macro → invoke the macro in a new session → verify mode/instruction → delete it. | The correct playbook launches and Devin follows its unique procedure; unrelated playbooks are not used; cleanup removes the disposable playbook. |
