import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG } from "../support/paths";

/**
 * Sub-org Settings → Secrets page.
 *
 * NOTE: the product keeps `aria-disabled="true"` on the Add-secret dialog's
 * <form> even when the controls are fully interactive for real users, so all
 * interactions inside that dialog use `force: true` to bypass Playwright's
 * actionability check on the inherited aria-disabled state.
 */
export class SecretsPage extends BasePage {
  protected readonly path = routes.secrets();

  /** Main page heading. */
  readonly heading: Locator;
  /** "Back to organization" button above the heading. */
  readonly backToOrganization: Locator;
  /** Help text under the heading. */
  readonly helpText: Locator;
  /** "Learn more" documentation link. */
  readonly learnMoreLink: Locator;
  /** Organization scope tab (label includes the count). */
  readonly organizationTab: Locator;
  /** Personal scope tab (label includes the count). */
  readonly personalTab: Locator;
  /** Secrets search input. */
  readonly searchInput: Locator;
  /** "Bulk add secrets" button. */
  readonly bulkAddButton: Locator;
  /** "Add secret" button. */
  readonly addSecretButton: Locator;
  /** Active scope's secrets table. */
  readonly table: Locator;
  /** Body rows of the active scope's table. */
  readonly tableRows: Locator;
  /** Empty-state heading inside the table. */
  readonly emptyStateHeading: Locator;
  /** Empty-state hint inside the table. */
  readonly emptyStateHint: Locator;

  /** Any open dialog (add secret, detail, delete confirmation, bulk import). */
  readonly dialog: Locator;
  /** Scope toggle inside the add dialog. */
  readonly dialogOrganizationScope: Locator;
  readonly dialogPersonalScope: Locator;
  /** Secret-type combobox inside the add dialog. */
  readonly dialogTypeSelect: Locator;
  /** Secret name input inside the add dialog. */
  readonly dialogNameInput: Locator;
  /** Raw secret value textarea inside the add dialog. */
  readonly dialogValueInput: Locator;
  /** Note textarea inside the add dialog. */
  readonly dialogNoteInput: Locator;
  /** Redact-value switch inside the add dialog. */
  readonly dialogRedactSwitch: Locator;
  /** "Store secret" submit button inside the add dialog. */
  readonly dialogStoreButton: Locator;
  /** Close button inside the add dialog. */
  readonly dialogCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Secrets", exact: true });
    this.backToOrganization = page.getByText("Back to organization").first();
    this.helpText = page.getByText("Reference a secret with a dollar sign");
    this.learnMoreLink = page.getByRole("link", { name: "Learn more" });
    this.organizationTab = page.getByRole("tab", { name: /^Organization \d+$/ });
    this.personalTab = page.getByRole("tab", { name: /^Personal \d+$/ });
    this.searchInput = page.locator('input[placeholder="Search secrets"]');
    this.bulkAddButton = page.getByRole("button", { name: "Bulk add secrets" });
    this.addSecretButton = page.getByRole("button", { name: "Add secret", exact: true });
    this.table = page.locator('[role="tabpanel"] table').first();
    this.tableRows = this.table.locator("tbody tr");
    this.emptyStateHeading = page.getByRole("heading", { name: "No secrets found" });
    this.emptyStateHint = page.getByText("Add your first secret to get started.");

