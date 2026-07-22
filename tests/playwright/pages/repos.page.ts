import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG, TEST_SUBORG_DISPLAY } from "../support/paths";

export class ReposPage extends BasePage {
  protected readonly path = routes.repositories();

  readonly heading = this.page.getByRole("heading", { name: "Repositories", exact: true });
  readonly description = this.page.getByText(
    /Manage access to repositories for your organizations/,
  );
  readonly orgSelector = this.page.getByRole("combobox").first();
  readonly table = this.page.locator("table").filter({ hasText: "Permissions for" });
  readonly tableRows = this.table.locator("tbody tr");
  readonly searchInput = this.page.locator('input[placeholder="Search permissions..."]').first();
  readonly filterGitProvider = this.page
    .getByRole("combobox")
    .filter({ hasText: /git providers/i });
  readonly filterPermissionTypes = this.page
    .getByRole("combobox")
    .filter({ hasText: /Permission types/i });
  readonly filterAccessType = this.page.getByRole("combobox").filter({ hasText: /Access type/i });
  readonly backToEnterprise = this.page.getByRole("button", { name: "Back to enterprise" });

  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.repositories(slug));
  }

  async selectOrganization(name: string = TEST_SUBORG_DISPLAY) {
    await this.orgSelector.click();
    await this.page.getByRole("option", { name }).click();
    await this.page.waitForURL(/\/settings\/repositories\?org=/);
  }

  permissionRow(name: string): Locator {
    return this.table.locator("tr").filter({ hasText: name });
  }
}
