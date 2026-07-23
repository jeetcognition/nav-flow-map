import { test, expect, type Page } from "@playwright/test";
import { InfraPage } from "../../pages";

test.describe("Infrastructure", () => {
  function watchErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));
    return errors;
  }

  test("INFRA-SMK01 — Load cold.", async ({ page }) => {
    const errors = watchErrors(page);
    const infra = new InfraPage(page);
    await infra.goto();

    await expect(infra.heading).toBeVisible();
    await expect(infra.subheading).toBeVisible();
    await expect(infra.refreshButton.first()).toBeVisible();
    await expect(infra.noVpcData).toBeVisible();
    await expect(infra.noTenants).toBeVisible();
    await expect(infra.backToEnterprise).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("INFRA-SAN01 — Inspect current VPC/tenant/hypervisor state.", async ({ page }) => {
    const errors = watchErrors(page);
    const infra = new InfraPage(page);
    await infra.goto();

    await expect(infra.heading).toBeVisible();
    await expect(infra.noVpcData).toBeVisible();
    await expect(infra.noTenants).toBeVisible();
    await expect(infra.refreshButton.first()).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("INFRA-REG01 — Click Refresh repeatedly.", async ({ page }) => {
    const errors = watchErrors(page);
    const infra = new InfraPage(page);
    await infra.goto();

    // Repeated refresh clicks should be idempotent and not crash the page.
    for (let i = 0; i < 3; i += 1) {
      const responsePromise = page.waitForResponse(/\/api\/enterprise\/.*\/vpc/);
      await infra.refreshButton.first().click();
      await responsePromise;
      await expect(infra.heading).toBeVisible();
    }

    // Click the second refresh target (empty-state action) as well.
    const secondRefresh = infra.refreshButton.nth(1);
    if (await secondRefresh.isVisible()) {
      const responsePromise = page.waitForResponse(/\/api\/enterprise\/.*\/vpc/);
      await secondRefresh.click();
      await responsePromise;
      await expect(infra.heading).toBeVisible();
    }

    expect(errors).toHaveLength(0);
  });

  test("INFRA-REG03 — Tampered tenant IDs are denied infrastructure health data.", async ({
    page,
  }) => {
    const infra = new InfraPage(page);

    // Capture the legitimate VPC health request (including its auth headers) and
    // confirm the baseline request for the admin's own enterprise succeeds.
    const captured = await infra.gotoAndCaptureVpcRequest();
    expect(captured.status).toBe(200);
    const enterpriseId = captured.url.match(/\/api\/enterprise\/([^/]+)\/vpc/)?.[1];
    expect(enterpriseId).toBeTruthy();

    // Replay the same authenticated request with tampered tenant identifiers.
    const authorization = captured.headers["authorization"];
    expect(authorization).toBeTruthy();
    const origin = new URL(captured.url).origin;
    const tamperedIds = ["enterprise-00000000000000000000000000000000", `${enterpriseId}x`];

    for (const tamperedId of tamperedIds) {
      const response = await page.request.get(`${origin}/api/enterprise/${tamperedId}/vpc`, {
        headers: { authorization },
      });

      // Server denies unauthorized/cross-tenant infra visibility.
      expect([401, 403, 404]).toContain(response.status());

      // The denial does not expose internal host details.
      const body = await response.text();
      expect(body).not.toContain("tenants");
      expect(body).not.toContain("hypervisor");
      expect(body.toLowerCase()).not.toContain("host");
    }
  });
});
