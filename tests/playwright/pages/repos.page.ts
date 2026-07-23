import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG, TEST_SUBORG, TEST_SUBORG_DISPLAY } from "../support/paths";

// Disposable repository used by the mutating regression/e2e cases. It lives in the
// shared QA tenant's connected providers but carries no baseline permission, so the
// tests can grant it, assert, and revoke it back to the default state every run.
// Overridable via env in case the QA fixtures change.
export const DISPOSABLE_REPO = process.env.REPO_DISPOSABLE ?? "R-ohit-B-isht/zod";
export const DISPOSABLE_REPO_SEARCH = process.env.REPO_DISPOSABLE_SEARCH ?? "zod";

export class ReposPage extends BasePage {
  protected readonly path = routes.repositories();

  readonly heading = this.page.getByRole("heading", { name: "Repositories", exact: true });
  readonly description = this.page.getByText(
    /Manage access to repositories for your organizations/,
  );
  readonly orgSelector = this.page.getByRole("combobox").first();
  readonly table = this.page.locator("table").filter({ hasText: "Permissions for" });
  readonly tableRows = this.table.locator("tbody tr");
  readonly searchInput = this.page.locator('input[placeholder="Search permissions..."]').first();
  readonly filterGitProvider = this.page
    .getByRole("combobox")
    .filter({ hasText: /git providers/i });
  readonly filterPermissionTypes = this.page
    .getByRole("combobox")
    .filter({ hasText: /Permission types/i });
  readonly filterAccessType = this.page.getByRole("combobox").filter({ hasText: /Access type/i });
  readonly backToEnterprise = this.page.getByRole("button", { name: "Back to enterprise" });
  readonly managePermissions = this.page.getByRole("button", { name: "Manage permissions" });

  // "Add repository permissions" panel controls.
  readonly panelSearch = this.page.getByPlaceholder("Search…").first();
  readonly addPermissions = this.page.getByRole("button", { name: "Add permissions" });

  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.repositories(slug));
  }

  async selectOrganization(name: string = TEST_SUBORG_DISPLAY) {
    await this.orgSelector.click();
    await this.page.getByRole("option", { name }).click();
    await this.page.waitForURL(/\/settings\/repositories\?org=/);
    // Wait for the selected org's permission list (cached org switches make no
    // network request, so key off the rendered table instead of a response).
    await expect(this.table).toContainText(`Permissions for ${name}`);
    await this.tableRows.first().waitFor();
  }

  permissionRow(name: string): Locator {
    return this.table.locator("tr").filter({ hasText: name });
  }

  /** True when the permissions table currently lists a row for `name`. */
  async hasPermission(name: string): Promise<boolean> {
    return (await this.permissionRow(name).count()) > 0;
  }

  /**
   * Grant a permission for `repoFullName` to the selected organization.
   * Opens the panel, selects the repo, and waits for the create request to succeed.
   */
  async grantPermission(repoFullName: string, searchTerm: string) {
    await this.managePermissions.click();
    await this.panelSearch.waitFor({ state: "visible" });
    await this.panelSearch.fill(searchTerm);
    const label = this.page.getByText(repoFullName, { exact: true });
    await label.waitFor({ state: "visible" });
    // Nearest ancestor of the label that owns a checkbox is the picker row.
    await label
      .locator('xpath=ancestor::*[.//*[@role="checkbox"]][1]')
      .getByRole("checkbox")
      .first()
      .check();
    const [resp] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes("/integrations/git-permissions") && r.request().method() === "POST",
      ),
      this.addPermissions.click(),
    ]);
    expect(resp.status()).toBe(200);
    await expect(this.permissionRow(repoFullName)).toBeVisible();
  }

  /**
   * Revoke the permission row for `name` and wait for the delete request to succeed.
   * The product deletes immediately (no confirm dialog) for repository permissions.
   */
  async revokePermission(name: string) {
    const row = this.permissionRow(name).first();
    const [resp] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.url().includes("/integrations/git-permissions") && r.request().method() === "DELETE",
      ),
      row.getByRole("button", { name: "Remove permission" }).click(),
    ]);
    expect(resp.status()).toBe(200);
    await expect(this.permissionRow(name)).toHaveCount(0);
  }

  /** Remove any leftover disposable-repo permission so tests are idempotent. */
  async ensureNoPermission(name: string) {
    await this.goto();
    await this.selectOrganization();
    while (await this.hasPermission(name)) {
      await this.revokePermission(name);
    }
  }

  /**
   * Capture the Authorization header and the legitimate org id the SPA uses
   * for git-permissions requests. The git-permissions API authenticates via a
   * bearer token (not the session cookie), so cross-tenant/tamper probes must
   * reuse a real token to prove denials are authorization decisions.
   */
  async captureApiAuth(): Promise<{ token: string; orgId: string }> {
    const [req] = await Promise.all([
      this.page.waitForRequest((r) => r.url().includes("/integrations/git-permissions"), {
        timeout: 60_000,
      }),
      this.page.goto(routes.repositories(ENTERPRISE_SLUG) + `?org=${TEST_SUBORG}`, {
        waitUntil: "domcontentloaded",
      }),
    ]);
    const token = (await req.allHeaders())["authorization"];
    expect(token, "expected an Authorization header on the git-permissions request").toBeTruthy();
    const orgId = req.url().match(/\/api\/([^/]+)\/integrations/)?.[1] ?? "";
    expect(orgId, "expected an org id in the git-permissions request URL").not.toBe("");
    return { token, orgId };
  }
}
