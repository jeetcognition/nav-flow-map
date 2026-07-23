import { test, expect, type Page } from "@playwright/test";
import {
  ConnectionsPage,
  DevinSessionPage,
  McpMarketplacePage,
  TEST_SUBORG_DISPLAY,
} from "../../pages";

const PROVIDERS = [
  "GitHub",
  "GitLab",
  "Bitbucket",
  "Azure DevOps",
  "Slack",
  "Microsoft Teams",
  "Linear",
  "Jira",
];

test.describe("Connections", () => {
  function trackConsoleErrors(page: import("@playwright/test").Page) {
    const errors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" && !text.includes("Failed to load icon")) errors.push(text);
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("ECON-SMK01 — Load Integrations cold", async ({ page }) => {
    const conn = new ConnectionsPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    await expect(conn.description).toBeVisible();
    await expect(conn.backToEnterprise).toBeVisible();
    await expect(conn.integrationsTab).toBeVisible();
    await expect(conn.mcpServersTab).toBeVisible();
    await expect(conn.integrationsTab).toHaveText(/Integrations\s+8/);
    await expect(conn.mcpServersTab).toHaveText(/MCP servers\s+101/);
    await expect(page.getByRole("heading", { name: "Git providers", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Communication", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Task management", exact: true })).toBeVisible();
    await expect(conn.providerCard("GitHub")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("ECON-SAN01 — Inspect provider cards", async ({ page }) => {
    const conn = new ConnectionsPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    for (const name of PROVIDERS) {
      const card = conn.providerCard(name);
      await expect(card).toBeVisible();
      await expect(card.getByText(/Connected|User not linked|Not connected/)).toBeVisible();
    }
    expect(consoleErrors).toEqual([]);
  });

  test("ECON-SAN02 — Switch to MCP servers tab", async ({ page }) => {
    const conn = new ConnectionsPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    await conn.mcpServersTab.click();
    await expect(page).toHaveURL(/tab=mcps/);
    await expect(conn.mcpSearchInput).toBeVisible();
    await expect(conn.orgFilter).toBeVisible();
    await expect(conn.mcpTable).toBeVisible();
    await expect(conn.mcpTableRows.first()).toBeVisible();
    await expect(conn.mcpServersTab).toHaveText(/MCP servers\s+101/);

    await conn.integrationsTab.click();
    await expect(page).toHaveURL(/\/settings\/connections(\?tab=integrations)?$/);
    await expect(conn.providerCard("GitHub")).toBeVisible();
    await expect(conn.integrationsTab).toHaveText(/Integrations\s+8/);
    expect(consoleErrors).toEqual([]);
  });

  test("ECON-REG02 — Search and filter MCP list", async ({ page }) => {
    const conn = new ConnectionsPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    await conn.mcpServersTab.click();
    await expect(page).toHaveURL(/tab=mcps/);

    await conn.mcpSearchInput.fill("Jam");
    await expect(conn.mcpTableRows.first()).toBeVisible();
    await expect(conn.mcpEmptyState).not.toBeVisible();

    await conn.mcpSearchInput.fill("zzzzzzzz");
    await expect(conn.mcpEmptyState).toBeVisible();

    await conn.mcpSearchInput.fill("   ");
    await expect(conn.mcpTableRows.first()).toBeVisible();

    await conn.mcpSearchInput.fill("😀");
    await expect(conn.mcpEmptyState).toBeVisible();

    await conn.mcpSearchInput.fill("<script>alert(1)</script>");
    await expect(conn.mcpEmptyState).toBeVisible();

    await conn.mcpSearchInput.fill("z".repeat(300));
    await expect(conn.mcpEmptyState).toBeVisible();

    await conn.mcpSearchInput.fill("");
    await expect(conn.mcpTableRows.first()).toBeVisible();
    await expect(conn.mcpServersTab).toHaveText(/MCP servers\s+101/);

    await conn.orgFilter.click();
    await page.getByRole("option", { name: "fri-5", exact: true }).first().click();
    await expect(conn.mcpTableRows.first()).toBeVisible();
    await expect(conn.mcpServersTab).toHaveText(/MCP servers\s+101/);

    await conn.globalSearchInput.fill("zzzz-no-match");
    await expect(conn.integrationsTab).toHaveText(/Integrations\s+8/);
    await expect(conn.mcpServersTab).toHaveText(/MCP servers\s+101/);

    await conn.globalSearchInput.fill("");
    await expect(conn.mcpTableRows.first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  // Decode nested URL-encoding (OAuth continue/redirect params are encoded up to three deep).
  function fullyDecode(url: string): string {
    let current = url;
    for (let i = 0; i < 5; i++) {
      let decoded: string;
      try {
        decoded = decodeURIComponent(current);
      } catch {
        break;
      }
      if (decoded === current) break;
      current = decoded;
    }
    return current;
  }

  interface OAuthProvider {
    card: string;
    hasMenu: boolean;
    requestPattern: RegExp;
    expectedCallback: string;
  }

  // Providers that are not connected in the QA enterprise; starting their
  // Configure/OAuth flow must never be completed so state stays untouched.
  const OAUTH_PROVIDERS: OAuthProvider[] = [
    {
      card: "Bitbucket",
      hasMenu: true,
      requestPattern:
        /bitbucket\.org\/site\/oauth2\/authorize|id\.atlassian\.com\/login\?application=bitbucket/,
      expectedCallback: "https://api.beta.devin.ai/integrations/bitbucket/oauth-callback",
    },
    {
      card: "Azure DevOps",
      hasMenu: true,
      requestPattern: /login\.microsoftonline\.com\/.+\/oauth2\/v2\.0\/authorize/,
      expectedCallback: "https://api.beta.devin.ai/integrations/azure-devops/oauth-callback",
    },
    {
      card: "Jira",
      hasMenu: false,
      requestPattern: /auth\.atlassian\.com\/authorize|id\.atlassian\.com\/login\?continue/,
      expectedCallback: "https://api.beta.devin.ai/integrations/jira/oauth-callback",
    },
  ];

  async function captureOAuthRequest(page: Page, trigger: () => Promise<void>, pattern: RegExp) {
    const [request] = await Promise.all([
      page.waitForRequest((req) => pattern.test(req.url()), { timeout: 20_000 }),
      trigger(),
    ]);
    return request;
  }

  test("ECON-REG01 — Start and cancel each Configure/OAuth flow", async ({ page }) => {
    const conn = new ConnectionsPage(page);

    for (const provider of OAUTH_PROVIDERS) {
      await conn.goto();
      await conn.heading.waitFor({ state: "visible" });
      await expect(conn.providerCard(provider.card)).toContainText("Not connected");

      await conn.providerCard(provider.card).click();
      await expect(conn.connectButton).toBeVisible();

      const request = await captureOAuthRequest(
        page,
        async () => {
          await conn.connectButton.click();
          if (provider.hasMenu) await conn.connectMenuItem.click();
        },
        provider.requestPattern,
      );

      // The correct provider is targeted and callback/state is safe.
      const decoded = fullyDecode(request.url());
      expect(decoded).toContain(provider.expectedCallback);
      expect(decoded).toContain("state=");
      expect(decoded).not.toMatch(/[<>"']/);

      // Leave the provider flow without authorizing; no partial connection remains.
      await conn.goto();
      await conn.heading.waitFor({ state: "visible" });
      await expect(conn.providerCard(provider.card)).toContainText("Not connected");
    }

    // Microsoft Teams authorizes through a same-origin API endpoint instead of a
    // top-level OAuth navigation; assert the request targets Teams and returns here.
    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    await expect(conn.providerCard("Microsoft Teams")).toContainText("Not connected");
    await conn.providerCard("Microsoft Teams").click();
    await expect(conn.connectButton).toBeVisible();

    const teamsRequest = await captureOAuthRequest(
      page,
      () => conn.connectButton.click(),
      /\/api\/microsoft-teams\/[^/]+\/authorize/,
    );
    const returnTo = new URL(teamsRequest.url()).searchParams.get("return_to") ?? "";
    expect(decodeURIComponent(returnTo)).toContain("/settings/connections/microsoftTeams");

    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    await expect(conn.providerCard("Microsoft Teams")).toContainText("Not connected");
  });

  test("ECON-MCP-REG02 — Disable and re-enable a disposable MCP server with reload", async ({
    page,
  }) => {
    const conn = new ConnectionsPage(page);
    // Airtable has no orgs or users enabled in the QA enterprise, so flipping its
    // enterprise availability is side-effect free.
    const serverName = "Airtable";

    await conn.goto();
    await conn.heading.waitFor({ state: "visible" });
    await conn.mcpServersTab.click();
    await conn.openMcpServer(serverName);

    const mcpSwitch = conn.mcpEnabledSwitch;
    await expect(mcpSwitch).toBeVisible();

    try {
      // Pre-state: enabled (repair a previously aborted run if needed).
      if ((await mcpSwitch.getAttribute("aria-checked")) !== "true") {
        await mcpSwitch.click();
      }
      await expect(mcpSwitch).toHaveAttribute("aria-checked", "true");

      // Deny: disable the MCP for the enterprise.
      await mcpSwitch.click();
      await expect(mcpSwitch).toHaveAttribute("aria-checked", "false");

      // The policy persists across a reload.
      await page.reload();
      await expect(mcpSwitch).toBeVisible();
      await expect(mcpSwitch).toHaveAttribute("aria-checked", "false");

      // Restore: re-enable and confirm persistence again.
      await mcpSwitch.click();
      await expect(mcpSwitch).toHaveAttribute("aria-checked", "true");
      await page.reload();
      await expect(mcpSwitch).toBeVisible();
      await expect(mcpSwitch).toHaveAttribute("aria-checked", "true");
    } finally {
      // Safety net: never leave the server disabled.
      if ((await mcpSwitch.getAttribute("aria-checked").catch(() => null)) === "false") {
        await mcpSwitch.click();
        await expect(mcpSwitch).toHaveAttribute("aria-checked", "true");
      }
    }
  });

  test("ECON-E2E01 — Enable a disposable MCP and use it from a new session", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(480_000);

    const conn = new ConnectionsPage(page);
    const market = new McpMarketplacePage(page);
    const session = new DevinSessionPage(page);
    // Context7 needs no credentials, so installing it in the test sub-org is disposable.
    const serverName = "Context7";
    const prompt =
      "Without doing any other work: check whether a Context7 MCP server's tools are " +
      "available to you in this session. If yes, end your reply with the exact line " +
      "'MCP-CONTEXT7-AVAILABLE'. If not, end with 'MCP-CONTEXT7-UNAVAILABLE'.";

    async function deleteIfInstalled() {
      await market.gotoAndSearch(serverName);
      if (await market.enabledBadge.isVisible().catch(() => false)) {
        await market.openCard(serverName);
        await market.deleteServer();
        await market.gotoAndSearch(serverName);
      }
      await expect(market.notInstalledBadge).toBeVisible();
    }

    try {
      // Pre-state: not installed in the sub-org (repair leftovers from aborted runs).
      await deleteIfInstalled();

      // Enable the disposable MCP for the sub-org, accepting the approval dialog.
      await market.openCard(serverName);
      await market.installAndEnable();
      await market.gotoAndSearch(serverName);
      await expect(market.enabledBadge).toBeVisible();

      // Enterprise availability matches: the sub-org now appears on the server detail.
      await conn.goto();
      await conn.heading.waitFor({ state: "visible" });
      await conn.mcpServersTab.click();
      await conn.openMcpServer(serverName);
      await expect(
        page.locator("table tbody tr").filter({ hasText: TEST_SUBORG_DISPLAY }).first(),
      ).toBeVisible();

      // A new session in the sub-org can reach the MCP's tools.
      await session.gotoSession();
      await session.sendPrompt(prompt);
      await session.waitForResponseEnding("MCP-CONTEXT7-AVAILABLE", 300_000);

      // Cleanup removes access: delete the server and verify both views reset.
      await deleteIfInstalled();
      await conn.goto();
      await conn.heading.waitFor({ state: "visible" });
      await conn.mcpServersTab.click();
      await conn.openMcpServer(serverName);
      await expect(page.getByText("No organizations found")).toBeVisible();
    } finally {
      // Safety net: never leave the disposable MCP installed.
      await deleteIfInstalled();
    }
  });
});
