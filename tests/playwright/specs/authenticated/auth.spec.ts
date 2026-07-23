import { test, expect, Browser, Page } from "@playwright/test";
import { LoginPage, OrgSelectorPage } from "../../pages";
import { fetchLatestOtp } from "../../support/gmail-otp";
import { routes } from "../../support/paths";

const email = process.env.DEVIN_ADMIN_EMAIL ?? "";
const appPassword = process.env.GMAIL_APP_PASSWORD ?? "";

if (!email || !appPassword) {
  test.skip("DEVIN_ADMIN_EMAIL and GMAIL_APP_PASSWORD are required to run auth specs");
}

const SENSITIVE_PATTERNS = [
  /\bpassword\b/i,
  /\botp\b/i,
  /\bcode\s*=\s*/i,
  /\berror\s*=\s*/i,
  /\baccess[_-]?token\b/i,
  /\brefresh[_-]?token\b/i,
  /\bclient[_-]?secret\b/i,
  /internal server error/i,
  /stack trace/i,
];

function containsSensitive(text: string): string | undefined {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) return `matched ${pattern}`;
  }
  return undefined;
}

function newAnonymousPage(browser: Browser): Promise<Page> {
  // Always force an empty session so the Login page loads instead of a remembered landing page.
  return browser
    .newContext({ storageState: { cookies: [], origins: [] } })
    .then((ctx) => ctx.newPage());
}

async function fetchCode(): Promise<string> {
  return fetchLatestOtp({
    user: process.env.GMAIL_IMAP_USER || email,
    password: appPassword,
    initialDelayMs: 15_000,
    timeoutMs: 60_000,
  });
}

/** Poll the inbox until a code different from `previous` arrives (i.e. the resent email). */
async function fetchDifferentCode(previous: string): Promise<string> {
  const deadline = Date.now() + 120_000;
  let code = previous;
  while (code === previous && Date.now() < deadline) {
    code = await fetchLatestOtp({
      user: process.env.GMAIL_IMAP_USER || email,
      password: appPassword,
      initialDelayMs: 10_000,
      timeoutMs: 60_000,
    });
  }
  expect(code).not.toBe(previous);
  return code;
}

