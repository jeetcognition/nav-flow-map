import { Page } from '@playwright/test';
import { SubOrgPage } from './sub-org.page';
import { routes, SUB_ORG } from '../support/paths';

// Review page (/org/{slug}/review).
// SCAFFOLD: no live DOM snapshot captured yet — add page-specific locators here once observed
// (run `node scripts/element-map.mjs /org/<slug>/review`).
export class ReviewPage extends SubOrgPage {
  protected readonly path = routes.review();

  constructor(page: Page, private readonly slug: string = SUB_ORG) {
    super(page);
  }

  async goto() { await this.page.goto(routes.review(this.slug)); }
}
