import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG } from "../support/paths";

/** Trigger types reachable directly from the Add trigger menu. */
export type DirectTrigger = "Webhook" | "Security scan" | "Snapshot build";
/** Trigger types that open a submenu of event kinds. */
export type SubmenuTrigger = "GitHub" | "Schedule" | "Slack" | "Linear" | "Jira";

// Automations live under a sub-org (Sidebar → Automations). Deep links to
// /automations redirect back to the sub-org home, so navigation always goes
// through the sidebar link.
export class AutomationsPage extends BasePage {
  protected readonly path = routes.subOrg();

  /** Sidebar navigation link to Automations. */
  readonly sidebarLink: Locator;
  /** Automations list page heading. */
  readonly heading: Locator;
  /** "All N" filter tab. */
  readonly allTab: Locator;
  /** "Created by you N" filter tab. */
  readonly createdByYouTab: Locator;
  /** Toolbar Filter button. */
  readonly filterButton: Locator;
  /** Toolbar Search button. */
  readonly searchButton: Locator;
  /** Toolbar Analytics button. */
  readonly analyticsButton: Locator;
  /** "Create automation" button on the list page (and create-page banner). */
  readonly createAutomationButton: Locator;
  /** "Manual" item in the Create automation menu. */
  readonly createManuallyLink: Locator;
  /** "Template" item in the Create automation menu. */
  readonly startFromTemplateLink: Locator;
  /** "Generate with Devin" item in the Create automation menu. */
  readonly generateWithDevinButton: Locator;

  /** Automation name input on the create/edit form. */
  readonly nameInput: Locator;
  /** Triggers section heading. */
  readonly triggersHeading: Locator;
  /** Header-level "Add trigger" button that opens the trigger type menu. */
  readonly addTriggerButton: Locator;
  /** All per-row "Remove trigger" buttons. */
  readonly removeTriggerButtons: Locator;
  /** Agent type combobox. */
  readonly agentTypeSelect: Locator;
  /** Instructions rich-text editor. */
  readonly instructionsEditor: Locator;
  /** Advanced section toggle. */
  readonly advancedToggle: Locator;
  /** Agent mode combobox in the Agent definition section. */
  readonly agentModeSelect: Locator;
  /** "Run as" identity combobox in the Agent definition section. */
  readonly runAsSelect: Locator;
  /** Manage MCPs button inside Advanced. */
  readonly manageMcpsButton: Locator;
  /** MCP search input inside Advanced. */
  readonly mcpSearchInput: Locator;
  /** "Add domain" button inside Network policy. */
  readonly addDomainButton: Locator;
  /** Network policy domain inputs (one per added entry). */
  readonly domainInputs: Locator;
  /** "Add metadata" button inside Advanced. */
  readonly addMetadataButton: Locator;
  /** "Add notification" button in the Notifications section. */
  readonly addNotificationButton: Locator;

  /** Webhook URL code block shown for a Webhook trigger. */
  readonly webhookUrlCode: Locator;
  /** Webhook secret code block (visible only while creating). */
  readonly webhookSecretCode: Locator;
  /** One-time secret warning shown while creating a webhook automation. */
  readonly secretOneTimeNotice: Locator;
  /** Inline `X-Webhook-Secret` header reference in the webhook help text. */
  readonly webhookSecretHeaderCode: Locator;
  /** Run-once schedule datetime input. */
  readonly runOnceInput: Locator;
  /** Custom schedule "Select schedule..." chip. */
  readonly selectScheduleButton: Locator;
  /** Schedule dialog (Visual / RRULE). */
  readonly scheduleDialog: Locator;
  /** RRULE tab button in the schedule dialog. */
  readonly rruleTab: Locator;
  /** Visual tab button in the schedule dialog. */
  readonly visualTab: Locator;
  /** RRULE string input in the schedule dialog. */
  readonly rruleInput: Locator;
  /** Apply button in the schedule dialog. */
  readonly applyScheduleButton: Locator;

  /** Detail page Edit button. */
  readonly editButton: Locator;
  /** Detail page "Run automation" button (opens the Run now confirmation). */
  readonly runNowButton: Locator;
  /** Detail page More actions menu button. */
  readonly moreActionsButton: Locator;
  /** Edit page Save button. */
  readonly saveButton: Locator;
  /** Detail page Events heading. */
  readonly eventsHeading: Locator;
  /** Links to sessions spawned by automation events. */
  readonly succeededEventLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebarLink = page.getByRole("link", { name: "Automations", exact: true }).first();
    this.heading = page.getByRole("heading", { name: "Automations", exact: true });
    this.allTab = page.getByRole("button", { name: /^All \d+$/ });
    this.createdByYouTab = page.getByRole("button", { name: /^Created by you \d+$/ });
    this.filterButton = page.getByRole("button", { name: "Filter", exact: true });
    this.searchButton = page.locator("main").getByRole("button", { name: "Search", exact: true });
    this.analyticsButton = page.getByRole("button", { name: "Analytics", exact: true });
    this.createAutomationButton = page.getByRole("button", { name: "Create automation" });
    this.createManuallyLink = page.getByRole("menuitem", { name: "Manual", exact: true });
    this.startFromTemplateLink = page.getByRole("menuitem", { name: "Template", exact: true });
    this.generateWithDevinButton = page.getByRole("menuitem", { name: /Generate with Devin/ });

