import { test, expect } from "@playwright/test";
import { GroupsIdpPage, routes } from "../../pages";

test.describe("Membership — Groups (IdP)", () => {
  let groups: GroupsIdpPage;

  test.beforeEach(async ({ page }) => {
    groups = new GroupsIdpPage(page);
    await groups.goto();
  });

  test("IDP-SMK01 — Load the page cold.", async () => {
    await groups.expectGroupsEmptyState();
    await expect(groups.membersTab).toBeVisible();
    await expect(groups.rolesTab).toBeVisible();
    await expect(groups.groupsTab).toBeVisible();
  });

  test("IDP-REG01 — Deep-link, refresh, and use Back/Forward on `?tab=groups`.", async ({
    page,
  }) => {
    await groups.expectGroupsEmptyState();

    await page.reload();
    await page.waitForURL(/\/membership/, { timeout: 20_000 });
    await expect(groups.groupsTab).toHaveAttribute("aria-selected", "true");
    await groups.expectGroupsEmptyState();

    // Push to a sibling settings page, then return via browser history.
    const siblingPage = routes.enterpriseSkills();
    await page.goto(siblingPage);
    await page.waitForURL(/\/enterprise-skills/, { timeout: 20_000 });

    await page.goBack();
    await page.waitForURL(/\?tab=groups/, { timeout: 10_000 });
    await expect(groups.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(groups.noGroupsFound).toBeVisible();

    await page.goForward();
    await page.waitForURL(/\/enterprise-skills/, { timeout: 10_000 });

    // Restore the deep-linked Groups state for the next test run.
    await groups.goto();
  });
});
