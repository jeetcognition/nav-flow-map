import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG } from "../support/paths";

// Page object for the sub-org home session prompt and the resulting /sessions/{id} chat.
//
// The prompt input is a Slate rich-text editor: a contenteditable div that exposes
// `role="textbox"`, so we reach it with getByRole rather than a CSS selector.
// The Send action is an icon button whose accessible name is "Send".
//
// Assistant responses render inside `message-history--item` wrappers, with the
// rendered markdown in a `.prose-main` block. Those messages carry no ARIA role
// and only auto-generated (unstable) test ids, so the product CSS classes are the
// last-resort locator here — matching how the rest of this suite handles the
// session views (see SessionsPage). Assertions target user-visible text, not the
// class names themselves.
export class DevinSessionPage extends BasePage {
  protected readonly path = routes.subOrg(TEST_SUBORG);

  readonly promptInput: Locator;
  readonly sendButton: Locator;
  readonly assistantMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.promptInput = page.getByRole("textbox").first();
    this.sendButton = page.getByRole("button", { name: "Send", exact: true });
    this.assistantMessages = page.locator('[class*="message-history--item"]');
  }

  async gotoSession() {
    await this.goto();
    await expect(this.promptInput).toBeVisible({ timeout: 20_000 });
  }

  /** Type a prompt in the home session prompt and submit it. Returns the new session id. */
  async sendPrompt(prompt: string) {
    await this.promptInput.click();
    await this.promptInput.fill(prompt);
    await this.sendButton.click();
    await this.page.waitForURL(/\/sessions\/[^/]+/, { timeout: 30_000 });
    return this.currentSessionId;
  }

  /** Extract the session id from the current URL. */
  get currentSessionId() {
    const match = this.page.url().match(/\/sessions\/([^/]+)/);
    return match?.[1] ?? "";
  }

  private get lastAssistantContent() {
    return this.assistantMessages.last().locator('[class*="prose-main"]').first();
  }

  /**
   * Wait until the latest assistant message contains and ends with the given
   * marker string. This may take a while while Devin is working.
   */
  async waitForResponseEnding(ending: string, timeout = 180_000) {
    const content = this.lastAssistantContent;
    await expect(content).toContainText(ending, { timeout });
    const text = (await content.textContent()) ?? "";
    expect(text.trim().endsWith(ending)).toBe(true);
  }
}
