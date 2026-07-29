import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the (conditional) merchandise/upselling step that can
 * appear between the e-Combo page and the Booking Summary page.
 *
 * IMPORTANT: during exploratory testing of the happy path, GSC navigated
 * directly from /aurum-e-combo to /review-summary — no merchandise page was
 * shown for the movie/cinema/seat-type combination used. This suggests the
 * step is conditional (e.g. only shown for certain promotions, cinemas, or
 * ticket types). This class is intentionally defensive: callers should use
 * `isDisplayed()` to detect whether the step occurred at all before
 * interacting with it, and the spec treats it as optional rather than a
 * hard requirement of the happy path.
 */
export class UpsellingPage extends BasePage {
  private readonly merchandiseHeading: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    // Selector is a best-effort placeholder based on naming conventions used
    // elsewhere in the app (e.g. "Please choose..." headers on e-Combo).
    // Re-verify and tighten this against the live DOM once a promotion that
    // actually triggers this step is identified.
    this.merchandiseHeading = page.getByRole('heading', { name: /merchandise/i });
    this.continueButton = page.getByRole('button', { name: /confirm|continue|checkout/i });
  }

  /** Detects whether the upselling step is present for this booking session. */
  async isDisplayed(timeoutMs = 3_000): Promise<boolean> {
    try {
      await this.merchandiseHeading.waitFor({ state: 'visible', timeout: timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects a merchandise item by (partial) name, if present, then proceeds.
   * No-ops without throwing if the step isn't displayed, keeping the
   * happy-path spec resilient to this page being conditionally skipped.
   */
  async selectMerchandiseIfAvailable(itemName?: string): Promise<boolean> {
    const displayed = await this.isDisplayed();
    if (!displayed) {
      return false;
    }
    try {
      if (itemName) {
        await this.page.getByText(itemName, { exact: false }).first().click();
      }
      await this.continueButton.click();
      return true;
    } catch (error) {
      throw new Error(`UpsellingPage.selectMerchandiseIfAvailable failed: ${(error as Error).message}`);
    }
  }
}
