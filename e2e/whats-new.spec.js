import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// The gate's end date defaults to the past, so every test opens it with the override the kit uses. A regular here has a pinned
// page; the rest of who counts as one, and the storage cases, are in __test__/utility/whatsNew.test.js.
const STAMPS = '/account/world-1/stamps?demo=true';
const answered = {
  cookies: [{ name: 'idleon-consent', value: 'false', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
  origins: []
};

test.use({ storageState: answered, viewport: { width: 1366, height: 768 } });
test.describe.configure({ timeout: 90_000 });

const open = (page, { anyView = true, regular = true, storage = {} } = {}) => page.addInitScript(([view, pins, entries]) => {
  if (window !== window.top) return;
  window.__whatsNewKit = { until: '2099-01-01T00:00:00Z', anyView: view };
  if (pins) localStorage.setItem('pinnedPages', JSON.stringify([{ name: 'stamps', url: '/account/world-1/stamps' }]));
  Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
}, [anyView, regular, storage]);

const dialog = (page) => page.getByRole('dialog', { name: 'What\'s new' });
const replayLink = (page) => page.getByRole('button', { name: 'Watch the story again' });
const atSlide = (page, step) => expect(dialog(page)).toHaveAttribute('data-step', step, { timeout: 15_000 });
// The last slide is two layers with the same words: only the one showing can be reached.
const action = (page, name) => dialog(page).locator('button:not([inert] *)', { hasText: name });
const lastHeading = (page) => dialog(page).locator('h2:not([inert] *)');
const skip = async (page) => {
  await dialog(page).getByRole('button', { name: 'Skip' }).click();
  await atSlide(page, 'lights');
};
const card = (page) => page.locator('[aria-labelledby="tour-title"]');
const mark = (page) => page.evaluate(() => localStorage.getItem('whatsNew'));
// The card's words change as Next is pressed, and it stays unseen until the page under it has arrived.
const arrived = (page) => expect.poll(() => card(page).evaluate((node) => getComputedStyle(node).opacity), { timeout: 30_000 }).toBe('1');
const next = async (page) => {
  await arrived(page);
  await card(page).getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(50);
};
const atStop = async (page, title) => {
  await expect(card(page).getByRole('heading', { name: title })).toBeVisible({ timeout: 30_000 });
  await arrived(page);
};
const startTour = async (page) => {
  await skip(page);
  await action(page, 'Show me around').click();
  await expect(card(page)).toBeVisible({ timeout: 30_000 });
};
const appLoaded = (page) => page.waitForFunction(() => window.next?.router?.isReady === true && !document.querySelector('[data-testid="page-loader"]'), null, { timeout: 60_000 });
// The gate checks on a short timer: this long with no story means none is coming.
const staysShut = async (page) => {
  await appLoaded(page);
  await page.waitForTimeout(2000);
  await expect(dialog(page)).toHaveCount(0);
};
const walkers = (page) => page.evaluate(() => [...document.querySelectorAll('[data-walker]')].map((slot) => {
  const doll = slot.querySelector('canvas');
  const pixels = doll.getContext('2d').getImageData(0, 0, doll.width, doll.height).data;
  return { x: slot.getBoundingClientRect().left, facing: doll.dataset.facing, name: doll.dataset.doll, drawn: pixels.some((value) => value > 0) };
}));

test.describe('the story', () => {
  test('a regular gets it once: a reload stays shut', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    expect(await mark(page)).toBe('"shown"');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await page.reload();
    await staysShut(page);
  });

  test('Got it closes it, and starts no tour', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await skip(page);
    await expect(dialog(page).getByRole('button', { name: 'Skip' })).toHaveCount(0);
    await action(page, 'Got it').click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(card(page)).toHaveCount(0);
  });

  test('it greets the player by name, draws all their characters, and each walks the way it faces', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(400);
    const before = await walkers(page);
    await page.waitForTimeout(250);
    const after = await walkers(page);
    await expect(dialog(page).getByRole('heading')).toHaveText(`${before[0].name}, the Toolbox got rebuilt.`);
    await expect(dialog(page).getByText(`Your ${before.length} characters are all here.`)).toBeVisible();
    expect(after.every(({ drawn }) => drawn)).toBe(true);
    const moved = before.map(({ x, facing }, at) => ({ facing, by: after[at].x - x })).filter(({ by }) => by !== 0);
    expect(moved.length).toBeGreaterThan(0);
    // The sheets face right: a character mirrored the wrong way moonwalks.
    for (const { facing, by } of moved) expect(by > 0 ? 'right' : 'left').toBe(facing);
    expect(new Set(moved.map(({ facing }) => facing))).toEqual(new Set(['left', 'right']));
  });

  test('its count of what\'s ready is the Timers table\'s own', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await dialog(page).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await atSlide(page, 'timers');
    const count = await dialog(page).locator('[data-count]').getAttribute('data-count');
    await expect(dialog(page).locator('[data-count]')).toHaveText(count);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-tour="timers"]').getByText(`${count} to act on`)).toBeVisible({ timeout: 30_000 });
  });

  test('it plays by itself, and a hold pauses it without moving on', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await page.mouse.move(700, 300);
    await page.mouse.down();
    await page.waitForTimeout(5600);
    await atSlide(page, 'hello');
    await page.mouse.up();
    await page.waitForTimeout(200);
    await atSlide(page, 'hello');
    await atSlide(page, 'menus');
    const steps = await page.evaluate(() => window.dataLayer.filter((entry) => entry[1] === 'whats_new_story_step').map((entry) => entry[2].step));
    expect(steps).toEqual(['hello', 'menus']);
  });

  test('a tap moves on, its left side goes back, and so do the arrow keys', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await page.mouse.click(900, 300);
    await atSlide(page, 'menus');
    await page.mouse.click(100, 300);
    await atSlide(page, 'hello');
    await dialog(page).focus();
    await page.keyboard.press('ArrowRight');
    await atSlide(page, 'menus');
    await page.keyboard.press('ArrowLeft');
    await atSlide(page, 'hello');
  });

  test('prefers-reduced-motion: nothing plays by itself, and everybody already stands in place', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(600);
    const before = await walkers(page);
    await page.waitForTimeout(5400);
    await atSlide(page, 'hello');
    const after = await walkers(page);
    expect(after.map(({ x }) => x)).toEqual(before.map(({ x }) => x));
    expect(after.every(({ drawn }) => drawn)).toBe(true);
    await page.mouse.click(900, 300);
    await atSlide(page, 'menus');
    await expect(dialog(page).locator('canvas')).toHaveCount(0);
  });

  test('all of the last slide shows with no scroll in a 1366 x 650 window', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 650 });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await skip(page);
    await expect(dialog(page).getByText('Ctrl + K searches them all').first()).toBeVisible();
    for (const name of ['Show me around', 'Got it']) await expect(action(page, name)).toBeInViewport({ ratio: 1 });
    await expect(lastHeading(page)).toBeInViewport({ ratio: 1 });
  });

  for (const [width, height] of [[1000, 800], [800, 800], [384, 832], [360, 640]]) {
    test(`at ${width} wide only Got it shows, and the words fit the burger`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await open(page);
      await page.goto(STAMPS);
      await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
      await dialog(page).focus();
      await page.keyboard.press('ArrowRight');
      await atSlide(page, 'menus');
      await expect(dialog(page).getByText('Worlds and Account tabs')).toBeVisible();
      await expect(dialog(page).getByText('top bar')).toHaveCount(0);
      await skip(page);
      await expect(action(page, 'Show me around')).toHaveCount(0);
      await expect(action(page, 'Got it')).toBeInViewport({ ratio: 1 });
      await expect(lastHeading(page)).toBeInViewport({ ratio: 1 });
      await expect(page.locator('[data-walker]').last()).toBeInViewport({ timeout: 8000 });
    });
  }

  test('with no save it keeps the story and makes no claims about the player', async ({ page }) => {
    await open(page, { storage: { authHint: '"no"' } });
    await page.goto('/patch-notes');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(dialog(page).getByRole('heading')).toHaveText('The Toolbox got rebuilt.');
    await expect(dialog(page).getByText('characters')).toHaveCount(0);
    await page.waitForTimeout(400);
    expect((await walkers(page)).every(({ drawn }) => drawn)).toBe(true);
    await dialog(page).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await atSlide(page, 'timers');
    await expect(dialog(page).locator('[data-count]')).toHaveCount(0);
    await expect(dialog(page).getByText('Ready now')).toBeVisible();
  });

  test('the wipe only shows the light theme off, and the toggle really sets it', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await skip(page);
    await expect(action(page, 'Light')).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await action(page, 'Dark').click();
    await expect(action(page, 'Dark')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await action(page, 'Light').click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    await action(page, 'Got it').click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
  });

  test('the patch notes link closes it, and keeps the session', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await skip(page);
    await dialog(page).locator('a:not([inert] *)', { hasText: 'patch notes' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/patch-notes\?demo=true$/);
  });

  test('the patch note\'s link replays it past the end date, as often as asked, and counts apart', async ({ page }) => {
    await page.addInitScript(() => {
      if (window !== window.top) return;
      window.__whatsNewKit = { until: '2000-01-01T00:00:00Z' };
      localStorage.setItem('whatsNew', '"shown"');
    });
    await page.goto('/patch-notes');
    await staysShut(page);
    await replayLink(page).click();
    await atSlide(page, 'hello');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await replayLink(page).click();
    await atSlide(page, 'hello');
    expect(await mark(page)).toBe('"shown"');
    const counted = await page.evaluate(() => window.dataLayer.filter((entry) => /^whats_new_(open|replay)$/.test(entry[1])).map((entry) => entry[1]));
    expect(counted).toEqual(['whats_new_replay', 'whats_new_replay']);
  });

  test('Home carries the link, for a stranger too', async ({ page }) => {
    await open(page, { regular: false });
    await page.goto('/');
    await staysShut(page);
    await replayLink(page).click();
    await expect(dialog(page).getByRole('heading')).toHaveText('The Toolbox got rebuilt.', { timeout: 15_000 });
    expect(await mark(page)).toBe('"skipped"');
  });
});

