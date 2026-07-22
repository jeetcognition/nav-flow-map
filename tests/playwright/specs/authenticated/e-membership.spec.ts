import { test, expect, ConsoleMessage, Page } from "@playwright/test";
import { MembershipPage, MEMBER_COLUMNS } from "../../pages";
import { ALT_SUBORG_NAME } from "../../support/paths";

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
});
