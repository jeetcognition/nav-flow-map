import { Locator, Page } from "@playwright/test";
import { SecretsPage } from "./s-secrets.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

/**
 * Enterprise Settings → Enterprise → Secrets page.
 *
 * The enterprise page renders the same secrets form as the sub-org page, so the
 * locators are inherited; only the route and the enterprise-only chrome differ.
 * Interactions inside the add dialog keep the inherited `force: true` usage —
 * the product leaves `aria-disabled="true"` on the form while it is interactive.
 */
export class EnterpriseSecretsPage extends SecretsPage {
  protected readonly path = routes.entSecrets();

  /** "Back to enterprise" button above the heading. */
  readonly backToEnterprise: Locator;
  /** Bulk-import paste textarea. */
  readonly importTextarea: Locator;
  /** Submission-preview table inside the bulk-import dialog. */
  readonly importPreview: Locator;
  /** "Store" submit button inside the bulk-import dialog. */
  readonly importStoreButton: Locator;

  constructor(page: Page) {
    super(page);
    this.backToEnterprise = page.getByRole("button", { name: "Back to enterprise" }).first();
    this.importTextarea = this.dialog.locator("textarea").first();
    this.importPreview = this.dialog.getByText("Submission preview");
    this.importStoreButton = this.dialog.getByRole("button", { name: "Store", exact: true });
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.entSecrets(slug));
    await this.heading.waitFor({ state: "visible" });
  }

  /** Open the bulk-import dialog and wait for its paste area. */
  async openImportDialog() {
    await this.bulkAddButton.click();
    await this.importTextarea.waitFor({ state: "visible" });
  }

  /** Close the open dialog via its Close button. */
  async closeDialog() {
    await this.dialogCloseButton.first().click({ force: true });
    await this.dialog.waitFor({ state: "hidden" });
  }
}
