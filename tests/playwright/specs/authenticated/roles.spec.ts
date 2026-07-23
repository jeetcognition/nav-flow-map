import { test, expect, type Page } from "@playwright/test";
import { RolesPage } from "../../pages";
import { ENTERPRISE_SLUG } from "../../support/paths";

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

  test("ROLE-SAN03 — Open the form without saving.", async ({ page }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();
    await roles.openCreateForm("enterprise");

    await expect(page).toHaveURL(/\/settings\/roles\/enterprise\/add/);
    await expect(page.getByRole("heading", { name: "Create enterprise role" })).toBeVisible();
    await expect(roles.roleNameInput).toBeVisible();
    await expect(roles.cancelButton).toBeVisible();
    await expect(roles.saveChangesButton).toBeDisabled();

    // Enterprise permission groups with per-permission descriptions and checkboxes.
    await expect(roles.groupHeaderRow(/Account permissions/)).toBeVisible();
    await expect(roles.groupHeaderRow(/Integration permissions/)).toBeVisible();
    await expect(roles.permissionRow(/View organizations/)).toBeVisible();
    await expect(
      page.getByText("View enterprise organizations (read-only)", { exact: true }),
    ).toBeVisible();
    await expect(roles.permissionCheckbox(/View organizations/)).toBeVisible();
    await expect(roles.permissionCheckbox(/View organizations/)).not.toBeChecked();

    // Leave without saving; the roles list is unchanged.
    await roles.cancelButton.click();
    await expect(roles.rolesTab).toHaveAttribute("aria-selected", "true");

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG04 — Attempt creation with blank, whitespace-only, and edge-case names.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    // Long + Unicode + emoji + HTML-like name in one disposable role.
    const edgeName = `qa-temp-edge-${Date.now()}-āēī-🔒-<script>alert(1)</script>-${"x".repeat(40)}`;

    try {
      await roles.goto();
      await roles.openCreateForm("enterprise");

      // Blank and whitespace-only names are rejected: Save stays disabled.
      await expect(roles.saveChangesButton).toBeDisabled();
      await roles.roleNameInput.fill("   ");
      await expect(roles.saveChangesButton).toBeDisabled();

      // Unsafe/Unicode text stays inert through create, list rendering, and delete.
      await roles.roleNameInput.fill(edgeName);
      await roles.permissionCheckbox(/View organizations/).check();
      await roles.saveChangesButton.click();
      await roles.searchInput.waitFor({ state: "visible" });

      await roles.searchInput.fill(edgeName);
      await expect(roles.rowByRoleName(edgeName)).toHaveCount(1);
      await expect(roles.tableRows.first().getByText(edgeName)).toBeVisible();

      // Same names in different scopes remain unambiguous (built-in Admin exists in both).
      await roles.searchInput.fill("Admin");
      await expect(roles.rowByRoleName("Admin").filter({ hasText: "Enterprise" })).toHaveCount(1);
      await expect(roles.rowByRoleName("Admin").filter({ hasText: "Organization" })).toHaveCount(1);
    } finally {
      await roles.deleteRoleIfPresent(edgeName);
    }

    await roles.searchInput.fill(edgeName);
    await expect(roles.noResultsRow).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG05 — Expand/collapse permission groups and select/deselect permissions.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    await roles.goto();
    await roles.openCreateForm("enterprise");

    // Descriptions stay aligned with their permission rows.
    await expect(roles.permissionRow(/View organizations/)).toContainText(
      "View enterprise organizations (read-only)",
    );
    await expect(roles.permissionRow(/View Git integrations/)).toContainText(
      "View Git integrations (read-only)",
    );

    // Collapse a group: its permissions hide while other groups stay expanded.
    await roles.groupHeaderRow(/Account permissions/).click();
    await expect(roles.permissionRow(/View organizations/)).toBeHidden();
    await expect(roles.permissionRow(/View Git integrations/)).toBeVisible();

    // Expand it again.
    await roles.groupHeaderRow(/Account permissions/).click();
    await expect(roles.permissionRow(/View organizations/)).toBeVisible();

    // Select/deselect permissions across groups; checkbox state stays accurate.
    await roles.permissionCheckbox(/View organizations/).check();
    await roles.permissionCheckbox(/View Git integrations/).check();
    await expect(roles.permissionCheckbox(/View organizations/)).toBeChecked();
    await expect(roles.permissionCheckbox(/View Git integrations/)).toBeChecked();

    await roles.permissionCheckbox(/View organizations/).uncheck();
    await expect(roles.permissionCheckbox(/View organizations/)).not.toBeChecked();
    await expect(roles.permissionCheckbox(/View Git integrations/)).toBeChecked();

    // Leave without saving.
    await roles.cancelButton.click();
    await expect(roles.rolesTab).toHaveAttribute("aria-selected", "true");

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG06 — Create, verify, edit, reload, and delete an enterprise role.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    const name = `qa-temp-enterprise-role-${Date.now()}`;
    const editedName = `${name}-edited`;

    try {
      // Create with minimal permissions.
      await roles.createEnterpriseRole(name, [/View organizations/]);
      await roles.searchInput.fill(name);
      await expect(roles.rowByRoleName(name)).toHaveCount(1);
      await expect(roles.rowByRoleName(name)).toContainText("1 permission");
      await expect(roles.rowByRoleName(name)).toContainText("Enterprise");
      await expect(roles.rowByRoleName(name)).toContainText("Custom");

      // Edit name and permissions.
      await roles.openRoleDetail(name);
      await roles.editRoleButton.click();
      await roles.roleNameInput.fill(editedName);
      await roles.permissionCheckbox(/View account membership/).check();
      await roles.saveChangesButton.click();
      await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

      // Reload: the edit persists.
      await page.reload();
      await expect(page.getByRole("heading", { name: editedName })).toBeVisible();
      await roles.goto();
      await roles.searchInput.fill(editedName);
      await expect(roles.rowByRoleName(editedName)).toContainText("2 permissions");

      // Delete with confirmation.
      await roles.openRoleDetail(editedName);
      await roles.deleteButton.click();
      await expect(roles.deleteDialog).toContainText(
        `This will permanently delete "${editedName}"`,
      );
      await roles.confirmDeleteButton.click();
      await roles.searchInput.waitFor({ state: "visible" });
    } finally {
      await roles.deleteRoleIfPresent(editedName);
      await roles.deleteRoleIfPresent(name);
    }

    // Cleanup confirms the role is absent.
    await roles.searchInput.fill(name);
    await expect(roles.noResultsRow).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG08 — Make unsaved changes, then use Cancel, Back, or another page.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const roles = new RolesPage(page);
    const name = `qa-temp-unsaved-role-${Date.now()}`;

    // Cancel: documented discard behavior — returns to the list, nothing saved.
    await roles.goto();
    await roles.openCreateForm("enterprise");
    await roles.roleNameInput.fill(name);
    await roles.permissionCheckbox(/View organizations/).check();
    await roles.cancelButton.click();
    await expect(roles.rolesTab).toHaveAttribute("aria-selected", "true");
    await roles.searchInput.fill(name);
    await expect(roles.noResultsRow).toBeVisible();

    // Back to Roles: same discard behavior, nothing silently saved.
    await roles.searchInput.fill("");
    await roles.openCreateForm("enterprise");
    await roles.roleNameInput.fill(name);
    await roles.backToRolesButton.click();
    await expect(roles.rolesTab).toHaveAttribute("aria-selected", "true");
    await roles.searchInput.fill(name);
    await expect(roles.noResultsRow).toBeVisible();

    // Navigating to another page also discards without saving.
    await roles.searchInput.fill("");
    await roles.openCreateForm("enterprise");
    await roles.roleNameInput.fill(name);
    await roles.goto();
    await roles.searchInput.fill(name);
    await expect(roles.noResultsRow).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("ROLE-REG10 — Tampered role IDs are denied without exposing role data.", async ({
    page,
  }) => {
    const roles = new RolesPage(page);

    // A tampered/foreign role ID resolves to a denial, not role data.
    await page.goto(`/org/${ENTERPRISE_SLUG}/settings/roles/deadbeefdeadbeefdeadbeefdeadbeef`);
    await expect(page.getByText("Role not found")).toBeVisible();
    await expect(roles.editRoleButton).toHaveCount(0);
    await expect(roles.deleteButton).toHaveCount(0);

    // A malformed role path falls through to a 404, not an editable form.
    await page.goto(`/org/${ENTERPRISE_SLUG}/settings/roles/%2e%2e%2fescape`);
    await expect(roles.roleNameInput).toHaveCount(0);
    await expect(roles.saveChangesButton).toHaveCount(0);
  });
});
