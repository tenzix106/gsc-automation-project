import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the post-login Profile/landing page
 * (https://epaymentwebapp.gsc.com.my/profile).
 */
export class ProfilePage extends BasePage {
  readonly memberName: Locator;
  private readonly showtimeByMoviesTab: Locator;
  private readonly showtimeByCinemasTab: Locator;
  private readonly hallBookingTab: Locator;
  private readonly fnbTab: Locator;
  private readonly fasTicketTab: Locator;
  private readonly rewardJourneyDismissButton: RegExp;

  constructor(page: Page) {
    super(page);
    // Scoped relative to the "Silver" tier badge that sits beside the member's name.
    this.memberName = page.locator('text=Silver').locator('xpath=../..').getByText(/.+/).first();
    this.showtimeByMoviesTab = page.getByRole('button', { name: 'Showtime by Movies' });
    this.showtimeByCinemasTab = page.getByRole('button', { name: 'Showtime by Cinemas' });
    this.hallBookingTab = page.getByRole('button', { name: 'Hall Booking' });
    this.fnbTab = page.getByRole('button', { name: 'F&B' });
    this.fasTicketTab = page.getByRole('button', { name: 'FasTicket' });
    this.rewardJourneyDismissButton = /I Got It/;
  }

  /**
   * The "Start Your Reward Journey" onboarding modal appears on some (not all)
   * fresh logins. Dismiss it defensively before interacting with the page.
   */
  async dismissRewardJourneyModalIfPresent(): Promise<void> {
    await this.dismissModalIfPresent(this.rewardJourneyDismissButton);
  }

  async goToShowtimeByMovies(): Promise<void> {
    try {
      await this.showtimeByMoviesTab.click();
    } catch (error) {
      throw new Error(`ProfilePage.goToShowtimeByMovies failed: ${(error as Error).message}`);
    }
  }

  async goToShowtimeByCinemas(): Promise<void> {
    await this.showtimeByCinemasTab.click();
  }

  async goToHallBooking(): Promise<void> {
    await this.hallBookingTab.click();
  }

  async goToFnb(): Promise<void> {
    await this.fnbTab.click();
  }

  async goToFasTicket(): Promise<void> {
    await this.fasTicketTab.click();
  }
}
