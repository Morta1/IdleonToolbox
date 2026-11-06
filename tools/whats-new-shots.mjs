#!/usr/bin/env node
// Re-shoots the What's new dialog's pictures of today's site from a served export, into public/etc/whatsnew/: every After side
// and the Theme pair, rings included. Run it at the release, as the site moves on:
//   E2E_PORT=3014 npm run serve:e2e, then E2E_PORT=3014 node tools/whats-new-shots.mjs [names]
// The Before pictures show the old site. They're final assets with their rings baked in, and nothing here touches them.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { join } from 'node:path';
import { fixClock } from '../e2e/fixed-clock.mjs';

const BASE = `http://localhost:${process.env.E2E_PORT ?? 3002}`;
const OUT = join(import.meta.dirname, '..', 'public', 'etc', 'whatsnew');
// Near the demo save's own time, so its timers read as real countdowns.
const CLOCK = new Date(1787765255771 + 5 * 60e3).toISOString();
const SETTLE_MS = 1500;
const QUALITY = 84;

const DESK = { viewport: { width: 1366, height: 768 } };
const PHONE = { viewport: { width: 384, height: 832 }, isMobile: true, hasTouch: true };
const DESK_FRAME = { width: 1033, height: 567 };
const PHONE_FRAME = { width: 384, height: 320 };
const RING = '#ffb74d';
// As thick on screen in the two: a desk frame is drawn at 60%, a phone's at nearly full size.
const RING_WIDTH = { desk: 4, phone: 3 };
const consent = {
  cookies: [{ name: 'idleon-consent', value: 'false', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
  origins: []
};

const STAMPS = '/account/world-1/stamps';
const DASHBOARD = '/dashboard';
const TIMERS_ONLY = { 'dashboard-filters': ['timers'], 'dashboard-goals-filter-added': true };
const ACTIONS = '[data-tour="page-actions"]';
const TIMERS = '[data-tour="timers"]';

const boxesOf = (page, selectors) => Promise.all(selectors.map((selector) => page.locator(selector).first().boundingBox()));

// One ring around everything named, on the page, under the shot's own clip.
const ringAround = async (page, selectors, width) => {
  const boxes = await boxesOf(page, selectors);
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  await page.evaluate(({ left, top, right, bottom, width, color }) => {
    const ring = document.createElement('div');
    ring.style.cssText = `position:fixed;z-index:99999;pointer-events:none;left:${left - 6}px;top:${top - 6}px;width:${right - left + 12}px;height:${bottom - top + 12}px;border:${width}px solid ${color};border-radius:10px;box-sizing:border-box;`;
    document.body.append(ring);
  }, { left, top, right, bottom, width, color: RING });
};

const theFrame = (frame) => async () => ({ x: 0, y: 0, ...frame });
const withRing = (selectors, width, frame) => async (page) => {
  await ringAround(page, selectors, width);
  return theFrame(frame)();
};
// From the strip of resets over the timers, or, on a phone, enough of it to show that the table starts with Ready now.
const timersFrom = (selector, gap, frame) => async (page) => {
  const top = await page.locator(selector).first().evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  return { x: 0, y: Math.max(0, Math.round(top - gap)), ...frame };
};

const SHOTS = [
  {
    name: 'menu-after', route: STAMPS, view: DESK,
    shoot: async (page) => {
      await page.locator('[data-tour="nav-worlds"]').click();
      await page.waitForTimeout(SETTLE_MS);
      return withRing(['[data-tour="nav-worlds"]', '[data-tour="nav-account"]'], RING_WIDTH.desk, DESK_FRAME)(page);
    }
  },
  { name: 'pin-after', route: STAMPS, view: DESK, shoot: withRing([ACTIONS], RING_WIDTH.desk, DESK_FRAME) },
  {
    name: 'timers-after', route: DASHBOARD, view: DESK, storage: TIMERS_ONLY, fullPage: true,
    shoot: timersFrom('[data-page-summary]', 16, DESK_FRAME)
  },
  { name: 'theme-dark', route: STAMPS, view: DESK, shoot: theFrame(DESK_FRAME) },
  { name: 'theme-light', route: STAMPS, view: DESK, scheme: 'light', shoot: theFrame(DESK_FRAME) },
  {
    name: 'phone-menu-after', route: STAMPS, view: PHONE,
    shoot: async (page) => {
      await page.locator('[aria-label="Open menu"]').click();
      await page.waitForTimeout(SETTLE_MS);
      return withRing(['#phone-menu button:has-text("Worlds")', '#phone-menu button:has-text("Account")'], RING_WIDTH.phone, PHONE_FRAME)(page);
    }
  },
  { name: 'phone-pin-after', route: STAMPS, view: PHONE, shoot: withRing([ACTIONS], RING_WIDTH.phone, PHONE_FRAME) },
  {
    name: 'phone-timers-after', route: DASHBOARD, view: PHONE, storage: TIMERS_ONLY, fullPage: true,
    shoot: timersFrom(TIMERS, 90, PHONE_FRAME)
  },
  { name: 'phone-theme-dark', route: STAMPS, view: PHONE, shoot: theFrame(PHONE_FRAME) },
  { name: 'phone-theme-light', route: STAMPS, view: PHONE, scheme: 'light', shoot: theFrame(PHONE_FRAME) }
];

const wanted = process.argv.slice(2);
const browser = await chromium.launch();
for (const { name, route, view, scheme = 'dark', storage = {}, fullPage = false, shoot } of SHOTS.filter((shot) => !wanted.length || wanted.includes(shot.name))) {
  const context = await browser.newContext({ ...view, storageState: consent });
  await context.addInitScript(({ mode, entries }) => {
    if (window !== window.top) return;
    localStorage.setItem('mui-mode', mode);
    // At the release the end date opens the dialog's window.
    localStorage.setItem('whatsNew', '"shown"');
    entries.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  }, { mode: scheme, entries: Object.entries(storage) });
  await fixClock(context, CLOCK);
  const page = await context.newPage();
  await page.goto(`${BASE}${route}?demo=true`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="page-loader"]') && document.querySelector('[data-shell="header"]'), null, { timeout: 60000 });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), null, { timeout: 30000 }).catch(() => console.log(name, 'some images never came'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);
  const clip = await shoot(page);
  await page.waitForTimeout(200);
  const shot = await page.screenshot({ clip, fullPage });
  await sharp(shot).webp({ quality: QUALITY }).toFile(join(OUT, `${name}.webp`));
  console.log(name, JSON.stringify(clip));
  await context.close();
}
await browser.close();
