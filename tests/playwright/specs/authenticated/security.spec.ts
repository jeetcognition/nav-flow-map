import { test, expect } from "@playwright/test";
import { SecurityPage, TEST_SUBORG } from "../../pages";

test.describe("Security (Code scan)", () => {
  test("SCAN-SMK01 — Load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    // Bare /code-scan (no org context) is rejected: the app shows its
    // "Access denied" error page instead of the scan dashboard.
    await page.goto("/code-scan");
    await expect(page.getByRole("heading", { name: "Access denied" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Go to homepage" })).toBeVisible();

    const security = new SecurityPage(page);
    await security.gotoViaSidebar();

    await expect(page).toHaveURL(`/org/${TEST_SUBORG}/code-scan`);
    await expect(security.heading).toBeVisible();
    await expect(security.scansTab).toBeVisible();
    await expect(security.profilesTab).toBeVisible();
    await expect(security.automationsTab).toBeVisible();
    await expect(security.startScanButton).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("SCAN-SAN01 — Open Start Scan dialog", async ({ page }) => {
    const security = new SecurityPage(page);
    await security.gotoViaSidebar();

    await security.openStartScanDialog();

    // Scan mode selector renders all three modes with Single repo pre-selected.
    await expect(security.newScanDialog.getByRole("button", { name: /Single repo/ })).toBeVisible();
    await expect(security.newScanDialog.getByRole("button", { name: /Multi-repo/ })).toBeVisible();
    await expect(security.newScanDialog.getByRole("button", { name: /Bulk scan/ })).toBeVisible();

    // Repo / profile / auto-scan / interactive-mode options render.
    await expect(security.repoCombobox).toBeVisible();
    await expect(security.scanProfileCombobox).toBeVisible();
    await expect(security.autoScanCombobox).toBeVisible();
    await expect(security.interactiveModeSwitch).toBeVisible();

    // Start is gated without a repo selected.
    await expect(security.runScanButton).toBeDisabled();

    await page.keyboard.press("Escape");
    await expect(security.newScanDialog).toBeHidden();
  });

  test("SCAN-REG01 — Configure Auto-Scan schedule; Profiles CRUD", async ({ page }) => {
    const security = new SecurityPage(page);
    await security.gotoViaSidebar();

    // Auto-Scan schedule options are configurable in the New Scan dialog.
    // The schedule is only persisted when a scan is actually launched, which
    // consumes ACUs and starts a real Devin scan, so the dialog is closed
    // without running.
    await security.openStartScanDialog();
    await security.autoScanCombobox.click();
    const listbox = page.getByRole("listbox").first();
    for (const option of ["Every day", "Every week", "Every month", "Custom schedule"]) {
      await expect(listbox.getByRole("option", { name: option })).toBeVisible();
    }
    await listbox.getByRole("option", { name: "Every week" }).click();
    await expect(security.autoScanCombobox).toContainText("Every week");
    await page.keyboard.press("Escape");
    await expect(security.newScanDialog).toBeHidden();

    // Profiles CRUD: create a uniquely-named profile, verify it persists
    // across a reload, then archive it to restore the default state.
    const profileName = `QA Auto Profile ${Date.now()}`;
    await security.profilesTab.click();
    await security.createProfileButton.click();
    await security.createManuallyLink.click();
    await security.profileNameInput.waitFor({ state: "visible" });
    await security.profileNameInput.fill(profileName);
    await security.profileDescriptionInput.fill("Temporary profile created by SCAN-REG01");
    await security.submitCreateProfileButton.click();

    await expect(page).toHaveURL(/\/code-scan\?tab=profiles$/);
    await expect(security.profileRow(profileName)).toBeVisible();

    // Persistence: profile survives a full reload.
    await page.reload();
    await security.heading.waitFor({ state: "visible" });
    await expect(security.profileRow(profileName)).toBeVisible();

    // Cleanup: archive the created profile and confirm it leaves the list.
    await security.openProfileActions(profileName);
    await page.getByRole("menuitem", { name: "Archive" }).click();
    await expect(security.profileRow(profileName)).toBeHidden({ timeout: 15_000 });

    await page.reload();
    await security.heading.waitFor({ state: "visible" });
    await expect(security.profileRow(profileName)).toBeHidden();
  });
});
