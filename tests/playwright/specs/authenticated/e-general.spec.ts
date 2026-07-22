import { test, expect } from "@playwright/test";
import { GeneralSettingsPage } from "../../pages";

test.describe("Enterprise General settings", () => {
  test("GEN-SMK01 — Load cold", async ({ page }) => {
    const general = new GeneralSettingsPage(page);
    await general.goto();
    await general.heading.waitFor({ state: "visible" });

    await expect(page).toHaveURL(/\/settings\/general$/);
    await expect(general.authenticationHeading).toBeVisible();
    await expect(general.ssoHeading).toBeVisible();
    await expect(general.ssoSwitch).toBeVisible();
    await expect(general.ssoSwitch).toHaveAttribute("aria-checked", /true|false/);
  });

  test("GEN-REG01 — Toggle Require SSO and restore default state", async ({ page }) => {
    const general = new GeneralSettingsPage(page);
    await general.goto();
    await general.heading.waitFor({ state: "visible" });
    await expect(general.ssoSwitch).toBeVisible();

    const initial = await general.ssoSwitchState();
    const toggled = initial === "true" ? "false" : "true";

    try {
      await general.ssoSwitch.click();
      await expect(general.ssoSwitch).toHaveAttribute("aria-checked", toggled);

      // Ensure the change persists across reload.
      await page.reload({ waitUntil: "networkidle" });
      await expect(general.ssoSwitch).toHaveAttribute("aria-checked", toggled);

      // Toggle back to the original state.
      await general.ssoSwitch.click();
      await expect(general.ssoSwitch).toHaveAttribute("aria-checked", initial);

      await page.reload({ waitUntil: "networkidle" });
      await expect(general.ssoSwitch).toHaveAttribute("aria-checked", initial);
    } catch (e) {
      // Best-effort cleanup: if anything went wrong, try to restore the initial SSO state.
      await page.reload({ waitUntil: "networkidle" });
      const current = await general.ssoSwitchState();
      if (current !== initial) {
        await general.ssoSwitch.click();
      }
      throw e;
    }
  });
});
