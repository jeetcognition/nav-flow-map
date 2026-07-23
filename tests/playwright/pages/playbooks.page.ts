import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

// Enterprise → Playbooks list, the /create form, and the playbook detail page.
//
// The create/edit form only enables Save once the name, body, and macro are all
// valid, so validation assertions target the Save button's disabled state.
// Typing goes through pressSequentially where the form validates on keystrokes
// (programmatic fill alone does not always re-enable Save).
export class PlaybooksPage extends BasePage {
  protected readonly path = routes.playbooks();

  /** Main page heading. */
  readonly heading: Locator;
  /** Subheading description. */
  readonly description: Locator;
  /** "Learn more in our documentation" link. */
  readonly docsLink: Locator;
  /** Enterprise tab (label includes the playbook count). */
  readonly enterpriseTab: Locator;
  /** System tab (label includes the playbook count). */
  readonly systemTab: Locator;
  /** Playbook-list search input. */
  readonly searchInput: Locator;
  /** "Create playbook" button on the Enterprise tab. */
  readonly createButton: Locator;
  /** Main playbook table. */
  readonly table: Locator;
  /** All table body rows. */
  readonly tableRows: Locator;
  /** Empty-state message when a search returns no results. */
  readonly noResults: Locator;

  /** Name input on the create form and in detail edit mode. */
  readonly nameInput: Locator;
  /** Playbook body editor textarea. */
  readonly bodyEditor: Locator;
  /** Macro input (auto-filled from the name on the create form). */
  readonly macroInput: Locator;
  /** Devin mode dropdown. */
  readonly modeSelect: Locator;
  /** Save button on the create form and in detail edit mode. */
  readonly saveButton: Locator;
  /** Cancel button on the create form and in detail edit mode. */
  readonly cancelButton: Locator;
  /** Character counter under the body editor. */
  readonly charCounter: Locator;
  /** Edit tab of the body editor. */
  readonly editTab: Locator;
  /** Preview tab of the body editor. */
  readonly previewTab: Locator;
  /** Expand (fullscreen) toggle on the body editor. */
  readonly expandButton: Locator;

  /** "Back to Playbooks" button on the create form and detail page. */
  readonly backToPlaybooks: Locator;
  /** Edit button on the read-only detail page. */
  readonly editButton: Locator;
  /** "More playbook actions" kebab menu next to Edit. */
  readonly moreActionsButton: Locator;
  /** Confirmation dialog (delete / discard changes). */
  readonly dialog: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Playbooks", exact: true });
    this.description = page.getByText("Reusable system prompts that customize how Devin works.");
    this.docsLink = page.getByRole("link", { name: /documentation/i });
    this.enterpriseTab = page.getByRole("tab", { name: /Enterprise/ });
    this.systemTab = page.getByRole("tab", { name: /System/ });
    this.searchInput = page.getByPlaceholder("Search playbooks...");
    this.createButton = page.getByRole("button", { name: "Create playbook" });
    this.table = page.locator("table").first();
    this.tableRows = this.table.locator("tbody tr");
    this.noResults = page.getByText("No playbooks match your search");

    this.nameInput = page.getByRole("textbox", { name: /Enter a name for your/ });
    this.bodyEditor = page.getByRole("textbox", { name: /Write your playbook here/ });
    this.macroInput = page.getByPlaceholder("!do_something");
    this.modeSelect = page.getByRole("combobox").first();
    this.saveButton = page.getByRole("button", { name: "Save" });
    this.cancelButton = page.getByRole("button", { name: "Cancel" });
    this.charCounter = page.getByText(/\d+ characters/);
    this.editTab = page.getByRole("tab", { name: "Edit", exact: true });
    this.previewTab = page.getByRole("tab", { name: "Preview", exact: true });
    this.expandButton = page.getByRole("button", { name: "Expand" });

