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
const STATIC_ROUTES = ['/', '/wiki/bubble', '/wiki/item/copper-bar', '/wiki/monster/amarok'];

// The smoke suite's demoPage opens its context with no options, which would ignore the project's
// viewport, so this fixture passes the project's device settings through.
const test = base.extend({
  screenPage: [async ({ browser }, use, workerInfo) => {
    const { viewport, isMobile, hasTouch, deviceScaleFactor } = workerInfo.project.use;
    const context = await browser.newContext({ viewport, isMobile, hasTouch, deviceScaleFactor });
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
  // The leaderboard asks the live API, so "No data for this division" shows on some runs only.
  '/account/misc/tournament [Leaderboard]': 0.01,
  // Small trap icons differ by a few pixels between runs on the phone (0.2% of the page).
  '/account/world-3/traps': 0.01,
};

// Routes that never settle, so a screenshot of them proves nothing. Checked by hand instead.
const SKIP = {
  // Flips between about 5,900 and 15,900 px tall while it renders, and differs even at the viewport.
  '/account/class-specific/royal-armory [Outposts]': true,
};

const shoot = (page, name) => expect(page).toHaveScreenshot(fileName(name), {
  fullPage: true,
  mask: MASKS.map((selector) => page.locator(selector)),
  ...(LOOSE[name] ? { maxDiffPixelRatio: LOOSE[name] } : {}),
});

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
