import { type Page, type Locator, type Response } from "@playwright/test";
import { ENTERPRISE_SLUG, routes } from "../support/paths";
import { BasePage } from "./base.page";

export class OrganizationsPage extends BasePage {
  protected readonly path = routes.organizations();

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly headerRow: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly backToEnterprise: Locator;
  readonly content: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Organizations", exact: true }).first();
    this.searchInput = page.getByPlaceholder("Search for an organization");
    this.createButton = page.getByRole("button", { name: /Create organization/ });
    this.content = page.getByTestId("content");
    this.table = this.content.getByRole("table");
    this.rows = this.content.getByRole("row");
    this.headerRow = this.content.getByRole("row").first();
    this.previousButton = page.getByRole("button", { name: /Go to previous page/ });
    this.nextButton = page.getByRole("button", { name: /Go to next page/ });
    this.backToEnterprise = page.getByRole("button", { name: /Back to enterprise/ }).first();
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.organizations(slug));
  }

  rowByName(name: string): Locator {
    return this.content.getByRole("row").filter({ hasText: new RegExp(name, "i") });
  }

  /** "Manage <org>" dialog opened from a row's edit control. */
  get manageDialog(): Locator {
    return this.page.getByRole("dialog");
  }

  get nameInput(): Locator {
    return this.page.locator("#displayName");
  }

  get acuInput(): Locator {
    return this.page.locator("#maxAcuLimit");
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: "Save changes" });
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press("Enter");
  }

  async openManageDialog(name: string) {
    await this.rowByName(name).getByRole("button", { name: "Update name and limits" }).click();
    await this.nameInput.waitFor();
  }

  /** Clicks Save and resolves with the PATCH /api/enterprise/organizations response. */
  async saveAndWaitForPatch(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.request().method() === "PATCH" && r.url().includes("/api/enterprise/organizations/"),
      ),
      this.saveButton.click(),
    ]);
    return response;
  }

  /** Captures the app's bearer token by reloading and sniffing an API request. */
  async captureAuthorizationHeader(): Promise<string> {
    const requestPromise = this.page.waitForRequest(
      (r) => r.url().includes("/api/") && Boolean(r.headers()["authorization"]),
    );
    await this.page.reload();
    return (await requestPromise).headers()["authorization"];
  }
}