    this.backToPlaybooks = page.getByRole("button", { name: "Back to Playbooks" });
    this.editButton = page.getByRole("button", { name: "Edit", exact: true });
    this.moreActionsButton = page.locator('button[data-dd-action-name="More playbook actions"]');
    this.dialog = page.locator('[role="dialog"]');
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.playbooks(slug));
    await this.heading.waitFor({ state: "visible" });
  }

  /** Wait for the playbook list to finish loading and return its row count. */
  async waitForStableRowCount(): Promise<number> {
    await this.tableRows.first().waitFor({ state: "visible" });
    let previous = -1;
    await expect
      .poll(
        async () => {
          const count = await this.tableRows.count();
          const stable = count > 0 && count === previous;
          previous = count;
          return stable;
        },
        { intervals: [500, 500, 1_000, 1_000, 2_000], timeout: 20_000 },
      )
      .toBe(true);
    return previous;
  }

  async gotoCreate(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(`${routes.playbooks(slug)}/create`);
    await this.nameInput.waitFor({ state: "visible" });
  }

  /** Type the playbook name keystroke-by-keystroke so form validation runs. */
  async typeName(name: string) {
    await this.nameInput.click();
    await this.page.keyboard.press("ControlOrMeta+a");
    await this.nameInput.pressSequentially(name);
  }

  /** Replace the body editor content, keeping validation in sync. */
  async typeBody(body: string) {
    await this.bodyEditor.click();
    await this.page.keyboard.press("ControlOrMeta+a");
    await this.page.keyboard.press("Backspace");
    if (body) await this.page.keyboard.insertText(body);
  }

  /** Replace the macro (the create form pre-fills it from the name). */
  async typeMacro(macro: string) {
    await this.macroInput.fill("");
    if (macro) await this.macroInput.pressSequentially(macro);
  }

  /** Pick a Devin mode from the dropdown. */
  async selectMode(mode: "Default" | "Normal" | "Fast" | "Ultra" | "Fusion") {
    await this.modeSelect.click();
    await this.page.getByRole("option", { name: mode, exact: true }).click();
  }

  /** Save the create/edit form and wait for the list or detail view to settle. */
  async save() {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }

  /** Create a disposable playbook through the /create form. */
  async createPlaybook(
    name: string,
    body: string,
    macro: string,
    opts: { mode?: "Default" | "Normal" | "Fast" | "Ultra" | "Fusion"; slug?: string } = {},
  ) {
    await this.gotoCreate(opts.slug);
    await this.typeName(name);
    await this.typeBody(body);
    await this.typeMacro(macro);
    if (opts.mode) await this.selectMode(opts.mode);
    await this.save();
    await this.page.waitForURL(/\/settings\/playbooks$/);
  }

  /** Search for `name` and open its detail page. */
  async openPlaybookByName(name: string) {
    await this.searchInput.fill(name);
    await this.page.getByRole("link", { name, exact: true }).first().click();
    await this.page.waitForURL(/\/settings\/playbooks\/[^/]+$/);
    await this.editButton.waitFor({ state: "visible" });
  }

  /** Switch the read-only detail page into edit mode. */
  async enterEditMode() {
    await this.editButton.click();
    await this.nameInput.waitFor({ state: "visible" });
  }

  /** Delete the currently open playbook via the kebab menu, confirming the dialog. */
  async deleteOpenPlaybook() {
    await this.moreActionsButton.click();
    await this.page.getByRole("menuitem", { name: "Delete" }).click();
    await this.dialog.getByRole("heading", { name: "Delete playbook" }).waitFor({
      state: "visible",
    });
    await this.dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await this.page.waitForURL(/\/settings\/playbooks$/);
  }

  /**
   * Best-effort deletion of a playbook by name, used as cleanup safety.
   * Swallows the case where the playbook no longer exists.
   */
  async deletePlaybookByName(name: string, slug: string = ENTERPRISE_SLUG) {
    try {
      await this.goto(slug);
      await this.searchInput.fill(name);
      const link = this.page.getByRole("link", { name, exact: true }).first();
      // The list filter is debounced, so give the row a moment to appear.
      await link.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await this.page.waitForURL(/\/settings\/playbooks\/[^/]+$/);
        await this.deleteOpenPlaybook();
      }
    } catch {
      // Playbook was already deleted or not found.
    }
  }
}
