import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Enterprise → General settings page (`/org/{tenant}/settings/general`).
export class GeneralSettingsPage extends BasePage {
  protected readonly path = routes.entGeneral;

  /** Glob for the enterprise settings save endpoint (PUT). */
  static readonly settingsApiGlob = "**/api/enterprise/*/settings";
  /** Matches the enterprise settings save endpoint URL. */
  static readonly settingsApiPattern = /\/api\/enterprise\/[^/]+\/settings$/;

  /** Page heading "General". */
  readonly heading: Locator;
  /** Breadcrumb navigation for the enterprise settings page. */
  readonly breadcrumbNav: Locator;
  /** Ordered, visible, non-separator breadcrumb crumbs. */
  readonly breadcrumbCrumbs: Locator;
  /** Last breadcrumb crumb, which is the current page label. */
  readonly lastBreadcrumbCrumb: Locator;
  /** Any link inside the last breadcrumb crumb. */
  readonly lastBreadcrumbLink: Locator;
  /** "Back to enterprise" button in the main panel. */
  readonly backToEnterprise: Locator;
  /** Authentication section heading. */
  readonly authenticationHeading: Locator;
  /** SSO requirement switch. */
  readonly ssoSwitch: Locator;
  /** SSO setting heading text. */
  readonly ssoHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = this.page.locator("main").getByRole("heading", { name: "General", level: 2 });
    this.breadcrumbNav = this.page.getByRole("navigation", { name: "breadcrumb" });
    this.breadcrumbCrumbs = this.breadcrumbNav.locator("ol > li:not(:has(svg)):visible");
    this.lastBreadcrumbCrumb = this.breadcrumbCrumbs.last();
    this.lastBreadcrumbLink = this.lastBreadcrumbCrumb.locator("a");
    this.backToEnterprise = this.page.getByRole("button", { name: "Back to enterprise" }).first();
    this.authenticationHeading = this.page
      .locator("main")
      .getByRole("heading", { name: "Authentication", level: 3 });
    this.ssoHeading = this.page.getByRole("heading", {
      name: "Require SSO for member access",
      level: 4,
    });
    this.ssoSwitch = this.page.getByRole("switch").first();
  }

  /** Return the breadcrumb crumb with the given visible name. */
  breadcrumbCrumb(name: string): Locator {
    return this.breadcrumbCrumbs.getByText(name, { exact: true });
  }

  /** Return the ordered visible breadcrumb labels. */
  async breadcrumbLabels(): Promise<string[]> {
    return (await this.breadcrumbCrumbs.allTextContents()).map((label) => label.trim());
  }

  /** Current aria-checked state of the SSO switch. */
  async ssoSwitchState(): Promise<"true" | "false"> {
    const value = await this.ssoSwitch.getAttribute("aria-checked");
    return value === "true" ? "true" : "false";
  }

  async goto() {
    await super.goto();
    await this.heading.waitFor({ state: "visible", timeout: 20_000 });
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 10_000 });
    } catch {
      // Network idle may already be reached.
    }
  }

  /** Wait for the next settings save (PUT) response. */
  waitForSaveResponse(timeout = 15_000) {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        GeneralSettingsPage.settingsApiPattern.test(new URL(res.url()).pathname),
      { timeout },
    );
  }

  /** Click "Back to enterprise" to return to the enterprise settings landing page. */
  async clickBackToEnterprise() {
    await this.backToEnterprise.click();
  }
}
