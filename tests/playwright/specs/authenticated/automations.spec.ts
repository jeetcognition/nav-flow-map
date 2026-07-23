import { test, expect } from "@playwright/test";
import { AutomationsPage } from "../../pages";

// Automations node — sub-org Automations list, create form, and webhook/schedule
// end-to-end flows. E2E cases spawn real (short) Devin sessions in the QA sub-org
// and always delete the automation they created.

test.describe("Automations", () => {
  test("AUTO-SMK01 — Load the Automations list", async ({ page }) => {
    const automations = new AutomationsPage(page);
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      // The page always logs one benign "Failed to load resource: 403" for an
      // integration-status request; only real script errors should fail here.
      if (msg.type() === "error" && !/Failed to load resource/.test(msg.text()))
        consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await automations.open();

    await expect(automations.heading).toBeVisible();
    await expect(automations.allTab).toBeVisible();
    await expect(automations.createdByYouTab).toBeVisible();
    await expect(automations.filterButton).toBeVisible();
    await expect(automations.analyticsButton).toBeVisible();
    await expect(automations.createAutomationButton.first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("SUB-AU-SMK01 — Reach Automations from the sidebar", async ({ page }) => {
    const automations = new AutomationsPage(page);
    await automations.open();

    await expect(page).toHaveURL(/\/org\/[^/]+\/automations$/);
    await expect(automations.heading).toBeVisible();
    await expect(automations.createAutomationButton.first()).toBeEnabled();
    // Either populated rows or the empty state render as the "list".
    const emptyState = page.getByRole("heading", {
      name: "Get started by creating an automation",
    });
    const anyRow = page.locator('main a[href*="/automations/"]');
    await expect(emptyState.or(anyRow.first()).first()).toBeVisible();
  });

  test("AUTO-REG01 — Each trigger type reveals its configuration", async ({ page }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();
    await automations.removeAllTriggers();

    await automations.addSubmenuTrigger("Slack", "Message");
    await expect(page.getByText("in channel")).toBeVisible();
    await automations.removeAllTriggers();

    await automations.addSubmenuTrigger("GitHub", "Issue comment");
    await expect(page.getByText("in repo")).toBeVisible();
    await expect(page.getByText(/don't trigger for events from public GitHub/)).toBeVisible();
    await automations.removeAllTriggers();

    await automations.addSubmenuTrigger("Linear", "Issue created");
    await expect(page.getByText("in team")).toBeVisible();
    await automations.removeAllTriggers();

    await automations.addSubmenuTrigger("Jira", "Issue created");
    await expect(page.getByText("in project")).toBeVisible();
    await automations.removeAllTriggers();

    await automations.addSubmenuTrigger("Schedule", "Every day");
    await expect(page.getByRole("button", { name: "Every day", exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("UTC")).toBeVisible();
    await automations.removeAllTriggers();

    await automations.addTrigger("Webhook");
    await expect(automations.webhookUrlCode).toBeVisible();
    await expect(automations.webhookSecretCode).toBeVisible();
    await expect(automations.webhookSecretHeaderCode).toBeVisible();
  });

  test("AUTO-REG02 — Network policy accepts domains including malformed input", async ({
    page,
  }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();

    // BUG-006: malformed entries are accepted unvalidated. The UI currently
    // commits them with no inline error; a valid domain is accepted the same
    // way. Update these expectations when validation ships.
    const values = [
      "javascript:alert(1)",
      "<script>",
      "http://",
      "has whitespace",
      "docs.github.com",
    ];
    await automations.addDomainButton.click();
    for (const value of values) {
      await automations.commitDomainEntry(value);
      await expect(page.getByRole("button", { name: `Remove ${value}` })).toBeVisible();
    }
    await expect(page.getByText(/invalid domain/i)).toBeHidden();
  });

  test("AUTO-REG04 — Playbook macros and repository mentions in Instructions", async ({ page }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();

    await automations.instructionsEditor.click();
    await automations.instructionsEditor.pressSequentially("@", { delay: 50 });
    const mentionMenu = page.getByRole("listbox");
    await expect(mentionMenu).toBeVisible();
    await expect(page.getByRole("option", { name: /^Repositories/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /^Playbooks/ })).toBeVisible();
    await page.getByRole("option", { name: /^Repositories/ }).click();
    // With no repos connected the submenu prompts to search; with repos
    // connected it lists them immediately.
    await expect(
      mentionMenu
        .getByText(/Type to search/i)
        .or(mentionMenu.getByRole("option"))
        .first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await automations.instructionsEditor.click();
    await automations.instructionsEditor.pressSequentially(" run !roast", { delay: 50 });
    await expect(page.getByRole("option", { name: /Roast Commits/ })).toBeVisible();
    await page.getByRole("option", { name: /Roast Commits/ }).click();
    await expect(
      automations.instructionsEditor.getByRole("link", { name: "Roast Commits" }),
    ).toBeVisible();
  });

  test("SUB-AU-REG01 — Advanced section renders all controls", async ({ page }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();

    await expect(automations.advancedToggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("heading", { name: "Agent mode" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Allow auto-start of child sessions" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Run as creator" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "MCPs" })).toBeVisible();
    await expect(automations.manageMcpsButton).toBeVisible();
    await expect(page.getByRole("heading", { name: "Network policy" })).toBeVisible();
    await expect(automations.addDomainButton).toBeVisible();
    await expect(page.getByRole("heading", { name: "Metadata" })).toBeVisible();
    await expect(automations.addMetadataButton).toBeVisible();
    await expect(page.getByRole("heading", { name: "Limits" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "ACU limit per session" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rate limit" })).toBeVisible();
  });

  test("SUB-AU-REG02 — Network policy keeps malformed domains as entries (BUG-006)", async ({
    page,
  }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();

    // BUG-006: these malformed values should be rejected but are currently
    // accepted unvalidated. Assert the current behavior and clean the entries
    // back up so the form returns to its default state.
    const values = ["javascript:alert(1)", "<script>", "http://", "has whitespace"];
    await automations.addDomainButton.click();
    for (const value of values) {
      await automations.commitDomainEntry(value);
      await expect(page.getByRole("button", { name: `Remove ${value}` })).toBeVisible();
    }

    const removeButtons = page.getByRole("button", { name: /^Remove (?!trigger)/ });
    while ((await automations.domainInputs.count()) > 0) {
      await removeButtons.first().click();
    }
    await expect(automations.domainInputs).toHaveCount(0);
  });

  test("SUB-AU-REG03 — Webhook trigger shows inline URL and secret notice", async ({ page }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();
    await automations.removeAllTriggers();

    await automations.addTrigger("Webhook");

    await expect(page.getByText("Webhook URL")).toBeVisible();
    await expect(automations.webhookUrlCode).toBeVisible();
    await expect(automations.webhookSecretCode).toBeVisible();
    await expect(automations.secretOneTimeNotice).toBeVisible();
    await expect(automations.webhookSecretHeaderCode).toBeVisible();
  });

  test("SCHED-SAN01 — Custom schedule accepts valid RRULE and rejects invalid", async ({
    page,
  }) => {
    const automations = new AutomationsPage(page);
    await automations.open();
    await automations.openCreateForm();
    await automations.removeAllTriggers();

    await automations.addSubmenuTrigger("Schedule", "Custom schedule");
    await automations.selectScheduleButton.click();
    await automations.rruleTab.click();

    await automations.rruleInput.fill("garbage-not-rrule");
    await automations.applyScheduleButton.click();
    await expect(automations.scheduleDialog).toBeVisible();
    await expect(automations.scheduleDialog).toContainText(/Invalid RRULE segment/);
    await expect(automations.visualTab).toBeDisabled();

    await automations.rruleInput.fill("FREQ=DAILY;BYHOUR=9;BYMINUTE=30");
    await automations.applyScheduleButton.click();
    await expect(automations.scheduleDialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Every day at 9:30 AM" })).toBeVisible();
  });

  test("SCHED-REG01 — Create one-time and recurring schedules, edit, delete", async ({ page }) => {
    const automations = new AutomationsPage(page);
    const ts = Date.now();
    const name = `qa-temp-auto-sched-${ts}`;
    const renamed = `${name}-renamed`;

    try {
      await automations.open();
      await automations.openCreateForm();
      await automations.removeAllTriggers();

      // One-time schedule tomorrow at 09:00 UTC (never fires before cleanup).
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const runOnceValue = `${tomorrow.toISOString().slice(0, 10)}T09:00`;
      await automations.addSubmenuTrigger("Schedule", "Run once");
      await automations.runOnceInput.fill(runOnceValue);

      // Recurring daily schedule via a custom RRULE.
      await automations.addSubmenuTrigger("Schedule", "Custom schedule");
      await automations.selectScheduleButton.click();
      await automations.rruleTab.click();
      await automations.rruleInput.fill("FREQ=DAILY;BYHOUR=23;BYMINUTE=45");
      await automations.applyScheduleButton.click();
      await expect(page.getByRole("button", { name: "Every day at 11:45 PM" })).toBeVisible();

      await automations.nameInput.fill(name);
      await automations.fillInstructions(
        "Reply with the word pong and immediately finish the session.",
      );
      await automations.submitCreate();

      // CRUD persists: detail shows both triggers with the configured times.
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
      await expect(page.locator("main").getByText("Run once")).toBeVisible();
      await expect(page.locator("main").getByText(/Every day at 11:45 PM/)).toBeVisible();

      // Edit: rename and save.
      await automations.editButton.click();
      await page.waitForURL(/\/automations\/[0-9a-f]+\/edit$/);
      await automations.nameInput.fill(renamed);
      await automations.saveButton.click();
      await page.waitForURL(/\/automations\/[0-9a-f]+$/);
      await expect(page.getByRole("heading", { name: renamed, exact: true })).toBeVisible();

      // Delete restores the default (empty of qa-temp rows) list state.
      await automations.deleteOpenAutomation();
      await expect(page.getByRole("link", { name: new RegExp(renamed) })).toBeHidden();
    } finally {
      await automations.deleteAutomationByName(name);
    }
  });

  test("AUTO-E2E01 — Webhook POST with secret spawns a session; bad secret rejected", async ({
    page,
    request,
  }) => {
    test.setTimeout(300_000);
    const automations = new AutomationsPage(page);
    const name = `qa-temp-auto-webhook-${Date.now()}`;

    try {
      await automations.open();
      await automations.openCreateForm();
      await automations.removeAllTriggers();
      await automations.addTrigger("Webhook");

      const webhookUrl = (await automations.webhookUrlCode.textContent())!.trim();
      const secret = (await automations.webhookSecretCode.textContent())!.trim();

      await automations.nameInput.fill(name);
      await automations.fillInstructions(
        "Reply with the word pong and immediately finish the session.",
      );
      await automations.submitCreate();

      // Invalid/missing secret → rejected.
      const invalid = await request.post(webhookUrl, {
        headers: { "Content-Type": "application/json", "X-Webhook-Secret": "wrong-secret" },
        data: { test: true },
      });
      expect(invalid.status()).toBe(403);
      const missing = await request.post(webhookUrl, {
        headers: { "Content-Type": "application/json" },
        data: { test: true },
      });
      expect(missing.ok()).toBe(false);

      // Valid secret → accepted and a session spawns.
      const valid = await request.post(webhookUrl, {
        headers: { "Content-Type": "application/json", "X-Webhook-Secret": secret },
        data: { test: true },
      });
      expect(valid.status()).toBe(200);
      expect(await valid.json()).toMatchObject({ status: "accepted" });

      await expect(async () => {
        await page.reload();
        await expect(automations.succeededEventLinks.first()).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 180_000, intervals: [10_000] });
      await expect(automations.succeededEventLinks.first()).toHaveAttribute(
        "href",
        /\/sessions\/[0-9a-f]+/,
      );

      await automations.deleteOpenAutomation();
    } finally {
      await automations.deleteAutomationByName(name);
    }
  });

  test("SUB-AU-E2E01 — Schedule automation run spawns a session", async ({ page }) => {
    test.setTimeout(300_000);
    const automations = new AutomationsPage(page);
    const name = `qa-temp-auto-runnow-${Date.now()}`;

    try {
      await automations.open();
      await automations.openCreateForm();
      await automations.removeAllTriggers();

      // Recurring schedule far in the day; the run is triggered manually so the
      // test does not depend on wall-clock timing. Slack delivery is not
      // asserted: no Slack workspace is connected in the QA sub-org.
      await automations.addSubmenuTrigger("Schedule", "Every day");
      await automations.nameInput.fill(name);
      await automations.fillInstructions(
        "Reply with the word pong and immediately finish the session.",
      );
      await automations.submitCreate();

      await automations.runNow();
      await expect(async () => {
        await page.reload();
        await expect(automations.succeededEventLinks.first()).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 180_000, intervals: [10_000] });
      await expect(automations.succeededEventLinks.first()).toHaveAttribute(
        "href",
        /\/sessions\/[0-9a-f]+/,
      );

      await automations.deleteOpenAutomation();
    } finally {
      await automations.deleteAutomationByName(name);
    }
  });

  test("SCHED-E2E01 — Near-term run-once schedule fires and spawns a session", async ({ page }) => {
    test.setTimeout(480_000);
    const automations = new AutomationsPage(page);
    const name = `qa-temp-auto-fire-${Date.now()}`;

    try {
      await automations.open();
      await automations.openCreateForm();
      await automations.removeAllTriggers();

      // Schedule a one-time run two minutes from now (UTC, minute precision).
      const fireAt = new Date(Date.now() + 2 * 60 * 1000);
      const value = fireAt.toISOString().slice(0, 16);
      await automations.addSubmenuTrigger("Schedule", "Run once");
      await automations.runOnceInput.fill(value);
      await automations.nameInput.fill(name);
      await automations.fillInstructions(
        "Reply with the word pong and immediately finish the session.",
      );
      await automations.submitCreate();

      // The scheduler fires at the scheduled minute; poll the events list.
      await expect(async () => {
        await page.reload();
        await expect(automations.succeededEventLinks.first()).toBeVisible({ timeout: 5_000 });
      }).toPass({ timeout: 420_000, intervals: [15_000] });
      await expect(automations.succeededEventLinks.first()).toHaveAttribute(
        "href",
        /\/sessions\/[0-9a-f]+/,
      );

      await automations.deleteOpenAutomation();
    } finally {
      await automations.deleteAutomationByName(name);
    }
  });
});
