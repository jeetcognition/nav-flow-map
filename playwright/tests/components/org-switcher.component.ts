import { Page, Locator } from '@playwright/test';

// The breadcrumb org switcher in the top banner. Clicking the current-org button opens a menu
// with a search box and a menuitem per organization. This IS the org-switcher UI used in ENT-003.
export class OrgSwitcher {
  /** The breadcrumb button showing the current org/sub-org name (also opens the menu). */
  readonly trigger: Locator;
  /** The open menu container. */
  readonly menu: Locator;
  /** Search box inside the open menu. */
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.trigger = page.getByRole('navigation', { name: 'breadcrumb' }).getByRole('button').first();
    this.menu = page.getByRole('menu');
    this.searchInput = page.getByRole('textbox', { name: 'Search organizations' });
  }

  /** A menuitem for a given org name within the open switcher menu. */
  orgOption(name: string): Locator {
    return this.menu.getByRole('menuitem', { name: new RegExp(name, 'i') });
  }

  async open() {
    await this.trigger.click();
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /** Open the switcher and select a sub-org by name. */
  async switchTo(orgName: string) {
    await this.open();
    await this.orgOption(orgName).first().click();
  }
}
