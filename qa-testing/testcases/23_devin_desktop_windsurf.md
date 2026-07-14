# 23 — Devin Desktop (Windsurf)

Imported from Notion: Devin Enterprise — QA Test Cases (sub-page 23).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| DSK-SMK01 | Smoke | P0 | Installer | Install + launch Devin Desktop; sign in | App opens; auth succeeds; correct plan (Free/Pro/Teams/Enterprise) shown. |
| DSK-SAN01 | Sanity | P1 | Accounts | Verify plan/usage page; quota (daily/weekly allowance, extra usage) reflects consumption | Usage tracked per Quota doc; upgrade path visible. |
| DSK-REG01 | Regression | P1 | Enterprise admin | Configure SSO/SCIM (Okta/Entra/Google/SAML) + domain verification (DNS TXT) | SSO login works; SCIM provisions/deprovisions; verified domain auto-invites team. **N/E on live IdP.** |
| DSK-REG02 | Regression | P1 | Enterprise admin | RBAC: create custom role, assign, verify restricted user | Permissions enforced per rbac-role-management doc. |
| DSK-SMK02 | Smoke | P0 | Cascade panel | Open Cascade; send a code task in Code mode | Agent edits files with diffs, tool-calls visible; Chat mode answers without edits. |
| DSK-SAN02 | Sanity | P1 | Cascade | Exercise modes, checkpoints (revert), voice input, linter integration | Each behaves per Cascade Overview/Modes docs. |
| DSK-REG03 | Regression | P2 | Memories & Rules | Add global/workspace rules + auto-memories; new conversation | Rules applied; memories persist across conversations. |
| DSK-REG04 | Regression | P2 | AGENTS.md | Place AGENTS.md in a subdir | Instructions apply only to files under that dir. |
| DSK-REG05 | Regression | P2 | MCP | Add stdio/HTTP/SSE MCP server; Teams admin allow/deny | Tools usable; admin controls enforced. |
| DSK-REG06 | Regression | P2 | Hooks | Configure pre/post Cascade hooks (e.g. block a command) | Hook executes at documented points; can block/log actions. |
| DSK-REG07 | Regression | P2 | Workflows & Skills | Create a markdown workflow + a skill; invoke | Run as documented (note: not available to Devin Local agent). |
| DSK-REG08 | Regression | P2 | Worktrees / Arena | Start parallel Cascade tasks (worktrees); Arena mode side-by-side | Isolated worktrees auto-created; arena compares instances. |
| DSK-REG09 | Regression | P2 | App Deploys | Deploy a sample React/Next app to Netlify from Cascade | Public URL produced; claiming works. **N/E (public deploy) — secure-mode restricted.** |
| DSK-SMK03 | Smoke | P1 | Editor | Type code; accept single-line + multi-line autocomplete via documented shortcuts | Suggestions appear; accept/partial-accept/snooze work. |
| DSK-SAN03 | Sanity | P1 | Editor | Cmd/Ctrl+I Command: generate + edit code inline with NL prompt | Inline diff applied on accept; works in VS Code + JetBrains. |
| DSK-REG10 | Regression | P2 | Code lenses | Explain/Refactor/Docstring lenses on a function | Each lens produces expected action (legacy Cascade only per Controls doc). |
| DSK-REG11 | Regression | P2 | Chat | @-mentions, pinned files, inline citations, model switcher | Context honored; citations link to code; models per plan tier. |
| DSK-REG12 | Regression | P2 | Indexing | Open large repo; verify local index builds; `.codeiumignore` respected | Ignored paths excluded from suggestions/search. |
| DSK-REG13 | Regression | P2 | Remote indexing (ent) | Index a remote GitHub/GitLab repo | Retrieval works without local clone; access-controlled. |
| DSK-REG14 | Regression | P3 | Fast Context | Trigger fast retrieval subagent | Noticeably faster retrieval; correct snippets. |
| DSK-SAN04 | Sanity | P2 | ACC | Open Agent Command Center; view local + cloud agents in Kanban view | All agents listed with status; can open/manage each. |
| DSK-REG15 | Regression | P3 | ACP | Register a third-party/custom ACP agent | Runs inside ACC per acp/acp-custom docs. |
| DSK-REG16 | Regression | P2 | Admin analytics | View user/team analytics (completion stats, % AI-written code) | Dashboards populate; match actual usage window. |
| DSK-REG17 | Regression | P1 | Analytics API | Query v1 (service key) + v2 (Bearer, cursor pagination) endpoints: cascade_runs, cascade_lines, cascade_tool_usage, custom queries | Auth enforced (401/403 on bad key); pagination stable; Devin Local gaps match Controls doc (no tool_usage/lines/mode for Devin Local). |
| DSK-E2E01 | E2E | P1 | Full dev loop | Install → sign in → open repo → autocomplete + Command edits → Cascade implements feature w/ checkpoint revert → AI commit message → push | Entire documented loop works; analytics reflect the activity afterward. |
| DSK-E2E02 | E2E | P2 | Desktop ↔ CLI | Enable "Install Devin CLI" in team settings → install CLI from Desktop Command Palette → `devin` in terminal | Bundled install path works end-to-end (links suite 22 CLI-SMK01). |
