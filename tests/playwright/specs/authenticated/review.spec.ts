import { test, expect } from "@playwright/test";
import { ReviewPage, SuborgPage, routes } from "../../pages";

// A merged PR in a repo this Devin organization can read; override to point the
// suite at a different environment. Viewing a PR is read-only, so no cleanup is
// needed and the tests are idempotent.
const REVIEW_PR_URL =
  process.env.REVIEW_PR_URL ?? "https://github.com/jeetcognition/nav-flow-map/pull/102";
const [, PR_OWNER, PR_REPO, PR_NUMBER] =
  REVIEW_PR_URL.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/) ?? [];

test.describe("Review", () => {
  test("REVUI-SMK01 — Load", async ({ page }) => {
    const review = new ReviewPage(page);
    await review.goto();

    await expect(page).toHaveURL(/\/review$/);
    await expect(review.reviewAnyPrLabel).toBeVisible();
    await expect(review.prUrlInput).toBeVisible();
    // Both submit affordances stay disabled until a PR URL is entered.
    await expect(review.submitPrUrlButton).toBeDisabled();
    await expect(review.jumpToPrInput).toBeVisible();
    await expect(review.goToPrButton).toBeDisabled();
  });

  test("SUB-RV-SMK01 — Load via sidebar → Review", async ({ page }) => {
    const suborg = new SuborgPage(page);
    await suborg.goto();
    await suborg.reviewLink.click();
    await expect(page).toHaveURL(/\/review$/);

    // First visit shows the intro dialog (BL-043); dismiss it to reach the landing.
    const review = new ReviewPage(page);
    await expect(review.introDialog).toBeVisible();
    await review.dismissIntroDialog();
    await expect(review.introDialog).toBeHidden();

    await expect(review.reviewAnyPrLabel).toBeVisible();
    await expect(review.prUrlInput).toBeVisible();
  });

  test("REVUI-REG01 — Paste a valid PR URL and click 'Go to pull request'", async ({ page }) => {
    const review = new ReviewPage(page);
    await review.goto();

    // BUG-017 (button never enabled) is fixed: the button enables on a valid
    // URL and submits.
    await expect(review.goToPrButton).toBeDisabled();
    await review.jumpToPrInput.fill(REVIEW_PR_URL);
    await expect(review.goToPrButton).toBeEnabled();
    await review.goToPrButton.click();

    await expect(page).toHaveURL(routes.reviewPr(PR_OWNER, PR_REPO, PR_NUMBER));
    await expect(review.prTitleHeading.first()).toBeVisible();
    await expect(review.descriptionTab).toBeVisible();
    await expect(review.discussionTab).toBeVisible();
    await expect(review.commitsTab).toBeVisible();
  });

  test("SUB-RV-REG01 — Submit a valid PR URL, then a missing PR renders gracefully", async ({
    page,
  }) => {
    const review = new ReviewPage(page);
    await review.goto();

    // The landing submit button also enables on a valid URL (BUG-017 fixed);
    // Enter submits from the input.
    await expect(review.submitPrUrlButton).toBeDisabled();
    await review.prUrlInput.fill(REVIEW_PR_URL);
    await expect(review.submitPrUrlButton).toBeEnabled();
    await review.prUrlInput.press("Enter");

    await expect(page).toHaveURL(routes.reviewPr(PR_OWNER, PR_REPO, PR_NUMBER));
    await expect(review.prTitleHeading.first()).toBeVisible();

    // A PR number that does not exist renders a graceful "Not Found" state.
    await page.goto(routes.reviewPr(PR_OWNER, PR_REPO, "999999"));
    await expect(review.prNotFoundHeading).toBeVisible();
    await expect(review.viewOnGithubButton).toBeVisible();
  });
});
