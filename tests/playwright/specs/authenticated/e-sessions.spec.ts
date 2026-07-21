import { test, expect } from "@playwright/test";
import { SessionsPage } from "../../pages";
import { routes } from "../../support/paths";

/**
 * Captures URL/console/page errors so we can fail on unexpected dialogs
 * (e.g., injection attempts) even when the assertion would otherwise pass.
 */
test.describe("Enterprise Sessions", () => {
  test.beforeEach(({ page }) => {
    page.on("dialog", async (dialog) => {
      const message = dialog.message();
      await dialog.dismiss();
      throw new Error(`Unexpected dialog: ${message}`);
    });
  });

  test("SESS-SMK01 — Load cold", async ({ page }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();
    await sessions.expectLoaded();
    await expect(sessions.inactiveSessionsText).toBeVisible();
  });

  test("SESS-SAN01 — Inspect session rows", async ({ page }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();

    const count = await sessions.sessionRows.count();
    expect(count).toBeGreaterThan(0);

    const firstText = await sessions.rowContainer(0).textContent();
    expect(firstText).toBeTruthy();
    expect(firstText!.length).toBeGreaterThan(5);

    const href = await sessions.row(0).getAttribute("href");
    expect(href).toMatch(/^\/sessions\/[a-f0-9]+/);

    // Status grouping and navigation actions should be readable.
    await expect(page.getByText(/Inactive sessions/).first()).toBeVisible();
  });

  test("SESS-SAN02 — Open Display, Creator, Archived Status, and Updated date filters", async ({
    page,
  }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();

    const beforeUrl = page.url();

    const displayMenu = await sessions.openFilterMenu(sessions.displayFilter);
    await expect(displayMenu).toContainText("Newest first");
    await expect(displayMenu).toContainText("Oldest first");
    await expect(displayMenu).toContainText("By status");
    await expect(displayMenu).toContainText("No grouping");
    await page.keyboard.press("Escape");

    const creatorMenu = await sessions.openFilterMenu(sessions.creatorFilter);
    await expect(creatorMenu).toContainText("Clear All");
    await page.keyboard.press("Escape");

    const archivedMenu = await sessions.openFilterMenu(sessions.archivedFilter);
    await expect(archivedMenu).toContainText("Not Archived");
    await expect(archivedMenu).toContainText("Archived");
    await page.keyboard.press("Escape");

    const dateMenu = await sessions.openFilterMenu(sessions.updatedDateFilter);
    const dateText = (await dateMenu.textContent()) ?? "";
    expect(dateText).toMatch(/2026|July|SuMoTuWeThFrSa/);
    await page.keyboard.press("Escape");

    // No destructive changes should have occurred.
    await expect(page).toHaveURL(beforeUrl);
    await expect(sessions.sessionRows.first()).toBeVisible();
  });

  test("SESS-REG01 — Search with matching, no-match, whitespace, Unicode, long, HTML-like, and injection-like values", async ({
    page,
  }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();

    // Matching title
    await sessions.search("kuberns");
    expect(await sessions.sessionRows.count()).toBeGreaterThan(0);
    await sessions.clearSearch();

    // No match
    await sessions.search("xyzqwerty_no_match_999");
    expect(await sessions.sessionRows.count()).toBe(0);
    await expect(page.getByText(/No sessions|No results|No matching|couldn't find/i)).toBeVisible();
    await sessions.clearSearch();

    // Whitespace
    await sessions.search(" ");
    await expect(sessions.sessionRows.first()).toBeVisible();
    await sessions.clearSearch();

    // Unicode
    await sessions.search("🔥_résumé_éxample_");
    expect(await sessions.sessionRows.count()).toBe(0);
    await sessions.clearSearch();

    // Very long value
    await sessions.search("a".repeat(200));
    expect(await sessions.sessionRows.count()).toBe(0);
    await sessions.clearSearch();

    // HTML-like
    await sessions.search("<div>foo</div>");
    expect(await sessions.sessionRows.count()).toBe(0);
    await sessions.clearSearch();

    // Injection-like (must not trigger a dialog or leak script)
    await sessions.search("<img src=x onerror=alert(1)>");
    expect(await sessions.sessionRows.count()).toBe(0);
    await sessions.clearSearch();

    // Default state restored
    await expect(sessions.inactiveSessionsText).toBeVisible();
  });

  test("SESS-REG02 — Combine filters; refresh and Back/Forward; Clear filters", async ({
    page,
  }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();

    // Combine search + display grouping on top of the default creator/archived/date filters.
    await sessions.search("kuberns");
    await expect(page).toHaveURL(/titleSearch=kuberns/);
    await sessions.selectDisplayOption("By status");

    // Deep-link reload should preserve filter state.
    const filteredUrl = page.url();
    await page.reload();
    await expect(page).toHaveURL(filteredUrl);
    await expect(sessions.sessionRows.first()).toBeVisible();

    // Back/Forward through a row navigation.
    const href = await sessions.openSession(0);
    await page.goBack();
    await expect(page).toHaveURL(/\/enterprise-sessions/);
    await expect(page).toHaveURL(/titleSearch=kuberns/);
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(href.replace("/", "\\/")));

    // Clear filters removes all criteria and restores the list.
    await page.goto(routes.enterpriseSessions());
    await sessions.clearAllFilters();
    await expect(page).not.toHaveURL(/titleSearch=/);
    await expect(sessions.sessionRows.first()).toBeVisible();
  });

  test("SESS-REG03 — Open a session row, then use Back/Forward", async ({ page }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();

    await sessions.search("kuberns");
    await expect(page).toHaveURL(/titleSearch=kuberns/);

    const href = await sessions.openSession(0);
    const sessionId = href.replace("/sessions/", "");

    await page.goBack();
    await expect(page).toHaveURL(/\/enterprise-sessions/);
    await expect(page).toHaveURL(/titleSearch=kuberns/);
    await expect(sessions.sessionRows.first()).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/sessions/${sessionId}`));

    // Cleanup: return to the sessions list and clear any query state.
    await page.goto(routes.enterpriseSessions());
    await expect(sessions.sessionRows.first()).toBeVisible();
  });
});
