import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

export class ReviewSettingsPage extends BasePage {
  protected readonly path = routes.reviewSettings();

  readonly heading: Locator;
  readonly prDescriptionsSwitch: Locator;
  readonly securityScanSwitch: Locator;
  readonly prCommentsSwitch: Locator;
  readonly findingsBugsSwitch: Locator;
  readonly findingsSecuritySwitch: Locator;
  readonly findingsInvestigateSwitch: Locator;
  readonly findingsNoteSwitch: Locator;
  readonly githubCiChecksSwitch: Locator;
  readonly autoReviewSwitch: Locator;
  readonly acuLimitInput: Locator;
  readonly filesSection: Locator;
  readonly filePatternInput: Locator;
  readonly addFilePatternButton: Locator;
  readonly repositoriesTab: Locator;
  readonly usersTab: Locator;
  readonly addRepoButton: Locator;
  readonly allModesFilter: Locator;
  readonly allHostsFilter: Locator;
  readonly addRepoDialog: Locator;
  readonly addRepoSearchInput: Locator;
  readonly addRepoCancelButton: Locator;
  readonly addRepoSaveButton: Locator;
  readonly addRepoCloseButton: Locator;
  readonly addRepoListRow: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Devin Review", exact: true });
    this.prDescriptionsSwitch = page.locator("#add-devin-review-link-pr");
    this.securityScanSwitch = page.locator("#enable-security-scan");
    this.prCommentsSwitch = page.getByRole("heading", { name: "Post as PR comments" });
    this.findingsBugsSwitch = page.locator("#review-posting-bugs");
    this.findingsSecuritySwitch = page.locator("#review-posting-security");
    this.findingsInvestigateSwitch = page.locator("#review-posting-investigate");
    this.findingsNoteSwitch = page.locator("#review-posting-note");
    this.githubCiChecksSwitch = page.locator("#post-github-ci-checks");
    this.autoReviewSwitch = page.getByRole("heading", { name: "Automatic review" });
    this.acuLimitInput = page.locator("#auto-review-spend-limit input");
    this.filesSection = page.locator("#review-files");
    this.filePatternInput = page.locator("#review-files").getByPlaceholder("e.g. docs/**/*.md");
    this.addFilePatternButton = page.locator("#review-files").getByRole("button", { name: "Add" });
    this.repositoriesTab = page.getByRole("tab", { name: /Repositories/ });
    this.usersTab = page.getByRole("tab", { name: /Self-enrolled users/ });
    this.addRepoButton = page.getByRole("button", { name: "Add repo" });
    this.allModesFilter = page.getByRole("combobox").filter({ hasText: "All modes" });
    this.allHostsFilter = page.getByRole("combobox").filter({ hasText: "All hosts" });
    this.addRepoDialog = page.getByRole("dialog", { name: "Select repositories" });
    this.addRepoSearchInput = page.getByPlaceholder("Search repositories…");
    this.addRepoCancelButton = this.addRepoDialog.getByRole("button", { name: "Cancel" });
    this.addRepoSaveButton = this.addRepoDialog.getByRole("button", { name: /Save changes/ });
    this.addRepoCloseButton = this.addRepoDialog.locator("button").first();
    this.addRepoListRow = this.addRepoDialog.locator("button[data-index]");
  }

  async goto(params?: { tab?: "repositories" | "users" }) {
    await super.goto();
    if (params?.tab === "users") {
      await this.usersTab.click();
      await this.usersTab.waitFor({ state: "visible" });
    }
  }

  async switchToTab(tab: "repositories" | "users") {
    const target = tab === "repositories" ? this.repositoriesTab : this.usersTab;
    await target.click();
    await target.waitFor({ state: "visible" });
  }

  async openAddRepoDialog() {
    await this.addRepoButton.click();
    await this.addRepoDialog.waitFor({ state: "visible" });
  }

  async closeAddRepoDialog() {
    await this.addRepoCancelButton.click();
    await this.addRepoDialog.waitFor({ state: "hidden" });
  }

  async addFilePattern(pattern: string) {
    await this.filePatternInput.fill(pattern);
    await this.addFilePatternButton.click();
  }

  async removeFilePattern(pattern: string) {
    const row = this.filesSection
      .locator(".overflow-hidden > div")
      .filter({ has: this.page.locator("button") })
      .filter({ hasText: pattern })
      .first();
    await row.waitFor({ state: "visible" });
    await row.locator("button").click();
    await row.waitFor({ state: "hidden" });
  }

  async removeAllFilePatterns() {
    let row = this.filesSection
      .locator(".overflow-hidden > div")
      .filter({ has: this.page.locator("button") })
      .first();
    while ((await row.count()) > 0 && (await row.isVisible().catch(() => false))) {
      await row.locator("button").click();
      await this.page.waitForLoadState("networkidle");
      row = this.filesSection
        .locator(".overflow-hidden > div")
        .filter({ has: this.page.locator("button") })
        .first();
    }
  }

  async setAcuLimit(value: string) {
    const respPromise = this.page
      .waitForResponse(
        (r) =>
          r.url().includes("/api/pr-review/settings/auto-review-spend-limit") &&
          r.request().method() === "PUT",
        { timeout: 2_000 },
      )
      .catch(() => null);
    await this.acuLimitInput.fill(value);
    await this.acuLimitInput.blur();
    const resp = await respPromise;
    return { saved: !!resp, status: resp?.status() };
  }
}
