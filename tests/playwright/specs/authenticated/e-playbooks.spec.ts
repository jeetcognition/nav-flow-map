import { test, expect } from "@playwright/test";
import { PlaybooksPage, DevinSessionPage } from "../../pages";
import { routes } from "../../support/paths";

test.describe("Playbooks Page", () => {
  test("PLAY-SMK01 — Load the page cold", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await playbooks.goto();

    await expect(playbooks.description).toBeVisible();
    await expect(playbooks.docsLink).toBeVisible();
    await expect(playbooks.enterpriseTab).toHaveText(/Enterprise\s*\d+/);
    await expect(playbooks.systemTab).toHaveText(/System\s*\d+/);
    await expect(playbooks.searchInput).toBeVisible();
    await expect(playbooks.table).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("PLAY-SAN01 — Inspect the Enterprise list", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    await playbooks.goto();

    await expect(playbooks.enterpriseTab).toHaveAttribute("aria-selected", "true");
    await expect(playbooks.createButton).toBeEnabled();
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Macro" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Created by" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Last updated" })).toBeVisible();
    expect(await playbooks.tableRows.count()).toBeGreaterThan(0);
  });

  test("PLAY-SAN02 — Inspect the System list", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    await playbooks.goto();

    await playbooks.systemTab.click();
    await expect(playbooks.systemTab).toHaveAttribute("aria-selected", "true");
    await expect(playbooks.systemTab).toHaveText(/System\s*\d+/);
    const systemCount = Number((await playbooks.systemTab.innerText()).replace(/\D/g, ""));
    expect(systemCount).toBeGreaterThan(0);

    // Every row in the System collection belongs to the Cognition Team.
    await expect(playbooks.tableRows).toHaveCount(systemCount);
    await expect(playbooks.tableRows.filter({ hasText: "Cognition Team" })).toHaveCount(
      systemCount,
    );

    // The read-only System collection offers no Create playbook action.
    await expect(playbooks.createButton).toHaveCount(0);
  });

  test("PLAY-SAN03 — Click Create playbook", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    await playbooks.goto();

    await playbooks.createButton.click();
    await expect(page).toHaveURL(/\/settings\/playbooks\/create$/);

    await expect(page.getByRole("navigation", { name: "breadcrumb" })).toBeVisible();
    await expect(playbooks.backToPlaybooks).toBeVisible();
    await expect(playbooks.nameInput).toBeVisible();
    // The author line shows the logged-in user's email.
    await expect(page.locator("main").getByText(/@/)).toBeVisible();
    await expect(playbooks.editTab).toBeVisible();
    await expect(playbooks.previewTab).toBeVisible();
    await expect(playbooks.bodyEditor).toBeVisible();
    await expect(playbooks.macroInput).toBeVisible();
    await expect(page.getByRole("heading", { name: "Devin mode" })).toBeVisible();
    await expect(playbooks.modeSelect).toBeVisible();
    await expect(playbooks.cancelButton).toBeVisible();
    await expect(playbooks.saveButton).toBeVisible();
    await expect(playbooks.expandButton).toBeVisible();
  });

  test("PLAY-SAN04 — Inspect the default editor content", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    await playbooks.gotoCreate();

    await expect(playbooks.bodyEditor).toContainText("## Overview");
    await expect(playbooks.bodyEditor).toContainText("## Procedure");
    await expect(playbooks.bodyEditor).toContainText("## Advice & Pointers");
    await expect(playbooks.bodyEditor).toContainText("## Forbidden actions");
    await expect(playbooks.charCounter).toBeVisible();
  });

  test("PLAY-REG01 — Search with matching and hostile input, then clear", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    await playbooks.goto();

    const totalCount = await playbooks.waitForStableRowCount();
    const firstName = (await playbooks.tableRows.first().innerText()).split("\n")[0].trim();

    // Matching query filters to the matching row(s).
    await playbooks.searchInput.fill(firstName);
    await expect(playbooks.tableRows.filter({ hasText: firstName }).first()).toBeVisible();
    await expect(playbooks.noResults).toBeHidden();

    // No-match query shows a clear empty state.
    await playbooks.searchInput.fill("zxyqwerty-no-such-playbook");
    await expect(playbooks.noResults).toBeVisible();

    // Whitespace, emoji, long, HTML-like, and injection-like inputs stay inert.
    await playbooks.searchInput.fill("   ");
    await expect(playbooks.noResults).toBeHidden();

    await playbooks.searchInput.fill("😃🚀");
    await expect(playbooks.noResults).toBeVisible();

    await playbooks.searchInput.fill("a".repeat(300));
    await expect(playbooks.noResults).toBeVisible();

    await playbooks.searchInput.fill("<script>window.__pwned=1</script>");
    const pwned = await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned);
    expect(pwned).toBeUndefined();

    await playbooks.searchInput.fill("'; DROP TABLE playbooks; --");
    await expect(playbooks.noResults).toBeVisible();

    // Clearing restores the full list.
    await playbooks.searchInput.fill("");
    await expect(playbooks.tableRows).toHaveCount(totalCount);
  });

  test("PLAY-REG02 — HTML-like, Unicode, and RTL values render as inert text", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    const ts = Date.now();
    const name = `<b>qa-temp-playbook-xss-${ts}</b> 🔥 مرحبا`;
    const body = `<script>window.__pwnedBody=1</script>\n\nUnicode 🚀 and RTL مرحبا بالعالم text.`;
    const macro = `!qa_temp_xss_${ts}`;

    try {
      await playbooks.createPlaybook(name, body, macro);

      // The list renders the hostile name as literal text.
      await playbooks.searchInput.fill(`qa-temp-playbook-xss-${ts}`);
      await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();

      // The detail page renders the body without executing anything.
      await playbooks.openPlaybookByName(name);
      await expect(page.getByRole("heading", { name })).toBeVisible();
      const details = page.getByRole("tabpanel", { name: "Details" });
      await expect(details).toContainText("🚀");
      await expect(details).toContainText("مرحبا بالعالم");

      // The raw HTML-like text is stored verbatim and visible in the editor.
      await playbooks.enterEditMode();
      await expect(playbooks.bodyEditor).toHaveValue(body);
      await playbooks.cancelButton.click();
      const pwned = await page.evaluate(
        () => (window as unknown as { __pwnedBody?: number }).__pwnedBody,
      );
      expect(pwned).toBeUndefined();

      await playbooks.deleteOpenPlaybook();
      await playbooks.searchInput.fill(`qa-temp-playbook-xss-${ts}`);
      await expect(playbooks.noResults).toBeVisible();
    } finally {
      await playbooks.deletePlaybookByName(name);
    }
  });

  test("PLAY-REG04 — Tab switching, deep links, and invalid tab values", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    await playbooks.goto();
    await expect(playbooks.enterpriseTab).toHaveAttribute("aria-selected", "true");

    // Switching to System writes the tab into the URL.
    await playbooks.systemTab.click();
    await expect(playbooks.systemTab).toHaveAttribute("aria-selected", "true");
    await expect(page).toHaveURL(/\?tab=community$/);

    // The selected tab survives a reload.
    await page.reload();
    await playbooks.heading.waitFor({ state: "visible" });
    await expect(playbooks.systemTab).toHaveAttribute("aria-selected", "true");

    // Deep-linking each tab lands on the right tab.
    await page.goto(`${routes.playbooks()}?tab=community`);
    await playbooks.heading.waitFor({ state: "visible" });
    await expect(playbooks.systemTab).toHaveAttribute("aria-selected", "true");

    await page.goto(routes.playbooks());
    await playbooks.heading.waitFor({ state: "visible" });
    await expect(playbooks.enterpriseTab).toHaveAttribute("aria-selected", "true");

    // Invalid tab values fall back to the Enterprise tab without a crash.
    await page.goto(`${routes.playbooks()}?tab=bogus`);
    await playbooks.heading.waitFor({ state: "visible" });
    await expect(playbooks.enterpriseTab).toHaveAttribute("aria-selected", "true");
    await expect(playbooks.table).toBeVisible();
  });

  test("PLAY-REG05 — Creation validation for blank, duplicate, long, and HTML-like values", async ({
    page,
  }) => {
    const playbooks = new PlaybooksPage(page);
    const ts = Date.now();
    const existingName = `qa-temp-playbook-dup-${ts}`;

    try {
      // Baseline playbook used for the duplicate checks.
      await playbooks.createPlaybook(existingName, "duplicate baseline body", `!qa_temp_dup_${ts}`);

      await playbooks.gotoCreate();

      // Blank name and body keep Save disabled.
      await expect(playbooks.saveButton).toBeDisabled();
      await playbooks.typeBody("some body");
      await expect(playbooks.saveButton).toBeDisabled();
      await playbooks.typeName(`qa-temp-playbook-blank-${ts}`);
      await playbooks.typeBody("");
      await expect(playbooks.saveButton).toBeDisabled();

      // A duplicate name auto-fills a duplicate macro, which keeps Save disabled.
      await playbooks.typeName(existingName);
      await playbooks.typeBody("body for duplicate name");
      await expect(playbooks.saveButton).toBeDisabled();

      // Excessive-length and HTML-like text stays inert; nothing is saved.
      await playbooks.typeName("a".repeat(300));
      await playbooks.typeBody(`<img src=x onerror=window.__pwnedCreate=1>\n${"b".repeat(500)}`);
      const pwned = await page.evaluate(
        () => (window as unknown as { __pwnedCreate?: number }).__pwnedCreate,
      );
      expect(pwned).toBeUndefined();

      // Leave without saving and confirm no incomplete playbook was created.
      await playbooks.goto();
      await playbooks.searchInput.fill(`qa-temp-playbook-blank-${ts}`);
      await expect(playbooks.noResults).toBeVisible();
    } finally {
      await playbooks.deletePlaybookByName(existingName);
    }
  });

  test("PLAY-REG06 — Macro validation rejects invalid and duplicate macros", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    const ts = Date.now();
    const existingName = `qa-temp-playbook-macro-${ts}`;
    const existingMacro = `!qa_temp_macro_${ts}`;

    try {
      // Baseline playbook that owns the macro used for the duplicate check.
      await playbooks.createPlaybook(existingName, "macro baseline body", existingMacro);

      await playbooks.gotoCreate();
      await playbooks.typeName(`qa-temp-playbook-macro-form-${ts}`);
      await playbooks.typeBody("macro validation body");

      // Missing "!" prefix.
      await playbooks.typeMacro(`qa_temp_nobang_${ts}`);
      await expect(playbooks.saveButton).toBeDisabled();

      // Spaces.
      await playbooks.typeMacro(`!qa temp spaces ${ts}`);
      await expect(playbooks.saveButton).toBeDisabled();

      // Unsupported characters.
      await playbooks.typeMacro(`!qa$temp$chars$${ts}`);
      await expect(playbooks.saveButton).toBeDisabled();

      // Excessive length.
      await playbooks.typeMacro(`!${"a".repeat(120)}`);
      await expect(playbooks.saveButton).toBeDisabled();

      // Duplicate of an existing macro.
      await playbooks.typeMacro(existingMacro);
      await expect(playbooks.saveButton).toBeDisabled();

      // A valid unique macro is accepted.
      await playbooks.typeMacro(`!qa_temp_valid_${ts}`);
      await expect(playbooks.saveButton).toBeEnabled();

      // Leave without saving.
      await playbooks.goto();
      await playbooks.searchInput.fill(`qa-temp-playbook-macro-form-${ts}`);
      await expect(playbooks.noResults).toBeVisible();
    } finally {
      await playbooks.deletePlaybookByName(existingName);
    }
  });

  test("PLAY-REG07 — Create, read, update, and delete a disposable playbook", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    const ts = Date.now();
    const name = `qa-temp-playbook-${ts}`;
    const updatedName = `qa-temp-playbook-upd-${ts}`;

    try {
      await playbooks.createPlaybook(name, `original body ${ts}`, `!qa_temp_crud_${ts}`);

      // Verify in the Enterprise list via search.
      await playbooks.searchInput.fill(name);
      await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();

      // Edit name, body, macro, and mode.
      await playbooks.openPlaybookByName(name);
      await playbooks.enterEditMode();
      await playbooks.typeName(updatedName);
      await playbooks.typeBody(`updated body ${ts}`);
      await playbooks.typeMacro(`!qa_temp_crud_upd_${ts}`);
      await playbooks.selectMode("Normal");
      await playbooks.save();
      await expect(playbooks.editButton).toBeVisible();

      // Reload and verify persistence.
      await page.reload();
      await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();
      await expect(page.getByRole("tabpanel", { name: "Details" })).toContainText(
        `updated body ${ts}`,
      );
      await expect(playbooks.macroInput).toHaveValue(`!qa_temp_crud_upd_${ts}`);
      await expect(playbooks.modeSelect).toHaveText("Normal");

      // Delete and confirm the disposable playbook is absent.
      await playbooks.deleteOpenPlaybook();
      await playbooks.searchInput.fill(updatedName);
      await expect(playbooks.noResults).toBeVisible();
    } finally {
      await playbooks.deletePlaybookByName(name);
      await playbooks.deletePlaybookByName(updatedName);
    }
  });

  test("PLAY-REG08 — Edit/Preview switching and fullscreen preserve content", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    const markdown = "# QA Heading\n\n- first item\n- second item";

    await playbooks.gotoCreate();
    await playbooks.typeBody(markdown);

    // Preview renders the Markdown as headings and lists.
    await playbooks.previewTab.click();
    const preview = page.getByRole("tabpanel", { name: "Preview" });
    await expect(preview.getByRole("heading", { name: "QA Heading" })).toBeVisible();
    await expect(preview.getByRole("listitem").filter({ hasText: "first item" })).toBeVisible();
    await expect(preview.getByRole("listitem").filter({ hasText: "second item" })).toBeVisible();

    // Switching back to Edit retains the raw text.
    await playbooks.editTab.click();
    await expect(playbooks.bodyEditor).toHaveValue(markdown);

    // Fullscreen preserves content and its own Edit/Preview controls.
    await playbooks.expandButton.click();
    const fullscreen = playbooks.dialog;
    await expect(fullscreen.getByRole("tab", { name: "Edit" })).toBeVisible();
    await expect(fullscreen.getByRole("tab", { name: "Preview" })).toBeVisible();
    await expect(fullscreen.getByRole("textbox")).toHaveValue(markdown);

    // Collapsing returns to the inline editor with the content intact.
    await fullscreen.getByRole("button", { name: "Collapse" }).click();
    await expect(fullscreen).toBeHidden();
    await expect(playbooks.bodyEditor).toHaveValue(markdown);
  });

  test("PLAY-REG11 — Unsaved changes prompt before discarding", async ({ page }) => {
    const playbooks = new PlaybooksPage(page);
    const ts = Date.now();
    const name = `qa-temp-playbook-unsaved-${ts}`;
    const originalBody = `original unsaved-test body ${ts}`;

    try {
      await playbooks.createPlaybook(name, originalBody, `!qa_temp_unsaved_${ts}`);
      await playbooks.openPlaybookByName(name);
      await playbooks.enterEditMode();

      await playbooks.typeBody(`changed but never saved ${ts}`);
      await playbooks.cancelButton.click();

      // Cancel warns before discarding the unsaved changes.
      await expect(playbooks.dialog).toContainText("Discard unsaved changes?");
      await expect(playbooks.dialog).toContainText("All your changes will be lost.");

      // Continue editing keeps the unsaved value.
      await playbooks.dialog.getByRole("button", { name: "Continue editing" }).click();
      await expect(playbooks.bodyEditor).toHaveValue(`changed but never saved ${ts}`);

      // Discard changes reverts to the saved value.
      await playbooks.cancelButton.click();
      await playbooks.dialog.getByRole("button", { name: "Discard changes" }).click();
      await expect(page.getByRole("tabpanel", { name: "Details" })).toContainText(originalBody);

      // Reload and confirm nothing was silently saved.
      await page.reload();
      await expect(page.getByRole("heading", { name })).toBeVisible();
      await expect(page.getByRole("tabpanel", { name: "Details" })).toContainText(originalBody);

      await playbooks.deleteOpenPlaybook();
    } finally {
      await playbooks.deletePlaybookByName(name);
    }
  });

  test("PLAY-REG12 — Devin mode persists and applies to launched sessions", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);

    const playbooks = new PlaybooksPage(page);
    const session = new DevinSessionPage(page);
    const ts = Date.now();
    const name = `qa-temp-playbook-mode-${ts}`;
    const macro = `!qa_temp_mode_${ts}`;

    try {
      await playbooks.createPlaybook(name, `mode persistence body ${ts}`, macro);
      await playbooks.openPlaybookByName(name);

      // Each available mode saves and survives a reload.
      for (const mode of ["Normal", "Ultra", "Fusion", "Fast"] as const) {
        await playbooks.enterEditMode();
        await playbooks.selectMode(mode);
        await playbooks.save();
        await expect(playbooks.editButton).toBeVisible();
        await page.reload();
        await expect(page.getByRole("heading", { name })).toBeVisible();
        await expect(playbooks.modeSelect).toHaveText(mode);
      }

      // Launching a session from the playbook macro applies its mode (Fast).
      await session.gotoSession();
      await session.promptInput.click();
      await session.promptInput.pressSequentially(`${macro} run this playbook`);
      await expect(page.getByRole("button", { name: "Fast", exact: true })).toBeVisible();
      await session.sendButton.click();
      await page.waitForURL(/\/sessions\/[^/]+/, { timeout: 30_000 });
      await expect(page.locator("main")).toContainText(name);
      await expect(
        page.locator("main").getByRole("button", { name: "Fast", exact: true }),
      ).toBeVisible();

      await playbooks.deletePlaybookByName(name);
      await playbooks.searchInput.fill(name);
      await expect(playbooks.noResults).toBeVisible();
    } finally {
      await playbooks.deletePlaybookByName(name);
    }
  });

  test("PLAY-E2E01 — Macro launches the right playbook and Devin follows it", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(360_000);

    const playbooks = new PlaybooksPage(page);
    const session = new DevinSessionPage(page);
    const ts = Date.now();
    const name = `qa-temp-playbook-e2e-${ts}`;
    const macro = `!qa_temp_${ts}`;
    const marker = `PLAYBOOK-TRIGGER-CONFIRMED-${ts}`;
    const body =
      `When this playbook is invoked, do not run any commands or tools. ` +
      `Reply with a single message that ends with the exact line '${marker}' and then stop.`;

    try {
      await playbooks.createPlaybook(name, body, macro);
      await playbooks.searchInput.fill(name);
      await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();

      // Invoke the macro in a new session; the composer resolves it to this playbook.
      await session.gotoSession();
      await session.promptInput.click();
      await session.promptInput.pressSequentially(`${macro} follow the playbook instructions`);
      await session.sendButton.click();
      await page.waitForURL(/\/sessions\/[^/]+/, { timeout: 30_000 });

      // The session shows the invoked playbook and Devin follows its unique
      // instruction — the timestamped marker proves no unrelated playbook ran.
      await expect(page.locator("main")).toContainText(name);
      await session.waitForResponseEnding(marker, 240_000);

      await playbooks.deletePlaybookByName(name);
      await playbooks.searchInput.fill(name);
      await expect(playbooks.noResults).toBeVisible();
    } finally {
      await playbooks.deletePlaybookByName(name);
    }
  });
});
