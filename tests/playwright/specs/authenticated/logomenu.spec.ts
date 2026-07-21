import { test, expect } from "@playwright/test";
import {
  ALT_SUBORG,
  ALT_SUBORG_NAME,
  ENTERPRISE_NAME,
  ENTERPRISE_SLUG,
  OrgSelectorPage,
  TEST_SUBORG,
  TEST_SUBORG_DISPLAY,
} from "../../pages";

test.describe("Top Left Menu", () => {
  test("SUB-IM-SAN02 — Inspect the organization list and current selection", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();
    await org.openAllOrganizationsMenu();

    const menu = org.topLeftMenu();
    await expect(menu).toBeVisible();

    // Enterprise header with name and member count.
    await expect(menu.getByText(ENTERPRISE_NAME)).toBeVisible();
    await expect(menu.getByText(/\d+\s+members/)).toBeVisible();

    // Primary actions and organization controls.
    await expect(menu.getByRole("button", { name: "Enterprise settings" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Invite members" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Create organization" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Search organizations" })).toBeVisible();

    // Current selection (All organizations) shows a checkmark.
    const allOrganizations = menu.getByRole("menuitem", { name: "All organizations" });
    await expect(allOrganizations).toBeVisible();
    await expect(allOrganizations.locator("svg")).toBeVisible();

    // Organization list contains known organizations.
    await expect(menu.getByRole("menuitem", { name: ALT_SUBORG_NAME }).first()).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: TEST_SUBORG_DISPLAY }).first()).toBeVisible();

    // None of the visible organization-name text is truncated.
    const menuItems = await menu.getByRole("menuitem").all();
    for (const item of menuItems) {
      const textSpan = item.locator("span").first();
      if ((await textSpan.count()) === 0) continue;
      const isTruncated = await textSpan.evaluate(
        (el: HTMLElement) => el.scrollWidth > el.clientWidth + 1,
      );
      expect(isTruncated, "organization name should not be truncated").toBe(false);
    }

    await org.closeTopLeftMenuWithEscape();
    await expect(menu).toBeHidden();
  });

  test("SUB-IM-REG01 — Select another organization from the list", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openAllOrganizationsMenu();
    await org.selectOrgFromMenuBySlug(ALT_SUBORG);
    await expect(page).toHaveURL(new RegExp(`/org/${ALT_SUBORG}`), { timeout: 15_000 });
    await page.getByRole("button", { name: new RegExp(ALT_SUBORG_NAME) }).waitFor();
    await expect(
      page.getByRole("button", { name: new RegExp(ALT_SUBORG_NAME) }).first(),
    ).toBeVisible();

    // Restore the original organization context through the org selector.
    await org.goto();
    await org.openAllOrganizationsMenu();
    await org.selectOrgFromMenuBySlug(TEST_SUBORG);
    await expect(page).toHaveURL(new RegExp(`/org/${TEST_SUBORG}`), { timeout: 15_000 });
    await page.getByRole("button", { name: new RegExp(TEST_SUBORG_DISPLAY) }).waitFor();
    await expect(
      page.getByRole("button", { name: new RegExp(TEST_SUBORG_DISPLAY) }).first(),
    ).toBeVisible();
  });

  test("SUB-IM-REG03 — Click the + control beside Organizations", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openAllOrganizationsMenu();
    await org.clickCreateOrganization();
    await expect(page).toHaveURL(/\/settings\/organizations\/create/, { timeout: 15_000 });

    // Restore default state.
    await org.goto();
    await org.heading.waitFor({ state: "visible" });
    await expect(org.allOrganizationsButton).toBeVisible();
  });

  test("SUB-IM-REG04 — Click Enterprise settings and Invite members in the dropdown", async ({
    page,
  }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openAllOrganizationsMenu();
    await org.clickEnterpriseSettings();
    await expect(page).toHaveURL(new RegExp(`/org/${ENTERPRISE_SLUG}/settings$`), {
      timeout: 15_000,
    });

    // Return to the org selector for the next menu action.
    await org.goto();

    await org.openAllOrganizationsMenu();
    await org.clickInviteMembers();
    await expect(page).toHaveURL(/\/settings\/members(?:hip\?tab=members)?$/, {
      timeout: 15_000,
    });

    // Restore default state.
    await org.goto();
    await org.heading.waitFor({ state: "visible" });
    await expect(org.allOrganizationsButton).toBeVisible();
  });

  test("SUB-IM-REG06 — Click Log out, then use browser Back", async ({ page }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openAllOrganizationsMenu();
    await org.clickLogOut();

    await expect(page).toHaveURL(/\/login|identifier|auth\.beta\.devin\.ai/, { timeout: 20_000 });

    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    // Protected content should not be reachable once logged out.
    await expect(page).toHaveURL(/\/login|identifier|auth\.beta\.devin\.ai/);
  });

  test("SUB-IM-REG07 — Open and close the dropdown using trigger, outside click, and Escape", async ({
    page,
  }) => {
    const org = new OrgSelectorPage(page);
    await org.goto();

    await org.openAllOrganizationsMenu();
    await expect(org.topLeftMenu()).toBeVisible();

    // Close by clicking outside.
    await org.closeTopLeftMenuByClickingOutside();
    await expect(org.topLeftMenu()).toBeHidden();

    // Reopen and close with Escape.
    await org.openAllOrganizationsMenu();
    await expect(org.topLeftMenu()).toBeVisible();
    await org.closeTopLeftMenuWithEscape();
    await expect(org.topLeftMenu()).toBeHidden();
  });
});
