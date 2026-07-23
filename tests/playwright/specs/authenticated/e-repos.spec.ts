import { test, expect, type Page } from "@playwright/test";
import { ReposPage, DevinSessionPage, ALT_SUBORG_NAME } from "../../pages";
import { DISPOSABLE_REPO, DISPOSABLE_REPO_SEARCH } from "../../pages/repos.page";

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

  /**
   * Load the sub-org session composer and return the repositories a new
   * session there may reference. The composer's "Notable repositories" menu
   * is fed by the org `git-repos` request this helper intercepts, so the
   * returned paths reflect the org's current repository permissions.
   */
  async function fetchSessionComposerRepos(page: Page): Promise<string[]> {
    const session = new DevinSessionPage(page);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/git-repos?"), { timeout: 60_000 }),
      session.gotoSession(),
    ]);
    const body = (await resp.json()) as { data?: { path: string }[] };
    const paths = (body.data ?? []).map((repo) => repo.path);
    // Baseline permission that is always granted to the test sub-org — proves
    // the composer repo list loaded before presence/absence assertions.
    expect(paths).toContain("jeet-devin-qa/primary-project");
    return paths;
  }

  test("REPO-REG03 — Add a permission for a disposable repository, reload, then restore.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const repos = new ReposPage(page);

    try {
      // Pre-state: the disposable repo carries no permission.
      await repos.ensureNoPermission(DISPOSABLE_REPO);
      const baselineRows = await repos.tableRows.count();

      await repos.grantPermission(DISPOSABLE_REPO, DISPOSABLE_REPO_SEARCH);
      // The type badge renders lowercase and is capitalized with CSS only.
      await expect(repos.permissionRow(DISPOSABLE_REPO)).toContainText(/repository/i);
      await expect(repos.permissionRow(DISPOSABLE_REPO)).toContainText(/read & write/i);

      // Reload: the permission persists for this org.
      await page.reload();
      await repos.table.waitFor();
      await expect(repos.permissionRow(DISPOSABLE_REPO)).toBeVisible();

      // The change applies to the selected org only — the alternate org's
      // permission list does not pick up the new row.
      await repos.selectOrganization(ALT_SUBORG_NAME);
      await expect(repos.table).toContainText(`Permissions for ${ALT_SUBORG_NAME}`);
      await expect(repos.permissionRow(DISPOSABLE_REPO)).toHaveCount(0);

      // Cleanup restores original access.
      await repos.selectOrganization();
      await repos.revokePermission(DISPOSABLE_REPO);
      await page.reload();
      await repos.table.waitFor();
      await expect(repos.permissionRow(DISPOSABLE_REPO)).toHaveCount(0);
      await expect(repos.tableRows).toHaveCount(baselineRows);

      expect(errors).toHaveLength(0);
    } finally {
      await repos.ensureNoPermission(DISPOSABLE_REPO);
    }
  });

  test("REPO-REG04 — Tampered org ids or unauthenticated requests for repository permissions are denied.", async ({
    page,
  }) => {
    const repos = new ReposPage(page);
    const { token, orgId: legitOrgId } = await repos.captureApiAuth();

    const permissionsUrl = (orgId: string) => `/api/${orgId}/integrations/git-permissions`;
    // Well-formed-but-nonexistent and malformed org ids stand in for another
    // tenant's ids, which are not knowable from this enterprise by design.
    const tamperedOrgIds = ["org-00000000000000000000000000000000", "not-an-org"];

    // Sanity: the captured token authorizes the legitimate org, so the
    // denials below are authorization checks rather than broken auth.
    const legitRead = await page.request.get(permissionsUrl(legitOrgId), {
      headers: { authorization: token },
    });
    expect(legitRead.status()).toBe(200);

    for (const orgId of tamperedOrgIds) {
      // Read attempts are denied and expose no permission/repo metadata.
      const read = await page.request.get(permissionsUrl(orgId), {
        headers: { authorization: token },
      });
      expect(read.status()).toBe(403);
      const body = await read.text();
      expect(body).toContain("Unauthorized");
      expect(body).not.toContain("git_permission");
      expect(body).not.toContain("repo");

      // Mutation attempts are denied as well.
      const write = await page.request.post(permissionsUrl(orgId), {
        headers: { authorization: token },
        data: { permissions: [] },
      });
      expect(write.status()).toBe(403);

      const del = await page.request.delete(
        `${permissionsUrl(orgId)}/git-permission-doesnotexist`,
        { headers: { authorization: token } },
      );
      expect(del.status()).toBe(403);
    }

    // Without the bearer token the API rejects the request outright, even
    // for a real org id and with the session cookies present.
    const anonRead = await page.request.get(permissionsUrl(legitOrgId));
    expect(anonRead.status()).toBe(401);
    expect(await anonRead.text()).toContain("Unauthenticated");

    const anonWrite = await page.request.post(permissionsUrl(legitOrgId), {
      data: { permissions: [] },
    });
    expect(anonWrite.status()).toBe(401);
  });

  test("REPO-E2E01 — Grant disposable repo access, start a session that references it, then revoke and retest.", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(240_000);
    const repos = new ReposPage(page);
    const session = new DevinSessionPage(page);

    try {
      // Pre-state: the disposable repo carries no permission and is not
      // referenceable from the session composer.
      await repos.ensureNoPermission(DISPOSABLE_REPO);
      expect(await fetchSessionComposerRepos(page)).not.toContain(DISPOSABLE_REPO);

      // Grant access to the disposable repository.
      await repos.goto();
      await repos.selectOrganization();
      await repos.grantPermission(DISPOSABLE_REPO, DISPOSABLE_REPO_SEARCH);

      // Session access follows repository permissions: the repo is now
      // offered to new sessions in the sub-org.
      expect(await fetchSessionComposerRepos(page)).toContain(DISPOSABLE_REPO);

      // Start a session that references the newly granted repository. The
      // session's own agent output is nondeterministic, so the test asserts
      // the session is created with the referencing prompt rather than
      // waiting for an agent reply.
      const prompt = `REPO-E2E01 automated check: this session references ${DISPOSABLE_REPO}. Reply with a one-line acknowledgement; take no other action.`;
      await session.gotoSession();
      const sessionId = await session.sendPrompt(prompt);
      expect(sessionId).not.toBe("");
      await expect(page.locator("body")).toContainText(DISPOSABLE_REPO);

      // Revoke and retest: after cleanup the repo can no longer be
      // referenced by new sessions.
      await repos.goto();
      await repos.selectOrganization();
      await repos.revokePermission(DISPOSABLE_REPO);

      expect(await fetchSessionComposerRepos(page)).not.toContain(DISPOSABLE_REPO);
    } finally {
      await repos.ensureNoPermission(DISPOSABLE_REPO);
    }
  });
});
