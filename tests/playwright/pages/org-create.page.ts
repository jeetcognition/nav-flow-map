import { type Page, type Locator } from "@playwright/test";
import { ENTERPRISE_SLUG, routes } from "../support/paths";
import { BasePage } from "./base.page";

export class OrgCreatePage extends BasePage {
  protected readonly path = routes.orgCreate();

  readonly heading: Locator;
  readonly backButton: Locator;
  readonly nameInput: Locator;
  readonly acuInput: Locator;
  readonly addMeCheckbox: Locator;
  readonly memberSearchInput: Locator;
  readonly memberTable: Locator;
  readonly memberCheckboxes: Locator;
  readonly selectAllMembersCheckbox: Locator;
  readonly noMembersFound: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly selectedCount: Locator;
  readonly noPermissionsByDefault: Locator;
  readonly repoPermissionsLink: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Create organization", exact: true });
    this.backButton = page.getByRole("button", { name: "Back to Organizations" });
    this.nameInput = page.getByRole("textbox", { name: "Organization name" });
    this.acuInput = page.getByRole("spinbutton", { name: "Billing cycle ACU limit" });
    this.addMeCheckbox = page.getByRole("checkbox", { name: /Add me as a member/ });
    this.memberSearchInput = page.getByRole("textbox", { name: "Search members..." });
    this.memberTable = page.getByRole("table");
    this.memberCheckboxes = page.getByRole("checkbox", { name: "Select member" });
    this.selectAllMembersCheckbox = page.getByRole("checkbox", { name: "Select all members" });
    this.noMembersFound = page.getByText("No members found", { exact: true });
    this.previousPageButton = page.getByRole("button", { name: "Go to previous page" });
    this.nextPageButton = page.getByRole("button", { name: "Go to next page" });
    this.selectedCount = page.getByText(/\d+ members? selected/);
    this.noPermissionsByDefault = page.getByText("No permissions by default", { exact: true });
    this.repoPermissionsLink = page.getByRole("link", { name: "repository permissions" });
    this.cancelButton = page.getByRole("button", { name: "Cancel", exact: true });
    this.createButton = page.getByRole("button", { name: "Create", exact: true });
    this.successMessage = page.getByText("Successfully created organization");
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.orgCreate(slug));
  }

  /**
   * Toggle a member checkbox with the keyboard. Mouse clicks on these base-ui
   * checkboxes are intercepted by the row wrapper and silently dropped on
   * pages after the first, so Space is the only reliable toggle.
   */
  async toggleMemberCheckbox(checkbox: Locator) {
    await checkbox.focus();
    await this.page.keyboard.press("Space");
  }

  memberRow(text: string): Locator {
    return this.page.getByRole("row", { name: /Select member/ }).filter({ hasText: text });
  }

  acuValidationMessage(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
