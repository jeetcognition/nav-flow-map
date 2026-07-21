import { test, expect } from "@playwright/test";
import { EnterpriseSettingsPage, OrgSelectorPage } from "../../pages";
import { assertNoLeaks } from "../../support/leaks";

const PREFERENCES_CARDS = ["General", "Connections", "Sessions"];
const PRODUCT_CARDS = ["Devin", "Review"];
const RESOURCE_CARDS = ["Knowledge", "Environment", "Playbooks", "Skills & Rules"];
const ADMIN_CARDS = [
  "Repositories",
  "Membership",
  "Organizations",
  "Devin API",
  "Guardrails",
  "Infrastructure",
  "Analytics",
];

const SEARCH_INPUTS = [
  { label: "matching", value: "General" },
  { label: "non-matching", value: "zzzznotfound" },
  { label: "special", value: "<script>alert(1)</script>" },
  { label: "long", value: "a".repeat(200) },
];

test.describe("Enterprise Settings", () => {
  test("ENTSET-SAN01 — Enterprise Settings heading and breadcrumb are visible", async ({
    page,
  }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await expect(ent.heading).toBeVisible({ timeout: 20_000 });
    await expect(ent.breadcrumb).toBeVisible();
  });

  test("ENTSET-SAN02 — Left sidebar elements are visible", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await expect(ent.backToAppButton).toBeVisible();
    await expect(ent.settingsSearchInput).toBeVisible();
    await expect(page.getByRole("link", { name: /Personal/i }).first()).toBeVisible();
    await expect(
      page.getByText(/Cog Enterprise QA|jeet-devin-qa|cog-enterprise-qa/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Help/i }).first()).toBeVisible();
  });

  test("ENTSET-SAN03 — Enterprise preferences and settings cards", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    for (const name of PREFERENCES_CARDS) {
      await expect(ent.cardByText(name)).toBeVisible();
    }
  });

  test("ENTSET-SAN04 — Products cards are visible", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    for (const name of PRODUCT_CARDS) {
      await expect(ent.cardByText(name)).toBeVisible();
    }
  });

  test("ENTSET-SAN05 — Resources cards are visible", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    for (const name of RESOURCE_CARDS) {
      await expect(ent.cardByText(name)).toBeVisible();
    }
  });

  test("ENTSET-SAN06 — Administration cards are visible after scroll", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await ent.cardByText("Administration").scrollIntoViewIfNeeded();
    for (const name of ADMIN_CARDS) {
      await expect(ent.cardByText(name)).toBeVisible();
    }
  });

  test("ENTSET-REG01 — Open each main panel card and return", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();

    const allCards = [...PREFERENCES_CARDS, ...PRODUCT_CARDS, ...RESOURCE_CARDS];
    for (const name of allCards) {
      await ent.cardByText(name).click();
      await page.waitForURL(/\/settings\//, { timeout: 15_000 });
      await expect(page).toHaveURL(/\/settings\//);
      await ent.goto();
      await expect(ent.heading).toBeVisible({ timeout: 20_000 });
    }
  });

  for (const { label, value } of SEARCH_INPUTS) {
    test(`ENTSET-REG02 — Search settings with ${label} text`, async ({ page }) => {
      const ent = new EnterpriseSettingsPage(page);
      await ent.goto();

      let dialogSeen = false;
      page.on("dialog", () => {
        dialogSeen = true;
      });

      await ent.searchSettings(value);
      expect(dialogSeen).toBe(false);
      await expect(ent.heading).toBeVisible();
    });
  }

  test("ENTSET-REG03 — Back to app then browser Back restores Enterprise Settings", async ({
    page,
  }) => {
    const ent = new EnterpriseSettingsPage(page);
    const org = new OrgSelectorPage(page);
    await ent.goto();

    await ent.backToAppButton.click();
    await expect(org.heading).toBeVisible({ timeout: 20_000 });

    await page.goBack();
    await expect(ent.heading).toBeVisible({ timeout: 20_000 });
  });

  test("ENTSET-REG04 — Select another organization from the sidebar", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();

    const target = page.getByRole("link", { name: /fri-5|jeet-devin-qa/i }).first();
    if (await target.isVisible().catch(() => false)) {
      await target.click();
      await page.waitForURL(/\/org\/.*\/settings/, { timeout: 15_000 });
      await expect(page).toHaveURL(/\/org\/.*\/settings/);
      await expect(page.getByText(/Settings/i).first()).toBeVisible();
    }
  });

  test("ENTSET-REG05 — Load more organizations in the sidebar", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();

    const loadMore = page.getByRole("button", { name: /Load more/i });
    if (await loadMore.isVisible().catch(() => false)) {
      await loadMore.click();
      await page.waitForTimeout(500);
      await expect(ent.heading).toBeVisible();
    }
  });

  test("ENTSET-REG07 — Refresh and browser Back/Forward keep context", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    await ent.goto();
    await page.reload();
    await expect(ent.heading).toBeVisible({ timeout: 20_000 });

    await ent.cardByText("General").click();
    await page.waitForURL(/\/settings\//, { timeout: 15_000 });

    await page.goBack();
    await expect(ent.heading).toBeVisible({ timeout: 20_000 });

    await page.goForward();
    await expect(page).toHaveURL(/\/settings\//);
  });

  test("ENTSET-REG08 — No sensitive data leaks while using the page", async ({ page }) => {
    const ent = new EnterpriseSettingsPage(page);
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => consoleLogs.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await ent.goto();
    await expect(ent.heading).toBeVisible({ timeout: 20_000 });
    await assertNoLeaks(page, consoleLogs, pageErrors);

    await ent.searchSettings("General");
    await assertNoLeaks(page, consoleLogs, pageErrors);

    await ent.cardByText("General").click();
    await page.waitForURL(/\/settings\//, { timeout: 15_000 });
    await assertNoLeaks(page, consoleLogs, pageErrors);
  });
});
