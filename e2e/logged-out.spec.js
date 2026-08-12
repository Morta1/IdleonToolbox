import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

const PAGES = [
  '/account/world-2/bubbles',
  '/account/world-3/prayers',
  '/account/world-3/refinery',
  '/account/world-3/printer',
  '/account/world-4/breeding',
  '/account/world-6/farming',
  '/account/world-6/summoning',
  '/account/misc/quests',
  '/account/misc/storage',
];

test.describe.configure({ mode: 'serial' });

test.describe('Logged-out visitors reach account pages', () => {
  for (const path of PAGES) {
    test(`${path} renders without redirecting`, async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = collectErrors(page);

      await page.goto(path);
      await waitForRender(page);

      expect(new URL(page.url()).pathname).toBe(path);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      expect(bodyText).not.toContain('Loading account data');
      expect(bodyText).not.toContain('missing data');

      expect(bodyText).not.toContain('This page failed to render');
      expect(bodyText).not.toContain('The app failed to load');

      expect(bodyText).toContain('Browsing as a guest - numbers fill in once you sign in');

      expect(errors).toEqual([]);

      await context.close();
    });
  }

  test('/ (root) does not redirect a logged-out visitor away from itself', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await waitForRender(page);
    expect(new URL(page.url()).pathname).toBe('/');
    await context.close();
  });
});
