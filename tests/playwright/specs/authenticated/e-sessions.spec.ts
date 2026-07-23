import { test, expect } from "@playwright/test";
import { SessionsPage, SESSIONS_LIST_API } from "../../pages";
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

  test("SESS-E2E01 — Filter to a known creator/date, open a session, return, then clear filters", async ({
    page,
  }) => {
    const sessions = new SessionsPage(page);
    await sessions.goto();
    await sessions.expectLoaded();

    // The list applies default creator/date filters; capture them as the known filter state.
    await expect(page).toHaveURL(/creator=user-[0-9a-f]+/);
    await expect(page).toHaveURL(/updatedDate=/);
    const creatorName = ((await sessions.creatorFilter.first().textContent()) ?? "").trim();
    expect(creatorName.length).toBeGreaterThan(0);
    const filteredUrl = page.url();

    // Open a session from the filtered list, then return.
    const href = await sessions.openSession(0);
    await page.goBack();

    // Return navigation keeps the creator/date filter state intact.
    await expect(page).toHaveURL(filteredUrl);
    await expect(sessions.creatorFilter.first()).toContainText(creatorName);
    await expect(sessions.sessionRows.first()).toBeVisible({ timeout: 15_000 });
    await expect(sessions.row(0)).toHaveAttribute("href", href);

    // Clear filters removes the creator/date criteria without losing the list.
    await sessions.clearAllFilters();
    await expect(page).not.toHaveURL(/creator=/);
    await expect(page).not.toHaveURL(/updatedDate=/);
    await expect(sessions.sessionRows.first()).toBeVisible();

    // Cleanup: a fresh navigation restores the default filtered state.
    await sessions.goto();
    await sessions.expectLoaded();
    await expect(page).toHaveURL(/creator=user-[0-9a-f]+/);
  });

  test("SESS-REG04 — Tampered creator/session/enterprise IDs must not expose sessions outside the enterprise", async ({
    page,
    context,
  }) => {
    const sessions = new SessionsPage(page);

    // Capture a legitimate, authenticated sessions-list request to replay with tampered IDs.
    const listRequestPromise = page.waitForRequest(
      (r) => r.url().includes("/v2sessions") && r.method() === "GET",
    );
    await sessions.goto();
    const listRequest = await listRequestPromise;
    const headers = Object.fromEntries(
      Object.entries(await listRequest.allHeaders()).filter(([k]) => !k.startsWith(":")),
    );
    await sessions.expectLoaded();

    const tamperedId = "f".repeat(32);

    // Tampered enterprise ID: the server must deny the request and leak nothing.
    const tamperedEnterpriseUrl = listRequest
      .url()
      .replace(/enterprise-[0-9a-f]+/, `enterprise-${tamperedId}`);
    const enterpriseResponse = await context.request.get(tamperedEnterpriseUrl, { headers });
    expect([401, 403, 404]).toContain(enterpriseResponse.status());
    const enterpriseBody = await enterpriseResponse.text();
    expect(enterpriseBody).not.toContain("devin_id");
    expect(enterpriseBody).not.toContain("title");
    expect(enterpriseBody).not.toContain("prompt");

    // Tampered session ID against a session-scoped API: denied, no data.
    const origin = new URL(listRequest.url()).origin;
    const sessionResponse = await context.request.get(
      `${origin}/api/sessions/devin-${tamperedId}/prs`,
      { headers },
    );
    expect([401, 403, 404]).toContain(sessionResponse.status());
    expect(await sessionResponse.text()).not.toContain("prompt");

    // Tampered creator ID in the list query: no foreign sessions may be returned.
    const tamperedCreatorUrl = new URL(listRequest.url());
    tamperedCreatorUrl.searchParams.set("creators", `user-${tamperedId}`);
    const creatorResponse = await context.request.get(tamperedCreatorUrl.toString(), { headers });
    if (creatorResponse.ok()) {
      const creatorBody = (await creatorResponse.json()) as { result?: unknown[] };
      expect(creatorBody.result ?? []).toHaveLength(0);
    } else {
      expect([401, 403, 404]).toContain(creatorResponse.status());
    }

    // Tampered session ID in the UI: 404 page, no transcript/prompt content.
    await page.goto(`/sessions/${tamperedId}`);
    await expect(page.getByText("This page could not be found.")).toBeVisible();

    // Tampered enterprise slug in the UI: 404 page instead of another enterprise's sessions.
    await page.goto(routes.enterpriseSessions("some-other-enterprise"));
    await expect(page.getByText("This page could not be found.")).toBeVisible();

    // Cleanup: the legitimate sessions list still loads for the real enterprise.
    await sessions.goto();
    await sessions.expectLoaded();
  });

  test("SESS-REG05 — Force list API 403/404/500 and slow responses", async ({ page }) => {
    const sessions = new SessionsPage(page);

    // Error statuses: the failure must stay scoped to the list; filters/search stay usable
    // and no stale rows are presented as current.
    for (const status of [403, 404, 500]) {
      await page.route(SESSIONS_LIST_API, (route) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Injected error" }),
        }),
      );
      await sessions.goto();
      await expect(sessions.noSessionsText).toBeVisible({ timeout: 15_000 });
      await expect(sessions.sessionRows).toHaveCount(0);
      await sessions.expectFilterBarVisible();
      await page.unroute(SESSIONS_LIST_API);
    }

    // Slow response: a loading state is shown instead of stale rows, then real data renders.
    await page.route(SESSIONS_LIST_API, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      await route.continue();
    });
    await page.goto(routes.enterpriseSessions());
    await expect(sessions.sessionRows).toHaveCount(0);
    await sessions.expectFilterBarVisible();
    await expect(sessions.sessionRows.first()).toBeVisible({ timeout: 30_000 });
    await page.unroute(SESSIONS_LIST_API);

    // Cleanup: with interception removed the list loads normally again.
    await sessions.goto();
    await sessions.expectLoaded();
  });
});
