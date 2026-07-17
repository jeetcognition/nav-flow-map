import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages";

// LOGIN-SAN01 — Load the Login page
// Catalog: catalog/pages/login.json
// Spec: tests/playwright/specs/unauthenticated/login.spec.ts

if (!process.env.BASE_URL) {
  test.skip("BASE_URL is not set; skipping the catalog-driven login page spec [LOGIN-SAN01]");
}

test("LOGIN-SAN01 — Load the Login page", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await expect(login.logo).toBeVisible();
  await expect(login.heading).toBeVisible();
  await expect(login.emailInput).toBeVisible();
  await expect(login.continueButton).toBeVisible();
});
