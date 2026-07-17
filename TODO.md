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

- [ ] Split the remaining god pages: `Automation.tsx` (~620), `Bugs.tsx` (~590), `Incidents.tsx` (~390)
- [ ] Consolidate the duplicated filter-bar pattern (Automation / Runs / Incidents)
- [ ] `badges.tsx` duplicates `lib/bugStatus.ts` status→label/color mapping
- [ ] Bundle is one ~1.4 MB chunk — dynamic-import the graph (`@xyflow/react`, dagre) and charts (recharts)
- [ ] Legacy `index.html` silent localStorage-corruption recovery (warn the user)
- [ ] SRI hash for the legacy site's Cytoscape CDN script

## Process (Phase 4 of AUDIT.md)

- [ ] Change the worker's REWRITE_PROMPT to open a PR with auto-merge instead of committing to `main` (decision made 2026-07-17)
- [ ] Branch protection on `main` once the pipeline change lands
- [ ] Coverage ratchet — blocked on the (currently descoped) test suite
- [ ] gitleaks secret scan in CI
