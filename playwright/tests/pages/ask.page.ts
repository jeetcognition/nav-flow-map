import { Page, Locator } from '@playwright/test';
import { SubOrgPage } from './sub-org.page';
import { routes, SUB_ORG } from '../support/paths';

// The "Ask" / search page (URL is /search, nav label is "Ask").
export class AskPage extends SubOrgPage {
  protected readonly path = routes.ask();

  readonly heading: Locator;
  /** The question/search prompt textbox. */
  readonly promptInput: Locator;

  constructor(page: Page, private readonly slug: string = SUB_ORG) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'What questions do you have?' });
    this.promptInput = page.getByRole('textbox').first();
  }

  async goto() { await this.page.goto(routes.ask(this.slug)); }
}
