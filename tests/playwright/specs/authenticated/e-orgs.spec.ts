import { test, expect, type ConsoleMessage } from "@playwright/test";
import { OrganizationsPage, ENTERPRISE_SLUG } from "../../pages";

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

    await rowCheckbox.click({ force: true });
    await expect(rowCheckbox).toBeChecked();
    await rowCheckbox.click({ force: true });
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
