import { type Page, type Locator } from "@playwright/test";
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
}
