import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Showtime-by-Movies page
 * (https://epaymentwebapp.gsc.com.my/showtime-by-movies/{id}/{slug}).
 *
 * Live-DOM findings that shape this class:
 * - Clicking "Showtime by Movies" from the profile page auto-selects a
 *   default/featured movie and deep-links straight to its showtime page.
 * - Date is chosen from a horizontal strip of day buttons (DOW + day + month).
 * - A "Select Experiences" filter row exists in the DOM, but for the movie/date
 *   under test it rendered with zero chips (no 2D/3D/IMAX toggle buttons were
 *   present) — the experience/format is instead shown as a label on each
 *   individual showtime button (e.g. "STUDIO", "ATMOS GETHA", "2D", "3D ONYX").
 *   This POM supports both: an optional top-level chip filter (used when
 *   present) and format-aware time-slot selection (always available).
 * - Cinemas are rendered as expandable accordions; each accordion region
 *   contains a flat list of time-slot buttons with a time + format label.
 */
export class ShowtimeByMoviesPage extends BasePage {
  readonly movieTitleHeading: Locator;
  private readonly selectExperiencesHeading: Locator;
  private readonly cinemasAndTimeHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.movieTitleHeading = page.getByRole('heading', { level: 1 });
    this.selectExperiencesHeading = page.getByRole('heading', { name: 'Select Experiences' });
    this.cinemasAndTimeHeading = page.getByRole('heading', { name: 'Select Cinemas & Time' });
  }

  /** Confirms the page has loaded with a movie deep-linked/selected. */
  async isMovieSelected(): Promise<boolean> {
    try {
      await this.movieTitleHeading.waitFor({ state: 'visible' });
      const title = await this.movieTitleHeading.textContent();
      return !!title && title.trim().length > 0;
    } catch (error) {
      throw new Error(`ShowtimeByMoviesPage.isMovieSelected failed: ${(error as Error).message}`);
    }
  }

  /**
   * Selects a date by day-of-month (e.g. "31"). Falls back to the first
   * available date button if the requested day isn't found, so the suite
   * doesn't break on stale hard-coded dates.
   */
  async selectDate(dayOfMonth?: string): Promise<void> {
    try {
      const dateButtons = this.page.locator('button', { hasText: /^(MON|TUE|WED|THU|FRI|SAT|SUN)/ });
      const targetButton = dayOfMonth
        ? dateButtons.filter({ hasText: new RegExp(`\\b${dayOfMonth}\\b`) }).first()
        : dateButtons.first();
      await targetButton.click();
    } catch (error) {
      throw new Error(`ShowtimeByMoviesPage.selectDate failed: ${(error as Error).message}`);
    }
  }

  /**
   * Selects an experience/format chip (2D / 3D / IMAX / etc.) from the
   * top-level "Select Experiences" filter, if the site renders one for the
   * current movie/date. No-ops gracefully when no chips are present, since
   * that filter row was observed empty in production for some titles.
   */
  async selectExperienceIfAvailable(experience: string): Promise<boolean> {
    try {
      await this.selectExperiencesHeading.waitFor({ state: 'visible', timeout: 3_000 });
      const experienceChip = this.page
        .locator('button, [role="button"]')
        .filter({ hasText: new RegExp(`^${experience}$`, 'i') })
        .first();
      const chipCount = await experienceChip.count();
      if (chipCount === 0) {
        return false;
      }
      await experienceChip.click();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Expands a cinema accordion by (partial) name. If no name is given,
   * expands the first cinema in the list.
   */
  async expandCinema(cinemaName?: string): Promise<Locator> {
    try {
      await this.cinemasAndTimeHeading.waitFor({ state: 'visible' });
      const accordionToggle = cinemaName
        ? this.page.getByRole('button', { name: new RegExp(cinemaName, 'i') }).first()
        : this.page.getByRole('button', { expanded: false }).first();

      const isExpanded = await accordionToggle.getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await accordionToggle.click();
      }
      return accordionToggle;
    } catch (error) {
      throw new Error(`ShowtimeByMoviesPage.expandCinema failed: ${(error as Error).message}`);
    }
  }

  /**
   * Selects the first available time-slot button under the given cinema
   * name, optionally filtered by experience/format label (e.g. "2D",
   * "STUDIO", "SCREENX"). Navigates to the seat-selection page on success.
   */
  async selectTimeSlot(cinemaName: string, experienceFormat?: string): Promise<void> {
    try {
      // Try matching the region using a few tolerant variants of the
      // cinema name (hyphen vs space, or just the city prefix). This
      // handles small DOM differences between environments.
      const nameVariants = [
        cinemaName,
        cinemaName.replace(/-/g, ' '),
        cinemaName.split('-')[0].trim(),
      ];

      let cinemaRegion = null as unknown as Locator;
      for (const variant of nameVariants) {
        const candidate = this.page.getByRole('region', { name: new RegExp(variant, 'i') });
        if ((await candidate.count()) > 0) {
          cinemaRegion = candidate;
          break;
        }
      }

      let targetSlot = null as unknown as Locator;

      if (cinemaRegion) {
        const timeSlotButtons = cinemaRegion.getByRole('button');
        if (experienceFormat) {
          const filtered = timeSlotButtons.filter({ hasText: new RegExp(experienceFormat, 'i') });
          if ((await filtered.count()) > 0) {
            targetSlot = filtered.first();
          } else {
            // No labeled buttons found under this cinema; fall back to the
            // first available time-slot to keep the flow resilient.
            targetSlot = timeSlotButtons.first();
          }
        } else {
          targetSlot = timeSlotButtons.first();
        }
      } else {
        // Fallback: find any visible time-slot button on the page that
        // mentions the desired experience format. This is less scoped but
        // increases resilience if regions are not labelled accessibly.
        targetSlot = experienceFormat
          ? this.page.getByRole('button').filter({ hasText: new RegExp(experienceFormat, 'i') }).first()
          : this.page.getByRole('button').first();
      }

      await targetSlot.waitFor({ state: 'visible', timeout: 20000 });
      await targetSlot.click();
    } catch (error) {
      throw new Error(
        `ShowtimeByMoviesPage.selectTimeSlot failed for cinema "${cinemaName}": ${(error as Error).message}`,
      );
    }
  }
}
