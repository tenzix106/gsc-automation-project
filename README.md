# GSC Booking E2E Suite

Playwright + TypeScript, Page Object Model suite covering the GSC
(Golden Screen Cinemas) ticket-booking happy path:

login → profile → showtime by movies → date/experience/time selection →
seat selection → e-combo (food & drink) → (optional) merchandise upsell →
booking summary.

The suite stops at the booking summary page and never submits payment.

## Setup

```bash
npm install
npx playwright install chromium
npm test
```

Override credentials/env via `.env` or CI secrets — see `fixtures/test-data.ts`.
**Use a dedicated QA/test account only.**

## Known site quirks discovered during exploratory testing

These are documented in code comments at the relevant Page Object, but are
summarized here for visibility:

1. **Experience filter (2D/3D/IMAX) may render empty.** The "Select
   Experiences" heading exists on the Showtime-by-Movies page, but for the
   movie under test no filter chips were rendered. The format/experience is
   instead shown as a label on each individual time-slot button (e.g.
   `STUDIO`, `ATMOS GETHA`, `SCREENX`, `2D`, `3D ONYX`). `ShowtimeByMoviesPage`
   supports both: `selectExperienceIfAvailable()` for the top-level chip
   filter (no-ops if absent) and a format filter built into `selectTimeSlot()`.

2. **The e-Combo "Confirm" bar only renders at desktop breakpoints.** It's a
   Tailwind `hidden md:block` element, so it's not interactable below the
   `md` breakpoint. `playwright.config.ts` pins a `1440x900` viewport for
   this reason — running the suite at a narrower viewport will cause the
   confirm step to silently no-op.

3. **The e-Combo "Confirm" bar wrapper vs. its clickable inner node.** The
   full-width sticky bar is a positioning wrapper; the actual interactive
   element is a small nested `div.confirm-sec`. `EComboPage.confirmCombo()`
   targets that inner node and falls back to a direct DOM `.click()` if a
   standard Playwright click is intercepted.

4. **Merchandise/upselling step appears to be conditional.** In this
   exploratory run, the app navigated directly from `/aurum-e-combo` to
   `/review-summary` — no merchandise page was shown. `UpsellingPage` and the
   spec treat this step as optional (`isDisplayed()` / graceful no-op)
   rather than a guaranteed part of the flow. If you find a promo/cinema/
   ticket-type combination that does trigger it, tighten `UpsellingPage`'s
   selectors against the live DOM and consider asserting it as required for
   that scenario.

5. **Post-login onboarding modal ("Start Your Reward Journey") is
   inconsistent.** It appeared once during exploration but may not appear on
   every login. Handled defensively via `BasePage.dismissModalIfPresent()`.

6. **A GSCoins rewards-redemption dialog can auto-open on the booking
   summary page.** Dismissed via `BookingSummaryPage.dismissRewardsDialogIfPresent()`
   before interacting with the summary panel underneath.

## Structure

```
gsc-pom-scaffold/
├── package.json
├── playwright.config.ts
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── ProfilePage.ts
│   ├── ShowtimeByMoviesPage.ts
│   ├── SeatSelectionPage.ts
│   ├── EComboPage.ts
│   ├── UpsellingPage.ts
│   └── BookingSummaryPage.ts
├── fixtures/
│   ├── test-data.ts
│   └── pages.fixture.ts
└── tests/
    └── booking-happy-path.spec.ts
```
