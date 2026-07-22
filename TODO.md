# Backlog

Living list — update when debt is added or paid down. Larger context in
`AUDIT.md`.

## Phase 2 blockers (before real backends)

- [ ] Swap `aiService` mocks for Anthropic API calls (error states already in place)
- [ ] Real email/OTP backend for login (`app/src/lib/auth.ts` — replace `sendOtp`, remove the on-screen dev hint)
- [ ] Deploy the worker with the new `/suggest` endpoint (`wrangler deploy`); set `DEVIN_SESSIONS_URL` env var
- [ ] Worker rate limiting — GitHub commits and paid Devin sessions are unthrottled per allowed origin
- [ ] Semantic validation of the edits payload in the worker (page ids exist, links acyclic)

## Engineering debt

- [x] Split the god pages under the ~300-line ceiling: `Automation.tsx` → `components/automation/`, `Bugs.tsx` → `components/bugs/`, `Incidents.tsx` → `components/incidents/`, `RunDetail.tsx` → `components/runs/`; and the flow files `flow/dialogs.tsx` → `flow/dialogs/`, `FlowPanel.tsx` → `FlowPanelCaseTable`, `FlowMap.tsx` → `useFlowGraph`
- [x] Centralize the hard-coded Devin session URL in `lib/config.ts` (`DEVIN_SESSION_BASE_URL` / `devinSessionUrl`)
- [ ] Consolidate the duplicated filter-bar pattern (Automation / Runs / Incidents)
- [ ] `badges.tsx` duplicates `lib/bugStatus.ts` status→label/color mapping
- [ ] Bundle is one ~1.4 MB chunk — dynamic-import the graph (`@xyflow/react`, dagre) and charts (recharts)

## Process (Phase 4 of AUDIT.md)

- [x] Change the worker's REWRITE_PROMPT to open a PR with auto-merge instead of committing to `main` (decision made 2026-07-17; landed in code — needs `wrangler deploy` to take effect)
- [ ] Branch protection on `main` — blocked on the worker redeploy above; then run:
      `gh api -X PUT repos/jeetcognition/nav-flow-map/branches/main/protection -F required_status_checks[strict]=true -f 'required_status_checks[checks][][context]=validate' -f 'required_status_checks[checks][][context]=build' -F enforce_admins=false -F required_pull_request_reviews=null -F restrictions=null`
- [ ] Coverage ratchet — blocked on the (currently descoped) test suite
- [ ] gitleaks secret scan in CI
