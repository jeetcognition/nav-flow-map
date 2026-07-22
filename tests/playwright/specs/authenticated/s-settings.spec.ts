import { test, expect } from "@playwright/test";
import { SettingsRootPage, TEST_SUBORG } from "../../pages";

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
});
