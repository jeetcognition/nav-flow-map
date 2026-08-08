import { test, expect, type Page, type Request, type Locator } from "@playwright/test";
import { PersonalConnectionsPage, routes } from "../../pages";

interface OAuthProvider {
  name: string;
  row: (p: PersonalConnectionsPage) => Locator;
  requestPattern: RegExp;
  expectedCallback: string;
  expectedStatus: string;
}

/**
 * Providers are linked or unlinked per QA account and the state persists
 * between runs, so each row is asserted against whichever half of the
 * link/unlink contract it is currently in.
 */
async function assertProviderRow(row: Locator, label: string) {
  await expect(row).toContainText(label);
  if (await row.getByRole("button", { name: "Unlink user" }).isVisible()) {
    await expect(row).not.toContainText("No account linked");
    await expect(row.getByRole("button", { name: "Link", exact: true })).toHaveCount(0);
    return "linked" as const;
  }
  await expect(row).toContainText("No account linked");
  await expect(row.getByRole("button", { name: "Link", exact: true })).toBeVisible();
  return "unlinked" as const;
}

const oauthProviders: OAuthProvider[] = [
  {
    name: "GitLab",
    row: (p) => p.gitlabRow,
    requestPattern: /gitlab\.com\/oauth\/authorize/,
    expectedCallback:
      "https://api.beta.devinenterprise.com/integrations/gitlab/user-oauth-callback",
    expectedStatus: "No account linked",
  },
  {
    name: "Slack",
    row: (p) => p.slackRow,
    requestPattern: /slack\.com\/oauth/,
    expectedCallback: "https://api.beta.devin.ai/slack-signin-callback",
    expectedStatus: "No account linked",
  },
  {
    name: "Linear",
    row: (p) => p.linearRow,
    requestPattern: /linear\.app\/oauth\/authorize/,
    expectedCallback: "https://api.beta.devin.ai/integrations/linear/oauth-user-callback",
    expectedStatus: "No account linked",
  },
  {
    name: "Self-hosted GitLab",
    row: (p) => p.selfHostedGitLabRow,
    requestPattern: /gitlab\.sbx\.itsdev\.in/,
    expectedCallback:
      "https://cog-enterprise-qa.beta.devinenterprise.com/api/integrations/gitlab/user-oauth-callback",
    expectedStatus: "No account linked",
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
  });

  test("PCON-SAN01 — Inspect linked and unlinked provider rows", async ({ page }) => {
    const p = new PersonalConnectionsPage(page);
    await p.goto();
    await p.heading.waitFor({ state: "visible" });

    await expect(p.integrationsHeading).toBeVisible();

    await assertProviderRow(p.gitlabRow, "GitLab");
    await expect(p.selfHostedGitLabRow).toContainText("gitlab.sbx.itsdev.in");
    await assertProviderRow(p.selfHostedGitLabRow, "Self-hosted GitLab");
    await assertProviderRow(p.slackRow, "Slack");
    await assertProviderRow(p.linearRow, "Linear");
    await assertProviderRow(p.githubRow, "GitHub");

    await expect(p.missingIntegrationButton).toBeVisible();
    await expect(p.missingMcpButton).toBeVisible();
  });

  test("PCON-REG01 — Start OAuth/link flow for each unlinked provider and cancel before authorizing", async ({
    page,
  }) => {
    const p = new PersonalConnectionsPage(page);
    let flowsExercised = 0;

    for (const provider of oauthProviders) {
      await p.goto();
      await p.heading.waitFor({ state: "visible" });

      const row = provider.row(p);
      // Providers already linked on the QA account expose "Unlink user"
      // instead of a link flow; their state is covered by PCON-SAN01.
      if ((await assertProviderRow(row, provider.name)) === "linked") continue;
      const button = row.getByRole("button", { name: "Link", exact: true });
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
      await expect(refreshedRow.getByRole("button", { name: "Link" })).toBeVisible();
      flowsExercised += 1;
    }

    expect(flowsExercised).toBeGreaterThan(0);
  });
});
