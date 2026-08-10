import { test, expect } from "@playwright/test";
import { EnterpriseSecretsPage } from "../../pages";
import { routes } from "../../support/paths";
import { expectEnterpriseBreadcrumbs } from "../../support/breadcrumbs";
import { expectNoPageErrors } from "../../support/errors";

test.describe("Enterprise Secrets", () => {
  test("ESEC-SMK01 — Load the page cold with list, search, and create controls", async ({
    page,
  }) => {
    const secrets = new EnterpriseSecretsPage(page);
    await secrets.goto();

    await expect(secrets.heading).toBeVisible();
    await expect(secrets.helpText).toBeVisible();
    await expect(secrets.organizationTab).toBeVisible();
    await expect(secrets.personalTab).toBeVisible();
    await expect(secrets.searchInput).toBeVisible();
    await expect(secrets.bulkAddButton).toBeVisible();
    await expect(secrets.addSecretButton).toBeVisible();

    // With no enterprise secrets stored, a clean empty state renders instead of
    // a broken table or a perpetual skeleton.
    if ((await secrets.tableRows.count()) === 0) {
      await expect(secrets.emptyStateHeading).toBeVisible();
      await expect(secrets.emptyStateHint).toBeVisible();
    }
    for (const column of ["Name", "Type", "Note", "Updated by", "Updated at"]) {
      await expect(secrets.columnHeader(column)).toBeVisible();
    }
  });

  test("ESEC-REG01 — Verify breadcrumb and Back to enterprise navigation", async ({ page }) => {
    const secrets = new EnterpriseSecretsPage(page);
    await expectEnterpriseBreadcrumbs(page, () => secrets.goto(), {
      crumbs: ["Settings", "Enterprise", "Secrets"],
    });
  });

  test("ESEC-REG02 — Add-secret panel fields, redaction, and reset on reopen", async ({ page }) => {
    const secrets = new EnterpriseSecretsPage(page);
    page.on("dialog", (dialog) => {
      throw new Error(`Unexpected dialog: ${dialog.message()}`);
    });
    await secrets.goto();
    await secrets.openAddDialog();

    // The panel renders the enterprise-scoped form with every documented field.
    await expect(secrets.dialog.getByRole("heading", { name: /secret/i }).first()).toBeVisible();
    await expect(secrets.dialogNameInput).toBeVisible();
    await expect(secrets.dialogValueInput).toBeVisible();
    await expect(secrets.dialogNoteInput).toBeVisible();
    await expect(secrets.dialogStoreButton).toBeVisible();

    // The secret name is capped at 255 characters.
    await expect(secrets.dialogNameInput).toHaveAttribute("maxlength", "255");
    await secrets.dialogNameInput.fill("A".repeat(300), { force: true });
    expect((await secrets.dialogNameInput.inputValue()).length).toBe(255);

    // Injection payloads in the note stay literal text (no execution, no crash).
    await secrets.dialogNoteInput.fill("<script>alert(1)</script> ' OR 1=1 --", { force: true });
    await expect(secrets.dialogNoteInput).toHaveValue("<script>alert(1)</script> ' OR 1=1 --");

    // Redact value defaults ON; toggling it is reflected immediately.
    await expect(secrets.dialogRedactSwitch).toHaveAttribute("aria-checked", "true");
    await secrets.dialogRedactSwitch.click({ force: true });
    await expect(secrets.dialogRedactSwitch).toHaveAttribute("aria-checked", "false");

    // Closing unmounts the panel and reopening resets the form to defaults —
    // no draft name and Redact value back ON.
    await secrets.closeDialog();
    await secrets.openAddDialog();
    await expect(secrets.dialogNameInput).toHaveValue("");
    await expect(secrets.dialogRedactSwitch).toHaveAttribute("aria-checked", "true");
    await secrets.closeDialog();
  });

  test("ESEC-REG03 — Bulk import flags invalid keys and formats inline", async ({ page }) => {
    const secrets = new EnterpriseSecretsPage(page);
    await secrets.goto();
    await secrets.openImportDialog();

    await secrets.importTextarea.fill("1KEY=value\nKEY-NAME!@#=value\nNOSEPARATOR", {
      force: true,
    });

    // Each invalid line is reported individually with its line number, and the
    // submit stays disabled while any line is invalid.
    await expect(secrets.importPreview).toBeVisible();
    await expect(secrets.dialog.getByText(/Invalid key name.*\(line 1\)/)).toBeVisible();
    await expect(secrets.dialog.getByText(/Expected Key=Value \(line 2\)/)).toBeVisible();
    await expect(secrets.dialog.getByText(/Expected Key=Value \(line 3\)/)).toBeVisible();
    await expect(secrets.importStoreButton).toBeDisabled();

    // A valid payload with an inline comment parses into a storable preview row.
    await secrets.importTextarea.fill("QA_TEMP_KEY=value # note about the key", { force: true });
    await expect(secrets.dialog.getByText("QA_TEMP_KEY")).toBeVisible();
    await expect(secrets.importStoreButton).toBeEnabled();
    await secrets.closeDialog();
  });

  test("ESEC-REG04 — Search sanitizes injection payloads", async ({ page }) => {
    const secrets = new EnterpriseSecretsPage(page);
    page.on("dialog", (dialog) => {
      throw new Error(`Unexpected dialog: ${dialog.message()}`);
    });
    await secrets.goto();

    for (const payload of ["<script>alert(1)</script>", "' OR 1=1 --", "😀", "z".repeat(300)]) {
      await secrets.searchInput.fill(payload);
      await expect(secrets.emptyStateHeading).toBeVisible();
      await expect(secrets.heading).toBeVisible();
    }

    await secrets.searchInput.fill("");
    await expect(secrets.heading).toBeVisible();
  });

  test("ESEC-REG05 — Verify the page loads without console errors or error boundaries", async ({
    page,
  }) => {
    const secrets = new EnterpriseSecretsPage(page);
    await expectNoPageErrors(page, () => page.goto(routes.entSecrets()), {
      ready: secrets.heading,
    });
  });
});
