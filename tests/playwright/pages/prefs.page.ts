import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Personal → Preferences page (`/settings/preferences`).
//
// The page is a list of setting rows: each row holds an <h4> title, a short
// description, and one control (button, combobox, switch, or read-only text).
// Rows are plain divs with no stable ids, so every control is reached from its
// row title via `row(title)`.
export class PrefsPage extends BasePage {
  protected readonly path = routes.preferences;

  /** Page heading "Preferences". */
  readonly heading: Locator;
  /** "Change preferred name" dialog. */
  readonly nameDialog: Locator;
  /** Name input inside the dialog. */
  readonly nameInput: Locator;
  /** Save button inside the dialog. */
  readonly nameSave: Locator;
  /** Cancel button inside the dialog. */
  readonly nameCancel: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator("main").getByRole("heading", { name: "Preferences", level: 2 });
    this.nameDialog = page.getByRole("dialog", { name: "Change preferred name" });
    this.nameInput = this.nameDialog.getByRole("textbox");
    this.nameSave = this.nameDialog.getByRole("button", { name: "Save" });
    this.nameCancel = this.nameDialog.getByRole("button", { name: "Cancel" });
  }

  async goto() {
    await super.goto();
    await this.heading.waitFor({ state: "visible", timeout: 20_000 });
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  /** Section heading (h3): Profile, Display, Notifications, Devin sessions, Devin Review. */
  sectionHeading(name: string): Locator {
    return this.page.locator("main").getByRole("heading", { name, exact: true, level: 3 });
  }

  /** Setting row title (h4). */
  rowHeading(title: string): Locator {
    return this.page.locator("main").getByRole("heading", { name: title, exact: true, level: 4 });
  }

  /** Innermost row container that holds both the h4 title and the row's control. */
  row(title: string): Locator {
    return this.rowHeading(title).locator(
      'xpath=ancestor::div[.//button or .//*[@role="combobox"] or .//*[@role="switch"] or .//p][1]',
    );
  }

  /** The combobox control of a setting row. */
  combobox(title: string): Locator {
    return this.row(title).getByRole("combobox").first();
  }

  /** The switch control of a setting row. */
  switch(title: string): Locator {
    return this.row(title).getByRole("switch").first();
  }

  /** Read-only value paragraph of a setting row (Email, User ID). */
  readOnlyValue(title: string): Locator {
    return this.row(title).locator("p").last();
  }

  /** The edit button in the Name row (its accessible name is the current display name). */
  get nameButton(): Locator {
    return this.row("Name").getByRole("button").first();
  }

  /** Current aria-checked state of a row's switch. */
  async switchState(title: string): Promise<"true" | "false"> {
    const value = await this.switch(title).getAttribute("aria-checked");
    return value === "true" ? "true" : "false";
  }

  /** Toggle a switch and wait for its state to flip. */
  async toggleSwitch(title: string) {
    const control = this.switch(title);
    const before = await this.switchState(title);
    await control.click();
    await expect(control).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
  }

  /** Set a switch to a target state (no-op if already there). */
  async setSwitch(title: string, target: "true" | "false") {
    if ((await this.switchState(title)) !== target) {
      await this.toggleSwitch(title);
    }
  }

  /**
   * Pick an option in a row's select dropdown and wait for the trigger to show it.
   * Some options carry an inline description (e.g. "Manual — No automatic reviews"),
   * so `expectText` lets callers assert only the visible trigger label.
   */
  async selectOption(title: string, option: string, expectText: string = option) {
    await this.combobox(title).click();
    await this.page.getByRole("option", { name: option }).first().click();
    await expect(this.combobox(title)).toContainText(expectText);
  }

  /** Open the Change preferred name dialog from the Name row. */
  async openNameDialog() {
    await this.nameButton.click();
    await this.nameDialog.waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Type a name in the open dialog and save it, waiting for the dialog to close. */
  async saveName(name: string) {
    await this.nameInput.fill(name);
    await this.nameSave.click();
    await this.nameDialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Set the display name end-to-end (open dialog, fill, save). */
  async setName(name: string) {
    await this.openNameDialog();
    await this.saveName(name);
  }
}
