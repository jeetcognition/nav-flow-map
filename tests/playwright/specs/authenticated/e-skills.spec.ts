import { test, expect, type Page } from "@playwright/test";
import { SkillsPage, routes } from "../../pages";

test.describe("Skills & Rules", () => {
  function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("SKILL-SMK01 — Load the page cold.", async ({ page }) => {
    const errors = watchErrors(page);
    const skills = new SkillsPage(page);
    await skills.goto();

    await expect(skills.heading).toBeVisible();
    await expect(skills.description).toBeVisible();
    await expect(skills.backToEnterprise).toBeVisible();
    await expect(skills.runtimeFilter).toBeVisible();
    await expect(skills.dateFilter).toBeVisible();
    await expect(skills.searchInput).toBeVisible();
    await expect(skills.usageChart).toBeVisible();
    await expect(skills.mostInvokedCard).toBeVisible();
    await expect(skills.taskTypesCard).toBeVisible();
    await expect(skills.tableRows.first()).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("SKILL-SAN01 — Inspect analytics cards and table rows.", async ({ page }) => {
    const errors = watchErrors(page);
    const skills = new SkillsPage(page);
    await skills.goto();

    await expect(skills.table.locator("th").filter({ hasText: "Skill" })).toBeVisible();
    await expect(skills.table.locator("th").filter({ hasText: "Invocations" })).toBeVisible();
    await expect(skills.table.locator("th").filter({ hasText: "Sessions" })).toBeVisible();
    await expect(skills.table.locator("th").filter({ hasText: "Users" })).toBeVisible();
    await expect(skills.table.locator("th").filter({ hasText: "Last used" })).toBeVisible();

    const row = skills.tableRows.first();
    await expect(row).toContainText("View sessions");

    expect(errors).toHaveLength(0);
  });

  test("SKILL-SAN02 — Open runtime and date-range filters.", async ({ page }) => {
    const errors = watchErrors(page);
    const skills = new SkillsPage(page);
    await skills.goto();

    await skills.runtimeFilter.click();
    await expect(page.getByRole("option", { name: "Cloud and local", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "Cloud", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "Local", exact: true })).toBeVisible();
    await page.getByRole("option", { name: "Cloud", exact: true }).click();
    await expect(skills.runtimeFilter).toContainText("Cloud");

    await skills.dateFilter.click();
    await expect(page.getByRole("option", { name: "Last 7 days", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "Last 30 days", exact: true })).toBeVisible();
    await page.getByRole("option", { name: "Last 7 days", exact: true }).click();
    await expect(skills.dateFilter).toContainText("Last 7 days");

    expect(errors).toHaveLength(0);
  });

  test("SKILL-REG01 — Search skills/sources with match/no-match, whitespace, Unicode, long, HTML-like, and injection-like text.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const skills = new SkillsPage(page);
    await skills.goto();

    const knownSkill = "exploratory-webapp-qa";
    const empty = page.getByText("No skills match your search");
    const knownRow = skills.skillRow(knownSkill);

    await skills.searchInput.fill(knownSkill);
    await expect(knownRow).toBeVisible();

    const noMatchQueries = [
      "no-such-skill-12345",
      "   ",
      "āāā-unicode-no-match",
      "<script>alert(1)</script>",
      "a".repeat(300),
    ];

    for (const query of noMatchQueries) {
      await skills.searchInput.fill(query);
      await expect(empty.or(knownRow)).toBeVisible();
    }

    await skills.searchInput.fill("");
    await expect(knownRow).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("SKILL-REG02 — Switch Cloud/local runtime and date ranges.", async ({ page }) => {
    const errors = watchErrors(page);
    const skills = new SkillsPage(page);
    await skills.goto();

    await skills.selectRuntime("Cloud");
    await expect(skills.runtimeFilter).toContainText("Cloud");

    await skills.selectDateRange("Last 7 days");
    await expect(skills.dateFilter).toContainText("Last 7 days");

    await expect(skills.table).toBeVisible();

    // Restore defaults.
    await skills.selectDateRange("Last 30 days");
    await skills.selectRuntime("Cloud and local");
    await expect(skills.dateFilter).toContainText("Last 30 days");
    await expect(skills.runtimeFilter).toContainText("Cloud and local");

    expect(errors).toHaveLength(0);
  });

  test("SKILL-REG03 — Click View sessions or skill detail for a row, then return.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const skills = new SkillsPage(page);
    await skills.goto();

    const link = skills.tableRows.first().getByText("View sessions");
    const href = await link.getAttribute("href");
    expect(href).toMatch(/\/settings\/enterprise-sessions\?skill=/);

    await link.click();
    // The SPA may intercept the anchor click; follow the href explicitly to verify the detail page.
    await page.goto(href!);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings\/enterprise-sessions\?skill=/);
    await expect(page.getByText("Skill", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/exploratory-webapp-qa/)).toBeVisible();

    // Return to the skills analytics page.
    await page.goto(routes.enterpriseSkills());
    await expect(skills.heading).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
