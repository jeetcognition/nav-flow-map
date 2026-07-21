import { test, expect } from "@playwright/test";
import { OrgSelectorPage, SupportPage } from "../../pages";
import { assertNoLeaks } from "../../support/leaks";

test.describe("Support Page", () => {
  test("SUP-SAN01 — Open Support from the sidebar help control and launch the chat", async ({
    page,
  }) => {
    const org = new OrgSelectorPage(page);
    const support = new SupportPage(page);
    await org.goto();
    await support.openViaHelpMenu(org.helpButton);

    await expect(page).toHaveURL(/\/settings\/support/);
    await expect(support.heading).toBeVisible({ timeout: 15_000 });

    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => consoleLogs.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    if (await support.chatLauncher.isVisible().catch(() => false)) {
      await support.chatLauncher.click();
      await page.waitForTimeout(500);
    }

    await assertNoLeaks(page, consoleLogs, pageErrors);
  });

  test("SUP-SAN02 — Documentation card heading is visible", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await expect(support.documentationHeading).toBeVisible({ timeout: 15_000 });
  });

  test("SUP-SAN03 — Documentation description text is visible", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await expect(support.documentationDescription).toBeVisible({ timeout: 15_000 });
  });

  test("SUP-SAN04 — Documentation title is visible after reload", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await page.reload();
    await expect(support.documentationHeading).toBeVisible({ timeout: 15_000 });
  });

  test("SUP-SAN05 — Documentation description is presented to the user", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await expect(support.documentationDescription).toBeVisible({ timeout: 15_000 });
  });

  test("SUP-REG01 — Documentation button is clickable and navigates to docs", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();

    await expect(support.documentationButton).toBeVisible({ timeout: 15_000 });
    await expect(support.documentationButton).toBeEnabled();

    const [newPage] = await Promise.all([
      page.waitForEvent("popup", { timeout: 15_000 }),
      support.documentationButton.click(),
    ]);

    expect(newPage).toBeTruthy();
    await newPage.waitForLoadState("domcontentloaded");
    expect(newPage.url()).toMatch(/^https:\/\/(docs\.devin\.ai|support\.devin\.ai|help\.)/);
    await newPage.close();
  });
});
