# 11 — Enterprise Analytics

PRD §8.9 (Analytics), §8.4 (Usage/Consumption). Page: `/org/cog-enterprise-qa/settings/analytics` (tabs: Usage, Consumption, Categories).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ANAL-SMK01 | Smoke | P1 | Enterprise settings → Analytics | Load cold | Breadcrumb; tab bar (Usage selected); date-range="This month"; org filter="All organizations"; charts render without layout shift/console errors; "Last updated…" timestamp accurate. |
| ANAL-SAN01 | Sanity | P2 | Analytics | Click each tab (Usage/Consumption/Categories); deep-link `?tab=` | Content swaps; `?tab=consumption/categories` restore; invalid `?tab=xxx` → Usage. |
| ANAL-SAN02 | Sanity | P2 | Usage tab | Toggle sub-tabs (Overall/Users/Service-users/Reviews); grouping By size/origin, Daily/Weekly | Charts refetch/re-render; no crash. |
| ANAL-REG01 | Regression | P2 | Analytics | **Date-range** picker: Current/Previous toggle + presets (This week/month/quarter/billing cycle/Last 7/30/90/Custom) | Each preset refetches all charts; selection in URL; survives refresh (deep-link). |
| ANAL-REG02 | Regression | P1 | Analytics | **Custom range**: start>end, start==end, multi-year, future end | Validation/clamping; sensible partial/empty result; no 500. |
| ANAL-REG03 | Regression | P1 | Analytics | Query-param tamper `?start=abc&end=<script>alert(1)</script>` | Server sanitizes/falls back to default; no XSS echo; no 500. |
| ANAL-REG04 | Regression | P2 | Analytics | **Org filter**: lists sub-orgs (searchable, incl. jeet-test-org) + "Entire Enterprise"; select one | Charts rescope; selection in URL; survives refresh; only in-enterprise orgs listed (IDOR). |
| ANAL-REG05 | Regression | P1 | Analytics | Org filter search: XSS/SQLi/5000-char/emoji | Literal filtering; no exec; debounced; no 500. |
| ANAL-REG06 | Regression | P2 | Analytics | Org filter on **Consumption** tab | Filter DISABLED (enterprise-billing scoped); switching from single-org (Usage) to Consumption must not silently apply stale scope; disabled state announced to AT. |
| ANAL-REG07 | Regression | P1 | Analytics | IDOR: tamper org-id in metrics request to org outside enterprise | Server rejects; no cross-tenant leak. **N/E** (request forgery). |
| ANAL-REG08 | Regression | P2 | Analytics | Select org with zero activity | Clean empty states in every widget (no NaN/`—`-only breakage). |
| ANAL-REG09 | Regression | P1 | Consumption (Overall) | Verify ACU KPI internal consistency (consumed + left = total; % correct) | Numbers self-consistent (prior: 636+2,364=3,000, 21.2%); Export-to-CSV works. |
| ANAL-REG10 | Regression | P2 | Analytics | Throttle Slow 3G / force metrics 500 | Per-widget skeleton then graceful per-widget error+retry; not infinite spinner/blank page; stale range data not shown as current. |
| ANAL-E2E01 | E2E | P2 | Analytics | Set date range + single org → switch to Categories → refresh | Scope carries over; Categories rescopes; deep-link restores full state. |
