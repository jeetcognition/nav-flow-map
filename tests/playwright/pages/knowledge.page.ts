import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class KnowledgePage extends BasePage {
  protected readonly path = routes.enterpriseKnowledge();

  /** Main page heading. */
  readonly heading: Locator;
  /** Subheading description. */
  readonly description: Locator;
  /** "Learn more in our documentation" link. */
  readonly docsLink: Locator;
  /** "Create knowledge" button that opens the creation panel. */
  readonly createButton: Locator;
  /** Knowledge-list search input. */
  readonly searchInput: Locator;
  /** Main knowledge table. */
  readonly table: Locator;
  /** All table body rows (folders + entries). */
  readonly tableRows: Locator;
  /** System knowledge folder row. */
  readonly systemFolder: Locator;
  /** Enterprise knowledge folder row. */
  readonly enterpriseFolder: Locator;
  /** Empty-state message when a search returns no results. */
  readonly noResults: Locator;

  /** Knowledge creation panel heading. */
  readonly creationPanel: Locator;
  /** Name your knowledge input. */
  readonly nameInput: Locator;
  /** Contents rich-text editor. */
  readonly contentsEditor: Locator;
  /** Macro input. */
  readonly macroInput: Locator;
  /** Next button in creation panel. */
  readonly nextButton: Locator;
  /** Create button in creation trigger step. */
  readonly createSubmitButton: Locator;
  /** Cancel button in creation panel. */
  readonly cancelButton: Locator;
  /** Back button in the creation trigger step. */
  readonly creationBackButton: Locator;

  /** Entry page "Back to Knowledge" button. */
  readonly backToKnowledge: Locator;
  /** Details tab on a knowledge entry. */
  readonly detailsTab: Locator;
  /** Usage tab on a knowledge entry. */
  readonly usageTab: Locator;
  /** Trigger textarea in creation panel and on entry detail. */
  readonly triggerInput: Locator;
  /** Folder dropdown on the entry detail. */
  readonly folderSelect: Locator;
  /** Pin-to-repository dropdown on the entry detail. */
  readonly pinSelect: Locator;
  /** Save button on the entry detail. */
  readonly saveButton: Locator;
  /** Delete button on the entry detail. */
  readonly deleteButton: Locator;
  /** Take action bulk menu button. */
  readonly takeActionButton: Locator;
  /** Confirmation button for bulk delete. */
  readonly deleteItemsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Knowledge", exact: true });
    this.description = page.getByText(
      "Devin recalls relevant knowledge automatically during sessions.",
    );
    this.docsLink = page.getByRole("link", { name: /documentation/i });
    this.createButton = page.getByRole("button", { name: "Create knowledge" });
    this.searchInput = page.locator('input[placeholder="Search for knowledge..."]').first();
    this.table = page.locator("table").first();
    this.tableRows = this.table.locator("tbody tr");
    this.systemFolder = this.tableRows.filter({ hasText: "System knowledge" });
    this.enterpriseFolder = this.tableRows.filter({ hasText: "Enterprise knowledge" });
    this.noResults = page.getByText("No knowledge found");

    this.creationPanel = page.getByRole("heading", { name: "Knowledge creation" });
    this.nameInput = page.locator('input[placeholder="Name your knowledge"]').first();
    this.contentsEditor = page.locator('[role="textbox"][aria-multiline="true"]').first();
    this.macroInput = page.locator('input[placeholder="macro-name"]').first();
    this.nextButton = page.getByRole("button", { name: "Next" });
    this.createSubmitButton = page.getByRole("button", { name: "Create" });
    this.cancelButton = page.getByRole("button", { name: "Cancel" }).first();
    this.creationBackButton = page.getByRole("button", { name: "Back", exact: true });

    this.backToKnowledge = page.getByRole("button", { name: "Back to Knowledge" });
    this.detailsTab = page.getByRole("tab", { name: "Details" });
    this.usageTab = page.getByRole("tab", { name: "Usage" });
    this.triggerInput = page.locator('textarea[placeholder*="e.g., developing"]').first();
    this.folderSelect = page
      .locator('input[role="combobox"][placeholder="Select a folder..."]')
      .first();
    this.pinSelect = page
      .locator('input[role="combobox"][placeholder="Select a repository..."]')
      .first();
    this.saveButton = page.getByRole("button", { name: "Save" });
    this.deleteButton = page.getByRole("button", { name: "Delete" }).first();
    this.takeActionButton = page.getByRole("button", { name: "Take action" });
    this.deleteItemsButton = page.getByRole("button", { name: "Delete items" });
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.enterpriseKnowledge(slug));
  }

  /** Toggle a top-level folder by its row name (System or Enterprise knowledge). */
  async toggleFolder(name: "System knowledge" | "Enterprise knowledge") {
    const row = this.tableRows.filter({ hasText: name }).first();
    await row.click();
  }

  /** Click a knowledge entry row that contains the given text and wait for navigation. */
  async openEntry(name: string) {
    await this.tableRows.filter({ hasText: name }).first().click();
    await this.page.waitForURL(/\/settings\/knowledge\/.+/);
  }

  /** Use the list search to find and open an entry. */
  async openEntryByName(name: string) {
    await this.searchInput.fill(name);
    await this.page.getByRole("cell", { name, exact: true }).first().click();
    await this.page.waitForURL(/\/settings\/knowledge\/.+/);
  }

  /** Create a disposable knowledge entry through the two-step panel. */
  async createKnowledge(
    name: string,
    content: string,
    trigger: string,
    opts: { macro?: string } = {},
  ) {
    await this.createButton.click();
    await this.creationPanel.waitFor({ state: "visible" });
    await this.nameInput.fill(name);
    await this.contentsEditor.click();
    await this.contentsEditor.fill(content);
    if (opts.macro) {
      await this.macroInput.fill(opts.macro);
    }
    await Promise.all([
      this.page.waitForResponse((r) => /\/api\/[^/]+\/generate-scope$/.test(r.url())),
      this.nextButton.click(),
    ]);
    await this.triggerInput.waitFor({ state: "visible" });
    await this.triggerInput.fill(trigger);
    await Promise.all([
      this.page.waitForResponse(
        (r) => /\/api\/[^/]+\/learning$/.test(r.url()) && r.request().method() === "POST",
      ),
      this.createSubmitButton.click(),
    ]);
    await this.searchInput.waitFor({ state: "visible" });
  }

  /** Save the current open knowledge entry and wait for the PUT to complete. */
  async saveKnowledge() {
    await Promise.all([
      this.page.waitForResponse(
        (r) => /\/api\/[^/]+\/learning\/[^/]+/.test(r.url()) && r.request().method() === "PUT",
      ),
      this.saveButton.click(),
    ]);
  }

  /** Open the delete confirmation dialog for the currently open entry. */
  async openDeleteDialog() {
    await this.deleteButton.click();
    await this.page
      .locator('[role="dialog"]')
      .getByText(/Delete Knowledge/i)
      .waitFor({ state: "visible" });
  }

  /** Confirm the currently open delete dialog and wait for the DELETE request. */
  async confirmDeleteDialog() {
    const dialog = this.page.locator('[role="dialog"]');
    await Promise.all([
      this.page.waitForResponse(
        (r) => /\/api\/[^/]+\/learning\b/.test(r.url()) && r.request().method() === "DELETE",
      ),
      dialog.getByRole("button", { name: /^Delete$/ }).click(),
    ]);
    await this.page.waitForURL(/\/settings\/knowledge$/);
  }

  /** Cancel the currently open single-delete confirmation dialog. */
  async cancelDeleteDialog() {
    const dialog = this.page.locator('[role="dialog"]');
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
  }

  /** Delete the currently open entry from the detail page. */
  async deleteOpenEntry() {
    await this.openDeleteDialog();
    await this.confirmDeleteDialog();
  }

  /** Click the checkbox for the first visible row that contains `name`. */
  async selectRow(name: string) {
    const row = this.tableRows.filter({ hasText: name }).first();
    await row.locator("span[role='checkbox']").waitFor({ state: "visible" });
    await row.locator("span[role='checkbox']").click();
  }

  /** Search for `name` and then click the first matching row's checkbox. */
  async selectRowBySearch(name: string) {
    await this.searchInput.fill(name);
    const row = this.tableRows.filter({ hasText: name }).first();
    await row.locator("span[role='checkbox']").waitFor({ state: "visible" });
    await row.locator("span[role='checkbox']").click();
  }

  /** Choose a value from the Folder combobox on the entry detail. */
  async selectFolder(label: string) {
    await this.folderSelect.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  /** Choose a value from the Pin to repository combobox on the entry detail. */
  async selectPin(label: "None" | "All sessions") {
    await this.pinSelect.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  /** Set every editable field on the entry detail to the supplied values. */
  async fillKnowledgeDetail(content: string, trigger: string, macro: string) {
    await this.contentsEditor.click();
    await this.contentsEditor.fill(content);
    await this.triggerInput.fill(trigger);
    const macroInput = this.macroInput;
    await macroInput.fill("");
    await macroInput.fill(macro);
  }

  /** Open the bulk Take action menu and click the Delete option. */
  async chooseBulkDelete() {
    await this.takeActionButton.click();
    await this.page.getByRole("option", { name: "Delete" }).click();
    await this.page
      .locator('[role="dialog"]')
      .getByRole("heading", { name: "Delete Items" })
      .waitFor({ state: "visible" });
  }

  /**
   * Open the Usage tab for the entry reachable at `detailUrl` and return the
   * parsed `analytics/sessions` response. Navigates fresh each call so callers
   * can poll it while the backend catches up (the tab isn't always auto-selected
   * on back/reload navigations, so we click it explicitly every time).
   */
  async fetchUsageSessions(
    detailUrl: string,
  ): Promise<{ data?: { devin_id: string; session_title: string }[] }> {
    await this.page.goto(detailUrl, { waitUntil: "domcontentloaded" });
    const [sessionsResp] = await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith("/analytics/sessions")),
      this.usageTab.click(),
    ]);
    return (await sessionsResp.json()) as {
      data?: { devin_id: string; session_title: string }[];
    };
  }

  /** True when a Usage `analytics/sessions` payload contains the given raw session id. */
  usageIncludesSession(
    sessions: { data?: { devin_id: string; session_title: string }[] } | undefined,
    sessionId: string,
  ): boolean {
    return (sessions?.data ?? []).some((s) => s.devin_id.replace("devin-", "") === sessionId);
  }

  /** Replace the current search query with `name`. */
  async searchFor(name: string) {
    await this.searchInput.fill(name);
  }

  /** Assert that a table cell with the exact entry name is visible. */
  async expectEntryVisible(name: string) {
    await expect(this.page.getByRole("cell", { name, exact: true }).first()).toBeVisible();
  }

  /** Reload the knowledge list and wait for the heading to reappear. */
  async reloadAndWait() {
    await this.page.reload();
    await this.heading.waitFor({ state: "visible" });
  }

  /** Navigate to a saved entry detail URL. */
  async openDetailUrl(detailUrl: string) {
    await this.page.goto(detailUrl, { waitUntil: "domcontentloaded" });
  }

  /**
   * Best-effort deletion of an entry by name from the enterprise knowledge list.
   * Swallows the case where the entry no longer exists so callers can use it for
   * cleanup safety.
   */
  async deleteEntryByName(name: string, slug: string = ENTERPRISE_SLUG) {
    try {
      await this.goto(slug);
      await this.heading.waitFor({ state: "visible" });
      await this.searchFor(name);
      const cell = this.page.getByRole("cell", { name, exact: true }).first();
      if (await cell.isVisible().catch(() => false)) {
        await cell.click();
        await this.page.waitForURL(/\/settings\/knowledge\/.+/);
        await this.deleteOpenEntry();
      }
    } catch {
      // Entry was already deleted or not found.
    }
  }

  /** Confirm the bulk delete dialog for selected entries. */
  async confirmBulkDelete() {
    const dialog = this.page.locator('[role="dialog"]');
    await Promise.all([
      this.page.waitForResponse(
        (r) =>
          /\/api\/[^/]+\/learning\/bulk-delete$/.test(r.url()) && r.request().method() === "POST",
      ),
      dialog.getByRole("button", { name: "Delete items" }).click(),
    ]);
    await expect(dialog).not.toBeVisible();
  }
}
