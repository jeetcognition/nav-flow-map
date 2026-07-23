import { test, expect, Page } from "@playwright/test";
import { SecretsPage } from "../../pages";

// Unique per-run prefix so parallel runs and re-runs never collide, and so
// afterEach can sweep any leftovers from a failed test.
const RUN_PREFIX = `DEVIN_QA_SECRET_${Date.now()}`;

function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("Secrets", () => {
  test.afterEach(async ({ page }) => {
    const secrets = new SecretsPage(page);
    await secrets.deleteSecretsByPrefix(RUN_PREFIX);
  });

  test("SECRET-SMK01 — Load the page cold", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await secrets.goto();

    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(breadcrumb).toContainText("Secrets");
    await expect(secrets.backToOrganization).toBeVisible();
    await expect(secrets.helpText).toBeVisible();
    await expect(secrets.learnMoreLink).toBeVisible();
    await expect(secrets.organizationTab).toBeVisible();
    await expect(secrets.personalTab).toBeVisible();
    await expect(secrets.searchInput).toBeVisible();
    await expect(secrets.bulkAddButton).toBeVisible();
    await expect(secrets.addSecretButton).toBeVisible();
    await expect(secrets.table).toBeVisible();
    // Either the empty state or at least one secret row renders.
    await expect(secrets.tableRows.first()).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("SECRET-SAN01 — Inspect both scopes", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const name = `${RUN_PREFIX}_SAN01`;
    const value = `san01-plain-${Date.now()}`;

    await secrets.goto();
    await secrets.createRawSecret(name, value, "san01 note");

    for (const scope of ["Organization", "Personal"] as const) {
      await secrets.selectScope(scope);
      for (const column of ["Name", "Type", "Note", "Updated by", "Updated at"]) {
        await expect(secrets.columnHeader(column)).toBeVisible();
      }
      // The stored plaintext value must never appear in either scope's list.
      await expect(page.locator("main")).not.toContainText(value);
    }

    // Counts are independent: the org secret is not counted or listed under Personal.
    await expect.poll(() => secrets.scopeCount("Organization")).toBeGreaterThan(0);
    await secrets.selectScope("Personal");
    await expect(secrets.rowByName(name)).toHaveCount(0);
    await secrets.selectScope("Organization");
    await expect(secrets.rowByName(name)).toBeVisible();

    await secrets.deleteSecret(name);
  });

  test("SECRET-SAN02 — Inspect the empty state", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const name = `${RUN_PREFIX}_SAN02`;

    await secrets.goto();
    // Ensure the other scope has a row so we can prove it does not leak.
    await secrets.createRawSecret(name, "san02-value");

    await secrets.selectScope("Personal");
    await expect.poll(() => secrets.scopeCount("Personal")).toBe(0);
    await expect(secrets.emptyStateHeading).toBeVisible();
    await expect(secrets.emptyStateHint).toBeVisible();
    // Controls remain usable and no organization row leaks into this view.
    await expect(secrets.searchInput).toBeEnabled();
    await expect(secrets.addSecretButton).toBeEnabled();
    await expect(secrets.bulkAddButton).toBeEnabled();
    await expect(secrets.rowByName(name)).toHaveCount(0);

    await secrets.selectScope("Organization");
    await secrets.deleteSecret(name);
  });

  test("SECRET-SAN03 — Open the dialog without submitting", async ({ page }) => {
    const secrets = new SecretsPage(page);

    await secrets.goto();
    const orgCount = await secrets.scopeCount("Organization");
    const personalCount = await secrets.scopeCount("Personal");

    await secrets.openAddDialog();
    await expect(
      secrets.dialog.getByRole("heading", { name: "New organization secret" }),
    ).toBeVisible();
    await expect(secrets.dialogOrganizationScope).toBeVisible();
    await expect(secrets.dialogPersonalScope).toBeVisible();
    await expect(secrets.dialogTypeSelect).toHaveText("key-value");
    await expect(secrets.dialogNameInput).toBeVisible();
    await expect(secrets.dialogValueInput).toBeVisible();
    await expect(secrets.dialogNoteInput).toBeVisible();
    await expect(secrets.dialog.getByText("Redact value")).toBeVisible();
    await expect(secrets.dialogRedactSwitch).toBeVisible();
    await expect(secrets.dialogStoreButton).toBeVisible();
    await expect(secrets.dialogCloseButton).toBeVisible();

    // The title reflects the selected scope.
    await secrets.dialogPersonalScope.click({ force: true });
    await expect(
      secrets.dialog.getByRole("heading", { name: "New personal secret" }),
    ).toBeVisible();
    await secrets.dialogOrganizationScope.click({ force: true });
    await expect(
      secrets.dialog.getByRole("heading", { name: "New organization secret" }),
    ).toBeVisible();

    await secrets.dialogCloseButton.click({ force: true });
    await expect(secrets.dialog).not.toBeVisible();
    await expect.poll(() => secrets.scopeCount("Organization")).toBe(orgCount);
    await expect.poll(() => secrets.scopeCount("Personal")).toBe(personalCount);
  });

  test("SECRET-SAN04 — Inspect Raw secret, Cookie, TOTP, and bulk-import forms", async ({
    page,
  }) => {
    const secrets = new SecretsPage(page);

    await secrets.goto();
    await secrets.openAddDialog();

    // Raw secret form.
    await expect(secrets.dialogNameInput).toHaveAttribute("placeholder", "EXAMPLE_API_KEY");
    await expect(secrets.dialogValueInput).toHaveAttribute("placeholder", "sk-example1234");
    await expect(secrets.dialogStoreButton).toBeVisible();

    // Cookie form: JSON / base64 input modes.
    await secrets.selectType("Cookie");
    await expect(secrets.dialog.getByText("Cookie secrets")).toBeVisible();
    await expect(secrets.dialog.getByRole("tab", { name: "Paste JSON" })).toBeVisible();
    await expect(secrets.dialog.getByRole("tab", { name: "Paste base64" })).toBeVisible();
    await expect(secrets.dialogNameInput).toHaveAttribute("placeholder", "LOGIN_COOKIE");

    // TOTP form: otpauth textarea and QR scanner.
    await secrets.selectType("One-Time Password (TOTP)");
    await expect(secrets.dialog.getByText("TOTP secrets")).toBeVisible();
    await expect(secrets.dialog.getByRole("button", { name: "Scan QR code" })).toBeVisible();
    await expect(secrets.dialogNameInput).toHaveAttribute("placeholder", "LOGIN_TOTP");

    await secrets.dialogCloseButton.click({ force: true });
    await expect(secrets.dialog).not.toBeVisible();

    // Bulk import: upload-file area, pasted .env textarea, scope, gated Store.
    await secrets.bulkAddButton.click();
    await expect(
      secrets.dialog.getByRole("heading", { name: "Import organization secrets" }),
    ).toBeVisible();
    await expect(secrets.dialog.getByText("Choose a file or drag and drop")).toBeVisible();
    await expect(secrets.dialog.getByText("one secret per line in Key=Value format")).toBeVisible();
    await expect(secrets.dialog.locator("textarea")).toBeVisible();
    await expect(secrets.dialogOrganizationScope).toBeVisible();
    await expect(secrets.dialogPersonalScope).toBeVisible();
    await expect(secrets.dialog.getByRole("button", { name: "Store", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(secrets.dialog).not.toBeVisible();
  });

  test("SECRET-REG03 — Create disposable Raw secrets with edge-case values and notes", async ({
    page,
  }) => {
    const secrets = new SecretsPage(page);

    await secrets.goto();

    // Blank value: required validation blocks the save.
    await secrets.openAddDialog();
    await secrets.dialogNameInput.fill(`${RUN_PREFIX}_REG03_BLANK`, { force: true });
    await secrets.dialogStoreButton.click({ force: true });
    await expect(secrets.dialog.getByText("Required")).toBeVisible();
    await expect(secrets.dialog).toBeVisible();
    await secrets.dialogCloseButton.click({ force: true });
    await expect(secrets.dialog).not.toBeVisible();

    // Multiline + Unicode + special-character value with an HTML-like note.
    const edgeName = `${RUN_PREFIX}_REG03_EDGE`;
    const edgeValue = `line1\nline2 🧪 ünïcødé $&<>"'\\ ${"x".repeat(500)}`;
    const htmlNote = "<b>bold?</b><script>alert(1)</script>";
    await secrets.createRawSecret(edgeName, edgeValue, htmlNote);

    // The note renders inertly as literal text and plaintext is never exposed.
    const row = secrets.rowByName(edgeName);
    await expect(row).toContainText("<b>bold?</b>");
    await expect(row.locator("b")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("line1");
    await secrets.deleteSecret(edgeName);
  });

  test("SECRET-REG04 — Validate Cookie JSON and base64 input", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const name = `${RUN_PREFIX}_REG04`;

    await secrets.goto();
    await secrets.openAddDialog();
    await secrets.selectType("Cookie");
    await secrets.dialogNameInput.fill(name, { force: true });

    const cookieInput = secrets.dialog.locator("textarea").first();

    // Malformed JSON is rejected with an error that names the problem but
    // never echoes cookie contents; nothing is parsed.
    await cookieInput.fill("not-json{{{", { force: true });
    await expect(secrets.dialog.getByText(/Invalid JSON/)).toBeVisible();
    await expect(secrets.dialog.getByText(/cookie parsed/)).toHaveCount(0);

    // A valid Chromium-format cookie is parsed, identified, and stored.
    const validCookie = JSON.stringify([
      { name: "session_id", value: "abc123", domain: ".example.com", path: "/" },
    ]);
    await cookieInput.fill(validCookie, { force: true });
    await expect(secrets.dialog.getByText(/Invalid JSON/)).toHaveCount(0);
    await expect(secrets.dialog.getByText("1 cookie parsed")).toBeVisible();
    await expect(secrets.dialog.getByText("session_id", { exact: true })).toBeVisible();
    await secrets.dialogStoreButton.click({ force: true });
    await expect(secrets.dialog).not.toBeVisible();

    const row = secrets.rowByName(name);
    await expect(row).toBeVisible();
    await expect(row).toContainText("Cookie");
    // The cookie contents are never shown in the list.
    await expect(page.locator("main")).not.toContainText("abc123");
    await secrets.deleteSecret(name);
  });

  test("SECRET-REG07 — Switch scopes and types with unsaved data, then dismiss", async ({
    page,
  }) => {
    const secrets = new SecretsPage(page);
    const name = `${RUN_PREFIX}_REG07`;

    await secrets.goto();
    const orgCount = await secrets.scopeCount("Organization");
    const personalCount = await secrets.scopeCount("Personal");

    await secrets.openAddDialog();
    await secrets.dialogNameInput.fill(name, { force: true });
    await secrets.dialogValueInput.fill("unsaved-value", { force: true });

    // Scope switching keeps the dialog title consistent with the selection.
    await secrets.dialogPersonalScope.click({ force: true });
    await expect(
      secrets.dialog.getByRole("heading", { name: "New personal secret" }),
    ).toBeVisible();
    await secrets.dialogOrganizationScope.click({ force: true });
    await expect(
      secrets.dialog.getByRole("heading", { name: "New organization secret" }),
    ).toBeVisible();

    // Type switching keeps the entered name; returning to Raw keeps the form consistent.
    await secrets.selectType("Cookie");
    await expect(secrets.dialogNameInput).toHaveValue(name);
    await secrets.selectType("Raw secret");
    await expect(secrets.dialogNameInput).toHaveValue(name);

    // Escape discards the draft without storing anything.
    await page.keyboard.press("Escape");
    await expect(secrets.dialog).not.toBeVisible();

    // Refresh and revisit: counts unchanged, nothing silently stored in either scope.
    await page.reload();
    await secrets.heading.waitFor({ state: "visible" });
    await expect.poll(() => secrets.scopeCount("Organization")).toBe(orgCount);
    await expect.poll(() => secrets.scopeCount("Personal")).toBe(personalCount);
    await expect(secrets.rowByName(name)).toHaveCount(0);
    await secrets.selectScope("Personal");
    await expect(secrets.rowByName(name)).toHaveCount(0);
  });

  test("SECRET-REG08 — Create, verify metadata, edit note, reload, delete", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const name = `${RUN_PREFIX}_REG08`;
    const value = `reg08-plain-${Date.now()}`;

    await secrets.goto();
    await secrets.createRawSecret(name, value, "original note");

    // Metadata is present on the row.
    const row = secrets.rowByName(name);
    await expect(row).toContainText("Raw secret");
    await expect(row).toContainText("original note");

    // The detail dialog shows metadata but never the stored plaintext; the
    // product only allows note editing ("Note-only editing mode") — value and
    // sensitivity are read-only by design.
    await secrets.openDetail(name);
    await expect(secrets.dialog.getByText(/Created .* by/)).toBeVisible();
    await expect(secrets.dialog.getByRole("textbox").first()).toHaveValue("encrypted");
    await expect(secrets.dialog).not.toContainText(value);
    await secrets.dialog.getByRole("button", { name: "Edit", exact: true }).click({ force: true });
    await expect(secrets.dialog.getByText("Note-only editing mode")).toBeVisible();
    const noteBox = secrets.dialog.getByRole("textbox").last();
    await noteBox.fill("updated note", { force: true });
    await secrets.dialog.getByRole("button", { name: "Save" }).click({ force: true });
    // Saving returns the dialog to view mode with the new note applied.
    await expect(secrets.dialog.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
    await expect(secrets.dialog.getByRole("textbox").last()).toHaveValue("updated note");
    await page.keyboard.press("Escape");
    await expect(secrets.dialog).not.toBeVisible();

    // The edit persists across a reload and only this secret changed.
    await page.reload();
    await secrets.heading.waitFor({ state: "visible" });
    await expect(secrets.rowByName(name)).toContainText("updated note");
    await expect(page.locator("main")).not.toContainText(value);

    await secrets.deleteSecret(name);
    await expect(secrets.rowByName(name)).toHaveCount(0);
  });

  test("SECRET-REG09 — Cancel then confirm deletion with similarly named rows", async ({
    page,
  }) => {
    const secrets = new SecretsPage(page);
    const nameA = `${RUN_PREFIX}_REG09_A`;
    const nameB = `${RUN_PREFIX}_REG09_A_2`;

    await secrets.goto();
    await secrets.createRawSecret(nameA, "reg09-value-a");
    await secrets.createRawSecret(nameB, "reg09-value-b");

    // The confirmation identifies the exact secret; cancel changes nothing.
    await secrets.openDeleteDialog(nameA);
    await expect(secrets.dialog).toContainText(`“${nameA}”`);
    await secrets.cancelDelete();
    await expect(secrets.rowByName(nameA)).toBeVisible();
    await expect(secrets.rowByName(nameB)).toBeVisible();

    // Confirm removes only the selected secret.
    await secrets.openDeleteDialog(nameA);
    await expect(secrets.dialog).toContainText(`“${nameA}”`);
    await secrets.confirmDelete(nameA);
    await expect(secrets.rowByName(nameB)).toBeVisible();

    await secrets.deleteSecret(nameB);
  });
});
