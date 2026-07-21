import { test, expect } from "@playwright/test";
import { SuborgPage, TEST_SUBORG_DISPLAY } from "../../pages";

test.describe("Landing Repo Page", () => {
  test("SUB-SAN01 — Open the Landing Repo Page after selecting jeet-test-org", async ({ page }) => {
    const suborg = new SuborgPage(page);
    await suborg.goto();
    await suborg.newSessionLink.waitFor({ state: "visible" });

    await expect(suborg.logo).toBeVisible();
    await expect(suborg.orgMenuTrigger).toContainText(TEST_SUBORG_DISPLAY);
    await expect(suborg.orgMenuTrigger).toBeVisible();
  });

  test("SUB-SAN02 — Inspect the Recent section", async ({ page }) => {
    const suborg = new SuborgPage(page);
    await suborg.goto();
    await suborg.newSessionLink.waitFor({ state: "visible" });

    await expect(suborg.recentSection).toBeVisible();
    await expect(suborg.recentSearchButton).toBeVisible();
    await expect(suborg.recentOverflowButton).toBeVisible();
  });

  test("SUB-SAN03 — Inspect the left sidebar navigation", async ({ page }) => {
    const suborg = new SuborgPage(page);
    await suborg.goto();
    await suborg.newSessionLink.waitFor({ state: "visible" });

    await expect(suborg.newSessionLink).toBeVisible();
    await expect(suborg.automationsLink).toBeVisible();
    await expect(suborg.securityLink).toBeVisible();
    await expect(suborg.reviewLink).toBeVisible();
    await expect(suborg.wikiLink).toBeVisible();
  });
});
