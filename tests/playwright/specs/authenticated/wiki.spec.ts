import { test, expect } from "@playwright/test";
import { SuborgPage, WikiPage, TEST_SUBORG } from "../../pages";
import { WIKI_REPO_OWNER, WIKI_REPO_NAME } from "../../support/paths";

test.describe("Wiki (DeepWiki)", () => {
  // Known benign noise: 404s for optional assets and a Radix a11y warning in the search dialog.
  const IGNORED_CONSOLE = [/Failed to load resource/, /DialogTitle/];

  function trackConsoleErrors(page: import("@playwright/test").Page) {
    const errors: string[] = [];
    const record = (text: string) => {
      if (!IGNORED_CONSOLE.some((re) => re.test(text))) errors.push(text);
    };
    page.on("console", (msg) => {
      if (msg.type() === "error") record(msg.text());
    });
    page.on("pageerror", (err) => record(err.message));
    return errors;
  }

  test("SUB-WK-SMK01 — Load the Wiki via the sidebar", async ({ page }) => {
    const suborg = new SuborgPage(page);
    const wiki = new WikiPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await suborg.goto();
    await expect(wiki.sidebarWikiLink).toBeVisible();
    await wiki.sidebarWikiLink.click();
    await page.waitForURL(new RegExp(`/org/${TEST_SUBORG}/wiki$`));

    await expect(wiki.repoSearchInput).toBeVisible();
    await expect(wiki.addRepositoryButton).toBeVisible();
    await expect(wiki.repoCards.first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("SUB-WK-REG01 — Search repos with XSS/emoji and open a repo wiki", async ({ page }) => {
    const wiki = new WikiPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await wiki.goto();
    await expect(wiki.repoCards.first()).toBeVisible();

    await wiki.searchRepos("<script>alert(1)</script>");
    await expect(wiki.repoCards).toHaveCount(0);
    await expect(wiki.repoSearchInput).toHaveValue("<script>alert(1)</script>");

    await wiki.searchRepos("🧪😀");
    await expect(wiki.repoCards).toHaveCount(0);

    await wiki.searchRepos(WIKI_REPO_NAME);
    await expect(wiki.repoCard()).toBeVisible();

    await wiki.searchRepos("");
    await expect(wiki.repoCards.first()).toBeVisible();

    await wiki.openRepoWikiFromList();
    await wiki.waitForRepoWikiLoaded();

    // The repo wiki TOC renders with a Back link and section entries.
    await expect(wiki.tocBackLink).toBeVisible();
    await expect(
      page.getByRole("link", { name: `${WIKI_REPO_OWNER}/${WIKI_REPO_NAME}` }).first(),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("DWIKI-SMK01 — Load a repo's DeepWiki with architecture wiki and diagrams", async ({
    page,
  }) => {
    const wiki = new WikiPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await wiki.gotoRepoWiki();
    await wiki.waitForRepoWikiLoaded();

    await expect(wiki.deepWikiBreadcrumb).toBeVisible();
    await expect(wiki.branchSelector).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(wiki.tocBackLink).toBeVisible();
    await expect(wiki.diagrams.first()).toBeVisible({ timeout: 30_000 });
    expect(consoleErrors).toEqual([]);
  });

  test("DWIKI-REG01 — Search the wiki with an XSS query", async ({ page }) => {
    const wiki = new WikiPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await wiki.gotoRepoWiki();
    await wiki.waitForRepoWikiLoaded();

    await wiki.openWikiSearch();
    await wiki.searchWiki("<script>alert(1)</script>");

    // The query is treated as inert text: the dialog stays open and either
    // renders matching pages or a clean empty state — never executes markup.
    await expect(wiki.searchDialog.getByText(/match|No results found\./).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(wiki.searchDialogInput).toHaveValue("<script>alert(1)</script>");

    await wiki.closeWikiSearch();
    await expect(wiki.deepWikiBreadcrumb).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});
