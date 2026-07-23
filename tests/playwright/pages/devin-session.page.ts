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
  readonly guardrailBlockedBanner: Locator;
  readonly guardrailBlockedNotice: Locator;
  readonly guardrailWarnFlag: Locator;
  readonly attachButton: Locator;
  readonly configurationButton: Locator;
  readonly sendOptionsButton: Locator;
  readonly recentSessionRows: Locator;

  constructor(page: Page) {
    super(page);
    this.promptInput = page.getByRole("textbox").first();
    this.sendButton = page.getByRole("button", { name: "Send", exact: true });
    this.assistantMessages = page.locator('[class*="message-history--item"]');
    this.guardrailBlockedBanner = page.getByText(
      "Your request has been denied due to violating our safe use policy",
    );
    this.guardrailBlockedNotice = page.getByText(
      "Your message was blocked. Please start a new session.",
    );
    this.guardrailWarnFlag = page.getByText(
      "This message was flagged for potentially violating your organization's usage policies.",
    );
    this.attachButton = page.getByRole("button", { name: "Attach or mention" });
    this.configurationButton = page.getByRole("button", { name: "Configuration" });
    this.sendOptionsButton = page.getByRole("button", { name: "More send options" });
    this.recentSessionRows = page.locator('[data-slot="sidebar-menu-button"]');
  }

  async gotoSession() {
    await this.goto();
    await expect(this.promptInput).toBeVisible({ timeout: 20_000 });
  }

  /** The composer mode trigger button — its label changes with the selected capability/speed. */
  modeTrigger(label: string | RegExp = /^(Fast|Normal|Ultra|Fusion|SWE-1\.7)$/): Locator {
    return this.page.getByRole("button", { name: label, exact: typeof label === "string" });
  }

  /** Any open dropdown menu rendered by the composer controls. */
  get openMenu(): Locator {
    return this.page.getByRole("menu").first();
  }

  menuItems(): Locator {
    return this.page.locator(
      '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]',
    );
  }

  async openModeMenu() {
    await this.modeTrigger().first().click();
    await expect(this.openMenu).toBeVisible();
  }

  async openAttachMenu() {
    await this.attachButton.click();
    await expect(this.openMenu).toBeVisible();
  }

  async openSendOptionsMenu() {
    await this.sendOptionsButton.click();
    await expect(this.openMenu).toBeVisible();
  }

  async closeMenu() {
    await this.page.keyboard.press("Escape");
    await expect(this.openMenu).toBeHidden();
  }

  /** Select a capability radio (e.g. "Ultra" or "Normal") in the mode dropdown. */
  async selectCapability(name: string) {
    await this.page.getByRole("menuitemradio", { name }).click();
    // The capability radios keep the menu open; dismiss it explicitly.
    await this.closeMenu();
  }

  /** Clear the composer contenteditable. */
  async clearPrompt() {
    await this.promptInput.fill("");
  }

  /** Hrefs of the sidebar Recent session links, newest first. */
  async recentSessionHrefs(): Promise<string[]> {
    const links = this.page.locator('[data-slot="sidebar-menu-button"] a[href^="/sessions/"]');
    return (await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")))).filter(
      (href): href is string => href !== null,
    );
  }

  /** Sidebar "Recent" row whose title contains the given text. */
  recentRow(titleText: string): Locator {
    return this.recentSessionRows.filter({ hasText: titleText }).first();
  }

  /** Archive a Recent sidebar session row (hover reveals the action). */
  async archiveRecentSession(titleText: string) {
    await this.archiveRecentRow(this.recentRow(titleText));
  }

  /** Archive the Recent sidebar row that links to the given session href. */
  async archiveRecentSessionByHref(href: string) {
    const row = this.recentSessionRows.filter({ has: this.page.locator(`a[href="${href}"]`) });
    await this.archiveRecentRow(row.first());
  }

  private async archiveRecentRow(row: Locator) {
    await row.hover();
    await row.getByRole("button", { name: "Archive" }).click();
    // Archiving an active session asks for confirmation first.
    const confirm = this.page.getByRole("dialog").getByRole("button", { name: "Archive" });
    await confirm
      .waitFor({ state: "visible", timeout: 3_000 })
      .then(() => confirm.click())
      .catch(() => {});
    await expect(row).toBeHidden({ timeout: 15_000 });
  }

  /** Tool-panel option labels shown on an open /sessions/{id} page. */
  toolPanelOption(label: string): Locator {
    return this.page.getByText(label, { exact: true }).first();
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
