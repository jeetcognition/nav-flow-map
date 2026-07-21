import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Sub-organization Secrets page (/org/{slug}/settings/secrets).
export class SecretsPage extends BasePage {
  protected readonly path = routes.secrets();

  readonly heading: Locator;
  readonly breadcrumb: Locator;
  readonly searchInput: Locator;
  readonly addSecretButton: Locator;
  readonly bulkAddButton: Locator;
  readonly organizationTab: Locator;
  readonly personalTab: Locator;
  readonly table: Locator;

  // Add-secret dialog
  readonly addSecretDialog: Locator;
  readonly scopeSelect: Locator;
  readonly typeSelect: Locator;
  readonly nameInput: Locator;
  readonly valueInput: Locator;
  readonly noteInput: Locator;
  readonly redactCheckbox: Locator;
  readonly storeButton: Locator;
  readonly closeDialogButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: /Secrets/i }).first();
    this.breadcrumb = page.getByText(/Settings.*Secrets/i).first();
    this.searchInput = page.getByPlaceholder(/Search secrets/i).first();
    this.addSecretButton = page.getByRole("button", { name: /Add secret/i }).first();
    this.bulkAddButton = page.getByRole("button", { name: /Bulk add secrets/i }).first();
    this.organizationTab = page.getByRole("tab", { name: /Organization/i });
    this.personalTab = page.getByRole("tab", { name: /Personal/i });
    this.table = page.locator("table").first();

    this.addSecretDialog = page
      .locator('[role="dialog"]')
      .filter({ hasText: /Add secret|Store secret/i });
    this.scopeSelect = page
      .getByLabel(/Scope/i)
      .or(page.getByRole("combobox", { name: /Scope/i }))
      .first();
    this.typeSelect = page
      .getByLabel(/Type/i)
      .or(page.getByRole("combobox", { name: /Type/i }))
      .first();
    this.nameInput = page
      .getByLabel(/Name/i)
      .or(page.getByRole("textbox", { name: /Name/i }))
      .first();
    this.valueInput = page
      .getByLabel(/Value/i)
      .or(page.getByRole("textbox", { name: /Value/i }))
      .first();
    this.noteInput = page
      .getByLabel(/Note/i)
      .or(page.getByRole("textbox", { name: /Note/i }))
      .first();
    this.redactCheckbox = page.getByRole("checkbox", { name: /Redact value/i });
    this.storeButton = page.getByRole("button", { name: /Store secret/i });
    this.closeDialogButton = page.getByRole("button", { name: /Close/i }).first();
  }

  async switchScope(scope: "Organization" | "Personal") {
    const tab = scope === "Organization" ? this.organizationTab : this.personalTab;
    await tab.click();
    await this.page.waitForTimeout(300);
  }

  async openAddSecret() {
    await this.addSecretButton.click();
    await this.addSecretDialog.waitFor({ state: "visible", timeout: 10_000 });
  }

  async fillRawSecret(name: string, value: string, note?: string) {
    // Ensure the type is Raw if a type selector is present.
    if (await this.typeSelect.count()) {
      await this.typeSelect.selectOption?.("Raw").catch(async () => {
        await this.typeSelect.click();
        await this.page.getByRole("option", { name: "Raw" }).first().click();
      });
    }
    await this.nameInput.fill(name);
    await this.valueInput.fill(value);
    if (note) await this.noteInput.fill(note);
  }

  async saveSecret() {
    await this.storeButton.click();
    await this.page.waitForTimeout(500);
  }

  rowByName(name: string): Locator {
    return this.page.locator("tr").filter({ hasText: name }).first();
  }

  async deleteSecret(name: string) {
    const row = this.rowByName(name);
    await row.getByRole("button", { name: /More options|Actions/i }).click();
    await this.page.getByRole("menuitem", { name: /Delete/i }).click();
    const confirm = this.page.getByRole("button", { name: /Delete|Confirm/i }).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await this.page.waitForTimeout(300);
  }

  async editSecret(name: string) {
    const row = this.rowByName(name);
    await row.getByRole("button", { name: /More options|Actions/i }).click();
    await this.page.getByRole("menuitem", { name: /Edit/i }).click();
    await this.addSecretDialog.waitFor({ state: "visible", timeout: 10_000 });
  }

  async selectType(type: "Raw" | "Cookie" | "One-Time Password" | "TOTP" | "Bulk") {
    if (!(await this.typeSelect.count())) return;
    await this.typeSelect.click();
    await this.page.getByRole("option", { name: type }).first().click();
    await this.page.waitForTimeout(200);
  }
}
