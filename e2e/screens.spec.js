// Screenshot every route in demo mode, for playwright.screens.config.js (npm run screens:base / screens:diff).
import { test as base, expect } from '@playwright/test';
import { getAllTestCases, clientNavigate } from './smoke-helpers.js';
import { waitForRender } from './wait-helpers';

// One fixed clock for every screenshot, so "updated 4 minutes ago" and countdowns read the same on
// every run. Timers keep running, so the app still works.
const FIXED_TIME = new Date('2026-11-01T12:00:00Z');

// Ad slots are filled by Nitro and change on every load. Nitro moves its divs to <body>, so they are
// found by id, not by where they were mounted. data-volatile marks anything else that moves between runs.
const MASKS = ['[id^="nitro-"]', '[data-volatile]'];

// Static pages the smoke list leaves out. They are exported pages, so each one loads fresh instead of
// by client navigation, which can screenshot the previous page before the next one has arrived.
// Guilds, statistics, leaderboards and builds read live API data, which changes between runs, so
// they are checked by hand instead.
const STATIC_ROUTES = ['/', '/wiki/bubble', '/wiki/monster', '/wiki/item', '/wiki/item/copper-bar', '/wiki/monster/amarok'];

// The smoke suite's demoPage opens its context with no options, which would ignore the project's
// viewport, so this fixture passes the project's device settings through.
const test = base.extend({
  screenPage: [async ({ browser }, use, workerInfo) => {
    const { viewport, isMobile, hasTouch, deviceScaleFactor, storageState } = workerInfo.project.use;
    const context = await browser.newContext({ viewport, isMobile, hasTouch, deviceScaleFactor, storageState });
    const page = await context.newPage();
    await page.clock.setFixedTime(FIXED_TIME);
    await page.goto('/dashboard?demo=true');
    await waitForRender(page);
    await use(page);
    await context.close();
  }, { scope: 'worker' }],
});

const fileName = (name) => (name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home') + '.png';
// Routes that differ a little between two runs of the same build, with why. They get a looser
// threshold instead of a skip, so a real change still fails them.
const LOOSE = {
  // Tome rankings ask the live API too: a spinner on one run, "not available yet" on the next.
  '/account/world-4/tome [Rankings]': 0.01,
  // Pet Mart shows the live price history, which gains a row each day.
  '/account/prem-currency/pets [Pet Mart]': 0.01,
  '/account/prem-currency/bundles [Pet Mart]': 0.01,
  // Small trap icons differ by a few pixels between runs on the phone (0.2% of the page).
  '/account/world-3/traps': 0.01,
};
const looseRatio = (name) => LOOSE[name];

// Routes that never settle, so a screenshot of them proves nothing. Checked by hand instead.
const SKIP = {
  // Flips between about 5,900 and 15,900 px tall while it renders, and differs even at the viewport.
  '/account/class-specific/royal-armory [Outposts]': true,
};

// SCREENS_COUNT=<css selector> records how many elements match on each route, so a task can show that
// the routes it changed are exactly the routes that render what it touched (tools/screens-routes.mjs).
const COUNT = process.env.SCREENS_COUNT;

// SCREENS_REGION=<css selector> shoots the first element that matches instead of the whole page, into .screens-region/
// (playwright.screens.config.js), so a shell task can show that the page under the chrome did not move while the
// chrome did. The bar and the band are sticky and can paint over an element shot, so they are masked there.
const REGION = process.env.SCREENS_REGION;
const REGION_MASKS = ['[data-shell="bar"]', '[data-shell="band"]'];

const shoot = async (page, name) => {
  // GameIcon refits once the sprite bounds arrive (utility/spriteBounds.js): shoot after that.
  await expect(page.locator('[data-fit="pending"]')).toHaveCount(0);
  const region = REGION ? page.locator(REGION).first() : null;
  if (region && !(await region.count())) {
    // Nothing to compare on a route without the element: recorded, not failed.
    test.info().annotations.push({ type: 'region', description: 'none' });
    return;
  }
  try {
    await expect(region ?? page).toHaveScreenshot(fileName(name), {
      ...(region ? {} : { fullPage: true }),
      mask: [...MASKS, ...(region ? REGION_MASKS : [])].map((selector) => page.locator(selector)),
      ...(looseRatio(name) ? { maxDiffPixelRatio: looseRatio(name) } : {}),
    });
  } finally {
    // Counted once the shot has settled, changed or not: a slow route (Speedrun) is still rendering right after the refit.
    if (COUNT) test.info().annotations.push({ type: 'count', description: String(await page.locator(COUNT).count()) });
  }
};

for (const path of STATIC_ROUTES) {
  test(path, async ({ page }) => {
    await page.clock.setFixedTime(FIXED_TIME);
    await page.goto(path);
    await waitForRender(page);
    await shoot(page, path);
  });
}

for (const { name, path, query } of getAllTestCases().filter(({ name }) => !SKIP[name])) {
  test(name, async ({ screenPage }) => {
    await clientNavigate(screenPage, path, query);
    await shoot(screenPage, name);
  });
}

// Tables that show only after a view switch. Each seeds its page's stored view, shoots, and clears it again, so
// the worker's next route starts from the defaults. The trips to /dashboard remount the page on both sides.
const TABLE_VIEWS = [
  { name: '/account/class-specific/tesseract [Upgrade Optimizer] (table)', path: '/account/class-specific/tesseract',
    query: { t: 'Upgrade Optimizer' }, storage: { 'tesseract.tachyons:genericUpgradeOptimizer:viewMode': 'list' } },
  { name: '/account/world-6/farming [Rank Optimizer] (table)', path: '/account/world-6/farming',
    query: { t: 'Rank Optimizer' }, storage: { 'landRankOptimizer:viewMode': 'list' } },
  { name: '/account/world-7/spelunking [Upgrade Optimizer] (table)', path: '/account/world-7/spelunking',
    query: { t: 'Upgrade Optimizer' }, storage: { 'spelunkingUpgradeOptimizer:viewMode': 'list' } }
];

for (const { name, path, query, storage } of TABLE_VIEWS) {
  test(name, async ({ screenPage }) => {
    await clientNavigate(screenPage, '/dashboard');
    await screenPage.evaluate((entries) => entries.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value))),
      Object.entries(storage));
    try {
      await clientNavigate(screenPage, path, query);
      await shoot(screenPage, name);
    } finally {
      await screenPage.evaluate((keys) => keys.forEach((key) => localStorage.removeItem(key)), Object.keys(storage));
      await clientNavigate(screenPage, '/dashboard');
    }
  });
}
