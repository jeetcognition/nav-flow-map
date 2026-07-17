# QA Command Center (`app/`)

React 19 + Vite + TypeScript (strict) single-page app: Dashboard, **NavFlow**
(the interactive navigation-flow graph, successor to the legacy root
`index.html` site, removed 2026-07-18), Runs, Issues, Incidents, Automation,
and Settings.

Phase 1: all data is mock — typed JSON fixtures behind a swappable data layer.
Fixtures: 372 testcases (originally converted from the legacy `testcases.js`),
17 bugs, 12 runs with per-case results, 25 incidents, Devin sessions, users,
surfaces. The fixtures are now the canonical data — the Devin promotion
pipeline maintains them (see the root README), and
`node scripts/validate-data.js` (repo root) cross-checks them.

## Architecture

| Layer  | Where                      | Notes                                                                                                                                                                       |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data   | `src/data/dataService.ts`  | Singleton store over `src/data/fixtures/*.json` + pub/sub. UI never imports fixtures directly — swap this module's internals for real APIs.                                 |
| AI     | `src/data/aiService.ts`    | `AI_MOCK = true`; canned drafts behind fake latency. Swap `mockDelay` bodies for Anthropic API calls.                                                                       |
| Edits  | `src/data/editsService.ts` | Port of the legacy NavFlow edit overlay: localStorage → committed `navmap-edits.json` baseline → Save to repo (worker) → AI promotion. Payload shape must match the worker. |
| Auth   | `src/lib/auth.ts`          | Mock email → OTP login (code shown as a dev hint). Swap `sendOtp` for a real backend.                                                                                       |
| Config | `src/lib/config.ts`        | Worker endpoint, edits-JSON URL, default surface. Override with `VITE_*` env vars (see `.env.example`).                                                                     |
| State  | `src/state/AppContext.tsx` | UI chrome only (user, surface, search palette).                                                                                                                             |

Pages live in `src/pages/`, shared components in `src/components/`
(`flow/` = NavFlow graph + panel, `shell/` = sidebar/topbar/search/suggestion
box, `ui/` = generic widgets). Design tokens in `src/styles/tokens.css`.

## Develop

```bash
npm install
npm run dev        # http://localhost:8899 — port is on the save worker's CORS allowlist
npm run lint       # oxlint --deny-warnings (warnings fail)
npx tsc -b         # strict typecheck
npm run build      # tsc + vite build
```

Formatting is repo-wide Prettier — run `npm run format` at the repo root.
CI (`.github/workflows/ci.yml`) runs lint, typecheck, and build on every PR.

## Conventions

See `../AGENTS.md`. Highlights: no new god files (~300-line ceiling), config
in `lib/config.ts` (never inline URLs/IDs), every async UI path needs a
loading **and** an error state, data access only through the `data/` services.
