import { test, expect, type Page, type Request, type Locator } from "@playwright/test";
import { PersonalConnectionsPage, routes } from "../../pages";

interface OAuthProvider {
  name: string;
  row: (p: PersonalConnectionsPage) => Locator;
  requestPattern: RegExp;
  expectedCallback: string;
  expectedStatus: string;
  /** Identity rendered when the QA user's account is linked for this provider. */
  linkedIdentity: RegExp;
}

// Personal link state is shared tenant state that changes outside this suite,
// so the tests read each row's current state instead of assuming it.
const providers: OAuthProvider[] = [
  {
    name: "GitLab",
    row: (p) => p.gitlabRow,
    requestPattern: /gitlab\.com\/oauth\/authorize/,
    expectedCallback:
      "https://api.beta.devinenterprise.com/integrations/gitlab/user-oauth-callback",
    expectedStatus: "No account linked",
    linkedIdentity: /jeet-qa/,
  },
  {
    name: "Slack",
    row: (p) => p.slackRow,
    requestPattern: /slack\.com\/oauth/,
    expectedCallback: "https://api.beta.devin.ai/slack-signin-callback",
    expectedStatus: "No account linked",
    linkedIdentity: /\S+@\S+/,
  },
  {
    name: "Linear",
    row: (p) => p.linearRow,
    requestPattern: /linear\.app\/oauth\/authorize/,
    expectedCallback: "https://api.beta.devin.ai/integrations/linear/oauth-user-callback",
    expectedStatus: "No account linked",
    linkedIdentity: /\S+@\S+/,
  },
  {
    name: "Self-hosted GitLab",
    row: (p) => p.selfHostedGitLabRow,
    requestPattern: /gitlab\.sbx\.itsdev\.in/,
    expectedCallback:
      "https://cog-enterprise-qa.beta.devinenterprise.com/api/integrations/gitlab/user-oauth-callback",
    expectedStatus: "No account linked",
    linkedIdentity: /\S+/,
  },
];

async function captureOAuthRequest(
  page: Page,
  trigger: () => Promise<void>,
  pattern: RegExp,
): Promise<Request> {
  const [request] = await Promise.all([
    page.waitForRequest((req) => pattern.test(req.url()), { timeout: 15000 }),
    trigger(),
  ]);
  return request;
}

test.describe("Personal Connections", () => {
  test("PCON-SMK01 — Load cold", async ({ page }) => {
    const p = new PersonalConnectionsPage(page);
    await p.goto();
    await p.heading.waitFor({ state: "visible" });

    await expect(page).toHaveURL(routes.personalConnections);
    await expect(p.integrationsHeading).toBeVisible();
    await expect(p.mcpHeading).toBeVisible();
    await expect(p.gitlabRow).toBeVisible();
    await expect(p.selfHostedGitLabRow).toBeVisible();
    await expect(p.slackRow).toBeVisible();
    await expect(p.linearRow).toBeVisible();
    await expect(p.githubRow).toBeVisible();
    // The MCP section lists team-enabled MCPs, or its empty state when the
    // user's organizations enable none.
    await expect(p.noMcpsText.or(p.mcpEntries.first())).toBeVisible();
  });

  test("PCON-SAN01 — Inspect linked and unlinked provider rows", async ({ page }) => {
    const p = new PersonalConnectionsPage(page);
    await p.goto();
    await p.heading.waitFor({ state: "visible" });

    await expect(p.integrationsHeading).toBeVisible();

    for (const provider of providers) {
      await p.expectRowState(provider.row(p), provider.name, provider.linkedIdentity);
    }
    await expect(p.selfHostedGitLabRow).toContainText("gitlab.sbx.itsdev.in");
    await p.expectRowState(p.githubRow, "GitHub", /jeet-qa/);

    await expect(p.missingIntegrationButton).toBeVisible();
    await expect(p.missingMcpButton).toBeVisible();
    await expect(p.noMcpsText.or(p.mcpEntries.first())).toBeVisible();
  });

  test("PCON-REG01 — Start OAuth/link flow for each unlinked provider and cancel before authorizing", async ({
    page,
  }) => {
    const p = new PersonalConnectionsPage(page);
    await p.goto();
    await p.heading.waitFor({ state: "visible" });

    // Only providers without a linked account expose the link/OAuth flow.
    const unlinked: OAuthProvider[] = [];
    for (const provider of providers) {
      if (await p.isUnlinked(provider.row(p))) unlinked.push(provider);
    }
    expect(unlinked.length, "at least one provider is available to link").toBeGreaterThan(0);

    for (const provider of unlinked) {
      await p.goto();
      await p.heading.waitFor({ state: "visible" });

      const row = provider.row(p);
      const button = p.linkButton(row);
      await expect(button).toBeVisible();

      const request = await captureOAuthRequest(
        page,
        () => button.click(),
        provider.requestPattern,
      );
      const url = new URL(request.url());

      // The authorization request must identify the provider app and include a non-empty state.
      expect(url.searchParams.has("client_id")).toBe(true);
      expect(url.searchParams.has("state")).toBe(true);
      expect(url.searchParams.get("state")!.length).toBeGreaterThan(0);

      // Reject open redirects: the callback must be a known Devin endpoint.
      const redirectUri = decodeURIComponent(url.searchParams.get("redirect_uri") || "");
      expect(redirectUri).toBe(provider.expectedCallback);
      expect(redirectUri).toMatch(/^https:\/\//);
      expect(redirectUri).not.toMatch(/[<>\"']/);

      // Leave the provider flow without completing authorization.
      await page.goto(routes.personalConnections);
      await page.waitForURL(routes.personalConnections);
      await p.heading.waitFor({ state: "visible" });

      // The account must remain unlinked so the next iteration/cycle is deterministic.
      const refreshedRow = provider.row(p);
      await expect(refreshedRow).toContainText(provider.expectedStatus);
      await expect(p.linkButton(refreshedRow)).toBeVisible();
    }
  });
});
