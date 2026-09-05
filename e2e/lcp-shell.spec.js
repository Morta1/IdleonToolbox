import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// The pre-hydration shell exists to make the page's largest paint happen from the exported HTML,
// before any JS runs. Chrome keeps that early timestamp only while nothing LARGER paints later, so
// the invariant is geometric: whatever the hydrated page draws in the same role must be no bigger
// than the shell's copy. Measured on the served export, with JS off for the shell half, because
// that is exactly the state a visitor's browser paints first.

const area = (box) => (box ? box.width * box.height : 0);

const shellBox = async (browser, path, selector) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(path);
  const box = await page.locator(selector).first().boundingBox();
  await ctx.close();
  return box;
};

// Fractional CSS sizes pixel-snap differently at different subpixel offsets, and the two copies
// never sit at the same y. A few hundred px^2 of slack is that snapping; the hydrated hero is
// deliberately 3px narrower so it clears it with room to spare.
test('the hydrated landing hero is never larger than the shell hero', async ({ browser, page }) => {
  const shell = await shellBox(browser, '/', 'img[src="/etc/bg_0.png"]');
  expect(shell, 'shell shipped no hero').not.toBeNull();

  await page.goto('/');
  await waitForRender(page);
  const hydrated = await page.locator('img[src="/etc/bg_0.png"]').first().boundingBox();
  expect(hydrated, 'hydrated page has no hero').not.toBeNull();

  expect(area(hydrated)).toBeLessThan(area(shell));
});

// First visits from non-GDPR regions get the cookie-consent bar at hydration. Its text block is
// large enough to have beaten a body-size description; the shell draws the description at subtitle
// size so it stays the biggest thing that ever paints.
test('the cookie-consent bar is smaller than the shell description', async ({ browser, page }) => {
  const route = '/account/world-1/stamps';
  const shell = await shellBox(browser, route, 'header p');
  expect(shell, 'shell shipped no description').not.toBeNull();

  await page.goto(route);
  await waitForRender(page);
  const bar = page.locator('.CookieConsent > div').first();
  await expect(bar).toBeVisible();

  expect(area(await bar.boundingBox())).toBeLessThan(area(shell));
});

// Account pages: the h1 is the element the field data named. It is the same PAGE_H1_SX in both
// copies, so the sizes should agree to a pixel - a larger hydrated one hands LCP back to hydration.
test('the hydrated page h1 is no larger than the shell h1', async ({ browser, page }) => {
  const route = '/account/world-1/stamps';
  const shell = await shellBox(browser, route, 'h1');
  expect(shell, 'shell shipped no h1').not.toBeNull();

  await page.goto(route);
  await waitForRender(page);
  const hydrated = await page.locator('h1').first().boundingBox();

  expect(area(hydrated)).toBeLessThanOrEqual(area(shell) + 1);
});
