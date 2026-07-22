import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class DevinApiPage extends BasePage {
  protected readonly path = routes.devinApi();

  /** Main page heading. */
  readonly heading: Locator;
  /** Back to enterprise settings. */
  readonly backToEnterprise: Locator;
  /** Service users tab. */
  readonly serviceUsersTab: Locator;
  /** Legacy API tab. */
  readonly legacyApiTab: Locator;
  /** Organization filter combobox. */
  readonly orgFilter: Locator;
  /** Role filter combobox. */
  readonly roleFilter: Locator;
  /** Search input for service users. */
  readonly searchInput: Locator;
  /** Provision dropdown trigger. */
  readonly provisionButton: Locator;
  /** Service users table. */
  readonly table: Locator;
  /** Table body rows. */
  readonly tableRows: Locator;
  /** Empty-state message for the service users list. */
  readonly emptyState: Locator;

  /** Create service user form. */
  readonly createForm: Locator;
  /** Display name input inside the create form. */
  readonly nameInput: Locator;
  /** Role selector inside the create form. */
  readonly roleSelector: Locator;
  /** Expiration selector inside the create form. */
  readonly expiresSelector: Locator;
  /** Cancel button in the create form. */
  readonly cancelButton: Locator;
  /** Submit button in the create form. */
  readonly createSubmitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Devin API", exact: true });
    this.backToEnterprise = page.getByRole("button", { name: "Back to enterprise" });
    this.serviceUsersTab = page.getByRole("tab", { name: /Service users/ });
    this.legacyApiTab = page.getByRole("tab", { name: /Legacy API/ });
    this.orgFilter = page.locator('[role="combobox"]').nth(0);
    this.roleFilter = page.locator('[role="combobox"]').nth(1);
    this.searchInput = page.locator('input[placeholder="Search for a service user"]').first();
    this.provisionButton = page.getByRole("button", { name: "Provision" });
    this.table = page.locator("table").first();
    this.tableRows = this.table.locator("tbody tr");
    this.emptyState = page.getByText("No service users yet");

    this.createForm = page.locator("main").locator("form").first();
    this.nameInput = page.locator('input[placeholder="Enter display name"]').first();
    this.roleSelector = page.locator('[role="combobox"]').nth(2);
    this.expiresSelector = page.locator('[role="combobox"]').nth(3);
    this.cancelButton = page.getByRole("button", { name: "Cancel" });
    this.createSubmitButton = page.getByRole("button", { name: "Provision service user" });
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.devinApi(slug));
  }
}
