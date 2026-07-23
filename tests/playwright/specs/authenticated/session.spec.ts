import { test, expect } from "@playwright/test";
import { DevinSessionPage } from "../../pages";

// SESSION node specs — catalog-driven Playwright tests for the "New session"
// composer and the /sessions/{id} session tools panel.
// Cases: app/src/data/fixtures/testcases.json (nodeId: "session")

test.describe("New session composer", () => {
  test.beforeEach(({ page }) => {
    page.on("dialog", async (dialog) => {
      const message = dialog.message();
      await dialog.dismiss();
      throw new Error(`Unexpected dialog: ${message}`);
    });
  });

  test("COMP-SMK02 — Type a prompt → Send", async ({ page }) => {
    const session = new DevinSessionPage(page);
    const title = `COMP-SMK02 smoke ${Date.now()}`;
    await session.gotoSession();

    const sessionId = await session.sendPrompt(
      `${title}: automated smoke check. Reply with one short line and stop; take no other action.`,
    );
    await expect(page).toHaveURL(/\/sessions\/[^/]+/);
    expect(sessionId).not.toBe("");

    // Cleanup: archive the session we just created from the Recent sidebar.
    // Session titles are AI-generated, so target the row by its session href.
    await session.gotoSession();
    await session.archiveRecentSessionByHref(`/sessions/${sessionId}`);
  });

  test("COMP-SAN01 — Click Send with empty box, then whitespace-only", async ({ page }) => {
    const session = new DevinSessionPage(page);
    await session.gotoSession();

    await expect(session.sendButton).toBeDisabled();

    await session.promptInput.click();
    await session.promptInput.pressSequentially("   ");
    await expect(session.sendButton).toBeDisabled();

    await session.clearPrompt();
    await expect(session.sendButton).toBeDisabled();
    await expect(page).not.toHaveURL(/\/sessions\//);
  });

  test("COMP-REG01 — Open mode dropdown", async ({ page }) => {
    const session = new DevinSessionPage(page);
    await session.gotoSession();

    await session.openModeMenu();
    const menu = session.openMenu;
    // Capability radios plus the Mode/Speed groupings.
    await expect(menu).toContainText("Normal");
    await expect(menu).toContainText("Ultra");
    await expect(menu).toContainText("Fusion");
    await expect(menu).toContainText("SWE-1.7");
    await expect(menu).toContainText("Mode");
    await expect(menu).toContainText("Agent");
    await expect(menu).toContainText("Speed");
    await expect(menu).toContainText("Fast");

    // Selecting a capability changes the trigger label; no crash.
    await session.selectCapability("Ultra");
    await expect(session.modeTrigger("Ultra")).toBeVisible();

    // Restore the default capability. After an explicit selection the trigger
    // reads "Normal" (a fresh composer shows the "Fast" speed label instead).
    await session.openModeMenu();
    await session.selectCapability("Normal");
    await expect(session.modeTrigger(/^(Normal|Fast)$/)).toBeVisible();
    await expect(session.promptInput).toBeVisible();
  });

  test("COMP-REG02 — Open Add context menu", async ({ page }) => {
    const session = new DevinSessionPage(page);
    await session.gotoSession();

    await session.openAttachMenu();
    for (const item of [
      "Upload attachment",
      "Repositories",
      "Codebase files",
      "Skills",
      "Devin sessions",
      "Playbooks",
      "Secrets",
      "Send secrets",
      "Actions",
    ]) {
      const entry = page.getByRole("menuitem", { name: item, exact: true });
      await expect(entry).toBeVisible();
      await expect(entry).toBeEnabled();
    }
    await session.closeMenu();
    await expect(session.promptInput).toBeVisible();
  });

  test('COMP-REG04 — Send options → "Start session in background"', async ({ page }) => {
    const session = new DevinSessionPage(page);
    await session.gotoSession();

    const hrefsBefore = await session.recentSessionHrefs();

    // The send-options trigger is disabled until the composer has content.
    await expect(session.sendOptionsButton).toBeDisabled();
    await session.promptInput.click();
    await session.promptInput.fill(
      "COMP-REG04 automated background-start check. Reply with one short line and stop; take no other action.",
    );
    await expect(session.sendOptionsButton).toBeEnabled();

    await session.openSendOptionsMenu();
    const backgroundOption = page.getByRole("menuitem", { name: /Start session in background/ });
    await expect(backgroundOption).toBeVisible();
    await backgroundOption.click();

    // Background start stays on the composer, clears it, and the new session
    // appears in the Recent sidebar. Session titles are AI-generated, so the
    // new session is detected as a new href rather than by title.
    await expect(page).not.toHaveURL(/\/sessions\//);
    let newHrefs: string[] = [];
    await expect
      .poll(
        async () => {
          const current = await session.recentSessionHrefs();
          newHrefs = current.filter((href) => !hrefsBefore.includes(href));
          return newHrefs.length;
        },
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
    await expect(session.sendButton).toBeDisabled();

    // Cleanup: archive the background session.
    await session.archiveRecentSessionByHref(newHrefs[0]);
  });

  test("COMP-REG05 — Paste 10,000-char prompt with special chars/Unicode/script", async ({
    page,
  }) => {
    const session = new DevinSessionPage(page);
    await session.gotoSession();

    const hostile = "<script>alert(1)</script> 😀🚀🔥 ñüßé 中文 \"quotes\" 'single' &amp; ";
    const large = hostile + "x".repeat(10_000 - hostile.length);
    expect(large.length).toBe(10_000);

    await session.promptInput.click();
    await session.promptInput.fill(large);

    // The editor accepts the input, renders the markup inert, and Send arms.
    await expect(session.promptInput).toContainText("<script>alert(1)</script>");
    await expect(session.sendButton).toBeEnabled();

    // Cleanup: clear the composer and confirm the default disarmed state.
    await session.clearPrompt();
    await expect(session.sendButton).toBeDisabled();
  });
});

test.describe("Session tools panel", () => {
  test("STOOL-SMK01 — Load Progress tab", async ({ page }) => {
    const session = new DevinSessionPage(page);
    await session.gotoSession();

    // Open the most recent session from the sidebar.
    const firstSession = page.locator('a[href^="/sessions/"]').first();
    await expect(firstSession).toBeVisible({ timeout: 20_000 });
    await firstSession.click();
    await page.waitForURL(/\/sessions\/[^/]+/, { timeout: 20_000 });

    // The tools panel offers Shell / Editor(IDE) / Desktop(Browser) / Progress
    // (Planner) plus Changes and Agents in the current UI.
    for (const label of ["Shell", "Editor", "Desktop", "Progress", "Changes", "Agents"]) {
      await expect(session.toolPanelOption(label)).toBeVisible({ timeout: 20_000 });
    }

    // Selecting Progress opens it as the active tool tab.
    await session.toolPanelOption("Progress").click();
    await expect(page.getByRole("button", { name: "Progress" })).toBeVisible();
  });
});
