import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Seat Selection page
 * (https://epaymentwebapp.gsc.com.my/seat-selection).
 *
 * Live-DOM findings:
 * - Seats are rendered as <img> elements with a descriptive alt attribute:
 *   "recliner", "twin sofa", or "occupied" (occupied seats are not selectable).
 * - Each row is grouped with a leading/trailing row-letter label (A-E observed).
 * - A sticky bottom bar shows the running total and a
 *   "Confirm - N ticket(s)" call-to-action once at least one seat is picked.
 */
export class SeatSelectionPage extends BasePage {
  private readonly availableSeatIcons: Locator;
  private readonly confirmButton: Locator;
  private readonly selectedSeatLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.availableSeatIcons = page
      .getByRole('img', { name: /^(recliner|twin sofa)$/ });
    this.confirmButton = page.getByText(/^Confirm - \d+ ticket\(s\)$/);
    this.selectedSeatLabel = page.getByText(/^[A-Z]\d{2}$/).first();
  }

  /**
   * Selects the first available (non-occupied) seat. Returns the seat code
   * (e.g. "D03") read back from the booking bar for downstream assertions.
   */
  async selectFirstAvailableSeat(): Promise<string> {
    try {
      const seatCount = await this.availableSeatIcons.count();
      if (seatCount === 0) {
        throw new Error('No available (non-occupied) seats found on the seat map.');
      }
      await this.availableSeatIcons.first().click();
      await this.confirmButton.waitFor({ state: 'visible' });
      return (await this.selectedSeatLabel.textContent())?.trim() ?? '';
    } catch (error) {
      throw new Error(`SeatSelectionPage.selectFirstAvailableSeat failed: ${(error as Error).message}`);
    }
  }

  async confirmSeatSelection(): Promise<void> {
    try {
      await this.confirmButton.click();
    } catch (error) {
      throw new Error(`SeatSelectionPage.confirmSeatSelection failed: ${(error as Error).message}`);
    }
  }
}
