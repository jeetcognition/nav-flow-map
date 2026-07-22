import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { ENTERPRISE_NAME, ENTERPRISE_SLUG, routes } from "../support/paths";

// Enterprise Settings landing page (`/org/{tenant}/settings`).
// Root page for the enterprise-admin settings surface; links to all child settings areas.
export class EnterpriseSettingsPage extends BasePage {
  protected readonly path = routes.entSettings;

  /** Main page heading. */
  readonly heading: Locator;
  /** "Back to app" control in the left sidebar. */
  readonly backToApp: Locator;
  /** Settings search input in the left sidebar. */
  readonly searchInput: Locator;
  /** Left sidebar container (data-testid="sidebar"). */
  readonly sidebar: Locator;
  /** Breadcrumb / nav link for the enterprise name in the sidebar. */
  readonly enterpriseNameLink: Locator;
  /** Help button in the bottom-left sidebar. */
  readonly helpButton: Locator;
  /** "Load more" orgs button in the sidebar, if present. */
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page
      .locator("main")
      .getByRole("heading", { name: "Enterprise Settings", level: 2 });
    this.backToApp = page.locator("a").filter({ hasText: "Back to app" }).first();
    this.searchInput = page.getByPlaceholder("Search settings...");
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.enterpriseNameLink = this.sidebar.getByRole("link", { name: ENTERPRISE_NAME }).first();
    this.helpButton = this.sidebar.getByRole("button", { name: "Help" }).first();
    this.loadMoreButton = this.sidebar.getByRole("button", { name: "Load more" }).first();
  }

  /** Personal nav link in the sidebar (Preferences / Connections / My Analytics). */
  personalLink(name: string): Locator {
    return this.sidebar.getByRole("link", { name }).first();
  }

  /** Enterprise settings nav link in the sidebar (General, Connections, Sessions, ...). */
  enterpriseNavLink(name: string): Locator {
    return this.sidebar.getByRole("link", { name: new RegExp(`^${name}$`, "i") }).first();
  }

  /** An organization row in the sidebar org list. */
  organizationInSidebar(name: string): Locator {
    return this.sidebar.getByRole("link", { name }).first();
  }

  /** A section heading inside the main panel. */
  section(title: string): Locator {
    return this.page.locator("main").getByRole("heading", { name: title, level: 3 });
  }

  /** A settings card link inside the main panel by heading. */
  cardLink(name: string): Locator {
    return this.page
      .locator("main")
      .getByRole("link", { name: new RegExp(name, "i") })
      .first();
  }

  /** Visible sub-organization rows in the left sidebar. */
  visibleOrgRows(): Locator {
    return this.sidebar.locator(`a[href^="/org/"]:not([href*="/org/${ENTERPRISE_SLUG}"]):visible`);
  }

  /** All visible card link names in the main panel. */
  async visibleCardNames(): Promise<string[]> {
    const links = await this.page.locator("main").getByRole("link").all();
    const names: string[] = [];
    for (const link of links) {
      const txt = await link.textContent().catch(() => "");
      const trimmed = txt?.trim();
      if (trimmed) names.push(trimmed);
    }
    return [...new Set(names)];
  }

  async goto() {
    await super.goto();
    await this.heading.waitFor({ state: "visible", timeout: 20_000 });
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 10_000 });
    } catch {
      // Network may already be idle; continue.
    }
  }

  /** Click the "Back to app" button and wait for navigation. */
  async clickBackToApp() {
    await this.backToApp.click();
  }

  /** Search settings from the sidebar search field. */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
  }

  /** Open a named settings card from the main panel. */
  async openCard(name: string) {
    await this.cardLink(name).click();
  }

  /** Click an organization in the sidebar org list. */
  async selectOrganization(name: string) {
    await this.organizationInSidebar(name).click();
  }

  /** Click the sidebar "Load more" button, if visible. */
  async loadMore() {
    await this.loadMoreButton.click();
  }
}
