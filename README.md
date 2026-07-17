# Enterprise Web App — QA Command Center

Interactive QA hub for the enterprise web app: a navigation-flow map with each
page linked to its test cases, plus Runs, Issues, Incidents, and Automation
views.

**Live:** https://jeetcognition.github.io/nav-flow-map/

## Repository layout

| Path                                 | What                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                               | **QA Command Center** — the React app served at the URL above (Dashboard, NavFlow graph, Runs, Issues, Incidents, Automation). See [`app/README.md`](app/README.md). |
| `app/src/data/fixtures/`             | Canonical data: `nodes.json` (graph pages), `testcases.json`, `bugs.json`, plus runs/incidents/sessions fixtures.                                                    |
| `catalog/`                           | Canonical page/testcase catalog foundation (schema + empty `pages/`).                                                                                                |
| `docs/`                              | Architecture, durable decisions, and work-log.                                                                                                                       |
| `scripts/validate-catalog.mjs`       | Validates `catalog/pages/*.json` against `catalog/schema/page-catalog.schema.json`.                                                                                  |
| `scripts/validate-data.js`           | Cross-checks the fixtures and `navmap-edits.json` (run by the Validate CI workflow).                                                                                 |
| `worker/`                            | Cloudflare Worker: commits `navmap-edits.json`, starts Devin promotion/suggestion sessions (`wrangler deploy`).                                                      |
| `qa-testing/`                        | Markdown test-case sources maintained by the AI promotion pass.                                                                                                      |
| `AUDIT.md` / `TODO.md` / `AGENTS.md` | Engineering audit, living backlog, and contributor/agent conventions.                                                                                                |

The legacy no-build site (root `index.html` + `testcases.js` + `bugs.js`) was
removed on 2026-07-18 once the React app replaced it; its data lives on as the
app's fixtures.

Tooling: repo-wide Prettier (`npm run format`, `npm run format:check`), catalog
validation (`npm run catalog:validate`), pre-commit hooks via husky + lint-staged,
and CI (lint · strict typecheck · build · data validation · catalog validation)
on every PR — see `AGENTS.md` for the rules.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds `app/`
(base path `/nav-flow-map/`) and deploys it to GitHub Pages, with a `404.html`
SPA fallback so deep links work.

## How edits flow

```
browser edits ─▶ localStorage ──Save to repo─▶ navmap-edits.json ──auto AI promotion─▶ fixtures ──rebuild─▶ live site
              (this browser only)      (permanent, merged on load)     (canonical: app/src/data/fixtures + *.md)
```

1. **Edit in the browser** — add pages, draft test cases, links, or edit
   fields on the NavFlow page. Everything is stored in localStorage
   immediately (survives reloads, but only on your machine).
2. **Save to repo** — commits those edits into `navmap-edits.json` via the
   Cloudflare Worker (`worker/`, deployed at
   `navmap-save.jeet-navmap.workers.dev`; server-side GitHub token, no token
   in the browser). The app merges this file over the fixtures on load, so
   saved edits appear for everyone right away.
3. **Automatic AI promotion** — if the save contained drafts, new pages, field
   edits, or reported bugs, the Worker starts a Devin session (server-side
   Devin API key) that rewrites drafts into full structured cases and promotes
   everything into the canonical sources: `app/src/data/fixtures/nodes.json`,
   `testcases.json`, `bugs.json`, and the matching
   `qa-testing/testcases/*.md` tables — then empties the promoted keys of
   `navmap-edits.json` and commits to `main`, which redeploys the site.
4. **Custom links stay in `navmap-edits.json`** — extra navigation arrows
   (`addedLinks`/`removedLinks`) are rendered from this file and never
   promoted into the fixtures.

The Worker also powers the in-app "Suggest an improvement" box (`/suggest`):
each suggestion starts a Devin session that implements it and opens a PR for
review.

## Run locally

```bash
cd app
npm install
npm run dev
# opens on http://localhost:8899 (port is on the save worker's CORS allowlist)
```

## Data sources

- `app/src/data/fixtures/*.json` — canonical app data (pages, test cases,
  bugs, runs, incidents), maintained by the AI promotion pass.
- `navmap-edits.json` — pending website edits, merged over the fixtures on
  load; written by the save Worker.
- `qa-testing/testcases/*.md` — markdown source for cases added or promoted
  through the website.
- `catalog/pages/*.json` — future canonical page + testcase catalog, currently
  empty while the schema and validator are being proven.
- `CHANGELOG.md` — record of every feature/behaviour change and why it was
  made.
- `docs/decisions.md` and `docs/work-log.md` — durable project memory.

## Catalog (foundation)

The `catalog/` directory will become the source of truth for pages, test cases,
and bugs. It is currently empty (`catalog/pages/.gitkeep`) so the schema and
validator can be hardened before re-authoring cases page by page.

```bash
npm run catalog:validate
```

The long-term target architecture is in
[`docs/qa-platform-architecture-plan.md`](docs/qa-platform-architecture-plan.md).
