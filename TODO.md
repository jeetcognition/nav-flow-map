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

## Suggestion triage

- [ ] **NavFlow "automated cases … hard coded" suggestion (not reproducible).**
      Submitted from `/navflow`: _"automated cases is not correctly pulled on
      page node. It should be automatic based on number actual status. not hard
      coded."_ Investigated: the per-node automated metric is **already derived**,
      not hard-coded. Each page node's ring value comes from
      `nodeStats(nodeId)` in `app/src/data/dataService.ts`, which computes
      `automated = cases.filter((c) => c.automation === "automated").length` and
      the node renders `pct(stats.automated, stats.total)`
      (`app/src/components/flow/FlowNode.tsx`). Verified live against the
      fixtures: login 6/6=100%, auth 8/9=89%, landing 27/27=100%, sub-org/support
      0% — every displayed value matches the actual `automation` status in
      `testcases.json`. The underlying automation flags were also just realigned
      with catalog reality (PR #64, "Sync UI fixture automation flags with
      catalog reality"), which likely resolved the stale numbers the suggestion
      was reacting to. No code change made — nothing is hard-coded to fix.
      Possible UX follow-up (out of scope, not a bug): the node's `ProgressRing`
      renders a bare number (e.g. `100`) with the "% automated" only in its
      `aria-label`, so the value can read as static at a glance; adding a visible
      `%`/label could reduce that confusion.

## Process (Phase 4 of AUDIT.md)

- [ ] Change the worker's REWRITE_PROMPT to open a PR with auto-merge instead of committing to `main` (decision made 2026-07-17)
- [ ] Branch protection on `main` once the pipeline change lands
- [ ] Coverage ratchet — blocked on the (currently descoped) test suite
- [ ] gitleaks secret scan in CI
