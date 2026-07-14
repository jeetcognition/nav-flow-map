# Enterprise Web App — Navigation Flow Map

Interactive top-to-bottom map of the enterprise web app's navigation, with each page linked to its QA test cases.

**Live:** https://jeetcognition.github.io/nav-flow-map/

## Features
- Top-to-bottom flow tree (Cytoscape.js breadthfirst layout): Login → landing (search `jeet-test-org`) → top-left logo menu → Enterprise/Personal settings → tabs.
- Click any page to see its route, description, numbered "How to reach" path, and a filterable test case table (Sanity / Regression; ex-Smoke shown as `SM-n`, ex-Sanity `SN-n`, ex-Regression/E2E `RG-n`, original IDs as tooltips).
- Panel view toggles: full-screen graph, full-screen panel, or split.
- `+ Add page`: add your own nodes with draft test cases (type `Draft`, intended for a later AI rewrite pass).
- Inline editing of routes, descriptions, and test case Steps/Expected; edits persist in browser localStorage. `Export edits` downloads them as JSON; `Reset edits` clears unsaved local edits.
- **Permanent edits**: the site loads a committed `navmap-edits.json` from this repo on startup, so saved edits appear for everyone. `Save to repo` posts your current edits to a Cloudflare Worker (`worker/`, deployed at `navmap-save.jeet-navmap.workers.dev`) which commits the file using a server-side GitHub token — no token needed in the browser. The Worker only accepts requests from the Pages origin and validates the JSON shape.

## Run locally
```bash
python3 -m http.server 8899
# open http://localhost:8899/index.html
```
No build step. Cytoscape.js loads from the unpkg CDN (internet required on first load).

## Data sources
- `qa-testing/nav_graph.md` — route topology.
- `qa-testing/testcases/*.md` — 220 test cases, parsed into `testcases.js` and mapped to pages by ID prefix (e.g. `GEN-*` → General & SSO).
