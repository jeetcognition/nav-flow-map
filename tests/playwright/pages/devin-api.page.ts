import { expect, Page, Locator } from "@playwright/test";
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

  /** Token generation success dialog. */
  readonly tokenDialog: Locator;
  /** Token value shown in the generation dialog. */
  readonly tokenValue: Locator;
  /** Dismiss the token dialog after copy/backup. */
  readonly saveTokenButton: Locator;
  /** Copy token to clipboard. */
  readonly copyTokenButton: Locator;

  /** Delete service-user confirmation dialog. */
  readonly deleteConfirmDialog: Locator;
  /** Delete confirmation button inside the dialog. */
  readonly deleteConfirmButton: Locator;
  /** Cancel button inside the delete confirmation dialog. */
  readonly deleteCancelButton: Locator;

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

    this.tokenDialog = page.getByRole("dialog").filter({ hasText: "Service user token generated" });
    this.tokenValue = this.tokenDialog.getByText(/^cog_[a-z0-9]+$/);
    this.saveTokenButton = this.tokenDialog.getByRole("button", { name: "I saved the token" });
    this.copyTokenButton = this.tokenDialog.getByRole("button", { name: "Copy token" }).first();

    this.deleteConfirmDialog = page
      .getByRole("dialog")
      .filter({ hasText: /Are you sure you want to delete the service user/ });
    this.deleteConfirmButton = this.deleteConfirmDialog.getByRole("button", {
      name: "Delete",
      exact: true,
    });
    this.deleteCancelButton = this.deleteConfirmDialog.getByRole("button", { name: "Cancel" });
  }

  rowByName(name: string): Locator {
    return this.tableRows.filter({ hasText: new RegExp(name, "i") });
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.devinApi(slug));
  }

  /**
   * Navigate to the page and capture the authenticated service-users API request the app
   * issues on load, returning the bearer Authorization header, the enterprise id in use, and
   * the API origin. Used by authorization/IDOR tests to replay requests with tampered inputs.
   */
  async captureServiceUsersApi(): Promise<{
    enterpriseId: string;
    authorization: string;
    baseUrl: string;
  }> {
    const [req] = await Promise.all([
      this.page.waitForRequest(
        (r) =>
          /\/api\/enterprise\/enterprise-[a-z0-9]+\/service-users(\?|$)/.test(r.url()) &&
          r.method() === "GET",
      ),
      this.goto(),
    ]);
    await this.heading.waitFor({ state: "visible" });
    const url = new URL(req.url());
    const enterpriseId = url.pathname.match(/enterprise-[a-z0-9]+/)![0];
    const authorization = req.headers()["authorization"] ?? "";
    return { enterpriseId, authorization, baseUrl: url.origin };
  }

  async ensureDeleted(name: string) {
    await this.goto();
    await this.searchInput.fill(name);
    await this.page.waitForLoadState("networkidle");
    const row = this.rowByName(name).first();
    if (!(await row.isVisible().catch(() => false))) return;
    await row.getByRole("button", { name: "Delete service user" }).click();
    await this.deleteConfirmButton.click();
    await expect(row).toHaveCount(0);
  }
}
