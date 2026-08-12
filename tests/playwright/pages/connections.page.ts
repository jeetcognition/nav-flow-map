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

  /**
   * The badge count on the MCP servers tab. The tenant's catalogue grows over
   * time, so tests read it instead of hard-coding a total.
   */
  async mcpServerCount(): Promise<number> {
    const text = (await this.mcpServersTab.textContent()) ?? "";
    const match = text.match(/MCP servers\s+(\d+)/);
    if (!match) throw new Error(`MCP servers tab has no count badge: ${JSON.stringify(text)}`);
    return Number(match[1]);
  }

  providerCard(name: Provider | string): Locator {
    return this.page.getByRole("link", { name: new RegExp(`^${name}`) }).first();
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
