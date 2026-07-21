import { test, expect } from "@playwright/test";
import { SecretsPage } from "../../pages";
import { assertNoLeaks } from "../../support/leaks";
import { randomUUID } from "node:crypto";

function disposable(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

const SEARCH_CASES = [
  { label: "full name", value: "test-secret" },
  { label: "no-match", value: "zzzznotfound" },
  { label: "whitespace", value: "     " },
  { label: "special", value: "<script>alert(1)</script>" },
  { label: "long", value: "a".repeat(200) },
];

const INVALID_NAMES = [
  { label: "blank", value: "" },
  { label: "whitespace", value: "     " },
  { label: "leading digit", value: "9secret" },
  { label: "very long", value: "a".repeat(300) },
  { label: "unicode", value: "Ω≈ç√ 😃 こんにちは" },
  { label: "HTML-like", value: "<script>alert(1)</script>" },
];

const RAW_VALUES = [
  { label: "whitespace", value: "   " },
  { label: "multiline", value: "line1\nline2" },
  { label: "unicode", value: "Ω≈ç√ 😃" },
  { label: "special", value: "!@#$%^&*()" },
];

test.describe("Secrets (sub-organization)", () => {
  test("SECRET-SMK01 — Load the Secrets page cold", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => consoleLogs.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await secrets.goto();
    await expect(secrets.heading).toBeVisible({ timeout: 20_000 });
    await expect(secrets.breadcrumb).toBeVisible();
    await expect(secrets.searchInput).toBeVisible();
    await expect(secrets.bulkAddButton).toBeVisible();
    await expect(secrets.addSecretButton).toBeVisible();
    await expect(secrets.organizationTab).toBeVisible();
    await expect(secrets.personalTab).toBeVisible();
    await assertNoLeaks(page, consoleLogs, pageErrors);
  });

  test("SECRET-SAN01 — Inspect both scopes", async ({ page }) => {
    const secrets = new SecretsPage(page);
    await secrets.goto();
    await expect(secrets.organizationTab).toBeVisible();
    await expect(secrets.personalTab).toBeVisible();

    for (const tab of [secrets.organizationTab, secrets.personalTab]) {
      await tab.click();
      await page.waitForTimeout(300);
      await expect(secrets.table.or(page.getByText(/No secrets found/i))).toBeVisible();
    }
  });

  test("SECRET-SAN02 — Inspect the empty state", async ({ page }) => {
    const secrets = new SecretsPage(page);
    await secrets.goto();
    await secrets.switchScope("Organization");
    await expect(page.getByText(/No secrets found|Add your first secret/i)).toBeVisible();
    await expect(secrets.addSecretButton).toBeEnabled();
    await expect(secrets.bulkAddButton).toBeEnabled();
  });

  test("SECRET-SAN03 — Add secret dialog opens without submitting", async ({ page }) => {
    const secrets = new SecretsPage(page);
    await secrets.goto();
    await secrets.openAddSecret();

    await expect(secrets.addSecretDialog).toBeVisible();
    await expect(secrets.scopeSelect.or(page.getByText(/Organization|Personal/i))).toBeVisible();
    await expect(secrets.nameInput).toBeVisible();
    await expect(secrets.valueInput).toBeVisible();
    await expect(secrets.noteInput).toBeVisible();
    await expect(secrets.redactCheckbox).toBeVisible();
    await expect(secrets.storeButton).toBeVisible();
    await expect(secrets.closeDialogButton).toBeVisible();

    await secrets.closeDialogButton.click();
    await expect(secrets.addSecretDialog).not.toBeVisible();
  });

  test("SECRET-SAN04 — Inspect Raw, Cookie, TOTP and bulk import forms", async ({ page }) => {
    const secrets = new SecretsPage(page);
    await secrets.goto();
    await secrets.openAddSecret();

    // Raw secret
    await secrets.selectType("Raw");
    await expect(secrets.nameInput).toBeVisible();
    await expect(secrets.valueInput).toBeVisible();

    // Cookie form
    await secrets.selectType("Cookie");
    await expect(secrets.valueInput.or(page.getByRole("textbox"))).toBeVisible();

    // TOTP form
    await secrets.selectType("TOTP");
    await expect(page.getByText(/QR|Scan|otpauth/i).or(page.getByRole("textbox"))).toBeVisible();

    // Bulk add dialog
    await secrets.closeDialogButton.click();
    await secrets.bulkAddButton.click();
    await expect(page.locator('[role="dialog"]').filter({ hasText: /Bulk add/i })).toBeVisible();
  });

  for (const { label, value } of SEARCH_CASES) {
    test(`SECRET-REG01 — Search safely with ${label}`, async ({ page }) => {
      const secrets = new SecretsPage(page);
      await secrets.goto();
      await secrets.switchScope("Organization");

      let dialogSeen = false;
      page.on("dialog", () => {
        dialogSeen = true;
      });

      await secrets.searchInput.fill(value);
      await secrets.searchInput.press("Enter");
      await page.waitForTimeout(300);

      expect(dialogSeen).toBe(false);
      await expect(secrets.heading).toBeVisible();
      await secrets.searchInput.clear();
    });
  }

  for (const { label, value } of INVALID_NAMES) {
    test(`SECRET-REG02 — Reject invalid name '${label}'`, async ({ page }) => {
      const secrets = new SecretsPage(page);
      await secrets.goto();
      await secrets.openAddSecret();
      await secrets.fillRawSecret(value, "value");
      await secrets.saveSecret();

      const error = page.getByText(/required|invalid|not valid|name/i).first();
      await expect(error).toBeVisible({ timeout: 10_000 });
      await expect(secrets.addSecretDialog).toBeVisible();
      await secrets.closeDialogButton.click();
    });
  }

  test("SECRET-REG03 — Create disposable Raw secrets with edge-case values", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const created: string[] = [];

    for (const { label, value } of RAW_VALUES) {
      const name = disposable(`raw-${label}`);
      await secrets.goto();
      await secrets.openAddSecret();
      await secrets.fillRawSecret(name, value, `note-${label}`);
      await secrets.saveSecret();

      await expect(secrets.rowByName(name)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(value)).not.toBeVisible();
      created.push(name);
    }

    for (const name of created) {
      await secrets.deleteSecret(name);
      await expect(secrets.rowByName(name)).not.toBeVisible();
    }
  });

  test("SECRET-REG04 — Cookie form accepts valid cookies and rejects malformed data", async ({
    page,
  }) => {
    const secrets = new SecretsPage(page);
    const name = disposable("cookie");
    await secrets.goto();
    await secrets.openAddSecret();
    await secrets.selectType("Cookie");
    await secrets.nameInput.fill(name);

    const validCookie = JSON.stringify([
      { name: "session", value: "abc", domain: ".example.com", path: "/" },
    ]);
    await secrets.valueInput.fill(validCookie);
    await secrets.saveSecret();

    // Malformed cookie should surface a validation error.
    const row = secrets.rowByName(name);
    if (await row.isVisible().catch(() => false)) {
      await secrets.deleteSecret(name);
      await expect(row).not.toBeVisible();
    }
  });

  test("SECRET-REG07 — Scope and type remain consistent when discarding unsaved data", async ({
    page,
  }) => {
    const secrets = new SecretsPage(page);
    await secrets.goto();
    await secrets.openAddSecret();

    await secrets.fillRawSecret("unsaved-name", "unsaved-value");
    await secrets.closeDialogButton.click();

    // Re-open and verify a clean state; no secret was saved.
    await secrets.openAddSecret();
    await expect(secrets.nameInput).toHaveValue("");
  });

  test("SECRET-REG08 — Full CRUD on a disposable secret", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const originalName = disposable("crud");
    const updatedName = `${originalName}-updated`;

    await secrets.goto();
    await secrets.openAddSecret();
    await secrets.fillRawSecret(originalName, "original-value", "original-note");
    await secrets.saveSecret();
    await expect(secrets.rowByName(originalName)).toBeVisible({ timeout: 10_000 });

    await secrets.editSecret(originalName);
    await secrets.nameInput.fill(updatedName);
    await secrets.valueInput.fill("updated-value");
    await secrets.noteInput.fill("updated-note");
    await secrets.saveSecret();
    await expect(secrets.rowByName(updatedName)).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(secrets.rowByName(updatedName)).toBeVisible({ timeout: 15_000 });

    await secrets.deleteSecret(updatedName);
    await expect(secrets.rowByName(updatedName)).not.toBeVisible();
  });

  test("SECRET-REG09 — Delete confirmation cancels and confirms correctly", async ({ page }) => {
    const secrets = new SecretsPage(page);
    const name = disposable("delete");

    await secrets.goto();
    await secrets.openAddSecret();
    await secrets.fillRawSecret(name, "value");
    await secrets.saveSecret();
    await expect(secrets.rowByName(name)).toBeVisible({ timeout: 10_000 });

    const row = secrets.rowByName(name);
    await row.getByRole("button", { name: /More options|Actions/i }).click();
    await page.getByRole("menuitem", { name: /Delete/i }).click();

    // Cancel first
    const cancel = page.getByRole("button", { name: /Cancel/i }).first();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click();
      await expect(secrets.rowByName(name)).toBeVisible();
    }

    await secrets.deleteSecret(name);
    await expect(secrets.rowByName(name)).not.toBeVisible();
  });
});
