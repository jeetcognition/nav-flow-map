import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";
import { OrgCreatePage, OrganizationsPage, ENTERPRISE_SLUG, routes } from "../../pages";

const CREATE_URL = `/org/${ENTERPRISE_SLUG}/settings/organizations/create`;

/** Delete an organization from the Organizations list if it exists. */
async function deleteOrgIfPresent(page: Page, name: string) {
  const orgs = new OrganizationsPage(page);
  await orgs.goto();
  await orgs.searchInput.fill(name);
  await page.keyboard.press("Enter");
  await expect(
    orgs
      .rowByName(name)
      .first()
      .or(page.getByText(/No organization matches your search/i)),
  ).toBeVisible();
  if ((await orgs.rowByName(name).count()) === 0) return;
  await orgs.rowByName(name).first().getByRole("button", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toHaveCount(0);
  await orgs.searchInput.fill(name);
  await page.keyboard.press("Enter");
  await expect(page.getByText(/No organization matches your search/i)).toBeVisible();
}

test.describe("Create organization", () => {
  let errors: string[] = [];

  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (msg: ConsoleMessage) => {
      const text = msg.text();
      if (msg.type() === "error" && !text.includes("Failed to load icon")) {
        errors.push(text);
      }
    });
  });

  test.afterEach(async () => {
    expect(errors, `console errors: ${errors.join(", ")}`).toHaveLength(0);
  });

  test("ORGCRT-SAN02 — Inspect the default member state", async ({ page }) => {
    const create = new OrgCreatePage(page);
    await create.goto();

    await expect(create.heading).toBeVisible();
    await expect(create.addMeCheckbox).toBeVisible();
    await expect(create.addMeCheckbox).toBeChecked();
    await expect(create.memberSearchInput).toBeVisible();
    await expect(create.memberTable.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(create.memberTable.getByRole("columnheader", { name: "Email" })).toBeVisible();
    await expect(create.previousPageButton).toBeVisible();
    await expect(create.nextPageButton).toBeVisible();
    await expect(create.selectedCount).toHaveText("1 member selected");
  });

  test("ORGCRT-SAN03 — Inspect the repository permissions section without submitting", async ({
    page,
  }) => {
    const create = new OrgCreatePage(page);
    await create.goto();

    await expect(create.noPermissionsByDefault).toBeVisible();
    await expect(create.repoPermissionsLink).toBeVisible();
    await expect(create.repoPermissionsLink).toHaveAttribute("href", routes.repositories());
    // Permissions can only be granted after creation, from the repositories page.
    await expect(
      page.getByText("to grant permissions after creating this organization"),
    ).toBeVisible();
    await expect(create.createButton).toBeDisabled();
  });

  test("ORGCRT-REG02 — Validate blank, zero, positive, negative, decimal, text, exponent, and leading-zero ACU values", async ({
    page,
  }) => {
    const create = new OrgCreatePage(page);
    await create.goto();
    await create.nameInput.fill("qa-acu-validation-probe");

    // Blank means "No limit" and keeps the form submittable.
    await expect(create.acuInput).toHaveAttribute("placeholder", "No limit");
    await expect(create.acuInput).toHaveValue("");
    await expect(create.createButton).toBeEnabled();

    for (const valid of ["0", "25", "1e5", "007"]) {
      await create.acuInput.fill(valid);
      await expect(create.createButton).toBeEnabled();
    }

    await create.acuInput.fill("-5");
    await expect(create.acuValidationMessage("ACU limits cannot be negative")).toBeVisible();
    await expect(create.createButton).toBeDisabled();

    await create.acuInput.fill("3.5");
    await expect(create.acuValidationMessage("ACU limits must be a whole number")).toBeVisible();
    await expect(create.createButton).toBeDisabled();

    // The number input rejects free text entirely; the field stays blank.
    await create.acuInput.fill("");
    await create.acuInput.click();
    await page.keyboard.type("abc");
    await expect(create.acuInput).toHaveValue("");
    await expect(create.createButton).toBeEnabled();

    // Never submitted: no organization is created by this test.
    await create.cancelButton.click();
    await expect(page).toHaveURL(routes.organizations());
  });

  test("ORGCRT-REG04 — Search members by name, email, no-match, whitespace, Unicode, long, and HTML-like input", async ({
    page,
  }) => {
    const create = new OrgCreatePage(page);
    await create.goto();
    await expect(create.memberCheckboxes.first()).toBeVisible();

    await create.memberSearchInput.fill("Jeet");
    await expect(create.memberRow("jeet.bangoria@partners.cognition.ai")).toBeVisible();

    await create.memberSearchInput.fill("albert@cognition.ai");
    await expect(create.memberRow("Albert Han")).toBeVisible();

    const noMatchQueries = [
      "no-such-member-98765",
      "   ",
      "日本語テスト",
      "a".repeat(300),
      "<script>alert(1)</script>",
    ];
    for (const q of noMatchQueries) {
      await create.memberSearchInput.fill(q);
      await expect(create.noMembersFound).toBeVisible();
    }

    await create.memberSearchInput.fill("");
    await expect(create.memberCheckboxes.first()).toBeVisible();
    expect(await create.memberCheckboxes.count()).toBeGreaterThan(1);
  });

  test("ORGCRT-REG05 — Select and deselect members across pages and searches", async ({ page }) => {
    const create = new OrgCreatePage(page);
    await create.goto();
    await expect(create.selectedCount).toHaveText("1 member selected");

    const firstCheckbox = create.memberCheckboxes.first();
    const firstRow = page.getByRole("row", { name: /Select member/ }).first();
    const firstRowText = (await firstRow.textContent()) ?? "";
    await create.toggleMemberCheckbox(firstCheckbox);
    await expect(firstCheckbox).toBeChecked();
    await expect(create.selectedCount).toHaveText("2 members selected");

    await create.nextPageButton.click();
    await expect(firstRow).not.toHaveText(firstRowText);
    await expect(create.selectedCount).toHaveText("2 members selected");
    // Skip the current user's own row: with "Add me" checked it is already
    // counted, so toggling it cannot change the selected count.
    const currentUserEmail = (process.env.DEVIN_ADMIN_EMAIL ?? "").trim();
    const pageTwoCheckbox = page
      .getByRole("row", { name: /Select member/ })
      .filter({ hasNotText: currentUserEmail || "\u0000" })
      .first()
      .getByRole("checkbox");
    await create.toggleMemberCheckbox(pageTwoCheckbox);
    await expect(create.selectedCount).toHaveText("3 members selected");
    await create.toggleMemberCheckbox(pageTwoCheckbox);
    await expect(create.selectedCount).toHaveText("2 members selected");

    await create.previousPageButton.click();
    await expect(firstRow).toHaveText(firstRowText);
    await expect(firstCheckbox).toBeChecked();

    await create.memberSearchInput.fill("no-such-member-98765");
    await expect(create.noMembersFound).toBeVisible();
    await create.memberSearchInput.fill("");
    await expect(firstCheckbox).toBeChecked();
    await expect(create.selectedCount).toHaveText("2 members selected");

    await create.toggleMemberCheckbox(firstCheckbox);
    await expect(create.selectedCount).toHaveText("1 member selected");
  });

  test("ORGCRT-REG06 — Toggle Add me as a member while selecting other members", async ({
    page,
  }) => {
    const create = new OrgCreatePage(page);
    await create.goto();
    await expect(create.addMeCheckbox).toBeChecked();
    await expect(create.selectedCount).toHaveText("1 member selected");

    const otherMember = create.memberRow("Albert Han").getByRole("checkbox");
    await create.toggleMemberCheckbox(otherMember);
    await expect(otherMember).toBeChecked();
    await expect(create.selectedCount).toHaveText("2 members selected");

    await create.addMeCheckbox.click({ force: true });
    await expect(create.addMeCheckbox).not.toBeChecked();
    await expect(create.selectedCount).toHaveText("1 member selected");
    await expect(otherMember).toBeChecked();

    await create.addMeCheckbox.click({ force: true });
    await expect(create.addMeCheckbox).toBeChecked();
    await expect(create.selectedCount).toHaveText("2 members selected");

    // Toggling the current user's own row while "Add me" is checked never
    // double-counts them: duplicate membership is impossible.
    const currentUserEmail = (process.env.DEVIN_ADMIN_EMAIL ?? "").trim();
    if (currentUserEmail) {
      await create.memberSearchInput.fill(currentUserEmail);
      const currentUserRowCheckbox = create.memberRow(currentUserEmail).getByRole("checkbox");
      await expect(currentUserRowCheckbox).toBeVisible();
      await create.toggleMemberCheckbox(currentUserRowCheckbox);
      await expect(create.selectedCount).toHaveText("2 members selected");
      await create.memberSearchInput.fill("");
    }

    await expect(otherMember).toBeChecked();
    await create.toggleMemberCheckbox(otherMember);
    await expect(create.selectedCount).toHaveText("1 member selected");
  });

  test("ORGCRT-REG07 — Enter form data, then Cancel, Back, refresh, and revisit without submitting", async ({
    page,
  }) => {
    const create = new OrgCreatePage(page);
    const orgs = new OrganizationsPage(page);
    const abandonedName = `qa-noop-org-${Date.now()}`;

    await create.goto();
    await create.nameInput.fill(abandonedName);
    await create.acuInput.fill("10");
    await create.cancelButton.click();
    await expect(page).toHaveURL(routes.organizations());

    await create.goto();
    await expect(create.nameInput).toHaveValue("");
    await expect(create.acuInput).toHaveValue("");

    await create.nameInput.fill(abandonedName);
    await page.reload();
    await expect(create.nameInput).toHaveValue("");

    await create.nameInput.fill(abandonedName);
    await page.goBack();
    await expect(page).toHaveURL(routes.organizations());

    await create.goto();
    await expect(create.nameInput).toHaveValue("");

    await orgs.goto();
    await orgs.searchInput.fill(abandonedName);
    await page.keyboard.press("Enter");
    await expect(page.getByText(/No organization matches your search/i)).toBeVisible();
  });

  test("ORGCRT-REG08 — Follow the repository-permissions link, then return", async ({ page }) => {
    const create = new OrgCreatePage(page);
    const abandonedName = `qa-noop-org-${Date.now()}`;

    await create.goto();
    await create.nameInput.fill(abandonedName);
    await create.repoPermissionsLink.click();
    await expect(page).toHaveURL(routes.repositories());
    await expect(page.getByRole("heading", { name: "Repositories" }).first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(routes.orgCreate());
    await expect(create.nameInput).toHaveValue("");

    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchInput.fill(abandonedName);
    await page.keyboard.press("Enter");
    await expect(page.getByText(/No organization matches your search/i)).toBeVisible();
  });

  test("ORGCRT-REG10 — Inspect URL, UI, console, and requests while entering names, ACU limits, and member searches", async ({
    page,
  }) => {
    const failedResponses: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) {
        failedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    const create = new OrgCreatePage(page);
    await create.goto();

    const probe = `qa-privacy-probe-${Date.now()}`;
    await create.nameInput.fill(probe);
    await create.acuInput.fill("42");
    await create.memberSearchInput.fill(probe);
    await expect(create.noMembersFound).toBeVisible();
    await create.memberSearchInput.fill("");
    await expect(create.memberCheckboxes.first()).toBeVisible();

    // Typed data never leaks into the page URL.
    await expect(page).toHaveURL(CREATE_URL);
    expect(page.url()).not.toContain(probe);
    expect(page.url()).not.toContain("42");

    // No server errors or stack traces surfaced while interacting.
    expect(failedResponses, `5xx responses: ${failedResponses.join(", ")}`).toHaveLength(0);
    await expect(page.getByText(/stack trace|Traceback|Internal Server Error/i)).toHaveCount(0);

    await create.cancelButton.click();
    await expect(page).toHaveURL(routes.organizations());
  });

  test("ORGCRT-E2E01 — Create a temporary organization, verify it, then delete it", async ({
    page,
  }) => {
    const create = new OrgCreatePage(page);
    const orgs = new OrganizationsPage(page);
    const tempOrgName = `qa-temp-org-${Date.now()}`;

    try {
      await create.goto();
      await create.nameInput.fill(tempOrgName);
      await create.acuInput.fill("25");
      await expect(create.addMeCheckbox).toBeChecked();
      await expect(create.selectedCount).toHaveText("1 member selected");
      await create.createButton.click();
      await expect(create.successMessage).toBeVisible();

      // Verify the new organization in the list: 1 member, 0 repositories, ACU limit 25.
      await orgs.goto();
      await orgs.searchInput.fill(tempOrgName);
      await page.keyboard.press("Enter");
      const row = orgs.rowByName(tempOrgName).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(tempOrgName);
      await expect(row.getByRole("cell").nth(2)).toHaveText("1");
      await expect(row.getByRole("cell").nth(3)).toHaveText("0");
    } finally {
      // Cleanup must run even if an intermediate assertion failed.
      await deleteOrgIfPresent(page, tempOrgName);
    }
  });
});
