# Enterprise Web App — Navigation Flow Map

Interactive top-to-bottom map of the enterprise web app's navigation, with each page linked to its QA test cases.

**Live:** https://jeetcognition.github.io/nav-flow-map/

## QA platform direction

This repository is the active home for the unified QA platform: Nav Flow UI, canonical catalog, Devin Desktop runner, Playwright automation, and future triage/integration services. The other QA repositories are migration sources rather than parallel systems. See [`docs/architecture.md`](docs/architecture.md).

The canonical catalog contract lives under [`catalog/`](catalog/). Enterprise Settings → Devin is the initial schema pilot; the existing Markdown files and `testcases.js` continue to power the UI until catalog generation is added in the next migration step.

Validate catalog changes with:

```bash
npm run catalog:validate
```

## Features
- Responsive top-to-bottom flow tree: Login → landing (search `jeet-test-org`) → top-left logo menu → Enterprise/Personal settings → tabs.
- Every node with children is collapsible. The first four layers open by default with responsive viewport breathing room; deeper branches remain collapsed until clicked, expansion state persists in the browser, and searches reveal hidden matches automatically.
- Click any page to see its route, description, numbered "How to reach" path, and a filterable test case table (Sanity / Regression; ex-Smoke shown as `SM-n`, ex-Sanity `SN-n`, ex-Regression/E2E `RG-n`, original IDs as tooltips).
- Panel view toggles: full-screen graph, full-screen panel, or split.
- `+ Add page`: add your own nodes with draft test cases (type `Draft`, intended for a later AI rewrite pass).
- `+ Add link`: connect two existing pages with an extra navigation link when a page is reachable more than one way (e.g. Landing Search Page → Settings, in addition to the main logo-menu path).
  - Pick a From page, a To page, and a short "how to navigate" description in the dialog.
  - The link is drawn as a dashed purple arrow; the primary tree layout is unaffected.
  - The target page lists each extra route under "Also reachable via", with the source page and navigation steps.
  - Duplicate and self links are rejected (including links that already exist as the page's main parent edge).
  - In Edit mode, a `remove` button next to each "Also reachable via" entry deletes the link.
  - Extra links persist like other edits: browser localStorage immediately, and permanently for everyone via `Save to repo` (`addedLinks` / `removedLinks` in `navmap-edits.json`).
- Inline editing of routes, descriptions, and test case Steps/Expected; edits persist in browser localStorage. `Reset edits` clears unsaved local edits.
- **Permanent edits**: the site loads a committed `navmap-edits.json` from this repo on startup, so saved edits appear for everyone. `Save to repo` posts your current edits to a Cloudflare Worker (`worker/`, deployed at `navmap-save.jeet-navmap.workers.dev`) which commits the file using a server-side GitHub token — no token needed in the browser. The Worker only accepts requests from the Pages origin and validates the JSON shape.
- **Bugs**: `bugs.js` tracks known bugs mapped to pages. Nodes with active bugs get a red border; each page's panel shows a Bugs table (ID, severity, status, linked test-case IDs, Linear/JAM links); the red-bordered `Bugs` toolbar button opens an all-bugs view with severity filters (click a row to jump to the node); `+ Report bug` on any page files a draft bug (`BUG-DRAFT-…`) that the AI promotion turns into the next `BUG-NNN` in `bugs.js`.
- **Automatic AI promotion**: when a save contains anything promotable (drafts, added pages, field edits, or reported bugs), the Worker automatically starts a Devin session (server-side Devin API key) that rewrites the drafts and **promotes everything into the source files** (see "How edits flow" below), committing directly to `main`; reload the site once it finishes (~1–2 min). Saves that only change links don't trigger a session.

## How edits flow

```
browser edits ─▶ localStorage ──Save to repo─▶ navmap-edits.json ──auto AI promotion─▶ source files
              (this browser only)      (permanent, merged on load)       (canonical: *.md + testcases.js + index.html)
```

1. **Edit in the browser** — add pages, draft test cases, links, or edit fields. Everything is stored in your browser's localStorage immediately (survives reloads, but only on your machine).
2. **Save to repo** — commits those edits into `navmap-edits.json` via the Cloudflare Worker. Now they're permanent and visible to everyone: on every load the site merges this file over the base data (`addedPages`, `pageOverrides`, `addedCases`, `caseOverrides`, `addedLinks`/`removedLinks`).
3. **Automatic AI promotion** — if the save contained drafts, new pages, or field edits, the Worker starts a Devin session that:
   - rewrites each rough draft into a full structured case (suite, priority, numbered steps, expected result);
   - assigns stable IDs with a per-page prefix (inventing one and adding it to the page's `prefixes` in `index.html` if needed, e.g. `SUP-*` for the Support Page);
   - appends the cases to the matching `qa-testing/testcases/*.md` table (creating a new file for new pages) and to `testcases.js`;
   - folds added pages and page-field edits directly into `BASE_PAGES` in `index.html`, and applies edits to existing cases in both `testcases.js` and their markdown row;
   - empties the promoted keys of `navmap-edits.json` and commits everything to `main`.
4. **Custom links stay in `navmap-edits.json`** — extra navigation arrows added with `+ Add link` (`addedLinks`/`removedLinks`) are rendered from this file and are never promoted into `index.html`; the AI promotion preserves them.

So `navmap-edits.json` is the fast permanent layer, and the markdown files + `testcases.js` + `index.html` are the canonical sources the AI pass maintains.

## Run locally
```bash
python3 -m http.server 8899
# open http://localhost:8899/index.html
```
No build step. Cytoscape.js loads from the unpkg CDN (internet required on first load).

## Data sources
- `testcases.js` — canonical test case data loaded by the site (originally parsed from the imported QA markdown suite), mapped to pages by ID prefix (e.g. `GEN-*` → General & SSO).
- `bugs.js` — known bugs mapped to pages (seeded from the QA Bug.md tracker).
- `CHANGELOG.md` — record of every feature/behaviour change and why it was made.
- `qa-testing/testcases/*.md` — markdown source for cases added or promoted through the website (files 18+). The imported 01–17 area files and `nav_graph.md` were removed once their content lived in `testcases.js` and the in-app graph.
- `catalog/` — canonical schema-validated testcase catalog (Enterprise Settings → Devin pilot); see `catalog/README.md`.
