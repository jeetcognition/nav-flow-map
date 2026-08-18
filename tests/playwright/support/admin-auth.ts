import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { LoginPage, OrgSelectorPage } from "../pages";
import { fetchLatestOtp } from "./gmail-otp";
import { routes } from "./paths";

export const ADMIN_STORAGE_STATE = ".auth/admin.json";

/** True when the admin credentials needed for an email-OTP login are configured. */
export function adminCredentials(): { email: string; appPassword: string } | null {
  const email = (process.env.DEVIN_ADMIN_EMAIL ?? "").trim();
  const appPassword = (process.env.GMAIL_APP_PASSWORD ?? "").trim();
  return email && appPassword ? { email, appPassword } : null;
}

/**
 * Log in as the enterprise admin via email OTP and persist the session to
 * `.auth/admin.json`. Shared by the setup project and by tests that log the admin
 * out — a log-out revokes the session server-side, so the saved state has to be
 * refreshed or every later test in the run inherits a dead session.
 */
export async function authenticateAdmin(page: Page): Promise<void> {
  const credentials = adminCredentials();
  expect(credentials, "DEVIN_ADMIN_EMAIL and GMAIL_APP_PASSWORD must be set").not.toBeNull();
  const { email, appPassword } = credentials!;

  const login = new LoginPage(page);
  const orgSelector = new OrgSelectorPage(page);

  await login.goto();
  await login.loginWithEmailOtp(email, () =>
    fetchLatestOtp({
      user: process.env.GMAIL_IMAP_USER || email,
      password: appPassword,
      fromIncludes: process.env.OTP_FROM_INCLUDES,
      subjectIncludes: process.env.OTP_SUBJECT_INCLUDES,
    }),
  );

  await expect(orgSelector.heading).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(routes.orgSelector);

  fs.mkdirSync(".auth", { recursive: true });
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
}
