import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class GroupsIdpPage extends BasePage {
  protected readonly path = routes.enterpriseMembership(ENTERPRISE_SLUG, "groups");

  readonly heading: Locator;
  readonly description: Locator;
  readonly learnMore: Locator;
  readonly noGroupsFound: Locator;
  readonly idpSetupMessage: Locator;
  readonly membersTab: Locator;
  readonly rolesTab: Locator;
  readonly groupsTab: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Membership", exact: true, level: 2 });
    this.description = page.getByText(
      "Manage membership, roles, and IdP groups for your enterprise.",
    );
    this.learnMore = page.getByRole("link", { name: "Learn more" });
    this.noGroupsFound = page.getByText("No groups found");
    this.idpSetupMessage = page.getByText(
      "Groups can be created by setting up SSO with an IdP provider.",
    );
    this.membersTab = page.getByRole("tab", { name: /^Members/ });
    this.rolesTab = page.getByRole("tab", { name: /^Roles/ });
    this.groupsTab = page.getByRole("tab", { name: /^Groups \(IdP\)/ });
  }

  async goto() {
    await this.page.goto(this.path);
    await this.page.waitForURL(/\/membership/, { timeout: 20_000 });
  }

  async selectedTabText(): Promise<string> {
    return (await this.page.getByRole("tab", { selected: true }).textContent())?.trim() ?? "";
  }

  async expectGroupsEmptyState() {
    await expect(this.heading).toBeVisible();
    await expect(this.description).toBeVisible();
    await expect(this.learnMore).toBeVisible();
    await expect(this.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(this.noGroupsFound).toBeVisible();
    await expect(this.idpSetupMessage).toBeVisible();
  }
}
