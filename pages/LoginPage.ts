import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the GSC Login page (https://epaymentwebapp.gsc.com.my/login).
 * Confirmed selectors via live DOM inspection: mobile number input resolves
 * to `#phoneNo`, password input resolves to `#password`.
 */
export class LoginPage extends BasePage {
  private readonly phoneNumberInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.phoneNumberInput = page.locator('#phoneNo');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    this.errorMessage = page.getByText(/invalid|incorrect|failed/i);
  }

  async open(): Promise<void> {
    await this.goto('/login');
  }

  /**
   * Logs in with a phone number + password. Country code defaults to the
   * pre-selected "+60" combobox and is not changed here.
   */
  async login(phoneNumber: string, password: string): Promise<void> {
    try {
      await this.phoneNumberInput.waitFor({ state: 'visible' });
      await this.phoneNumberInput.fill(phoneNumber);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
      // Wait for successful navigation to the profile page; if it doesn't
      // occur within a reasonable timeout, surface any on-page error message
      // to aid debugging rather than letting the test time out silently.
      // Wait for either: successful navigation to `/profile`, the
      // reward-journey modal appearing (which will be dismissed by the
      // profile fixture), or an on-page error message. Use a short
      // timeout so failed logins surface quickly.
      const outcome = await Promise.race([
        this.page.waitForURL(/\/profile$/, { timeout: 10000 }).then(() => 'profile').catch(() => null),
        this.page.getByRole('button', { name: /I Got It/ }).waitFor({ state: 'visible', timeout: 10000 }).then(() => 'modal').catch(() => null),
        this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }).then(() => 'error').catch(() => null),
      ]);

      if (!outcome) {
        const msg = await this.getErrorMessage().catch(() => null);
        throw new Error(`Login did not navigate to /profile and no modal appeared. Page error: ${msg ?? 'none'}`);
      }
    } catch (error) {
      throw new Error(`LoginPage.login failed for phone "${phoneNumber}": ${(error as Error).message}`);
    }
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      if (await this.errorMessage.isVisible()) {
        return await this.errorMessage.textContent();
      }
      return null;
    } catch (error) {
      throw new Error(`LoginPage.getErrorMessage failed: ${(error as Error).message}`);
    }
  }
}
