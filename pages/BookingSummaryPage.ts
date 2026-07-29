import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Booking Summary page
 * (https://epaymentwebapp.gsc.com.my/review-summary).
 *
 * Live-DOM findings:
 * - This page renders the full order recap (movie, cinema, seat, time,
 *   ticket line item, food selection lines, total) plus a "Checkout & Pay"
 *   button with a live countdown ("Time Left: mm:ss") for the seat hold.
 * - A GSCoins rewards-redemption dialog can appear automatically on load;
 *   it has its own close ("X") button and must be dismissed before the
 *   summary panel underneath is reliably interactable.
 * - NOTE: in this suite's exploratory run, no separate merchandise/upselling
 *   step appeared between the e-Combo page and this summary — the app
 *   navigated directly from e-Combo to /review-summary. Treat any
 *   merchandise/upsell step as conditional (see UpsellingPage) rather than
 *   guaranteed, and don't fail the suite if it's skipped.
 */
export class BookingSummaryPage extends BasePage {
  readonly movieTitle: Locator;
  readonly seatValue: Locator;
  readonly totalValue: Locator;
  readonly checkoutButton: Locator;
  private readonly rewardsDialogCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.movieTitle = page.getByRole('heading').first();
    this.seatValue = page
      .getByText('Seat(s)', { exact: true })
      .locator('xpath=following-sibling::*[1]');
    this.totalValue = page
      .getByText('Total', { exact: true })
      .locator('xpath=following-sibling::*[1]');
    this.checkoutButton = page.getByRole('button', { name: /Checkout & Pay/i });
    this.rewardsDialogCloseButton = page.getByRole('button', { name: 'close button' });
  }

  /** Dismisses the GSCoins rewards dialog if it auto-opened on page load. */
  async dismissRewardsDialogIfPresent(): Promise<void> {
    try {
      await this.rewardsDialogCloseButton.waitFor({ state: 'visible', timeout: 3_000 });
      await this.rewardsDialogCloseButton.click();
    } catch {
      // No dialog appeared — nothing to dismiss.
    }
  }

  async getTotal(): Promise<string> {
    try {
      return (await this.totalValue.textContent())?.trim() ?? '';
    } catch (error) {
      throw new Error(`BookingSummaryPage.getTotal failed: ${(error as Error).message}`);
    }
  }

  async isCheckoutButtonVisible(): Promise<boolean> {
    try {
      return await this.checkoutButton.isVisible();
    } catch (error) {
      throw new Error(`BookingSummaryPage.isCheckoutButtonVisible failed: ${(error as Error).message}`);
    }
  }
}
