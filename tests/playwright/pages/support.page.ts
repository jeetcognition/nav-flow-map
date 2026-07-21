import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Support page under /org/{tenant}/settings/support.
export class SupportPage extends BasePage {
  protected readonly path = routes.support;

  readonly heading: Locator;
  readonly chatLauncher: Locator;
  readonly documentationHeading: Locator;
  readonly documentationDescription: Locator;
  readonly documentationButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: /support/i }).first();
    this.chatLauncher = page.getByRole("button", { name: /support chat|chat|message/i }).first();
    this.documentationHeading = page.getByRole("heading", { name: "Documentation" }).first();
    this.documentationDescription = page.getByText(
      /Find answers to common questions and comprehensive guides/i,
    );
    this.documentationButton = page
      .getByRole("link", { name: /documentation/i })
      .or(page.getByRole("button", { name: /documentation/i }))
      .first();
  }

  /** Navigate from the org selector via the help menu. */
  async openViaHelpMenu(helpButton: Locator) {
    await helpButton.click();
    const supportItem = this.page
      .getByRole("menuitem", { name: /support/i })
      .or(this.page.getByText(/Contact support/, { exact: false }))
      .first();
    await supportItem.waitFor({ state: "visible", timeout: 10_000 });
    await supportItem.click();
    await this.page.waitForURL(/\/settings\/support/, { timeout: 15_000 });
  }
}
