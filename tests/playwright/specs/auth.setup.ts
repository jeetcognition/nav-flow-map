import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import { LoginPage } from "../pages";
import { adminCredentials, authenticateAdmin } from "../support/admin-auth";
import { fetchLatestOtp } from "../support/gmail-otp";

// Captures an authenticated admin session once so other tests can reuse it.
// Run with `npm run auth` or let it run automatically as the `setup` project dependency.

fs.mkdirSync(".auth", { recursive: true });

setup("authenticate as admin", async ({ page }) => {
  const credentials = adminCredentials();

  if (!credentials) {
    setup.skip(true, "Set DEVIN_ADMIN_EMAIL and GMAIL_APP_PASSWORD in .env to run this setup.");
    return;
  }

  console.log(`[auth:ADMIN] Email-OTP mode — requesting a code for ${credentials.email}`);
  // The landing assertions inside authenticateAdmin double as AUTH-SAN02 (valid OTP →
  // successful login) so the spec does not need to spend a second OTP on the same flow.
  await authenticateAdmin(page);
  console.log("[auth:ADMIN] session saved -> .auth/admin.json");
});

// Captures a NON-ADMIN member session for authorization tests. The member is a
// plus-alias of the admin Gmail inbox (invited as plain Member), so its OTP
// arrives in the same inbox — disambiguated by the To: header.
setup("authenticate as member", async ({ page }) => {
  const email = (process.env.DEVIN_MEMBER_EMAIL ?? "").trim();
  const appPassword = (process.env.GMAIL_APP_PASSWORD ?? "").trim();

  if (!email || !appPassword) {
    setup.skip(true, "Set DEVIN_MEMBER_EMAIL and GMAIL_APP_PASSWORD in .env to run this setup.");
    return;
  }

  const login = new LoginPage(page);

  console.log(`[auth:MEMBER] Email-OTP mode — requesting a code for ${email}`);
  await login.goto();
  await login.loginWithEmailOtp(email, () =>
    fetchLatestOtp({
      user: process.env.GMAIL_IMAP_USER || process.env.DEVIN_ADMIN_EMAIL,
      password: appPassword,
      toIncludes: email,
      fromIncludes: process.env.OTP_FROM_INCLUDES,
      subjectIncludes: process.env.OTP_SUBJECT_INCLUDES,
    }),
  );

  // A plain member may land on the org selector or directly in an org. Wait for
  // the app shell on the product domain — the SPA writes its session cookies
  // during that callback, so saving earlier yields an unauthenticated state.
  await page.waitForURL(/\/org\//, { timeout: 60_000 });
  await expect(page.getByRole("navigation").or(page.locator("main")).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(
      async () =>
        (await page.context().cookies()).some((cookie) => cookie.name.includes("is.authenticated")),
      { timeout: 30_000 },
    )
    .toBe(true);

  await page.context().storageState({ path: ".auth/member.json" });
  console.log("[auth:MEMBER] session saved -> .auth/member.json");
});
