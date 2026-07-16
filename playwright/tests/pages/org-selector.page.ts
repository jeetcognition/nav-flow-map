import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
// The enterprise landing / org-selector page ("Choose an organization to continue").
// This is the post-login landing AND the org-switcher entry point for ENT-002 / ENT-003.
//
// Navigation note: the app is a pure client-side SPA. Deep links like /org/*/org-selector
// 404 when opened directly — the server only serves the shell at '/'. We always start at
// '/' and let the SPA handle routing; if it remembers a sub-org, the sidebar enterprise
// avatar brings us back to the enterprise landing.
export class OrgSelectorPage extends BasePage {
  /** Heading text that confirms we're authenticated and on the landing page. */
  readonly heading: Locator;
  /** Breadcrumb button on the enterprise landing (reads "All organizations"). */
  readonly allOrganizationsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText('Choose an organization to continue');
    this.allOrganizationsButton = page.getByRole('button', { name: 'All organizations' });
  }

  async goto() {
    await this.page.goto('/');
    // waitFor actively retries until the heading is visible (isVisible is a point-in-time check
    // and returns false immediately if the SPA hasn't rendered yet).
    const onOrgSelector = await this.heading
      .waitFor({ state: 'visible', timeout: 25_000 })
      .then(() => true)
      .catch(() => false);
    if (onOrgSelector) return;
    // Fallback: app redirected to a remembered sub-org.
    // Click the "Cog Enterprise QA" breadcrumb button, then select it in the dropdown.
    await this.page.getByRole('button', { name: /Cog Enterprise QA/i }).first().click();
    await this.page.getByRole('menuitem', { name: /Cog Enterprise QA/i }).click();
    await this.heading.waitFor({ state: 'visible', timeout: 20_000 });
  }

  /** An org/sub-org card on the landing grid, matched by name. */
  orgCard(name: string): Locator {
    return this.page.getByText(new RegExp(name, 'i')).first();
  }

  /** Click into a sub-org from the landing page. */
  async openOrg(name: string) {
    await this.orgCard(name).click();
  }
}
