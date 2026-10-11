import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// Every account page's logged-out render is checked in no-nan.spec.js's per-route loop.
test.describe('Logged-out visitors reach account pages', () => {
  test('/ (root) does not redirect a logged-out visitor away from itself', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await waitForRender(page);
    expect(new URL(page.url()).pathname).toBe('/');
    await context.close();
  });
});
