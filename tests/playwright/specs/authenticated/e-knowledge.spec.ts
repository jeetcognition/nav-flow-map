import { test, expect } from "@playwright/test";
import { KnowledgePage } from "../../pages";

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
    await knowledge.goto();
    await knowledge.heading.waitFor({ state: "visible" });

    await knowledge.toggleFolder("Enterprise knowledge");
    const first = knowledge.tableRows
      .filter({ hasText: "backend based code" })
      .first()
      .locator("span[role='checkbox']");
    const second = knowledge.tableRows
      .filter({ hasText: "qa-temp-knowledge-1784684134815" })
      .first()
      .locator("span[role='checkbox']");

    await first.click();
    await page.getByRole("button", { name: "Take action" }).waitFor({ state: "visible" });
    await second.click();

    await expect(page.getByText(/2 selected/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Take action" })).toBeVisible();

    // Undo selection so the next run starts from an unselected list.
    await first.click();
    await second.click();
    await expect(page.getByRole("button", { name: "Take action" })).toBeHidden();
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
});
