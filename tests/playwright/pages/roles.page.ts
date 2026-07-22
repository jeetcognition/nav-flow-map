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
}
