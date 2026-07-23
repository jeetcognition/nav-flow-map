import { test, expect } from "@playwright/test";
import { PrefsPage, routes, TEST_SUBORG } from "../../pages";

// Personal → Preferences (`/settings/preferences`).
// Catalog cases: PREF-SMK01, PREF-SAN01, PREF-REG01, PREF-REG03, PREF-REG04, PREF-E2E01.

test.describe("Personal Preferences", () => {
  test("PREF-SMK01 — Load cold", async ({ page }) => {
    const prefs = new PrefsPage(page);
    await prefs.goto();

    await expect(page).toHaveURL(/\/settings\/preferences$/);
    await expect(prefs.heading).toBeVisible();

    // Profile: picture, name, email, user ID.
    await expect(prefs.sectionHeading("Profile")).toBeVisible();
    for (const row of ["Picture", "Name", "Email", "User ID"]) {
      await expect(prefs.rowHeading(row)).toBeVisible();
    }
    await expect(prefs.readOnlyValue("Email")).toContainText("@");
    await expect(prefs.readOnlyValue("User ID")).toContainText(/^user-/);

    // Display / theme and language.
    await expect(prefs.sectionHeading("Display")).toBeVisible();
    await expect(prefs.combobox("Theme")).toBeVisible();
    await expect(prefs.combobox("Display language")).toBeVisible();

    // Notifications.
    await expect(prefs.sectionHeading("Notifications")).toBeVisible();
    for (const row of [
      "In-app notifications",
      "Play sound with notifications",
      "Browser notifications",
      "Slack notifications",
      "Newsletter",
    ]) {
      await expect(prefs.switch(row)).toBeVisible();
    }

    // Git commit author/email, PR behavior, and child-session approval.
    await expect(prefs.sectionHeading("Devin sessions")).toBeVisible();
    await expect(prefs.combobox("Git commit author")).toBeVisible();
    await expect(prefs.combobox("Git commit email")).toBeVisible();
    await expect(prefs.combobox("Pull request links open...")).toBeVisible();
    await expect(prefs.switch("Open pull requests as drafts")).toBeVisible();
    await expect(prefs.switch("Auto-approve child sessions")).toBeVisible();

    // Devin Review preferences.
    await expect(prefs.sectionHeading("Devin Review")).toBeVisible();
    await expect(prefs.combobox("Review trigger")).toBeVisible();
    await expect(prefs.combobox("Comment language")).toBeVisible();
  });

  test("PREF-SAN01 — Identity fields are read-only; editable controls show current values", async ({
    page,
  }) => {
    const prefs = new PrefsPage(page);
    await prefs.goto();

    // Email and user ID render as plain text, with no input or edit control in their rows.
    await expect(prefs.readOnlyValue("Email")).toContainText("@");
    await expect(prefs.readOnlyValue("User ID")).toContainText(/^user-/);
    await expect(prefs.row("Email").getByRole("textbox")).toHaveCount(0);
    await expect(prefs.row("Email").getByRole("button")).toHaveCount(0);
    await expect(prefs.row("User ID").getByRole("textbox")).toHaveCount(0);
    await expect(prefs.row("User ID").getByRole("button")).toHaveCount(0);

    // Name is editable through its own control.
    await expect(prefs.nameButton).toBeVisible();
    await expect(prefs.nameButton).toBeEnabled();

    // Editable dropdowns are enabled and show a non-empty current value.
    for (const row of [
      "Theme",
      "Display language",
      "Git commit author",
      "Pull request links open...",
      "Review trigger",
      "Comment language",
    ]) {
      await expect(prefs.combobox(row)).toBeEnabled();
      await expect(prefs.combobox(row)).not.toHaveText("");
    }

    // Git commit email is a locked dropdown of verified emails.
    await expect(prefs.combobox("Git commit email")).toBeDisabled();
    await expect(prefs.combobox("Git commit email")).toContainText("@");

    // Switches expose a definite on/off state.
    for (const row of [
      "In-app notifications",
      "Slack notifications",
      "Newsletter",
      "Open pull requests as drafts",
      "Auto-approve child sessions",
    ]) {
      await expect(prefs.switch(row)).toHaveAttribute("aria-checked", /true|false/);
    }
  });

  test("PREF-REG01 — Name accepts edge-case values, keeps them inert, and restores", async ({
    page,
  }) => {
    const prefs = new PrefsPage(page);
    await prefs.goto();

    const originalName = ((await prefs.nameButton.textContent()) ?? "").trim();
    expect(originalName).not.toBe("");

    try {
      // Blank name: Save is disabled (clear validation).
      await prefs.openNameDialog();
      await prefs.nameInput.fill("");
      await expect(prefs.nameSave).toBeDisabled();

      // Whitespace-only: the app currently accepts it (no trim validation).
      await prefs.nameInput.fill("   ");
      await expect(prefs.nameSave).toBeEnabled();
      await prefs.nameCancel.click();
      await prefs.nameDialog.waitFor({ state: "hidden" });

      // Long, Unicode, emoji, HTML-like, and injection-like values are accepted
      // and rendered as inert text on the Name control.
      const edgeNames = [
        `long-name-${"x".repeat(100)}`,
        "Ünïcødé-名前-Ω",
        "🚀 QA name 🧪",
        '<b>bold</b><script>alert("xss")</script>',
      ];
      for (const name of edgeNames) {
        await prefs.setName(name);
        await expect(prefs.nameButton).toHaveText(name);
      }
      // The HTML-like value stays inert: no injected <script>/<b> elements render.
      await expect(prefs.nameButton.locator("script, b")).toHaveCount(0);

      // The last accepted value persists across a reload.
      await page.reload();
      await prefs.heading.waitFor({ state: "visible" });
      await expect(prefs.nameButton).toHaveText(edgeNames[edgeNames.length - 1]);
    } finally {
      // Cleanup: restore the original name.
      await prefs.goto();
      if (((await prefs.nameButton.textContent()) ?? "").trim() !== originalName) {
        await prefs.setName(originalName);
      }
    }

    await page.reload();
    await prefs.heading.waitFor({ state: "visible" });
    await expect(prefs.nameButton).toHaveText(originalName);
  });

  test("PREF-REG03 — Notification and child-session toggles persist independently and restore", async ({
    page,
  }) => {
    const prefs = new PrefsPage(page);
    await prefs.goto();

    // Browser notifications: permission is denied in this context, so the switch
    // is disabled and the page links to per-browser instructions instead.
    await expect(prefs.switch("Browser notifications")).toBeDisabled();
    await expect(page.getByRole("link", { name: "Google Chrome" })).toBeVisible();

    const toggles = [
      "Play sound with notifications",
      "In-app notifications",
      "Slack notifications",
      "Newsletter",
      "Auto-approve child sessions",
    ];
    const initial: Record<string, "true" | "false"> = {};
    for (const row of toggles) {
      initial[row] = await prefs.switchState(row);
    }

    try {
      // Flip every toggle, then confirm each flipped state survives a reload.
      for (const row of toggles) {
        await prefs.toggleSwitch(row);
      }
      await page.reload();
      await prefs.heading.waitFor({ state: "visible" });
      for (const row of toggles) {
        const flipped = initial[row] === "true" ? "false" : "true";
        await expect(prefs.switch(row)).toHaveAttribute("aria-checked", flipped);
      }
    } finally {
      // Cleanup: restore every toggle to its initial state.
      await prefs.goto();
      for (const row of toggles) {
        await prefs.setSwitch(row, initial[row]);
      }
    }

    await page.reload();
    await prefs.heading.waitFor({ state: "visible" });
    for (const row of toggles) {
      await expect(prefs.switch(row)).toHaveAttribute("aria-checked", initial[row]);
    }
  });

  test("PREF-REG04 — Git author, PR behavior, and review trigger persist; email is locked", async ({
    page,
  }) => {
    const prefs = new PrefsPage(page);
    await prefs.goto();

    // Git commit email is a locked dropdown of verified account emails: a free-text
    // invalid email can never be entered, and the lock shows the enforced value.
    await expect(prefs.combobox("Git commit email")).toBeDisabled();
    await expect(prefs.combobox("Git commit email")).toContainText("@");

    const selects: Array<{ row: string; target: string; targetText?: string }> = [
      { row: "Git commit author", target: "You only" },
      { row: "Pull request links open...", target: "In-session" },
      { row: "Review trigger", target: "When the PR is ready" },
    ];
    const originalSelect: Record<string, string> = {};
    for (const { row } of selects) {
      originalSelect[row] = ((await prefs.combobox(row).textContent()) ?? "").trim();
    }
    const draftsInitial = await prefs.switchState("Open pull requests as drafts");

    try {
      for (const { row, target, targetText } of selects) {
        expect(originalSelect[row]).not.toBe(target);
        await prefs.selectOption(row, target, targetText ?? target);
      }
      await prefs.toggleSwitch("Open pull requests as drafts");

      // All new values survive a reload.
      await page.reload();
      await prefs.heading.waitFor({ state: "visible" });
      for (const { row, target, targetText } of selects) {
        await expect(prefs.combobox(row)).toContainText(targetText ?? target);
      }
      const draftsFlipped = draftsInitial === "true" ? "false" : "true";
      await expect(prefs.switch("Open pull requests as drafts")).toHaveAttribute(
        "aria-checked",
        draftsFlipped,
      );
    } finally {
      // Cleanup: restore original selections and the drafts toggle.
      await prefs.goto();
      for (const { row } of selects) {
        const current = ((await prefs.combobox(row).textContent()) ?? "").trim();
        if (current !== originalSelect[row]) {
          await prefs.selectOption(row, originalSelect[row]);
        }
      }
      await prefs.setSwitch("Open pull requests as drafts", draftsInitial);
    }

    await page.reload();
    await prefs.heading.waitFor({ state: "visible" });
    for (const { row } of selects) {
      await expect(prefs.combobox(row)).toContainText(originalSelect[row]);
    }
    await expect(prefs.switch("Open pull requests as drafts")).toHaveAttribute(
      "aria-checked",
      draftsInitial,
    );
  });

  test("PREF-E2E01 — Default agent preference is reflected in the new-session composer", async ({
    page,
  }) => {
    const prefs = new PrefsPage(page);
    await prefs.goto();

    const original = ((await prefs.combobox("Default agent").textContent()) ?? "").trim();
    expect(original).not.toBe("");
    // The composer chip shows a short label ("Fast" for "Fast Mode").
    const chipFor = (option: string) => (option === "Fast Mode" ? "Fast" : option);
    const disposable = original === "Normal" ? "Ultra" : "Normal";

    const composerChip = (label: string) =>
      page.locator("main").getByText(label, { exact: true }).first();

    try {
      await prefs.selectOption("Default agent", disposable);

      // The change persists across a reload.
      await page.reload();
      await prefs.heading.waitFor({ state: "visible" });
      await expect(prefs.combobox("Default agent")).toContainText(disposable);

      // Downstream: the sub-org new-session composer picks up the preferred agent.
      await page.goto(routes.subOrg(TEST_SUBORG));
      await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 20_000 });
      await expect(composerChip(chipFor(disposable))).toBeVisible();
    } finally {
      // Cleanup: restore the original default agent.
      await prefs.goto();
      const current = ((await prefs.combobox("Default agent").textContent()) ?? "").trim();
      if (current !== original) {
        await prefs.selectOption("Default agent", original);
      }
    }

    // Restored preference is reflected downstream again.
    await page.goto(routes.subOrg(TEST_SUBORG));
    await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 20_000 });
    await expect(composerChip(chipFor(original))).toBeVisible();
  });
});
