# 21 — Docs: Use-Cases Gallery

Imported from Notion: Devin Enterprise — QA Test Cases (sub-page 21).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| GAL-SMK01 | Smoke | P1 | Open gallery URL | Load cold | Title "Get inspired…", category chip row (9), feature chip row (7), card grid renders; "Popular ★" badges show; no console errors. |
| GAL-SMK02 | Smoke | P1 | On page | Click a card (e.g. "Auto-Triage Bugs via Linear") | Navigates to that use-case page with prompt + steps; back returns to grid. |
| GAL-SAN01 | Sanity | P1 | Category chips | Click each category (Incident Response, Migrations, …) | Grid filters to cards with matching `data-category`; "All" resets; active chip highlighted. |
| GAL-SAN02 | Sanity | P1 | Feature chips | Toggle each feature (Integrations, API, Schedules, Advanced, Playbooks, MCP, Skills) | Grid filters by `data-features`; multiple chips combine (AND/OR — document which); toggling off restores. |
| GAL-REG01 | Regression | P2 | Combine filters | Select a category + a feature together | Intersection shown; empty combo shows a clean empty state (no blank grid/JS error). |
| GAL-REG02 | Regression | P2 | Filter persistence | Apply filter → open a card → browser Back | Grid filter state restored (or documented reset); no full reload flash losing scroll. |
| GAL-REG03 | Regression | P3 | Deep-link/refresh | If filters set URL params, refresh | State restored from URL (or note it doesn't persist). |
| GAL-REG04 | Regression | P2 | All cards link-check | Crawl every card `href` | All use-case pages 200 (no dangling gallery links); each has a copyable prompt. |
| GAL-REG05 | Regression | P3 | Responsive | Narrow viewport / mobile | 5-col grid reflows; chips wrap; no overflow/clipping. |
| GAL-REG06 | Regression | P2 | Open a use-case page | Copy its "prompt you can try immediately" | Copy button works; prompt is complete/self-contained. |
| GAL-E2E01 | E2E | P2 | Gallery → product | Pick a use case (e.g. "Daily Sentry Error Fixes") → run its prompt as a real session/automation per the page | Devin performs the described workflow; doc prompt actually works end-to-end. **N/E** unless approved (spawns session/automation). |
