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
});
