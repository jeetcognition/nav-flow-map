import { test, expect } from "@playwright/test";
import { OrgSelectorPage } from "../../pages";
import { routes } from "../../support/paths";

const SENSITIVE_PATTERNS = [
  /\bpassword\b/i,
  /\botp\b/i,
  /\bcode\s*=\s*/i,
  /\berror\s*=\s*/i,
  /\baccess[_-]?token\b/i,
  /\brefresh[_-]?token\b/i,
  /\bclient[_-]?secret\b/i,
  /internal server error/i,
  /stack trace/i,
];

function containsSensitive(text: string): string | undefined {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) return `matched ${pattern}`;
  }
  return undefined;
}

async function assertNoLeaks(
  page: any,
  consoleLogs: string[],
  pageErrors: string[],
): Promise<void> {
  const url = page.url();
  const body = await page.innerText("body");
  expect(containsSensitive(url)).toBeUndefined();
  expect(containsSensitive(body)).toBeUndefined();
  const leakedInConsole = consoleLogs.find((m) => containsSensitive(m));
  const leakedInPageError = pageErrors.find((m) => containsSensitive(m));
  expect(leakedInConsole).toBeUndefined();
  expect(leakedInPageError).toBeUndefined();
}

test.describe("Landing Search Page", () => {
  test("ORGSEL-SAN01 — Open the organization selector page", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await expect(org.heading).toBeVisible();
    await expect(org.searchInput).toBeVisible();
    await expect(page.getByText(/members?/i).first()).toBeVisible();
  });

  test("ORGSEL-SAN02 — Inspect the left sidebar", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await expect(org.allOrganizationsButton).toBeVisible();
    await expect(org.organizationsLink).toBeVisible();
    await expect(org.settingsLink).toBeVisible();
    await expect(org.helpButton).toBeVisible();
  });

  test("ORGSEL-SAN03 — Inspect organization rows", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    const row = org.orgRow("fri-5");
    await expect(row).toContainText("fri-5");
    await expect(row).toContainText(/members?/i);
    await expect(org.firstOverflowButton).toBeVisible();
  });

  test("ORGSEL-SAN04 — Open an organization row overflow menu", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openFirstOverflowMenu();
    await expect(page.getByText("Pin organization")).toBeVisible();
    await expect(page.getByText("Manage settings")).toBeVisible();
  });

  test("ORGSEL-SAN05 — Open the bottom help menu", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openHelpMenu();
    await expect(page.getByText("Contact support")).toBeVisible();
    await expect(page.getByText("Documentation")).toBeVisible();
    await expect(page.getByText("Contact sales")).toBeVisible();
  });

  test("ORGSEL-SAN06 — Hover the sidebar collapse control", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.hoverSidebarToggle();
    await expect(page.getByText(/Collapse sidebar/)).toBeVisible();
  });

  test("ORGSEL-SAN07 — Collapse the sidebar and hover the expand control", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.toggleSidebar();
    await page.waitForTimeout(300);

    const collapsedWidth = await page
      .locator('[data-testid="sidebar"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(100);

    // The expand tooltip is not exposed as a stable DOM element, so we verify the state instead.
    await page.keyboard.press("Control+b");
    await page.waitForTimeout(300);
    const expandedWidth = await page
      .locator('[data-testid="sidebar"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(expandedWidth).toBeGreaterThan(200);
    await expect(org.heading).toBeVisible();
  });

  test("ORGSEL-SAN08 — Hover the search icon in the sidebar", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.searchButton.hover();
    await expect(page.getByText(/Search/)).toBeVisible();
  });

  test("ORGSEL-SAN09 — Open the global command/search palette", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openCommandPalette();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Actions");
    await expect(dialog).toContainText("Navigation");
    await expect(dialog).toContainText("Settings");
  });

  test("ORGSEL-SAN10 — Open the All organizations dropdown", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openAllOrganizationsMenu();
    await expect(page.getByText("Enterprise settings")).toBeVisible();
    await expect(page.getByText("Invite members")).toBeVisible();
    await expect(page.getByText("Log out", { exact: true })).toBeVisible();
  });

  test("ORGSEL-REG01 — Search for a valid organization", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.searchFor("fri");
    await expect(page.getByText("fri-5")).toBeVisible();
    await expect(page.getByText("kush-fri-12")).toBeVisible();
  });

  test("ORGSEL-REG02 — Search with non-matching text", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.searchFor("zzznotfound");
    await expect(page.getByText("No organizations found")).toBeVisible();
    await expect(page.getByText("Try adjusting your search")).toBeVisible();
    await expect(page.getByText("fri-5")).not.toBeVisible();
  });

  const EDGE_INPUTS = [
    { label: "XSS script", value: "<script>alert(1)</script>" },
    { label: "whitespace", value: "     " },
    { label: "emoji", value: "😀🚀🔥" },
    { label: "long input", value: "a".repeat(200) },
  ];

  for (const { label, value } of EDGE_INPUTS) {
    test(`ORGSEL-REG03 — Search safely with ${label}`, async ({ page }) => {
      const org = new OrgSelectorPage(page);
      await org.goto();
      let dialogSeen = false;
      page.on("dialog", () => {
        dialogSeen = true;
      });

      await org.searchFor(value);
      await page.waitForTimeout(300);
      expect(dialogSeen).toBe(false);
      // Page should still show the heading and search field; no crash.
      await expect(org.heading).toBeVisible();
      await expect(org.searchInput).toBeVisible();
    });
  }

  test("ORGSEL-REG04 — Click an organization row", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    const target = "fri-5";
    await org.orgCard(target).click();
    await page.waitForURL(new RegExp(`/org/${target}`), { timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`/org/${target}`));
  });

  test("ORGSEL-REG06 — Refresh or use browser back/forward", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    const target = "fri-5";
    await org.orgCard(target).click();
    await page.waitForURL(new RegExp(`/org/${target}`), { timeout: 15_000 });

    await page.goBack();
    await expect(org.heading).toBeVisible({ timeout: 15_000 });

    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/org/${target}`));

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/org/${target}`));
  });

  test("ORGSEL-REG07 — No sensitive data leaks while loading, searching, and selecting", async ({
    page,
  }) => {
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => consoleLogs.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/");
    const org = new OrgSelectorPage(page);
    await expect(org.heading).toBeVisible({ timeout: 25_000 });
    await assertNoLeaks(page, consoleLogs, pageErrors);

    await org.searchFor("fri");
    await page.waitForTimeout(300);
    await assertNoLeaks(page, consoleLogs, pageErrors);

    await org.orgCard("fri-5").click();
    await page.waitForURL(new RegExp(`/org/fri-5`), { timeout: 15_000 });
    await assertNoLeaks(page, consoleLogs, pageErrors);
  });

  test("ORGSEL-REG11 — Toggle sidebar collapse and expand using button and shortcut", async ({
    page,
  }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    const expanded = await page
      .locator('[data-testid="sidebar"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(expanded).toBeGreaterThan(200);

    await org.toggleSidebar();
    await page.waitForTimeout(300);
    const collapsed = await page
      .locator('[data-testid="sidebar"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsed).toBeLessThan(100);

    await page.keyboard.press("Control+b");
    await page.waitForTimeout(300);
    const reExpanded = await page
      .locator('[data-testid="sidebar"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(reExpanded).toBeGreaterThan(200);

    await expect(org.heading).toBeVisible();
  });
});
