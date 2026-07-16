import { Page, Locator } from '@playwright/test';
import { SubOrgPage } from './sub-org.page';
import { routes, SUB_ORG } from '../support/paths';

// The Wiki / DeepWiki page: lists repositories and lets you generate wikis for them.
export class WikiPage extends SubOrgPage {
  protected readonly path = routes.wiki();

  readonly deepWikiLink: Locator;
  readonly repositoriesHeading: Locator;
  readonly repoSearchInput: Locator;
  readonly refetchReposButton: Locator;
  readonly filterReposButton: Locator;
  readonly addRepositoryButton: Locator;
  readonly generateButton: Locator;

  constructor(page: Page, private readonly slug: string = SUB_ORG) {
    super(page);
    this.deepWikiLink = page.getByRole('link', { name: 'DeepWiki' });
    this.repositoriesHeading = page.getByText('Repositories', { exact: true });
    this.repoSearchInput = page.getByRole('textbox', { name: 'Search repositories' });
    this.refetchReposButton = page.getByRole('button', { name: 'Refetch repositories' });
    this.filterReposButton = page.getByRole('button', { name: 'Filter repositories' });
    this.addRepositoryButton = page.getByRole('button', { name: 'Add repository' });
    this.generateButton = page.getByRole('button', { name: 'Generate' });
  }

  async goto() { await this.page.goto(routes.wiki(this.slug)); }
}
