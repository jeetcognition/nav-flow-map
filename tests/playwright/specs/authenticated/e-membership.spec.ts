import { test, expect, request as apiRequest, ConsoleMessage, Page } from "@playwright/test";
import { LoginPage, MembershipPage, MEMBER_COLUMNS } from "../../pages";
import { routes, ALT_SUBORG_NAME } from "../../support/paths";
import { fetchLatestOtp } from "../../support/gmail-otp";

const SENSITIVE_PATTERNS = [
  /\bpassword\b/i,
  /\botp\b/i,
  /\baccess[_-]?token\b/i,
  /\brefresh[_-]?token\b/i,
  /\bclient[_-]?secret\b/i,
  /\binternal server error\b/i,
  /stack trace/i,
  /\berror\s*=\s*/i,
];

function containsSensitive(text: string): string | undefined {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) return `matched ${pattern}`;
  }
  return undefined;
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  const dialogs: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  };
  const onPageError = (err: Error) => errors.push(err.message);
  const onDialog = (dialog: any) => {
    dialogs.push(dialog.message());
    dialog.dismiss().catch(() => {});
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("dialog", onDialog);
  return {
    errors,
    dialogs,
    cleanup: () => {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("dialog", onDialog);
    },
  };
}

function collectFailedResponses(page: Page) {
  const failed: number[] = [];
  const onResponse = (res: any) => {
    if (!res.ok() && res.status() >= 400) failed.push(res.status());
  };
  page.on("response", onResponse);
  return {
    failed,
    cleanup: () => page.off("response", onResponse),
  };
}

