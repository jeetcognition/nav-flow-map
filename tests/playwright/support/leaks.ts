import { expect } from "@playwright/test";

export const SENSITIVE_PATTERNS = [
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

export function containsSensitive(text: string): string | undefined {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) return `matched ${pattern}`;
  }
  return undefined;
}

export async function assertNoLeaks(
  page: any,
  consoleLogs: string[],
  pageErrors: string[],
): Promise<void> {
  const url = page.url();
  const body = await page.innerText("body");
  expect(containsSensitive(url)).toBeUndefined();
  expect(containsSensitive(body)).toBeUndefined();
  const leakedInConsole = consoleLogs.find((m) => containsSensitive(m));
  const leakedInPageError = pageErrors.find((m) => containsSensitive(m));
  expect(leakedInConsole).toBeUndefined();
  expect(leakedInPageError).toBeUndefined();
}
