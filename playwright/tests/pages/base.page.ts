import { Page } from '@playwright/test';

// Root of all page objects. Holds the Playwright `page` and a path to navigate to.
// Concrete pages set `path` (or override `goto`) and expose their own locators.
export abstract class BasePage {
  /** Route relative to baseURL. Override in subclasses; leave undefined for dynamic pages. */
  protected readonly path?: string;

  constructor(protected readonly page: Page) {}

  /** Navigate to this page's path. Pass an explicit path to override. */
  async goto(path: string | undefined = this.path) {
    if (!path) throw new Error(`${this.constructor.name} has no path to navigate to.`);
    await this.page.goto(path);
  }
}