test.describe('who waits', () => {
  test('a stranger is marked skipped, gets nothing, and loads none of it', async ({ page }) => {
    const fetched = [];
    page.on('request', (request) => {
      if (/Lilita|player-sprites|etc\/whatsnew/.test(request.url())) fetched.push(request.url());
    });
    await open(page, { regular: false });
    await page.goto(STAMPS);
    await staysShut(page);
    expect(await mark(page)).toBe('"skipped"');
    expect(fetched).toEqual([]);
  });

  test('a full storage means no story', async ({ page }) => {
    await open(page);
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function failing(key, value) {
        if (key === 'whatsNew') throw new DOMException('full', 'QuotaExceededError');
        return setItem.call(this, key, value);
      };
    });
    await page.goto(STAMPS);
    await staysShut(page);
  });

  test('not on the demo: the next plain visit gets it', async ({ page }) => {
    await open(page, { anyView: false, storage: { authHint: 'no' } });
    await page.goto(STAMPS);
    await staysShut(page);
    expect(await mark(page)).toBeNull();
    await page.goto('/patch-notes');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
  });

  test.describe('the consent banner', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('someone who hasn\'t answered it doesn\'t get the story yet', async ({ page }) => {
      await open(page, { anyView: false, storage: { authHint: 'no' } });
      // Nitro in, with no consent window: what shows the site's own banner.
      await page.route('**/s.nitropay.com/**', (route) => route.abort());
      await page.addInitScript(() => {
        if (window === window.top) window.nitroAds = { loaded: true, createAd: () => Promise.resolve(), queue: [] };
      });
      await page.goto('/patch-notes');
      const banner = page.locator('.CookieConsent');
      await expect(banner).toBeVisible({ timeout: 30_000 });
      await staysShut(page);
      expect(await mark(page)).toBeNull();
      await banner.getByRole('button', { name: 'Accept' }).click();
      await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
    });

    test('started by hand while it waits, it doesn\'t open again', async ({ page }) => {
      await open(page, { anyView: false, storage: { authHint: 'no' } });
      await page.route('**/s.nitropay.com/**', (route) => route.abort());
      await page.addInitScript(() => {
        if (window === window.top) window.nitroAds = { loaded: true, createAd: () => Promise.resolve(), queue: [] };
      });
      await page.goto('/patch-notes');
      const banner = page.locator('.CookieConsent');
      await expect(banner).toBeVisible({ timeout: 30_000 });
      await replayLink(page).click();
      await atSlide(page, 'hello');
      await page.keyboard.press('Escape');
      await expect(dialog(page)).toHaveCount(0);
      await banner.getByRole('button', { name: 'Accept' }).click();
      await staysShut(page);
      await page.reload();
      await staysShut(page);
    });
  });
});

