import { test, expect } from "@playwright/test";
import { SuborgPage, TEST_SUBORG_DISPLAY } from "../../pages";

test.describe("Landing Repo Page", () => {
  test("SUB-SAN01 — Open the Landing Repo Page after selecting jeet-devin-qa", async ({ page }) => {
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

    // The Recent group is a collapse toggle labelled with its session count;
    // list controls sit on the Sessions label row above the groups.
    await expect(suborg.recentSection).toBeVisible();
    await expect(suborg.recentSection).toHaveAttribute("aria-expanded", "true");
    await expect(suborg.recentSessionRows.first()).toBeVisible();
    await expect(suborg.sessionsSearchButton).toBeVisible();
    await expect(suborg.sessionsFilterButton).toBeVisible();
    await expect(suborg.sessionsOverflowButton).toBeVisible();

    await suborg.recentSection.click();
    await expect(suborg.recentSection).toHaveAttribute("aria-expanded", "false");
    await expect(suborg.recentSessionRows).toHaveCount(0);

    await suborg.recentSection.click();
    await expect(suborg.recentSection).toHaveAttribute("aria-expanded", "true");
    await expect(suborg.recentSessionRows.first()).toBeVisible();
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
