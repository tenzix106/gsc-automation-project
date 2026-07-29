import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the e-Combo page, e.g.
 * https://epaymentwebapp.gsc.com.my/aurum-e-combo
 * (the URL slug is cinema-specific, hence matched by suffix in the fixture).
 *
 * Live-DOM findings:
 * - Items are split across "Food" and "Drink" tabs, each with a running
 *   "Food( x / y )" / "Drink( x / y )" counter that must be satisfied
 *   before the combo can be confirmed.
 * - Each item row has two `selection_icon` images (decrement / increment)
 *   flanking a quantity number.
 * - IMPORTANT: the sticky "Confirm" action bar is a Tailwind
 *   `hidden md:block` element — it is not interactable (and Playwright will
 *   effectively no-op on it) at narrow/mobile viewport widths. This suite's
 *   playwright.config.ts pins a 1440x900 desktop viewport specifically so
 *   this bar is visible and clickable. Additionally, the outer "Confirm"
 *   container spans the full bar width, but the actual clickable node is a
 *   small nested `div.confirm-sec` — this class targets that inner node
 *   directly via text matching to avoid mis-clicking empty bar space.
 */
export class EComboPage extends BasePage {
  private readonly foodTab: Locator;
  private readonly drinkTab: Locator;
  private readonly confirmBar: Locator;

  constructor(page: Page) {
    super(page);
    this.foodTab = page.getByText('Food', { exact: true });
    this.drinkTab = page.getByText('Drink', { exact: true });
    // Scoped to the exact leaf node containing "Confirm" (the small inner
    // `confirm-sec` control), not the full-width sticky bar wrapper.
    this.confirmBar = page.locator('text=Confirm').last();
  }

  async switchToFoodTab(): Promise<void> {
    await this.foodTab.click();
  }

  async switchToDrinkTab(): Promise<void> {
    await this.drinkTab.click();
  }

  /**
   * Increments the quantity for a named food or drink item by clicking its
   * "+" selection icon (the second of the two `selection_icon` images in
   * that item's row).
   */
  async addItemByName(itemName: string, quantity: number = 1): Promise<void> {
    try {
      const itemRow = this.page.locator('div', { hasText: itemName }).filter({
        has: this.page.getByRole('img', { name: 'selection_icon' }),
      }).last();
      const incrementIcon = itemRow.getByRole('img', { name: 'selection_icon' }).last();

      for (let i = 0; i < quantity; i += 1) {
        await incrementIcon.click();
      }
    } catch (error) {
      throw new Error(`EComboPage.addItemByName failed for "${itemName}": ${(error as Error).message}`);
    }
  }

  /** Reads back the "Food( x / y )" or "Drink( x / y )" counter text. */
  async getSelectionCounter(category: 'Food' | 'Drink'): Promise<string | null> {
    try {
      const counter = this.page.getByText(new RegExp(`^${category}\\(\\s*\\d+\\s*/\\s*\\d+\\s*\\)$`));
      return await counter.textContent();
    } catch (error) {
      throw new Error(`EComboPage.getSelectionCounter failed for "${category}": ${(error as Error).message}`);
    }
  }

  /**
   * Clicks the Confirm CTA. Falls back to a direct DOM click on the leaf
   * "Confirm" node if the standard Playwright click is intercepted — this
   * mirrors the workaround discovered during exploratory testing, where the
   * outer sticky-bar wrapper swallowed clicks aimed at its bounding box.
   */
  async confirmCombo(): Promise<void> {
    try {
      await this.confirmBar.click({ timeout: 5_000 });
    } catch {
      await this.confirmBar.evaluate((el) => (el as HTMLElement).click());
    }
  }
}
