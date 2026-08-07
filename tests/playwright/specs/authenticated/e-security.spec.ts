import { test, expect } from "@playwright/test";
import { routes, ENTERPRISE_SLUG } from "../../support/paths";

// The enterprise skill catalog describes a Security settings page at
// /org/{enterprise}/settings/security, but the product does not currently ship
// one: the route renders the in-app 404 panel and the settings hub lists no
// Security entry. This spec pins that state so a future product change (the
// page appearing, or the route starting to error differently) is caught.
test.describe("Enterprise Security settings (product drift)", () => {
  test("ESECU-REG01 — The security route renders the in-app 404 and no hub entry exists", async ({
    page,
  }) => {
    await page.goto(`/org/${ENTERPRISE_SLUG}/settings/security`);
    await expect(page.getByText("404", { exact: true })).toBeVisible();
    await expect(page.getByText("This page could not be found.")).toBeVisible();

    await page.goto(routes.entSettings);
    const hub = page.getByRole("heading", { name: "Enterprise Settings", level: 2 });
    await expect(hub).toBeVisible();
    await expect(page.locator("main").getByText("Security", { exact: true })).toHaveCount(0);
  });
});
