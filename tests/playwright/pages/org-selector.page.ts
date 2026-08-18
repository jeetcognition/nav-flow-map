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
  /** The application sidebar container. */
  readonly sidebar: Locator;
  /** The global command/search palette dialog. */
  readonly commandPalette: Locator;
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
    // Scoped to the real <button>: the row wrapper is itself role="button" and its accessible
    // name includes the overflow control, so a role query would resolve the whole row and
    // clicking it would open the organization instead of its menu.
    this.firstOverflowButton = page.locator('button[aria-label="More options"]').first();
    this.sidebarToggle = page
      .locator('[data-testid="sidebar"] button[data-slot="sidebar-trigger"]')
      .first();
    this.sidebar = page.getByTestId("sidebar");
    this.commandPalette = page.locator('[role="dialog"]');
    this.searchButton = page.getByRole("button", { name: "Search" }).first();
    this.helpButton = page.getByRole("button", { name: "Help" }).first();
    this.organizationsLink = page.getByRole("link", { name: "Organizations" });
    this.settingsLink = page.getByRole("link", { name: "Settings" });
  }

  async goto() {
    if (await this.landOnOrgSelector()) return;
    // The app occasionally restores the last visited organization right after hydration and
    // navigates away from the selector; a second attempt lands on it.
    if (await this.landOnOrgSelector()) return;
    throw new Error(`could not settle on the organization selector, now at ${this.page.url()}`);
  }

  /** Navigate to the selector and report whether the page stayed there. */
  private async landOnOrgSelector(): Promise<boolean> {
    await this.navigate(this.path);
    let visible = await this.heading
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!visible) {
      // Fallback: the canonical org-selector deep link 404s in some environments.
      // Start at the SPA root and let the app route to the landing page.
      await this.navigate("/");
      visible = await this.heading
        .waitFor({ state: "visible", timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
    }
    if (!visible) return false;

    // Give the app a moment to run any post-hydration redirect before trusting the page.
    await this.page.waitForTimeout(1_500);
    return this.heading.isVisible();
  }

  /**
   * Navigate tolerating aborted requests: the app fires its own client-side navigation on some
   * routes, which cancels a pending "load" navigation and surfaces as net::ERR_ABORTED.
   */
  private async navigate(url: string) {
    try {
      await this.page.goto(url, { waitUntil: "domcontentloaded" });
    } catch (error) {
      if (!/ERR_ABORTED/.test(String(error))) throw error;
      await this.page.goto(url, { waitUntil: "domcontentloaded" });
    }
  }

  /** An org/sub-org card on the landing grid, matched by name. */
  orgCard(name: string): Locator {
    return this.page.getByText(new RegExp(name, "i")).first();
  }

  /** The org row element containing the given name and member count. */
  orgRow(name: string): Locator {
    return this.page.getByText(new RegExp(name, "i")).first().locator("..");
  }

  /**
   * Bring a named org row into view. The enterprise lists dozens of organizations and the
   * landing grid renders only the first page, so a row is located by searching for it first.
   */
  async revealOrg(name: string): Promise<Locator> {
    await this.searchFor(name);
    const row = this.orgRow(name);
    await row.waitFor({ state: "visible", timeout: 15_000 });
    return row;
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
    await this.commandPalette.waitFor({ state: "visible", timeout: 10_000 });
  }

  /**
   * Open the palette's "Go to…" page. The palette root lists actions only; navigation
   * targets (New session, All sessions, Switch organization…) live one level in.
   */
  async openPaletteGoTo() {
    await this.commandPalette.getByText("Go to…", { exact: true }).first().click();
    await this.commandPalette
      .getByText("Switch organization…")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Current rendered width of the sidebar, in pixels. */
  async sidebarWidth(): Promise<number> {
    return this.sidebar.evaluate((el) => el.getBoundingClientRect().width);
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

  /** Organization rows in the open top-left menu are radio items, one per organization. */
  menuOrgItem(name: string): Locator {
    return this.topLeftMenu().getByRole("menuitemradio", { name, exact: true });
  }

  /**
   * Filter the open top-left menu's organization list. The menu renders only the first
   * page of organizations, so anything further down is reachable only through its search.
   */
  async searchOrgsInMenu(query: string) {
    const menu = this.topLeftMenu();
    const input = menu.locator('input[placeholder="Search organizations..."]');
    if ((await input.count()) === 0) {
      await menu.getByRole("button", { name: "Search organizations" }).click();
    }
    await input.first().fill(query);
  }

  /** Select an organization from the open top-left menu by its slug. */
  async selectOrgFromMenuBySlug(slug: string) {
    const menu = this.topLeftMenu();
    const item = menu.locator(`a[href="/org/${slug}/"]`).first();
    if ((await item.count()) === 0) {
      await this.searchOrgsInMenu(slug);
    }
    await item.scrollIntoViewIfNeeded();
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
