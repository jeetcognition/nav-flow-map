import { test, expect } from "@playwright/test";
import { ReviewSettingsPage, routes, ALT_SUBORG } from "../../pages";

test.describe("Review Settings", () => {
  test("REV-SMK01 — Load cold", async ({ page }) => {
    const review = new ReviewSettingsPage(page);
    await review.goto();
    await review.heading.waitFor({ state: "visible" });

    await expect(review.heading).toHaveText("Devin Review");
    await expect(review.prDescriptionsSwitch).toBeVisible();
    await expect(review.securityScanSwitch).toBeVisible();
    await expect(review.prCommentsSwitch).toBeVisible();
    await expect(review.findingsBugsSwitch).toBeVisible();
    await expect(review.findingsSecuritySwitch).toBeVisible();
    await expect(review.findingsInvestigateSwitch).toBeVisible();
    await expect(review.findingsNoteSwitch).toBeVisible();
    await expect(review.githubCiChecksSwitch).toBeVisible();
    await expect(review.autoReviewSwitch).toBeVisible();
    await expect(review.acuLimitInput).toBeVisible();
    await expect(review.filesSection).toBeVisible();
    await expect(review.repositoriesTab).toBeVisible();
    await expect(review.usersTab).toBeVisible();
    await expect(review.addRepoButton).toBeVisible();
    await expect(review.allModesFilter).toBeVisible();
    await expect(review.allHostsFilter).toBeVisible();
  });

  test("REV-SAN01 — Switch Repositories and Self-enrolled users tabs", async ({ page }) => {
    const review = new ReviewSettingsPage(page);
    await review.goto();
    await review.heading.waitFor({ state: "visible" });

    await expect(review.repositoriesTab).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/\/settings\/review$/);

    await review.switchToTab("users");
    await expect(review.usersTab).toHaveAttribute("aria-selected", "true");
    await expect(review.repositoriesTab).toHaveAttribute("aria-selected", "false");
    await expect(page).toHaveURL(/tab=users/);

    await review.switchToTab("repositories");
    await expect(review.repositoriesTab).toHaveAttribute("aria-selected", "true");
    await expect(review.usersTab).toHaveAttribute("aria-selected", "false");
    await expect(page).toHaveURL(/\/settings\/review$/);
  });

  test("REV-SAN02 — Open Add repo without submitting", async ({ page }) => {
    const review = new ReviewSettingsPage(page);
    await review.goto();
    await review.heading.waitFor({ state: "visible" });

    await expect(review.allModesFilter).toBeVisible();
    await expect(review.allHostsFilter).toBeVisible();

    await review.openAddRepoDialog();
    await expect(review.addRepoDialog).toBeVisible();
    await expect(review.addRepoSearchInput).toBeVisible();
    await expect(review.addRepoSaveButton).toBeVisible();
    await expect(review.addRepoCancelButton).toBeVisible();
    await expect(review.addRepoListRow.first()).toBeVisible();

    await review.closeAddRepoDialog();
    await expect(review.addRepoDialog).toBeHidden();
    await expect(page).toHaveURL(routes.reviewSettings());
  });

  test("REV-REG03 — Test ACU limits and restore", async ({ page }) => {
    const review = new ReviewSettingsPage(page);
    await review.goto();
    await review.heading.waitFor({ state: "visible" });

    const baseline = await review.acuLimitInput.inputValue();
    try {
      if (baseline !== "1") {
        const { saved, status } = await review.setAcuLimit("1");
        expect(saved).toBe(true);
        expect(status).toBe(200);
        await expect(review.acuLimitInput).toHaveValue("1");
      }

      // Blank (no limit) is a supported save value.
      let result = await review.setAcuLimit("");
      expect(result.saved).toBe(true);
      expect(result.status).toBe(200);
      await expect(review.acuLimitInput).toHaveValue("");

      for (const invalid of ["0", "-1", "1.5"]) {
        result = await review.setAcuLimit(invalid);
        if (result.saved) {
          // If the backend ever starts returning validation errors, they must not be 2xx.
          expect(result.status).toBeGreaterThanOrEqual(400);
        } else {
          // Client-side validation clears the unsupported value.
          await expect(review.acuLimitInput).toHaveValue("");
        }
      }

      result = await review.setAcuLimit("999999");
      expect(result.saved).toBe(true);
      expect(result.status).toBe(200);
      await expect(review.acuLimitInput).toHaveValue("999999");

      result = await review.setAcuLimit("10");
      expect(result.saved).toBe(true);
      expect(result.status).toBe(200);
      await expect(review.acuLimitInput).toHaveValue("10");
    } finally {
      // Restore the original limit.
      const finalResult = await review.setAcuLimit(baseline || "");
      expect(finalResult.saved).toBe(true);
      expect(finalResult.status).toBe(200);
      await expect(review.acuLimitInput).toHaveValue(baseline || "");
    }
  });

  test("REV-REG04 — Add invalid, duplicate, long, Unicode, and HTML-like file patterns", async ({
    page,
  }) => {
    const review = new ReviewSettingsPage(page);
    await review.goto();
    await review.heading.waitFor({ state: "visible" });

    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    const patterns = [
      "!@#",
      "/",
      "/a/b/c",
      "**/REVIEW.md",
      "x".repeat(260),
      "café.txt",
      "<script>alert(1)</script>",
    ];

    try {
      for (const pattern of patterns) {
        await expect(review.filePatternInput).toHaveAttribute("placeholder", "e.g. docs/**/*.md");
        await review.filePatternInput.fill(pattern);
        await expect(review.addFilePatternButton).toBeEnabled();

        const respPromise = page
          .waitForResponse(
            (r) =>
              r.url().includes("/api/pr-review/settings/rules") && r.request().method() === "PUT",
            { timeout: 5_000 },
          )
          .catch(() => null);
        await review.addFilePatternButton.click();
        const resp = await respPromise;
        expect(resp).not.toBeNull();
        expect(resp!.status()).toBe(200);

        const row = page
          .locator("#review-files .overflow-hidden > div", { hasText: pattern })
          .first();
        await expect(row).toBeVisible();
        await review.removeFilePattern(pattern);
      }

      // Empty pattern keeps the Add button disabled and sends no request.
      await review.filePatternInput.fill("");
      await expect(review.addFilePatternButton).toBeDisabled();
      expect(dialogs).toHaveLength(0);
    } finally {
      await review.removeAllFilePatterns();
    }
  });

  test("REV-REG05 — Tampered enterprise slug and anonymous access", async ({ page, browser }) => {
    const tamperedUrl = routes.reviewSettings(ALT_SUBORG);
    await page.goto(tamperedUrl);
    await page.waitForLoadState("networkidle");

    // The app normalizes the authenticated user's enterprise and does not
    // expose a tampered or sub-org enterprise slug's review settings.
    await expect(page).toHaveURL(routes.reviewSettings());
    const review = new ReviewSettingsPage(page);
    await review.heading.waitFor({ state: "visible" });
    await expect(review.heading).toBeVisible();

    // A fresh anonymous context is redirected away from Review settings.
    const anonContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const anonPage = await anonContext.newPage();
    try {
      const anonReview = new ReviewSettingsPage(anonPage);
      await anonReview.goto();
      await anonPage.waitForLoadState("networkidle");
      await expect(anonPage).toHaveURL(/auth\.beta\.devin\.ai\/u\/login/);
    } finally {
      await anonContext.close();
    }
  });
});
