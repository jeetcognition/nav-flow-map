import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class SkillsPage extends BasePage {
  protected readonly path = routes.enterpriseSkills();

  readonly heading = this.page.getByRole("heading", { name: "Skills", exact: true });
  readonly description = this.page.getByText(
    "Understand how skills are used across your enterprise.",
  );
  readonly backToEnterprise = this.page.getByRole("button", { name: "Back to enterprise" });

  readonly runtimeFilter = this.page.getByRole("combobox").filter({ hasText: /Cloud|Local/i });
  readonly dateFilter = this.page.getByRole("combobox").filter({ hasText: /Last \d+ days/i });
  readonly searchInput = this.page
    .locator('input[placeholder="Search skills or sources..."]')
    .first();
  readonly table = this.page.locator("table").first();
  readonly tableRows = this.table.locator("tbody tr");
  readonly usageChart = this.page.locator("text=Usage over time").first();
  readonly mostInvokedCard = this.page.locator("text=Most invoked skills").first();
  readonly taskTypesCard = this.page.locator("text=Task types").first();

  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.enterpriseSkills(slug));
  }

  skillRow(name: string): Locator {
    return this.table.locator("tr").filter({ hasText: name });
  }

  async selectRuntime(label: string) {
    await this.runtimeFilter.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  async selectDateRange(label: string) {
    await this.dateFilter.click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }
}
