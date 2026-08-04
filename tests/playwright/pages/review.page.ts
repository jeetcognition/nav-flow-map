import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Devin Review landing (`/review`) and the pull-request review view
// (`/review/{owner}/{repo}/pull/{n}`).
//
// A first visit shows an "Unlock the full experience" intro card prompting
// personal git connections (see BL-043); `goto` dismisses it so tests always
// start from the landing itself.
export class ReviewPage extends BasePage {
  protected readonly path = routes.review;

  /** First-visit "Unlock the full experience" intro card. */
  readonly introCard: Locator;
  readonly introCloseButton: Locator;

  // Landing
  readonly reviewAnyPrLabel: Locator;
  readonly prUrlInput: Locator;
  readonly submitPrUrlButton: Locator;

  // Header (always present on /review routes)
  readonly jumpToPrInput: Locator;
  readonly goToPrButton: Locator;

  // PR review view
  readonly prTitleHeading: Locator;
  readonly descriptionTab: Locator;
  readonly discussionTab: Locator;
  readonly commitsTab: Locator;
  readonly prNotFoundHeading: Locator;
  readonly viewOnGithubButton: Locator;

  constructor(page: Page) {
    super(page);
    this.introCard = page.getByText("Unlock the full experience");
    this.introCloseButton = page.getByRole("main").getByRole("button", { name: "Close" }).first();

    this.reviewAnyPrLabel = page.getByText("Review any PR URL");
    this.prUrlInput = page.getByRole("textbox", {
      name: "https://github.com/owner/repo/pull/123",
    });
    this.submitPrUrlButton = page.getByRole("button", { name: "Submit PR URL" });

    this.jumpToPrInput = page.getByRole("textbox", { name: "Jump to pull request" });
    this.goToPrButton = page.getByRole("button", { name: "Go to pull request" });

    this.prTitleHeading = page.getByRole("heading", { level: 1 });
    this.descriptionTab = page.getByRole("tab", { name: "Description" });
    this.discussionTab = page.getByRole("tab", { name: /Discussion/ });
    this.commitsTab = page.getByRole("tab", { name: /Commits/ });
    this.prNotFoundHeading = page.getByRole("heading", { name: "Pull Request Not Found" });
    this.viewOnGithubButton = page.getByRole("button", { name: "View on GitHub" });
  }

  /** Navigate to the Review landing and dismiss the first-visit intro card. */
  async goto() {
    await super.goto();
    await this.dismissIntroCard();
  }

  /** Dismiss the first-visit intro card if it is showing. */
  async dismissIntroCard() {
    await this.introCloseButton.click({ timeout: 10_000 }).catch(() => {});
    await this.introCard.waitFor({ state: "hidden" });
  }

  /** Submit a PR URL from the landing input by pressing Enter. */
  async submitPrUrlWithEnter(prUrl: string) {
    await this.prUrlInput.fill(prUrl);
    await this.prUrlInput.press("Enter");
  }
}