    this.nameInput = page.getByRole("textbox", { name: "Automation name" });
    this.triggersHeading = page.getByRole("heading", { name: "Triggers" });
    this.addTriggerButton = page.getByRole("button", { name: "Add trigger", exact: true });
    this.removeTriggerButtons = page.getByRole("button", { name: "Remove trigger" });
    this.agentTypeSelect = page.getByRole("combobox", { name: "Agent type" });
    this.instructionsEditor = page.locator('main [contenteditable="true"]').first();
    this.advancedToggle = page.getByRole("button", { name: "Advanced", exact: true });
    this.agentModeSelect = page.getByRole("combobox", { name: "Select agent mode" });
    this.runAsSelect = page.getByRole("combobox", { name: "Run as", exact: true });
    this.manageMcpsButton = page.getByRole("button", { name: "Manage MCPs" });
    this.mcpSearchInput = page.getByRole("textbox", { name: "Search MCPs..." });
    this.addDomainButton = page.getByRole("button", { name: "Add domain" });
    this.domainInputs = page.getByRole("textbox", { name: /domain, IPv4, or IPv6/ });
    this.addMetadataButton = page.getByRole("button", { name: "Add metadata" });
    this.addNotificationButton = page.getByRole("button", { name: "Add notification" });

    this.webhookUrlCode = page
      .locator("main code")
      .filter({ hasText: /^https:\/\/.*\/api\/webhooks\/automations\// })
      .first();
    this.webhookSecretCode = page
      .locator("main code")
      .filter({ hasText: /^[A-Za-z0-9_-]{30,}$/ })
      .first();
    this.secretOneTimeNotice = page.getByText(/Copy this secret now/);
    this.webhookSecretHeaderCode = page
      .locator("main code")
      .filter({ hasText: "X-Webhook-Secret" })
      .first();
    this.runOnceInput = page.locator('main input[type="datetime-local"]');
    this.selectScheduleButton = page.getByRole("button", { name: "Select schedule..." });
    this.scheduleDialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.getByRole("button", { name: "Apply" }) });
    this.rruleTab = this.scheduleDialog.getByRole("button", { name: "RRULE" });
    this.visualTab = this.scheduleDialog.getByRole("button", { name: "Visual" });
    this.rruleInput = this.scheduleDialog.getByRole("textbox");
    this.applyScheduleButton = this.scheduleDialog.getByRole("button", { name: "Apply" });

