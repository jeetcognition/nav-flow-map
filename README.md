# Enterprise Web App — Navigation Flow Map

Interactive top-to-bottom map of the enterprise web app's navigation, with each page linked to its QA test cases.

**Live:** https://jeetcognition.github.io/nav-flow-map/

## Features
- Top-to-bottom flow tree (Cytoscape.js breadthfirst layout): Login → landing (search `jeet-test-org`) → top-left logo menu → Enterprise/Personal settings → tabs.
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
- **Rewrite drafts with AI**: the `Rewrite drafts with AI` button saves your edits, then calls the Worker's `/rewrite` endpoint, which uses a server-side Devin API key to start a Devin session. That session rewrites each draft in `navmap-edits.json` into a structured test case (suite, priority, steps, expected — stored as `caseOverrides` keyed `<pageId>-draft-<index>`) and commits the result to `main`; reload the site once it finishes.

## Run locally
```bash
python3 -m http.server 8899
# open http://localhost:8899/index.html
```
No build step. Cytoscape.js loads from the unpkg CDN (internet required on first load).

## Data sources
- `qa-testing/nav_graph.md` — route topology.
- `qa-testing/testcases/*.md` — 220 test cases, parsed into `testcases.js` and mapped to pages by ID prefix (e.g. `GEN-*` → General & SSO).
