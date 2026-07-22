import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG } from "../support/paths";

// Page object for the sub-org home composer and the resulting /sessions/{id} chat.
//
// The composer input is a contenteditable div; the send button has the accessible
// name "Send". After submission, the app redirects to a session page where the
// assistant response is rendered inside a message-history--item wrapper with
// message-item--content.
export class DevinSessionPage extends BasePage {
  protected readonly path = routes.subOrg(TEST_SUBORG);

  readonly promptInput: Locator;
  readonly sendButton: Locator;
  readonly assistantMessages: Locator;

  constructor(page: Page) {
    super(page);
    this.promptInput = page.locator('[contenteditable="true"]').first();
    this.sendButton = page.getByRole("button", { name: "Send", exact: true });
    this.assistantMessages = page.locator('[class*="message-history--item"]');
  }

  async gotoComposer() {
    await this.goto();
    await expect(this.promptInput).toBeVisible({ timeout: 20_000 });
  }

  /** Type a prompt in the home composer and submit it. Returns the new session id. */
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
