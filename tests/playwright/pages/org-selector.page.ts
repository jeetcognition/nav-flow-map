import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// The enterprise landing / org-selector page ("Choose an organization to continue").
// This is the post-login landing page.
export class OrgSelectorPage extends BasePage {
  protected readonly path = routes.orgSelector;

  /** Heading text that confirms we're authenticated and on the landing page. */
  readonly heading: Locator;
  /** Breadcrumb button on the enterprise landing (reads "All organizations"). */
  readonly allOrganizationsButton: Locator;
  /** Main organization search field. */
  readonly searchInput: Locator;
  /** First organization row overflow trigger. */
  readonly firstOverflowButton: Locator;
  /** Sidebar collapse/expand trigger. */
  readonly sidebarToggle: Locator;
  /** Sidebar search / command palette trigger. */
  readonly searchButton: Locator;
  /** Bottom-left help trigger. */
  readonly helpButton: Locator;
  /** Organizations nav link in the sidebar. */
  readonly organizationsLink: Locator;
  /** Settings nav link in the sidebar. */
  readonly settingsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText("Choose an organization to continue");
    this.allOrganizationsButton = page.getByRole("button", { name: /All organizations/ }).first();
    this.searchInput = page.locator('input[placeholder*="Search for an organization"]').first();
    this.firstOverflowButton = page.getByRole("button", { name: "More options" }).first();
    this.sidebarToggle = page
      .locator('[data-testid="sidebar"] button[data-slot="sidebar-trigger"]')
      .first();
    this.searchButton = page.getByRole("button", { name: "Search" }).first();
    this.helpButton = page.getByRole("button", { name: "Help" }).first();
    this.organizationsLink = page.getByRole("link", { name: "Organizations" });
    this.settingsLink = page.getByRole("link", { name: "Settings" });
  }

  async goto() {
    await this.page.goto(this.path);
    const onOrgSelector = await this.heading
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (onOrgSelector) return;

    // Fallback: the canonical org-selector deep link 404s in some environments.
    // Start at the SPA root and let the app route to the landing page.
    await this.page.goto("/");
    await this.heading.waitFor({ state: "visible", timeout: 20_000 });
  }

  /** An org/sub-org card on the landing grid, matched by name. */
  orgCard(name: string): Locator {
    return this.page.getByText(new RegExp(name, "i")).first();
  }

  /** The org row element containing the given name and member count. */
  orgRow(name: string): Locator {
    return this.page.getByText(new RegExp(name, "i")).first().locator("..");
  }

  /** The overflow button inside a named org row. */
  overflowFor(name: string): Locator {
    return this.orgRow(name).getByRole("button", { name: "More options" });
  }

  /** The currently open org row overflow menu. */
  overflowMenu(): Locator {
    return this.page.locator('[role="menu"]').filter({ hasText: /Manage settings/ });
  }

  /** Open a named org row's overflow menu. */
  async openOverflowFor(name: string) {
    await this.overflowFor(name).click();
    await this.overflowMenu().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Open the global command palette. */
  async openCommandPalette() {
    await this.searchButton.click();
    await this.page.locator('[role="dialog"]').waitFor({ state: "visible", timeout: 10_000 });
  }

  /** The top-left "All organizations" dropdown menu when open. */
  topLeftMenu(): Locator {
    return this.page
      .locator('[role="menu"]:visible')
      .filter({ hasText: /Enterprise settings/ })
      .first();
  }

  /** Open the All organizations dropdown. */
  async openAllOrganizationsMenu() {
    await this.allOrganizationsButton.click();
    await this.topLeftMenu().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Select an organization from the open top-left menu by its slug. */
  async selectOrgFromMenuBySlug(slug: string) {
    const item = this.topLeftMenu().locator(`a[href="/org/${slug}/"]`).first();
    await item.click();
  }

  /** Click the Create organization (+) control in the open top-left menu. */
  async clickCreateOrganization() {
    await this.topLeftMenu().getByRole("button", { name: "Create organization" }).click();
  }

  /** Click Enterprise settings in the open top-left menu. */
  async clickEnterpriseSettings() {
    await this.topLeftMenu().getByRole("button", { name: "Enterprise settings" }).click();
  }

  /** Click Invite members in the open top-left menu. */
  async clickInviteMembers() {
    await this.topLeftMenu().getByRole("button", { name: "Invite members" }).click();
  }

  /** Click Log out in the open top-left menu (triggers navigation). */
  async clickLogOut() {
    await this.topLeftMenu()
      .getByRole("menuitem", { name: "Log out" })
      .click({ noWaitAfter: true });
  }

  /** Click outside the open top-left menu to close it. */
  async closeTopLeftMenuByClickingOutside() {
    await this.page.locator('[role="presentation"][data-base-ui-inert]').first().click();
    await this.topLeftMenu().waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Close the open top-left menu by pressing Escape. */
  async closeTopLeftMenuWithEscape() {
    await this.page.keyboard.press("Escape");
    await this.topLeftMenu().waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Open the first org row overflow menu. */
  async openFirstOverflowMenu() {
    await this.firstOverflowButton.click();
    await this.overflowMenu().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Open the bottom-left help menu. */
  async openHelpMenu() {
    await this.helpButton.click();
    await this.page.getByText("Contact support").waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Search for an organization by name. */
  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  /** Hover the sidebar collapse/expand trigger. */
  async hoverSidebarToggle() {
    await this.sidebarToggle.hover();
  }

  /** Click the sidebar collapse/expand trigger. */
  async toggleSidebar() {
    await this.sidebarToggle.click();
  }
}
