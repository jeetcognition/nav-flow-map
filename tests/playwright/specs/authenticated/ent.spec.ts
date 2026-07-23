import { test, expect } from "@playwright/test";
import { EnterpriseSettingsPage, ENTERPRISE_NAME, ALT_SUBORG_NAME } from "../../pages";

test.describe("Enterprise Settings landing", () => {
  test("ENTSET-SAN01 — Open Enterprise Settings", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await expect(page).toHaveURL(/\/org\/[^/]+\/settings$/);
    await expect(
      page.locator("main").getByText("Enterprise preferences and settings"),
    ).toBeVisible();
    await expect(ent.heading).toContainText("Enterprise Settings");
  });

  test("ENTSET-SAN02 — Inspect left sidebar", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await expect(ent.backToApp).toBeVisible();
    await expect(ent.searchInput).toBeVisible();
    await expect(ent.personalLink("Preferences")).toBeVisible();
    await expect(ent.personalLink("Connections")).toBeVisible();
    await expect(ent.personalLink("My Analytics")).toBeVisible();
    await expect(ent.enterpriseNameLink).toBeVisible();
    await expect(ent.enterpriseNavLink("General")).toBeVisible();
    await expect(ent.enterpriseNavLink("Connections")).toBeVisible();
    await expect(ent.enterpriseNavLink("Sessions")).toBeVisible();
    await expect(ent.organizationInSidebar(ALT_SUBORG_NAME)).toBeVisible();
    await expect(ent.helpButton).toBeVisible();
  });

  test("ENTSET-SAN03 — Inspect Enterprise preferences and settings", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await expect(ent.cardLink("General")).toBeVisible();
    await expect(ent.cardLink("Connections")).toBeVisible();
    await expect(ent.cardLink("Sessions")).toBeVisible();
  });

  test("ENTSET-SAN04 — Inspect Products section", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await expect(ent.section("Products")).toBeVisible();
    await expect(ent.cardLink("Devin")).toBeVisible();
    await expect(ent.cardLink("Review")).toBeVisible();
  });

  test("ENTSET-SAN05 — Inspect Resources section", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await expect(ent.section("Resources")).toBeVisible();
    await expect(ent.cardLink("Knowledge")).toBeVisible();
    await expect(ent.cardLink("Environment")).toBeVisible();
    await expect(ent.cardLink("Playbooks")).toBeVisible();
    await expect(ent.cardLink("Skills & Rules")).toBeVisible();
  });

  test("ENTSET-SAN06 — Scroll to and inspect Administration section", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await ent.section("Administration").scrollIntoViewIfNeeded();

    await expect(ent.section("Administration")).toBeVisible();
    await expect(ent.cardLink("Repositories")).toBeVisible();
    await expect(ent.cardLink("Membership")).toBeVisible();
    await expect(ent.cardLink("Organizations")).toBeVisible();
    await expect(ent.cardLink("Devin API")).toBeVisible();
    await expect(ent.cardLink("Guardrails")).toBeVisible();
    await expect(page.locator("main").getByText("Beta").first()).toBeVisible();
    await expect(ent.cardLink("Infrastructure")).toBeVisible();
    await expect(ent.cardLink("Analytics")).toBeVisible();
  });

  test("ENTSET-REG05 — Load more organizations in the sidebar", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    const orgRows = ent.visibleOrgRows();
    const initialCount = await orgRows.count();
    expect(initialCount).toBeGreaterThan(0);

    await ent.loadMore();
    await expect(async () => {
      const newCount = await orgRows.count();
      expect(newCount).toBeGreaterThan(initialCount);
    }).toPass({ timeout: 10_000 });
  });

  test("ENTSET-REG01 — Open each settings card and return", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    // Each [card label, the last segment of its /settings/{segment} path].
    const cards: [string, string][] = [
      ["General", "general"],
      ["Connections", "connections"],
      ["Sessions", "enterprise-sessions"],
      ["Devin", "enterprise-devin"],
      ["Review", "review"],
      ["Knowledge", "knowledge"],
      ["Environment", "enterprise-environment"],
      ["Playbooks", "playbooks"],
      ["Skills & Rules", "enterprise-skills"],
      ["Repositories", "repositories"],
      ["Membership", "membership"],
      ["Organizations", "organizations"],
      ["Devin API", "devin-api"],
      ["Guardrails", "guardrails"],
      ["Infrastructure", "infrastructure"],
      ["Analytics", "analytics"],
    ];

    for (const [name, segment] of cards) {
      await ent.cardLink(name).click();
      await page.waitForURL(new RegExp(`/settings/${segment}$`), { timeout: 20_000 });
      await page.waitForLoadState("networkidle");

      // Not every child page exposes a "Back to enterprise" control, so use
      // the browser back button to return to the enterprise settings landing.
      await page.goBack();
      await page.waitForURL(/\/settings$/, { timeout: 20_000 });
      await page.waitForLoadState("networkidle");

      await expect(ent.heading).toBeVisible();
    }
  });

  test("ENTSET-REG02 — Search settings from the sidebar", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    const orgRows = ent.visibleOrgRows();
    await expect(orgRows).not.toHaveCount(0);

    // Match: keep some visible results.
    await ent.search("General");
    await expect(orgRows).not.toHaveCount(0);

    // No-match query clears the sidebar results while the page stays usable.
    await ent.search("zzz");
    await expect(orgRows).toHaveCount(0);
    await expect(ent.heading).toBeVisible();

    // Long and special-character queries do not crash or change the main page.
    await ent.search("a".repeat(100));
    await expect(orgRows).toHaveCount(0);
    await expect(ent.heading).toBeVisible();

    await ent.search("<script>alert(1)</script>");
    await expect(orgRows).toHaveCount(0);
    await expect(
      page.locator("main").getByText("Enterprise preferences and settings"),
    ).toBeVisible();
  });

  test("ENTSET-REG03 — Click Back to app and return via browser Back", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await ent.clickBackToApp();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/org\/[^/]+(\/org-selector)?$/);

    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect(ent.heading).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("ENTSET-REG04 — Select another organization from the sidebar", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    await ent.selectOrganization(ALT_SUBORG_NAME);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(new RegExp(`/org/${ALT_SUBORG_NAME}/settings$`));
    await expect(
      page.locator("main").getByRole("heading", { name: ALT_SUBORG_NAME, level: 2 }),
    ).toBeVisible();
    await expect(
      page.locator("main").getByText("Organization preferences and settings"),
    ).toBeVisible();

    // Cleanup: return to the enterprise settings landing page.
    await page
      .locator('[data-testid="sidebar"]')
      .getByRole("link", { name: ENTERPRISE_NAME })
      .first()
      .click();
    await page.waitForLoadState("networkidle");
    await expect(ent.heading).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("ENTSET-REG08 — Inspect URL, UI, network, and console while using the page", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    // Use the page: open a child settings card and come back.
    await ent.openCard("General");
    await page.waitForURL(/\/settings\/general$/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await page.goBack();
    await page.waitForURL(/\/settings$/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await expect(ent.heading).toBeVisible();

    // URL contains no credentials, tokens, or private configuration values.
    expect(page.url()).not.toMatch(/(token|secret|api[_-]?key|password|bearer)=/i);

    // Rendered UI exposes no secret material or internal error dumps.
    const secretPatterns = [
      /Bearer\s+[A-Za-z0-9\-_]{16,}/,
      /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, // JWT
      /api[_-]?key["'\s:=]+[A-Za-z0-9\-_]{16,}/i,
      /(Traceback \(most recent call last\)|Internal Server Error|stack trace)/i,
    ];
    const body = await page.locator("body").innerText();
    for (const pattern of secretPatterns) expect(body).not.toMatch(pattern);

    // No internal errors surfaced via console or failed network responses.
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });

  test("ENTSET-REG07 — Refresh and traverse using browser Back/Forward", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.heading.waitFor({ state: "visible" });

    // Refresh preserves the page.
    await page.reload({ waitUntil: "networkidle" });
    await expect(ent.heading).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);

    // Navigate to a child page, go back, then forward again.
    await ent.openCard("General");
    await expect(page).toHaveURL(/\/settings\/general$/);

    await page.goBack();
    await page.waitForLoadState("networkidle");
    await expect(ent.heading).toBeVisible();

    await page.goForward();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings\/general$/);
  });
});
