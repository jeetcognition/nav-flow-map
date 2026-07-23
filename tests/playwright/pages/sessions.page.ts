import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

/** URL glob for the enterprise sessions list API (used for route interception). */
export const SESSIONS_LIST_API = "**/api/enterprise/*/v2sessions*";

/** Page object for the Enterprise Sessions list (`/settings/enterprise-sessions`). */
export class SessionsPage extends BasePage {
  protected readonly path = routes.enterpriseSessions();

  /** Search sessions input. */
  readonly searchInput: Locator;
  /** Session row overlay links (each row has an <a href="/sessions/{id}">). */
  readonly sessionRows: Locator;
  /** Session row containers (parent divs that hold the readable row text). */
  readonly sessionRowContainers: Locator;
  /** Display options filter chip. */
  readonly displayFilter: Locator;
  /** Creator filter chip (lowercase dotted user identifier). */
  readonly creatorFilter: Locator;
  /** Archived status filter chip. */
  readonly archivedFilter: Locator;
  /** Updated-date filter chip. */
  readonly updatedDateFilter: Locator;
  /** Clear all filters button. */
  readonly clearFilters: Locator;
  /** Inactive sessions count text (visible after default/reset load). */
  readonly inactiveSessionsText: Locator;
  /** Empty-list placeholder shown when the list has no rows (empty or errored). */
  readonly noSessionsText: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder("Search sessions...");
    this.sessionRows = page.locator('a[href^="/sessions/"]');
    this.sessionRowContainers = page.locator('[class*="group/row"]');
    this.displayFilter = page.locator('button[data-dd-action-name="Open display options"]');
    this.creatorFilter = page
      .locator('button[data-dd-action-name="Edit filter"]')
      .filter({ hasText: /^[^A-Z ]+$/ });
    this.archivedFilter = page.getByRole("button", { name: "Not Archived" });
    this.updatedDateFilter = page.getByRole("button", { name: /After Jul \d+/ });
    this.clearFilters = page.getByRole("button", { name: "Clear filters" });
    this.inactiveSessionsText = page.getByText(/Inactive sessions/).first();
    this.noSessionsText = page.getByText("No sessions found");
  }

  override async goto() {
    await super.goto();
    await this.page.waitForURL(/\/enterprise-sessions/, { timeout: 20_000 });
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/enterprise-sessions/);
    await expect(this.searchInput).toBeVisible();
    await expect(this.displayFilter).toBeVisible();
    await expect(this.creatorFilter).toBeVisible();
    await expect(this.archivedFilter).toBeVisible();
    await expect(this.updatedDateFilter).toBeVisible();
    await expect(this.clearFilters).toBeVisible();
    await expect(this.sessionRows.first()).toBeVisible({ timeout: 15_000 });
  }

  row(nth = 0): Locator {
    return this.sessionRows.nth(nth);
  }

  rowContainer(nth = 0): Locator {
    return this.sessionRowContainers.nth(nth);
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForLoadState("networkidle").catch(() => {});
    if (term.trim()) {
      await expect(this.page).toHaveURL(/titleSearch=[^&]+/);
    }
    await expect(this.sessionRows.first().or(this.page.getByText("No sessions found"))).toBeVisible(
      { timeout: 15_000 },
    );
  }

  async clearSearch() {
    await this.searchInput.fill("");
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await expect(this.sessionRows.first()).toBeVisible({ timeout: 15_000 });
  }

  /** Open a Base UI filter menu and return the menu/portal locator. */
  async openFilterMenu(filter: Locator) {
    await filter.click();
    const menu = this.page.getByRole("menu").or(this.page.locator("[data-open]"));
    await expect(menu.first()).toBeVisible();
    return menu.first();
  }

  async selectDisplayOption(option: string) {
    const menu = await this.openFilterMenu(this.displayFilter);
    await menu.getByText(option, { exact: true }).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.keyboard.press("Escape");
    await expect(this.sessionRows.first()).toBeVisible({ timeout: 15_000 });
  }

  async clearAllFilters() {
    await this.clearFilters.click();
    await expect(this.sessionRows.first()).toBeVisible({ timeout: 15_000 });
  }

  /** The filter bar (search + chips) must stay usable even when the list itself errors. */
  async expectFilterBarVisible() {
    await expect(this.searchInput).toBeVisible();
    await expect(this.creatorFilter).toBeVisible();
    await expect(this.archivedFilter).toBeVisible();
    await expect(this.updatedDateFilter).toBeVisible();
  }

  async openSession(nth = 0) {
    const link = this.sessionRows.nth(nth);
    const href = await link.getAttribute("href");
    if (!href) throw new Error("Session row has no href");
    await link.click();
    const id = href.replace("/sessions/", "");
    await this.page.waitForURL(new RegExp(`/sessions/${id}`), { timeout: 20_000 });
    return href;
  }
}
