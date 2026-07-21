import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

export class InfraSettingsPage extends BasePage {
  protected readonly path = routes.infrastructure();

  readonly heading: Locator;
  readonly description: Locator;
  readonly noVpcNotice: Locator;
  readonly emptyGuidance: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { name: "Infrastructure", exact: true, level: 2 });
    this.description = page.getByText("Monitor hypervisor health and capacity");
    this.noVpcNotice = page.getByText("No VPC data available");
    this.emptyGuidance = page.getByText("No tenants or hypervisors are currently configured.");
    this.refreshButton = page.getByRole("button", { name: "Refresh" }).first();
  }

  async clickRefresh() {
    await this.refreshButton.click();
  }

  async expectHealthyEmptyState() {
    await expect(this.heading).toBeVisible();
    await expect(this.description).toBeVisible();
    await expect(this.refreshButton).toBeVisible();
    // The QA tenant has no infrastructure configured, so the empty state is the default.
    await expect(this.noVpcNotice).toBeVisible();
    await expect(this.emptyGuidance).toBeVisible();
  }
}
