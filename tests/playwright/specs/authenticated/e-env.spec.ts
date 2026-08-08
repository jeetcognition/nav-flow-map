import { test, expect, type Page } from "@playwright/test";
import { EnvironmentPage, routes } from "../../pages";
import { expectEnterpriseBreadcrumbs } from "../../support/breadcrumbs";
import { expectNoPageErrors } from "../../support/errors";
// Enterprise → Environment (e-env). Read-only against the shared QA tenant:
// nothing is saved, built, or reset; blueprint edits are always discarded.
test.describe("Environment", () => {
  // The page fires a benign 403 resource request on load, so network noise is
  // excluded and only page errors / real console errors are tracked.
  function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("Failed to load resource")) {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("ENV-SMK01 — Load cold.", async ({ page }) => {
    const errors = watchErrors(page);
    const env = new EnvironmentPage(page);
    await env.goto();

    await expect(env.heading).toBeVisible();
    await expect(env.subheading).toBeVisible();
    for (const tab of env.mainTabs()) {
      await expect(tab).toBeVisible();
    }

    // Rollout is the default tab: build health and the organizations table render.
    await expect(env.rolloutStatusHeading).toBeVisible();
    await expect(env.organizationsHeading).toBeVisible();
    await expect(env.rolloutOrgSearch).toBeVisible();

    // Configuration and Blueprint surfaces render.
    await env.configurationTab.click();
    await expect(env.snapshotBuildsHeading).toBeVisible();
    await env.blueprintTab.click();
    await expect(env.blueprintHeading).toBeVisible();

    // Outposts is no longer part of this page on every tenant.
    if (await env.hasOutpostsTab()) {
      await env.outpostsTab.click();
      await expect(env.outpostsHeading).toBeVisible();
    }

    expect(errors).toHaveLength(0);
  });

  test("ENV-SAN01 — Switch each tab and deep-link/refresh it.", async ({ page }) => {
    const env = new EnvironmentPage(page);
    await env.goto();

    // Switching tabs keeps the URL ?tab= param and selection consistent.
    const tabParams: Array<[typeof env.configurationTab, string]> = [
      [env.configurationTab, "configuration"],
      [env.blueprintTab, "blueprint"],
      ...((await env.hasOutpostsTab())
        ? ([[env.outpostsTab, "outposts"]] as Array<[typeof env.configurationTab, string]>)
        : []),
      [env.rolloutTab, "rollout"],
    ];
    for (const [tab, param] of tabParams) {
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(page).toHaveURL(new RegExp(`tab=${param}`));
    }

    // Deep-linking and refreshing each tab restores the same selection.
    for (const [tab, param] of tabParams) {
      await env.goto(param);
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await page.reload();
      await expect(tab).toHaveAttribute("aria-selected", "true");
    }

    // An invalid tab value falls back safely to the default tab.
    await env.goto("bogus-tab-value");
    await expect(env.heading).toBeVisible();
    await expect(env.rolloutTab).toHaveAttribute("aria-selected", "true");
    await expect(env.rolloutStatusHeading).toBeVisible();
  });

  test("ENV-REG01 — Test required configuration controls without saving.", async ({ page }) => {
    const env = new EnvironmentPage(page);
    await env.goto("configuration");

    await expect(env.snapshotBuildsHeading).toBeVisible();

    // Helper text identifies what will be affected.
    await expect(env.maxBuildsHelper).toBeVisible();
    await expect(env.orgOverrideHelper).toBeVisible();

    // Save is gated until a valid selection/change exists.
    await expect(env.saveScheduleButton).toBeVisible();
    await expect(env.saveScheduleButton).toBeDisabled();

    // An empty max-builds value is not a valid change: save stays gated.
    await expect(env.maxBuildsInput).toBeVisible();
    await env.maxBuildsInput.fill("");
    await expect(env.saveScheduleButton).toBeDisabled();
  });

  test("ENV-REG02 — Edit disposable blueprint text; discard or restore.", async ({ page }) => {
    const errors = watchErrors(page);
    const env = new EnvironmentPage(page);
    await env.goto("blueprint");

    await expect(env.blueprintHeading).toBeVisible();
    await expect(env.blueprintEditor).toBeVisible();
    const original = await env.blueprintText();

    // Pristine editor: save/discard are gated.
    await expect(env.saveBlueprintButton).toBeDisabled();
    await expect(env.discardButton).toBeDisabled();

    // Malformed YAML, Unicode, HTML-like, and huge text stay inert in the
    // editor (rendered as text, no page errors) and are never saved.
    const hostile = [
      "initialize: |",
      "  echo unicode ∆≈☃ ハローワールド",
      "bad_yaml: [unclosed, {nested: ",
      '<img src=x onerror="alert(1)"><script>alert(2)</script>',
      `huge: ${"x".repeat(5000)}`,
    ].join("\n");
    await env.replaceBlueprintText(hostile);

    await expect(env.saveBlueprintButton).toBeEnabled();
    await expect(env.discardButton).toBeEnabled();
    // Monaco virtualizes long buffers; scroll back to the top before asserting.
    await page.keyboard.press("Control+Home");
    await expect(env.blueprintEditorContent).toContainText("bad_yaml");

    // Discard restores the original blueprint and re-gates the actions.
    await env.discardButton.click();
    await expect(env.saveBlueprintButton).toBeDisabled();
    await expect(env.discardButton).toBeDisabled();
    expect(await env.blueprintText()).toBe(original);

    expect(errors).toHaveLength(0);
  });

  test("ENV-REG03 — Inspect outpost configuration/list/empty states and available actions.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const env = new EnvironmentPage(page);
    await env.goto("outposts");
    await expect(env.heading).toBeVisible();

    test.skip(
      !(await env.hasOutpostsTab()),
      "The Outposts tab is no longer present on the Environment page",
    );

    await expect(env.outpostsHeading).toBeVisible();
    await expect(env.outpostsDescription).toBeVisible();
    await expect(env.createOutpostButton).toBeVisible();

    // Each outpost states its ownership scope; IDs belong to this tenant's
    // outpost namespace and no unrelated tenant data appears.
    await expect(env.organizationAccessLabels.first()).toBeVisible();
    const accessCount = await env.organizationAccessLabels.count();
    const outpostIds = await page.getByText(/^outpost_env-[0-9a-f]+$/).count();
    expect(outpostIds).toBe(accessCount);

    expect(errors).toHaveLength(0);
  });

  test("ENV-REG04 — Inspect legacy snapshot controls and warnings without changing state.", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    const env = new EnvironmentPage(page);
    await env.goto("snapshots");
    await expect(env.heading).toBeVisible();

    test.skip(
      (await env.goldenSnapshotTab.count()) === 0,
      "The Golden snapshot (legacy) tab is no longer present on the Environment page",
    );

    await expect(env.goldenSnapshotTab).toHaveAttribute("aria-selected", "true");
    await expect(env.goldenSnapshotTab).toContainText("legacy");
    await expect(env.machineSnapshotHeading).toBeVisible();
    await expect(env.operatingSystemText).toBeVisible();

    // Version history identifies the active snapshot.
    await expect(env.currentVersionBadge).toBeVisible();
    expect(await env.versionHistoryRows.count()).toBeGreaterThan(0);

    // Destructive/maintenance controls are present but are NOT activated.
    await expect(env.configureButton).toBeVisible();
    await expect(env.resetMachineButton).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("ENV-REG05 — Search snapshot/version history with no-match and special text.", async ({
    page,
  }) => {
    const env = new EnvironmentPage(page);
    await env.goto("snapshots");
    await expect(env.heading).toBeVisible();

    test.skip(
      (await env.goldenSnapshotTab.count()) === 0,
      "The Golden snapshot (legacy) tab is no longer present on the Environment page",
    );

    // Version history: literal filtering, empty state, and full restore.
    await expect(env.currentVersionBadge).toBeVisible();
    const totalVersions = await env.versionHistoryRows.count();
    await env.versionHistorySearch.fill("June");
    await expect(env.versionHistoryRows.first()).toContainText("June");
    await env.versionHistorySearch.fill("zzz-no-match <script>alert(1)</script> ∆≈");
    await expect(env.noVersionHistory).toBeVisible();
    await env.versionHistorySearch.fill("");
    await expect(env.currentVersionBadge).toBeVisible();
    await expect(env.versionHistoryRows).toHaveCount(totalVersions);

    // Organization snapshots: same literal/no-match/restore behavior.
    await expect(env.snapshotsRows.first()).toBeVisible();
    const totalSnapshots = await env.snapshotsRows.count();
    await env.snapshotsSearch.fill("jeet");
    await expect(env.snapshotsRows.first()).toContainText("jeet");
    await env.snapshotsSearch.fill("zzz-no-match <b>bold</b> ☃");
    await expect(env.noSnapshotsFound).toBeVisible();
    await env.snapshotsSearch.fill("");
    await expect(env.snapshotsRows).toHaveCount(totalSnapshots);
  });

  test("ENV-REG07 — Tampered org IDs and anonymous access cannot read environment config.", async ({
    page,
    browser,
  }) => {
    // Tampered org slug: authorization denies access with a 404, and no
    // environment/blueprint content is rendered.
    const env = new EnvironmentPage(page);
    await page.goto(routes.environment("tampered-org-slug-does-not-exist"));
    await expect(page.getByText("This page could not be found.")).toBeVisible();
    await expect(env.machineSnapshotHeading).not.toBeVisible();
    await expect(env.blueprintTab).not.toBeVisible();

    // Anonymous (no session): redirected to login; nothing leaks.
    // In @playwright/test, browser.newContext() inherits the project's
    // storageState, so the saved admin session must be dropped explicitly.
    const anonContext = await browser.newContext({ storageState: undefined });
    try {
      const anonPage = await anonContext.newPage();
      const base = process.env.BASE_URL ?? "https://cog-enterprise-qa.beta.devinenterprise.com";
      await anonPage.goto(base + routes.environment());
      // Depending on routing, anonymous access lands on the login screen or a
      // 404; either way no environment data is rendered.
      await expect(async () => {
        const deniedUrl = /auth\.|\/login/.test(anonPage.url());
        const body = await anonPage.locator("body").innerText();
        expect(deniedUrl || /could not be found|log in/i.test(body)).toBe(true);
      }).toPass({ timeout: 30_000 });
      await expect(anonPage.getByRole("heading", { name: "Environment" })).not.toBeVisible();
      await expect(anonPage.getByText("Machine snapshot")).not.toBeVisible();
    } finally {
      await anonContext.close();
    }
  });

  test("ENV-REG08 — Verify breadcrumb and Back to enterprise navigation", async ({ page }) => {
    const env = new EnvironmentPage(page);
    await expectEnterpriseBreadcrumbs(page, () => env.goto(), {
      crumbs: ["Settings", "Enterprise", "Environment"],
    });
  });

  test("ENV-REG09 — Verify the page loads without console errors or error boundaries", async ({
    page,
  }) => {
    const env = new EnvironmentPage(page);
    await expectNoPageErrors(page, () => env.goto(), { ready: env.heading });
  });

  test("ENV-REG10 — Blueprint editor unsaved-changes guard on tab switch and reload", async ({
    page,
  }) => {
    // Known product gap: dirty blueprint edits are silently discarded — no
    // unsaved-changes warning, no beforeunload prompt, and the edit does not
    // survive a tab switch or reload. This test pins that behavior; if the
    // product adds a guard (the desired behavior), the dialog handler or the
    // survival assertions will flag the change for review.
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.dismiss();
    });

    const env = new EnvironmentPage(page);
    await env.goto("blueprint");
    await expect(env.blueprintEditor).toBeVisible();
    await expect(env.saveBlueprintButton).toBeDisabled();

    // Dirty the editor with a recognizable marker.
    await env.blueprintEditorContent.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.insertText("\nAAA_QA_MARKER: 1");
    await expect(env.saveBlueprintButton).toBeEnabled();

    // Switch to Configuration and back: no warning fires and the edit is
    // silently dropped; the editor returns pristine.
    await env.configurationTab.click();
    await expect(env.snapshotBuildsHeading).toBeVisible();
    await env.blueprintTab.click();
    await expect(env.blueprintEditor).toBeVisible();
    await expect(env.blueprintEditorContent).not.toContainText("AAA_QA_MARKER");
    await expect(env.saveBlueprintButton).toBeDisabled();

    // Dirty again and reload: no beforeunload prompt, edit is dropped.
    await env.blueprintEditorContent.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.insertText("\nAAA_QA_MARKER: 2");
    await expect(env.saveBlueprintButton).toBeEnabled();
    await page.reload();
    await expect(env.blueprintEditor).toBeVisible();
    await expect(env.blueprintEditorContent).not.toContainText("AAA_QA_MARKER");
    await expect(env.saveBlueprintButton).toBeDisabled();

    expect(dialogs).toEqual([]);
  });

  test("ENV-REG11 — Blueprint editor invalid-YAML gating and discard recovery", async ({
    page,
  }) => {
    const env = new EnvironmentPage(page);
    await env.goto("blueprint");
    await expect(env.blueprintEditor).toBeVisible();
    const original = await env.blueprintText();

    // Replace the buffer with clearly invalid YAML.
    await env.replaceBlueprintText("bad: [unclosed\n: : ::: not yaml @@@]");

    // Known product gap: no inline error markers render and Save blueprint
    // stays ENABLED on syntactically invalid YAML — the editor performs no
    // client-side YAML validation. This pins that behavior (we never click
    // Save on the shared enterprise blueprint).
    await expect(env.saveBlueprintButton).toBeEnabled();
    expect(await page.locator(".monaco-editor .squiggly-error").count()).toBe(0);

    // The caret responds to keyboard navigation and typing lands at the caret.
    await page.keyboard.press("Control+Home");
    await page.keyboard.press("End");
    await page.keyboard.insertText(" # caret-check");
    await expect(env.blueprintEditorContent).toContainText("bad: [unclosed # caret-check");

    // Discard restores the pristine buffer exactly and re-gates the actions.
    await env.discardButton.click();
    await expect(env.saveBlueprintButton).toBeDisabled();
    await expect(env.discardButton).toBeDisabled();
    expect(await env.blueprintText()).toBe(original);
  });
});
