import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";
import { GuardrailsPage, DevinSessionPage, ENTERPRISE_SLUG, ALT_SUBORG } from "../../pages";
import { routes, TEST_SUBORG_DISPLAY } from "../../support/paths";
import {
  captureGuardrailsApi,
  getGuardrailAction,
  getGuardrails,
  getViolations,
  listViolations,
  putGuardrail,
  type GuardrailsApiContext,
  type GuardrailViolation,
} from "../../support/guardrails-api";

test.describe("Guardrails", () => {
  let errors: string[] = [];

  test.beforeEach(({ page }) => {
    errors = [];
    page.on("console", (msg: ConsoleMessage) => {
      const text = msg.text();
      if (msg.type() === "error" && !text.includes("Failed to load icon")) {
        errors.push(text);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    expect(errors, `console errors: ${errors.join(", ")}`).toHaveLength(0);
  });

  test("GUARD-SMK01 — Load the page cold", async ({ page }) => {
    const guardrails = new GuardrailsPage(page);
    await guardrails.goto();

    await expect(page).toHaveURL(`/org/${ENTERPRISE_SLUG}/settings/guardrails`);
    await expect(guardrails.heading).toBeVisible();
    await expect(guardrails.description).toBeVisible();
    await expect(guardrails.guardrailsTab).toBeVisible();
    await expect(guardrails.violationsTab).toBeVisible();
    await expect(guardrails.guardrailCombos.first()).toBeVisible();

    const panels = guardrails.infoPanels;
    await expect(panels.filter({ hasText: "How Guardrails work" })).toBeVisible();
    await expect(panels.filter({ hasText: "Real-time request analysis" })).toBeVisible();
    await expect(panels.filter({ hasText: "Threat detection" })).toBeVisible();
    await expect(panels.filter({ hasText: "Action execution" })).toBeVisible();
    await expect(panels.filter({ hasText: "Data controls & privacy" })).toBeVisible();
  });

  test("GUARD-SAN01 — Inspect available guardrails and current action settings", async ({
    page,
  }) => {
    const guardrails = new GuardrailsPage(page);
    await guardrails.goto();

    await expect(guardrails.guardrailCombos).toHaveCount(6);
    for (const combo of await guardrails.guardrailCombos.all()) {
      await expect(combo).toBeVisible();
      const value = (await combo.textContent())?.trim() ?? "";
      expect(["Off", "Warn user", "Block message", "Log only", "kill_session"]).toContain(value);
    }

    const names = [
      "Prompt injection",
      "Downstream system",
      "Public deployment",
      "Guardrail evasion",
      "PII access",
      "Profanity",
    ];
    const text = await guardrails.contentArea.textContent();
    for (const name of names) {
      expect(text).toMatch(new RegExp(name, "i"));
    }
  });

  test("GUARD-SAN02 — Switch to Violations and inspect list state without opening sensitive values", async ({
    page,
  }) => {
    const guardrails = new GuardrailsPage(page);
    await guardrails.goto();

    await guardrails.violationsTab.click();
    await expect(page).toHaveURL(/\/settings\/guardrails\?tab=violations$/);
    await expect(
      page.getByRole("heading", { name: "Violations over time", exact: true }),
    ).toBeVisible();

    await expect(guardrails.guardrailFilter).toBeVisible();
    await expect(guardrails.orgFilter).toBeVisible();
    await expect(guardrails.violationsTable.or(page.getByText(/No violations/i))).toBeVisible();

    // Do not inspect user messages; only verify structural columns are present when rows exist.
    if (await guardrails.violationsTable.isVisible()) {
      const headers = guardrails.violationsTable.locator("thead");
      await expect(headers).toContainText("Organization");
      await expect(headers).toContainText("Guardrail");
      await expect(headers).toContainText("Action");
      await expect(headers).toContainText("Time");
    }
  });

  test("GUARD-REG01 — Change a guardrail action and restore it", async ({ page }) => {
    const guardrails = new GuardrailsPage(page);
    await guardrails.goto();
    await expect(guardrails.heading).toBeVisible();

    const combo = guardrails.guardrailAction("Public deployment requests");
    await expect(combo).toBeVisible();

    const original = (await combo.textContent())?.trim() ?? "Off";
    const available = ["Off", "Log only", "Warn user", "Block message"];
    const nextValue = available.find((v) => v !== original) ?? "Warn user";

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/enterprise/") &&
          r.url().includes("/guardrails/") &&
          ["PUT", "PATCH"].includes(r.request().method()),
      ),
      (async () => {
        await combo.click();
        await page.getByRole("option", { name: nextValue }).click();
      })(),
    ]);

    await page.reload();
    await guardrails.heading.waitFor({ state: "visible" });
    await expect(combo).toHaveText(nextValue);

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/enterprise/") &&
          r.url().includes("/guardrails/") &&
          ["PUT", "PATCH"].includes(r.request().method()),
      ),
      (async () => {
        await combo.click();
        await page.getByRole("option", { name: original }).click();
      })(),
    ]);

    await page.reload();
    await guardrails.heading.waitFor({ state: "visible" });
    await expect(combo).toHaveText(original);
  });

  test("GUARD-REG02 — Search and filter controls handle safe and unsafe inputs", async ({
    page,
  }) => {
    const guardrails = new GuardrailsPage(page);
    await guardrails.goto();

    const inputs = [
      "Public deployment",
      "no-such-guardrail-12345",
      "  ",
      "' OR '1'='1",
      "<script>alert(1)</script>",
      "🔥".repeat(50),
      "data exfiltration\n\r\t",
    ];

    for (const value of inputs) {
      await guardrails.globalSearch.fill(value);
      await page.keyboard.press("Escape");
      await expect(guardrails.heading).toBeVisible();
      await expect(page).toHaveURL(/\/settings\/guardrails/);
    }

    await guardrails.violationsTab.click();
    await expect(guardrails.guardrailFilter).toBeVisible();

    // Opening a filter dropdown should not change the URL.
    await guardrails.guardrailFilter.click();
    const listbox = page.getByRole("listbox").first();
    await expect(listbox).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/settings\/guardrails\?tab=violations$/);
  });
});

