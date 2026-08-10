import { expect, Page, Locator } from "@playwright/test";
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
  /** Team-enabled MCP entries, each with a Link/Unlink control. */
  readonly mcpEntries: Locator;
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
    this.mcpEntries = page.getByRole("heading", { level: 4 });
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

  /**
   * Whether a provider row currently has no linked account. Personal link state
   * is shared tenant state, so tests read it instead of assuming it.
   */
  async isUnlinked(row: Locator): Promise<boolean> {
    await expect(row).toBeVisible();
    return (await row.getByText("No account linked").count()) > 0;
  }

  /** Link button for an unlinked row ("Unlink user" also contains "Link"). */
  linkButton(row: Locator): Locator {
    return row.getByRole("button", { name: "Link", exact: true });
  }

  /**
   * A provider row always renders exactly one coherent state: an unlinked row
   * offers Link, a linked row names the account and offers Unlink user.
   */
  async expectRowState(row: Locator, provider: string, linkedIdentity: RegExp) {
    await expect(row).toContainText(provider);
    if (await this.isUnlinked(row)) {
      await expect(this.linkButton(row)).toBeVisible();
      await expect(row.getByRole("button", { name: "Unlink user" })).toHaveCount(0);
    } else {
      await expect(row).toContainText(linkedIdentity);
      await expect(row.getByRole("button", { name: "Unlink user" })).toBeVisible();
      await expect(this.linkButton(row)).toHaveCount(0);
    }
  }
}
