// Verifies Task 8: a logged-out visitor (no ?demo=true, no auth) reaches account pages instead
// of being redirected to '/', and the page renders the zeroed game catalog rather than a spinner.
import { test, expect } from '@playwright/test';

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

      await page.goto(`http://localhost:3001${path}`);
      await page.waitForLoadState('networkidle');
      // Give React a moment to finish the empty-account parse + render.
      await page.waitForTimeout(1000);

      // Must NOT have been bounced to the homepage.
      expect(new URL(page.url()).pathname).toBe(path);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.trim().length).toBeGreaterThan(0);

      // No spinner stuck forever, no missing-data placeholder for a page that should render.
      expect(bodyText).not.toContain('Loading account data');
      expect(bodyText).not.toContain('missing data');

      // ErrorBoundary swallows render crashes into this fallback text instead of throwing, so it
      // never reaches `pageerror` below - check for it explicitly or a crashing page reads "green".
      expect(bodyText).not.toContain('This page failed to render');
      expect(bodyText).not.toContain('The app failed to load');

      // The empty-account banner itself must be present - this is the "why are these zero" cue.
      expect(bodyText).toContain('Not signed in');
      expect(bodyText).toContain('everything below is shown at zero');

      expect(errors).toEqual([]);

      await context.close();
    });
  }

  test('/ (root) does not redirect a logged-out visitor away from itself', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3001/');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/');
    await context.close();
  });
});
