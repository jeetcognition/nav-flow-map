import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { TEST_SUBORG } from "../support/paths";

// Sub-org MCP marketplace (Settings → Connections → MCP servers for an organization).
// Searching collapses the list to the matching cards only, so status badges like
// "Enabled"/"Not installed" are asserted after filtering to a single card.
export class McpMarketplacePage extends BasePage {
  protected readonly path = `/org/${TEST_SUBORG}/settings/connections?tab=mcps`;

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly enabledBadge: Locator;
  readonly notInstalledBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Connections", exact: true });
    this.searchInput = page.locator('input[placeholder*="Search MCP"]').first();
    this.enabledBadge = page.locator("main").getByText("Enabled", { exact: true });
    this.notInstalledBadge = page.locator("main").getByText("Not installed", { exact: true });
  }

  async gotoAndSearch(name: string) {
    await this.goto();
    await this.heading.waitFor({ state: "visible" });
    await expect(this.searchInput).toBeVisible();
    await this.searchInput.fill(name);
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible();
  }

  /** Open the marketplace card for a server (setup page when not installed, configure page when installed). */
  async openCard(name: string) {
    await this.page.getByText(name, { exact: true }).first().click();
    await this.page.waitForURL(/\/settings\/mcp-marketplace\/(setup|configure)\//);
  }

  /** On the setup page: install and enable the server, accepting the security confirmation. */
  async installAndEnable() {
    await this.page.getByRole("button", { name: "Install and enable" }).first().click();
    await this.page.getByText("I understand and want to proceed").click();
    await this.page.getByRole("button", { name: "Install and enable" }).last().click();
    await this.page.waitForURL(/\/settings\/mcp-marketplace\/configure\//);
  }

  /** On the configure page: delete the installed server and confirm. */
  async deleteServer() {
    await this.page.getByRole("button", { name: "Delete MCP server" }).click();
    const dialog = this.page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await this.page.waitForURL(/\/settings\/connections/);
  }
}
