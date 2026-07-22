import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG, TEST_SUBORG_DISPLAY } from "../support/paths";

export class SettingsRootPage extends BasePage {
  protected readonly path = routes.settingsRoot();

  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly productsHeading: Locator;
  readonly resourcesHeading: Locator;
  readonly administrationHeading: Locator;
  readonly contentArea: Locator;
  readonly globalSearch: Locator;
  readonly childLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      name: TEST_SUBORG_DISPLAY,
      exact: true,
    });
    this.subtitle = page.getByText("Organization preferences and settings");
    this.productsHeading = page.getByRole("heading", {
      name: "Products",
      exact: true,
    });
    this.resourcesHeading = page.getByRole("heading", {
      name: "Resources",
      exact: true,
    });
    this.administrationHeading = page.getByRole("heading", {
      name: "Administration",
      exact: true,
    });
    this.contentArea = page.getByTestId("content");
    this.globalSearch = page.locator('input[placeholder="Search settings..."]');
    this.childLinks = this.contentArea.getByRole("link");
  }

  async goto(slug: string = TEST_SUBORG) {
    await this.page.goto(routes.settingsRoot(slug));
  }

  childLink(name: string): Locator {
    // The content area contains the root links; the sidebar also duplicates some.
    return this.contentArea.getByRole("link", { name, exact: true }).first();
  }
}
