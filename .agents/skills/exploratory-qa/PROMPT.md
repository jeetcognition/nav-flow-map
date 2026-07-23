# Exploratory QA — run prompt

Run an exploratory black-box QA pass using the `exploratory-qa` skill.

Parameters:

- QA_BASE: https://cog-enterprise-qa.beta.devinenterprise.com (default beta; see qa-loop/scope.md)
- RUN_SCOPE: all (or `reported-bugs`, `changelog`, or a comma list of areas)
- CHANGELOG: (paste this week's changelog, or leave blank for a full sweep)

Before executing:

1. Read `qa-loop/README.md`, then the skill in full. Load `qa-loop/change-radar.md`,
   `qa-loop/heuristics/lenses.md`, `qa-loop/expectations/*`, and
   `qa-loop/memory/surface-map.md` so you know what changed, which lenses to use,
   what "correct" looks like, and which prior surfaces/bugs to re-verify. Check
   `app/src/data/fixtures/bugs.json` to continue BUG-NNN numbering.
2. LOGIN BOOTSTRAP (starts logged out every run): `python
.agents/skills/scripts/start_login.py` attaches to the running Chrome over CDP
   (auto-detect the port; do NOT launch a new browser), fills the admin email, and
   submits. Then message me (blocking, open the Browser tab) so I enter the OTP —
   do NOT fetch it from email. Verify the app loads before testing. CDP unreachable
   after a few tries → stop and report an environment failure.
3. Print the resolved CDP URL and the ordered list of areas + lenses you will run.

Execution rules (enforce strictly, from the skill):

- INTERACTIVE first: change → save → RELOAD → verify persisted + honored → REVERT.
- `page.on("dialog", lambda d: d.accept())` before any interaction; one area per
  script; wait after each navigation; filter cosmetic console noise so React #185 stands out.
- Standard edge cases on every input; watch the false-positive traps (scoped search box,
  flag-gated "not found" → backlog, cosmetic noise ≠ regression).

Record findings in the CANONICAL stores, not new markdown ledgers: bugs →
`bugs.json` (`Bug` shape, BUG-NNN); results → `runResults.json`/`runs.json`
(passed/failed/skipped, blocked/inconclusive in notes); repeatable finding → a
catalog case; drift → `qa-loop/memory/surface-map.md`; parked → `backlog.md`.

Forbidden (hard stop): see `qa-loop/scope.md` denylist — no destructive actions
on real orgs/users/billing/secrets/SSO; toggles must be reverted in the same case.

Deliverable: open a PR (never commit to `main`), then summarize — new bugs
(Bug/Severity/Finding), re-verified prior bugs (flag any WORSENED), what passed,
and what was NOT testable and why. Lead with security or crash findings.
