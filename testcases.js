const TESTCASES = [
  {
    "id": "PREF-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Preferences",
    "steps": "Load cold.",
    "expected": "Profile, picture, name, email, user ID, display/theme, language, notifications, Git commit author/email, PR behavior, child-session approval, and Devin Review preferences render without page errors."
  },
  {
    "id": "PREF-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Preferences",
    "steps": "Inspect disabled/read-only identity fields and editable controls without saving.",
    "expected": "Email/user ID are not accidentally editable; editable fields and dropdowns have clear current values and labels."
  },
  {
    "id": "PREF-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Preferences",
    "steps": "Open theme, language, commit-author, PR-open-mode, review-trigger, and comment-language dropdowns.",
    "expected": "Options render, current selections are marked, Escape/outside click closes each menu without changing state."
  },
  {
    "id": "PREF-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Preferences → Name",
    "steps": "With approval, enter blank, whitespace, long, Unicode, emoji, HTML-like, and injection-like names, then restore original.",
    "expected": "Validation is clear; unsafe text stays inert; accepted values persist after reload; cleanup restores the original name."
  },
  {
    "id": "PREF-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Preferences → Picture",
    "steps": "With approval, upload valid image, oversized image, unsupported extension, SVG/polyglot, and corrupted image, then restore original.",
    "expected": "Valid image persists; invalid files are rejected safely; image metadata or SVG content cannot execute script."
  },
  {
    "id": "PREF-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Preferences → Notifications",
    "steps": "Toggle in-app, sound, browser, Slack, newsletter, and child-session approval options, reload, then restore.",
    "expected": "Each setting persists independently; browser-permission denial is handled clearly; cleanup restores prior state."
  },
  {
    "id": "PREF-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Preferences → Git/PR settings",
    "steps": "Change commit author/email, PR draft behavior, PR-open mode, and review trigger with valid/invalid email inputs.",
    "expected": "Valid selections persist; invalid email is rejected; enterprise locks/overrides are shown instead of silently ignored."
  },
  {
    "id": "PREF-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Preferences → new session/PR flow",
    "steps": "With approval, set a disposable preference combination, reload, open composer/PR-related flow, then restore.",
    "expected": "Preferences are reflected consistently in downstream UI; cleanup restores all original values."
  },
  {
    "id": "PCON-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Personal Connections",
    "steps": "Load cold.",
    "expected": "Integrations and MCP sections render; GitHub, GitLab, self-hosted GitLab, Slack, Linear, and team-enabled MCP rows show linked/unlinked state without exposing tokens."
  },
  {
    "id": "PCON-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Personal Connections",
    "steps": "Inspect linked and unlinked provider rows.",
    "expected": "Provider names, account labels, Link/Unlink controls, and “Missing integration/MCP” guidance are readable and associated with the correct provider."
  },
  {
    "id": "PCON-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Personal Connections → Link provider",
    "steps": "Start OAuth/link flow for each unlinked provider and cancel before authorizing.",
    "expected": "Redirect uses the correct provider, scoped callback, valid state, and no open redirect or scriptable parameter echo."
  },
  {
    "id": "PCON-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Personal Connections → self-hosted GitLab",
    "steps": "Open link flow and test invalid, non-HTTPS, localhost/private-IP, long, Unicode, and injection-like instance URLs.",
    "expected": "Malformed or unsafe URLs are rejected before request; no SSRF-capable protocol or host is accepted."
  },
  {
    "id": "PCON-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Personal Connections → Unlink",
    "steps": "With approval, unlink a disposable/personal provider account, reload, then re-link.",
    "expected": "UI and server state stay synchronized; no orphaned token remains; cleanup restores the link."
  },
  {
    "id": "PCON-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Personal Connections → MCP",
    "steps": "Inspect team-enabled MCP connection rows and start/cancel any available OAuth flow.",
    "expected": "MCP descriptions and scopes are clear; OAuth cancellation leaves state unchanged; shared organization identity warnings are visible where applicable."
  },
  {
    "id": "PCON-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Personal Connections → new session",
    "steps": "With approval, connect a disposable provider/MCP, start a session that uses it, then disconnect and retest.",
    "expected": "Connected credentials are available only as documented; disconnect prevents new use without leaking credential values."
  },
  {
    "id": "COMP-SMK01",
    "type": "Smoke",
    "pri": "P0",
    "reach": "Land on org home",
    "steps": "Load home",
    "expected": "Composer renders (prompt box, mode dropdown, repo/add-context, send). No console errors."
  },
  {
    "id": "COMP-SMK02",
    "type": "Smoke",
    "pri": "P0",
    "reach": "Home",
    "steps": "Type a prompt → Send",
    "expected": "Session is created and opens; navigates to session page."
  },
  {
    "id": "COMP-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Home",
    "steps": "Click Send with empty box, then whitespace-only",
    "expected": "Send disabled/blocked for empty AND whitespace-only (contenteditable)."
  },
  {
    "id": "COMP-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Home",
    "steps": "Toggle **Ask / Agent**",
    "expected": "URL reflects `?mode=ask` / `?mode=agent`; composer switches modes."
  },
  {
    "id": "COMP-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Home",
    "steps": "Open **mode dropdown**",
    "expected": "Lists modes (Normal/Ultra/Agent/Standard + Mode/Speed groupings); selecting changes mode; no crash."
  },
  {
    "id": "COMP-REG02",
    "type": "Regression",
    "pri": "P2",
    "reach": "Home",
    "steps": "Open **Add context** menu",
    "expected": "~9 items render (files/repos/knowledge/etc.); each selectable."
  },
  {
    "id": "COMP-REG03",
    "type": "Regression",
    "pri": "P2",
    "reach": "Home",
    "steps": "Open **repo selector**, search with XSS/emoji/nonexistent",
    "expected": "Inert filtering; no exec; no-match handled."
  },
  {
    "id": "COMP-REG04",
    "type": "Regression",
    "pri": "P2",
    "reach": "Home",
    "steps": "Send options → \"Start session in background\"",
    "expected": "Option present; background start works."
  },
  {
    "id": "COMP-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Home",
    "steps": "Paste 10,000-char prompt; special chars/Unicode/`<script>`",
    "expected": "Accepts/handles large input; renders inert; no crash."
  },
  {
    "id": "COMP-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Home → session",
    "steps": "Enter prompt + select repo + playbook → Send → observe plan",
    "expected": "Interactive plan proposed; session runs; can message mid-session."
  },
  {
    "id": "SESS-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Sessions",
    "steps": "Load cold.",
    "expected": "Sessions list, search, Display, Creator, Archived Status, Updated date filters, Clear filters, counts, and rows render without page errors."
  },
  {
    "id": "SESS-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Sessions",
    "steps": "Inspect session rows.",
    "expected": "Title/prompt preview, organization, date, status grouping, and navigation actions are readable and do not expose sensitive hidden content."
  },
  {
    "id": "SESS-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Sessions",
    "steps": "Open Display, Creator, Archived Status, and Updated date filters without applying destructive actions.",
    "expected": "Options render, current filters are shown in URL/UI, and clearing filters resets only this page’s filter state."
  },
  {
    "id": "SESS-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sessions → Search",
    "steps": "Search with matching title, no-match, whitespace, Unicode, long, HTML-like, and injection-like values.",
    "expected": "Filtering is literal and safe; no-match is clear; stored session titles/prompts render inertly."
  },
  {
    "id": "SESS-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sessions → Filters",
    "steps": "Combine creator, archived status, date, display, and search; refresh and Back/Forward.",
    "expected": "Results remain consistent; URL/deep link restores filter state; Clear filters removes all criteria."
  },
  {
    "id": "SESS-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sessions",
    "steps": "Open a session row, then use Back/Forward.",
    "expected": "Navigation opens the correct session; returning restores prior filters, scroll, and list state."
  },
  {
    "id": "SESS-REG04",
    "type": "Regression",
    "pri": "P0",
    "reach": "Sessions",
    "steps": "As a restricted user or with tampered creator/session/enterprise IDs, request sessions outside the enterprise.",
    "expected": "Server denies cross-enterprise or unauthorized session access; no prompt, transcript, attachment, or secret-derived data leaks."
  },
  {
    "id": "SESS-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sessions",
    "steps": "Force list/search/filter API 403/404/500 or slow responses.",
    "expected": "Loading and error states are scoped to the list; stale results are not presented as current."
  },
  {
    "id": "SESS-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Sessions",
    "steps": "Filter to a known creator/date, open a session, return, then clear filters.",
    "expected": "End-to-end session discovery and return navigation work without losing state."
  },
  {
    "id": "STOOL-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Open any running session",
    "steps": "Load Progress tab",
    "expected": "Shell / IDE(Editor) / Browser / Planner tabs render."
  },
  {
    "id": "STOOL-SAN01",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Session → Shell",
    "steps": "Take over, type a command",
    "expected": "Command executes; output streams."
  },
  {
    "id": "STOOL-SAN02",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Session → Browser",
    "steps": "\"Live Desktop\" take-over",
    "expected": "Can control Devin's Chrome (login/2FA)."
  },
  {
    "id": "STOOL-E2E01",
    "type": "E2E",
    "pri": "P2",
    "reach": "Session lifecycle",
    "steps": "Prompt → plan → code → PR → offered test/video",
    "expected": "PR created; end-to-end test + video recording offered/attached."
  },
  {
    "id": "GEN-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → General",
    "steps": "Load cold.",
    "expected": "General and Authentication sections render, including Require SSO for member access, without page errors."
  },
  {
    "id": "GEN-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "General",
    "steps": "Inspect the SSO requirement switch and help text without changing it.",
    "expected": "Current state, impact, and admin-only nature are clear; the control is not ambiguous or mislabeled."
  },
  {
    "id": "GEN-REG01",
    "type": "Regression",
    "pri": "P0",
    "reach": "General → Require SSO",
    "steps": "With explicit approval, toggle Require SSO, reload, then restore.",
    "expected": "State persists exactly; auth behavior follows the saved value; cleanup restores the original setting."
  },
  {
    "id": "GEN-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "General → Require SSO",
    "steps": "Force or simulate save failure while toggling.",
    "expected": "Error is clear; previous state is preserved; UI does not show a saved state that the server rejected."
  },
  {
    "id": "GEN-REG03",
    "type": "Regression",
    "pri": "P0",
    "reach": "General",
    "steps": "As non-admin or with tampered enterprise ID, attempt to view/update SSO settings.",
    "expected": "Server-side authorization denies unauthorized or cross-enterprise access."
  },
  {
    "id": "GEN-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "General",
    "steps": "Rapidly toggle SSO in a disposable/staging enterprise or mocked environment.",
    "expected": "Final persisted state is deterministic; concurrent saves cannot leave client/server disagreement."
  },
  {
    "id": "GEN-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "General",
    "steps": "Inspect UI, URL, console, and requests while loading and saving.",
    "expected": "No auth tokens, IdP secrets, stack traces, or internal configuration values are exposed."
  },
  {
    "id": "DEVIN-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Devin",
    "steps": "Load cold.",
    "expected": "Sessions model/mode controls, native deployments, web search, git commit attribution, commit email, lock email, and PR behavior controls render without page errors."
  },
  {
    "id": "DEVIN-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Devin",
    "steps": "Inspect all switches and dropdowns without saving.",
    "expected": "Current values and descriptions are clear; disabled/locked options explain why they cannot be changed."
  },
  {
    "id": "DEVIN-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin → model/mode settings",
    "steps": "With approval, toggle Ultra/Fast/SWE/GPT/Fusion settings one at a time, reload, then restore.",
    "expected": "Each accepted change persists; rejected changes show actionable errors and leave prior state intact."
  },
  {
    "id": "DEVIN-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin → tools/deployments",
    "steps": "With approval, toggle native deployments and web search, reload, then restore.",
    "expected": "New sessions receive allowed tools only according to saved settings; cleanup restores original state."
  },
  {
    "id": "DEVIN-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin → Git commit attribution",
    "steps": "Open/select each commit-author option and reload, then restore.",
    "expected": "Selection persists; descriptions match effective git metadata behavior; enterprise policy overrides are explicit."
  },
  {
    "id": "DEVIN-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin → Commit email",
    "steps": "Test default/custom email, blank, malformed, long, Unicode, and injection-like values.",
    "expected": "Valid email persists; invalid values are rejected server-side and unsafe text stays inert."
  },
  {
    "id": "DEVIN-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin → PR behavior",
    "steps": "Change Open PRs as option, reload, and restore.",
    "expected": "Saved option is reflected consistently in UI and applies to later PR creation as documented."
  },
  {
    "id": "DEVIN-REG06",
    "type": "Regression",
    "pri": "P0",
    "reach": "Devin",
    "steps": "As non-admin or with tampered enterprise ID, attempt to update Devin settings.",
    "expected": "Server-side authorization prevents unauthorized setting changes and privilege escalation."
  },
  {
    "id": "DEVIN-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Devin → new session → PR",
    "steps": "With approval, set disposable git/PR behavior, create a session that opens a PR, then restore.",
    "expected": "PR author/commit metadata follows settings; cleanup restores original enterprise configuration."
  },
  {
    "id": "REV-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Review",
    "steps": "Load cold.",
    "expected": "Devin Review settings, PR descriptions, security scan, PR comments, automatic review, rules, files, repositories, and self-enrolled users render without page errors."
  },
  {
    "id": "REV-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Review",
    "steps": "Switch Repositories and Self-enrolled users tabs.",
    "expected": "Tab counts and lists render; URL/deep link preserves the selected tab."
  },
  {
    "id": "REV-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Review",
    "steps": "Open Add repo without submitting.",
    "expected": "Repository search/selection, mode/host filters, Add gating, and close/cancel controls are visible."
  },
  {
    "id": "REV-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Review → toggles",
    "steps": "With approval, toggle PR descriptions, security scan, PR comments, findings categories, and CI checks, reload, then restore.",
    "expected": "Each setting persists independently; failed saves preserve prior state."
  },
  {
    "id": "REV-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Review → repositories",
    "steps": "Search/filter repositories by host/mode and no-match/special text.",
    "expected": "Filtering is literal and safe; current enrollment state remains associated with the correct repo."
  },
  {
    "id": "REV-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Review → auto-review limits",
    "steps": "Test blank, zero, negative, decimal, huge, and valid ACU limits, then restore.",
    "expected": "Only supported values save; validation is clear and no partial update occurs."
  },
  {
    "id": "REV-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Review → rules/files",
    "steps": "Add invalid, duplicate, long, Unicode, and HTML-like rule/file patterns without saving or in disposable scope.",
    "expected": "Invalid patterns are rejected; unsafe text is inert; valid patterns are scoped to the intended repository/enterprise."
  },
  {
    "id": "REV-REG05",
    "type": "Regression",
    "pri": "P0",
    "reach": "Review",
    "steps": "As non-admin or with tampered repo/user/enterprise IDs, attempt to enroll repos/users or update Review settings.",
    "expected": "Server-side authorization denies unauthorized changes and cross-enterprise access."
  },
  {
    "id": "REV-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Review → Git provider PR",
    "steps": "With approval, enroll a disposable repo/user and open a disposable PR.",
    "expected": "Devin Review behavior follows saved settings; cleanup removes enrollment and restores original configuration."
  },
  {
    "id": "REVUI-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "Sub-org sidebar → Review, or `/review`",
    "steps": "Load",
    "expected": "Review landing renders; PR URL input present."
  },
  {
    "id": "REVUI-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Review landing",
    "steps": "Paste a valid PR URL → click **\"Go to pull request\"** button",
    "expected": "**Known BUG-017**: button never enables; only pressing **Enter** submits. Expected once fixed: button enables on valid URL and submits."
  },
  {
    "id": "REVUI-REG02",
    "type": "Regression",
    "pri": "P2",
    "reach": "Review landing",
    "steps": "Enter invalid / nonexistent PR URL → Enter",
    "expected": "Graceful \"PR Not Found\"; no crash."
  },
  {
    "id": "REVUI-E2E01",
    "type": "E2E",
    "pri": "P2",
    "reach": "Review UI",
    "steps": "Open a real reviewed PR → view findings → \"fix with Devin\"",
    "expected": "Findings list renders; fix spawns a session."
  },
  {
    "id": "KNOW-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Enterprise settings → Knowledge",
    "steps": "Load the page cold.",
    "expected": "Knowledge heading, documentation link, search, Create knowledge, Name/Author/Created at columns, and System/Enterprise folders render without a page or console error."
  },
  {
    "id": "KNOW-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge",
    "steps": "Expand and collapse System knowledge and Enterprise knowledge.",
    "expected": "Each folder changes state independently; its rows appear or hide without overlap, duplication, or losing the current search."
  },
  {
    "id": "KNOW-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge",
    "steps": "Inspect the list page.",
    "expected": "Knowledge heading, documentation link, Create knowledge, search, Name/Author/Created at columns, and System/Enterprise knowledge rows are visible and readable."
  },
  {
    "id": "KNOW-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge",
    "steps": "Click **Create knowledge** without saving.",
    "expected": "Creation panel shows Notice, Contents, Macro, Folder, Pin to repository, Next, and Cancel controls."
  },
  {
    "id": "KNOW-SAN05",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge → Enterprise knowledge",
    "steps": "Select multiple Enterprise knowledge entries.",
    "expected": "Selected rows are highlighted; checkboxes, selected-count toolbar, clear-selection control, and Take action are visible."
  },
  {
    "id": "KNOW-SAN06",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge → select multiple Enterprise entries",
    "steps": "Click **Take action**.",
    "expected": "Search actions, Move to folder, Auto-organize selection, and Delete are visible. Move and Auto-organize remain disabled with clear reasons; Delete remains available."
  },
  {
    "id": "KNOW-SAN07",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge → open an entry",
    "steps": "Inspect the entry header.",
    "expected": "Back to knowledge, knowledge name, author, creation date, and Details/Usage tabs are visible and readable."
  },
  {
    "id": "KNOW-SAN08",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge entry → Details",
    "steps": "Inspect all controls.",
    "expected": "Content, Trigger, Pin to repository, Folder, Macro, Save, and Delete controls are visible with their current values."
  },
  {
    "id": "KNOW-SAN09",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Knowledge entry → Usage",
    "steps": "Inspect usage information.",
    "expected": "Session usage by day chart, Retrieved/Used legend, Last 30 days range, Sessions list, and View session controls are visible."
  },
  {
    "id": "KNOW-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge → disposable entry",
    "steps": "Pin the entry to a disposable repository → run matching and non-matching repository sessions → restore the original pin.",
    "expected": "Pin persists; knowledge is available only in its intended repository scope; cleanup restores the original repository selection."
  },
  {
    "id": "KNOW-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge",
    "steps": "Search with matching, non-matching, whitespace, emoji, long, `<script>`, and injection-like input; then clear.",
    "expected": "Results filter safely; no-match state is clear; special input remains inert; clearing restores the full list."
  },
  {
    "id": "KNOW-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge → Create knowledge",
    "steps": "Create `qa-temp-knowledge-<timestamp>` → verify it in list/search → edit its content, trigger, macro, folder, and repository pin → verify update → delete it.",
    "expected": "Create/read/update/delete succeeds; cleanup verifies the disposable knowledge no longer appears. Delete it even if an intermediate assertion fails."
  },
  {
    "id": "KNOW-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge → Create knowledge",
    "steps": "Attempt creation with blank name/content/trigger, duplicate name or macro, invalid macro, and excessive-length values.",
    "expected": "Clear validation appears; no incomplete or duplicate knowledge entry is created."
  },
  {
    "id": "KNOW-REG09",
    "type": "Regression",
    "pri": "P0",
    "reach": "Knowledge → disposable entry",
    "steps": "Create or edit fields with HTML-like, Unicode, and RTL text; inspect the UI, URL, console, and requests; then delete the entry.",
    "expected": "Text is escaped and rendered inert; no script executes, sensitive token appears, or unauthorized knowledge is returned."
  },
  {
    "id": "KNOW-REG10",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge → Enterprise knowledge",
    "steps": "Select multiple disposable entries → Take action → Delete → confirm.",
    "expected": "Confirmation identifies the selection; all selected disposable entries are deleted, unselected entries remain, and the selection toolbar closes."
  },
  {
    "id": "KNOW-REG11",
    "type": "Regression",
    "pri": "P1",
    "reach": "Disposable knowledge entry → Details",
    "steps": "Record original values → update Content, Trigger, repository pin, Folder, and Macro → Save → reload → restore originals.",
    "expected": "Every saved field persists after reload; cleanup restores the exact original entry state."
  },
  {
    "id": "KNOW-REG12",
    "type": "Regression",
    "pri": "P1",
    "reach": "Disposable knowledge entry → Details",
    "steps": "Enter blank, duplicate, long, Unicode, and HTML-like values in editable fields.",
    "expected": "Required-field and macro validation is clear; HTML-like content remains inert; invalid changes are not saved."
  },
  {
    "id": "KNOW-REG13",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge entry → Details",
    "steps": "Change a field without saving, then click Back to knowledge or switch to Usage.",
    "expected": "An unsaved-change warning appears or the documented discard behavior occurs; changes are not silently persisted or lost."
  },
  {
    "id": "KNOW-REG14",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge entry → Usage",
    "steps": "Compare the chart, Retrieved/Used legend, and displayed session records for the same period.",
    "expected": "Chart, legend, and session list represent the same knowledge entry and time range without stale or contradictory data."
  },
  {
    "id": "KNOW-REG15",
    "type": "Regression",
    "pri": "P1",
    "reach": "Knowledge entry → Usage",
    "steps": "Click **View session** for several rows, then return.",
    "expected": "Each control opens the correct session; returning restores the same knowledge entry, Usage tab, and list position."
  },
  {
    "id": "KNOW-REG16",
    "type": "Regression",
    "pri": "P1",
    "reach": "Newly created unused knowledge → Usage",
    "steps": "Open Usage before any matching session runs.",
    "expected": "A clear empty state appears; no chart or session data from another knowledge entry is shown."
  },
  {
    "id": "KNOW-REG17",
    "type": "Regression",
    "pri": "P0",
    "reach": "Knowledge entry → Usage",
    "steps": "As an unauthorized user or with tampered knowledge/session IDs, request Usage and View session.",
    "expected": "Access is denied; session names, prompts, users, and cross-organization usage data are not exposed."
  },
  {
    "id": "KNOW-REG18",
    "type": "Regression",
    "pri": "P1",
    "reach": "Disposable knowledge entry → Details",
    "steps": "Click Delete → cancel once → repeat and confirm.",
    "expected": "Cancel leaves the entry unchanged; confirmation deletes it, returns to Knowledge, and the entry no longer appears."
  },
  {
    "id": "KNOW-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Knowledge → Create knowledge → New session → Knowledge Usage",
    "steps": "Create disposable knowledge with unique Content and Trigger → start a session whose prompt matches the Trigger → verify Devin follows the unique instruction → locate the session in Usage and open it → delete the knowledge.",
    "expected": "Relevant knowledge is retrieved and applied only in the matching session; the correct session appears with accurate Retrieved/Used data; View session opens it; cleanup removes the disposable knowledge."
  },
  {
    "id": "PLAY-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Enterprise settings → Playbooks",
    "steps": "Load the page cold.",
    "expected": "Heading, description/documentation, Enterprise/System tabs with counts, search, and table render without a page or console error."
  },
  {
    "id": "PLAY-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Playbooks → Enterprise",
    "steps": "Inspect the Enterprise list.",
    "expected": "Create playbook, Name/Macro/Created by/Last updated columns, and Enterprise rows are visible and readable."
  },
  {
    "id": "PLAY-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Playbooks → System",
    "steps": "Inspect the System list.",
    "expected": "System count and Cognition Team playbooks are visible; Create playbook is unavailable for the read-only System collection."
  },
  {
    "id": "PLAY-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Playbooks → Enterprise",
    "steps": "Click **Create playbook**.",
    "expected": "Breadcrumb, Back to playbooks, name, author, Edit/Preview, editor, macro, Devin mode, Cancel, Save, and fullscreen controls are visible."
  },
  {
    "id": "PLAY-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Playbooks → New playbook",
    "steps": "Inspect the default editor content.",
    "expected": "Overview, Procedure, Advice & Pointers, and Forbidden actions template sections plus the character counter are visible."
  },
  {
    "id": "PLAY-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks",
    "steps": "Search with matching, no-match, whitespace, emoji, long, HTML-like, and injection-like input; then clear.",
    "expected": "Results filter safely; no-match state is clear; input remains inert; clearing restores the full list."
  },
  {
    "id": "PLAY-REG02",
    "type": "Regression",
    "pri": "P0",
    "reach": "Playbooks",
    "steps": "Load names, macros, and bodies containing HTML-like, Unicode, and RTL text.",
    "expected": "Values render as inert text; no script executes or sensitive/internal data is exposed."
  },
  {
    "id": "PLAY-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks",
    "steps": "Sort each supported column repeatedly.",
    "expected": "Sorting toggles ascending/descending, remains stable, and does not duplicate or omit rows."
  },
  {
    "id": "PLAY-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks",
    "steps": "Switch Enterprise/System tabs → refresh and deep-link each tab → open an invalid tab value.",
    "expected": "Correct tab persists after reload; invalid values safely fall back without a crash."
  },
  {
    "id": "PLAY-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → New playbook",
    "steps": "Attempt creation with blank name/body, duplicate name, excessive-length values, and HTML-like text.",
    "expected": "Required validation is clear; unsafe text remains inert; no incomplete playbook is created."
  },
  {
    "id": "PLAY-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → New playbook",
    "steps": "Try macros without `!`, with spaces, duplicates, unsupported characters, and excessive length.",
    "expected": "Invalid or duplicate macros are rejected clearly; a valid unique macro is accepted."
  },
  {
    "id": "PLAY-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → New playbook",
    "steps": "Create `qa-temp-playbook-<timestamp>` → verify in Enterprise/search → edit name/body/macro/mode → reload and verify → delete.",
    "expected": "Create/read/update/delete persists correctly; cleanup confirms the disposable playbook is absent."
  },
  {
    "id": "PLAY-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → New or disposable playbook",
    "steps": "Enter Markdown → switch Edit/Preview → enter and exit fullscreen.",
    "expected": "Preview renders headings and lists safely; editor text is retained; fullscreen preserves content and controls."
  },
  {
    "id": "PLAY-REG09",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → New or disposable playbook",
    "steps": "Add/remove editor text and paste a long body.",
    "expected": "Character counter updates accurately; supported limits are enforced without unexpected truncation or lost content."
  },
  {
    "id": "PLAY-REG10",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → System",
    "steps": "Attempt to open/edit a System playbook as admin and non-admin.",
    "expected": "System playbooks remain readable but protected from modification; no hidden write path succeeds."
  },
  {
    "id": "PLAY-REG11",
    "type": "Regression",
    "pri": "P1",
    "reach": "Playbooks → New or disposable playbook",
    "steps": "Make unsaved changes, then use Back, Cancel, or another page.",
    "expected": "A warning or documented discard behavior occurs; changes are not silently saved or lost."
  },
  {
    "id": "PLAY-REG12",
    "type": "Regression",
    "pri": "P1",
    "reach": "Disposable playbook",
    "steps": "Select each available Devin mode → save and reload → launch a session from the playbook → delete it.",
    "expected": "Selected mode persists and the launched session uses that mode; cleanup removes the disposable playbook."
  },
  {
    "id": "PLAY-REG13",
    "type": "Regression",
    "pri": "P0",
    "reach": "Playbooks",
    "steps": "As an unauthorized user or with a tampered playbook ID, request enterprise playbook details, update, and delete.",
    "expected": "Access is denied; private content and cross-organization playbooks are not exposed or changed."
  },
  {
    "id": "PLAY-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Playbooks → Create playbook → New session",
    "steps": "Create a disposable playbook with a unique instruction and `!qa_temp_<timestamp>` macro → invoke the macro in a new session → verify mode/instruction → delete it.",
    "expected": "The correct playbook launches and Devin follows its unique procedure; unrelated playbooks are not used; cleanup removes the disposable playbook."
  },
  {
    "id": "ENV-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Environment",
    "steps": "Load cold.",
    "expected": "Configuration, Blueprint, Outposts, Golden snapshot, Snapshots, and Steering knowledge surfaces render without page errors."
  },
  {
    "id": "ENV-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Environment",
    "steps": "Switch each tab and deep-link/refresh it.",
    "expected": "Selected tab content and URL state are consistent; invalid tab falls back safely."
  },
  {
    "id": "ENV-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Environment → Snapshots/Steering knowledge",
    "steps": "Inspect tables, search fields, filters, and pagination.",
    "expected": "Version/history/snapshot rows and steering knowledge rows are readable; search and filters do not hide critical status context."
  },
  {
    "id": "ENV-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Environment → Configuration",
    "steps": "Test organization/repository selection and required configuration controls without saving.",
    "expected": "Save/start actions are gated until valid selections exist; helper text identifies what will be affected."
  },
  {
    "id": "ENV-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Environment → Blueprint",
    "steps": "Edit disposable blueprint text with valid YAML, malformed YAML, huge content, Unicode, and HTML-like text; discard or restore.",
    "expected": "Parser/validation errors are clear; unsafe text is inert; no invalid blueprint is saved."
  },
  {
    "id": "ENV-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Environment → Outposts",
    "steps": "Inspect outpost configuration/list/empty states and available actions.",
    "expected": "Outpost state, ownership, and disabled controls are clear; no unrelated tenant data appears."
  },
  {
    "id": "ENV-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Environment → Golden snapshot",
    "steps": "Inspect legacy snapshot controls and warnings without changing state.",
    "expected": "Legacy status and migration/usage guidance are clear; unavailable actions are safely disabled."
  },
  {
    "id": "ENV-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Environment → Snapshots",
    "steps": "Search snapshot/version history by script/repo/user/status with no-match and special text.",
    "expected": "Filtering is literal and safe; row counts/statuses remain accurate; no stale data is shown after filter changes."
  },
  {
    "id": "ENV-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Environment → build/reset actions",
    "steps": "With approval only, start/reset/build a disposable environment operation and monitor result/logs.",
    "expected": "Operation status progresses clearly; failures expose logs without secrets; cleanup/rollback guidance is available."
  },
  {
    "id": "ENV-REG07",
    "type": "Regression",
    "pri": "P0",
    "reach": "Environment",
    "steps": "As non-admin or with tampered org/repo/snapshot IDs, attempt to read or mutate environment config.",
    "expected": "Authorization denies unauthorized access; blueprint contents, secrets, and logs are not leaked cross-tenant."
  },
  {
    "id": "ENV-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Environment → new session",
    "steps": "With approval, apply a minimal disposable blueprint change, build snapshot, start a session, then restore.",
    "expected": "New session reflects the snapshot/config exactly; cleanup returns blueprint/snapshot configuration to original state."
  },
  {
    "id": "MEMB-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Enterprise settings → Membership → Members",
    "steps": "Load the page cold.",
    "expected": "Heading, Learn more, tab counts, search, filters, Invite members, member table, and pagination render without a page or console error."
  },
  {
    "id": "MEMB-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Inspect the member table.",
    "expected": "Selection, Name, Email, Organizations, and Enterprise role columns are visible; names, emails, avatars, and role values are readable."
  },
  {
    "id": "MEMB-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Open **Invite members** without submitting.",
    "expected": "Role selector, multi-email field, close control, and disabled Add button are visible."
  },
  {
    "id": "MEMB-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Open **All organizations**.",
    "expected": "Search, All organizations, organization names, current selection, and scrolling are usable."
  },
  {
    "id": "MEMB-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Open **All enterprise roles** and the Invite-role selector.",
    "expected": "Search and available roles are visible; the current selection is marked."
  },
  {
    "id": "MEMB-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Search by matching/non-matching name or email, whitespace, Unicode, long, HTML-like, and injection-like text; then clear.",
    "expected": "Filtering is literal and safe; no-match state is clear; clearing restores the member list."
  },
  {
    "id": "MEMB-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Combine organization and enterprise-role filters → search within each dropdown → clear filters.",
    "expected": "Only matching members appear; combined filters use correct intersection logic; clearing restores all results."
  },
  {
    "id": "MEMB-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Members → Invite members",
    "steps": "Enter blank, malformed, duplicate, existing-member, whitespace-separated, comma-separated, mixed-validity, and excessive email lists.",
    "expected": "Add is gated correctly; actionable validation identifies invalid or duplicate entries; no unintended invite is sent."
  },
  {
    "id": "MEMB-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Sort Name ascending/descending and move through Previous, Next, and numbered pages with active search and filters.",
    "expected": "Sort and pagination are stable; no duplicate or missing rows appear; active criteria behave consistently."
  },
  {
    "id": "MEMB-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Members",
    "steps": "Expand members with zero, one, and many organizations.",
    "expected": "Correct organization memberships display for that member only; zero state is clear; expansion stays within the viewport."
  },
  {
    "id": "MEMB-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → disposable member",
    "steps": "Record the original role → assign a different role → reload → restore the original role.",
    "expected": "Role persists and effective access changes accordingly; cleanup restores the exact original role."
  },
  {
    "id": "MEMB-REG07",
    "type": "Regression",
    "pri": "P0",
    "reach": "Membership → Members",
    "steps": "As an unauthorized user or with a tampered member ID, attempt invite, role change, removal, and self-demotion.",
    "expected": "Unauthorized changes are denied; the last required admin cannot remove their own administrative access; cross-enterprise data is not exposed."
  },
  {
    "id": "MEMB-REG08",
    "type": "Regression",
    "pri": "P0",
    "reach": "Membership → Members",
    "steps": "Inspect URLs, UI, console, and requests while searching, filtering, expanding memberships, and opening Invite members.",
    "expected": "No invitation token, credential, private profile data, or internal error is exposed."
  },
  {
    "id": "MEMB-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Membership → Members",
    "steps": "Invite a disposable account with Member role → accept → assign a disposable role and organization → verify allowed/denied actions → remove or revoke it.",
    "expected": "Membership and permissions match the assignment; cleanup removes enterprise and organization access plus the disposable invite/member."
  },
  {
    "id": "ROLE-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Membership → Roles",
    "steps": "Load the page cold.",
    "expected": "Role count, search, scope filter, Create role, and Role/Permissions/Scope/Type columns render without a page or console error."
  },
  {
    "id": "ROLE-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Membership → Roles",
    "steps": "Inspect role rows.",
    "expected": "Enterprise/Organization scope and Built-in/Default/Custom badges are visible with permission counts."
  },
  {
    "id": "ROLE-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Membership → Roles",
    "steps": "Open the scope filter and **Create role** menu.",
    "expected": "All/Enterprise/Organization filters and Create for enterprise/Create for organizations actions are visible."
  },
  {
    "id": "ROLE-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Roles → Create for enterprise",
    "steps": "Open the form without saving.",
    "expected": "Role name, Cancel, disabled Save changes, permission descriptions, checkboxes, and enterprise permission groups are visible."
  },
  {
    "id": "ROLE-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Roles → Create for organizations",
    "steps": "Open the form without saving.",
    "expected": "Organization-specific Usage, Membership, Resource, Data, Stats, Code scan, and Session category permission groups are visible."
  },
  {
    "id": "ROLE-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Roles",
    "steps": "Search with matching/no-match, whitespace, Unicode, long, HTML-like, and injection-like values; then clear.",
    "expected": "Results filter safely; no-match state is clear; clearing restores the list."
  },
  {
    "id": "ROLE-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Roles",
    "steps": "Filter All, Enterprise, and Organization while searching.",
    "expected": "Rows match the selected scope; same-named roles remain distinguishable by scope; counts and results do not become stale."
  },
  {
    "id": "ROLE-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Roles",
    "steps": "Open Built-in, Default, and Custom roles.",
    "expected": "Protected roles cannot be modified or deleted; Custom roles expose only permitted edit controls."
  },
  {
    "id": "ROLE-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Roles → Create role",
    "steps": "Attempt creation with blank, duplicate-within-scope, long, whitespace-only, Unicode, emoji, and HTML-like names, with zero permissions.",
    "expected": "Clear validation appears; unsafe text stays inert; no invalid role is created; same names in different scopes remain unambiguous if supported."
  },
  {
    "id": "ROLE-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Roles → Create role",
    "steps": "Expand/collapse permission groups and select/deselect permissions across groups.",
    "expected": "Group state and checkbox selection remain accurate; descriptions stay aligned; implied or dependent permissions are handled clearly."
  },
  {
    "id": "ROLE-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Roles → Create for enterprise",
    "steps": "Create `qa-temp-enterprise-role-<timestamp>` with minimal permissions → verify → edit name/permissions → reload → delete.",
    "expected": "Enterprise role create/read/update/delete persists correctly; cleanup confirms the role is absent."
  },
  {
    "id": "ROLE-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Roles → Create for organizations",
    "steps": "Create `qa-temp-org-role-<timestamp>` → assign to a disposable organization/member → edit → unassign → delete.",
    "expected": "Organization role applies only in the assigned organization; cleanup removes all assignments and the role."
  },
  {
    "id": "ROLE-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "Roles → Create or edit role",
    "steps": "Make unsaved changes, then use Cancel, Back, or another page.",
    "expected": "A warning or documented discard behavior occurs; changes are not silently saved or lost."
  },
  {
    "id": "ROLE-REG09",
    "type": "Regression",
    "pri": "P1",
    "reach": "Disposable role",
    "steps": "Delete an unassigned role, then attempt deletion while another disposable role is assigned.",
    "expected": "Confirmation is required; assigned-role handling is clear and safe; unrelated roles and assignments remain unchanged."
  },
  {
    "id": "ROLE-REG10",
    "type": "Regression",
    "pri": "P0",
    "reach": "Membership → Roles",
    "steps": "As a restricted admin or with a tampered role ID, attempt view/create/edit/delete or grant permissions the actor lacks.",
    "expected": "Server-side authorization denies privilege escalation and cross-enterprise access."
  },
  {
    "id": "ROLE-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Roles → Membership",
    "steps": "Create a minimal disposable role → assign it to a disposable member → verify one allowed and one denied operation → edit permissions and retest → unassign and delete.",
    "expected": "Effective permissions follow the role exactly; updates propagate correctly; cleanup removes the assignment, role, and disposable member."
  },
  {
    "id": "IDP-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Membership → Groups (IdP)",
    "steps": "Load the page cold.",
    "expected": "Groups tab activates with count zero; No groups found and IdP/SSO setup guidance are visible."
  },
  {
    "id": "IDP-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Membership → Groups (IdP)",
    "steps": "Deep-link, refresh, and use Back/Forward on `?tab=groups`.",
    "expected": "Groups remains selected; the empty state does not show stale members, roles, or groups from another tenant."
  },
  {
    "id": "IDP-REG02",
    "type": "Regression",
    "pri": "P0",
    "reach": "Membership → Groups (IdP)",
    "steps": "Open Groups as a non-admin or with a tampered enterprise context.",
    "expected": "Access follows authorization rules and no cross-enterprise IdP configuration or group data is exposed."
  },
  {
    "id": "ORG-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Enterprise settings → Organizations",
    "steps": "Load the page cold.",
    "expected": "Breadcrumb, Back to enterprise, heading and description, search, Create organization, table, row actions, and pagination render without page or console errors."
  },
  {
    "id": "ORG-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "Inspect the table.",
    "expected": "Selection, Name, Members, Repositories, and Billing cycle ACU limit columns are visible; each edit and delete action belongs to the correct row."
  },
  {
    "id": "ORG-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "Open a row's edit control without saving.",
    "expected": "**Manage organization** modal shows the selected organization name, Billing cycle ACU limit, helper text, and Save changes; current values match the selected row."
  },
  {
    "id": "ORG-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "Inspect the first and last pages.",
    "expected": "Previous and Next controls are visible and correctly enabled or disabled for the current page."
  },
  {
    "id": "ORG-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "Search with full/partial name, no-match, whitespace, case variants, Unicode, long, HTML-like, and injection-like text; then clear.",
    "expected": "Filtering is literal and safe; no-match state is clear; clearing restores the organization list."
  },
  {
    "id": "ORG-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "When multiple existing rows share a display name, search for the name and open each row's edit and delete controls without saving.",
    "expected": "Each organization remains unambiguously identifiable; every action targets only the selected row and never another matching organization."
  },
  {
    "id": "ORG-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "Navigate Previous and Next while search is active, then clear search.",
    "expected": "No rows are duplicated or omitted; page state remains valid when filtering reduces the result count."
  },
  {
    "id": "ORG-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations",
    "steps": "Select and deselect one row and the header checkbox across pages.",
    "expected": "Selection state and counts are accurate; selection never triggers edit or delete; hidden-page rows are not modified unexpectedly."
  },
  {
    "id": "ORG-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations → disposable organization",
    "steps": "Record original values → change the name and ACU limit to a valid positive integer → save → reload → restore the originals.",
    "expected": "Save succeeds; the table and modal show persisted values; cleanup restores the exact original state."
  },
  {
    "id": "ORG-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations → Manage organization",
    "steps": "Enter blank, whitespace-only, duplicate, long, Unicode, emoji, HTML-like, and leading/trailing-space names.",
    "expected": "Clear validation appears; unsafe text remains inert; invalid names are not saved; whitespace is handled consistently."
  },
  {
    "id": "ORG-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations → Manage organization",
    "steps": "Enter No limit or blank, zero, negative, decimal, text, exponent notation, and leading-zero ACU values.",
    "expected": "Supported values save consistently; invalid values show actionable validation and never partially update the organization."
  },
  {
    "id": "ORG-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations → Manage organization",
    "steps": "Enter boundary and extremely large positive ACU values, then attempt to save.",
    "expected": "The supported range is validated before submission; out-of-range values are rejected clearly and no partial update occurs."
  },
  {
    "id": "ORG-REG09",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations → Manage organization",
    "steps": "Make unsaved changes, then click outside, press Escape, use Back, or navigate away.",
    "expected": "A warning or documented discard behavior occurs; changes are not silently saved or lost."
  },
  {
    "id": "ORG-REG10",
    "type": "Regression",
    "pri": "P1",
    "reach": "Organizations → disposable organization",
    "steps": "Click delete → cancel → repeat and confirm.",
    "expected": "Confirmation identifies the exact organization; cancel changes nothing; confirm removes only the disposable organization and handles dependencies safely."
  },
  {
    "id": "ORG-REG11",
    "type": "Regression",
    "pri": "P0",
    "reach": "Organizations",
    "steps": "As a non-admin or with a tampered organization ID, attempt list, edit, ACU update, and delete operations.",
    "expected": "Server-side authorization denies unauthorized and cross-enterprise access without changing organization data."
  },
  {
    "id": "ORG-REG12",
    "type": "Regression",
    "pri": "P0",
    "reach": "Organizations",
    "steps": "Inspect URL, UI, console, and requests during search, edit, and delete workflows.",
    "expected": "No credentials, tenant secrets, private member data, stack traces, or unnecessary internal identifiers are exposed."
  },
  {
    "id": "ORGCRT-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Organizations → Create organization",
    "steps": "Load the page cold.",
    "expected": "Breadcrumb, Back to Organizations, heading, name and ACU fields, Members, Repository permissions, Cancel, and Create render without page or console errors."
  },
  {
    "id": "ORGCRT-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Create organization",
    "steps": "Inspect the untouched form.",
    "expected": "Organization name is blank, Billing cycle ACU limit shows No limit, and Create is disabled."
  },
  {
    "id": "ORGCRT-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Create organization → Members",
    "steps": "Inspect the default member state.",
    "expected": "Add me as a member, member search, Name and Email columns, pagination, and selected count are visible; the current user is selected by default."
  },
  {
    "id": "ORGCRT-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Create organization → Repository permissions",
    "steps": "Inspect the section without submitting.",
    "expected": "No permissions by default and the repository-permissions link are visible; the form does not silently grant repository access."
  },
  {
    "id": "ORGCRT-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization",
    "steps": "Enter blank, whitespace-only, duplicate, long, Unicode, emoji, HTML-like, and leading or trailing-space names.",
    "expected": "Invalid or duplicate names are rejected clearly; unsafe text remains inert; Create stays gated until the name is valid."
  },
  {
    "id": "ORGCRT-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization",
    "steps": "Enter blank or No limit, zero, a valid positive integer, negative, decimal, text, exponent notation, and leading-zero ACU values.",
    "expected": "Only supported values enable Create; invalid values show actionable validation and no organization is partially created."
  },
  {
    "id": "ORGCRT-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization",
    "steps": "Enter boundary and extremely large ACU values such as `100000000000000`.",
    "expected": "The supported range is shown and out-of-range values are rejected before submission."
  },
  {
    "id": "ORGCRT-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization → Members",
    "steps": "Search by member name and email, then try no-match, whitespace, Unicode, long, and HTML-like input; clear it.",
    "expected": "Results filter safely; No members found appears when appropriate; clearing restores the member table."
  },
  {
    "id": "ORGCRT-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization → Members",
    "steps": "Select and deselect members across several pages and searches.",
    "expected": "Selected count and checkboxes remain accurate; no intended selection is lost and no unrelated member is added."
  },
  {
    "id": "ORGCRT-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization → Members",
    "steps": "Toggle Add me as a member while selecting other members.",
    "expected": "Current-user selection and the corresponding table row remain consistent; duplicate membership is impossible."
  },
  {
    "id": "ORGCRT-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization",
    "steps": "Enter form data, then use Cancel, Back, refresh, and revisit the URL without submitting.",
    "expected": "No organization is created; returning starts a clean form or restores state only through documented behavior."
  },
  {
    "id": "ORGCRT-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create organization → Repository permissions",
    "steps": "Follow the repository-permissions link, then return.",
    "expected": "The correct settings page opens; incomplete organization data is not submitted or retained unexpectedly."
  },
  {
    "id": "ORGCRT-REG09",
    "type": "Regression",
    "pri": "P0",
    "reach": "Create organization",
    "steps": "As a non-admin or with a tampered enterprise route, open and attempt to submit the form.",
    "expected": "Server-side authorization denies creation and cross-enterprise member access without changing organization data."
  },
  {
    "id": "ORGCRT-REG10",
    "type": "Regression",
    "pri": "P0",
    "reach": "Create organization",
    "steps": "Inspect URL, UI, console, and requests while entering names, ACU limits, and member searches.",
    "expected": "No credentials, private member data, tenant secrets, stack traces, or unnecessary identifiers are exposed."
  },
  {
    "id": "ORGCRT-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Create organization",
    "steps": "With explicit approval, create `qa-temp-org-<timestamp>` using a bounded ACU limit and disposable member → verify it in Organizations, verify membership and no default repository permissions → delete it.",
    "expected": "Creation and tenant isolation work correctly; cleanup confirms the temporary organization and its access are removed even if an intermediate assertion fails."
  },
  {
    "id": "ANAL-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Analytics",
    "steps": "Load cold.",
    "expected": "Usage, Consumption, Categories, date range, organization filter, Overall/Organizations/Users/Repositories views, refresh, export, charts, and KPIs render without page errors."
  },
  {
    "id": "ANAL-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Analytics",
    "steps": "Switch Usage, Consumption, and Categories; then Overall, Organizations, Users, Repositories.",
    "expected": "Tab/view selection updates charts and URL/deep link consistently."
  },
  {
    "id": "ANAL-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Analytics",
    "steps": "Open date range, organization, view, and grouping dropdowns.",
    "expected": "Options are readable, current selections are marked, and closing without selection leaves charts unchanged."
  },
  {
    "id": "ANAL-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Analytics → Date range",
    "steps": "Select current/previous/custom ranges including start>end, same-day, future, and very large range.",
    "expected": "Invalid ranges are rejected or clamped clearly; valid ranges refetch all widgets without stale data."
  },
  {
    "id": "ANAL-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Analytics → Organization filter",
    "steps": "Search/select all organizations and one organization with no-match, Unicode, long, HTML-like, and injection-like input.",
    "expected": "Filtering is literal and safe; charts rescope only to allowed organizations."
  },
  {
    "id": "ANAL-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Analytics → charts",
    "steps": "Switch by size/origin/grouping and daily/weekly/monthly where available.",
    "expected": "Chart labels, totals, legends, and empty states update consistently; no NaN or broken axis labels appear."
  },
  {
    "id": "ANAL-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Analytics → Export/refresh",
    "steps": "Refresh data and export each supported view/range.",
    "expected": "Refresh timestamp updates correctly; export file matches active filters and contains no unauthorized user/session detail."
  },
  {
    "id": "ANAL-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Analytics",
    "steps": "Tamper query params for dates, org IDs, tab/view, and grouping with invalid and HTML-like values.",
    "expected": "App falls back safely or shows validation; no XSS echo, 500, or cross-tenant data leak."
  },
  {
    "id": "ANAL-REG06",
    "type": "Regression",
    "pri": "P0",
    "reach": "Analytics",
    "steps": "As restricted user or with tampered org/user/repo IDs, request analytics outside the enterprise.",
    "expected": "Server denies unauthorized metrics and does not expose private usage, cost, or session metadata."
  },
  {
    "id": "ANAL-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Analytics",
    "steps": "Set date range + organization + view, refresh, export, deep-link reload, then clear/restore defaults.",
    "expected": "Full analytics state is reproducible through URL and exported data matches the selected UI scope."
  },
  {
    "id": "ECON-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Connections",
    "steps": "Load Integrations cold.",
    "expected": "Git providers, communication, and task-management providers render with counts/status and no page errors."
  },
  {
    "id": "ECON-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Connections",
    "steps": "Inspect GitHub, GitLab, Bitbucket, Azure DevOps, Slack, Teams, Linear, and Jira cards.",
    "expected": "Each provider shows a clear connected/not-connected/user-linked state and the correct Configure action."
  },
  {
    "id": "ECON-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Connections → MCP servers",
    "steps": "Switch to MCP servers.",
    "expected": "MCP count/list renders; tab state is reflected in URL/deep link; returning to Integrations restores its content."
  },
  {
    "id": "ECON-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Connections → Configure provider",
    "steps": "Start and cancel each Configure/OAuth flow.",
    "expected": "Correct provider is targeted; callback/state is safe; cancellation does not create a partial connection."
  },
  {
    "id": "ECON-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Connections",
    "steps": "Search/filter integration and MCP lists with no-match, whitespace, Unicode, long, HTML-like, and injection-like text.",
    "expected": "Filtering is literal and safe; empty/no-match state is clear; clearing restores the full active tab."
  },
  {
    "id": "ECON-MCP-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Connections → MCP servers",
    "steps": "Open server details or policy controls without saving.",
    "expected": "Transport, scopes, access policy, and usage details render without exposing secrets or credentials."
  },
  {
    "id": "ECON-MCP-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Connections → MCP servers",
    "steps": "With approval, allow/deny or connect/disconnect a disposable MCP server, reload, then restore.",
    "expected": "Policy persists, affects new sessions as documented, and cleanup returns the server to its original state."
  },
  {
    "id": "ECON-MCP-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Connections → custom/server config",
    "steps": "Test malformed URL, non-HTTPS/local/private hosts, long names, duplicate names, and HTML-like fields.",
    "expected": "Invalid server definitions are rejected safely; unsafe text is inert; no SSRF-capable endpoint is accepted."
  },
  {
    "id": "ECON-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Connections → new session",
    "steps": "With approval, enable a disposable integration/MCP and start a new session that attempts to use it.",
    "expected": "Tool/credential availability matches the enterprise and personal connection state; cleanup removes access."
  },
  {
    "id": "REPO-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Repositories",
    "steps": "Load cold.",
    "expected": "Organization selector renders first with no page errors; repository controls are gated until an organization is selected."
  },
  {
    "id": "REPO-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Repositories",
    "steps": "Open organization selector and choose `jeet-test-org` without mutating permissions.",
    "expected": "Selected organization is shown; repository list/permissions state loads only for that organization."
  },
  {
    "id": "REPO-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Repositories → selected org",
    "steps": "Inspect repo list, provider/status/permission columns, filters, and available actions.",
    "expected": "Rows are associated with the selected org; permissions/actions are clearly labeled."
  },
  {
    "id": "REPO-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Repositories",
    "steps": "Search repos with match/no-match, whitespace, Unicode, long, HTML-like, and injection-like text.",
    "expected": "Filtering is literal and safe; clearing restores selected organization’s repository list."
  },
  {
    "id": "REPO-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Repositories",
    "steps": "Combine provider/status/permission filters, pagination, and organization switching.",
    "expected": "Filters reset or persist only as documented; no stale rows from another organization appear."
  },
  {
    "id": "REPO-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Repositories",
    "steps": "With approval, add/remove or change permission for a disposable repository/member, reload, then restore.",
    "expected": "Permission changes persist for the correct repo/org only; cleanup restores original access."
  },
  {
    "id": "REPO-REG04",
    "type": "Regression",
    "pri": "P0",
    "reach": "Repositories",
    "steps": "As restricted user or with tampered org/repo IDs, request or mutate repository permissions.",
    "expected": "Server denies unauthorized/cross-tenant access and does not expose private repo metadata."
  },
  {
    "id": "REPO-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Repositories → session",
    "steps": "With approval, grant disposable repo access, start a session that references it, then revoke and retest.",
    "expected": "Session access follows repository permissions; revocation prevents new access after cleanup."
  },
  {
    "id": "DWIKI-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "`/settings/deepwiki` or left nav DeepWiki",
    "steps": "Load",
    "expected": "DeepWiki renders for an indexed repo (architecture wiki + diagrams)."
  },
  {
    "id": "DWIKI-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "DeepWiki",
    "steps": "Search wiki; XSS in query",
    "expected": "Inert; results render."
  },
  {
    "id": "GUARD-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Guardrails",
    "steps": "Load cold.",
    "expected": "Guardrails and Violations tabs, guardrail categories, action selectors, and descriptions render without page errors."
  },
  {
    "id": "GUARD-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Guardrails",
    "steps": "Inspect available guardrails and current action settings.",
    "expected": "Real-time request analysis, threat detection, action execution, privacy controls, and each guardrail action are clearly labeled."
  },
  {
    "id": "GUARD-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Guardrails → Violations",
    "steps": "Switch to Violations and inspect empty/list state without opening sensitive values.",
    "expected": "Violation list, filters/details, and empty state render without displaying secret values unnecessarily."
  },
  {
    "id": "GUARD-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Guardrails → action selectors",
    "steps": "With approval, change a disposable/non-production guardrail action, reload, then restore.",
    "expected": "Saved action persists and applies only to intended scope; cleanup restores original policy."
  },
  {
    "id": "GUARD-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Guardrails → inputs/selectors",
    "steps": "Test search/filter/action controls with no-match, Unicode, long, HTML-like, and injection-like text.",
    "expected": "Filtering and labels are literal and safe; unsafe text remains inert."
  },
  {
    "id": "GUARD-REG03",
    "type": "Regression",
    "pri": "P0",
    "reach": "Guardrails → Violations",
    "steps": "Inspect violation detail UI, DOM, console, requests, transcripts, and exported/log surfaces using safe disposable markers.",
    "expected": "Sensitive content, credentials, secrets, and internal tokens are masked or absent from all user-visible/diagnostic surfaces."
  },
  {
    "id": "GUARD-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Guardrails",
    "steps": "Trigger or simulate warn/block/terminate outcomes in a disposable session.",
    "expected": "User-facing outcome matches configured action; violation record contains enough metadata without sensitive payload leakage."
  },
  {
    "id": "GUARD-REG05",
    "type": "Regression",
    "pri": "P0",
    "reach": "Guardrails",
    "steps": "As non-admin or with tampered enterprise/violation IDs, attempt to read violations or update policy.",
    "expected": "Authorization prevents cross-enterprise violation access and unauthorized policy changes."
  },
  {
    "id": "GUARD-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Guardrails → session",
    "steps": "With approval, set a disposable guardrail to warn/block, trigger it in a controlled session, verify violation, then restore.",
    "expected": "Enforcement, logging, and cleanup work end to end without leaking sensitive content."
  },
  {
    "id": "SECM-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "`/settings/secure-mode-profiles`",
    "steps": "Load",
    "expected": "**Access-gated** — correctly shows \"Access denied\" for non-authorized (AUTO-057). With permission: profile list renders."
  },
  {
    "id": "SECM-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Secure mode (authorized)",
    "steps": "Create profile with network allowlist; assign to org/user",
    "expected": "Profile persists; in-session `get_network_allowlist` reflects it; request-access flow works. **N/E**."
  },
  {
    "id": "SCAN-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "Org sidebar → Security, or `/org/<org>/code-scan`",
    "steps": "Load",
    "expected": "Scans / Profiles tabs render; \"Start Scan\" button. Bare `/code-scan` (no org) → 404 (expected)."
  },
  {
    "id": "SCAN-SAN01",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Code-scan",
    "steps": "Open **Start Scan** dialog",
    "expected": "Repo / profile / auto-scan / interactive-mode options render; Start gated without a repo."
  },
  {
    "id": "SCAN-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Code-scan",
    "steps": "Configure Auto-Scan schedule; Profiles CRUD",
    "expected": "Schedule + profile persist."
  },
  {
    "id": "SCAN-E2E01",
    "type": "E2E",
    "pri": "P2",
    "reach": "Code-scan → PR",
    "steps": "Start scan on a repo → review findings → open fix PR",
    "expected": "Threat-model-based findings; fix PR opened; results also via `/v3/code-scans`."
  },
  {
    "id": "API-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Devin API",
    "steps": "Load Service users cold.",
    "expected": "Service users and Legacy API tabs, counts, search, organization/role filters, Provision, table columns, Copy role ID, and Delete actions render without page errors."
  },
  {
    "id": "API-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Devin API → Service users",
    "steps": "Inspect table rows.",
    "expected": "Name, scope, organization, role, created/expires timestamps, and actions are readable without displaying API token values."
  },
  {
    "id": "API-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Devin API → Legacy API",
    "steps": "Switch to Legacy API tab.",
    "expected": "Legacy token list/state renders; token values are masked or only shown according to documented one-time behavior."
  },
  {
    "id": "API-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Devin API → Provision",
    "steps": "Open Provision without submitting.",
    "expected": "Name, scope, organization, role, expiration, create/cancel controls, and gated submission are visible."
  },
  {
    "id": "API-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin API → Search/filter",
    "steps": "Search and filter by organization/role with no-match, whitespace, Unicode, long, duplicate-name, and HTML-like text.",
    "expected": "Filtering is literal and safe; duplicate display names remain distinguishable by metadata."
  },
  {
    "id": "API-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin API → Provision",
    "steps": "With approval, test blank, duplicate, long, Unicode, HTML-like names; invalid scope/role/expiration; then cancel or delete disposable user.",
    "expected": "Validation is clear; unsafe text is inert; invalid service users are not created."
  },
  {
    "id": "API-REG03",
    "type": "Regression",
    "pri": "P0",
    "reach": "Devin API",
    "steps": "With approval, create a disposable service user and inspect UI, DOM, console, network, transcript, and logs.",
    "expected": "Token is shown only once where intended, then masked; no full token is stored or exposed diagnostically."
  },
  {
    "id": "API-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Devin API → Delete",
    "steps": "With approval, delete a disposable service user: cancel once, then confirm.",
    "expected": "Confirmation identifies exact user/scope; cancel changes nothing; confirm revokes only selected credentials."
  },
  {
    "id": "API-REG05",
    "type": "Regression",
    "pri": "P0",
    "reach": "Devin API",
    "steps": "As non-admin or with tampered service-user/enterprise IDs, attempt list/create/delete/legacy-token operations.",
    "expected": "Server-side authorization prevents unauthorized key access, IDOR, and privilege escalation."
  },
  {
    "id": "INFRA-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Infrastructure",
    "steps": "Load cold.",
    "expected": "Infrastructure heading, hypervisor/capacity health copy, Refresh action, and empty/list state render without page errors."
  },
  {
    "id": "INFRA-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Infrastructure",
    "steps": "Inspect current VPC/tenant/hypervisor state.",
    "expected": "Empty state such as “No VPC data available” is clear, or populated rows show tenant/hypervisor/capacity status accurately."
  },
  {
    "id": "INFRA-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Infrastructure → Refresh",
    "steps": "Click Refresh repeatedly and during slow/error network conditions.",
    "expected": "Refresh is idempotent; loading/error state is clear; stale health data is not shown as current after failure."
  },
  {
    "id": "INFRA-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Infrastructure",
    "steps": "If list/search/filter controls are present, test no-match, Unicode, long, HTML-like, and injection-like values.",
    "expected": "Filters are literal and safe; no cross-tenant infrastructure identifiers appear."
  },
  {
    "id": "INFRA-REG03",
    "type": "Regression",
    "pri": "P0",
    "reach": "Infrastructure",
    "steps": "As restricted user or with tampered tenant/hypervisor IDs, request infrastructure health data.",
    "expected": "Server denies unauthorized/cross-tenant infra visibility and does not expose internal host details unnecessarily."
  },
  {
    "id": "SKILL-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Skills & Rules",
    "steps": "Load cold.",
    "expected": "Skills analytics, runtime filter, date filter, usage over time, most invoked skills, task types, search, and table render without page errors."
  },
  {
    "id": "SKILL-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Skills & Rules",
    "steps": "Inspect analytics cards and table rows.",
    "expected": "Invocation/session/user/last-used metrics are readable; repository/source names are associated with the correct skill."
  },
  {
    "id": "SKILL-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Skills & Rules",
    "steps": "Open runtime and date-range filters.",
    "expected": "Current selections and available ranges are clear; closing filters without selection leaves data unchanged."
  },
  {
    "id": "SKILL-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Skills & Rules → Search",
    "steps": "Search skills/sources with match/no-match, whitespace, Unicode, long, HTML-like, and injection-like text.",
    "expected": "Filtering is literal and safe; no-match state is clear; clearing restores all rows."
  },
  {
    "id": "SKILL-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Skills & Rules",
    "steps": "Switch Cloud/local runtime and date ranges.",
    "expected": "Charts/table refetch consistently; stale data is not shown as current; empty ranges render cleanly."
  },
  {
    "id": "SKILL-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Skills & Rules",
    "steps": "Click View sessions or skill detail for a row, then return.",
    "expected": "Navigation opens the correct filtered sessions/details view and Back restores filters/search."
  },
  {
    "id": "SKILL-REG04",
    "type": "Regression",
    "pri": "P0",
    "reach": "Skills & Rules",
    "steps": "As restricted user or with tampered skill/source/session IDs, request analytics/details.",
    "expected": "Server denies unauthorized data access and does not expose private session prompts or repository metadata."
  },
  {
    "id": "SUB-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Sub-org home",
    "steps": "Open the Landing Repo Page after selecting `jeet-test-org`.",
    "expected": "Top-left header shows the Devin logo, selected organization name `jeet-test-org`, and organization-menu control."
  },
  {
    "id": "SUB-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Sub-org home",
    "steps": "Inspect the **Recent** section.",
    "expected": "Recent heading, search control, and overflow menu are visible and properly aligned."
  },
  {
    "id": "SUB-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Sub-org home",
    "steps": "Inspect the left sidebar navigation.",
    "expected": "**New session**, **Automations**, **Security**, **Review**, and **Wiki** options are visible with the correct icons and readable labels."
  },
  {
    "id": "SUB-AU-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Sidebar → Automations",
    "steps": "Load",
    "expected": "Automations list + Create render."
  },
  {
    "id": "SUB-AU-SAN01",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Automations → Create",
    "steps": "Submit with empty name",
    "expected": "\"Name is required\"; creation blocked."
  },
  {
    "id": "SUB-AU-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Create → Advanced",
    "steps": "Expand Advanced (agent mode, child sessions, run-as-creator, network policy, metadata, ACU/rate limits)",
    "expected": "All controls render."
  },
  {
    "id": "SUB-AU-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create → Advanced → Network policy",
    "steps": "Add domain `javascript:alert(1)`, `<script>`, `http://`, whitespace",
    "expected": "**BUG-006**: accepted unvalidated. Expected: reject malformed/non-allowlisted."
  },
  {
    "id": "SUB-AU-REG03",
    "type": "Regression",
    "pri": "P2",
    "reach": "Create",
    "steps": "Webhook trigger",
    "expected": "Inline URL + `X-Webhook-Secret` notice present."
  },
  {
    "id": "SUB-AU-E2E01",
    "type": "E2E",
    "pri": "P2",
    "reach": "Automations",
    "steps": "Create schedule/webhook automation → trigger → session spawns",
    "expected": "Event spawns a session; delivery target (Slack) receives result. **N/E** unless approved."
  },
  {
    "id": "SUB-RV-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "Sidebar → Review",
    "steps": "Load",
    "expected": "Review renders; PR URL input (dismiss intro modal — BL-043)."
  },
  {
    "id": "SUB-RV-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Review",
    "steps": "Paste valid PR URL → click \"Go to pull request\"",
    "expected": "**BUG-017**: button never enables; Enter submits (then works incl. graceful \"PR Not Found\")."
  },
  {
    "id": "SUB-WK-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "Sidebar → Wiki",
    "steps": "Load",
    "expected": "Wiki renders; search present."
  },
  {
    "id": "SUB-WK-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Wiki",
    "steps": "Search XSS/emoji; open repo wiki",
    "expected": "XSS-safe; repo wiki TOC renders."
  },
  {
    "id": "SUB-IM-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Open the organization dropdown.",
    "expected": "Enterprise name/member count, **Enterprise settings**, **Invite members**, organization list, **Switch account**, and **Log out** are visible and readable."
  },
  {
    "id": "SUB-IM-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Inspect the organization list and current selection.",
    "expected": "**All organizations** is clearly selected with a checkmark; organization names and add/search controls are visible without overlap or truncation."
  },
  {
    "id": "SUB-IM-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Select another organization from the list.",
    "expected": "The selected organization opens and its name/context replaces the previous organization throughout the page."
  },
  {
    "id": "SUB-IM-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Click the `+` control beside **Organizations**.",
    "expected": "User is navigated to the **Create organization** page."
  },
  {
    "id": "SUB-IM-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Click **Enterprise settings** and **Invite members**.",
    "expected": "Each action opens the correct enterprise page or dialog without losing the current organization context."
  },
  {
    "id": "SUB-IM-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Click **Switch account**.",
    "expected": "Account-selection flow opens safely and protected organization data is not exposed."
  },
  {
    "id": "SUB-IM-REG06",
    "type": "Regression",
    "pri": "P0",
    "reach": "Top-left organization menu",
    "steps": "Click **Log out**, then use browser Back.",
    "expected": "The user is signed out and protected organization content cannot be reopened from browser history."
  },
  {
    "id": "SUB-IM-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Top-left organization menu",
    "steps": "Open and close the dropdown using its trigger, outside click, and Escape.",
    "expected": "The menu opens/closes reliably, remains inside the viewport, and restores focus to its trigger."
  },
  {
    "id": "SUB-IM-REG08",
    "type": "Regression",
    "pri": "P0",
    "reach": "Top-left organization menu",
    "steps": "Inspect the dropdown UI, URL, and console while switching organizations/accounts.",
    "expected": "No credentials, tokens, private organization data, or internal errors are exposed."
  },
  {
    "id": "SUB-OS-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Settings → Organizations → `jeet-test-org`",
    "steps": "Open Sub-orgs and Settings root cold.",
    "expected": "Sub-org heading, preferences/settings copy, Products, Resources, Administration sections, and child links render without page errors."
  },
  {
    "id": "SUB-OS-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Sub-orgs and Settings",
    "steps": "Inspect visible child links.",
    "expected": "General, Connections, Devin, Knowledge, Environment, Playbooks, Skills & Rules, Secrets, Repositories, Membership, Devin API, and Analytics are grouped under correct headings."
  },
  {
    "id": "SUB-OS-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sub-orgs and Settings",
    "steps": "Click each visible child link and Back to the root without saving.",
    "expected": "Each route opens the correct sub-org settings page and Back/return restores the root."
  },
  {
    "id": "SUB-OS-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sub-orgs and Settings",
    "steps": "Deep-link, refresh, and browser Back/Forward on the root and child routes.",
    "expected": "The selected sub-org remains `jeet-test-org`; navigation does not jump to enterprise-level pages unexpectedly."
  },
  {
    "id": "SUB-OS-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Sub-orgs and Settings",
    "steps": "Use global settings search with child-page labels, no-match, Unicode, long, HTML-like, and injection-like text.",
    "expected": "Matching settings are found literally; unsafe text is inert; no unrelated tenant routes appear."
  },
  {
    "id": "SUB-OS-REG04",
    "type": "Regression",
    "pri": "P0",
    "reach": "Sub-orgs and Settings",
    "steps": "As a user without access or with tampered org slug, request the root and child settings pages.",
    "expected": "Server denies unauthorized/cross-org access and does not expose settings metadata from another sub-org."
  },
  {
    "id": "SUB-OS-E2E01",
    "type": "E2E",
    "pri": "P1",
    "reach": "Enterprise Organizations → Sub-orgs and Settings",
    "steps": "Navigate from Organizations to `jeet-test-org`, open several child settings pages, then return to Organizations.",
    "expected": "Cross-level navigation preserves enterprise/sub-org context and does not lose the selected organization."
  },
  {
    "id": "AUTO-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "Left nav → Automations",
    "steps": "Load",
    "expected": "Automations list + Create button render."
  },
  {
    "id": "AUTO-SAN01",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Automations → Create",
    "steps": "Empty name → submit",
    "expected": "\"Name is required\"; blocked."
  },
  {
    "id": "AUTO-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Create",
    "steps": "Select each trigger: Slack, GitHub webhook, Linear/Jira, Schedule, Custom webhook",
    "expected": "Each trigger reveals its config; webhook shows `X-Webhook-Secret`."
  },
  {
    "id": "AUTO-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Create → Advanced → Network policy",
    "steps": "Add domain `javascript:alert(1)`, `<script>`, `http://`, whitespace, valid domain",
    "expected": "**BUG-006**: malformed accepted unvalidated. Expected: only valid domains."
  },
  {
    "id": "AUTO-REG03",
    "type": "Regression",
    "pri": "P2",
    "reach": "Create → Advanced",
    "steps": "Agent mode, child sessions, run-as-creator, metadata, ACU/rate limits",
    "expected": "All render; numeric limits validate (-5/0/decimal)."
  },
  {
    "id": "AUTO-REG04",
    "type": "Regression",
    "pri": "P2",
    "reach": "Create",
    "steps": "Prompt/playbook + repo/environment selection",
    "expected": "Selectable; playbook invokable."
  },
  {
    "id": "AUTO-REG05",
    "type": "Regression",
    "pri": "P2",
    "reach": "Automations",
    "steps": "Auto-triage type (Slack channel monitor)",
    "expected": "Config renders; channel selectable."
  },
  {
    "id": "AUTO-E2E01",
    "type": "E2E",
    "pri": "P2",
    "reach": "Automations",
    "steps": "Create webhook automation → POST to webhook with secret → session spawns",
    "expected": "Valid secret → session created; invalid/missing secret → rejected. **N/E** unless approved."
  },
  {
    "id": "SCHED-SMK01",
    "type": "Smoke",
    "pri": "P2",
    "reach": "Settings → Schedules",
    "steps": "Load",
    "expected": "Schedule list + Create render."
  },
  {
    "id": "SCHED-SAN01",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Schedules → Create",
    "steps": "Set cron/recurrence + prompt",
    "expected": "Valid cron accepted; invalid cron rejected."
  },
  {
    "id": "SCHED-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Schedules",
    "steps": "Create one-time + recurring; edit; delete",
    "expected": "CRUD persists; next-run time correct. **N/E** on live / delete after."
  },
  {
    "id": "SCHED-E2E01",
    "type": "E2E",
    "pri": "P2",
    "reach": "Schedules",
    "steps": "Create near-term schedule → wait for fire",
    "expected": "Session spawns at scheduled time; appears in Sessions list. **N/E** unless approved."
  },
  {
    "id": "LOGIN-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Open the tenant `/login` route",
    "steps": "Load the Login page",
    "expected": "The Devin logo, Welcome heading, tenant description, work email field, and Continue button are visible and readable."
  },
  {
    "id": "LOGIN-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Login page",
    "steps": "Inspect the available login methods",
    "expected": "The work email field and at least the GitHub and Google login buttons are visible with the correct icons and labels."
  },
  {
    "id": "LOGIN-SAN03",
    "type": "Sanity",
    "pri": "P2",
    "reach": "On the Login page",
    "steps": "Inspect the account registration prompt",
    "expected": "\"Don't have an account? Sign up\" is visible and readable."
  },
  {
    "id": "LOGIN-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Login page",
    "steps": "Click the Sign up link",
    "expected": "The URL contains `/signup/`, and \"Already have an account? Log in\" is visible and readable."
  },
  {
    "id": "LOGIN-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Login page",
    "steps": "Submit each invalid email value separately: `abc`, `a@`, and spaces only",
    "expected": "Each invalid email is rejected with clear validation, and the user remains on the Login page."
  },
  {
    "id": "LOGIN-REG03",
    "type": "Regression",
    "pri": "P0",
    "reach": "On the Login page",
    "steps": "Inspect the URL, visible UI, and browser console before and after submitting an invalid email",
    "expected": "No credentials, OTPs, sensitive tokens, or internal error details appear in the URL, UI, or browser console."
  },
  {
    "id": "SUP-SAN01",
    "type": "Sanity",
    "pri": "P2",
    "reach": "Left sidebar → bottom-right (?) help → Support",
    "steps": "1. From the Landing search page, open the left sidebar and click the (?) help control in the bottom-right corner. 2. Click Support to open /org/cog-enterprise-qa/settings/support. 3. Click the support-chat launcher on the Support page.",
    "expected": "Support chat widget opens and is ready to accept a message; no console errors."
  },
  {
    "id": "SUP-SAN02",
    "type": "Sanity",
    "pri": "P3",
    "reach": "Left sidebar → bottom-right (?) help → Support",
    "steps": "1. Open the Support page (left sidebar → bottom-right (?) help control → Support). 2. Locate the Documentation card/heading on the page.",
    "expected": "The \"Documentation\" card heading is rendered and visible on the Support page."
  },
  {
    "id": "SUP-SAN03",
    "type": "Sanity",
    "pri": "P3",
    "reach": "Left sidebar → bottom-right (?) help → Support",
    "steps": "1. Open the Support page (left sidebar → bottom-right (?) help control → Support). 2. Read the description text under the Documentation card.",
    "expected": "The text \"Find answers to common questions and comprehensive guides\" is visible under the Documentation card."
  },
  {
    "id": "SUP-REG01",
    "type": "Regression",
    "pri": "P2",
    "reach": "Left sidebar → bottom-right (?) help → Support",
    "steps": "1. Open the Support page (left sidebar → bottom-right (?) help control → Support). 2. Confirm the Documentation button is visible and enabled. 3. Click the Documentation button.",
    "expected": "The Documentation button is clickable and navigates to the Documentation page; the target route loads without error."
  },
  {
    "id": "SUP-SAN04",
    "type": "Sanity",
    "pri": "P3",
    "reach": "Left sidebar → bottom-right (?) help → Support",
    "steps": "1. Reload the Support page (left sidebar → bottom-right (?) help control → Support). 2. Locate the Documentation section title after the page loads.",
    "expected": "The \"Documentation\" title is present and visible on the Support page after load."
  },
  {
    "id": "SUP-SAN05",
    "type": "Sanity",
    "pri": "P3",
    "reach": "Left sidebar → bottom-right (?) help → Support",
    "steps": "1. Open the Support page (left sidebar → bottom-right (?) help control → Support). 2. Verify the Documentation description text is presented to the user.",
    "expected": "The user can see the text \"Find answers to common questions and comprehensive guides\" on the Support page."
  },
  {
    "id": "AUTH-SAN01",
    "type": "Sanity",
    "pri": "P0",
    "reach": "On the Login page",
    "steps": "Enter a valid work email and click Continue",
    "expected": "The OTP entry step is shown, stating a verification code was sent to the entered email."
  },
  {
    "id": "AUTH-SAN02",
    "type": "Sanity",
    "pri": "P0",
    "reach": "On the OTP step",
    "steps": "Enter the valid OTP code from the email and submit",
    "expected": "Login succeeds and the user lands on the Landing search page (\"Choose an organization to continue\")."
  },
  {
    "id": "AUTH-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "After a successful login",
    "steps": "Reload the browser tab",
    "expected": "The session persists: the Landing search page loads again without asking for email/OTP."
  },
  {
    "id": "AUTH-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the OTP step",
    "steps": "Inspect the resend option",
    "expected": "A \"resend code\" control is visible; clicking it confirms a new code was sent."
  },
  {
    "id": "AUTH-REG01",
    "type": "Regression",
    "pri": "P0",
    "reach": "On the OTP step",
    "steps": "Enter a wrong OTP code and submit",
    "expected": "The code is rejected with a clear error; the user stays on the OTP step and is NOT logged in."
  },
  {
    "id": "AUTH-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the OTP step",
    "steps": "Wait for the code to expire (or use an old code) and submit",
    "expected": "The expired code is rejected with a clear error; requesting a fresh code allows login."
  },
  {
    "id": "AUTH-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "While logged out",
    "steps": "Open a protected route directly (e.g. the org selector or a settings URL)",
    "expected": "The user is redirected to the Login page, not shown any protected content."
  },
  {
    "id": "AUTH-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "After a successful login",
    "steps": "Log out from the account menu",
    "expected": "The session ends and the user is returned to the Login page; going Back does not restore protected content."
  },
  {
    "id": "AUTH-REG05",
    "type": "Regression",
    "pri": "P0",
    "reach": "On the OTP step",
    "steps": "Inspect the URL, UI, and browser console during the whole email → OTP → success flow",
    "expected": "No OTP codes, tokens, or sensitive session data are exposed in the URL, page source, or console."
  },
  {
    "id": "ORGSEL-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "After successful login",
    "steps": "Open the organization selector page.",
    "expected": "Logo, heading, search field, and organization list are visible and readable."
  },
  {
    "id": "ORGSEL-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Inspect the left sidebar.",
    "expected": "All organizations, Organizations, Settings, and help icon are visible and aligned."
  },
  {
    "id": "ORGSEL-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Inspect organization rows.",
    "expected": "Each row shows the organization name, member count, and overflow menu without overlap."
  },
  {
    "id": "ORGSEL-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Open an organization row overflow menu.",
    "expected": "Menu is visible beside the selected row with **Pin organization** and **Manage settings** options."
  },
  {
    "id": "ORGSEL-SAN05",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Open the bottom help menu from the `?` icon.",
    "expected": "**Contact support**, **Documentation**, and **Contact sales** are visible and readable."
  },
  {
    "id": "ORGSEL-SAN06",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Hover the sidebar collapse control.",
    "expected": "Tooltip shows **Collapse sidebar** with the keyboard shortcut and does not overlap critical content."
  },
  {
    "id": "ORGSEL-SAN07",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Collapse the sidebar and hover the expand control.",
    "expected": "Compact sidebar is visible, and tooltip shows **Expand sidebar** with the keyboard shortcut."
  },
  {
    "id": "ORGSEL-SAN08",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Hover the search icon in the sidebar.",
    "expected": "Tooltip shows **Search** with the keyboard shortcut."
  },
  {
    "id": "ORGSEL-SAN09",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Open the global command/search palette.",
    "expected": "Search input, Actions, Navigation, and Settings sections are visible and readable."
  },
  {
    "id": "ORGSEL-SAN10",
    "type": "Sanity",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Open the **All organizations** dropdown.",
    "expected": "Enterprise card, Enterprise settings, Invite members, organization list, Switch account, and Log out are visible."
  },
  {
    "id": "ORGSEL-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Search for a valid organization.",
    "expected": "Matching organizations are filtered and remain clickable."
  },
  {
    "id": "ORGSEL-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Search with non-matching text.",
    "expected": "A clear empty state appears without stale results."
  },
  {
    "id": "ORGSEL-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Search using special, whitespace, emoji, and long inputs.",
    "expected": "Input is handled safely without script execution or page failure."
  },
  {
    "id": "ORGSEL-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click an organization row.",
    "expected": "User navigates to the selected organization successfully."
  },
  {
    "id": "ORGSEL-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click an organization overflow menu.",
    "expected": "The correct row's context menu opens without overlap."
  },
  {
    "id": "ORGSEL-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Refresh or use browser back/forward.",
    "expected": "The selector page reloads with its core UI intact."
  },
  {
    "id": "ORGSEL-REG07",
    "type": "Regression",
    "pri": "P0",
    "reach": "On the Landing Search page",
    "steps": "Inspect the URL, UI, and console while loading, searching, and selecting.",
    "expected": "No credentials, sensitive tokens, org secrets, or internal errors are exposed."
  },
  {
    "id": "ORGSEL-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click **Pin organization** from a row overflow menu.",
    "expected": "Selected organization is pinned or shows pinned state without navigating away unexpectedly."
  },
  {
    "id": "ORGSEL-REG09",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click **Manage settings** from a row overflow menu.",
    "expected": "User navigates to settings for the selected organization or sees a safe permission-aware block."
  },
  {
    "id": "ORGSEL-REG10",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click each help menu item.",
    "expected": "Contact support opens support flow; Documentation and Contact sales open the correct destinations safely."
  },
  {
    "id": "ORGSEL-REG11",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Toggle sidebar collapse and expand using the button and shortcut.",
    "expected": "Sidebar state changes correctly and main content remains usable without clipping."
  },
  {
    "id": "ORGSEL-REG12",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Use the command palette to search for navigation items.",
    "expected": "Matching commands filter correctly and can be selected without stale or broken results."
  },
  {
    "id": "ORGSEL-REG13",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Select **Switch organization** from the command palette.",
    "expected": "Organization switch flow opens and the user remains on a valid page state."
  },
  {
    "id": "ORGSEL-REG14",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Use the **All organizations** dropdown search/list controls.",
    "expected": "Organizations filter/select correctly, and the current organization remains clearly indicated."
  },
  {
    "id": "ORGSEL-REG15",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click **Enterprise settings** and **Invite members** in the dropdown.",
    "expected": "Each button navigates to the expected page or shows a permission-safe message."
  },
  {
    "id": "ORGSEL-REG16",
    "type": "Regression",
    "pri": "P1",
    "reach": "On the Landing Search page",
    "steps": "Click **Switch account** and **Log out** in the dropdown.",
    "expected": "Switch account opens account selection; Log out signs out and prevents protected content from remaining accessible."
  },
  {
    "id": "ORGSEL-REG17",
    "type": "Regression",
    "pri": "P0",
    "reach": "On the Landing Search page",
    "steps": "Inspect URL, UI, and console while opening menus, command palette, and org dropdown.",
    "expected": "No credentials, tokens, org secrets, or internal errors are exposed."
  },
  {
    "id": "ENTSET-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Top Left Menu → Enterprise settings",
    "steps": "Open Enterprise Settings.",
    "expected": "**Settings › Enterprise** breadcrumb, **Enterprise Settings** heading, and description are visible and readable."
  },
  {
    "id": "ENTSET-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Inspect the left sidebar.",
    "expected": "Back to app, settings search, Personal links, enterprise name, enterprise navigation, organization list, and help control are visible without overlap."
  },
  {
    "id": "ENTSET-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Inspect **Enterprise preferences and settings**.",
    "expected": "**General**, **Connections**, and **Sessions** cards are visible with icons and navigation arrows."
  },
  {
    "id": "ENTSET-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Inspect **Products**.",
    "expected": "**Devin** and **Review** cards are visible and readable."
  },
  {
    "id": "ENTSET-SAN05",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Inspect **Resources**.",
    "expected": "**Knowledge**, **Environment**, **Playbooks**, and **Skills & Rules** cards are visible and readable."
  },
  {
    "id": "ENTSET-SAN06",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Scroll to **Administration**.",
    "expected": "**Repositories**, **Membership**, **Organizations**, **Devin API**, **Guardrails** with Beta badge, **Infrastructure**, and **Analytics** are visible."
  },
  {
    "id": "ENTSET-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Open each card from the main panel, then return.",
    "expected": "Every card opens its matching enterprise settings page and retains the `Cog Enterprise QA` context."
  },
  {
    "id": "ENTSET-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Search settings using matching, non-matching, special-character, and long text.",
    "expected": "Matching settings filter correctly; no-match state is clear; input remains inert and the page stays usable."
  },
  {
    "id": "ENTSET-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Click **Back to app**, then return with browser Back.",
    "expected": "User returns to the app safely; browser Back restores Enterprise Settings without a blank or broken state."
  },
  {
    "id": "ENTSET-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Select another organization from the sidebar organization list.",
    "expected": "The selected organization's settings open and the enterprise context does not leak into the organization page."
  },
  {
    "id": "ENTSET-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Scroll the sidebar organization list and click **Load more** when available.",
    "expected": "More organizations load without duplicates, layout shifts, or losing the current settings page."
  },
  {
    "id": "ENTSET-REG06",
    "type": "Regression",
    "pri": "P0",
    "reach": "Enterprise Settings",
    "steps": "Open Enterprise Settings as a user without enterprise-admin access.",
    "expected": "Restricted settings are hidden or access-denied; no unauthorized enterprise data or actions are exposed."
  },
  {
    "id": "ENTSET-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Enterprise Settings",
    "steps": "Refresh and use browser Back/Forward on the root page.",
    "expected": "The same enterprise context and usable layout are restored without navigation loops."
  },
  {
    "id": "ENTSET-REG08",
    "type": "Regression",
    "pri": "P0",
    "reach": "Enterprise Settings",
    "steps": "Inspect the URL, UI, network responses, and console while using the page.",
    "expected": "No credentials, tokens, private configuration values, or internal errors are exposed."
  },
  {
    "id": "SECRET-SMK01",
    "type": "Smoke",
    "pri": "P1",
    "reach": "jeet-test-org → Settings → Secrets",
    "steps": "Load the page cold.",
    "expected": "Breadcrumb and back navigation, help text, Organization and Personal counts, search, Bulk add secrets, Add secret, table, and empty or list state render without page or console errors."
  },
  {
    "id": "SECRET-SAN01",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Secrets",
    "steps": "Inspect both scopes.",
    "expected": "Organization and Personal tabs show independent counts; Name, Type, Note, Updated by, and Updated at columns are readable without displaying secret values."
  },
  {
    "id": "SECRET-SAN02",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Secrets → empty scope",
    "steps": "Inspect the empty state.",
    "expected": "No secrets found and Add your first secret appear; controls remain usable and no row from the other scope leaks into the view."
  },
  {
    "id": "SECRET-SAN03",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Secrets → Add secret",
    "steps": "Open the dialog without submitting.",
    "expected": "Scope, type, name, value, note, Redact value, close, and Store secret controls appear; the title reflects the selected scope."
  },
  {
    "id": "SECRET-SAN04",
    "type": "Sanity",
    "pri": "P1",
    "reach": "Secrets → Add secret / Bulk add secrets",
    "steps": "Inspect Raw secret, Cookie, TOTP, and bulk-import forms.",
    "expected": "Raw, Cookie JSON or base64, TOTP and QR, upload-file, pasted `.env`, scope, and gated Store controls match the selected workflow."
  },
  {
    "id": "SECRET-REG01",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets",
    "steps": "Search each scope using full or partial name, no-match, whitespace, case variants, Unicode, long, HTML-like, and injection-like input; clear it.",
    "expected": "Filtering is literal and safe; no-match is clear; clearing restores only the active scope's rows."
  },
  {
    "id": "SECRET-REG02",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → Add secret",
    "steps": "Test blank, whitespace, punctuation, leading-digit, very long, Unicode, HTML-like, and duplicate names.",
    "expected": "Required validation is clear; unsafe text remains inert; documented environment-variable normalization and duplicate suffixing are deterministic and collision-safe."
  },
  {
    "id": "SECRET-REG03",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → Add secret → Raw secret",
    "steps": "With approval, create disposable Raw secrets with blank, whitespace, multiline, Unicode, very long, and special-character values plus long or HTML-like notes.",
    "expected": "Required value validation is actionable; supported values persist exactly; notes render inertly; plaintext is never exposed after saving."
  },
  {
    "id": "SECRET-REG04",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → Add secret → Cookie",
    "steps": "Test valid JSON or base64 and malformed JSON, invalid base64, missing fields, unsupported domains or paths, duplicates, and oversized payloads.",
    "expected": "Only valid Chromium-format cookies are accepted; errors identify the problem without logging cookie contents."
  },
  {
    "id": "SECRET-REG05",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → Add secret → One-Time Password (TOTP)",
    "steps": "Test valid disposable `otpauth://` data, malformed URI or base32, missing issuer, account, or secret, oversized input, and denied QR-camera access.",
    "expected": "Valid dedicated-account TOTP data is accepted; invalid data and scanner failures are handled safely without exposing the seed."
  },
  {
    "id": "SECRET-REG06",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → Bulk add secrets",
    "steps": "Paste or upload `.env` data containing comments, blank lines, quoted or multiline values, `=` inside values, duplicate keys, invalid lines, Unicode, and mixed-validity rows.",
    "expected": "Parsing is consistent between paste and file upload; preview or errors identify affected keys without exposing values; no partial import occurs unless explicitly confirmed."
  },
  {
    "id": "SECRET-REG07",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → Add or Bulk add",
    "steps": "Switch Organization and Personal scopes and secret types after entering unsaved data; close, press Escape, go Back, refresh, and revisit.",
    "expected": "Scope, title, and fields remain consistent; warning or documented discard behavior occurs; no secret is silently stored or moved between scopes."
  },
  {
    "id": "SECRET-REG08",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → disposable secret",
    "steps": "With approval, create a disposable secret → verify metadata → edit name, value, note, and redaction → reload → delete it.",
    "expected": "CRUD persists correctly; editing never reveals the previous value unnecessarily; only the selected secret changes; cleanup removes it."
  },
  {
    "id": "SECRET-REG09",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets → disposable secret → Actions → Delete",
    "steps": "With approval, cancel once, then confirm; repeat with similarly named rows.",
    "expected": "Confirmation identifies the exact secret and scope; cancel changes nothing; confirm removes only the selected secret and leaves no usable residual value."
  },
  {
    "id": "SECRET-REG10",
    "type": "Regression",
    "pri": "P0",
    "reach": "Secrets",
    "steps": "With approval, create disposable Personal and Organization secrets, then inspect as creator, another member, admin, and non-member.",
    "expected": "Personal secrets are visible and usable only in the creator's sessions; Organization secrets are usable by organization members, while view and edit privileges follow documented admin rules."
  },
  {
    "id": "SECRET-REG11",
    "type": "Regression",
    "pri": "P1",
    "reach": "Secrets and existing sessions",
    "steps": "With approval, add, update, and delete a disposable secret while old and new sessions exist.",
    "expected": "Changes follow documented session timing: new secrets become available to newly created sessions, and stale sessions do not gain unexpected access."
  },
  {
    "id": "SECRET-REG12",
    "type": "Regression",
    "pri": "P0",
    "reach": "Secrets → Add secret → Redact value",
    "steps": "With approval, enable redaction, use a disposable marker in a new session, and inspect the UI, DOM, console, requests, transcript, logs, and errors.",
    "expected": "The value remains usable where intended but is masked from user-visible and diagnostic surfaces; copying, editing, and failures do not reveal it."
  },
  {
    "id": "SECRET-REG13",
    "type": "Regression",
    "pri": "P0",
    "reach": "Secrets",
    "steps": "As a non-admin or with tampered organization or secret IDs, attempt list, create, view, edit, delete, bulk import, and scope-changing requests.",
    "expected": "Server-side authorization prevents IDOR, privilege escalation, cross-organization access, and access to another user's Personal secrets."
  },
  {
    "id": "SECRET-E2E01",
    "type": "E2E",
    "pri": "P0",
    "reach": "Secrets and new sessions",
    "steps": "With approval, create unique disposable Personal and Organization Raw secrets → start new creator and member sessions that reference `$SECRET_NAME` → verify scope and value use without printing sensitive data → edit and retest in new sessions → delete both.",
    "expected": "Correct secrets are injected only into allowed new sessions; Personal and Organization isolation and updates work; cleanup confirms later sessions cannot access either disposable secret."
  }
];
