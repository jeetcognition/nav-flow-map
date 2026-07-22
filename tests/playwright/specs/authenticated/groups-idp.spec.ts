import { test, expect } from "@playwright/test";
import { GroupsIdpPage, routes, ENTERPRISE_SLUG, ALT_SUBORG } from "../../pages";

test.describe("Groups (IdP)", () => {
  test("IDP-SMK01 — Load cold", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    const idp = new GroupsIdpPage(page);
    await idp.goto();

    await expect(page).toHaveURL(routes.membership(ENTERPRISE_SLUG, "groups"));
    await expect(idp.heading).toBeVisible();
    await expect(idp.groupsTab).toBeVisible();
    await expect(idp.groupsTab).toHaveAttribute("aria-selected", "true");
    await expect(idp.noGroupsHeading).toBeVisible();
    await expect(idp.idpSetupGuidance).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test("IDP-REG02 — Open Groups with a tampered enterprise context", async ({ page }) => {
    // A valid sub-org slug should normalize to the canonical enterprise URL.
    await page.goto(routes.membership(ALT_SUBORG, "groups"));
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`/org/${ENTERPRISE_SLUG}/settings/membership($|\\?)`));
    await expect(page.getByRole("heading", { name: "Membership", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Groups \(IdP\)/ })).toBeVisible();

    // Opening Groups from the normalized enterprise page still shows the empty state.
    await page.getByRole("tab", { name: /Groups \(IdP\)/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "No groups found", exact: true })).toBeVisible();

    // An invalid enterprise slug should surface the 404 page.
    await page.goto(routes.membership("not-a-valid-slug-12345", "groups"));
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
    await expect(page.getByText("This page could not be found.")).toBeVisible();
  });
});