test.describe("Auth (Email + OTP)", () => {
  test("AUTH-SAN01 — Enter a valid work email and click Continue", async ({ browser }) => {
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    await login.goto();
    await login.submitEmail(email);
    await expect(login.otpHeading).toBeVisible({ timeout: 15_000 });
    await expect(login.otpInput).toBeVisible();
    await expect(login.otpSentMessage).toContainText(email);
    await expect(login.resendButton).toBeVisible();
    await page.close();
  });

  test("AUTH-SAN02 — Enter the valid OTP code from the email and submit", async ({ browser }) => {
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    const orgSelector = new OrgSelectorPage(page);
    await login.goto();
    await login.loginWithEmailOtp(email, fetchCode);
    await expect(orgSelector.heading).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(routes.orgSelector);
    await page.close();
  });

  test("AUTH-SAN03 — Reload the browser tab after successful login", async ({ page }) => {
    const orgSelector = new OrgSelectorPage(page);
    await page.goto("/");
    await expect(orgSelector.heading).toBeVisible({ timeout: 25_000 });
    await page.reload();
    await expect(orgSelector.heading).toBeVisible({ timeout: 25_000 });
    // Should not ask for email/OTP after reload.
    await expect(page.locator("body")).not.toContainText(/verify your identity|enter the code/i);
  });

  test("AUTH-SAN04 — Inspect the resend option on the OTP step", async ({ browser }) => {
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    await login.goto();
    await login.submitEmail(email);
    await expect(login.otpHeading).toBeVisible({ timeout: 15_000 });
    await expect(login.resendButton).toBeVisible();
    await login.resendButton.click();
    // The page should still show the OTP step and a confirmation message.
    await expect(login.otpHeading).toBeVisible();
    await expect(login.otpSentMessage).toBeVisible();
    await page.close();
  });

  test("AUTH-REG01 — Reject a wrong OTP code", async ({ browser }) => {
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    await login.goto();
    await login.submitEmail(email);
    await expect(login.otpInput).toBeVisible({ timeout: 15_000 });
    await login.otpInput.fill("000000");
    await login.continueButton.click();
    await expect(login.otpError).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/passwordless-email-challenge/);
    await page.close();
  });

  test("AUTH-REG02 — Reject a stale OTP code, then log in with a fresh one", async ({
    browser,
  }) => {
    // Requesting a new code invalidates the previous one, which stands in for waiting
    // out the real expiry window.
    test.setTimeout(300_000);
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    const orgSelector = new OrgSelectorPage(page);

    await login.goto();
    await login.submitEmail(email);
    await expect(login.otpInput).toBeVisible({ timeout: 15_000 });

    const staleCode = await fetchCode();
    await login.resendButton.click();
    let freshCode = await fetchDifferentCode(staleCode);

    // The stale code must be rejected with a clear error, staying on the OTP step.
    await login.otpInput.fill(staleCode);
    await login.continueButton.click();
    await expect(login.otpError).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/passwordless-email-challenge/);

    // Requesting a fresh code allows login. The shared OTP inbox can race with other
    // login flows, so re-request the code and retry if a fetched code is rejected.
    let loggedIn = false;
    for (let attempt = 0; attempt < 3 && !loggedIn; attempt++) {
      if (attempt > 0) {
        await login.resendButton.click();
        freshCode = await fetchDifferentCode(freshCode);
      }
      await login.otpInput.fill(freshCode);
      await login.continueButton.click();
      loggedIn = await orgSelector.heading
        .waitFor({ state: "visible", timeout: 20_000 })
        .then(() => true)
        .catch(() => false);
    }
    await expect(orgSelector.heading).toBeVisible({ timeout: 30_000 });

    // Closing the anonymous context discards the session; no persistent state remains.
    await page.close();
  });

  test("AUTH-REG03 — Open a protected route while logged out", async ({ browser }) => {
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    await page.goto(routes.orgSelector);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/login|identifier/);
    await expect(login.heading.or(login.otpHeading)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Choose an organization to continue")).not.toBeVisible();
    await page.close();
  });

  test("AUTH-REG04 — Log out from the account menu", async ({ page, browser }) => {
    const orgSelector = new OrgSelectorPage(page);
    const login = new LoginPage(page);
    await page.goto("/");
    await expect(orgSelector.heading).toBeVisible({ timeout: 25_000 });

    await orgSelector.allOrganizationsButton.click();
    await page.getByText("Log out", { exact: true }).click();

    await expect(login.heading).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/login|identifier|auth\.beta\.devin\.ai/);

    // Going back should not restore protected content in a fresh anonymous context.
    const anon = await newAnonymousPage(browser);
    await anon.goto(routes.orgSelector);
    await expect(anon).toHaveURL(/\/login|identifier/);
    await anon.close();
  });

  test("AUTH-REG05 — No sensitive data leaks during email → OTP → success", async ({ browser }) => {
    const page = await newAnonymousPage(browser);
    const login = new LoginPage(page);
    const orgSelector = new OrgSelectorPage(page);

    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => consoleLogs.push(msg.text()));
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await login.goto();
    const startUrl = page.url();
    const startBody = await page.innerText("body");
    expect(containsSensitive(startUrl)).toBeUndefined();
    expect(containsSensitive(startBody)).toBeUndefined();

    await login.submitEmail(email);
    await expect(login.otpInput).toBeVisible({ timeout: 15_000 });
    const otpUrl = page.url();
    const otpBody = await page.innerText("body");
    expect(containsSensitive(otpUrl)).toBeUndefined();
    expect(containsSensitive(otpBody)).toBeUndefined();

    const code = await fetchCode();
    await login.otpInput.fill(code);
    await login.continueButton.click();
    await expect(orgSelector.heading).toBeVisible({ timeout: 30_000 });

    const endUrl = page.url();
    const endBody = await page.innerText("body");
    expect(containsSensitive(endUrl)).toBeUndefined();
    expect(containsSensitive(endBody)).toBeUndefined();

    const leakedInConsole = consoleLogs.find((m) => containsSensitive(m));
    const leakedInPageError = pageErrors.find((m) => containsSensitive(m));
    expect(leakedInConsole).toBeUndefined();
    expect(leakedInPageError).toBeUndefined();

    await page.close();
  });
});
