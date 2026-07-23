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
  /** "Create manually" link (empty state and create dialog). */
  readonly createManuallyLink: Locator;
  /** "Start from template" link. */
  readonly startFromTemplateLink: Locator;
  /** "Generate with Devin" option. */
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
  /** Agent mode combobox inside Advanced. */
  readonly agentModeSelect: Locator;
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
  /** Detail page Run now button. */
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
    this.createManuallyLink = page.getByRole("link", { name: /Create manually/ });
    this.startFromTemplateLink = page.getByRole("link", { name: /Start from template/ });
    this.generateWithDevinButton = page.getByRole("button", { name: /Generate with Devin/ });

    this.nameInput = page.getByRole("textbox", { name: "Automation name" });
    this.triggersHeading = page.getByRole("heading", { name: "Triggers" });
    this.addTriggerButton = page.getByRole("button", { name: "Add trigger", exact: true });
    this.removeTriggerButtons = page.getByRole("button", { name: "Remove trigger" });
    this.agentTypeSelect = page.getByRole("combobox", { name: "Agent type" });
    this.instructionsEditor = page.locator('main [contenteditable="true"]').first();
    this.advancedToggle = page.getByRole("button", { name: "Advanced", exact: true });
    this.agentModeSelect = page.locator("main").getByRole("combobox").nth(1);
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
    this.runNowButton = page.getByRole("button", { name: "Run now" });
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

  /** Open the Add trigger menu and pick a direct trigger type. */
  async addTrigger(type: DirectTrigger) {
    await this.addTriggerButton.click();
    await this.page.getByRole("menuitem", { name: type, exact: true }).click();
  }

  /** Open the Add trigger menu and pick an event kind from a trigger submenu. */
  async addSubmenuTrigger(type: SubmenuTrigger, event: string) {
    await this.addTriggerButton.click();
    await this.page.getByRole("menuitem", { name: type, exact: true }).hover();
    const submenu = this.page.getByRole("menu", { name: type });
    await submenu.getByRole("menuitem", { name: event, exact: true }).click();
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
