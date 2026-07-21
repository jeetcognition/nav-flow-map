import { test, expect } from "@playwright/test";
import { SupportPage } from "../../pages";

test.describe("Support Page", () => {
  test("SUP-SAN02 — Locate the Documentation card heading", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.documentationHeading).toBeVisible();
  });

  test("SUP-SAN06 — Verify the support email message is displayed", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.contactSupportMessage).toBeVisible();
    await expect(support.supportEmailLink).toBeVisible();
    await expect(support.supportEmailLink).toHaveAttribute("href", "mailto:support@cognition.ai");
  });

  test("SUP-SAN03 — Read the Documentation description", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.documentationDescription).toBeVisible();
  });

  test("SUP-SAN04 — Reload the Support page and verify Documentation heading", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.documentationHeading).toBeVisible();

    await page.reload();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.documentationHeading).toBeVisible();
  });

  test("SUP-SAN05 — Verify the Documentation description is presented", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.documentationDescription).toContainText(
      "Find answers to common questions and comprehensive guides",
    );
  });

  test("SUP-REG01 — Click the Documentation button", async ({ page }) => {
    const support = new SupportPage(page);
    await support.goto();
    await support.heading.waitFor({ state: "visible" });
    await expect(support.documentationButton).toBeVisible();

    const [popup] = await Promise.all([
      page.waitForEvent("popup"),
      support.documentationButton.click(),
    ]);

    await expect(popup).toHaveURL(/docs\.devin\.ai/);
    await popup.close();

    // The original page should still be on the Support page.
    await expect(page).toHaveURL(/\/settings\/support/);
  });
});
