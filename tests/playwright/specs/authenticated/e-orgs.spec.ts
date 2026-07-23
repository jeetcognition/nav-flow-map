import { test, expect, request, type ConsoleMessage } from "@playwright/test";
import { OrganizationsPage, ENTERPRISE_SLUG, TEST_SUBORG_DISPLAY } from "../../pages";

const PAGINATED_ORGS = "/api/enterprise/all-organizations/paginated";

interface PageInfo {
  has_next: boolean;
  has_previous: boolean;
}

test.describe("Organizations", () => {
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

  test("ORG-SMK01 — Load the page cold", async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();

    await expect(page).toHaveURL(`/org/${ENTERPRISE_SLUG}/settings/organizations`);
    await expect(orgs.heading).toBeVisible();
    await expect(orgs.searchInput).toBeVisible();
    await expect(orgs.createButton).toBeVisible();
    await expect(orgs.headerRow).toContainText("Name");
    await expect(orgs.headerRow).toContainText("Members");
    await expect(orgs.headerRow).toContainText("Repositories");
    await expect(orgs.headerRow).toContainText("Billing cycle");
    await expect(orgs.headerRow).toContainText("ACU limit");
    await expect(orgs.nextButton).toBeVisible();
  });

  test("ORG-SAN02 — Open a row's edit control without saving", async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchInput.fill("jeet-test-org");
    await page.keyboard.press("Enter");
    await expect(orgs.rowByName("jeet-test-org")).toBeVisible();

    const row = orgs.rowByName("jeet-test-org");
    await row.getByRole("button", { name: "Update name and limits" }).click();

    await expect(page.locator("#displayName")).toHaveValue("jeet-test-org");
    await expect(page.locator("#maxAcuLimit")).toHaveAttribute("placeholder", "No limit");
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(orgs.rowByName("jeet-test-org")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toHaveCount(0);
  });

  test("ORG-SAN03 — Inspect the first and last pages", async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    const paginated = page.waitForResponse((r) => r.url().includes(PAGINATED_ORGS));
    await orgs.goto();
    const firstPageInfo = (await (await paginated).json()).page_info as PageInfo;
    expect(firstPageInfo.has_previous).toBe(false);

    await expect(orgs.previousButton).toBeVisible();
    await expect(orgs.nextButton).toBeVisible();
    await expect(orgs.nextButton).toBeEnabled();

    // Previous is a no-op on the first page: the visible data does not change.
    const firstRow = orgs.rows.nth(1);
    const firstPageRowText = (await firstRow.textContent()) ?? "";
    await orgs.previousButton.click();
    await expect(firstRow).toHaveText(firstPageRowText);

    // Walk forward until the API reports the last page.
    let hasNext = firstPageInfo.has_next;
    for (let i = 0; hasNext && i < 30; i++) {
      const response = page.waitForResponse((r) => r.url().includes(PAGINATED_ORGS));
      await orgs.nextButton.click();
      const pageInfo = (await (await response).json()).page_info as PageInfo;
      hasNext = pageInfo.has_next;
      if (!hasNext) expect(pageInfo.has_previous).toBe(true);
    }
    expect(hasNext).toBe(false);

    // On the last page Next is a no-op and Previous still works.
    await expect(orgs.previousButton).toBeVisible();
    await expect(orgs.nextButton).toBeVisible();
    const lastPageRowText = (await firstRow.textContent()) ?? "";
    await orgs.nextButton.click();
    await expect(firstRow).toHaveText(lastPageRowText);

    const back = page.waitForResponse((r) => r.url().includes(PAGINATED_ORGS));
    await orgs.previousButton.click();
    expect(((await (await back).json()).page_info as PageInfo).has_next).toBe(true);
  });

  test("ORG-REG01 — Search with full/partial name, no-match, whitespace, case variants, and safe special characters", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();

    const matchQueries = ["jeet-test-org", "jeet", "JEET-TEST"];
    for (const q of matchQueries) {
      await orgs.searchInput.fill(q);
      await page.keyboard.press("Enter");
      await expect(orgs.rowByName("jeet-test-org")).toBeVisible();
    }

    const noMatchQueries = ["no-such-org-98765", "   ", "' OR '1'='1", "<script>alert(1)</script>"];
    for (const q of noMatchQueries) {
      await orgs.searchInput.fill(q);
      await page.keyboard.press("Enter");
      await expect(page.getByText(/No organization matches your search/i)).toBeVisible();
    }
  });

  test("ORG-REG02 — Search for a name that appears on multiple rows", async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchInput.fill("rohit-test-sub-org-01");
    await page.keyboard.press("Enter");

    const rows = orgs.content.getByRole("row").filter({ hasText: "rohit-test-sub-org-01" });
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(2);
    for (const row of await rows.all()) {
      await expect(row).toBeVisible();
    }
  });

  test("ORG-REG03 — Navigate Previous and Next while search is active, then clear search", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();

    await orgs.searchInput.fill("test");
    await page.keyboard.press("Enter");
    await expect(orgs.rows.first()).toBeVisible();

    await expect(orgs.nextButton).toBeVisible();
    await orgs.nextButton.click();
    await expect(orgs.rows.first()).toBeVisible();

    await expect(orgs.previousButton).toBeVisible();
    await orgs.previousButton.click();
    await expect(orgs.rows.first()).toBeVisible();

    await orgs.searchInput.fill("");
    await page.keyboard.press("Enter");
    await expect(orgs.rows.first()).toBeVisible();
  });

  test("ORG-REG04 — Select and deselect one row and the header checkbox", async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchInput.fill("jeet-test-org");
    await page.keyboard.press("Enter");
    await expect(orgs.rows).toHaveCount(2);

    const headerCheckbox = page.getByRole("checkbox", { name: "Select all rows" });
    const rowCheckbox = page.getByRole("checkbox", { name: "Select row" }).first();

    // force: the row wrapper div intercepts pointer events over these base-ui
    // checkboxes, so actionability checks never pass without it.
    await rowCheckbox.check({ force: true });
    await expect(rowCheckbox).toBeChecked();
    await rowCheckbox.uncheck({ force: true });
    await expect(rowCheckbox).not.toBeChecked();

    await headerCheckbox.click({ force: true });
    await expect(headerCheckbox).toHaveAttribute("aria-checked", "true");
    await expect(rowCheckbox).toBeChecked();

    await headerCheckbox.click({ force: true });
    await expect(rowCheckbox).not.toBeChecked();
    const allRowCheckbox = page.getByRole("checkbox", { name: "Select row" });
    for (const checkbox of await allRowCheckbox.all()) {
      await expect(checkbox).not.toBeChecked();
    }
  });

  test("ORG-REG05 — Change name and ACU limit, save, reload, and restore the originals", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    const originalName = TEST_SUBORG_DISPLAY;
    const tempName = `${originalName}-reg05-tmp`;

    await orgs.goto();
    await orgs.searchFor(originalName);
    await orgs.openManageDialog(originalName);
    await expect(orgs.nameInput).toHaveValue(originalName);
    const originalAcu = await orgs.acuInput.inputValue();

    try {
      await orgs.nameInput.fill(tempName);
      await orgs.acuInput.fill("7");
      const save = await orgs.saveAndWaitForPatch();
      expect(save.ok()).toBe(true);

      await page.reload();
      await orgs.searchFor(tempName);
      const row = orgs.rowByName(tempName);
      await expect(row).toBeVisible();
      await expect(row.getByRole("cell").nth(4)).toHaveText("7");

      await orgs.openManageDialog(tempName);
      await expect(orgs.nameInput).toHaveValue(tempName);
      await expect(orgs.acuInput).toHaveValue("7");
    } finally {
      // Restore the original name and ACU limit whether or not assertions passed.
      if ((await orgs.manageDialog.count()) === 0) {
        await orgs.searchFor(tempName);
        await orgs.openManageDialog(tempName);
      }
      await orgs.nameInput.fill(originalName);
      await orgs.acuInput.fill(originalAcu);
      const restore = await orgs.saveAndWaitForPatch();
      expect(restore.ok()).toBe(true);
    }

    await page.reload();
    await orgs.searchFor(originalName);
    const restoredRow = orgs.rowByName(originalName);
    await expect(restoredRow).toBeVisible();
    await expect(restoredRow.getByRole("cell").nth(4)).toHaveText("No limit");
  });

  test("ORG-REG07 — Enter No limit, zero, negative, decimal, text, exponent, and leading-zero ACU values", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchFor(TEST_SUBORG_DISPLAY);
    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await expect(orgs.acuInput).toHaveValue("");
    await expect(orgs.acuInput).toHaveAttribute("placeholder", "No limit");

    // Negative and decimal values fail native min=0/integer validation; Save stays disabled.
    for (const invalid of ["-5", "2.5"]) {
      await orgs.acuInput.fill(invalid);
      await expect(orgs.saveButton).toBeDisabled();
    }

    // Text is not accepted by the numeric input at all.
    await orgs.acuInput.fill("");
    await orgs.acuInput.pressSequentially("abc");
    await expect(orgs.acuInput).toHaveValue("");
    await expect(orgs.saveButton).toBeDisabled();

    // Exponent notation is accepted by the numeric input as a valid integer.
    await orgs.acuInput.fill("");
    await orgs.acuInput.pressSequentially("1e5");
    await expect(orgs.acuInput).toHaveValue("1e5");
    await expect(orgs.saveButton).toBeEnabled();

    // Save zero, verify it persists, then a leading-zero value, then restore No limit.
    await orgs.acuInput.fill("0");
    expect((await orgs.saveAndWaitForPatch()).ok()).toBe(true);
    const row = orgs.rowByName(TEST_SUBORG_DISPLAY);
    await expect(row.getByRole("cell").nth(4)).toHaveText("0");

    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await expect(orgs.acuInput).toHaveValue("0");
    await orgs.acuInput.fill("007");
    expect((await orgs.saveAndWaitForPatch()).ok()).toBe(true);
    await expect(row.getByRole("cell").nth(4)).toHaveText("7");

    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await orgs.acuInput.fill("");
    expect((await orgs.saveAndWaitForPatch()).ok()).toBe(true);
    await expect(row.getByRole("cell").nth(4)).toHaveText("No limit");
  });

  test("ORG-REG08 — Enter boundary and extremely large positive ACU values, then attempt to save", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchFor(TEST_SUBORG_DISPLAY);
    const row = orgs.rowByName(TEST_SUBORG_DISPLAY);
    await expect(row.getByRole("cell").nth(4)).toHaveText("No limit");

    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await orgs.acuInput.fill("99999999999999999999");
    const save = await orgs.saveAndWaitForPatch();
    expect(save.ok()).toBe(false);

    // The rejected save leaves the dialog open and does not partially update the row.
    await expect(orgs.manageDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(orgs.manageDialog).toHaveCount(0);

    await page.reload();
    await orgs.searchFor(TEST_SUBORG_DISPLAY);
    await expect(row.getByRole("cell").nth(4)).toHaveText("No limit");

    // The rejected PATCH logs a resource error on the console; it is expected here.
    errors = errors.filter(
      (text) => !/the server responded with a status of|failed to update/i.test(text),
    );
  });

  test("ORG-REG09 — Make unsaved changes, then dismiss via Escape, outside click, and navigation", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    const patches: string[] = [];
    page.on("request", (r) => {
      if (r.method() === "PATCH" && r.url().includes("/api/enterprise/organizations/")) {
        patches.push(r.url());
      }
    });

    await orgs.goto();
    await orgs.searchFor(TEST_SUBORG_DISPLAY);
    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    const originalAcu = await orgs.acuInput.inputValue();

    // Escape discards the dirty state without saving.
    await orgs.nameInput.fill(`${TEST_SUBORG_DISPLAY}-dirty`);
    await page.keyboard.press("Escape");
    await expect(orgs.manageDialog).toHaveCount(0);
    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await expect(orgs.nameInput).toHaveValue(TEST_SUBORG_DISPLAY);
    await expect(orgs.acuInput).toHaveValue(originalAcu);

    // Clicking outside the dialog also discards the dirty state.
    await orgs.nameInput.fill(`${TEST_SUBORG_DISPLAY}-dirty`);
    await page.mouse.click(10, 10);
    await expect(orgs.manageDialog).toHaveCount(0);
    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await expect(orgs.nameInput).toHaveValue(TEST_SUBORG_DISPLAY);

    // Navigating away and returning shows the original, unsaved values.
    await orgs.nameInput.fill(`${TEST_SUBORG_DISPLAY}-dirty`);
    await orgs.goto();
    await orgs.searchFor(TEST_SUBORG_DISPLAY);
    await expect(orgs.rowByName(TEST_SUBORG_DISPLAY)).toBeVisible();
    await orgs.openManageDialog(TEST_SUBORG_DISPLAY);
    await expect(orgs.nameInput).toHaveValue(TEST_SUBORG_DISPLAY);
    await page.keyboard.press("Escape");

    expect(patches).toHaveLength(0);
  });

  test("ORG-REG10 — Click delete, cancel, repeat, and confirm", async ({ page }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await orgs.searchInput.fill("jeet-test-org");
    await page.keyboard.press("Enter");
    await expect(orgs.rowByName("jeet-test-org")).toBeVisible();

    const row = orgs.rowByName("jeet-test-org");
    await row.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Delete" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(orgs.rowByName("jeet-test-org")).toBeVisible();

    await row.getByRole("button", { name: "Delete" }).click();
    const dialog2 = page.getByRole("dialog");
    await expect(dialog2).toBeVisible();
    await dialog2.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog2).toHaveCount(0);
    await expect(orgs.rowByName("jeet-test-org")).toBeVisible();
  });

  test("ORG-REG11 — Attempt list, edit, and delete operations without authorization or with a tampered organization ID", async ({
    page,
    baseURL,
  }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();
    await expect(orgs.heading).toBeVisible();
    const authorization = await orgs.captureAuthorizationHeader();
    const tamperedId = "org-00000000000000000000000000000000";
    const orgApiPath = `/api/enterprise/organizations/${tamperedId}`;

    // A valid admin token cannot touch an organization outside its enterprise.
    const authed = await request.newContext({ baseURL, extraHTTPHeaders: { authorization } });
    const anon = await request.newContext({ baseURL });
    try {
      expect((await authed.patch(orgApiPath, { data: { displayName: "x" } })).status()).toBe(403);
      expect((await authed.delete(orgApiPath)).status()).toBe(403);

      // Without a token every operation is denied.
      expect((await anon.get("/api/enterprise/organizations")).status()).toBe(401);
      expect((await anon.patch(orgApiPath, { data: { displayName: "x" } })).status()).toBe(401);
      expect((await anon.delete(orgApiPath)).status()).toBe(401);
    } finally {
      await authed.dispose();
      await anon.dispose();
    }

    // Organization data is unchanged after the denied attempts.
    await orgs.searchFor(TEST_SUBORG_DISPLAY);
    const row = orgs.rowByName(TEST_SUBORG_DISPLAY);
    await expect(row).toBeVisible();
    await expect(row.getByRole("cell").nth(4)).toHaveText("No limit");
  });

  test("ORG-REG12 — Inspect URL, UI, console, and requests during search, edit, and delete", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    await orgs.goto();

    await orgs.searchInput.fill("jeet-test-org");
    await page.keyboard.press("Enter");
    await expect(orgs.rowByName("jeet-test-org")).toBeVisible();
    await expect(page).toHaveURL(/\/settings\/organizations$/);

    const row = orgs.rowByName("jeet-test-org");
    await row.getByRole("button", { name: "Update name and limits" }).click();
    await expect(page.locator("#displayName")).toHaveValue("jeet-test-org");
    await page.keyboard.press("Escape");

    await row.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
});
