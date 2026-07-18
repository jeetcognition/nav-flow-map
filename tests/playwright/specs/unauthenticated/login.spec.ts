import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages";

// LOGIN node specs — catalog-driven Playwright tests for the Login page.
// Catalog: catalog/pages/login.json
// Specs: tests/playwright/specs/unauthenticated/login.spec.ts

if (!process.env.BASE_URL) {
  test.skip("BASE_URL is not set; skipping the catalog-driven login page specs");
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

test("LOGIN-SAN01 — Load the Login page", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await expect(login.logo).toBeVisible();
  await expect(login.heading).toBeVisible();
  await expect(login.emailInput).toBeVisible();
  await expect(login.continueButton).toBeVisible();
});

test("LOGIN-SAN02 — Inspect the available login methods", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await expect(login.emailInput).toBeVisible();
  await expect(login.githubButton).toBeVisible();
  await expect(login.googleButton).toBeVisible();
});

test("LOGIN-SAN03 — Inspect the account registration prompt", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await expect(login.signUpPrompt).toBeVisible();
  await expect(login.signUpLink).toBeVisible();
});

test("LOGIN-REG01 — Click the Sign up link", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();

  await login.signUpLink.click();

  await expect(page).toHaveURL(/\/signup\//, { timeout: 15_000 });
  await expect(page.getByText(/already have an account\?/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
});

const INVALID_EMAILS = ["abc", "a@", "   "];
for (const value of INVALID_EMAILS) {
  test(`LOGIN-REG02 — Reject invalid email '${value}'`, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.submitEmail(value);

    await expect(login.errorMessage).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login\//);
  });
}

test("LOGIN-REG03 — No sensitive data leaks in URL, UI, or console", async ({ page }) => {
  const login = new LoginPage(page);
  const consoleLogs: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (msg) => consoleLogs.push(msg.text()));
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await login.goto();

  // Initial login page state
  const initialUrl = page.url();
  const initialBody = await page.innerText("body");
  expect(containsSensitive(initialUrl)).toBeUndefined();
  expect(containsSensitive(initialBody)).toBeUndefined();

  // After submitting an invalid email
  await login.submitEmail("not-an-email");
  await expect(login.errorMessage).toBeVisible({ timeout: 10_000 });

  const postUrl = page.url();
  const postBody = await page.innerText("body");
  expect(containsSensitive(postUrl)).toBeUndefined();
  expect(containsSensitive(postBody)).toBeUndefined();

  // Console and JS errors
  const leakedInConsole = consoleLogs.find((m) => containsSensitive(m));
  const leakedInPageError = pageErrors.find((m) => containsSensitive(m));
  expect(leakedInConsole).toBeUndefined();
  expect(leakedInPageError).toBeUndefined();
});
