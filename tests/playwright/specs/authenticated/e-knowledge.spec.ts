import { test, expect } from "@playwright/test";
import { KnowledgePage, DevinSessionPage } from "../../pages";
import { routes } from "../../support/paths";

test.describe("Knowledge Page", () => {
  test("KNOW-SMK01 — Load the page cold", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await expect(knowledge.description).toBeVisible();
    await expect(knowledge.docsLink).toBeVisible();
    await expect(knowledge.createButton).toBeVisible();
    await expect(knowledge.searchInput).toBeVisible();
    await expect(knowledge.table).toBeVisible();
    await expect(knowledge.systemFolder).toBeVisible();
    await expect(knowledge.enterpriseFolder).toBeVisible();
    await expect(page.getByRole("columnheader").filter({ hasText: /Name/ })).toBeVisible();
    await expect(page.getByRole("columnheader").filter({ hasText: /Author/ })).toBeVisible();
    await expect(page.getByRole("columnheader").filter({ hasText: /Created at/ })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("KNOW-SAN01 — Expand and collapse System and Enterprise knowledge folders", async ({
    page,
  }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.toggleFolder("System knowledge");
    const builtIn = knowledge.tableRows.filter({ hasText: "Built-in knowledge" }).first();
    const repoIndexes = knowledge.tableRows.filter({ hasText: "Repo indexes" }).first();
    await expect(builtIn).toBeVisible();
    await expect(repoIndexes).toBeVisible();

    await builtIn.click();
    const workflow = knowledge.tableRows
      .filter({ hasText: "Backend Development & Deployment Workflow" })
      .first();
    await expect(workflow).toBeVisible();
    await builtIn.click();
    await expect(workflow).toBeHidden();

    await knowledge.toggleFolder("System knowledge");
    await expect(builtIn).toBeHidden();
    await expect(repoIndexes).toBeHidden();

    await knowledge.toggleFolder("Enterprise knowledge");
    const enterpriseEntry = knowledge.tableRows.filter({ hasText: "backend based code" }).first();
    await expect(enterpriseEntry).toBeVisible();

    await knowledge.toggleFolder("Enterprise knowledge");
    await expect(enterpriseEntry).toBeHidden();
  });

  test("KNOW-SAN03 — Inspect the knowledge list", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await expect(knowledge.description).toContainText(
      "Devin recalls relevant knowledge automatically during sessions",
    );
    await expect(knowledge.docsLink).toHaveAttribute("href", /docs\.devin\.ai/);
    await expect(knowledge.createButton).toBeEnabled();
    await expect(knowledge.searchInput).toHaveAttribute("placeholder", "Search for knowledge...");
    await expect(page.getByRole("columnheader").filter({ hasText: /Name/ })).toBeVisible();
    await expect(page.getByRole("columnheader").filter({ hasText: /Author/ })).toBeVisible();
    await expect(page.getByRole("columnheader").filter({ hasText: /Created at/ })).toBeVisible();
    await expect(knowledge.systemFolder).toContainText("Cognition");
    await expect(knowledge.enterpriseFolder).toContainText("Cognition");
  });

  test("KNOW-SAN04 — Open and cancel the knowledge creation panel", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.createButton.click();
    await expect(knowledge.creationPanel).toBeVisible();
    await expect(
      page.getByText("All organizations in your enterprise will inherit this knowledge"),
    ).toBeVisible();
    await expect(knowledge.nameInput).toBeVisible();
    await expect(knowledge.contentsEditor).toBeVisible();
    await expect(knowledge.macroInput).toBeVisible();
    await expect(page.getByText("Enterprise Folder")).toBeVisible();
    await expect(page.getByText(/Pin to repository/)).toBeVisible();
    await expect(page.getByText("None", { exact: true })).toBeVisible();
    await expect(knowledge.nextButton).toBeVisible();
    await expect(knowledge.cancelButton).toBeVisible();

    await knowledge.cancelButton.click();
    await expect(knowledge.creationPanel).toBeHidden();
    await expect(knowledge.createButton).toBeVisible();
  });

  test("KNOW-SAN05 — Select multiple Enterprise knowledge entries", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const firstName = `qa-temp-knowledge-san05-${ts}-1`;
    const secondName = `qa-temp-knowledge-san05-${ts}-2`;

    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    // Create two disposable Enterprise entries up-front.
    await knowledge.createKnowledge(firstName, "first", "trigger one");
    await knowledge.createKnowledge(secondName, "second", "trigger two");

    await knowledge.searchInput.fill(`qa-temp-knowledge-san05-${ts}`);
    await knowledge.selectRow(firstName);
    await expect(knowledge.takeActionButton).toBeVisible();
    await knowledge.selectRow(secondName);

    await expect(page.getByText(/2 selected/)).toBeVisible();
    await expect(knowledge.takeActionButton).toBeVisible();

    // Undo selection so the next run starts from an unselected list.
    await knowledge.selectRow(firstName);
    await knowledge.selectRow(secondName);
    await expect(knowledge.takeActionButton).toBeHidden();

    // Cleanup: delete the disposable entries.
    await knowledge.selectRow(firstName);
    await knowledge.selectRow(secondName);
    await knowledge.chooseBulkDelete();
    await knowledge.confirmBulkDelete();
    await expect(knowledge.searchInput).toBeVisible();
  });

  test("KNOW-SAN06 — Click Take action on a selected Enterprise knowledge entry", async ({
    page,
  }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-san06-${ts}`;

    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    try {
      await knowledge.createKnowledge(name, "sanity content", "sanity trigger");
      await knowledge.searchInput.fill(name);
      await knowledge.selectRow(name);
      await expect(knowledge.takeActionButton).toBeVisible();

      await knowledge.takeActionButton.click();
      const options = page.getByRole("option");
      await expect(options).toHaveCount(3);

      const moveOption = options.nth(0);
      const autoOption = options.nth(1);
      const deleteOption = options.nth(2);

      await expect(moveOption).toContainText("Move to folder");
      await expect(moveOption).toContainText(
        "Enterprise knowledge cannot be moved to a different folder",
      );
      await expect(moveOption).toHaveAttribute("aria-disabled", "true");

      await expect(autoOption).toContainText("Auto-organize selection");
      await expect(autoOption).toContainText(
        "You must create at least one folder to auto organize knowledge",
      );
      await expect(autoOption).toHaveAttribute("aria-disabled", "true");

      await expect(deleteOption).toHaveText("Delete");
      await expect(deleteOption).not.toHaveAttribute("aria-disabled", "true");

      // Close the menu and deselect so the next test starts clean.
      await page.keyboard.press("Escape");
      await expect(options).toHaveCount(0);
      await knowledge.selectRow(name);
      await expect(knowledge.takeActionButton).toBeHidden();

      // Cleanup: remove the disposable entry.
      await knowledge.searchInput.fill(name);
      await knowledge.openEntryByName(name);
      await knowledge.deleteOpenEntry();
    } finally {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });
      await knowledge.searchInput.fill(name);
      const row = knowledge.tableRows.filter({ hasText: name }).first();
      if (await row.isVisible().catch(() => false)) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-SAN07 — Open a built-in System knowledge entry", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.toggleFolder("System knowledge");
    const builtIn = knowledge.tableRows.filter({ hasText: "Built-in knowledge" }).first();
    await builtIn.click();
    await knowledge.openEntry("Backend Development & Deployment Workflow");

    await expect(knowledge.backToKnowledge).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Backend Development & Deployment Workflow", exact: true }),
    ).toBeVisible();
    await expect(page.locator("main").getByText("Cognition", { exact: true })).toBeVisible();
    await expect(page.locator("main").getByText("Dec 19, 2025", { exact: true })).toBeVisible();
    await expect(knowledge.detailsTab).toHaveAttribute("aria-selected", "true");
    await expect(knowledge.usageTab).toBeVisible();
    await expect(page.getByText("Cognition's built-in knowledge cannot be edited")).toBeVisible();

    await knowledge.backToKnowledge.click();
    await expect(page).toHaveURL(/\/settings\/knowledge$/);
  });

  test("KNOW-SAN08 — Open an editable Enterprise knowledge entry", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.toggleFolder("Enterprise knowledge");
    await knowledge.openEntry("backend based code");

    await expect(knowledge.backToKnowledge).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "backend based code", exact: true }),
    ).toBeVisible();
    await expect(page.locator("main").getByText("kush", { exact: true })).toBeVisible();
    await expect(knowledge.detailsTab).toHaveAttribute("aria-selected", "true");
    await expect(knowledge.usageTab).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();

    await knowledge.backToKnowledge.click();
    await expect(page).toHaveURL(/\/settings\/knowledge$/);
  });

  test("KNOW-SAN09 — View the Usage tab on a knowledge entry", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.toggleFolder("System knowledge");
    const builtIn = knowledge.tableRows.filter({ hasText: "Built-in knowledge" }).first();
    await builtIn.click();
    await knowledge.openEntry("Backend Development & Deployment Workflow");

    await knowledge.usageTab.click();
    await expect(knowledge.usageTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Session usage by day")).toBeVisible();
    await expect(page.getByText("Retrieved")).toBeVisible();
    await expect(page.getByText("Used")).toBeVisible();
    await expect(page.getByText("No usage data available for the last 30 days")).toBeVisible();
    await expect(page.getByText("No sessions found")).toBeVisible();

    await knowledge.backToKnowledge.click();
    await expect(page).toHaveURL(/\/settings\/knowledge$/);
  });

  test("KNOW-REG06 — Search the knowledge list", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.searchInput.fill("Enterprise knowledge");
    await expect(knowledge.enterpriseFolder).toBeVisible();
    await expect(knowledge.noResults).toBeHidden();

    await knowledge.searchInput.fill("zxyqwerty");
    await expect(knowledge.noResults).toBeVisible();

    await knowledge.searchInput.fill("   ");
    await expect(knowledge.noResults).toBeHidden();

    await knowledge.searchInput.fill("backend based code");
    await expect(knowledge.tableRows.filter({ hasText: "backend based code" })).toBeVisible();

    await knowledge.searchInput.fill("😃");
    await expect(knowledge.noResults).toBeHidden();

    await knowledge.searchInput.fill("<script>alert(1)</script>");
    await expect(knowledge.noResults).toBeVisible();

    await knowledge.searchInput.fill("a".repeat(300));
    await expect(knowledge.noResults).toBeVisible();

    await knowledge.searchInput.fill("");
    await expect(knowledge.tableRows.filter({ hasText: "System knowledge" })).toBeVisible();
  });

  test("KNOW-REG16 — Usage tab shows a clear empty state before sessions are recorded", async ({
    page,
  }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.toggleFolder("System knowledge");
    const builtIn = knowledge.tableRows.filter({ hasText: "Built-in knowledge" }).first();
    await builtIn.click();
    await knowledge.openEntry("Backend Development & Deployment Workflow");

    await knowledge.usageTab.click();
    await expect(knowledge.usageTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Session usage by day")).toBeVisible();
    await expect(page.locator("main").getByText("Sessions", { exact: true })).toBeVisible();
    await expect(page.getByText("No sessions found")).toBeVisible();

    await knowledge.backToKnowledge.click();
    await expect(page).toHaveURL(/\/settings\/knowledge$/);
  });

  test("KNOW-REG07 — Create, edit, and delete a disposable Enterprise knowledge entry", async ({
    page,
  }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-e2e-${ts}`;
    const content = "Original content for REG07.";
    const trigger = "Original trigger.";
    const macro = `qa-macro-${ts}`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, content, trigger, { macro });

      // Verify in list and search.
      await knowledge.searchInput.fill(name);
      await expect(knowledge.tableRows.filter({ hasText: name }).first()).toBeVisible();

      // Open and edit every detail field.
      await knowledge.openEntryByName(name);
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();

      const updatedContent = "Updated REG07 content.";
      const updatedTrigger = "Updated REG07 trigger.";
      const updatedMacro = `qa-updated-macro-${ts}`;
      await knowledge.fillKnowledgeDetail(updatedContent, updatedTrigger, updatedMacro);
      await knowledge.selectPin("All sessions");
      await knowledge.selectFolder("Enterprise Folder");
      await knowledge.saveKnowledge();

      await expect(knowledge.triggerInput).toHaveValue(updatedTrigger);
      await expect(knowledge.macroInput).toHaveValue(updatedMacro);

      // Reload and verify persistence.
      await page.reload();
      await page.getByRole("heading", { name, exact: true }).waitFor({ state: "visible" });
      await expect(knowledge.contentsEditor).toContainText(updatedContent);
      await expect(knowledge.triggerInput).toHaveValue(updatedTrigger);
      await expect(knowledge.macroInput).toHaveValue(updatedMacro);
      await expect(knowledge.pinSelect).toHaveValue("All sessions");
      await expect(knowledge.folderSelect).toHaveValue("Enterprise Folder");

      await knowledge.deleteOpenEntry();
      await knowledge.searchInput.fill(name);
      await expect(knowledge.tableRows.filter({ hasText: name }).first()).toBeHidden();
    } finally {
      // Best-effort cleanup if the test aborted mid-flow.
      await page.goto(routes.enterpriseKnowledge());
      await knowledge.searchInput.fill(name);
      if (
        await knowledge.tableRows
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-REG09 — Create and edit with HTML-like, Unicode, and RTL text", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-inject-${ts}`;
    // Use injection-like strings that must be stored and rendered inert.
    const content = `<script>alert('xss')</script> 🔥 مرحبا`;
    const trigger = `trigger-<img src=x onerror=alert(1)> 🚀`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, content, trigger, {
        macro: `qa-inject-macro-${ts}`,
      });

      await knowledge.openEntryByName(name);
      await expect(knowledge.contentsEditor).toContainText("alert('xss')");
      await expect(knowledge.contentsEditor).toContainText("🔥");
      await expect(knowledge.contentsEditor).toContainText("مرحبا");
      await expect(knowledge.triggerInput).toHaveValue(trigger);

      // The literal HTML-like text should be stored and displayed, not executed as DOM nodes.
      await expect(knowledge.contentsEditor).toContainText("<script>alert('xss')</script>");
      await expect(knowledge.triggerInput).toHaveValue(trigger);

      await knowledge.deleteOpenEntry();
    } finally {
      await page.goto(routes.enterpriseKnowledge());
      await knowledge.searchInput.fill(name);
      if (
        await knowledge.tableRows
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-REG10 — Bulk delete selected disposable entries", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const firstName = `qa-temp-knowledge-bulk-${ts}-1`;
    const secondName = `qa-temp-knowledge-bulk-${ts}-2`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(firstName, "bulk one", "trigger one");
      await knowledge.createKnowledge(secondName, "bulk two", "trigger two");

      await knowledge.searchInput.fill(`qa-temp-knowledge-bulk-${ts}`);
      await knowledge.selectRow(firstName);
      await knowledge.selectRow(secondName);

      await expect(page.getByText(/2 selected/)).toBeVisible();
      await knowledge.chooseBulkDelete();
      await expect(page.locator('[role="dialog"]')).toContainText("Delete Items");
      await expect(page.locator('[role="dialog"]')).toContainText("2 selected item");
      await knowledge.confirmBulkDelete();

      await knowledge.searchInput.fill(firstName);
      await expect(knowledge.tableRows.filter({ hasText: firstName }).first()).toBeHidden();
      await knowledge.searchInput.fill(secondName);
      await expect(knowledge.tableRows.filter({ hasText: secondName }).first()).toBeHidden();
    } finally {
      await page.goto(routes.enterpriseKnowledge());
      for (const name of [firstName, secondName]) {
        await knowledge.searchInput.fill(name);
        if (
          await knowledge.tableRows
            .filter({ hasText: name })
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          await knowledge.openEntryByName(name);
          await knowledge.deleteOpenEntry().catch(() => {});
        }
      }
    }
  });

  test("KNOW-REG11 — Edit all fields, reload, and restore originals", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-update-${ts}`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, "original content", "original trigger", {
        macro: `qa-update-macro-${ts}`,
      });
      await knowledge.openEntryByName(name);

      const originalContent = await knowledge.contentsEditor.innerText();
      const originalTrigger = await knowledge.triggerInput.inputValue();
      const originalMacro = await knowledge.macroInput.inputValue();
      const originalPin = await knowledge.pinSelect.inputValue();
      const originalFolder = await knowledge.folderSelect.inputValue();

      const newContent = "Updated content for reload test.";
      const newTrigger = "Updated trigger for reload test.";
      const newMacro = `qa-updated-macro-${ts}`;
      await knowledge.fillKnowledgeDetail(newContent, newTrigger, newMacro);
      await knowledge.selectPin("All sessions");
      await knowledge.saveKnowledge();

      await page.reload();
      await page.getByRole("heading", { name, exact: true }).waitFor({ state: "visible" });
      await expect(knowledge.contentsEditor).toContainText(newContent);
      await expect(knowledge.triggerInput).toHaveValue(newTrigger);
      await expect(knowledge.macroInput).toHaveValue(newMacro);

      // Restore original values.
      await knowledge.fillKnowledgeDetail(originalContent, originalTrigger, originalMacro);
      await knowledge.selectPin(originalPin as "None" | "All sessions");
      await knowledge.selectFolder(originalFolder);
      await knowledge.saveKnowledge();

      await page.reload();
      await expect(knowledge.contentsEditor).toContainText(originalContent);
      await expect(knowledge.triggerInput).toHaveValue(originalTrigger);
      await expect(knowledge.macroInput).toHaveValue(originalMacro);

      await knowledge.deleteOpenEntry();
    } finally {
      await page.goto(routes.enterpriseKnowledge());
      await knowledge.searchInput.fill(name);
      if (
        await knowledge.tableRows
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-REG12 — Invalid values are rejected or not persisted", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-invalid-${ts}`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, "original content", "original trigger", {
        macro: `qa-valid-macro-${ts}`,
      });
      await knowledge.openEntryByName(name);

      // Blank content disables the Save button, so a PUT is never issued.
      await knowledge.contentsEditor.click();
      await knowledge.contentsEditor.fill("");
      await expect(knowledge.saveButton).toBeDisabled();

      // Restore valid content before testing macro validation.
      await knowledge.contentsEditor.click();
      await knowledge.contentsEditor.fill("restored content");

      // Invalid macro in the detail page should be rejected by the backend.
      const originalMacro = await knowledge.macroInput.inputValue();
      await knowledge.macroInput.fill("");
      await knowledge.macroInput.fill("bad macro spaces");
      const [badResp] = await Promise.all([
        page.waitForResponse(
          (r) => /\/api\/[^/]+\/learning\/[^/]+/.test(r.url()) && r.request().method() === "PUT",
        ),
        knowledge.saveButton.click(),
      ]);
      expect(badResp.status()).toBe(400);

      // Long and Unicode/RHTML-like values are stored safely but should render inert.
      const longContent = "a".repeat(300);
      const longTrigger = "trigger-".repeat(20);
      const safeMacro = `qa-long-macro-${ts}`;
      await knowledge.fillKnowledgeDetail(longContent, longTrigger, safeMacro);
      const [okResp] = await Promise.all([
        page.waitForResponse(
          (r) => /\/api\/[^/]+\/learning\/[^/]+/.test(r.url()) && r.request().method() === "PUT",
        ),
        knowledge.saveButton.click(),
      ]);
      expect(okResp.status()).toBe(200);
      await page.reload();
      await expect(knowledge.contentsEditor).toContainText(longContent);
      await expect(knowledge.triggerInput).toHaveValue(longTrigger);

      // Restore original macro.
      await knowledge.macroInput.fill("");
      await knowledge.macroInput.fill(originalMacro);
      await knowledge.saveKnowledge();

      await knowledge.deleteOpenEntry();
    } finally {
      await page.goto(routes.enterpriseKnowledge());
      await knowledge.searchInput.fill(name);
      if (
        await knowledge.tableRows
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-REG08 — Create validation rejects blank and malformed values", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const baseName = `qa-temp-knowledge-valid-${ts}`;

    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    // Blank name and content should disable the Next button.
    await knowledge.createButton.click();
    await expect(knowledge.creationPanel).toBeVisible();
    await knowledge.nameInput.fill("");
    await knowledge.contentsEditor.click();
    await knowledge.contentsEditor.fill("some content");
    await expect(knowledge.nextButton).toBeDisabled();

    await knowledge.nameInput.fill(baseName);
    await knowledge.contentsEditor.click();
    await knowledge.contentsEditor.fill("");
    await expect(knowledge.nextButton).toBeDisabled();

    // Fill valid name/content and then use an invalid macro.
    await knowledge.contentsEditor.click();
    await knowledge.contentsEditor.fill("content");
    await knowledge.macroInput.fill("bad macro");
    await knowledge.nextButton.click();
    await knowledge.triggerInput.fill("trigger");
    await Promise.all([
      page.waitForResponse(
        (r) => /\/api\/[^/]+\/learning$/.test(r.url()) && r.request().method() === "POST",
      ),
      knowledge.createSubmitButton.click(),
    ]);
    await expect(page.getByText(/Failed to create knowledge: Invalid macro/)).toBeVisible();

    // Step 2 only exposes Back/Create; go back to step 1 to close with Cancel.
    await knowledge.creationBackButton.click();
    await knowledge.cancelButton.click();
    await page.goto(routes.enterpriseKnowledge());
    await knowledge.searchInput.fill(baseName);
    const leftover = knowledge.tableRows.filter({ hasText: baseName }).first();
    if (await leftover.isVisible().catch(() => false)) {
      await knowledge.openEntryByName(baseName);
      await knowledge.deleteOpenEntry();
    }
  });

  test("KNOW-REG13 — Unsaved changes warn before leaving", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-unsaved-${ts}`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, "initial content", "initial trigger");
      await knowledge.openEntryByName(name);

      await knowledge.triggerInput.fill("Changed without saving");
      await knowledge.backToKnowledge.click();

      const dialog = page.getByRole("alertdialog").or(page.locator('[role="dialog"]'));
      await expect(dialog).toContainText("Are you sure you want to leave this page?");
      await dialog.getByRole("button", { name: "Cancel" }).click();

      // Still on detail with the unsaved value.
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
      await expect(knowledge.triggerInput).toHaveValue("Changed without saving");

      // Discard and verify the original persisted value remains.
      await knowledge.backToKnowledge.click();
      await dialog.getByRole("button", { name: "Confirm" }).click();
      await expect(page).toHaveURL(/\/settings\/knowledge$/);

      await knowledge.openEntryByName(name);
      await expect(knowledge.triggerInput).toHaveValue("initial trigger");
      await knowledge.deleteOpenEntry();
    } finally {
      await page.goto(routes.enterpriseKnowledge());
      await knowledge.searchInput.fill(name);
      if (
        await knowledge.tableRows
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-REG18 — Delete cancel then confirm", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    const ts = Date.now();
    const name = `qa-temp-knowledge-delete-${ts}`;

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, "to delete", "trigger");
      await knowledge.openEntryByName(name);

      await knowledge.openDeleteDialog();
      await expect(page.locator('[role="dialog"]')).toContainText("Delete Knowledge");
      await knowledge.cancelDeleteDialog();
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();

      await knowledge.openDeleteDialog();
      await knowledge.confirmDeleteDialog();
      await expect(page).toHaveURL(/\/settings\/knowledge$/);

      await knowledge.searchInput.fill(name);
      await expect(knowledge.tableRows.filter({ hasText: name }).first()).toBeHidden();
    } finally {
      await page.goto(routes.enterpriseKnowledge());
      await knowledge.searchInput.fill(name);
      if (
        await knowledge.tableRows
          .filter({ hasText: name })
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await knowledge.openEntryByName(name);
        await knowledge.deleteOpenEntry().catch(() => {});
      }
    }
  });

  test("KNOW-REG14 — Compare the chart, legend, and session records for the same period", async ({
    page,
  }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.openEntryByName("hi");

    const [usageResp, sessionsResp] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/analytics/usage")),
      page.waitForResponse((r) => r.url().endsWith("/analytics/sessions")),
      knowledge.usageTab.click(),
    ]);

    type UsageStat = { date: string; access: number; analysis: number; displayDate: string };
    const usage = (await usageResp.json()) as { stats: UsageStat[]; last_updated_at: string };
    const sessions = (await sessionsResp.json()) as {
      data: { devin_id: string; session_title: string }[];
    };

    await expect(knowledge.usageTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Session usage by day")).toBeVisible();
    await expect(page.getByText("Retrieved")).toBeVisible();
    await expect(page.getByText("Used")).toBeVisible();
    await expect(page.getByText("Last 30 days")).toBeVisible();

    const rows = knowledge.table.locator("tbody tr");
    await expect(rows).toHaveCount(sessions.data.length);

    expect(usage.stats.length).toBeGreaterThan(0);
    const totalAccess = usage.stats.reduce((sum, s) => sum + s.access, 0);
    const totalAnalysis = usage.stats.reduce((sum, s) => sum + s.analysis, 0);
    expect(totalAccess).toBeGreaterThanOrEqual(sessions.data.length);
    expect(totalAnalysis).toBeGreaterThanOrEqual(0);

    const lastUpdated = new Date(usage.last_updated_at);
    for (const stat of usage.stats) {
      const statDate = new Date(stat.date);
      expect(statDate.getTime()).toBeLessThanOrEqual(lastUpdated.getTime() + 86_400_000);
      expect(lastUpdated.getTime() - statDate.getTime()).toBeLessThanOrEqual(31 * 86_400_000);
    }

    await knowledge.backToKnowledge.click();
    await expect(page).toHaveURL(/\/settings\/knowledge$/);
  });

  test("KNOW-REG15 — Click View session for several rows, then return", async ({ page }) => {
    const knowledge = new KnowledgePage(page);
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.openEntryByName("hi");

    const [sessionsResp] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith("/analytics/sessions")),
      knowledge.usageTab.click(),
    ]);
    const sessions = (await sessionsResp.json()) as {
      data: { devin_id: string; session_title: string }[];
    };

    await expect(page.getByText("Session usage by day")).toBeVisible();
    const viewButtons = page.getByRole("button", { name: "View session" });
    const viewCount = await viewButtons.count();
    expect(viewCount).toBeGreaterThan(0);

    const clicks = Math.min(viewCount, 3);
    for (let i = 0; i < clicks; i++) {
      const expectedId = sessions.data[i].devin_id.replace("devin-", "");

      await viewButtons.nth(i).click();
      await page.waitForURL((url) => url.pathname.endsWith(`/sessions/${expectedId}`));
      await expect(page.locator("body")).not.toContainText("This page could not be found");

      await page.goBack();
      await page.waitForURL(/\/settings\/knowledge\/.+/);
      // The Usage tab isn't always auto-selected on later back navigations;
      // explicitly reselect it and verify the session list reappears.
      await knowledge.usageTab.click();
      await expect(knowledge.usageTab).toHaveAttribute("aria-selected", "true");
      await expect(page.getByText("Session usage by day")).toBeVisible();
      await expect(knowledge.table.locator("tbody tr")).toHaveCount(sessions.data.length);
    }

    await knowledge.backToKnowledge.click();
    await expect(page).toHaveURL(/\/settings\/knowledge$/);
  });

  test("KNOW-REG17 — Tampered or unauthenticated access to Usage and View session is denied", async ({
    page,
    browser,
  }) => {
    const knowledge = new KnowledgePage(page);

    // Authenticated user with a tampered knowledge id.
    await page.goto(`${routes.enterpriseKnowledge()}/not-a-real-id/usage`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText("Not Found")).toBeVisible();

    // Authenticated user with a tampered session id.
    await page.goto("/sessions/not-a-real-id", { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("This page could not be found");

    // Unauthenticated user is denied access and no session data is exposed.
    const unauthContext = await browser.newContext();
    const unauthPage = await unauthContext.newPage();
    await unauthPage.goto(`${routes.enterpriseKnowledge()}/not-a-real-id/usage`, {
      waitUntil: "networkidle",
    });
    const unauthUrl = unauthPage.url();
    if (unauthUrl.includes("auth.beta.devin.ai")) {
      // Redirect to login is acceptable; nothing further to assert.
    } else {
      await expect(unauthPage.getByText("Not Found")).toBeVisible();
      await expect(unauthPage.locator("body")).not.toContainText("Improve playbook");
    }
    await unauthContext.close();

    // Return to the real knowledge page to reset state cleanly.
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });
  });

  test("KNOW-E2E01 — Knowledge trigger flows through a Devin session to Usage", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(360_000);

    const knowledge = new KnowledgePage(page);
    const session = new DevinSessionPage(page);
    const ts = Date.now();
    const name = `KNOW-E2E01 pineapple ${ts}`;
    const content =
      "If the user prompt contains the word 'pineapple', end your response with the exact line 'KNOWLEDGE-TRIGGER-CONFIRMED'.";
    // A descriptive trigger is more reliably matched by Devin’s knowledge retrieval.
    const trigger = "when the user's prompt contains the word 'pineapple', use this knowledge";
    // This prompt contains the trigger word and is phrased to retrieve knowledge.
    const prompt = "Pineapple knowledge";

    const findSessionById = (
      sessions: { data?: { devin_id: string; session_title: string }[] } | undefined,
      sessionId: string,
    ) => (sessions?.data ?? []).some((s) => s.devin_id.replace("devin-", "") === sessionId);

    try {
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });

      await knowledge.createKnowledge(name, content, trigger);

      // Refresh the knowledge list and search to confirm persistence.
      await page.reload();
      await knowledge.heading.waitFor({ state: "visible" });
      await knowledge.searchInput.fill(name);
      await expect(page.getByRole("cell", { name, exact: true }).first()).toBeVisible();

      // Start a new Devin session with a prompt that contains the trigger word.
      await session.gotoComposer();
      const sessionId = await session.sendPrompt(prompt);
      await session.waitForResponseEnding("KNOWLEDGE-TRIGGER-CONFIRMED", 180_000);

      // Confirm the session appears on the knowledge Usage tab.
      await knowledge.goto();
      await knowledge.heading.waitFor({ state: "visible" });
      await knowledge.openEntryByName(name);
      const detailUrl = page.url();

      /** Open the Usage tab and return the analytics/sessions response. */
      const fetchUsageSessions = async (): Promise<{
        data?: { devin_id: string; session_title: string }[];
      }> => {
        await page.goto(detailUrl, { waitUntil: "domcontentloaded" });
        const [sessionsResp] = await Promise.all([
          page.waitForResponse((r) => r.url().endsWith("/analytics/sessions")),
          knowledge.usageTab.click(),
        ]);
        return (await sessionsResp.json()) as {
          data?: { devin_id: string; session_title: string }[];
        };
      };

      await expect
        .poll(async () => findSessionById(await fetchUsageSessions(), sessionId), {
          intervals: [2_000, 5_000, 10_000, 15_000],
          timeout: 120_000,
        })
        .toBe(true);

      // Refresh the page and confirm the session still appears on Usage.
      await page.reload();
      await expect
        .poll(async () => findSessionById(await fetchUsageSessions(), sessionId), {
          intervals: [2_000, 5_000, 10_000, 15_000],
          timeout: 60_000,
        })
        .toBe(true);

      // Clean up the disposable knowledge entry.
      await page.goto(detailUrl);
      await knowledge.deleteOpenEntry();
    } finally {
      // Best-effort cleanup of the disposable knowledge entry.
      try {
        await page.goto(routes.enterpriseKnowledge());
        await knowledge.heading.waitFor({ state: "visible" });
        await knowledge.searchInput.fill(name);
        const cell = page.getByRole("cell", { name, exact: true }).first();
        if (await cell.isVisible().catch(() => false)) {
          await cell.click();
          await page.waitForURL(/\/settings\/knowledge\/.+/);
          await knowledge.deleteOpenEntry();
        }
      } catch {
        // Entry was already deleted or not found.
      }
    }
  });
});
