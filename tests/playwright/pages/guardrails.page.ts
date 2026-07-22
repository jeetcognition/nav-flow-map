import { type Page, type Locator, expect } from "@playwright/test";
import { ENTERPRISE_SLUG, routes } from "../support/paths";
import { BasePage } from "./base.page";

export class GuardrailsPage extends BasePage {
  protected readonly path = routes.guardrails();

  readonly heading: Locator;
  readonly description: Locator;
  readonly guardrailsTab: Locator;
  readonly violationsTab: Locator;
  readonly infoPanels: Locator;
  readonly guardrailCombos: Locator;
  readonly contentArea: Locator;
  readonly guardrailFilter: Locator;
  readonly orgFilter: Locator;
  readonly violationsTable: Locator;
  readonly globalSearch: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Guardrails", exact: true }).first();
    this.description = page.getByText(
      "Guardrails stop risky requests before they reach your data or tools",
    );
    this.guardrailsTab = page.getByRole("tab", { name: "Guardrails", exact: true });
    this.violationsTab = page.getByRole("tab", { name: "Violations", exact: true });
    this.infoPanels = page.locator("[data-testid='content']").getByRole("heading");
    this.guardrailCombos = page
      .getByTestId("content")
      .getByRole("combobox")
      .filter({ hasText: /^(Off|Warn user|Block message|Log only|kill_session)$/i });
    this.contentArea = page.getByTestId("content");
    this.guardrailFilter = page
      .getByTestId("content")
      .getByRole("combobox")
      .filter({ hasText: /^All guardrails$/ });
    this.orgFilter = page
      .getByTestId("content")
      .getByRole("combobox")
      .filter({ hasText: /^All organizations$/ });
    this.violationsTable = page.getByTestId("content").getByRole("table");
    this.globalSearch = page.locator('input[placeholder="Search settings..."]');
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.guardrails(slug));
  }

  guardrailAction(name: string): Locator {
    const row = this.contentArea
      .locator("div")
      .filter({ hasText: new RegExp(`^${name}`) })
      .first();
    return row.getByRole("combobox").first();
  }
}
