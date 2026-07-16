import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

// The login page. Devin Enterprise here uses passwordless **email + OTP** login:
//   1. enter email  ->  2. app emails a one-time code  ->  3. enter the code  ->  done.
//
// We also keep a classic email/password path for envs that use it.
//
// NOTE: the form selectors are best-effort regex/role selectors. If a step can't find its
// control on the live login UI, tweak the matching locator below (these are the only lines
// that should need touching).
export class LoginPage extends BasePage {
  protected readonly path = '/';

  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  /** Button that advances each step (Continue / Next / Log in / Verify). */
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByRole('button', { name: /log in|sign in/i }).first();
    this.emailInput = page.getByLabel(/email/i).or(page.getByRole('textbox', { name: /email/i })).first();
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page
      .getByRole('button', { name: /continue|next|log in|sign in|verify|submit/i })
      .first();
  }

  /** OTP code field(s). Some UIs use one box; others use N single-digit boxes. */
  private otpInputs(): Locator {
    return this.page
      .getByLabel(/code|otp|one[- ]?time|verification/i)
      .or(this.page.getByRole('textbox', { name: /code|otp|one[- ]?time|verification/i }));
  }

  /** Fill the email field and submit to request a code. */
  async submitEmail(email: string) {
    // Some flows show a "Log in" landing button before the email field appears.
    await this.loginButton.click({ timeout: 2000 }).catch(() => {});
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  /**
   * Enter the OTP code and submit. Handles both a single input and split single-digit
   * inputs (focus the first box and type — most split widgets auto-advance / accept this).
   */
  async submitOtp(code: string) {
    const inputs = this.otpInputs();
    const count = await inputs.count().catch(() => 0);

    if (count <= 1) {
      const single = count === 1 ? inputs.first() : this.page.getByRole('textbox').first();
      await single.click();
      await single.fill(code);
    } else {
      await inputs.first().click();
      await this.page.keyboard.type(code, { delay: 30 });
    }

    // Some UIs auto-submit once all digits are entered; clicking is harmless if so.
    await this.submitButton.click().catch(() => {});
  }

  /** Full passwordless flow: email -> request code -> read code -> enter code. */
  async loginWithEmailOtp(email: string, getCode: () => Promise<string>) {
    await this.submitEmail(email);
    const code = await getCode();
    await this.submitOtp(code);
  }

  /** Classic email/password flow (only for envs that use it). */
  async loginWithCredentials(email: string, password: string) {
    await this.loginButton.click().catch(() => {});
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
