import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class GroupsIdpPage extends BasePage {
  protected readonly path = routes.membership(ENTERPRISE_SLUG, "groups");

  /** Main page heading. */
  readonly heading: Locator;
  /** Groups (IdP) tab. */
  readonly groupsTab: Locator;
  /** "No groups found" empty-state heading. */
  readonly noGroupsHeading: Locator;
  /** IdP SSO setup guidance text. */
  readonly idpSetupGuidance: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Membership", exact: true });
    this.groupsTab = page.getByRole("tab", { name: /Groups \(IdP\)/ });
    this.noGroupsHeading = page.getByRole("heading", { name: "No groups found", exact: true });
    this.idpSetupGuidance = page.getByText(
      "Groups can be created by setting up SSO with an IdP provider.",
    );
  }
}
