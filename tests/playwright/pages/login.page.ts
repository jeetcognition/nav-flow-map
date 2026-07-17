import { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page";
import { routes } from "../support/paths";

// Login page for the Devin Enterprise web app.
//
// NOTE: Selectors are best-effort, accessible locators. If the live login UI changes,
// update the matching locator below (these are the only lines that should need touching).
export class LoginPage extends BasePage {
  protected readonly path = routes.login;

  readonly logo: Locator;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly continueButton: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.locator("#prompt-logo-center");
    this.heading = page.getByRole("heading", { name: "Welcome" });
    this.emailInput = page
      .getByLabel(/work email/i)
      .or(page.getByRole("textbox", { name: /work email/i }))
      .first();
    this.continueButton = page.getByRole("button", { name: "Continue", exact: true });
    this.loginButton = page.getByRole("button", { name: /log in|sign in/i }).first();
  }

  /** Fill the email field and submit to request a code. */
  async submitEmail(email: string) {
    // Some flows show a "Log in" landing button before the email field appears.
    await this.loginButton.click({ timeout: 2000 }).catch(() => {});
    await this.emailInput.fill(email);
    await this.continueButton.click();
  }

  /** Enter the OTP code and submit. Handles a single input or split single-digit inputs. */
  async submitOtp(code: string) {
    const inputs = this.page
      .getByLabel(/code|otp|one[- ]?time|verification/i)
      .or(this.page.getByRole("textbox", { name: /code|otp|one[- ]?time|verification/i }));
    const count = await inputs.count().catch(() => 0);

    if (count <= 1) {
      const single = count === 1 ? inputs.first() : this.page.getByRole("textbox").first();
      await single.click();
      await single.fill(code);
    } else {
      await inputs.first().click();
      await this.page.keyboard.type(code, { delay: 30 });
    }

    // Auto-submit once all digits are entered; clicking is harmless if already submitted.
    await this.continueButton.click().catch(() => {});
  }

  /** Full passwordless flow: email -> request code -> read code -> enter code. */
  async loginWithEmailOtp(email: string, getCode: () => Promise<string>) {
    await this.submitEmail(email);
    const code = await getCode();
    await this.submitOtp(code);
  }
}
