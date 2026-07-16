import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

// Env: set BASE_URL to the target environment.
const BASE_URL = process.env.BASE_URL ?? 'https://cog-enterprise-qa.beta.devinenterprise.com';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,                  // serial — shared enterprise state + single OTP inbox, no parallel conflicts
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Videos double as attachable evidence alongside your Jam recordings.
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1) Logs in once and saves the admin session for reuse. Run with `npm run auth`.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // 2) All other tests, reusing the saved session.
    {
      name: 'tests',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
