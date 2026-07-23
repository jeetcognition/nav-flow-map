import { test, expect } from "@playwright/test";
import {
  EnterpriseSettingsPage,
  OrganizationsPage,
  SettingsRootPage,
  ENTERPRISE_SLUG,
  TEST_SUBORG,
  TEST_SUBORG_DISPLAY,
} from "../../pages";

const CHILDREN = [
  { name: "General", href: "/settings/general" },
  { name: "Connections", href: "/settings/connections" },
  { name: "Devin", href: "/settings/devin" },
  { name: "DeepWiki", href: "/settings/deepwiki" },
  { name: "Schedules", href: "/settings/schedules" },
  { name: "Knowledge", href: "/settings/knowledge" },
  { name: "Environment", href: "/settings/environment" },
  { name: "Playbooks", href: "/settings/playbooks" },
  { name: "Skills & Rules", href: "/settings/skills" },
  { name: "Secrets", href: "/settings/secrets" },
  { name: "Repositories", href: "/settings/repositories" },
  { name: "Membership", href: "/settings/members" },
  { name: "Devin API", href: "/settings/devin-api" },
  { name: "Analytics", href: "/settings/analytics" },
];

const REQUIRED_CHILDREN = [
  "General",
  "Connections",
  "Devin",
  "Knowledge",
  "Environment",
  "Playbooks",
  "Skills & Rules",
  "Secrets",
  "Repositories",
  "Membership",
  "Devin API",
  "Analytics",
];

const SAFE_SEARCH_INPUTS = [
  "Knowledge",
  "  ",
  "🧪 unicode",
  "General",
  "<script>alert(1)</script>",
  "a".repeat(300),
  "Devin API",
];

test.describe("Sub-orgs and Settings root", () => {
  function trackConsoleErrors(page: import("@playwright/test").Page) {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("SUB-OS-SMK01 — Open Sub-orgs and Settings root cold", async ({ page }) => {
    const settings = new SettingsRootPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await settings.goto();
    await expect(settings.heading).toBeVisible();
    await expect(settings.subtitle).toBeVisible();
    await expect(settings.productsHeading).toBeVisible();
    await expect(settings.resourcesHeading).toBeVisible();
    await expect(settings.administrationHeading).toBeVisible();
    await expect(settings.childLinks.first()).toBeVisible();
    expect(page.url()).toContain(`/org/${TEST_SUBORG}/settings`);
    expect(consoleErrors).toEqual([]);
  });

  test("SUB-OS-SAN01 — Inspect visible child links", async ({ page }) => {
    const settings = new SettingsRootPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await settings.goto();

    for (const name of REQUIRED_CHILDREN) {
      await expect(settings.childLink(name)).toBeVisible();
    }
    await expect(settings.childLink("DeepWiki")).toBeVisible();
    await expect(settings.childLink("Schedules")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("SUB-OS-REG01 — Click each visible child link and return", async ({ page }) => {
    const settings = new SettingsRootPage(page);
    const consoleErrors = trackConsoleErrors(page);

    for (const child of CHILDREN) {
      await settings.goto();
      await settings.childLink(child.name).click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain(child.href);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expect(page.getByText("Back to organization").first()).toBeVisible();
    }

    // Return path and final root assertion.
    await settings.goto();
    await expect(settings.heading).toBeVisible();
    expect(consoleErrors.filter((e) => !e.includes("Failed to load icon"))).toEqual([]);
  });

  test("SUB-OS-REG02 — Deep-link, refresh, and browser Back/Forward", async ({ page }) => {
    const settings = new SettingsRootPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await settings.goto();
    const knowledgeHref = `/org/${TEST_SUBORG}/settings/knowledge`;
    await page.goto(knowledgeHref);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/settings/knowledge");

    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/settings/knowledge");

    await page.goBack();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain(`/org/${TEST_SUBORG}/settings`);
    await expect(settings.heading).toBeVisible();

    await page.goForward();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/settings/knowledge");

    expect(consoleErrors).toEqual([]);
  });

  test("SUB-OS-REG03 — Use global settings search with safe inputs", async ({ page }) => {
    const settings = new SettingsRootPage(page);
    const consoleErrors = trackConsoleErrors(page);

    await settings.goto();

    for (const value of SAFE_SEARCH_INPUTS) {
      await settings.globalSearch.fill(value);
      await expect(settings.heading).toBeVisible();
      await expect(settings.childLink("General")).toBeVisible();
      await expect(settings.childLink("Knowledge")).toBeVisible();
    }

    await settings.globalSearch.fill("");
    await expect(settings.heading).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("SUB-OS-E2E01 — Navigate from Organizations to the sub-org, open child settings pages, and return", async ({
    page,
  }) => {
    const orgs = new OrganizationsPage(page);
    const ent = new EnterpriseSettingsPage(page);
    const settings = new SettingsRootPage(page);
    const consoleErrors = trackConsoleErrors(page);

    // Start on the enterprise Organizations page with the sub-org row visible.
    await orgs.goto();
    await expect(orgs.heading).toBeVisible();
    await expect(orgs.rowByName(TEST_SUBORG_DISPLAY)).toBeVisible();

    // Navigate to the sub-org via the sidebar org list.
    await ent.selectOrganization(TEST_SUBORG_DISPLAY);
    await expect(settings.heading).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/org/${TEST_SUBORG}/settings$`));

    // Open several child settings pages; each keeps the sub-org slug in the URL.
    const childPages = [
      { name: "General", href: "/settings/general" },
      { name: "Knowledge", href: "/settings/knowledge" },
      { name: "Membership", href: "/settings/members" },
    ];
    for (const child of childPages) {
      await settings.childLink(child.name).click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp(`/org/${TEST_SUBORG}${child.href}`));
      await page.goBack();
      await expect(settings.heading).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/org/${TEST_SUBORG}/settings$`));
    }

    // Return to the enterprise Organizations page; the enterprise context is restored.
    await ent.enterpriseNameLink.click();
    await expect(ent.heading).toBeVisible();
    await ent.enterpriseNavLink("Organizations").click();
    await expect(orgs.heading).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/org/${ENTERPRISE_SLUG}/settings/organizations$`));
    await expect(orgs.rowByName(TEST_SUBORG_DISPLAY)).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("SUB-OS-REG04 — Tampered org slug and unauthenticated access are denied", async ({
    page,
    browser,
  }) => {
    const settings = new SettingsRootPage(page);
    const tamperedSlug = "definitely-not-a-real-org";
    const tamperedPaths = [
      `/org/${tamperedSlug}/settings`,
      `/org/${tamperedSlug}/settings/general`,
      `/org/${tamperedSlug}/settings/members`,
    ];

    // Authenticated admin with a tampered org slug gets a 404 and no settings metadata.
    for (const path of tamperedPaths) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toContainText("This page could not be found");
      await expect(settings.subtitle).toHaveCount(0);
      await expect(settings.productsHeading).toHaveCount(0);
    }

    // Unauthenticated user is redirected to login and sees no sub-org settings data.
    const unauthContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const unauthPage = await unauthContext.newPage();
    await unauthPage.goto(`/org/${TEST_SUBORG}/settings`);
    await unauthPage.waitForURL((url) => !url.pathname.startsWith(`/org/${TEST_SUBORG}`), {
      timeout: 30_000,
    });
    await expect(unauthPage.getByText("Organization preferences and settings")).toHaveCount(0);
    await unauthContext.close();
  });
});
