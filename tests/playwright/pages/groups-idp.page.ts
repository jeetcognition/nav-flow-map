import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class GroupsIdpPage extends BasePage {
  protected readonly path = routes.membershipTab("groups");

  readonly heading = this.page.getByRole("heading", { name: "Membership", exact: true });
  readonly tabList = this.page.locator("[role='tablist']");
  readonly membersTab = this.tabList.getByRole("tab", { name: /Members/ });
  readonly rolesTab = this.tabList.getByRole("tab", { name: /Roles/ });
  readonly groupsTab = this.tabList.getByRole("tab", { name: /Groups \(IdP\)/ });
  readonly emptyStateHeading = this.page.getByText("No groups found", { exact: true });
  readonly emptyStateBody = this.page.getByText(
    "Groups can be created by setting up SSO with an IdP provider.",
  );

  constructor(page: Page) {
    super(page);
  }

  /** Direct navigation to the Groups (IdP) tab. */
  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.membershipTab("groups", slug));
  }

  /** Return the active tab locator. */
  activeTab(): Locator {
    return this.tabList.locator("[aria-selected='true']");
  }
}
