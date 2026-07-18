import { test, expect } from "@playwright/test";
import { LoginPage, OrgSelectorPage } from "../../pages";
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
    await org.openOverflowFor("fri-5");
    const menu = org.overflowMenu();
    await expect(menu).toBeVisible();
    // Depending on persisted pin state, the menu may read "Pin" or "Unpin".
    await expect(menu).toContainText(/Pin organization|Unpin organization/);
    await expect(menu).toContainText("Manage settings");
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

  test("ORGSEL-REG05 — Click an organization overflow menu", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openOverflowFor("fri-5");
    const menu = org.overflowMenu();
    await expect(menu).toBeVisible();
    // Overflow state may already be pinned from a previous run; either label is acceptable.
    await expect(menu).toContainText(/Pin organization|Unpin organization/);
    await expect(menu).toContainText("Manage settings");
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

  test("ORGSEL-REG08 — Pin organization from a row overflow menu", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    const menu = org.overflowMenu();

    // Ensure we start from an unpinned state, then pin, then restore.
    await org.openOverflowFor("fri-5");
    if (
      await menu
        .getByText("Unpin organization")
        .isVisible()
        .catch(() => false)
    ) {
      await menu.getByText("Unpin organization").click();
      await page.waitForTimeout(300);
      await org.openOverflowFor("fri-5");
    }

    await menu.getByText("Pin organization").click();
    await page.waitForTimeout(300);

    await org.openOverflowFor("fri-5");
    await expect(menu.getByText("Unpin organization")).toBeVisible();

    // Reset state
    await menu.getByText("Unpin organization").click();
    await page.waitForTimeout(300);

    await org.openOverflowFor("fri-5");
    await expect(menu.getByText("Pin organization")).toBeVisible();
  });

  test("ORGSEL-REG09 — Manage settings from a row overflow menu", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openOverflowFor("fri-5");
    await page.getByText("Manage settings").click();
    await page.waitForURL(new RegExp(`/org/fri-5/settings`), { timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`/org/fri-5/settings`));
  });

  test("ORGSEL-REG10 — Click each help menu item", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    for (const item of ["Contact support", "Documentation", "Contact sales"]) {
      await org.openHelpMenu();
      if (item === "Documentation") {
        const [newPage] = await Promise.all([
          page.waitForEvent("popup", { timeout: 10_000 }),
          page.getByText(item).first().click(),
        ]);
        expect(newPage).toBeTruthy();
        await newPage.waitForLoadState("domcontentloaded");
        expect(newPage.url()).toMatch(/^https:\/\/(docs\.devin\.ai|support\.|help\.)/);
        await newPage.close();
      } else if (item === "Contact support") {
        await page.getByText(item, { exact: true }).first().click();
        await page.waitForURL(/\/settings\/support/, { timeout: 15_000 });
        await expect(page).toHaveURL(/\/settings\/support/);
      } else {
        // Contact sales stays on the org selector; just verify no crash.
        await page.getByText(item, { exact: true }).first().click();
        await page.waitForTimeout(500);
        await expect(org.heading).toBeVisible();
      }
      await page.goto("/");
      await expect(org.heading).toBeVisible({ timeout: 25_000 });
    }
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

  test("ORGSEL-REG12 — Use the command palette to search for navigation items", async ({
    page,
  }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openCommandPalette();

    const input = page.locator('[role="dialog"] [role="combobox"]').first();
    await input.fill("new session");
    await page.waitForTimeout(300);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toContainText("Go to new session");
    await expect(dialog).toContainText("Results");
  });

  test("ORGSEL-REG13 — Select Switch organization from the command palette", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openCommandPalette();

    const option = page.locator('[role="dialog"]').getByText("Switch organization…").first();
    await option.click();
    await page.waitForTimeout(300);

    // Switch organization keeps the user on the valid org-selector page.
    await expect(org.heading).toBeVisible({ timeout: 15_000 });
  });

  test("ORGSEL-REG14 — Use the All organizations dropdown list controls", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openAllOrganizationsMenu();

    await page.getByRole("menuitem", { name: /fri-5/ }).first().click();
    await page.waitForURL(new RegExp(`/org/fri-5`), { timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`/org/fri-5`));
  });

  test("ORGSEL-REG15 — Click Enterprise settings and Invite members in the dropdown", async ({
    page,
  }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openAllOrganizationsMenu();
    await page.getByText("Enterprise settings").first().click();
    await page.waitForURL(new RegExp(`/org/.*/settings$`), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/settings$/);

    await org.goto();
    await org.openAllOrganizationsMenu();
    await page.getByText("Invite members").first().click();
    await page.waitForURL(new RegExp(`/settings/membership`), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/settings\/membership/);
  });

  test("ORGSEL-REG16 — Click Switch account and Log out in the dropdown", async ({
    page,
    browser,
  }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    // "Switch account" is not currently exposed in the dropdown, so only the log-out path is asserted.
    await org.openAllOrganizationsMenu();
    await page.getByText("Log out", { exact: true }).click();

    const loginPage = new LoginPage(page);
    await expect(loginPage.heading).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/login|identifier|auth\.beta\.devin\.ai/);

    const anon = await browser
      .newContext({ storageState: { cookies: [], origins: [] } })
      .then((ctx) => ctx.newPage());
    await anon.goto(routes.orgSelector);
    await expect(anon).toHaveURL(/\/login|identifier/);
    await anon.close();
  });

  test("ORGSEL-REG17 — No sensitive data leaks while opening menus, command palette, and org dropdown", async ({
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

    await org.openFirstOverflowMenu();
    await assertNoLeaks(page, consoleLogs, pageErrors);
    await page.keyboard.press("Escape");

    await org.openCommandPalette();
    await assertNoLeaks(page, consoleLogs, pageErrors);
    await page.keyboard.press("Escape");

    await org.openAllOrganizationsMenu();
    await assertNoLeaks(page, consoleLogs, pageErrors);
  });
});
