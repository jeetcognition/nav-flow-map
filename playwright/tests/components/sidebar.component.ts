import { Page, Locator } from '@playwright/test';

// The left navigation rail. Present on every sub-org page (Sessions, Ask, Wiki, Review,
// Automations, Settings). Locators are role/name based to survive UI churn.
export class Sidebar {
  readonly enterpriseAvatar: Locator;
  readonly searchButton: Locator;
  readonly sessionsLink: Locator;
  readonly askLink: Locator;
  readonly automationsLink: Locator;
  readonly reviewLink: Locator;
  readonly wikiLink: Locator;
  readonly settingsLink: Locator;
  readonly helpButton: Locator;

  constructor(private readonly page: Page) {
    this.enterpriseAvatar = page.getByRole('button', { name: /Cog Enterprise QA/i });
    this.searchButton = page.getByRole('button', { name: 'Search' }).first();
    this.sessionsLink = page.getByRole('link', { name: 'Sessions' });
    this.askLink = page.getByRole('link', { name: 'Ask' });
    this.automationsLink = page.getByRole('link', { name: 'Automations' });
    this.reviewLink = page.getByRole('link', { name: 'Review' });
    this.wikiLink = page.getByRole('link', { name: 'Wiki' });
    this.settingsLink = page.getByRole('link', { name: 'Settings' });
    this.helpButton = page.getByRole('button', { name: 'Help' });
  }

  async goToSessions() { await this.sessionsLink.first().click(); }
  async goToAsk() { await this.askLink.first().click(); }
  async goToAutomations() { await this.automationsLink.first().click(); }
  async goToReview() { await this.reviewLink.first().click(); }
  async goToWiki() { await this.wikiLink.first().click(); }
  async goToSettings() { await this.settingsLink.first().click(); }
}
