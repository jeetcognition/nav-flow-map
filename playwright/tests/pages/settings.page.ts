import { Page } from '@playwright/test';
import { SubOrgPage } from './sub-org.page';
import { routes, SUB_ORG } from '../support/paths';

// Settings page (/org/{slug}/settings).
// SCAFFOLD: no live DOM snapshot captured yet — add settings controls here once observed
// (e.g. Secure mode toggle for ENT-037). Run `node scripts/element-map.mjs /org/<slug>/settings`.
export class SettingsPage extends SubOrgPage {
  protected readonly path = routes.settings();

  constructor(page: Page, private readonly slug: string = SUB_ORG) {
    super(page);
  }

  async goto() { await this.page.goto(routes.settings(this.slug)); }
}
