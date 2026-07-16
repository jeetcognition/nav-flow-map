# Playwright case-ID convention

Playwright tests in this project use the nav-flow-map catalog ID as their
single test identity. Every test title includes the exact ID in brackets and
the suite tag:

```ts
test('@smoke loads preferences [PREF-SMK01]', async ({ page }) => {});
test('@sanity validates preferences [PREF-SAN01]', async ({ page }) => {});
```

Use one spec per area under `playwright/tests/<area>.spec.ts`. The ID prefix
maps the case to `BASE_PAGES` in the root `index.html`; the page's route then
maps to the corresponding POM or component under `playwright/tests/pages/` or
`playwright/tests/components/`.

The old standalone suite used ad-hoc `ENT-xxx` labels, such as `ENT-006`.
Those labels are being retired in favor of catalog IDs. Do not invent a new
`ENT-xxx` identifier. Find the corresponding catalog case and use its ID; if
there is no clear mapping, ask the lead before authoring the test.

The authoring skill lives at
`.agents/skills/author-playwright-from-catalog/SKILL.md`. Its template is
stored as `example.spec.ts.txt` outside the Playwright `*.spec.ts` test glob.
