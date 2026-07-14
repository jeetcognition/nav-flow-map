# 22 — Devin CLI

Imported from Notion: Devin Enterprise — QA Test Cases (sub-page 22).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| CLI-SMK01 | Smoke | P0 | Terminal | Install via \`curl -fsSL https://cli.devin.ai/install.sh \\ | bash` (also test `brew install --cask devin-cli`; Windows `irm …/setup.ps1 \\ |
| CLI-SMK02 | Smoke | P1 | Project dir | Run `devin` | Interactive TUI launches; shows prompt input; no crash on supported terminals. |
| CLI-SMK03 | Smoke | P2 | Terminal | `devin -- "explain this repo"` (preloaded prompt / automation mode) | Runs non-interactively against the preloaded prompt. |
| CLI-REG01 | Regression | P2 | Terminal | Install on each supported OS + an unsupported/old terminal | Works on supported (per Terminal Compatibility); graceful message otherwise. |
| CLI-REG02 | Regression | P2 | Terminal | `brew upgrade --cask devin-cli` / installer re-run | Upgrades in place; config preserved. |
| CLI-SMK04 | Smoke | P0 | First run | Authenticate using existing Devin account (device/browser flow) | Login succeeds; token stored securely (not world-readable plaintext); session tied to correct org. |
| CLI-REG03 | Regression | P1 | Auth | Sign out / expired token / revoked service key | Re-auth prompted; no silent use of stale token; clear error. |
| CLI-REG04 | Regression | P2 | Legacy Windsurf auth | Auth via legacy Windsurf enterprise account path | Works per doc; correct enterprise mapping. |
| CLI-SMK05 | Smoke | P1 | In `devin` | Run core slash commands + flags from Commands reference (e.g. `/help`, `/handoff`, model select) | Each documented command exists and behaves as described. |
| CLI-REG05 | Regression | P0 | Permissions | Configure a permission policy (allow/deny terminal cmds, file scope); attempt a denied action | Denied action blocked per policy; allowed proceeds; default = read/edit only within workspace. |
| CLI-REG06 | Regression | P0 | Sandbox | Enable sandbox mode; run a task that touches network/files outside allowlist | OS-level isolation enforced; denied domains blocked; enterprise "Sandbox enforcement" forces it on. |
| CLI-REG07 | Regression | P1 | Network enforcement | Set allowed/denied domains (team settings) | Agent honors allow/deny lists; blocked fetches fail cleanly. |
| CLI-REG08 | Regression | P2 | Hooks | Add pre/post lifecycle hook (e.g. logging/validation) | Hook fires at documented event with documented payload; non-zero hook can gate the action. |
| CLI-REG09 | Regression | P2 | Rules/AGENTS.md | Add `AGENTS.md`/rules; verify precedence (global vs project vs local) | Rules always applied; precedence matches Configuration Precedence doc. |
| CLI-REG10 | Regression | P2 | Skills/Plugins | Create a SKILL.md; install a plugin from repo/git/local | Skill invocable; plugin bundle loads; malformed frontmatter rejected. |
| CLI-REG11 | Regression | P2 | MCP | Add stdio/SSE/HTTP MCP server; use its tools | Tools available; admin allow/deny respected; bad config errors clearly. |
| CLI-REG12 | Regression | P2 | Subagents | Delegate a task to a foreground + background subagent | Subagent runs independently; results merge back. |
| CLI-REG13 | Regression | P3 | Config import | Import settings from Cursor/VS Code/Zed/Claude Code | Imported per read-config-from doc without corrupting native config. |
| CLI-REG14 | Regression | P1 | Team settings | Toggle CLI-specific controls (sandbox enforcement, granular permissions, network enforcement, disable legacy Cascade) | Settings propagate to users; fallback legacy controls (auto-run, terminal allow/deny) still enforced until CLI policy set. |
| CLI-REG15 | Regression | P3 | Limitations | Verify documented gaps hold (no Memories/Workflows/Codemaps/App Deploys/Browser previews/Conversation sharing in Devin Local) | Behavior matches doc; no false capability. |
| CLI-E2E01 | E2E | P1 | Local → cloud | In a repo: `devin` → implement a small fix → run tests → `/handoff` a longer task to cloud Devin | Local edits work; `/handoff` creates a cloud session carrying context; cloud session visible in app. |
| CLI-E2E02 | E2E | P2 | Full local task | Prompt CLI to add a feature + open a PR (with git configured) | Feature implemented locally; PR opened; permissions/sandbox respected throughout. |
