import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ALT_SUBORG_NAME } from "../support/paths";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function orgFilterPattern() {
  return new RegExp(
    `^(?:All organizations|Organizations \\d+|.+\\s*organization.*|${escapeRegex(ALT_SUBORG_NAME)})$`,
    "i",
  );
}

export const MEMBER_COLUMNS = ["Name", "Email", "Organizations", "Enterprise role"];

export class MembershipPage extends BasePage {
  protected readonly path = routes.membership();

  readonly heading: Locator;
  readonly learnMoreLink: Locator;
  readonly tabs: Locator;
  readonly membersTab: Locator;
  readonly rolesTab: Locator;
  readonly groupsTab: Locator;
  readonly searchInput: Locator;
  readonly inviteButton: Locator;
  readonly memberTable: Locator;
  readonly noMembersFound: Locator;
  readonly noMembersHint: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Membership", exact: true });
    this.learnMoreLink = page.getByRole("link").filter({ hasText: /Learn more/ });
    this.tabs = page.locator('button[role="tab"]');
    this.membersTab = this.tabs.filter({ hasText: /^Members/ });
    this.rolesTab = this.tabs.filter({ hasText: /^Roles/ });
    this.groupsTab = this.tabs.filter({ hasText: /^Groups/ });
    this.searchInput = page.getByPlaceholder("Search for a member");
    this.inviteButton = page.locator("button").filter({ hasText: /^Invite members$/ });
    this.memberTable = page.locator("table tbody");
    this.noMembersFound = page.getByText("No members found", { exact: true });
    this.noMembersHint = page.getByText("Try a different search or filter.");
  }

  /** Navigate to the members tab with a cold load. */
  async goto() {
    await this.page.goto(routes.membershipTab("members"));
  }

  /** Find the first table row whose visible text contains the member name. */
  memberRow(name: string): Locator {
    return this.page
      .locator("table tbody tr")
      .filter({ hasText: new RegExp(escapeRegex(name), "i") })
      .first();
  }

  /** The role selector button inside a member row. */
  rowRoleButton(row: Locator): Locator {
    return row.getByRole("combobox");
  }

  /** The organizations count button inside a member row (zero if absent). */
  rowOrgButton(row: Locator): Locator {
    return row.locator("td").nth(3).locator("button").first();
  }

  /** Visible table column headers (empty selection/action columns are trimmed). */
  async tableHeaders(): Promise<string[]> {
    return this.page
      .locator("table thead th")
      .allTextContents()
      .then((list) => list.map((h) => h.trim()).filter(Boolean));
  }

  /** Open the Invite members dialog and wait for it to be visible. */
  async openInviteDialog() {
    await this.inviteButton.click();
    await this.inviteDialog().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** The Invite members dialog. */
  inviteDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: "Invite members" });
  }

  /** Close the Invite members dialog via its first Close control. */
  async closeInviteDialog() {
    const close = this.inviteDialog().locator("button[data-dd-action-name='Close']").first();
    await close.click();
    try {
      await this.inviteDialog().waitFor({ state: "hidden", timeout: 2_000 });
    } catch {
      // Some tokenized inputs intercept the close control; fall back to Escape.
      await this.page.keyboard.press("Escape");
      await this.inviteDialog().waitFor({ state: "hidden", timeout: 8_000 });
    }
  }

  /** Search for members in the main table search field. */
  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /** Clear the main table search and wait for results to repopulate. */
  async clearSearch() {
    await this.searchInput.fill("");
    await expect(this.memberTable.locator("tr").first()).toBeVisible({ timeout: 15_000 });
  }

  /** Trigger button for the organization filter. */
  orgFilterTrigger(): Locator {
    return this.page.locator("button").filter({ hasText: orgFilterPattern() }).first();
  }

  /** Trigger button for the enterprise role filter. */
  roleFilterTrigger(): Locator {
    return this.page
      .locator("button")
      .filter({ hasText: /^(?:All enterprise roles|Admin|Member)$/ })
      .first();
  }

  /** All organizations filter dialog (matched by heading or current selection). */
  orgFilterDialog(): Locator {
    return this.page
      .getByRole("dialog")
      .filter({ hasText: new RegExp(`All organizations|${escapeRegex(ALT_SUBORG_NAME)}`, "i") });
  }

  /** All enterprise roles filter dialog (matched by heading or current selection). */
  roleFilterDialog(): Locator {
    return this.page.getByRole("dialog").filter({ hasText: /All enterprise roles|Admin|Member/i });
  }

  /** Open the All organizations filter dropdown. */
  async openOrgFilter() {
    await this.orgFilterTrigger().click();
    await this.orgFilterDialog().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Open the All enterprise roles filter dropdown. */
  async openRoleFilter() {
    await this.roleFilterTrigger().click();
    await this.roleFilterDialog().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Click a visible option by name in an open filter dialog (no search). */
  async clickFilterOption(dialog: Locator, name: string) {
    const option = dialog
      .locator("div")
      .filter({ hasText: new RegExp(`^${name}$`) })
      .last();
    await option.waitFor({ state: "visible", timeout: 10_000 });
    await option.click();
    await dialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Search within a filter dialog and select the matching option. */
  async selectFilterOption(dialog: Locator, name: string) {
    const search = dialog.locator("input").first();
    // Focus and type so the dropdown list filters.
    await search.click();
    await this.page.keyboard.insertText(name);
    const option = dialog
      .locator("div")
      .filter({ hasText: new RegExp(`^${name}$`) })
      .last();
    await option.waitFor({ state: "visible", timeout: 10_000 });
    await option.click();
    await dialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /** Clear the organization filter back to All organizations. */
  async clearOrgFilter() {
    await this.openOrgFilter();
    await this.clickFilterOption(this.orgFilterDialog(), "All organizations");
    await this.memberTable.waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Clear the role filter back to All enterprise roles. */
  async clearRoleFilter() {
    await this.openRoleFilter();
    await this.clickFilterOption(this.roleFilterDialog(), "All enterprise roles");
    await this.memberTable.waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Open an org-count popover for a member row that has organizations. */
  async openOrgCountPopover(row: Locator) {
    await this.rowOrgButton(row).click();
    await this.orgCountPopover().waitFor({ state: "visible", timeout: 10_000 });
  }

  /** The organization count popover. */
  orgCountPopover(): Locator {
    return this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /\d+\s*members/ })
      .last();
  }

  /** Close any open popover by pressing Escape. */
  async closePopover() {
    await this.page.keyboard.press("Escape");
    await this.orgCountPopover()
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  }

  /** Open a member row's role dropdown and choose the given role. Handles upgrade confirmation. */
  async changeRole(row: Locator, targetRole: "Admin" | "Member") {
    const roleBtn = this.rowRoleButton(row);
    const currentRole = await roleBtn.textContent();
    if ((currentRole ?? "").trim() === targetRole) return;

    await roleBtn.click();
    const list = this.page
      .locator('[role="listbox"], [role="dialog"]')
      .filter({ hasText: /Admin|Member/ })
      .last();
    await list
      .locator("div")
      .filter({ hasText: new RegExp(`^${targetRole}$`) })
      .last()
      .click();

    if (targetRole === "Admin") {
      const confirm = this.page
        .getByRole("dialog")
        .filter({ hasText: "Upgrading to Enterprise Admin" });
      const understood = confirm.getByRole("button").filter({ hasText: "Understood" });
      if (await understood.isVisible().catch(() => false)) {
        await understood.click();
      }
    }
  }

  /** Assert the member table is populated (at least one row). */
  async expectTablePopulated() {
    await expect(this.memberTable.locator("tr").first()).toBeVisible();
  }

  /** Invite an email with the default Member role through the Invite dialog. */
  async inviteMember(email: string) {
    await this.openInviteDialog();
    const dlg = this.inviteDialog();
    await dlg.getByPlaceholder("Ex. user@example.com, user2@example.com").fill(email);
    await dlg.locator("button").filter({ hasText: /^Add$/ }).click();
    await dlg.waitFor({ state: "hidden", timeout: 15_000 });
  }

  /** Select a member row via its checkbox cell, revealing the bulk-action toolbar. */
  async selectRow(row: Locator) {
    await row.locator("td").first().locator("div").first().click();
    await this.toolbarButton("Remove members").waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Select the row if it is not already selected (bulk actions clear selection). */
  async ensureRowSelected(row: Locator) {
    const checkbox = row.locator('[role="checkbox"]').first();
    if ((await checkbox.getAttribute("aria-checked")) !== "true") {
      await this.selectRow(row);
    }
  }

  /** A button in the bulk-action toolbar shown when rows are selected. */
  toolbarButton(name: string): Locator {
    return this.page.locator("button").filter({ hasText: new RegExp(`^${escapeRegex(name)}$`) });
  }

  /** Toggle an org row in a dialog until the confirm button enables (clicks can miss the checkbox). */
  private async selectDialogOrg(dlg: Locator, orgName: string, confirm: Locator) {
    const option = dlg
      .locator("label")
      .filter({ hasText: new RegExp(`^${escapeRegex(orgName)}$`) })
      .first();
    const checkbox = option.getByRole("checkbox");
    for (let attempt = 0; attempt < 3; attempt++) {
      await checkbox.click();
      try {
        await expect(confirm).toBeEnabled({ timeout: 3_000 });
        return;
      } catch {
        // Retry the toggle.
      }
    }
    const state = {
      options: await dlg.locator("label").allTextContents(),
      checked: await checkbox.getAttribute("aria-checked").catch(() => "missing"),
      buttons: await dlg.locator("button").allTextContents(),
    };
    throw new Error(`Could not select "${orgName}" in the dialog: ${JSON.stringify(state)}`);
  }

  /** Add the selected members to an organization (default org role). */
  async addOrganizationToSelection(orgName: string) {
    await this.toolbarButton("Add organizations").click();
    const dlg = this.page.getByRole("dialog").filter({ hasText: "Add organizations" });
    await dlg.waitFor({ state: "visible", timeout: 10_000 });
    await dlg.getByPlaceholder("Search organizations...").fill(orgName);
    const next = dlg.locator("button").filter({ hasText: /^Next$/ });
    await this.selectDialogOrg(dlg, orgName, next);
    await next.click();
    await dlg
      .locator("button")
      .filter({ hasText: /^Add \d+ organizations?$/ })
      .click();
    await dlg.waitFor({ state: "hidden", timeout: 15_000 });
  }

  /** Remove an organization from the selected members. */
  async removeOrganizationsFromSelection(orgName: string) {
    await this.toolbarButton("Remove organizations").click();
    const dlg = this.page.getByRole("dialog").filter({ hasText: "Remove organizations" });
    await dlg.waitFor({ state: "visible", timeout: 10_000 });
    const confirm = dlg.locator("button").filter({ hasText: /^Remove \d+ organizations?$/ });
    await this.selectDialogOrg(dlg, orgName, confirm);
    await confirm.click();
    await dlg.waitFor({ state: "hidden", timeout: 15_000 });
  }

  /** Remove the selected members from the enterprise (confirms the dialog). */
  async removeSelectedMembers() {
    await this.toolbarButton("Remove members").click();
    const dlg = this.page
      .getByRole("dialog")
      .filter({ hasText: "Remove members from enterprise?" });
    await dlg.waitFor({ state: "visible", timeout: 10_000 });
    await dlg
      .locator("button")
      .filter({ hasText: /^Remove$/ })
      .click();
    await dlg.waitFor({ state: "hidden", timeout: 15_000 });
  }
}