// Enforcement tests drive real Devin sessions, whose pages emit benign console
// errors (e.g. 403s on optional integrations), so they live outside the
// console-error harness above.
test.describe("Guardrails enforcement and authorization", () => {
  const GUARDRAIL_NAME = "Profanity";
  const GUARDRAIL_ID = "profanity";
  // The classifier reliably flags this phrase as profanity; the marker keeps
  // each run's violation record uniquely identifiable.
  const profanePrompt = (marker: string) =>
    `${marker}: this damn flaky test suite is a piece of shit and I hate it`;

  async function openGuardrails(page: Page): Promise<{
    guardrails: GuardrailsPage;
    api: GuardrailsApiContext;
  }> {
    const guardrails = new GuardrailsPage(page);
    const api = await captureGuardrailsApi(page, () => guardrails.goto());
    await guardrails.heading.waitFor({ state: "visible" });
    return { guardrails, api };
  }

  async function findViolation(
    page: Page,
    api: GuardrailsApiContext,
    marker: string,
  ): Promise<GuardrailViolation> {
    let found: GuardrailViolation | undefined;
    await expect
      .poll(
        async () => {
          const violations = await listViolations(page, api);
          found = violations.find((v) => v.user_message.includes(marker));
          return found !== undefined;
        },
        { intervals: [2_000, 5_000, 10_000], timeout: 90_000 },
      )
      .toBe(true);
    return found!;
  }

  test("GUARD-REG04 — Trigger warn and block outcomes in disposable sessions", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(360_000);

    const { guardrails, api } = await openGuardrails(page);
    const session = new DevinSessionPage(page);
    const original = await guardrails.currentAction(GUARDRAIL_NAME);
    const ts = Date.now();

    try {
      // Warn outcome: the message is flagged but the session continues.
      if (original !== "Warn user") await guardrails.setAction(GUARDRAIL_NAME, "Warn user");
      await expect
        .poll(() => getGuardrailAction(page, api, GUARDRAIL_ID), { timeout: 30_000 })
        .toBe("warn_user");

      const warnMarker = `GUARD-REG04-warn-${ts}`;
      await session.gotoSession();
      await session.sendPrompt(profanePrompt(warnMarker));
      await expect(session.guardrailWarnFlag).toBeVisible({ timeout: 60_000 });
      await expect(session.guardrailBlockedBanner).toBeHidden();

      const warnViolation = await findViolation(page, api, warnMarker);
      expect(warnViolation.action_taken).toBe("warn_user");
      expect(warnViolation.guardrail_id).toBe(GUARDRAIL_ID);

      // Block outcome: the message is denied and the session ends.
      await guardrails.goto();
      await guardrails.heading.waitFor({ state: "visible" });
      await guardrails.setAction(GUARDRAIL_NAME, "Block message");
      await expect
        .poll(() => getGuardrailAction(page, api, GUARDRAIL_ID), { timeout: 30_000 })
        .toBe("block_message");

      const blockMarker = `GUARD-REG04-block-${ts}`;
      await session.gotoSession();
      await session.sendPrompt(profanePrompt(blockMarker));
      await expect(session.guardrailBlockedBanner).toBeVisible({ timeout: 60_000 });
      await expect(session.guardrailBlockedNotice).toBeVisible();
      await expect(page.getByText("Continue in a new session")).toBeVisible();

      // The violation record carries full metadata without leaking anything
      // beyond the message the user actually sent.
      const blockViolation = await findViolation(page, api, blockMarker);
      expect(blockViolation.action_taken).toBe("block_message");
      expect(blockViolation.guardrail_id).toBe(GUARDRAIL_ID);
      expect(blockViolation.org_name).toBe(TEST_SUBORG_DISPLAY);
      expect(blockViolation.event_id).toMatch(/^event-/);
      expect(blockViolation.devin_id).toMatch(/^devin-/);
      expect(blockViolation.violation_source).toBe("devin");
      expect(blockViolation.confidence_score).toBeGreaterThan(0);
      expect(blockViolation.reasoning.length).toBeGreaterThan(0);
      expect(blockViolation.user_message).toBe(profanePrompt(blockMarker));
    } finally {
      // Restore the original action so the run is idempotent.
      await guardrails.goto();
      await guardrails.heading.waitFor({ state: "visible" });
      if ((await guardrails.currentAction(GUARDRAIL_NAME)) !== original) {
        await guardrails.setAction(GUARDRAIL_NAME, original);
      }
    }
  });

  test("GUARD-REG05 — Tampered enterprise/violation access and policy updates are rejected", async ({
    page,
    browser,
  }) => {
    const { guardrails, api } = await openGuardrails(page);
    const tamperedId = "enterprise-00000000000000000000000000000000";

    const baselineResp = await getGuardrails(page, api);
    expect(baselineResp.status()).toBe(200);
    const baseline = await baselineResp.json();

    // Reading another enterprise's guardrails or violations is rejected.
    expect((await getGuardrails(page, api, tamperedId)).status()).toBe(403);
    expect((await getViolations(page, api, tamperedId)).status()).toBe(403);

    // Updating another enterprise's policy is rejected...
    const put = await putGuardrail(
      page,
      api,
      GUARDRAIL_ID,
      { is_enabled: true, action: "warn_user" },
      tamperedId,
    );
    expect(put.status()).toBe(403);

    // ...and our own policy is untouched by the attempt.
    const afterResp = await getGuardrails(page, api);
    expect(afterResp.status()).toBe(200);
    expect(await afterResp.json()).toEqual(baseline);

    // A nonexistent org slug renders a 404, not guardrails data.
    await page.goto(routes.guardrails("no-such-enterprise-xyz"));
    await expect(page.locator("body")).toContainText("This page could not be found");

    // A sub-org slug does not expose the enterprise guardrails settings.
    await page.goto(routes.guardrails(ALT_SUBORG));
    await page.waitForLoadState("networkidle");
    await expect(guardrails.description).toBeHidden();

    // An anonymous context is redirected to login.
    const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    try {
      const anonPage = await anonContext.newPage();
      await anonPage.goto(routes.guardrails());
      await anonPage.waitForURL(/auth\.beta\.devin\.ai/, { timeout: 30_000 });
    } finally {
      await anonContext.close();
    }
  });

  test("GUARD-E2E01 — Set a disposable guardrail to warn, trigger it, verify, and restore", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(360_000);

    const { guardrails, api } = await openGuardrails(page);
    const session = new DevinSessionPage(page);
    const original = await guardrails.currentAction(GUARDRAIL_NAME);
    const marker = `GUARD-E2E01-${Date.now()}`;
    const prompt = profanePrompt(marker);

    try {
      // Disposable policy change, persisted across a reload.
      if (original !== "Warn user") await guardrails.setAction(GUARDRAIL_NAME, "Warn user");
      await page.reload();
      await guardrails.heading.waitFor({ state: "visible" });
      await expect(guardrails.guardrailAction(GUARDRAIL_NAME)).toHaveText("Warn user");
      await expect
        .poll(() => getGuardrailAction(page, api, GUARDRAIL_ID), { timeout: 30_000 })
        .toBe("warn_user");

      // Trigger the guardrail in a controlled session: enforcement warns the
      // user but the session keeps going.
      await session.gotoSession();
      await session.sendPrompt(prompt);
      await expect(session.guardrailWarnFlag).toBeVisible({ timeout: 60_000 });
      await expect(session.guardrailBlockedBanner).toBeHidden();

      // Logging: the violation is recorded with no payload beyond the prompt.
      const violation = await findViolation(page, api, marker);
      expect(violation.guardrail_id).toBe(GUARDRAIL_ID);
      expect(violation.action_taken).toBe("warn_user");
      expect(violation.org_name).toBe(TEST_SUBORG_DISPLAY);
      expect(violation.user_message).toBe(prompt);

      // The violation also surfaces in the Violations tab UI.
      await guardrails.gotoViolations();
      const row = guardrails.violationsTable.locator("tbody tr").filter({ hasText: marker });
      await expect(row).toBeVisible();
      await expect(row).toContainText("Warn user");
    } finally {
      // Restore: the guardrail returns to its original action.
      await guardrails.goto();
      await guardrails.heading.waitFor({ state: "visible" });
      if ((await guardrails.currentAction(GUARDRAIL_NAME)) !== original) {
        await guardrails.setAction(GUARDRAIL_NAME, original);
      }
      await page.reload();
      await guardrails.heading.waitFor({ state: "visible" });
      await expect(guardrails.guardrailAction(GUARDRAIL_NAME)).toHaveText(original);
    }
  });
});
