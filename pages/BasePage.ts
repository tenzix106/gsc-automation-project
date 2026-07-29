import { Page } from '@playwright/test';

/**
 * BasePage holds behavior shared across all Page Objects:
 * navigation, generic waits, and defensive helpers for GSC's UI quirks
 * (e.g. sticky action bars that are only rendered at desktop breakpoints,
 * and promo modals that can appear unpredictably after navigation).
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/'): Promise<void> {
    try {
      await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    } catch (error) {
      throw new Error(`BasePage.goto failed for path "${path}": ${(error as Error).message}`);
    }
  }

  currentUrl(): string {
    return this.page.url();
  }

  /**
   * Dismisses a promo/onboarding modal if one appears (e.g. "Start Your Reward
   * Journey" after login, or the GSCoins redemption dialog on booking summary).
   * Safe no-op if no dialog is present within the short timeout.
   */
  async dismissModalIfPresent(buttonText: RegExp | string, timeoutMs = 3_000): Promise<void> {
    try {
      const dismissButton = this.page.getByRole('button', { name: buttonText }).first();
      await dismissButton.waitFor({ state: 'visible', timeout: timeoutMs });
      await dismissButton.click();
    } catch {
      // No modal appeared — this is expected on most runs, so we swallow the timeout.
    }
  }
}
