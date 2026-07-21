import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

// Enterprise Settings root page (/org/{tenant}/settings).
export class EnterpriseSettingsPage extends BasePage {
  protected readonly path = routes.enterpriseSettings;

  readonly heading: Locator;
  readonly breadcrumb: Locator;
  readonly backToAppButton: Locator;
  readonly settingsSearchInput: Locator;
  readonly enterpriseName: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: /Enterprise Settings/i }).first();
    this.breadcrumb = page.getByText(/Settings.*Enterprise/i).first();
    this.backToAppButton = page.getByRole("button", { name: /Back to app/i });
    this.settingsSearchInput = page
      .getByPlaceholder(/Search settings/i)
      .or(page.getByRole("textbox", { name: /Search settings/i }))
      .first();
    this.enterpriseName = page.getByText(new RegExp(ENTERPRISE_SLUG, "i")).first();
  }

  /** A settings card/link by its visible name. */
  card(name: string): Locator {
    return this.page
      .getByRole("link", { name })
      .or(this.page.getByRole("button", { name }))
      .or(this.page.locator(`[data-testid*="${name.toLowerCase().replace(/\s+/g, "-")}"]`))
      .first();
  }

  /** A card by text (heading or body). */
  cardByText(name: string): Locator {
    return this.page.getByText(name, { exact: false }).first();
  }

  async openCard(name: string) {
    await this.card(name).click();
    await this.page.waitForTimeout(500);
  }

  async searchSettings(query: string) {
    await this.settingsSearchInput.fill(query);
    await this.page.waitForTimeout(300);
  }
}
