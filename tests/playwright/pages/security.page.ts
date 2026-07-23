import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Sub-org Security (Code scan) page: /org/<suborg>/code-scan.
// Direct deep links to /code-scan redirect back to the sub-org home, so tests
// must land on the sub-org first and click the "Security" sidebar link.
export class SecurityPage extends BasePage {
  protected readonly path = routes.subOrg();

  /** Security link in the sub-org sidebar. */
  readonly sidebarSecurityLink: Locator;
  /** Main content area of the Security page. */
  readonly content: Locator;
  /** "Security" page heading. */
  readonly heading: Locator;
  /** Scans tab link. */
  readonly scansTab: Locator;
  /** Profiles tab link. */
  readonly profilesTab: Locator;
  /** Automations tab link. */
  readonly automationsTab: Locator;
  /** "Start scan" button on the Scans tab. */
  readonly startScanButton: Locator;

  // --- New Scan dialog ---
  readonly newScanDialog: Locator;
  readonly repoCombobox: Locator;
  readonly scanProfileCombobox: Locator;
  readonly autoScanCombobox: Locator;
  readonly interactiveModeSwitch: Locator;
  readonly runScanButton: Locator;

  // --- Profiles tab ---
  readonly createProfileButton: Locator;
  readonly createManuallyLink: Locator;
  readonly profileNameInput: Locator;
  readonly profileDescriptionInput: Locator;
  readonly submitCreateProfileButton: Locator;

  constructor(page: Page) {
    super(page);
    this.sidebarSecurityLink = page.getByTestId("sidebar").getByRole("link", { name: "Security" });
    this.content = page.getByTestId("content");
    this.heading = page.getByRole("heading", { name: "Security", exact: true });
    this.scansTab = this.content.getByRole("link", { name: /^Scans/ });
    this.profilesTab = this.content.getByRole("link", { name: /^Profiles/ });
    this.automationsTab = this.content.getByRole("link", { name: /^Automations/ });
    this.startScanButton = this.content.getByRole("button", { name: "Start scan" });

    this.newScanDialog = page.getByRole("dialog").filter({ hasText: "New Scan" });
    this.repoCombobox = this.newScanDialog
      .getByRole("combobox")
      .filter({ hasText: "Select repository" });
    this.scanProfileCombobox = this.newScanDialog
      .getByRole("combobox")
      .filter({ hasText: /profile/i });
    this.autoScanCombobox = this.newScanDialog
      .getByRole("combobox")
      .filter({ hasText: /repeat|Every|Custom/ });
    this.interactiveModeSwitch = this.newScanDialog.getByRole("switch", {
      name: /interactive mode/i,
    });
    this.runScanButton = this.newScanDialog.getByRole("button", { name: "Run Scan" });

    this.createProfileButton = this.content.getByRole("button", { name: "Create profile" });
    this.createManuallyLink = page.getByRole("link", { name: /Create manually/ });
    this.profileNameInput = page.getByPlaceholder("Profile name");
    this.profileDescriptionInput = page.getByPlaceholder(/Describe what this profile scans for/);
    this.submitCreateProfileButton = page.getByRole("button", { name: "Create profile" });
  }

  /** Navigate: sub-org home → sidebar Security link → wait for the page heading. */
  async gotoViaSidebar() {
    await super.goto();
    await this.sidebarSecurityLink.waitFor({ state: "visible" });
    await this.sidebarSecurityLink.click();
    await this.heading.waitFor({ state: "visible" });
  }

  /** Open the New Scan dialog from the Scans tab. */
  async openStartScanDialog() {
    await this.startScanButton.click();
    await this.newScanDialog.waitFor({ state: "visible" });
  }

  /** Row link for a profile in the Profiles tab list. */
  profileRow(name: string): Locator {
    return this.content.getByRole("link", { name, exact: true });
  }

  /** The "Profile actions" menu button belonging to a given profile row. */
  profileActionsButton(name: string): Locator {
    return this.profileRow(name).locator(
      "xpath=following::button[@aria-label='Profile actions'][1]",
    );
  }

  /** Open the Profile actions menu for a profile. The row overlay link forces `force: true`. */
  async openProfileActions(name: string) {
    await this.profileActionsButton(name).click({ force: true });
    await this.page.getByRole("menu", { name: "Profile actions" }).waitFor({ state: "visible" });
  }
}
