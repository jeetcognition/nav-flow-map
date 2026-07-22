import { test, expect, type ConsoleMessage } from "@playwright/test";
import { GuardrailsPage, ENTERPRISE_SLUG } from "../../pages";

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
