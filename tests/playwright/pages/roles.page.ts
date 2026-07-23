import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export type ScopeFilter = "All" | "Enterprise" | "Organization";

export class RolesPage extends BasePage {
  protected readonly path = routes.membershipTab("roles");

  readonly heading = this.page.getByRole("heading", { name: "Membership", exact: true });
  readonly rolesTab = this.page.getByRole("tab", { name: /Roles/ });
  readonly membersTab = this.page.getByRole("tab", { name: /Members/ });
  readonly groupsTab = this.page.getByRole("tab", { name: /Groups \(IdP\)/ });

  readonly searchInput = this.page.locator('input[placeholder="Search roles..."]').first();
  readonly scopeFilter = this.page.locator("button[role='combobox']");
  readonly createRoleButton = this.page.getByRole("button", { name: "Create role" });
  readonly createForEnterprise = this.page.getByRole("menuitem", { name: "Create for enterprise" });
  readonly createForOrganizations = this.page.getByRole("menuitem", {
    name: "Create for organizations",
  });

  readonly table = this.page.locator("table").first();
  readonly tableRows = this.table.locator("tbody tr");
  readonly noResultsRow = this.page.getByText("No roles found.", { exact: true });

  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.membershipTab("roles", slug));
  }

  /** Open the scope filter and select an option. */
  async selectScope(scope: ScopeFilter) {
    await this.scopeFilter.click();
    await this.page
      .locator("[role='listbox']")
      .getByRole("option", { name: scope, exact: true })
      .click();
  }

  /** Open the Create role menu without choosing an item. */
  async openCreateMenu() {
    await this.createRoleButton.click();
    await this.createForEnterprise.waitFor({ state: "visible" });
  }

  /** Close the Create role menu by pressing Escape. */
  async closeCreateMenu() {
    await this.page.keyboard.press("Escape");
  }

  rowByScope(scope: "Enterprise" | "Organization"): Locator {
    return this.tableRows.filter({ hasText: scope });
  }

  rowByRoleName(name: string): Locator {
    return this.tableRows.filter({ hasText: name });
  }

  // --- Create / edit role form ---
  readonly roleNameInput = this.page.locator('input[placeholder="Role name..."]');
  readonly saveChangesButton = this.page.getByRole("button", { name: "Save changes" });
  readonly cancelButton = this.page.getByRole("button", { name: "Cancel" });
  readonly backToRolesButton = this.page.getByRole("button", { name: "Back to Roles" });

  // --- Role detail view ---
  readonly deleteButton = this.page.getByRole("button", { name: "Delete", exact: true });
  readonly editRoleButton = this.page.getByRole("button", { name: "Edit role" });
  readonly deleteDialog = this.page.locator("[role='dialog'], [role='alertdialog']");
  readonly confirmDeleteButton = this.deleteDialog.getByRole("button", { name: "Delete role" });

  permissionRow(permission: string | RegExp): Locator {
    return this.page.getByRole("row", { name: permission });
  }

  permissionCheckbox(permission: string | RegExp): Locator {
    return this.permissionRow(permission).getByRole("checkbox");
  }

  groupHeaderRow(group: string | RegExp): Locator {
    return this.page.getByRole("row", { name: group });
  }

  /** Open the create-role form for the given scope via the Create role menu. */
  async openCreateForm(scope: "enterprise" | "organizations") {
    await this.openCreateMenu();
    const item = scope === "enterprise" ? this.createForEnterprise : this.createForOrganizations;
    await item.click();
    await this.roleNameInput.waitFor({ state: "visible" });
  }

  /** Search the roles list for an exact name and open its detail view. */
  async openRoleDetail(name: string) {
    await this.searchInput.fill(name);
    await this.rowByRoleName(name).first().locator("a").first().click();
    await this.editRoleButton.waitFor({ state: "visible" });
  }

  /** Create an enterprise role with the given permissions through the UI. */
  async createEnterpriseRole(name: string, permissions: Array<string | RegExp>) {
    await this.goto();
    await this.openCreateForm("enterprise");
    await this.roleNameInput.fill(name);
    for (const permission of permissions) {
      await this.permissionCheckbox(permission).check();
    }
    await this.saveChangesButton.click();
    await this.searchInput.waitFor({ state: "visible" });
  }

  /** Delete a role by name from the roles list; ignores missing roles. */
  async deleteRoleIfPresent(name: string) {
    await this.goto();
    await this.searchInput.fill(name);
    const row = this.rowByRoleName(name).first();
    try {
      await row.waitFor({ state: "visible", timeout: 5_000 });
    } catch {
      return; // role does not exist — nothing to clean up
    }
    await row.locator("a").first().click();
    await this.deleteButton.click();
    await this.confirmDeleteButton.click();
    await this.searchInput.waitFor({ state: "visible" });
  }
}
