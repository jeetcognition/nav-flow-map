import { test, expect } from "@playwright/test";
import { DevinApiPage } from "../../pages";

test.describe("Devin API", () => {
  function trackConsoleErrors(page: import("@playwright/test").Page) {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("API-SAN01 — Inspect table rows", async ({ page }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await api.goto();
    await api.heading.waitFor({ state: "visible" });
    await expect(api.serviceUsersTab).toBeVisible();
    await expect(api.legacyApiTab).toBeVisible();
    await expect(api.orgFilter).toBeVisible();
    await expect(api.roleFilter).toBeVisible();
    await expect(api.searchInput).toBeVisible();
    await expect(api.provisionButton).toBeVisible();
    await expect(api.table).toBeVisible();
    await expect(api.tableRows.first()).toBeVisible();
    await expect(api.table.getByRole("columnheader", { name: "Name", exact: true })).toBeVisible();
    await expect(api.table.getByRole("columnheader", { name: "Scope", exact: true })).toBeVisible();
    await expect(
      api.table.getByRole("columnheader", { name: "Organization", exact: true }),
    ).toBeVisible();
    await expect(
      api.table.getByRole("columnheader", { name: "Role name", exact: true }),
    ).toBeVisible();
    await expect(
      api.table.getByRole("columnheader", { name: "Created at", exact: true }),
    ).toBeVisible();
    await expect(
      api.table.getByRole("columnheader", { name: "Expires at", exact: true }),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("API-SAN02 — Switch to Legacy API tab", async ({ page }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await api.goto();
    await api.heading.waitFor({ state: "visible" });
    await api.legacyApiTab.click();
    await expect(page).toHaveURL(/tab=legacy-api/);
    await expect(page.getByText("The legacy API is deprecated")).toBeVisible();
    await expect(page.getByRole("button", { name: /Revoke all API keys/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Provision service key/ })).toBeVisible();
    await expect(api.table.getByRole("columnheader", { name: "Name", exact: true })).toBeVisible();
    await expect(
      api.table.getByRole("columnheader", { name: "Organization", exact: true }),
    ).toBeVisible();
    await expect(api.table.getByRole("columnheader", { name: "Type", exact: true })).toBeVisible();
    await expect(
      api.table.getByRole("columnheader", { name: "Created", exact: true }),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("API-SAN03 — Open Provision without submitting", async ({ page }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await api.goto();
    await api.heading.waitFor({ state: "visible" });
    await api.provisionButton.click();
    await expect(page.getByRole("menuitem", { name: /Enterprise service user/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Organization service user/ })).toBeVisible();
    await page.getByRole("menuitem", { name: /Enterprise service user/ }).click();
    await expect(api.nameInput).toBeVisible();
    await expect(api.roleSelector).toBeVisible();
    await expect(api.expiresSelector).toBeVisible();
    await expect(api.cancelButton).toBeVisible();
    await expect(api.createSubmitButton).toBeDisabled();
    await api.cancelButton.click();
    await expect(api.nameInput).not.toBeVisible();
    await expect(api.provisionButton).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("API-REG01 — Search and filter by organization and role", async ({ page }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);
    await api.goto();
    await api.heading.waitFor({ state: "visible" });

    await api.searchInput.fill("test-api");
    await page.waitForLoadState("networkidle");
    await expect(api.tableRows.first()).toBeVisible();

    await api.searchInput.fill("zxyqwerty");
    await page.waitForLoadState("networkidle");
    await expect(api.emptyState).toBeVisible();

    await api.searchInput.fill("   ");
    await page.waitForLoadState("networkidle");
    await expect(api.emptyState).toBeVisible();

    await api.searchInput.fill("😀");
    await page.waitForLoadState("networkidle");
    await expect(api.emptyState).toBeVisible();

    await api.searchInput.fill("<script>alert(1)</script>");
    await page.waitForLoadState("networkidle");
    await expect(api.emptyState).toBeVisible();

    await api.searchInput.fill("z".repeat(300));
    await page.waitForLoadState("networkidle");
    await expect(api.emptyState).toBeVisible();

    await api.searchInput.fill("");
    await page.waitForLoadState("networkidle");
    await expect(api.tableRows.first()).toBeVisible();

    await api.orgFilter.click();
    await page.getByRole("option", { name: "fri-5", exact: true }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(api.emptyState).toBeVisible();

    await api.orgFilter.click();
    await page.getByRole("option", { name: "All organizations" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(api.tableRows.first()).toBeVisible();

    await api.roleFilter.click();
    await page.getByRole("option", { name: "All roles" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(api.tableRows.first()).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
