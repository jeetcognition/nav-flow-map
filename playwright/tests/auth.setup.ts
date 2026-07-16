import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import { LoginPage, OrgSelectorPage } from './pages';
import { fetchLatestOtp } from './support/gmail-otp';

// Captures an authenticated admin session once so other tests can reuse it.
// Run with `npm run auth` or let it run automatically as the `setup` project dependency.

fs.mkdirSync('.auth', { recursive: true });

setup('authenticate as admin', async ({ page }) => {
  const email = (process.env.DEVIN_ADMIN_EMAIL ?? '').trim();
  const appPassword = (process.env.GMAIL_APP_PASSWORD ?? '').trim();

  if (!email || !appPassword) {
    setup.skip(true, 'Set DEVIN_ADMIN_EMAIL and GMAIL_APP_PASSWORD in .env to run this setup.');
    return;
  }

  const login = new LoginPage(page);
  const orgSelector = new OrgSelectorPage(page);

  console.log(`[auth:ADMIN] Email-OTP mode — requesting a code for ${email}`);
  await login.goto();
  await login.loginWithEmailOtp(email, () =>
    fetchLatestOtp({
      user: process.env.GMAIL_IMAP_USER || email,
      password: appPassword,
      initialDelayMs: 10_000,
      fromIncludes: process.env.OTP_FROM_INCLUDES,
      subjectIncludes: process.env.OTP_SUBJECT_INCLUDES,
    }),
  );

  // Confirm we landed on the post-login org-selector page.
  await expect(orgSelector.heading).toBeVisible({ timeout: 30_000 });

  await page.context().storageState({ path: '.auth/admin.json' });
  console.log('[auth:ADMIN] session saved -> .auth/admin.json');
});
