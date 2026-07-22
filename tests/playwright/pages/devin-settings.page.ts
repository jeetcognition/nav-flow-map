import { Locator, Page, Response, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Enterprise Settings → Devin page (model/mode, deployments, git commit metadata). */
export class DevinSettingsPage extends BasePage {
  protected readonly path = routes.devinSettings();

  readonly heading: Locator;
  readonly sessionsHeading: Locator;
  readonly gitCommitAttributionHeading: Locator;

  readonly ultraSwitch: Locator;
  readonly fastModeSwitch: Locator;
  readonly sweSwitch: Locator;
  readonly fusionSwitch: Locator;
  readonly nativeDeploymentsSwitch: Locator;
  readonly webSearchSwitch: Locator;
  readonly lockCommitEmailSwitch: Locator;

  readonly commitAuthorTrigger: Locator;
  readonly commitEmailTrigger: Locator;
  readonly commitEmailCustomInput: Locator;
  readonly openPrsAsTrigger: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Devin", level: 2, exact: true });
    this.sessionsHeading = page.getByRole("heading", { name: "Sessions", exact: true });
    this.gitCommitAttributionHeading = page.getByRole("heading", {
      name: "Git commit attribution",
      exact: true,
    });

    this.ultraSwitch = this.switchFor("ultra");
    this.fastModeSwitch = this.switchFor("fast-mode");
    this.sweSwitch = this.switchFor("swe-1-7");
    this.fusionSwitch = this.switchFor("fusion");
    this.nativeDeploymentsSwitch = this.switchFor("enterprise-secure-mode");
    this.webSearchSwitch = this.switchFor("enterprise-web-search");
    this.lockCommitEmailSwitch = this.switchFor("lock-user-commit-email");

    this.commitAuthorTrigger = page.locator("#commit-author [role='combobox']");
    this.commitEmailTrigger = page.locator("#commit-email [role='combobox']");
    this.commitEmailCustomInput = page.locator("#commit-email input[type='email']");
    this.openPrsAsTrigger = page.locator("#enterprise-open-prs-as [role='combobox']");
  }

  async goto() {
    await super.goto();
    await this.heading.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
  }

  switchFor(sectionId: string): Locator {
    return this.page.locator(`#${sectionId} [role='switch']`);
  }

  /** Toggle a switch and wait for the enterprise settings PUT to succeed. */
  async toggleSwitch(switchEl: Locator): Promise<string> {
    const before = await switchEl.getAttribute("aria-checked");
    const expected = before === "true" ? "false" : "true";

    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/enterprise/") &&
          resp.url().endsWith("/settings") &&
          resp.request().method() === "PUT" &&
          resp.status() === 200,
      ),
      switchEl.click(),
    ]);

    await expect(switchEl).toHaveAttribute("aria-checked", expected);
    return expected;
  }

  /** Ensure a switch ends up at the requested aria-checked value. */
  async setSwitch(switchEl: Locator, target: "true" | "false"): Promise<void> {
    const current = await switchEl.getAttribute("aria-checked");
    if (current === target) return;
    await this.toggleSwitch(switchEl);
  }

  /** Select a commit-author option by exact label and wait for the PATCH. */
  async selectCommitAuthorOption(label: string): Promise<void> {
    const current = await this.commitAuthorTrigger.textContent();
    if (current?.trim() === label) return;

    await this.commitAuthorTrigger.click();
    const option = this.page.locator('[role="listbox"] [role="option"]', {
      hasText: new RegExp(`^${escapeRegExp(label)}$`),
    });
    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/account/commit-signing-mode") &&
          resp.request().method() === "PATCH" &&
          resp.status() === 200,
      ),
      option.click(),
    ]);
    await expect(this.commitAuthorTrigger).toHaveText(label);
  }

  /** Select a commit-email option ("Default" or "Custom email…"). */
  async selectCommitEmailOption(label: "Default" | "Custom email…"): Promise<void> {
    const current = await this.commitEmailTrigger.textContent();
    if (current?.trim() === label) {
      if (label === "Custom email…") {
        await this.commitEmailCustomInput.waitFor({ state: "visible" });
      }
      return;
    }

    await this.commitEmailTrigger.click();
    const option = this.page.locator('[role="listbox"] [role="option"]', {
      hasText: new RegExp(`^${escapeRegExp(label)}$`),
    });

    if (label === "Custom email…") {
      await option.click();
      await this.commitEmailCustomInput.waitFor({ state: "visible" });
      await expect(this.commitEmailTrigger).toHaveText(label);
      return;
    }

    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/account/commit-email") &&
          resp.request().method() === "PATCH" &&
          resp.status() === 200,
      ),
      option.click(),
    ]);
    await expect(this.commitEmailTrigger).toHaveText(label);
  }

  /** Fill the custom commit-email input and blur; returns the PATCH response when one is sent. */
  async setCustomCommitEmail(email: string): Promise<Response | null> {
    const currentValue = await this.commitEmailCustomInput.inputValue();
    if (currentValue !== email) {
      await this.commitEmailCustomInput.fill(email);
    }
    await this.commitEmailCustomInput.blur();

    if (email === "") {
      return null;
    }

    // Valid and some malformed (syntax-ish) emails trigger a PATCH; pure garbage does not.
    try {
      return await this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/account/commit-email") && resp.request().method() === "PATCH",
        { timeout: 5_000 },
      );
    } catch {
      return null;
    }
  }

  /** Select an "Open PRs as" option by leading text regex. */
  async selectOpenPrsAsOption(labelRegex: RegExp): Promise<void> {
    const current = await this.openPrsAsTrigger.textContent();
    if (current && labelRegex.test(current.trim())) return;

    await this.openPrsAsTrigger.click();
    const option = this.page.locator('[role="listbox"] [role="option"]', {
      hasText: labelRegex,
    });
    await Promise.all([
      this.page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/account/pr-open-as") &&
          resp.request().method() === "PATCH" &&
          resp.status() === 200,
      ),
      option.click(),
    ]);
  }
}
