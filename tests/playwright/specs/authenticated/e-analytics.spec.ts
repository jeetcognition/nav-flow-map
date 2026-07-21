import { test, expect } from "@playwright/test";
import { AnalyticsPage } from "../../pages";
import { routes } from "../../support/paths";

async function expectNoCrash(page: any) {
  await expect(page.getByRole("tab", { name: "Usage" })).toBeVisible();
  const errorCount = await page
    .getByText(/internal server error|something went wrong|error loading/i)
    .count();
  expect(errorCount).toBe(0);
}

test.describe("Enterprise Analytics", () => {
  test.beforeEach(({ page }) => {
    page.on("dialog", async (dialog) => {
      const message = dialog.message();
      await dialog.dismiss();
      throw new Error(`Unexpected dialog: ${message}`);
    });
  });

  test("ANAL-SMK01 — Load cold", async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();
    await analytics.expectLoaded();

    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Searches" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pull requests" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Devin reviews" })).toBeVisible();
    expect(await page.locator("svg").count()).toBeGreaterThan(0);
  });

  test("ANAL-SAN01 — Switch Usage, Consumption, Categories, and sub-tabs", async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    await analytics.switchTab("Usage");
    await expect(page).toHaveURL(/\/settings\/analytics$/);
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

    await analytics.switchTab("Consumption");
    await expect(page).toHaveURL(/\?tab=consumption/);
    await expect(page.getByRole("heading", { name: "Current billing month" })).toBeVisible();

    await analytics.switchSubTab("Organizations");
    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();

    await analytics.switchTab("Categories");
    await expect(page).toHaveURL(/\?tab=categories/);
    await expect(page.getByRole("heading", { name: "Category details" })).toBeVisible();

    // Sub-tabs on Usage
    await analytics.switchTab("Usage");
    await analytics.switchSubTab("Organizations");
    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();

    await analytics.switchSubTab("Users");
    await expect(page.getByRole("heading", { name: "Active users" })).toBeVisible();

    await analytics.switchSubTab("Repositories");
    await expect(page.getByRole("heading", { name: "Repositories" })).toBeVisible();

    await analytics.switchSubTab("Overall");
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
  });

  test("ANAL-SAN02 — Open date range, organization, view, and grouping dropdowns", async ({
    page,
  }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();
    const beforeUrl = page.url();

    const dateMenu = await analytics.openDateRange();
    await expect(dateMenu).toContainText("Current");
    await expect(dateMenu).toContainText("This month");
    await expect(dateMenu).toContainText("Last 7 days");
    await page.keyboard.press("Escape");

    const orgMenu = await analytics.openOrgFilter();
    await expect(orgMenu).toContainText("All organizations");
    await page.keyboard.press("Escape");

    const viewMenu = await analytics.openViewFilter();
    await expect(viewMenu).toContainText("By size");
    await expect(viewMenu).toContainText("By origin");
    await page.keyboard.press("Escape");

    const groupingMenu = await analytics.openGroupingFilter();
    await expect(groupingMenu).toContainText("Daily");
    await expect(groupingMenu).toContainText("Weekly");
    await page.keyboard.press("Escape");

    await expect(page).toHaveURL(beforeUrl);
    await analytics.expectLoaded();
  });

  test("ANAL-REG01 — Select date ranges and validate invalid ranges", async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    // Valid preset
    await analytics.selectDateRange("Last 7 days");
    await expect(page).toHaveURL(/period=last-7-days/);
    await expectNoCrash(page);

    // Invalid start > end
    await page.goto(
      `${routes.analytics()}?startDate=2026-08-01T00:00:00.000Z&endDate=2026-07-01T00:00:00.000Z`,
    );
    await page.waitForLoadState("networkidle").catch(() => {});
    await expectNoCrash(page);

    // Same day
    await page.goto(
      `${routes.analytics()}?startDate=2026-07-21T00:00:00.000Z&endDate=2026-07-21T00:00:00.000Z`,
    );
    await page.waitForLoadState("networkidle").catch(() => {});
    await expectNoCrash(page);

    // Future range
    await page.goto(
      `${routes.analytics()}?startDate=2030-01-01T00:00:00.000Z&endDate=2030-01-31T00:00:00.000Z`,
    );
    await page.waitForLoadState("networkidle").catch(() => {});
    await expectNoCrash(page);

    // Very large range
    await page.goto(
      `${routes.analytics()}?startDate=2000-01-01T00:00:00.000Z&endDate=2099-12-31T00:00:00.000Z`,
    );
    await page.waitForLoadState("networkidle").catch(() => {});
    await expectNoCrash(page);

    await page.goto(routes.analytics());
    await analytics.expectLoaded();
  });

  test("ANAL-REG02 — Search/select organizations with safe and no-match inputs", async ({
    page,
  }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    // Select the default test sub-org and verify the URL scopes.
    await analytics.selectOrg(analytics.testSuborgDisplay);
    await expect(page).toHaveURL(/org=org-/);
    await expectNoCrash(page);

    // Restore all organizations.
    await analytics.selectAllOrganizations();
    await expect(page).not.toHaveURL(/org=/);

    const orgMenu = () => page.getByRole("menu").or(page.locator("[data-open]"));

    // No-match search inside the org dropdown.
    await analytics.openOrgFilter();
    await analytics.searchOrgs("xyzqwerty_no_match_999");
    expect(await orgMenu().locator('[role="option"]').count()).toBe(0);
    await page.keyboard.press("Escape");

    // Literal and injection-like inputs should be safe and return no match.
    const safeInputs = [
      "🔥_unicode_éxample",
      "a".repeat(200),
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1)>",
    ];
    for (const term of safeInputs) {
      await analytics.openOrgFilter();
      await analytics.searchOrgs(term);
      expect(await orgMenu().locator('[role="option"]').count()).toBe(0);
      await page.keyboard.press("Escape");
    }

    await page.goto(routes.analytics());
    await analytics.expectLoaded();
  });

  test("ANAL-REG03 — Switch chart view and time grouping", async ({ page }) => {
    const analytics = new AnalyticsPage(page);
    await analytics.goto();

    await analytics.selectView("By origin");
    await expect(page.getByRole("combobox", { name: "Select view" })).toHaveText("By origin");
    await expectNoCrash(page);

    await analytics.selectGrouping("Weekly");
    await expect(analytics.groupingFilter).toHaveText("Weekly");
    await expectNoCrash(page);

    // Restore defaults.
    await analytics.selectView("By size");
    await analytics.selectGrouping("Daily");
    await analytics.expectLoaded();
  });

  test("ANAL-REG05 — Tamper query params with invalid and HTML-like values", async ({ page }) => {
    const analytics = new AnalyticsPage(page);

    const payloads = [
      "?tab=invalid&view=bad&grouping=evil&dateRange=%3Cscript%3Ealert(1)%3C/script%3E&orgId=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
      "?tab=categories&view=bad&grouping=evil&dateRange=%3Cscript%3E",
      "?startDate=not-a-date&endDate=also-bad&tab=invalid",
    ];

    for (const qs of payloads) {
      await page.goto(`${routes.analytics()}${qs}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      const body = await page.locator("body").textContent();
      expect(body).not.toMatch(/internal server error|something went wrong|500/);
      await expect(page.getByRole("tab", { name: "Usage" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Consumption" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Categories" })).toBeVisible();
    }

    await page.goto(routes.analytics());
    await analytics.expectLoaded();
  });
});
