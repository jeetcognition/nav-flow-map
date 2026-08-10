import { Page, Locator, expect } from "@playwright/test";

/**
 * Collect console errors and uncaught page errors, skipping any that match
 * an `ignore` pattern (for known benign third-party failures).
 */
export function watchPageErrors(page: Page, ignore: RegExp[] = []): string[] {
  const errors: string[] = [];
  const push = (text: string) => {
    if (!ignore.some((pattern) => pattern.test(text))) errors.push(text);
  };
  page.on("console", (msg) => {
    if (msg.type() === "error") push(msg.text());
  });
  page.on("pageerror", (err) => push(err.message));
  return errors;
}

/** Visible error-boundary indicators rendered instead of page content. */
export function errorBoundaryIndicators(page: Page): Locator {
  return page.getByText(/something went wrong|error boundary/i);
}

/**
 * Verify a page loads without console/JS errors or error boundaries.
 * `goto` opens the page; `ready` (optional) is awaited visible before
 * checking, and `ignore` filters known benign errors.
 */
export async function expectNoPageErrors(
  page: Page,
  goto: () => Promise<void>,
  options: { ready?: Locator; ignore?: RegExp[]; settle?: () => Promise<void> } = {},
) {
  const errors = watchPageErrors(page, options.ignore ?? []);
  await goto();
  if (options.ready) await expect(options.ready).toBeVisible();
  if (options.settle) await options.settle();
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await expect(errorBoundaryIndicators(page)).toHaveCount(0);
  expect(errors).toEqual([]);
}
