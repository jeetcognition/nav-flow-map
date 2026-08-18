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
    // The app issues its own client-side navigation right after some routes load (e.g. leaving
    // enterprise settings), which aborts a pending "load" navigation. Waiting for
    // domcontentloaded and retrying once on an aborted request keeps navigation deterministic.
    try {
      await this.page.goto(this.path, { waitUntil: "domcontentloaded" });
    } catch (error) {
      if (!/ERR_ABORTED/.test(String(error))) throw error;
      await this.page.goto(this.path, { waitUntil: "domcontentloaded" });
    }
  }
}
