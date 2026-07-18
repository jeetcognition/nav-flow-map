import { Page } from "@playwright/test";

// Root of all page objects. Holds the Playwright `page` and a route to navigate to.
// Concrete pages set `path` and expose their own locators.
export abstract class BasePage {
  /** Route relative to baseURL. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async goto() {
    if (!this.path) {
      throw new Error(`${this.constructor.name} has no path to navigate to.`);
    }
    await this.page.goto(this.path);
  }
}
