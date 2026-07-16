import { Page } from '@playwright/test';
import { SubOrgPage } from './sub-org.page';
import { routes, SUB_ORG } from '../support/paths';

// Automations page (/org/{slug}/automations).
// SCAFFOLD: no live DOM snapshot captured yet — add page-specific locators here once observed
// (run `node scripts/element-map.mjs /org/<slug>/automations`).
export class AutomationsPage extends SubOrgPage {
  protected readonly path = routes.automations();

  constructor(page: Page, private readonly slug: string = SUB_ORG) {
    super(page);
  }

  async goto() { await this.page.goto(routes.automations(this.slug)); }
}
