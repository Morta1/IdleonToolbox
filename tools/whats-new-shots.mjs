#!/usr/bin/env node
// Re-shoots the What's new dialog's pictures of today's site from a served export, into public/etc/whatsnew/. Run it at the
// release, as the site moves on: E2E_PORT=3013 npm run serve:e2e, then E2E_PORT=3013 node tools/whats-new-shots.mjs [names]
// The Before pictures show the old site, so they stay. The sample account's band is hidden: a signed-in player has none.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { join } from 'node:path';
import { fixClock } from '../e2e/fixed-clock.mjs';

const BASE = `http://localhost:${process.env.E2E_PORT ?? 3002}`;
const OUT = join(import.meta.dirname, '..', 'public', 'etc', 'whatsnew');
// Near the demo save's own time, so its timers read as real countdowns.
const CLOCK = new Date(1787765255771 + 5 * 60e3).toISOString();
const SETTLE_MS = 700;

const DESK = { viewport: { width: 1366, height: 768 } };
const PHONE = { viewport: { width: 384, height: 832 }, isMobile: true, hasTouch: true };
// Twice the size the dialog draws them.
const DESK_SIZE = [354, 184];
const PHONE_SIZE = [328, 152];
const NO_BAND = '[data-shell="band"]{display:none!important}';
const consent = {
  cookies: [{ name: 'idleon-consent', value: 'false', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
  origins: []
};

const boxOf = (page, selector) => page.locator(selector).first().evaluate((node) => {
  const { x, y, width, height } = node.getBoundingClientRect();
  return { x, y, width, height };
});
const scrollTo = (page, selector, gap) => page.locator(selector).first().evaluate((node, room) => {
  window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - room, behavior: 'instant' });
}, gap);

const STAMPS = '/account/world-1/stamps';
const DASHBOARD = '/dashboard';
const STAMP_GROUP = 'h2:has-text("Combat")';

const theme = (name, scheme, view, size, width, height) => ({
  name, route: STAMPS, view, size, scheme,
  shoot: async (page) => {
    const group = await boxOf(page, STAMP_GROUP);
    return { x: view === DESK ? group.x - 24 : 0, y: group.y - 24, width, height };
  }
});

const SHOTS = [
  {
    name: 'nav-after', route: DASHBOARD, view: DESK, size: DESK_SIZE,
    shoot: async (page) => {
      await page.locator('[data-tour="nav-worlds"]').click();
      // Under the bar, as a signed-in player has it: the band it clears is hidden here.
      await page.locator('#nav-menu-worlds').evaluate((panel) => {
        let node = panel;
        while (getComputedStyle(node).position !== 'fixed') node = node.parentElement;
        node.style.top = '56px';
      });
      await page.waitForTimeout(SETTLE_MS);
      const account = await boxOf(page, '[data-tour="nav-account"]');
      const width = Math.round(account.x + account.width + 16);
      return { x: 0, y: 6, width, height: Math.round((width * DESK_SIZE[1]) / DESK_SIZE[0]) };
    }
  },
  {
    name: 'header-after', route: STAMPS, view: DESK, size: DESK_SIZE,
    // The title and the row's right end share one small picture.
    css: '[data-shell="header"]{width:488px!important}',
    shoot: async (page) => {
      const header = await boxOf(page, '[data-shell="header"]');
      return { x: header.x - 6, y: header.y - 8, width: 500, height: 260 };
    }
  },
  {
    name: 'timers-after', route: DASHBOARD, view: DESK, size: DESK_SIZE,
    // The table's own narrow form with two rows of Ready now, so it reaches Next 24 hours in one small picture.
    css: '[data-shell="page"]{width:480px!important}',
    shoot: async (page) => {
      await page.locator('[data-tour="timers"] > :first-child').evaluate((band) => {
        [...band.lastElementChild.firstElementChild.children].slice(2).forEach((row) => row.style.setProperty('display', 'none', 'important'));
      });
      await scrollTo(page, '[data-tour="timers"]', 170);
      await page.waitForTimeout(SETTLE_MS);
      const table = await boxOf(page, '[data-tour="timers"]');
      return { x: table.x - 10, y: table.y - 8, width: 500, height: 260 };
    }
  },
  theme('theme-dark', 'dark', DESK, DESK_SIZE, 500, 260),
  theme('theme-light', 'light', DESK, DESK_SIZE, 500, 260),
  {
    name: 'phone-nav-after', route: DASHBOARD, view: PHONE, size: PHONE_SIZE,
    shoot: async (page) => {
      await page.locator('[aria-label="Open menu"]').click();
      await page.waitForTimeout(SETTLE_MS);
      const menu = await boxOf(page, '#phone-menu');
      return { x: 0, y: menu.y, width: 384, height: 178 };
    }
  },
  {
    name: 'phone-header-after', route: STAMPS, view: PHONE, size: PHONE_SIZE,
    shoot: async (page) => {
      const header = await boxOf(page, '[data-shell="header"]');
      return { x: 0, y: header.y - 6, width: 384, height: 178 };
    }
  },
  {
    name: 'phone-timers-after', route: DASHBOARD, view: PHONE, size: PHONE_SIZE,
    shoot: async (page) => {
      const fold = '[data-tour="timers"] button:has-text("more")';
      await scrollTo(page, fold, 200);
      await page.waitForTimeout(SETTLE_MS);
      const button = await boxOf(page, fold);
      return { x: 0, y: button.y - 44, width: 384, height: 178 };
    }
  },
  theme('phone-theme-dark', 'dark', PHONE, PHONE_SIZE, 384, 178),
  theme('phone-theme-light', 'light', PHONE, PHONE_SIZE, 384, 178)
];

const wanted = process.argv.slice(2);
const browser = await chromium.launch();
for (const { name, route, view, size, css, scheme = 'dark', shoot } of SHOTS.filter((shot) => !wanted.length || wanted.includes(shot.name))) {
  const context = await browser.newContext({ ...view, storageState: consent });
  await context.addInitScript((mode) => {
    if (window === window.top) localStorage.setItem('mui-mode', mode);
  }, scheme);
  await fixClock(context, CLOCK);
  const page = await context.newPage();
  await page.goto(`${BASE}${route}?demo=true`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="page-loader"]') && document.querySelector('[data-shell="header"]'), null, { timeout: 60000 });
  await page.addStyleTag({ content: `${NO_BAND}${css ?? ''}` });
  await page.waitForTimeout(SETTLE_MS);
  const clip = await shoot(page);
  const shot = await page.screenshot({ clip });
  await sharp(shot).resize(size[0], size[1], { kernel: 'lanczos3' }).png().toFile(join(OUT, `${name}.png`));
  console.log(name, JSON.stringify(clip));
  await context.close();
}
await browser.close();
