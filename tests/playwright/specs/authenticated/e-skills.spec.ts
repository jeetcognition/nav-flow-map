import { test, expect } from "@playwright/test";
import { SkillsSettingsPage, ENTERPRISE_SLUG } from "../../pages";

test.describe("Enterprise Skills analytics", () => {
  let skills: SkillsSettingsPage;

  test.beforeEach(async ({ page }) => {
    skills = new SkillsSettingsPage(page);
    await skills.goto();
    await skills.expectCoreSectionsVisible();
  });

  test("SKILL-SMK01 — Load cold.", async () => {
    await expect(skills.searchInput).toBeVisible();
    await expect(skills.viewSessionsLink).toBeVisible();
  });

  test("SKILL-SAN01 — Inspect analytics cards and table rows.", async () => {
    await expect(skills.usageOverTimeHeading).toBeVisible();
    await expect(skills.mostInvokedHeading).toBeVisible();
    await expect(skills.taskTypesHeading).toBeVisible();

    const table = skills.page.locator("table, [role='table']").first();
    await expect(table).toBeVisible();
    const rows = table.getByRole("row");
    await expect(rows.first()).toBeVisible();
  });

  test("SKILL-SAN02 — Open runtime and date-range filters.", async () => {
    await skills.openFilter("Cloud and local");
    await expect(
      skills.page.getByRole("option").filter({ hasText: /^Cloud and local$/ }),
    ).toBeVisible();
    await expect(skills.page.getByRole("option").filter({ hasText: /^Cloud$/ })).toBeVisible();
    await expect(skills.page.getByRole("option").filter({ hasText: /^Local$/ })).toBeVisible();
    await skills.closeFilterWithEscape();

    await skills.openFilter("Last 30 days");
    await expect(
      skills.page.getByRole("option").filter({ hasText: /^Last 7 days$/ }),
    ).toBeVisible();
    await expect(
      skills.page.getByRole("option").filter({ hasText: /^Last 30 days$/ }),
    ).toBeVisible();
    await skills.closeFilterWithEscape();

    // Closing without changing selection must leave the default labels and sections intact.
    await expect(
      skills.page.getByRole("combobox").filter({ hasText: /^Cloud and local$/ }),
    ).toBeVisible();
    await expect(
      skills.page.getByRole("combobox").filter({ hasText: /^Last 30 days$/ }),
    ).toBeVisible();
    await skills.expectCoreSectionsVisible();
  });

  test("SKILL-REG01 — Search skills/sources with match, no-match, and literal values.", async () => {
    await expect(skills.viewSessionsLink).toBeVisible();

    await skills.searchInput.fill("exploratory-webapp-qa");
    await skills.page.waitForLoadState("networkidle").catch(() => {});
    await expect(skills.viewSessionsLink).toBeVisible();

    await skills.searchInput.fill("<img src=x onerror=alert(1)>");
    await skills.page.waitForLoadState("networkidle").catch(() => {});
    await expect(skills.noSkillsMessage).toBeVisible();
    await expect(skills.page.getByText("Try a different skill or source")).toBeVisible();

    await skills.searchInput.clear();
    await skills.page.waitForLoadState("networkidle").catch(() => {});
    await expect(skills.viewSessionsLink).toBeVisible();
  });

  test("SKILL-REG02 — Switch Cloud/local runtime and date ranges.", async () => {
    await skills.selectFilterOption("Cloud and local", "Cloud");
    await expect(skills.page.getByRole("combobox").filter({ hasText: /^Cloud$/ })).toBeVisible();

    await skills.selectFilterOption("Cloud", "Cloud and local");
    await expect(
      skills.page.getByRole("combobox").filter({ hasText: /^Cloud and local$/ }),
    ).toBeVisible();

    await skills.selectFilterOption("Last 30 days", "Last 7 days");
    await expect(
      skills.page.getByRole("combobox").filter({ hasText: /^Last 7 days$/ }),
    ).toBeVisible();

    await skills.selectFilterOption("Last 7 days", "Last 30 days");
    await expect(
      skills.page.getByRole("combobox").filter({ hasText: /^Last 30 days$/ }),
    ).toBeVisible();

    await skills.expectCoreSectionsVisible();
  });

  test("SKILL-REG03 — Click View sessions for a row, then return.", async ({ context }) => {
    const [sessionsPage] = await Promise.all([
      context.waitForEvent("page"),
      skills.viewSessionsLink.click(),
    ]);

    await sessionsPage.waitForURL(
      new RegExp(`/org/${ENTERPRISE_SLUG}/settings/enterprise-sessions`),
      {
        timeout: 20_000,
      },
    );
    await sessionsPage.waitForLoadState("networkidle").catch(() => {});
    await expect(sessionsPage).toHaveTitle(/Sessions/);
    await sessionsPage.close();

    // Returning to the skills page should leave the original table intact.
    await expect(skills.heading).toBeVisible();
    await expect(skills.viewSessionsLink).toBeVisible();
  });
});
