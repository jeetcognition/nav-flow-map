import { Page, Locator } from "@playwright/test";
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

  /** Entry page "Back to Knowledge" button. */
  readonly backToKnowledge: Locator;
  /** Details tab on a knowledge entry. */
  readonly detailsTab: Locator;
  /** Usage tab on a knowledge entry. */
  readonly usageTab: Locator;

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
    this.cancelButton = page.getByRole("button", { name: "Cancel" });

    this.backToKnowledge = page.getByRole("button", { name: "Back to Knowledge" });
    this.detailsTab = page.getByRole("tab", { name: "Details" });
    this.usageTab = page.getByRole("tab", { name: "Usage" });
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

  /** Click the checkbox for the first row that contains `name`. */
  async selectRow(name: string) {
    const row = this.tableRows.filter({ hasText: name }).first();
    await row.locator("span[role='checkbox']").click();
  }
}
