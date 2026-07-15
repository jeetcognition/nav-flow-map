# 11 — Enterprise Analytics

PRD §8.9 (Analytics), §8.4 (Usage/Consumption). Page: `/org/cog-enterprise-qa/settings/analytics` (tabs: Usage, Consumption, Categories).

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| ANAL-SMK01 | Smoke | P1 | Settings → Analytics | Load cold. | Usage, Consumption, Categories, date range, organization filter, Overall/Organizations/Users/Repositories views, refresh, export, charts, and KPIs render without page errors. |
| ANAL-SAN01 | Sanity | P1 | Analytics | Switch Usage, Consumption, and Categories; then Overall, Organizations, Users, Repositories. | Tab/view selection updates charts and URL/deep link consistently. |
| ANAL-SAN02 | Sanity | P1 | Analytics | Open date range, organization, view, and grouping dropdowns. | Options are readable, current selections are marked, and closing without selection leaves charts unchanged. |
| ANAL-REG01 | Regression | P1 | Analytics → Date range | Select current/previous/custom ranges including start>end, same-day, future, and very large range. | Invalid ranges are rejected or clamped clearly; valid ranges refetch all widgets without stale data. |
| ANAL-REG02 | Regression | P1 | Analytics → Organization filter | Search/select all organizations and one organization with no-match, Unicode, long, HTML-like, and injection-like input. | Filtering is literal and safe; charts rescope only to allowed organizations. |
| ANAL-REG03 | Regression | P1 | Analytics → charts | Switch by size/origin/grouping and daily/weekly/monthly where available. | Chart labels, totals, legends, and empty states update consistently; no NaN or broken axis labels appear. |
| ANAL-REG04 | Regression | P1 | Analytics → Export/refresh | Refresh data and export each supported view/range. | Refresh timestamp updates correctly; export file matches active filters and contains no unauthorized user/session detail. |
| ANAL-REG05 | Regression | P1 | Analytics | Tamper query params for dates, org IDs, tab/view, and grouping with invalid and HTML-like values. | App falls back safely or shows validation; no XSS echo, 500, or cross-tenant data leak. |
| ANAL-REG06 | Regression | P0 | Analytics | As restricted user or with tampered org/user/repo IDs, request analytics outside the enterprise. | Server denies unauthorized metrics and does not expose private usage, cost, or session metadata. |
| ANAL-E2E01 | E2E | P1 | Analytics | Set date range + organization + view, refresh, export, deep-link reload, then clear/restore defaults. | Full analytics state is reproducible through URL and exported data matches the selected UI scope. |
