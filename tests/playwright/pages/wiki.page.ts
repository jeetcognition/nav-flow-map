import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, TEST_SUBORG, WIKI_REPO_OWNER, WIKI_REPO_NAME } from "../support/paths";

export class WikiPage extends BasePage {
  protected readonly path = routes.wiki();

  /** Sidebar "Wiki" link. */
  readonly sidebarWikiLink: Locator;
  /** Repository search input on the wiki list page. */
  readonly repoSearchInput: Locator;
  /** "Add repository" button on the wiki list page. */
  readonly addRepositoryButton: Locator;
  /** Repository cards (links into a repo wiki). */
  readonly repoCards: Locator;

  /** Breadcrumb "DeepWiki" link on a repo wiki page. */
  readonly deepWikiBreadcrumb: Locator;
  /** Branch selector button on a repo wiki page. */
  readonly branchSelector: Locator;
  /** Toolbar "Search" button that opens the wiki search dialog. */
  readonly wikiSearchButton: Locator;
  /** Left-hand table of contents navigation on a repo wiki page. */
  readonly tocBackLink: Locator;
  /** Mermaid diagrams rendered in the wiki body. */
  readonly diagrams: Locator;

  /** Wiki search dialog. */
  readonly searchDialog: Locator;
  /** Search input inside the wiki search dialog. */
  readonly searchDialogInput: Locator;
  /** "No results found." empty state in the search dialog. */
  readonly searchNoResults: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebarWikiLink = page.getByRole("link", { name: "Wiki" });
    this.repoSearchInput = page.getByPlaceholder("Search repositories");
    this.addRepositoryButton = page.getByRole("button", { name: "Add repository" });
    this.repoCards = page.locator('main a[href*="/wiki/"]');

    this.deepWikiBreadcrumb = page.getByRole("link", { name: "DeepWiki" }).first();
    this.branchSelector = page.getByRole("button", { name: "Select branch" });
    this.wikiSearchButton = page
      .getByRole("button", { name: "Search", exact: true })
      .filter({ hasText: "Search" });
    this.tocBackLink = page.getByRole("link", { name: "Back", exact: true });
    this.diagrams = page.locator("svg[aria-roledescription]");

    this.searchDialog = page.getByRole("dialog").filter({ hasText: /Wiki/ });
    this.searchDialogInput = page.getByPlaceholder(/^Search .* wiki/);
    this.searchNoResults = this.searchDialog.getByText("No results found.");
  }

  async goto(slug: string = TEST_SUBORG) {
    await this.page.goto(routes.wiki(slug));
  }

  /** Navigate straight to the indexed test repo's wiki. */
  async gotoRepoWiki(
    owner: string = WIKI_REPO_OWNER,
    repo: string = WIKI_REPO_NAME,
    slug: string = TEST_SUBORG,
  ) {
    await this.page.goto(routes.repoWiki(owner, repo, slug));
  }

  /** Repo card link for `owner/repo` on the wiki list page. */
  repoCard(owner: string = WIKI_REPO_OWNER, repo: string = WIKI_REPO_NAME): Locator {
    return this.page.locator(`main a[href*="/wiki/${owner}/${repo}"]`).first();
  }

  /** Open a repo wiki from its list card and wait for the wiki route. */
  async openRepoWikiFromList(owner: string = WIKI_REPO_OWNER, repo: string = WIKI_REPO_NAME) {
    await this.repoCard(owner, repo).click();
    await this.page.waitForURL(new RegExp(`/wiki/${owner}/${repo}`));
  }

  /** Wait for a repo wiki page to finish rendering its content. */
  async waitForRepoWikiLoaded() {
    await this.deepWikiBreadcrumb.waitFor({ state: "visible" });
    await this.page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible" });
    await this.wikiSearchButton.waitFor({ state: "visible" });
  }

  /** Filter the wiki repository list with `query`. */
  async searchRepos(query: string) {
    await this.repoSearchInput.fill(query);
  }

  /** Open the wiki search dialog from the repo wiki toolbar. */
  async openWikiSearch() {
    await this.wikiSearchButton.click();
    await this.searchDialogInput.waitFor({ state: "visible" });
  }

  /** Type a query into the open wiki search dialog. */
  async searchWiki(query: string) {
    await this.searchDialogInput.fill(query);
  }

  /** Close the wiki search dialog with Escape. */
  async closeWikiSearch() {
    await this.page.keyboard.press("Escape");
    await expect(this.searchDialogInput).toBeHidden();
  }
}
