import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

export class SupportPage extends BasePage {
  protected readonly path = routes.support();

  /** Main page heading. */
  readonly heading: Locator;
  /** Documentation card heading. */
  readonly documentationHeading: Locator;
  /** Documentation card description. */
  readonly documentationDescription: Locator;
  /** Documentation button/link that opens docs.devin.ai. */
  readonly documentationButton: Locator;
  /** Chat section heading. */
  readonly chatHeading: Locator;
  /** "Support chat is unavailable" notice. */
  readonly chatUnavailableNotice: Locator;
  /** Support email link. */
  readonly supportEmailLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Support", level: 2, exact: true });
    this.documentationHeading = page.getByRole("heading", { name: "Documentation", exact: true });
    this.documentationDescription = page.getByText(
      "Find answers to common questions and comprehensive guides",
    );
    this.documentationButton = page.getByRole("button", { name: "Documentation" });
    this.chatHeading = page.getByRole("heading", { name: "Need more help? Chat with support" });
    this.chatUnavailableNotice = page.getByText("Support chat is unavailable");
    this.supportEmailLink = page.getByRole("link", { name: "support@cognition.ai" });
  }
}
