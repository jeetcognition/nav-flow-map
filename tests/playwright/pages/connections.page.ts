import { Page, Locator } from "@playwright/test";
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
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.connections(slug));
  }

  providerCard(name: Provider | string): Locator {
    return this.page.getByRole("link", { name: new RegExp(`^${name}`) }).first();
  }
}