test.describe('the tour', () => {
  const stops = [
    ['1 of 4', 'Worlds and Account', ['Skip', 'Next'], /\/dashboard\?demo=true$/],
    ['2 of 4', 'Dashboard timers', ['Skip', 'Back', 'Next'], /\/dashboard\?demo=true$/],
    ['3 of 4', 'Page settings', ['Skip', 'Back', 'Next'], /\/account\/world-1\/stamps\?demo=true$/],
    ['4 of 4', 'Theme', ['Try light', 'Back', 'Done'], /\/account\/world-1\/stamps\?demo=true$/]
  ];

  test('walks the Dashboard, then a page, keeps the session, and goes back to where it started', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await expect(page).toHaveURL(/\/dashboard\?demo=true$/);
    for (const [count, title, buttons, url] of stops) {
      await atStop(page, title);
      await expect(page).toHaveURL(url);
      await expect(card(page).getByText(count)).toBeVisible();
      await expect(card(page).getByRole('button')).toHaveText(buttons);
      // Focus stays in the card, and the card stays in the window.
      const inCard = await card(page).evaluate((node) => node.contains(document.activeElement));
      expect(inCard).toBe(true);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      expect(await card(page).evaluate((node) => node.contains(document.activeElement))).toBe(true);
      const box = await card(page).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1366);
      expect(box.y + box.height).toBeLessThanOrEqual(768);
      if (title !== 'Theme') await next(page);
    }
    await card(page).getByRole('button', { name: 'Back' }).click();
    await atStop(page, 'Page settings');
    await card(page).getByRole('button', { name: 'Back' }).click();
    await atStop(page, 'Dashboard timers');
    await expect(page).toHaveURL(/\/dashboard\?demo=true$/);
    await next(page);
    await atStop(page, 'Page settings');
    await next(page);
    await atStop(page, 'Theme');
    await card(page).getByRole('button', { name: 'Done' }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/account\/world-1\/stamps\?demo=true$/);
    // Everything it pushed went at once: the entry behind the start is the visit's own, not a stop of the tour.
    await expect.poll(() => page.evaluate(() => window.history.state?.as)).toBe('/account/world-1/stamps?demo=true');
  });

  const toPageStop = async (page) => {
    for (let i = 0; i < 2; i += 1) await next(page);
    await atStop(page, 'Page settings');
  };

  test('the page stop marks Pin, Add goal and Page settings together, with the card in the window', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await toPageStop(page);
    const group = page.locator('[data-tour="page-actions"]');
    for (const name of [/Pin/, /Add goal/, /Page settings/]) await expect(group.getByRole('button', { name })).toBeVisible();
    const box = await card(page).boundingBox();
    const buttons = await group.boundingBox();
    // Clear of the bar and the band: a scroll left over from the stop before can put them under it.
    expect(buttons.y).toBeGreaterThanOrEqual(96);
    expect(box.y).toBeGreaterThan(buttons.y + buttons.height);
    expect(box.x + box.width).toBeLessThanOrEqual(1366);
    expect(box.y + box.height).toBeLessThanOrEqual(768);
  });

  test('Back from the theme at the page\'s end brings the buttons into view again', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await toPageStop(page);
    await next(page);
    await atStop(page, 'Theme');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    await card(page).getByRole('button', { name: 'Back' }).click();
    await atStop(page, 'Page settings');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect((await page.locator('[data-tour="page-actions"]').boundingBox()).y).toBeGreaterThanOrEqual(96);
  });

  test('started on the Dashboard, Done from the page goes back to the Dashboard', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await toPageStop(page);
    await next(page);
    await atStop(page, 'Theme');
    await card(page).getByRole('button', { name: 'Done' }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard\?demo=true$/);
  });

  test('the browser\'s Back on the page stop ends it, there on the Dashboard', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await toPageStop(page);
    await page.goBack();
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/dashboard\?demo=true$/);
  });

  test('a page whose buttons never come is passed over', async ({ page }) => {
    await open(page);
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = '[data-tour="page-actions"] { visibility: hidden !important; }';
        document.head.append(style);
      });
    });
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    for (let i = 0; i < 2; i += 1) await next(page);
    await atStop(page, 'Theme');
    await expect(card(page).getByText('4 of 4')).toBeVisible();
  });

  test('the timers stop marks the table clear of the sticky pills, not the resets strip', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await card(page).getByRole('button', { name: 'Next' }).click();
    await expect(card(page).getByRole('heading', { name: 'Dashboard timers' })).toBeVisible();
    // A smooth scroll is on its way.
    const settled = () => page.evaluate(() => {
      const table = document.querySelector('[data-tour="timers"]').getBoundingClientRect();
      const pills = document.querySelector('[data-tour="pills"]').getBoundingClientRect();
      return { gap: Math.round(table.top - pills.bottom), inWindow: table.top < innerHeight };
    });
    await expect.poll(async () => (await settled()).gap).toBeGreaterThanOrEqual(12);
    await expect.poll(async () => (await settled()).inWindow).toBe(true);
  });

  test('prefers-reduced-motion: the page jumps to a stop, and Ctrl + K opens no search under the dim', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      const scrollTo = window.scrollTo.bind(window);
      window.__scrolls = [];
      window.scrollTo = (options) => {
        window.__scrolls.push(options.behavior);
        scrollTo(options);
      };
    });
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await card(page).getByRole('button', { name: 'Next' }).click();
    await expect(card(page).getByRole('heading', { name: 'Dashboard timers' })).toBeVisible();
    expect(await page.evaluate(() => window.__scrolls)).toEqual(['auto']);
  });

  test('Skip goes back, and Esc is Skip', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await page.keyboard.press('Escape');
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/account\/world-1\/stamps\?demo=true$/);
  });

  test('the browser\'s Back ends it, and so does any other route change', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await page.goBack();
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/account\/world-1\/stamps\?demo=true$/);
  });

  test('a route change it didn\'t start ends it, where that change went', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await page.evaluate(() => window.next.router.push('/patch-notes?demo=true'));
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/patch-notes\?demo=true$/);
  });

  test('a reload ends it, and the story stays shut', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await page.reload();
    await staysShut(page);
    await expect(card(page)).toHaveCount(0);
  });

  for (const [filters, count, heading] of [
    [['account', 'characters', 'timers'], '4', 'Dashboard timers'],
    [['account', 'characters'], '3', 'Page settings']
  ]) {
    test(`a stop switched off in the pills is skipped: ${filters.join(', ')}`, async ({ page }) => {
      await open(page, { storage: { 'dashboard-filters': JSON.stringify(filters), 'dashboard-goals-filter-added': 'true' } });
      await page.goto('/dashboard?demo=true');
      await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
      await startTour(page);
      await expect(card(page).getByText(`1 of ${count}`)).toBeVisible();
      await next(page);
      await atStop(page, heading);
      await expect(card(page).getByText(`2 of ${count}`)).toBeVisible();
    });
  }

  test('a footer player: the theme switches live, back and on, and Done keeps it', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await toPageStop(page);
    await next(page);
    await atStop(page, 'Theme');
    await expect(page.locator('[data-tour="theme-menu"]')).toBeVisible();
    await card(page).getByRole('button', { name: 'Try light' }).click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    await card(page).getByRole('button', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await page.locator('[data-tour="theme-menu"]').getByRole('menuitemradio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    await expect(page.locator('[data-tour="theme-menu"]')).toBeVisible();
    await card(page).getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('[data-tour="theme-menu"]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
  });

  // No real sign-in: a profile view has the same UserMenu as a signed-in player, served from the demo's own save.
  test('a player with a user menu gets it opened, and its other rows don\'t lead away', async ({ page }) => {
    const save = readFileSync(path.join(process.cwd(), 'data', 'raw.json'), 'utf-8');
    await page.route(/\/profiles\/\?profile=/, (route) => route.fulfill({
      status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: save
    }));
    await open(page, { storage: { authHint: 'no' } });
    await page.goto('/dashboard?profile=Tester');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await expect(card(page).getByText('1 of 4')).toBeVisible();
    await next(page);
    await next(page);
    await atStop(page, 'Page settings');
    await next(page);
    await atStop(page, 'Theme');
    const menu = page.locator('[data-tour="theme-menu"]');
    await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await menu.getByRole('menuitemradio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    await menu.getByRole('menuitem', { name: 'Settings' }).click({ force: true });
    await expect(page).toHaveURL(/\/account\/world-1\/stamps\?profile=Tester$/);
    await card(page).getByRole('button', { name: 'Back' }).click();
    await expect(menu).toHaveCount(0);
  });
});
