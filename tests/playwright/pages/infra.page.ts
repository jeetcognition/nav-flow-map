import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes, ENTERPRISE_SLUG } from "../support/paths";

export class InfraPage extends BasePage {
  protected readonly path = routes.infrastructure();

  readonly heading = this.page.getByRole("heading", { name: "Infrastructure", exact: true });
  readonly subheading = this.page.getByText("Monitor hypervisor health and capacity");
  readonly refreshButton = this.page.getByRole("button", { name: "Refresh", exact: true });
  readonly noVpcData = this.page.getByText("No VPC data available", { exact: true });
  readonly noTenants = this.page.getByText("No tenants or hypervisors are currently configured.", {
    exact: true,
  });
  readonly backToEnterprise = this.page.getByRole("button", { name: "Back to enterprise" });

  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string = ENTERPRISE_SLUG) {
    await this.page.goto(routes.infrastructure(slug));
  }

  refreshButtons(): Locator {
    return this.refreshButton;
  }

  /**
   * Navigates to the infrastructure page and captures the VPC health request the app
   * issues, returning its URL and headers so specs can replay it with tampered IDs.
   */
  async gotoAndCaptureVpcRequest(
    slug: string = ENTERPRISE_SLUG,
  ): Promise<{ url: string; headers: Record<string, string>; status: number }> {
    const requestPromise = this.page.waitForRequest((request) =>
      /\/api\/enterprise\/[^/]+\/vpc/.test(request.url()),
    );
    await this.page.goto(routes.infrastructure(slug));
    const request = await requestPromise;
    const response = await request.response();
    return {
      url: request.url(),
      headers: await request.allHeaders(),
      status: response?.status() ?? 0,
    };
  }
}
