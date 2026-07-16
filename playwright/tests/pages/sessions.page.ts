import { Page, Locator } from '@playwright/test';
import { SubOrgPage } from './sub-org.page';
import { OrgSelectorPage } from './org-selector.page';
import { SUB_ORG } from '../support/paths';

// Sub-org home — the "Sessions" view with the Devin prompt box.
export class SessionsPage extends SubOrgPage {

  /** The main "Ask Devin to build features..." prompt textbox. */
  readonly promptInput: Locator;
  readonly recentHeading: Locator;
  readonly newButton: Locator;
  readonly moreButton: Locator;
  /** Empty-state text when no sessions exist. */
  readonly emptyState: Locator;

  constructor(page: Page, private readonly slug: string = SUB_ORG) {
    super(page);
    this.promptInput = page.getByRole('textbox').first();
    this.recentHeading = page.getByText('Recent', { exact: true });
    this.newButton = page.getByRole('button', { name: 'New' });
    this.moreButton = page.getByRole('button', { name: 'More' });
    this.emptyState = page.getByText('No sessions');
  }

  async goto() {
    // Direct URL navigation 404s (SPA deep link). Go via org-selector → click sub-org card.
    const orgSelector = new OrgSelectorPage(this.page);
    await orgSelector.goto();
    await orgSelector.openOrg(this.slug);
    await this.sidebar.sessionsLink.first().waitFor({ timeout: 20_000 });
  }
}
