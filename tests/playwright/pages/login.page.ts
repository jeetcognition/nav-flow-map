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
  readonly githubButton: Locator;
  readonly googleButton: Locator;
  readonly signUpLink: Locator;
  readonly signUpPrompt: Locator;

  // OTP step locators
  readonly otpHeading: Locator;
  readonly otpInput: Locator;
  readonly otpSentMessage: Locator;
  readonly backButton: Locator;
  readonly otpError: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.getByRole("img", { name: /devin logo/i }).first();
    this.heading = page.getByRole("heading", { name: "Welcome" });
    this.emailInput = page
      .getByLabel(/email address/i)
      .or(page.getByRole("textbox", { name: /email address/i }))
      .first();
    this.continueButton = page.getByRole("button", { name: "Continue", exact: true });
    this.loginButton = page.getByRole("button", { name: "Log in", exact: true });
    this.githubButton = page.getByRole("button", { name: /continue with github/i });
    this.googleButton = page.getByRole("button", { name: /continue with google/i });
    this.signUpLink = page.getByRole("link", { name: /sign up/i }).first();
    this.signUpPrompt = page.getByText(/don't have an account\?/i);

    this.otpHeading = page.getByRole("heading", { name: /verify your identity/i });
    this.otpInput = page
      .getByLabel(/code/i)
      .or(page.getByRole("textbox", { name: /code/i }))
      .first();
    this.otpSentMessage = page.getByText(/sent an email with your code/i);
    this.backButton = page.getByRole("button", { name: "Back", exact: true });
    this.otpError = page.getByText(/wrong|invalid|incorrect|expired/i).first();
  }

  /** Fill the email field and submit to request a code. */
  async submitEmail(email: string) {
    await this.emailInput.fill(email);
    await this.loginButton.click();
  }

  /** Request a fresh code from the OTP step: go Back and resubmit the email. */
  async requestNewCode(email: string) {
    await this.backButton.click();
    await this.emailInput.waitFor({ state: "visible" });
    await this.submitEmail(email);
    await this.otpHeading.waitFor({ state: "visible", timeout: 15_000 });
  }

  /** Native HTML5 validation message on the email field (empty string when valid). */
  async emailValidationMessage(): Promise<string> {
    return this.emailInput.evaluate((el) => (el as HTMLInputElement).validationMessage);
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

    // The form auto-submits once all digits are entered and unmounts the button,
    // so only attempt the click briefly for flows that still require it.
    await this.continueButton.click({ timeout: 5_000 }).catch(() => {});
  }

  /** Full passwordless flow: email -> request code -> read code -> enter code. */
  async loginWithEmailOtp(email: string, getCode: () => Promise<string>) {
    await this.submitEmail(email);
    const code = await getCode();
    await this.submitOtp(code);
  }
}