    this.editButton = page.getByRole("button", { name: "Edit", exact: true });
    this.runNowButton = page.getByRole("button", { name: "Run automation" });
    this.moreActionsButton = page.getByRole("button", { name: "More actions" });
    this.saveButton = page.getByRole("button", { name: "Save", exact: true });
    this.eventsHeading = page.getByRole("heading", { name: "Events" });
    this.succeededEventLinks = page.getByRole("link", { name: /Succeeded/ });
  }

  /** Navigate to the Automations list via the sidebar (deep links redirect). */
  async open(slug: string = TEST_SUBORG) {
    await this.page.goto(routes.subOrg(slug));
    await this.sidebarLink.click();
    await this.page.waitForURL(/\/automations$/);
    await this.heading.waitFor({ state: "visible" });
  }

  /** Open the manual-create form from the list page. */
  async openCreateForm() {
    await this.createAutomationButton.first().click();
    await this.createManuallyLink.click();
    await this.page.waitForURL(/\/automations\/create$/);
    await this.triggersHeading.waitFor({ state: "visible" });
  }

  /**
   * Trigger types currently offered by the Add trigger menu. Provider-backed
   * types (Slack, Jira, …) are only listed when that integration is connected
   * for the enterprise, so specs read the menu instead of assuming a fixed set.
   */
  async availableTriggerTypes(): Promise<string[]> {
    await this.addTriggerButton.click();
    const menu = this.page.getByRole("menu", { name: "Add trigger" });
    await menu.waitFor({ state: "visible" });
    const types = (await menu.getByRole("menuitem").allInnerTexts()).map((t) => t.trim());
    await this.page.keyboard.press("Escape");
    await menu.waitFor({ state: "hidden" });
    return types;
  }

  /** Open the Add trigger menu and pick a direct trigger type. */
  async addTrigger(type: DirectTrigger) {
    await this.addTriggerButton.click();
    await this.page.getByRole("menuitem", { name: type, exact: true }).click();
  }

  /** Open the Add trigger menu and pick an event kind from a trigger submenu. */
  async addSubmenuTrigger(type: SubmenuTrigger, event: string) {
    const menu = await this.openAddTriggerMenu();
    await this.selectSubmenuEvent(menu, type, event);
  }

  /**
   * Same as {@link addSubmenuTrigger}, but for provider-backed types that the
   * menu only offers while that integration is connected. Presence is checked
   * inside the menu that is then used, because the menu drops unconnected
   * providers once connection state resolves — reading the offering from an
   * earlier menu and acting on a later one races that update.
   *
   * @returns whether the type was offered and therefore exercised.
   */
  async addSubmenuTriggerIfOffered(type: SubmenuTrigger, event: string): Promise<boolean> {
    const menu = await this.openAddTriggerMenu();
    if ((await menu.getByRole("menuitem", { name: type, exact: true }).count()) === 0) {
      await this.page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });
      return false;
    }
    await this.selectSubmenuEvent(menu, type, event);
    return true;
  }

  private async openAddTriggerMenu(): Promise<Locator> {
    await this.addTriggerButton.click();
    const menu = this.page.getByRole("menu", { name: "Add trigger" });
    await menu.waitFor({ state: "visible" });
    return menu;
  }

  /**
   * Move roving focus onto the menu item with the given label.
   *
   * Both the trigger menu and its submenus re-mount their items while they
   * settle, so any element a pointer or element-scoped action has targeted can
   * detach mid-action. Focus is therefore walked with ArrowDown and read from
   * `document.activeElement` at page level, which never holds a stale handle.
   */
  private async focusMenuItem(label: string, steps: number) {
    const focusedLabel = () =>
      this.page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("role") === "menuitem" ? (el.textContent ?? "").trim() : null;
      });
    for (let i = 0; i <= steps; i++) {
      if ((await focusedLabel()) === label) return;
      await this.page.keyboard.press("ArrowDown");
    }
    throw new Error(`menu item "${label}" never received focus (last: ${await focusedLabel()})`);
  }

  /**
   * Pick an event kind from an open trigger type's submenu, entirely by
   * keyboard: ArrowDown walks to the trigger type, ArrowRight opens its
   * submenu, ArrowDown walks to the wanted event and Enter activates it.
   */
  private async selectSubmenuEvent(menu: Locator, type: SubmenuTrigger, event: string) {
    await menu.getByRole("menuitem", { name: type, exact: true }).waitFor({ state: "visible" });
    await this.focusMenuItem(type, await menu.getByRole("menuitem").count());
    await this.page.keyboard.press("ArrowRight");
    const submenu = this.page.getByRole("menu", { name: type });
    await submenu.waitFor({ state: "visible" });
    await submenu.getByRole("menuitem", { name: event, exact: true }).waitFor({ state: "visible" });
    await this.focusMenuItem(event, await submenu.getByRole("menuitem").count());
    await this.page.keyboard.press("Enter");
    await submenu.waitFor({ state: "hidden" });
  }

  /** Remove every configured trigger row. */
  async removeAllTriggers() {
    while ((await this.removeTriggerButtons.count()) > 0) {
      await this.removeTriggerButtons.first().click();
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  /** Fill the Instructions editor. */
  async fillInstructions(text: string) {
    await this.instructionsEditor.click();
    await this.instructionsEditor.fill(text);
  }

  /**
   * Type a value into the trailing (empty) Network policy domain input and
   * commit it with Enter. Committing appends a fresh empty input row, so the
   * first call must be preceded by one `addDomainButton` click.
   */
  async commitDomainEntry(value: string) {
    const input = this.domainInputs.last();
    await input.fill(value);
    await input.press("Enter");
  }

  /** Submit the create form and wait for the detail page. */
  async submitCreate() {
    await this.createAutomationButton.click();
    await this.page.waitForURL(/\/automations\/[0-9a-f]+$/);
  }

  /** Trigger a manual run from the detail page and confirm the dialog. */
  async runNow() {
    await this.runNowButton.click();
    const dialog = this.page.locator('[role="dialog"]').filter({ hasText: "Run now" });
    await dialog.getByRole("button", { name: "Run", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
  }

  /** Open an automation's detail page from the list by its name. */
  async openByName(name: string) {
    await this.page
      .getByRole("link", { name: new RegExp(name) })
      .first()
      .click();
    await this.page.waitForURL(/\/automations\/[0-9a-f]+$/);
  }

  /** Delete the automation whose detail page is currently open. */
  async deleteOpenAutomation() {
    await this.moreActionsButton.click();
    await this.page.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = this.page.locator('[role="dialog"]').filter({ hasText: "Delete automation" });
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await this.page.waitForURL(/\/automations$/);
  }

  /** Best-effort deletion of an automation by name, for cleanup safety. */
  async deleteAutomationByName(name: string, slug: string = TEST_SUBORG) {
    try {
      await this.open(slug);
      const row = this.page.getByRole("link", { name: new RegExp(name) }).first();
      if (await row.isVisible().catch(() => false)) {
        await row.click();
        await this.page.waitForURL(/\/automations\/[0-9a-f]+$/);
        await this.deleteOpenAutomation();
      }
    } catch {
      // Automation was already deleted or never created.
    }
  }
}
