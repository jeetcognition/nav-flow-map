import { test, expect } from "@playwright/test";
import { SupportPage } from "../../pages";
import { DOCS_URL_PATTERN } from "../../support/paths";
import { expectEnterpriseBreadcrumbs } from "../../support/breadcrumbs";
import { expectNoPageErrors } from "../../support/errors";
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

    await expect(popup).toHaveURL(DOCS_URL_PATTERN);
    await popup.close();

    // The original page should still be on the Support page.
    await expect(page).toHaveURL(/\/settings\/support/);
  });

  test("SUP-REG02 — Verify breadcrumb and Back to enterprise navigation", async ({ page }) => {
    const support = new SupportPage(page);
    await expectEnterpriseBreadcrumbs(page, () => support.goto(), {
      crumbs: ["Settings", "Enterprise", "Support"],
    });
  });

  test("SUP-REG03 — Verify the page loads without console errors or error boundaries", async ({
    page,
  }) => {
    const support = new SupportPage(page);
    // The embedded Decagon support-chat widget fails its auth-token request
    // (404) on the QA tenant; that third-party failure is ignored.
    await expectNoPageErrors(page, () => support.goto(), {
      ready: support.heading,
      ignore: [/decagon/i, /Failed to load resource.*404/],
    });
  });
});
