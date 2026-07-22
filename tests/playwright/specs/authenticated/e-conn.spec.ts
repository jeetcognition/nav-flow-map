import { test, expect } from "@playwright/test";
import { ConnectionsPage } from "../../pages";

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
});
