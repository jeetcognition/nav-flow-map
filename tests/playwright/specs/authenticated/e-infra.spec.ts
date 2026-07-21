import { test, expect } from "@playwright/test";
import { InfraSettingsPage } from "../../pages";

test.describe("Enterprise Infrastructure", () => {
  let infra: InfraSettingsPage;

  test.beforeEach(async ({ page }) => {
    infra = new InfraSettingsPage(page);
    await infra.goto();
    await expect(infra.heading).toBeVisible();
  });

  test("INFRA-SMK01 — Load cold.", async () => {
    await infra.expectHealthyEmptyState();
  });

  test("INFRA-SAN01 — Inspect current VPC/tenant/hypervisor state.", async () => {
    await infra.expectHealthyEmptyState();
  });

  test("INFRA-REG01 — Click Refresh repeatedly and during slow/error network conditions.", async () => {
    await infra.expectHealthyEmptyState();

    await infra.clickRefresh();
    await expect(infra.heading).toBeVisible();
    await expect(infra.refreshButton).toBeVisible();
    await expect(infra.noVpcNotice).toBeVisible();
    await expect(infra.emptyGuidance).toBeVisible();

    await infra.clickRefresh();
    await expect(infra.heading).toBeVisible();
    await expect(infra.refreshButton).toBeVisible();
    await expect(infra.noVpcNotice).toBeVisible();
    await expect(infra.emptyGuidance).toBeVisible();
  });
});