    this.dialog = page.locator('[role="dialog"]');
    this.dialogOrganizationScope = this.dialog.getByRole("button", {
      name: "Organization",
      exact: true,
    });
    this.dialogPersonalScope = this.dialog.getByRole("button", { name: "Personal", exact: true });
    this.dialogTypeSelect = this.dialog.getByRole("combobox");
    this.dialogNameInput = this.dialog.locator('input[name="key"]');
    this.dialogValueInput = this.dialog.locator('textarea[name="value"]');
    this.dialogNoteInput = this.dialog.locator('textarea[name="note"]');
    this.dialogRedactSwitch = this.dialog.getByRole("switch");
    this.dialogStoreButton = this.dialog.getByRole("button", { name: "Store secret" });
    this.dialogCloseButton = this.dialog.getByRole("button", { name: "Close" });
  }

  async goto(slug: string = TEST_SUBORG) {
    await this.page.goto(routes.secrets(slug));
    await this.heading.waitFor({ state: "visible" });
  }

  /** Numeric count shown on a scope tab. */
  async scopeCount(scope: "Organization" | "Personal"): Promise<number> {
    const tab = scope === "Organization" ? this.organizationTab : this.personalTab;
    return parseInt((await tab.innerText()).replace(/\D+/g, ""), 10);
  }

  /** Column header locator inside the active scope's table. */
  columnHeader(name: string): Locator {
    return this.table.getByRole("columnheader", { name, exact: true });
  }

  /** Body row containing the exact secret name cell. */
  rowByName(name: string): Locator {
    return this.tableRows.filter({ has: this.page.getByRole("cell", { name, exact: true }) });
  }

  /** Switch the list to a scope tab and wait for its panel. */
  async selectScope(scope: "Organization" | "Personal") {
    const tab = scope === "Organization" ? this.organizationTab : this.personalTab;
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }

  /** Open the Add-secret dialog and wait for the form to render. */
  async openAddDialog() {
    await this.addSecretButton.click();
    await this.dialogNameInput.waitFor({ state: "visible" });
  }

  /** Pick a secret type in the add dialog. */
  async selectType(type: "Raw secret" | "Cookie" | "One-Time Password (TOTP)") {
    await this.dialogTypeSelect.click({ force: true });
    await this.page.getByRole("option", { name: type }).click({ force: true });
  }

  /** Fill and submit a Raw secret through the add dialog, waiting for the row. */
  async createRawSecret(name: string, value: string, note?: string) {
    await this.openAddDialog();
    await this.dialogNameInput.fill(name, { force: true });
    await this.dialogValueInput.fill(value, { force: true });
    if (note !== undefined) {
      await this.dialogNoteInput.fill(note, { force: true });
    }
    await this.dialogStoreButton.click({ force: true });
    await this.dialog.waitFor({ state: "hidden" });
    await expect(this.rowByName(name)).toBeVisible();
  }

  /** Open the row Actions menu for a secret. */
  async openRowActions(name: string) {
    await this.rowByName(name).getByRole("button", { name: "Actions" }).click();
    await this.page.locator('[role="menu"]').waitFor({ state: "visible" });
  }

  /** Open the detail/edit dialog for a secret via its Actions menu. */
  async openDetail(name: string) {
    await this.openRowActions(name);
    await this.page.locator('[role="menu"]').getByRole("menuitem", { name: "Edit" }).click();
    await this.dialog.getByRole("heading", { name }).waitFor({ state: "visible" });
  }

  /** Open the delete confirmation dialog for a secret via its Actions menu. */
  async openDeleteDialog(name: string) {
    await this.openRowActions(name);
    await this.page.locator('[role="menu"]').getByRole("menuitem", { name: "Delete" }).click();
    await this.dialog.getByRole("heading", { name: "Delete secret" }).waitFor({ state: "visible" });
  }

  /** Confirm the open delete dialog and wait for the row to disappear. */
  async confirmDelete(name: string) {
    await this.dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await this.dialog.waitFor({ state: "hidden" });
    await expect(this.rowByName(name)).toHaveCount(0);
  }

  /** Cancel the open delete dialog. */
  async cancelDelete() {
    await this.dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await this.dialog.waitFor({ state: "hidden" });
  }

  /** Delete a secret through the row Actions menu. */
  async deleteSecret(name: string) {
    await this.openDeleteDialog(name);
    await this.confirmDelete(name);
  }

  /**
   * Best-effort cleanup: remove every secret whose name starts with `prefix`
   * from both scopes. Swallows failures so tests can use it in afterEach.
   */
  async deleteSecretsByPrefix(prefix: string) {
    try {
      await this.goto();
      for (const scope of ["Organization", "Personal"] as const) {
        await this.selectScope(scope);
        for (let i = 0; i < 20; i++) {
          const cell = this.tableRows.locator("td:first-child").filter({ hasText: prefix }).first();
          if (!(await cell.isVisible().catch(() => false))) break;
          const name = (await cell.innerText()).trim();
          await this.deleteSecret(name);
        }
      }
    } catch {
      // Nothing left to clean up (or the page is unavailable).
    }
  }
}
