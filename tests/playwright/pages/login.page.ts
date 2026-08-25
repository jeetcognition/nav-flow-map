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
  readonly logInButton: Locator;
  readonly continueButton: Locator;
  readonly ssoButton: Locator;
  readonly githubButton: Locator;
  readonly googleButton: Locator;
  readonly signUpLink: Locator;
  readonly signUpPrompt: Locator;
  readonly backButton: Locator;

  // OTP step locators
  readonly otpHeading: Locator;
  readonly otpInput: Locator;
  readonly otpSentMessage: Locator;
  readonly resendButton: Locator;
  readonly otpError: Locator;

  constructor(page: Page) {
    super(page);
    this.logo = page.getByRole("img", { name: /devin logo/i });
    this.heading = page.getByRole("heading", { name: /welcome/i });
    this.emailInput = page
      .getByLabel(/email address/i)
      .or(page.getByRole("textbox", { name: /email/i }))
      .first();
    /** Submits the email step and requests a one-time code. */
    this.logInButton = page.getByRole("button", { name: "Log in", exact: true });
    /** Submits the one-time code on the verification step. */
    this.continueButton = page.getByRole("button", { name: "Continue", exact: true });
    this.ssoButton = page.getByRole("button", { name: /log in with sso/i });
    this.githubButton = page.getByRole("button", { name: /continue with github/i });
    this.googleButton = page.getByRole("button", { name: /continue with google/i });
    this.signUpLink = page.getByRole("link", { name: /sign up/i }).first();
    this.signUpPrompt = page.getByText(/don't have an account\?/i);
    this.backButton = page.getByRole("button", { name: "Back", exact: true });

    this.otpHeading = page.getByRole("heading", { name: /verify your identity/i });
    this.otpInput = page
      .getByLabel(/code/i)
      .or(page.getByRole("textbox", { name: /code/i }))
      .first();
    this.otpSentMessage = page.getByText(/sent an email with your code to/i);
    this.resendButton = page.getByRole("button", { name: /resend/i });
    this.otpError = page.getByText(/wrong|invalid|incorrect|expired/i).first();
  }

  /** Fill the email field and submit to request a code. */
  async submitEmail(email: string) {
    await this.emailInput.fill(email);
    await this.logInButton.click();
  }

  /**
   * Browser-native validation state of the email field: the email step uses an
   * `input[type=email]` whose constraint validation blocks submission and surfaces the
   * rejection message, so invalid input never reaches the server.
   */
  async emailRejection(): Promise<{ valid: boolean; message: string }> {
    return this.emailInput.evaluate((element) => {
      const input = element as HTMLInputElement;
      return { valid: input.checkValidity(), message: input.validationMessage };
    });
  }

  /**
   * Ask for a new one-time code from the verification step. The step has no resend control,
   * so the flow is Back → re-submit the email, which invalidates the previous code.
   */
  async requestNewCode(email: string) {
    await this.backButton.click();
    await this.submitEmail(email);
    await this.otpInput.waitFor({ state: "visible" });
  }

  /** Enter the OTP code. The segmented code field submits itself on the last digit. */
  async submitOtp(code: string) {
    await this.otpInput.click();
    await this.page.keyboard.type(code, { delay: 30 });
    // The field auto-submits once the last digit lands, which disables Continue; clicking
    // it is only needed when the flow waits for an explicit submit.
    await this.continueButton.click({ timeout: 2_000 }).catch(() => {});
  }

  /** Full passwordless flow: email -> request code -> read code -> enter code. */
  async loginWithEmailOtp(email: string, getCode: () => Promise<string>) {
    await this.submitEmail(email);
    const code = await getCode();
    await this.submitOtp(code);
  }
}
