import { test, expect } from '../fixtures/pages.fixture';
import { testUser, bookingPreferences, expectedText } from '../fixtures/test-data';

/**
 * Happy path: login -> profile -> showtime by movies -> date/experience/time
 * selection -> seat selection -> e-combo -> (optional upsell) -> booking summary.
 *
 * This suite stops at the booking summary page and never submits payment.
 * Run only against a dedicated QA/test account (see fixtures/test-data.ts).
 */
test.describe('GSC ticket booking — happy path', () => {
  test('user can log in and walk the full booking flow up to booking summary', async ({
    page,
    loginPage,
    profilePage,
    showtimeByMoviesPage,
    seatSelectionPage,
    eComboPage,
    upsellingPage,
    bookingSummaryPage,
  }) => {
    // Step 1: Navigate to the login page (also GSC's landing/home route)
    await test.step('Open login page', async () => {
      await loginPage.open();
      await expect(page).toHaveURL(/\/login$/);
    });

    // Step 2: Log in with phone number + password
    await test.step('Log in with phone number and password', async () => {
      await loginPage.login(testUser.phoneNumber, testUser.password);
      // A "Start Your Reward Journey" onboarding modal can appear post-login;
      // dismiss it defensively before asserting navigation.
      await profilePage.dismissRewardJourneyModalIfPresent();
    });

    // Step 3: Explicitly assert the user has landed on the profile page
    await test.step('Verify successful navigation to the profile page', async () => {
      await expect(page).toHaveURL(new RegExp(`${expectedText.profileUrlPath}$`));
    });

    // Step 4: Navigate to Showtime by Movies
    await test.step('Open Showtime by Movies tab', async () => {
      await profilePage.goToShowtimeByMovies();
      await expect(page).toHaveURL(new RegExp(expectedText.showtimeByMoviesUrlPathFragment));
      expect(await showtimeByMoviesPage.isMovieSelected()).toBe(true);
    });

    // Step 5: Select a date
    await test.step('Select a showtime date', async () => {
      await showtimeByMoviesPage.selectDate(bookingPreferences.preferredDateDayOfMonth);
    });

    // Step 6: Select an experience type (2D/3D/IMAX) when the site offers a filter
    await test.step('Select an experience type if the filter is available', async () => {
      const wasExperienceFilterUsed = await showtimeByMoviesPage.selectExperienceIfAvailable(
        bookingPreferences.preferredExperience,
      );
      // Not asserted as a hard requirement: on the movie under test, GSC
      // rendered no experience chips and instead tags format per time-slot
      // (handled in the next step via selectTimeSlot's format filter).
      test.info().annotations.push({
        type: 'experience-filter-used',
        description: String(wasExperienceFilterUsed),
      });
    });

    // Step 7: Select an available time slot under a specific theatre
    let selectedSeat = '';
    await test.step('Select a time slot under a specific theatre', async () => {
      await showtimeByMoviesPage.expandCinema('Kuala Lumpur - Aurum');
      await showtimeByMoviesPage.selectTimeSlot(
        'Kuala Lumpur - Aurum',
        bookingPreferences.preferredExperience,
      );
      await expect(page).toHaveURL(new RegExp(`${expectedText.seatSelectionUrlPath}$`));
    });

    // Step 8: Select a seat and confirm
    await test.step('Select a seat on the seat map', async () => {
      selectedSeat = await seatSelectionPage.selectFirstAvailableSeat();
      expect(selectedSeat).toMatch(/^[A-Z]\d{2}$/);
      await seatSelectionPage.confirmSeatSelection();
      await expect(page).toHaveURL(new RegExp(expectedText.eComboUrlPathFragment));
    });

    // Step 9: Add food and drink combo items, then confirm
    await test.step('Select e-Combo food and drink items', async () => {
      const foodCounterBefore = await eComboPage.getSelectionCounter('Food');
      expect(foodCounterBefore).not.toBeNull();

      // Add the first food item from the default (Food) tab
      await eComboPage.addItemByName('Mediterranean Loaded Hummus');

      // Switch to Drink and add one drink item
      await eComboPage.switchToDrinkTab();
      await eComboPage.addItemByName('Coca-Cola Classic');

      await eComboPage.confirmCombo();
    });

    // Step 10: Handle the optional merchandise/upselling step, if GSC shows one
    await test.step('Handle optional merchandise upsell step', async () => {
      const upsellShown = await upsellingPage.selectMerchandiseIfAvailable();
      test.info().annotations.push({
        type: 'upsell-step-shown',
        description: String(upsellShown),
      });
    });

    // Step 11: Land on the booking summary page and assert its contents
    await test.step('Verify booking summary page', async () => {
      await bookingSummaryPage.dismissRewardsDialogIfPresent();
      await expect(page).toHaveURL(new RegExp(`${expectedText.bookingSummaryUrlPath}$`));
      expect(await bookingSummaryPage.isCheckoutButtonVisible()).toBe(true);

      const total = await bookingSummaryPage.getTotal();
      expect(total).toMatch(/RM\s?\d+(\.\d{2})?/);
    });
  });

  // Ensure the browser session is cleanly torn down after each test, even on
  // failure, so no authenticated session or page handle is leaked between runs.
  test.afterEach(async ({ page }, testInfo) => {
    try {
      if (testInfo.status !== testInfo.expectedStatus) {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('failure-screenshot', {
          body: screenshot,
          contentType: 'image/png',
        });
      }
    } catch (error) {
      console.warn(`afterEach cleanup warning: ${(error as Error).message}`);
    } finally {
      await page.close();
    }
  });
});
