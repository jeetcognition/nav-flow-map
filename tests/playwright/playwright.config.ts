import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const BASE_URL = process.env.BASE_URL ?? "https://cog-enterprise-qa.beta.devinenterprise.com";

export default defineConfig({
  testDir: "./specs",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    // Captures an authenticated admin session. Run manually with `npm run auth`.
    { name: "setup", testMatch: "auth.setup.ts" },
    // Specs that do not require authentication (e.g. the public login page).
    { name: "unauthenticated", testMatch: "unauthenticated/*.spec.ts" },
    // Specs that reuse the saved admin session.
    {
      name: "authenticated",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ".auth/admin.json" },
      testMatch: "authenticated/*.spec.ts",
    },
  ],
});
