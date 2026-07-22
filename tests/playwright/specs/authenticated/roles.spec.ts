import { test, expect, type Page } from "@playwright/test";
import { RolesPage } from "../../pages";

test.describe("Roles", () => {
  function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("ROLE-SMK01 — Load the page cold.", async ({ page }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();

    await expect(roles.heading).toBeVisible();
    await expect(roles.rolesTab).toHaveAttribute("aria-selected", "true");
    await expect(roles.rolesTab).toHaveText(/Roles \d+/);
    await expect(roles.searchInput).toBeVisible();
    await expect(roles.scopeFilter).toBeVisible();
    await expect(roles.createRoleButton).toBeVisible();

    await expect(roles.table).toBeVisible();
    await expect(roles.table.getByRole("columnheader", { name: "Role" })).toBeVisible();
    await expect(roles.table.getByRole("columnheader", { name: "Permissions" })).toBeVisible();
    await expect(roles.table.getByRole("columnheader", { name: "Scope" })).toBeVisible();
    await expect(roles.table.getByRole("columnheader", { name: "Type" })).toBeVisible();
    await expect(roles.tableRows.first()).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("ROLE-SAN01 — Inspect role rows.", async ({ page }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();

    await expect(roles.rowByScope("Enterprise").first()).toBeVisible();
    await expect(roles.rowByScope("Organization").first()).toBeVisible();

    const firstRowText = await roles.tableRows.first().textContent();
    expect(firstRowText).toMatch(/\d+ permission/);

    expect(errors).toHaveLength(0);
  });

  test("ROLE-SAN02 — Open the scope filter and Create role menu.", async ({ page }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();

    await roles.scopeFilter.click();
    await expect(
      page.locator("[role='listbox']").getByRole("option", { name: "All", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("[role='listbox']").getByRole("option", { name: "Enterprise", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("[role='listbox']").getByRole("option", { name: "Organization", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await roles.openCreateMenu();
    await expect(roles.createForEnterprise).toBeVisible();
    await expect(roles.createForOrganizations).toBeVisible();
    await roles.closeCreateMenu();

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG01 — Search with matching, no-match, and inert inputs.", async ({ page }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();

    // Matching search.
    await roles.searchInput.fill("Admin");
    await expect(roles.rowByRoleName("Admin")).toHaveCount(2);

    // No-match search.
    await roles.searchInput.fill("xyz123notfound");
    await expect(roles.noResultsRow).toBeVisible();

    // HTML/script-like and emoji/Unicode injection strings remain inert.
    const injection = '"><script>alert(1)</script>';
    await roles.searchInput.fill(injection);
    await expect(roles.noResultsRow).toBeVisible();

    await roles.searchInput.fill("🔒");
    await expect(roles.noResultsRow).toBeVisible();

    await roles.searchInput.fill("āāā-no-match-unicode");
    await expect(roles.noResultsRow).toBeVisible();

    // Clear restores the list.
    await roles.searchInput.fill("");
    await expect.poll(() => roles.tableRows.count()).toBeGreaterThan(1);

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG02 — Filter All, Enterprise, and Organization while searching.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();

    await roles.searchInput.fill("Admin");
    await expect(roles.rowByRoleName("Admin")).toHaveCount(2);

    await roles.selectScope("Enterprise");
    await expect(roles.rowByRoleName("Admin")).toHaveCount(1);
    await expect(roles.rowByScope("Enterprise")).toHaveCount(1);
    await expect(roles.rowByScope("Organization")).toHaveCount(0);

    await roles.selectScope("Organization");
    await expect(roles.rowByRoleName("Admin")).toHaveCount(1);
    await expect(roles.rowByScope("Organization")).toHaveCount(1);
    await expect(roles.rowByScope("Enterprise")).toHaveCount(0);

    await roles.selectScope("All");
    await expect(roles.rowByRoleName("Admin")).toHaveCount(2);

    // Clear search to leave the page in default state.
    await roles.searchInput.fill("");
    await expect.poll(() => roles.tableRows.count()).toBeGreaterThan(1);

    expect(errors).toHaveLength(0);
  });
});
