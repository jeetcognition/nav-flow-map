import { test, expect, request } from "@playwright/test";
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

  test("API-REG03 — Create a disposable service user and inspect token handling", async ({
    page,
  }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);
    const name = `qa-api-reg03-${Date.now()}`;

    try {
      await api.goto();
      await api.heading.waitFor({ state: "visible" });
      await api.provisionButton.click();
      await page.getByRole("menuitem", { name: /Enterprise service user/ }).click();
      await api.nameInput.fill(name);
      await api.roleSelector.click();
      await page.getByRole("option").first().click();
      await api.expiresSelector.click();
      await page.getByRole("option").first().click();

      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/service-users") && r.request().method() === "POST",
        ),
        api.createSubmitButton.click(),
      ]);

      await expect(api.tokenDialog).toBeVisible();
      await expect(api.tokenDialog).toContainText(name);
      const tokenText = await api.tokenValue.innerText();
      expect(tokenText).toMatch(/^cog_[a-z0-9]+$/);
      await expect(api.saveTokenButton).toBeVisible();
      await expect(api.copyTokenButton).toBeVisible();

      await api.saveTokenButton.click();
      await expect(api.tokenDialog).not.toBeVisible();
      await expect(page.getByText("Service user provisioned successfully")).toBeVisible();

      await api.searchInput.fill(name);
      await page.waitForLoadState("networkidle");
      const row = api.rowByName(name).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText("Enterprise");
      await expect(row).toContainText("Admin");
      await expect(row).not.toContainText(tokenText);

      await row.getByRole("button", { name: "Delete service user" }).click();
      await expect(api.deleteConfirmDialog).toBeVisible();
      await expect(api.deleteConfirmDialog).toContainText(name);
      await api.deleteConfirmButton.click();
      await expect(row).toHaveCount(0);
    } finally {
      await api.ensureDeleted(name);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("API-REG04 — Cancel and confirm deletion of a disposable service user", async ({ page }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);
    const name = `qa-api-reg04-${Date.now()}`;

    try {
      await api.goto();
      await api.heading.waitFor({ state: "visible" });
      await api.provisionButton.click();
      await page.getByRole("menuitem", { name: /Enterprise service user/ }).click();
      await api.nameInput.fill(name);
      await api.roleSelector.click();
      await page.getByRole("option").first().click();
      await api.expiresSelector.click();
      await page.getByRole("option").first().click();
      await Promise.all([
        page.waitForResponse(
          (r) => r.url().includes("/service-users") && r.request().method() === "POST",
        ),
        api.createSubmitButton.click(),
      ]);
      await api.saveTokenButton.click();

      await api.searchInput.fill(name);
      await page.waitForLoadState("networkidle");
      const row = api.rowByName(name).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText("Enterprise");
      await expect(row).toContainText("Admin");

      // Cancel once
      await row.getByRole("button", { name: "Delete service user" }).click();
      await expect(api.deleteConfirmDialog).toBeVisible();
      await expect(api.deleteConfirmDialog).toContainText(name);
      await api.deleteCancelButton.click();
      await expect(api.deleteConfirmDialog).not.toBeVisible();
      await expect(row).toBeVisible();

      // Confirm deletion
      await row.getByRole("button", { name: "Delete service user" }).click();
      await expect(api.deleteConfirmDialog).toBeVisible();
      await api.deleteConfirmButton.click();
      await expect(api.deleteConfirmDialog).not.toBeVisible();
      await expect(api.rowByName(name)).toHaveCount(0);
    } finally {
      await api.ensureDeleted(name);
    }

    expect(consoleErrors).toEqual([]);
  });

  test("API-REG05 — Server-side authorization blocks IDOR and unauthenticated access", async ({
    page,
  }) => {
    const api = new DevinApiPage(page);
    const consoleErrors = trackConsoleErrors(page);

    // Capture a real authenticated request so we can replay it with tampered inputs.
    const { enterpriseId, authorization, baseUrl } = await api.captureServiceUsersApi();
    expect(authorization).toMatch(/^Bearer /);

    const authed = { authorization };
    const fakeEnterprise = "enterprise-00000000000000000000000000000000";
    const fakeServiceUser = "service-user-00000000000000000000000000000000";
    const listPath = (ent: string) => `${baseUrl}/api/enterprise/${ent}/service-users`;
    const keysPath = (ent: string) =>
      `${baseUrl}/api/enterprise/${ent}/api-keys?page=1&per_page=25`;

    // Control: the admin can read their own enterprise's service users.
    const control = await page.request.get(listPath(enterpriseId), { headers: authed });
    expect(control.status()).toBe(200);

    // IDOR: reading another enterprise's keys/users with a valid token is rejected.
    for (const url of [listPath(fakeEnterprise), keysPath(fakeEnterprise)]) {
      const res = await page.request.get(url, { headers: authed });
      expect(res.status()).toBe(403);
    }

    // IDOR: mutating a foreign enterprise (create/delete) is rejected before any change.
    const foreignCreate = await page.request.post(listPath(fakeEnterprise), {
      headers: authed,
      data: { name: "idor-probe", role_id: "x", expiration_days: 7 },
    });
    expect(foreignCreate.status()).toBe(403);

    const foreignDelete = await page.request.delete(
      `${listPath(fakeEnterprise)}/${fakeServiceUser}`,
      { headers: authed },
    );
    expect(foreignDelete.status()).toBe(403);

    // No cross-tenant leakage: deleting a non-existent user in the real enterprise is a
    // clean 404 (not a silent 200 that would imply an out-of-scope delete succeeded).
    const missingDelete = await page.request.delete(
      `${listPath(enterpriseId)}/${fakeServiceUser}`,
      { headers: authed },
    );
    expect(missingDelete.status()).toBe(404);

    // Unauthenticated: without the bearer token every operation is refused.
    const anon = await request.newContext();
    try {
      for (const url of [listPath(enterpriseId), keysPath(enterpriseId)]) {
        const res = await anon.get(url);
        expect(res.status()).toBe(401);
      }
      const anonCreate = await anon.post(listPath(enterpriseId), {
        data: { name: "idor-probe", role_id: "x", expiration_days: 7 },
      });
      expect(anonCreate.status()).toBe(401);
    } finally {
      await anon.dispose();
    }

    expect(consoleErrors).toEqual([]);
  });
});
