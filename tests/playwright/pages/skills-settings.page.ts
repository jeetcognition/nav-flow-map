import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

export class SkillsSettingsPage extends BasePage {
  protected readonly path = routes.enterpriseSkills();

  readonly heading: Locator;
  readonly usageOverTimeHeading: Locator;
  readonly mostInvokedHeading: Locator;
  readonly taskTypesHeading: Locator;
  readonly searchInput: Locator;
  readonly viewSessionsLink: Locator;
  readonly noSkillsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Skills", exact: true, level: 2 });
    this.usageOverTimeHeading = page.getByRole("heading", { name: "Usage over time" });
    this.mostInvokedHeading = page.getByRole("heading", { name: "Most invoked skills" });
    this.taskTypesHeading = page.getByRole("heading", { name: "Task types" });
    this.searchInput = page.getByPlaceholder("Search skills or sources...");
    this.viewSessionsLink = page.getByRole("link", { name: "View sessions" }).first();
    this.noSkillsMessage = page.getByText("No skills match your search");
  }

  private filter(label: string): Locator {
    return this.page.getByRole("combobox").filter({ hasText: new RegExp(`^${label}$`) });
  }

  async openFilter(label: string) {
    const combo = this.filter(label);
    await combo.click();
    await this.page.getByRole("listbox").waitFor({ state: "visible" });
  }

  async selectFilterOption(label: string, option: string) {
    await this.openFilter(label);
    await this.page
      .getByRole("option")
      .filter({ hasText: new RegExp(`^${option}$`) })
      .first()
      .click();
    await this.page
      .getByRole("listbox")
      .waitFor({ state: "hidden" })
      .catch(() => {});
  }

  async closeFilterWithEscape() {
    await this.page.keyboard.press("Escape");
    await this.page
      .getByRole("listbox")
      .waitFor({ state: "hidden" })
      .catch(() => {});
  }

  async getActiveRuntimeLabel(): Promise<string> {
    return (await this.page.getByRole("combobox").first().textContent())?.trim() ?? "";
  }

  async getActiveDateLabel(): Promise<string> {
    return (await this.page.getByRole("combobox").nth(1).textContent())?.trim() ?? "";
  }

  async expectCoreSectionsVisible() {
    await expect(this.heading).toBeVisible();
    await expect(this.usageOverTimeHeading).toBeVisible();
    await expect(this.mostInvokedHeading).toBeVisible();
    await expect(this.taskTypesHeading).toBeVisible();
  }
}
