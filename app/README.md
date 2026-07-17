# QA Command Center (Phase 1)

Multi-surface AI QA command center — UI-only with a mock data layer. Built with Vite + React 19 + TypeScript, React Flow, framer-motion, recharts, Phosphor icons.

## Run

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

## Architecture

- `src/data/fixtures/` — typed JSON fixtures: 372 testcases (converted from the legacy `testcases.js`), 17 bugs, 12 runs with per-case results, 25 incidents (mock Pylon/Datadog), Devin sessions, users, surfaces.
- `src/data/dataService.ts` — the single data layer (reads, mutations, derived stats, subscribe). Swap its internals for real APIs in Phase 2 without touching UI.
- `src/data/aiService.ts` — all AI features (`AI_MOCK = true` returns canned responses with latency). Every AI output is a draft the human edits before saving.
- `scripts/seed.mjs` — regenerates fixtures from the legacy repo data deterministically (`node scripts/seed.mjs`).

## Modules

| Route                          | Module                                                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                            | Dashboard — coverage, runs, bugs, incident charts, escaped defects                                                                                    |
| `/map`                         | Graph coverage map — React Flow + dagre, progress rings, coverage/risk heat toggle, node panel with AI testcase suggestions (`?node=<id>` deep links) |
| `/runs`, `/runs/:id`           | Run history + detail with AI summary, failure clustering, flaky flags                                                                                 |
| `/bugs`, `/bugs/:id`           | Issues — table + kanban, AI bug drafting with duplicate detection                                                                                     |
| `/incidents`, `/incidents/:id` | AI triage feed (category + confidence + human override), create-testcase-from-incident, escaped-defect traceability                                   |
| `/automation`                  | Coverage by node, testcase explorer (`?case=<id>`), live mock Devin sessions, AI coverage-gap report                                                  |

The legacy single-file app remains untouched at the repo root (`index.html`).
