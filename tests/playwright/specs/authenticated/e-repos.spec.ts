import { test, expect, type Page } from "@playwright/test";
import { ReposPage } from "../../pages";

test.describe("Repositories", () => {
  function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("REPO-SMK01 — Load cold.", async ({ page }) => {
    const errors = watchErrors(page);
    const repos = new ReposPage(page);
    await repos.goto();

    await expect(repos.heading).toBeVisible();
    await expect(repos.description).toBeVisible();
    await expect(repos.orgSelector).toBeVisible();
    await expect(repos.backToEnterprise).toBeVisible();
    // Permission controls should be gated until an org is selected.
    await expect(repos.table).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("REPO-SAN01 — Open organization selector and choose jeet-test-org.", async ({ page }) => {
    const errors = watchErrors(page);
    const repos = new ReposPage(page);
    await repos.goto();
    await repos.selectOrganization();

    await expect(page).toHaveURL(/org=jeet-devin-qa/);
    await expect(repos.orgSelector).toContainText("jeet-test-org");
    await expect(repos.table).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("REPO-SAN02 — Inspect repo list, provider/status/permission columns, filters, and available actions.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const repos = new ReposPage(page);
    await repos.goto();
    await repos.selectOrganization();

    await expect(repos.heading).toBeVisible();
    await expect(repos.table).toBeVisible();
    await expect(repos.tableRows.first()).toBeVisible();

    // Filter and action controls are present.
    await expect(repos.filterGitProvider.first()).toBeVisible();
    await expect(repos.filterPermissionTypes).toBeVisible();
    await expect(repos.filterAccessType).toBeVisible();
    await expect(repos.searchInput).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("REPO-REG01 — Search repos with match/no-match, whitespace, Unicode, and injection-like text.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const repos = new ReposPage(page);
    await repos.goto();
    await repos.selectOrganization();

    await expect(repos.searchInput).toBeVisible();

    // Match: should narrow visible rows.
    await repos.searchInput.fill("primary-project");
    await expect(repos.permissionRow("primary-project")).toBeVisible();

    // No-match literal.
    await repos.searchInput.fill("no-such-repo-12345");
    await expect(page.getByText("No permissions match your search")).toBeVisible();

    // Unicode.
    await repos.searchInput.fill("āāā-no-match-unicode");
    await expect(page.getByText("No permissions match your search")).toBeVisible();

    // Injection-like is literal and safe.
    await repos.searchInput.fill("<script>alert(1)</script>");
    await expect(page.getByText("No permissions match your search")).toBeVisible();

    // Clearing restores rows.
    await repos.searchInput.fill("");
    await expect(repos.permissionRow("primary-project")).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
