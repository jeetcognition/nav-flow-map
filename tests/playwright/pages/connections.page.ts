import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

type Provider =
  | "GitHub"
  | "GitLab"
  | "Bitbucket"
  | "Azure DevOps"
  | "Slack"
  | "Microsoft Teams"
  | "Linear"
  | "Jira";

export class ConnectionsPage extends BasePage {
  protected readonly path = routes.connections();

  readonly heading: Locator;
  readonly description: Locator;
  readonly backToEnterprise: Locator;
  readonly integrationsTab: Locator;
  readonly mcpServersTab: Locator;
  readonly globalSearchInput: Locator;
  readonly mcpSearchInput: Locator;
  readonly orgFilter: Locator;
  readonly mcpTable: Locator;
  readonly mcpTableRows: Locator;
  readonly mcpEmptyState: Locator;
  readonly mcpEnabledSwitch: Locator;
  readonly connectButton: Locator;
  readonly connectMenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Connections", exact: true });
    this.description = page.getByText(
      "Connect external services and tools to your organization in Devin.",
    );
    this.backToEnterprise = page.getByRole("button", { name: "Back to enterprise" });
    this.integrationsTab = page.getByRole("tab", { name: /Integrations/ });
    this.mcpServersTab = page.getByRole("tab", { name: /MCP servers/ });
    this.globalSearchInput = page.locator('input[placeholder="Search settings..."]').first();
    this.mcpSearchInput = page.locator('input[placeholder="Search by MCP name"]').first();
    this.orgFilter = page.locator('[role="combobox"]').first();
    this.mcpTable = page.locator("table").first();
    this.mcpTableRows = this.mcpTable.locator("tbody tr");
    this.mcpEmptyState = page.getByText("No MCPs found");
    this.mcpEnabledSwitch = page.getByRole("switch");
    this.connectButton = page.getByRole("button", { name: "Connect", exact: true });
    this.connectMenuItem = page.getByRole("menuitem", { name: "Connect", exact: true });
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.connections(slug));
  }

  providerCard(name: Provider | string): Locator {
    return this.page.getByRole("link", { name: new RegExp(`^${name}`) }).first();
  }

  /** Number badge shown on the MCP servers tab (total servers in the catalog). */
  async mcpServerCount(): Promise<number> {
    // The badge is rendered only once the catalog request resolves, so poll for it.
    await expect(this.mcpServersTab).toHaveText(/MCP servers\s+\d+/, { timeout: 30_000 });
    const label = await this.mcpServersTab.textContent();
    const match = /MCP servers\s+(\d+)/.exec(label ?? "");
    expect(match, `MCP servers tab has no count badge: ${label}`).not.toBeNull();
    return Number(match![1]);
  }

  /**
   * Name of the first MCP server no organization has enabled. Flipping such a server's
   * enterprise availability is side-effect free: hiding a server with existing
   * installations prompts a confirmation and affects those organizations.
   */
  async unusedMcpServerName(): Promise<string> {
    await expect(
      this.mcpTable.getByRole("columnheader", { name: "Organizations enabled" }),
    ).toBeVisible();
    await expect(this.mcpTableRows.first().getByRole("cell").first()).not.toBeEmpty();
    for (const row of await this.mcpTableRows.all()) {
      const cells = (await row.getByRole("cell").allTextContents()).map((c) => c.trim());
      const counts = cells.slice(1).filter((c) => /^\d+$/.test(c));
      if (counts.length < 3 || counts.some((c) => c !== "0")) continue;
      const name = (await row.getByRole("link").first().textContent())?.trim();
      if (name) return name;
    }
    throw new Error("Every MCP server is enabled by at least one organization");
  }

  /** From the MCP servers tab, search for a server and open its enterprise detail page. */
  async openMcpServer(name: string) {
    await this.mcpSearchInput.fill(name);
    await this.mcpTableRows.filter({ hasText: name }).first().click();
    await this.page.waitForURL(/\/settings\/connections\/mcp\//);
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible();
    await expect(
      this.page.getByText("Usage and availability of this MCP across your enterprise."),
    ).toBeVisible();
  }
}
