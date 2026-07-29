/**
 * Centralized test data for the GSC ticket-booking E2E flow.
 * Override via env vars in CI; defaults are provided for local runs.
 *
 * NOTE: This flow logs into a real member account and walks through a real
 * booking session (stopping short of payment). Use a dedicated QA/test
 * account — never point this suite at a production customer account.
 */
export const testUser = {
  countryCode: process.env.GSC_COUNTRY_CODE ?? '+60',
  phoneNumber: process.env.GSC_PHONE_NUMBER ?? '178846364',
  password: process.env.GSC_PASSWORD ?? 'ValidPassword123!',
};

export const bookingPreferences = {
  // Falls back to the first available date/time/theatre if these aren't found,
  // so the suite stays resilient to daily showtime changes.
  preferredDateDayOfMonth: process.env.GSC_PREFERRED_DATE, // e.g. "31"
  preferredExperience: process.env.GSC_PREFERRED_EXPERIENCE ?? '2D', // '2D' | '3D' | 'IMAX' | etc.
  seatCount: 1,
};

export const expectedText = {
  profileUrlPath: '/profile',
  showtimeByMoviesUrlPathFragment: '/showtime-by-movies/',
  seatSelectionUrlPath: '/seat-selection',
  eComboUrlPathFragment: '-e-combo', // e.g. /aurum-e-combo — cinema-specific slug
  bookingSummaryUrlPath: '/review-summary',
  checkoutButtonText: 'Checkout & Pay',
};