test.describe("Enterprise Membership", () => {
  test("MEMB-SMK01 — Load the page cold.", async ({ page }) => {
    const m = new MembershipPage(page);
    const { errors, dialogs, cleanup } = collectErrors(page);
    await m.goto();

    await expect(m.heading).toBeVisible();
    await expect(m.learnMoreLink).toBeVisible();
    await expect(m.learnMoreLink).toHaveAttribute("href", "https://docs.devin.ai/enterprise");
    await expect(m.membersTab).toBeVisible();
    await expect(m.rolesTab).toBeVisible();
    await expect(m.groupsTab).toBeVisible();
    await expect(m.searchInput).toBeVisible();
    await expect(m.orgFilterTrigger()).toBeVisible();
    await expect(m.roleFilterTrigger()).toBeVisible();
    await expect(m.inviteButton).toBeVisible();
    await m.expectTablePopulated();

    expect(errors).toHaveLength(0);
    expect(dialogs).toHaveLength(0);
    cleanup();
  });

  test("MEMB-SAN01 — Inspect the member table.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();
    await expect(m.memberTable).toBeVisible();
    const headers = await m.tableHeaders();
    for (const col of MEMBER_COLUMNS) {
      expect(headers).toContain(col);
    }
    const row = m.memberTable.locator("tr").first();
    await expect(row.locator("td").nth(1)).not.toBeEmpty();
    await expect(row.locator("td").nth(2)).not.toBeEmpty();
    await expect(row.locator("td").nth(4)).not.toBeEmpty();
  });

  test("MEMB-SAN02 — Open Invite members without submitting.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();
    await m.openInviteDialog();

    const dlg = m.inviteDialog();
    await expect(dlg).toContainText("Invite members");
    await expect(dlg).toContainText("Add coworker by email");
    await expect(dlg.locator("button").filter({ hasText: /^Member$/ })).toBeVisible();
    await expect(dlg.getByPlaceholder("Ex. user@example.com, user2@example.com")).toBeVisible();
    const add = dlg.locator("button").filter({ hasText: /^Add$/ });
    await expect(add).toBeVisible();
    await expect(add).toBeDisabled();

    await m.closeInviteDialog();
  });

  test("MEMB-SAN03 — Open All organizations.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();
    await m.openOrgFilter();

    const dlg = m.orgFilterDialog();
    await expect(dlg.locator("input").first()).toBeVisible();
    await expect(dlg.locator("div").filter({ hasText: /^All organizations$/ })).toBeVisible();
    await expect(
      dlg.locator("div").filter({ hasText: new RegExp(`^${ALT_SUBORG_NAME}$`) }),
    ).toBeVisible();

    // Close while keeping the default "All organizations" selection.
    await m.clickFilterOption(dlg, "All organizations");
  });

  test("MEMB-SAN04 — Open All enterprise roles and the Invite-role selector.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();
    await m.openRoleFilter();

    const dlg = m.roleFilterDialog();
    await expect(dlg.locator("input").first()).toBeVisible();
    await expect(dlg.locator("div").filter({ hasText: /^All enterprise roles$/ })).toBeVisible();
    await expect(dlg.locator("div").filter({ hasText: /^Admin$/ })).toBeVisible();
    await expect(dlg.locator("div").filter({ hasText: /^Member$/ })).toBeVisible();
    await m.clickFilterOption(dlg, "All enterprise roles");

    await m.openInviteDialog();
    const inviteDlg = m.inviteDialog();
    await expect(inviteDlg.locator("button").filter({ hasText: /^Member$/ })).toBeVisible();
    await m.closeInviteDialog();
  });

  test("MEMB-REG01 — Search by matching and non-matching text.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();

    const tests = [
      { q: "Aayush Prabhu", expectMatch: true },
      { q: "aayush.prabhu@cognition.ai", expectMatch: true },
      { q: "  Aayush  ", expectMatch: true },
      { q: "ZZZ_no_match_99999", expectMatch: false },
      { q: "<script>alert(1)</script>", expectMatch: false },
      { q: "A".repeat(200), expectMatch: false },
    ];

    for (const { q, expectMatch } of tests) {
      await m.search(q);
      if (expectMatch) {
        await expect(m.memberRow("Aayush")).toBeVisible();
        await expect(m.rowRoleButton(m.memberRow("Aayush"))).toHaveText("Member");
      } else {
        await expect(m.noMembersFound).toBeVisible();
        await expect(m.noMembersHint).toBeVisible();
      }
      await m.clearSearch();
    }
  });

  test("MEMB-REG02 — Combine organization and enterprise-role filters.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();
    await m.expectTablePopulated();
    const totalRows = await m.memberTable.locator("tr").count();
    expect(totalRows).toBeGreaterThan(0);

    await m.openOrgFilter();
    await m.selectFilterOption(m.orgFilterDialog(), ALT_SUBORG_NAME);
    await expect(m.orgFilterTrigger()).toContainText(ALT_SUBORG_NAME);
    await expect
      .poll(() => m.memberTable.locator("tr").count(), { timeout: 15_000 })
      .toBeLessThan(totalRows);
    const orgRows = await m.memberTable.locator("tr").count();

    await m.openRoleFilter();
    await m.selectFilterOption(m.roleFilterDialog(), "Admin");
    await expect(m.roleFilterTrigger()).toContainText("Admin");
    await expect
      .poll(
        async () => {
          const rows = await m.memberTable.locator("tr").count();
          const roleTexts = await m.memberTable
            .locator('button[role="combobox"]')
            .allTextContents();
          return (
            roleTexts.length > 0 && rows <= orgRows && roleTexts.every((t) => t.trim() === "Admin")
          );
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    await m.clearRoleFilter();
    await m.clearOrgFilter();
    await expect
      .poll(() => m.memberTable.locator("tr").count(), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(totalRows);
  });

  test("MEMB-REG05 — Expand members with zero, one, and many organizations.", async ({ page }) => {
    const m = new MembershipPage(page);
    await m.goto();

    // Zero organizations — no clickable org cell.
    const zero = m.memberRow("Aayush Prabhu");
    await expect(zero.locator("td").nth(3)).toContainText("0 organizations");
    await expect(m.rowOrgButton(zero)).toHaveCount(0);

    // One organization — popover opens and shows a member count.
    await m.search("Albert Han");
    const one = m.memberRow("Albert Han");
    await expect(one.locator("td").nth(3)).toContainText("1 organization");
    await m.openOrgCountPopover(one);
    await expect(m.orgCountPopover()).toBeVisible();
    await expect(m.orgCountPopover()).toContainText(/\d+\s*members?/);
    await m.closePopover();

    // Many organizations.
    await m.search("Armaan Dodd");
    const many = m.memberRow("Armaan Dodd");
    await expect(many.locator("td").nth(3)).toContainText("3 organizations");
    await m.openOrgCountPopover(many);
    await expect(m.orgCountPopover()).toBeVisible();
    await expect(m.orgCountPopover()).toContainText(/organizations?|members?/i);
    await m.closePopover();
  });

  test("MEMB-REG06 — Assign a different role, reload, and restore.", async ({ page }) => {
    const m = new MembershipPage(page);
    const member = "Aayush Prabhu";

    await m.goto();
    const row = m.memberRow(member);
    await expect(m.rowRoleButton(row)).toHaveText("Member");

    await m.changeRole(row, "Admin");
    await expect(m.rowRoleButton(row)).toHaveText("Admin");

    await page.reload();
    await m.heading.waitFor();
    const reloaded = m.memberRow(member);
    await expect(m.rowRoleButton(reloaded)).toHaveText("Admin");

    try {
      await m.changeRole(reloaded, "Member");
      await expect(m.rowRoleButton(reloaded)).toHaveText("Member");

      await page.reload();
      await m.heading.waitFor();
      const restored = m.memberRow(member);
      await expect(m.rowRoleButton(restored)).toHaveText("Member");
    } catch (e) {
      // Ensure cleanup even if the intermediate assertion fails.
      await page.reload();
      await m.heading.waitFor();
      const restored = m.memberRow(member);
      if ((await m.rowRoleButton(restored).textContent())?.trim() !== "Member") {
        await m.changeRole(restored, "Member");
      }
      throw e;
    }
  });

  test("MEMB-REG08 — Inspect URLs, UI, console, and requests for leaks.", async ({ page }) => {
    const m = new MembershipPage(page);
    const { errors, dialogs, cleanup: eCleanup } = collectErrors(page);
    const { failed, cleanup: nCleanup } = collectFailedResponses(page);

    await m.goto();
    await m.search("Jeet");
    const row = m.memberRow("Jeet");
    await m.openOrgCountPopover(row);
    await expect(m.orgCountPopover()).toBeVisible();
    expect(containsSensitive((await m.orgCountPopover().textContent()) ?? "")).toBeUndefined();
    await m.closePopover();

    await m.openOrgFilter();
    await m.selectFilterOption(m.orgFilterDialog(), ALT_SUBORG_NAME);
    await m.clearSearch();

    await m.openInviteDialog();
    const dlg = m.inviteDialog();
    const email = dlg.getByPlaceholder("Ex. user@example.com, user2@example.com");
    await email.fill('\"><svg onload=alert(1)>@example.com, valid@example.com');
    await expect(dlg.locator("button").filter({ hasText: /^Add$/ })).toBeEnabled();
    await m.closeInviteDialog();

    await expect(page).toHaveURL(/\/settings\/membership/);
    expect(errors).toHaveLength(0);
    expect(dialogs).toHaveLength(0);
    expect(failed).toHaveLength(0);
    expect(containsSensitive(await page.innerText("body"))).toBeUndefined();

    eCleanup();
    nCleanup();
  });

  test("MEMB-E2E01 — Invite a disposable Member, accept, assign an organization, and remove.", async ({
    page,
    browser,
  }, testInfo) => {
    testInfo.setTimeout(600_000);

    const inbox = (process.env.DEVIN_ADMIN_EMAIL ?? "").trim();
    const appPassword = (process.env.GMAIL_APP_PASSWORD ?? "").trim();
    test.skip(
      !inbox || !appPassword,
      "Set DEVIN_ADMIN_EMAIL and GMAIL_APP_PASSWORD to log in as the disposable invitee.",
    );

    // Gmail plus-addressing delivers the invite and OTP to the same inbox.
    const alias = inbox.replace("@", `+memb-e2e01-${Date.now()}@`);
    const m = new MembershipPage(page);

    try {
      await m.goto();
      await m.heading.waitFor({ state: "visible" });

      // Invite the disposable account with the default Member role.
      await m.inviteMember(alias);
      await m.search(alias);
      const row = m.memberRow(alias);
      await expect(row).toBeVisible({ timeout: 15_000 });
      await expect(m.rowRoleButton(row).first()).toHaveText("Member");
      await expect(row.locator("td").nth(3)).toContainText("0 organizations");

      // Accept: the invitee logs in with email OTP in a fresh context.
      // Explicitly drop the project's storageState so the invitee starts anonymous.
      const inviteeCtx = await browser.newContext({ storageState: undefined });
      const inviteePage = await inviteeCtx.newPage();
      try {
        const login = new LoginPage(inviteePage);
        await login.goto();
        await login.submitEmail(alias);

        // The shared inbox also receives codes for other logins, so target the
        // alias recipient and retry with a fresh code if a stale one was read.
        const inviteeHome = inviteePage.getByText(
          "Before using Devin, contact your enterprise administrator",
        );
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await login.resendButton.click();
          const code = await fetchLatestOtp({
            user: inbox,
            password: appPassword,
            toIncludes: alias,
            subjectIncludes: "verification code",
            initialDelayMs: 20_000,
            timeoutMs: 120_000,
          });
          await login.submitOtp(code);
          const loggedIn = await inviteeHome
            .waitFor({ state: "visible", timeout: 30_000 })
            .then(() => true)
            .catch(() => false);
          if (loggedIn) break;
        }

        // The new Member has enterprise access but no organizations yet.
        await expect(inviteeHome).toBeVisible({ timeout: 15_000 });

        // Denied action: a Member cannot open enterprise Membership settings.
        await inviteePage.goto(routes.membership());
        await expect(inviteePage.getByText("Access denied")).toBeVisible({ timeout: 30_000 });

        // Assign an organization to the invitee as the admin.
        await m.ensureRowSelected(row);
        await m.addOrganizationToSelection(ALT_SUBORG_NAME);
        await expect(row.locator("td").nth(3)).toContainText("1 organization", {
          timeout: 15_000,
        });

        // The invitee now sees the assigned organization.
        await inviteePage.goto(routes.orgSelector);
        await expect(inviteePage.getByText(ALT_SUBORG_NAME).first()).toBeVisible({
          timeout: 30_000,
        });

        // Revoke the organization, then remove the member entirely.
        await m.ensureRowSelected(row);
        await m.removeOrganizationsFromSelection(ALT_SUBORG_NAME);
        await expect(row.locator("td").nth(3)).toContainText("0 organizations", {
          timeout: 15_000,
        });
        await m.ensureRowSelected(row);
        await m.removeSelectedMembers();
        await m.search(alias);
        await expect(m.noMembersFound).toBeVisible({ timeout: 15_000 });
      } finally {
        await inviteeCtx.close();
      }
    } finally {
      // Idempotent cleanup: remove the disposable invitee if any step failed midway.
      await page.goto(routes.membershipTab("members"));
      await m.heading.waitFor({ state: "visible" });
      await m.search(alias);
      const leftover = m.memberRow(alias);
      const present = await leftover
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => true)
        .catch(() => false);
      if (present) {
        await m.ensureRowSelected(leftover);
        await m.removeSelectedMembers();
      }
    }
  });

  test("MEMB-REG07 — Unauthorized and tampered membership changes are denied.", async ({
    page,
    browser,
  }) => {
    const m = new MembershipPage(page);

    // Capture the enterprise API base the UI itself uses.
    const apiReq = page.waitForRequest(/\/api\/enterprise\/[^/]+\//, { timeout: 30_000 });
    await m.goto();
    await m.heading.waitFor({ state: "visible" });
    const enterpriseApiBase = (await apiReq).url().match(/^.*\/api\/enterprise\/[^/]+/)![0];

    // Self-demotion guard: the admin's own role selector is disabled.
    const adminEmail = (process.env.DEVIN_ADMIN_EMAIL ?? "").trim();
    test.skip(!adminEmail, "Set DEVIN_ADMIN_EMAIL to locate the logged-in admin's row.");
    await m.search(adminEmail);
    const ownRow = m.memberRow(adminEmail);
    await expect(ownRow).toBeVisible({ timeout: 15_000 });
    await expect(m.rowRoleButton(ownRow).first()).toHaveText("Admin");
    await expect(m.rowRoleButton(ownRow).first()).toBeDisabled();

    // Unauthenticated API attempts at invite, role change, and removal are denied.
    const api = await apiRequest.newContext();
    try {
      const invite = await api.post(`${enterpriseApiBase}/invite`, {
        data: { emails: ["tampered@example.com"], role: "Member" },
      });
      expect(invite.status()).toBe(401);
      const roleChange = await api.post(`${enterpriseApiBase}/members`, {
        data: { memberId: "tampered-member-id", role: "Admin" },
      });
      expect(roleChange.status()).toBe(401);
      const removal = await api.post(`${enterpriseApiBase}/members/delete`, {
        data: { memberIds: ["tampered-member-id"] },
      });
      expect(removal.status()).toBe(401);
    } finally {
      await api.dispose();
    }

    // Unauthenticated page access is redirected to login without exposing member data.
    // Explicitly drop the project's storageState so this context is anonymous.
    const unauthCtx = await browser.newContext({ storageState: undefined });
    try {
      const unauthPage = await unauthCtx.newPage();
      await unauthPage.goto(routes.membership());
      await unauthPage.waitForURL(/auth\.beta\.devin\.ai/, { timeout: 30_000 });
      await expect(unauthPage.locator("body")).not.toContainText(adminEmail);
    } finally {
      await unauthCtx.close();
    }

    // A tampered enterprise slug yields 404 and exposes no cross-enterprise data.
    await page.goto(routes.membership("tampered-enterprise-slug"), { waitUntil: "networkidle" });
    await expect(page.getByText("This page could not be found")).toBeVisible();
    await expect(page.locator("table")).toHaveCount(0);

    // Return to the real membership page to leave a clean state.
    await m.goto();
    await m.heading.waitFor({ state: "visible" });
  });
});
