import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the GSC (Golden Screen Cinemas)
 * ticket-booking E2E suite.
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000, // booking flow spans many pages/network calls
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false, // booking flow is stateful/sequential per session
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://epaymentwebapp.gsc.com.my',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    // The booking summary / confirm CTA is rendered only at md+ breakpoints
    // (Tailwind `hidden md:block` footer bar), so the suite must run desktop-sized.
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
