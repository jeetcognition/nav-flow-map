import { test, expect } from "@playwright/test";
import { GroupsIdpPage, routes } from "../../pages";

test.describe("Groups (IdP)", () => {
  test("IDP-SMK01 — Load the Groups tab cold.", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const groups = new GroupsIdpPage(page);
    await groups.goto();
    await expect(groups.heading).toBeVisible();
    await expect(groups.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(groups.activeTab()).toHaveText(/Groups \(IdP\) \d+/);
    await expect(groups.emptyStateHeading).toBeVisible();
    await expect(groups.emptyStateBody).toContainText(
      "Groups can be created by setting up SSO with an IdP provider",
    );
    expect(errors).toHaveLength(0);
  });

  test("IDP-REG01 — Deep-link, refresh, and use Back/Forward on ?tab=groups.", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const groups = new GroupsIdpPage(page);
    await groups.goto();
    await expect(groups.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/\?tab=groups/);

    // Refresh preserves the deep link and active tab.
    await page.reload();
    await expect(groups.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/\?tab=groups/);
    await expect(groups.emptyStateHeading).toBeVisible();

    // Push a Members entry so Back/Forward can exercise the deep-linked Groups entry.
    await page.goto(routes.membershipTab("members"));
    await expect(page).toHaveURL(/\?tab=members/);
    await expect(groups.membersTab).toHaveAttribute("aria-selected", "true");

    await page.goBack();
    await expect(page).toHaveURL(/\?tab=groups/);
    await expect(groups.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(groups.emptyStateHeading).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\?tab=members/);
    await expect(groups.membersTab).toHaveAttribute("aria-selected", "true");

    expect(errors).toHaveLength(0);
  });
});
