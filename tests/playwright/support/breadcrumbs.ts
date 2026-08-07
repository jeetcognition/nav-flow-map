import { Page, expect } from "@playwright/test";
import { routes } from "./paths";

/** Ordered, visible, non-separator crumbs inside the breadcrumb nav. */
const CRUMB_SELECTOR = "ol > li:not(:has(svg)):visible";

/** Breadcrumb navigation landmark for enterprise settings pages. */
export function breadcrumbNav(page: Page) {
  return page.getByRole("navigation", { name: "breadcrumb" });
}

export interface BreadcrumbExpectation {
  /** Expected crumb labels in order, e.g. ["Settings", "Enterprise", "Devin"]. */
  crumbs: string[];
  /** Crumb labels rendered as links; each is clicked and must land on the enterprise settings landing page. Defaults to all but the last crumb. */
  linkCrumbs?: string[];
  /** Whether the page renders a "Back to enterprise" button. Defaults to true. */
  backButton?: boolean;
}

/**
 * Verify the enterprise settings breadcrumb trail and Back-to-enterprise
 * navigation for a page: crumb order, last crumb rendered as plain text,
 * and each navigation control landing on the enterprise settings page.
 * `goto` must (re-)open the page under test.
 */
export async function expectEnterpriseBreadcrumbs(
  page: Page,
  goto: () => Promise<void>,
  { crumbs, linkCrumbs = crumbs.slice(0, -1), backButton = true }: BreadcrumbExpectation,
) {
  const crumbItems = breadcrumbNav(page).locator(CRUMB_SELECTOR);
  const enterpriseSettingsHeading = page.getByRole("heading", {
    name: "Enterprise Settings",
    level: 2,
  });

  await goto();
  await expect(breadcrumbNav(page)).toBeVisible();
  await expect
    .poll(async () => (await crumbItems.allTextContents()).map((label) => label.trim()))
    .toEqual(crumbs);
  await expect(crumbItems.last().locator("a")).toHaveCount(0);

  for (const name of linkCrumbs) {
    await crumbItems.getByText(name, { exact: true }).click();
    await expect(page).toHaveURL(routes.entSettings);
    await expect(enterpriseSettingsHeading).toBeVisible();
    await goto();
  }

  if (backButton) {
    await page.getByRole("button", { name: "Back to enterprise" }).first().click();
    await expect(page).toHaveURL(routes.entSettings);
    await expect(enterpriseSettingsHeading).toBeVisible();
  }
}
