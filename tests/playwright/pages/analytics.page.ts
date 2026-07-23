import { Page, Locator, Download, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG_DISPLAY } from "../support/paths";

/** Page object for the Enterprise Analytics page (`/settings/analytics`). */
export class AnalyticsPage extends BasePage {
  protected readonly path = routes.analytics();

  /** Date-range preset button. */
  readonly dateRangeButton: Locator;
  /** Organization filter dropdown (first combobox). */
  readonly orgFilter: Locator;
  /** Chart view dropdown (By size / By origin). */
  readonly viewFilter: Locator;
  /** Time grouping dropdown (Daily / Weekly). */
  readonly groupingFilter: Locator;
  /** Refresh data button. */
  readonly refreshButton: Locator;
  /** Export button. */
  readonly exportButton: Locator;
  /** "Last updated …" data-freshness label. */
  readonly lastUpdated: Locator;

  constructor(page: Page) {
    super(page);
    // Date-range trigger is a menu button; exclude the Current/Previous toggle buttons.
    this.dateRangeButton = page.locator('button[aria-haspopup="menu"]').filter({
      hasText: /This month|This week|Last|This quarter|This billing cycle|Current|Previous/,
    });
    this.orgFilter = page.locator('[role="combobox"]').first();
    this.viewFilter = page.locator('[role="combobox"][aria-label="Select view"]');
    this.groupingFilter = page.locator('[role="combobox"][aria-label="Time grouping"]').first();
    this.refreshButton = page.getByRole("button", { name: "Refresh data" });
    this.exportButton = page.getByRole("button", { name: "Export" });
    this.lastUpdated = page.getByText(/Last updated/);
  }

  override async goto() {
    await super.goto();
    await this.page.waitForURL(/\/settings\/analytics/, { timeout: 20_000 });
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  tab(name: string): Locator {
    return this.page.getByRole("tab", { name, exact: true });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/settings\/analytics/);
    await expect(this.tab("Usage")).toBeVisible();
    await expect(this.tab("Consumption")).toBeVisible();
    await expect(this.tab("Categories")).toBeVisible();
    await expect(this.tab("Overall")).toBeVisible();
    await expect(this.tab("Organizations")).toBeVisible();
    await expect(this.tab("Users")).toBeVisible();
    await expect(this.tab("Repositories")).toBeVisible();
    await expect(this.dateRangeButton).toBeVisible();
    await expect(this.orgFilter).toBeVisible();
    await expect(this.viewFilter).toBeVisible();
    await expect(this.groupingFilter).toBeVisible();
    await expect(this.refreshButton).toBeVisible();
    await expect(this.exportButton).toBeVisible();
    await expect(this.page.locator("svg").first()).toBeVisible({ timeout: 15_000 });
  }

  async switchTab(name: "Usage" | "Consumption" | "Categories") {
    await this.tab(name).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  async switchSubTab(name: "Overall" | "Organizations" | "Users" | "Repositories") {
    await this.tab(name).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  protected menu(): Locator {
    // Base UI renders an outer positioning wrapper and an inner elevated popup.
    // The inner popup has the visible options and `class*="bg-bg-elevated-wax"`.
    return this.page.locator('[data-open][class*="bg-bg-elevated-wax"]');
  }

  async openDateRange() {
    const button = this.page.getByRole("button", {
      name: /This month|This week|Last|This quarter|This billing cycle|Current|Previous/,
    });
    await button.click();
    const menu = this.menu();
    await expect(menu.first()).toBeVisible();
    return menu.first();
  }

  async selectDateRange(option: string) {
    const menu = await this.openDateRange();
    await menu.getByRole("menuitemradio").filter({ hasText: option }).first().click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.keyboard.press("Escape");
    await expect(this.dateRangeButton.first()).toHaveText(
      new RegExp(option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }

  async openOrgFilter() {
    await this.orgFilter.click();
    const menu = this.menu();
    await expect(menu.first()).toBeVisible();
    return menu.first();
  }

  async searchOrgs(term: string) {
    await this.page.getByPlaceholder("Search organizations...").fill(term);
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  async selectOrg(displayName: string) {
    const menu = await this.openOrgFilter();
    await this.searchOrgs(displayName);
    await menu.getByRole("option", { name: displayName, exact: true }).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.keyboard.press("Escape");
    await expect(this.orgFilter).toHaveText(displayName);
  }

  async selectAllOrganizations() {
    const menu = await this.openOrgFilter();
    await this.searchOrgs("");
    await menu.getByRole("option", { name: "All organizations", exact: true }).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.keyboard.press("Escape");
    await expect(this.orgFilter).toHaveText("All organizations");
  }

  async openViewFilter() {
    await this.viewFilter.click();
    const menu = this.menu();
    await expect(menu.first()).toBeVisible();
    return menu.first();
  }

  async selectView(option: "By size" | "By origin") {
    const menu = await this.openViewFilter();
    await menu.getByRole("option", { name: option, exact: true }).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.keyboard.press("Escape");
    await expect(this.viewFilter).toHaveText(option);
  }

  async openGroupingFilter() {
    await this.groupingFilter.click();
    const menu = this.menu();
    await expect(menu.first()).toBeVisible();
    return menu.first();
  }

  async selectGrouping(option: "Daily" | "Weekly") {
    const menu = await this.openGroupingFilter();
    await menu.getByRole("option", { name: option, exact: true }).click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.keyboard.press("Escape");
    await expect(this.groupingFilter).toHaveText(option);
  }

  /** Refresh the data and wait for the freshness label to reset. */
  async refreshData() {
    await this.refreshButton.click();
    await this.page.waitForLoadState("networkidle").catch(() => {});
    // The label wording varies ("less than a minute ago" / "in less than a minute").
    await expect(this.lastUpdated).toHaveText(/Last updated (in )?less than a minute( ago)?/);
  }

  /** Click Export and return the resulting download. */
  async exportData(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.exportButton.click();
    return downloadPromise;
  }

  /** Convenience default org display name used for scoping. */
  get testSuborgDisplay(): string {
    return TEST_SUBORG_DISPLAY;
  }
}
