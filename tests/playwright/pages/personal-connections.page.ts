import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

export class PersonalConnectionsPage extends BasePage {
  protected readonly path = routes.personalConnections;

  /** Main page heading. */
  readonly heading: Locator;
  /** Integrations section heading. */
  readonly integrationsHeading: Locator;
  /** MCP section heading. */
  readonly mcpHeading: Locator;
  /** GitLab provider row. */
  readonly gitlabRow: Locator;
  /** Self-hosted GitLab provider row. */
  readonly selfHostedGitLabRow: Locator;
  /** Slack provider row. */
  readonly slackRow: Locator;
  /** Linear provider row. */
  readonly linearRow: Locator;
  /** GitHub provider row. */
  readonly githubRow: Locator;
  /** "No MCPs" empty state text. */
  readonly noMcpsText: Locator;
  /** "Missing an integration?" button. */
  readonly missingIntegrationButton: Locator;
  /** "Missing an MCP?" button. */
  readonly missingMcpButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Connections" });
    this.integrationsHeading = page.getByRole("heading", { name: "Integrations" });
    this.mcpHeading = page.getByRole("heading", { name: "MCP" });
    this.gitlabRow = page.locator("#personal-gitlab-link");
    this.selfHostedGitLabRow = page
      .getByText("Self-hosted GitLab")
      .first()
      .locator('xpath=ancestor::div[contains(@class,"py-")][1]');
    this.slackRow = page.locator("#personal-slack-link");
    this.linearRow = page.locator("#personal-linear-link");
    this.githubRow = page.locator("#personal-github-link");
    this.noMcpsText = page.getByText("No MCPs");
    this.missingIntegrationButton = page.getByRole("button", { name: "Missing an integration?" });
    this.missingMcpButton = page.getByRole("button", { name: "Missing an MCP?" });
  }

  /** Button that starts the link/unlink flow for a provider row. */
  actionButton(row: Locator): Locator {
    return row.getByRole("button");
  }

  /** Provider account status text inside a row (e.g. "No account linked"). */
  accountStatus(row: Locator): Locator {
    return row.locator("span").last();
  }
}
