import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ShowtimeByMoviesPage } from '../pages/ShowtimeByMoviesPage';
import { SeatSelectionPage } from '../pages/SeatSelectionPage';
import { EComboPage } from '../pages/EComboPage';
import { UpsellingPage } from '../pages/UpsellingPage';
import { BookingSummaryPage } from '../pages/BookingSummaryPage';

/**
 * Extends the base Playwright test with ready-to-use Page Object fixtures
 * for the full GSC booking journey. Tests import `test`/`expect` from this
 * file instead of '@playwright/test' directly.
 */
type PageFixtures = {
  loginPage: LoginPage;
  profilePage: ProfilePage;
  showtimeByMoviesPage: ShowtimeByMoviesPage;
  seatSelectionPage: SeatSelectionPage;
  eComboPage: EComboPage;
  upsellingPage: UpsellingPage;
  bookingSummaryPage: BookingSummaryPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  showtimeByMoviesPage: async ({ page }, use) => {
    await use(new ShowtimeByMoviesPage(page));
  },
  seatSelectionPage: async ({ page }, use) => {
    await use(new SeatSelectionPage(page));
  },
  eComboPage: async ({ page }, use) => {
    await use(new EComboPage(page));
  },
  upsellingPage: async ({ page }, use) => {
    await use(new UpsellingPage(page));
  },
  bookingSummaryPage: async ({ page }, use) => {
    await use(new BookingSummaryPage(page));
  },
});

export { expect } from '@playwright/test';
