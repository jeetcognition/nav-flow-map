import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG_DISPLAY } from "../support/paths";

export class SuborgPage extends BasePage {
  protected readonly path = routes.subOrg();

  /** Devin logo in the top-left header. */
  readonly logo: Locator;
  /** Top-left organization menu trigger. */
  readonly orgMenuTrigger: Locator;
  /** New session sidebar link. */
  readonly newSessionLink: Locator;
  /** Automations sidebar link. */
  readonly automationsLink: Locator;
  /** Security sidebar link. */
  readonly securityLink: Locator;
  /** Review sidebar link. */
  readonly reviewLink: Locator;
  /** Wiki sidebar link. */
  readonly wikiLink: Locator;
  /** Recent section heading. */
  readonly recentSection: Locator;
  /** Recent section search button. */
  readonly recentSearchButton: Locator;
  /** Recent section overflow menu trigger. */
  readonly recentOverflowButton: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator("#sidebar img").first();
    this.orgMenuTrigger = page
      .getByRole("button", { name: new RegExp(TEST_SUBORG_DISPLAY) })
      .first();
    this.newSessionLink = page.getByRole("link", { name: "New session" });
    this.automationsLink = page.getByRole("link", { name: "Automations" });
    this.securityLink = page.getByRole("link", { name: "Security" });
    this.reviewLink = page.getByRole("link", { name: "Review" });
    this.wikiLink = page.getByRole("link", { name: "Wiki" });
    this.recentSection = page.getByText("Recent").first();
    const recentGroup = page.getByText("Recent").first().locator("..");
    this.recentSearchButton = recentGroup.getByRole("button", { name: "Search" });
    this.recentOverflowButton = recentGroup.getByRole("button", { name: "More" });
  }

  /** The currently open top-left organization menu. */
  orgMenu(): Locator {
    return this.page
      .locator('[role="menu"]:visible')
      .filter({ hasText: /Enterprise settings/ })
      .first();
  }

  /** Open the top-left organization menu. */
  async openOrgMenu() {
    await this.orgMenuTrigger.click();
    await this.orgMenu().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Close the top-left organization menu by pressing Escape. */
  async closeOrgMenuWithEscape() {
    await this.page.keyboard.press("Escape");
    await this.orgMenu().waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Select an organization from the open top-left menu by its visible name. */
  async selectOrgFromMenu(name: string) {
    const row = this.orgMenu().locator('div[role="menuitem"]').filter({ hasText: name }).first();
    await row.locator('a[href^="/org/"]').first().click();
  }

  /** Click the Create organization (+) control in the open menu. */
  async clickCreateOrganization() {
    await this.orgMenu().getByRole("button", { name: "Create organization" }).click();
  }

  /** Click Enterprise settings in the open menu. */
  async clickEnterpriseSettings() {
    await this.orgMenu().getByRole("button", { name: "Enterprise settings" }).click();
  }

  /** Click Invite members in the open menu. */
  async clickInviteMembers() {
    await this.orgMenu().getByRole("button", { name: "Invite members" }).click();
  }

  /** Click Log out in the open menu (triggers navigation). */
  async clickLogOut() {
    // The logout link navigates to the auth login page. Use noWaitAfter so the
    // action promise resolves immediately, then the caller can wait on the URL.
    await this.orgMenu().getByText("Log out", { exact: true }).click({ noWaitAfter: true });
  }
}
