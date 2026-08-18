import { test, expect } from "@playwright/test";
import { LoginPage, OrgSelectorPage } from "../../pages";
import { routes } from "../../support/paths";

/**
 * Logging out revokes the shared admin session server-side, which invalidates
 * .auth/admin.json for anything running afterwards. The file name keeps this spec last in
 * the alphabetically ordered authenticated project so no other test inherits the dead session.
 */
test.describe("Landing Search Page — log out", () => {
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
});
