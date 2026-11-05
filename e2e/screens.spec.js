// Screenshot every route in demo mode, for playwright.screens.config.js (npm run screens:base / screens:diff).
import { test as base, expect } from '@playwright/test';
import { getAllTestCases, clientNavigate } from './smoke-helpers.js';
import { settleStrips, waitForRender } from './wait-helpers';
import { fixClock } from './fixed-clock.mjs';
import serveLiveReplies from './live-replies.mjs';

// One fixed clock for every screenshot, so "updated 4 minutes ago" and countdowns read the same on
// every run, in the parse worker too: traps and Equinox's time to full are worked out in there.
const FIXED_TIME = new Date('2026-11-01T12:00:00Z');

// Ad slots are filled by Nitro and change on every load. Nitro moves its rail and anchor divs to <body>, so they are
// found by id, not by where they were mounted. An empty holder (a side ad's box when Nitro serves nothing, as on a
// local export) paints nothing, so it is not masked: the mask would paint a box the page does not have.
// data-volatile marks anything else that moves between runs.
const MASKS = ['[id^="nitro-"]:not(:empty)', '[data-volatile]'];
// Nitro's script is held back: after an in-app navigation it fills the side holders with blank iframes, so the shots
// would depend on Nitro's timing instead of the page.
const blockNitro = (target) => target.route('https://s.nitropay.com/ads-*.js', (route) => route.abort());

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
    await blockNitro(context);
    await fixClock(context, FIXED_TIME);
    await serveLiveReplies(context);
    const page = await context.newPage();
    await page.goto('/dashboard?demo=true');
    await waitForRender(page);
    await use(page);
    await context.close();
  }, { scope: 'worker' }],
});

const fileName = (name) => (name.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home') + '.png';

// SCREENS_COUNT=<css selector> records how many elements match on each route, so a task can show that
// the routes it changed are exactly the routes that render what it touched (tools/screens-routes.mjs).
const COUNT = process.env.SCREENS_COUNT;

// SCREENS_REGION=<css selector> shoots the first element that matches instead of the whole page, into .screens-region/
// (playwright.screens.config.js), so a shell task can show that the page under the chrome did not move while the
// chrome did. The bar and the band are sticky and can paint over an element shot, so they are masked there.
const REGION = process.env.SCREENS_REGION;
const REGION_MASKS = ['[data-shell="bar"]', '[data-shell="band"]'];

// A shot past the viewport drops the touch emulation, so a phone's (pointer: coarse) sizes never showed. A phone's viewport
// takes the page's height for the shot instead, which also puts a sticky piece at its true top. main's 100vh floor stays at
// the phone's height, or it pushes the footer out of the shot. A vh cap on a panel can still grow the page, so it measures
// until the two agree. Returns what puts it all back.
const fitPhoneViewport = async (page) => {
  const viewport = page.viewportSize();
  await page.evaluate(() => {
    const main = document.querySelector('main');
    main.style.minHeight = getComputedStyle(main).minHeight;
  });
  for (let measured = 0; measured < 4; measured += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (height === page.viewportSize().height) break;
    await page.setViewportSize({ width: viewport.width, height });
  }
  return async () => {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.querySelector('main').style.removeProperty('min-height'));
  };
};

const shoot = async (page, name) => {
  // GameIcon refits once the sprite bounds arrive (utility/spriteBounds.js): shoot after that.
  await expect(page.locator('[data-fit="pending"]')).toHaveCount(0);
  const region = REGION ? page.locator(REGION).first() : null;
  if (region && !(await region.count())) {
    // Nothing to compare on a route without the element: recorded, not failed.
    test.info().annotations.push({ type: 'region', description: 'none' });
    return;
  }
  const phone = test.info().project.use.isMobile;
  const restoreViewport = phone ? await fitPhoneViewport(page) : null;
  try {
    await settleStrips(page);
    await expect(region ?? page).toHaveScreenshot(fileName(name), {
      ...(region || phone ? {} : { fullPage: true }),
      mask: [...MASKS, ...(region ? REGION_MASKS : [])].map((selector) => page.locator(selector)),
    });
  } finally {
    await restoreViewport?.();
    // Counted once the shot has settled, changed or not: a slow route (Speedrun) is still rendering right after the refit.
    if (COUNT) test.info().annotations.push({ type: 'count', description: String(await page.locator(COUNT).count()) });
  }
};

for (const path of STATIC_ROUTES) {
  test(path, async ({ page }) => {
    await blockNitro(page);
    await fixClock(page.context(), FIXED_TIME);
    await page.goto(path);
    await waitForRender(page);
    await shoot(page, path);
  });
}

for (const { name, path, query } of getAllTestCases()) {
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
