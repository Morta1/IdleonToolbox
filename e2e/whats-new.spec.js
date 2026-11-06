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
const card = (page) => page.locator('[aria-labelledby="tour-title"]');
const mark = (page) => page.evaluate(() => localStorage.getItem('whatsNew'));
const startTour = async (page) => {
  await dialog(page).getByRole('button', { name: 'Show me around' }).click();
  await expect(card(page)).toBeVisible({ timeout: 30_000 });
};
const appLoaded = (page) => page.waitForFunction(() => window.next?.router?.isReady === true && !document.querySelector('[data-testid="page-loader"]'), null, { timeout: 60_000 });
// The gate checks on a short timer: this long with no dialog means none is coming.
const staysShut = async (page) => {
  await appLoaded(page);
  await page.waitForTimeout(2000);
  await expect(dialog(page)).toHaveCount(0);
};

test.describe('the dialog', () => {
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

  for (const [name, close] of [
    ['the x', (page) => dialog(page).getByRole('button', { name: 'Close' }).click()],
    ['Got it', (page) => dialog(page).getByRole('button', { name: 'Got it' }).click()],
    ['the backdrop', (page) => page.mouse.click(10, 400)]
  ]) {
    test(`${name} closes it`, async ({ page }) => {
      await open(page);
      await page.goto(STAMPS);
      await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
      await close(page);
      await expect(dialog(page)).toHaveCount(0);
      await expect(card(page)).toHaveCount(0);
    });
  }

  test('all four show with no scroll in a 1366 x 650 window', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 650 });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(dialog(page).getByText('Ctrl + K searches them all')).toBeVisible();
    await expect.poll(() => dialog(page).locator('.MuiDialogContent-root').evaluate((body) => body.scrollHeight - body.clientHeight)).toBe(0);
    await expect(dialog(page).locator('img')).toHaveCount(8);
    const broken = await dialog(page).locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode().then(() => null, () => image.src))));
    expect(broken.filter(Boolean)).toEqual([]);
  });

  for (const [width, height, lines, sheet] of [
    [1000, 800, ['Worlds and Account tabs', 'to the right of the page title'], false],
    [800, 800, ['Worlds and Account tabs', 'above the page title'], false],
    [384, 832, ['Worlds and Account tabs', 'above the page title'], true]
  ]) {
    test(`at ${width} wide only Got it shows, and the words fit the burger`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await open(page);
      await page.goto(STAMPS);
      await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
      for (const line of lines) await expect(dialog(page).getByText(line)).toBeVisible();
      await expect(dialog(page).getByText('top bar')).toHaveCount(0);
      await expect(dialog(page).getByRole('button', { name: 'Show me around' })).toHaveCount(0);
      await expect(dialog(page).getByRole('button', { name: 'Got it' })).toBeVisible();
      await expect(page.locator('.MuiDrawer-paper[role="dialog"]')).toHaveCount(sheet ? 1 : 0);
    });
  }
});

test.describe('who waits', () => {
  test('a stranger is marked skipped and gets nothing', async ({ page }) => {
    await open(page, { regular: false });
    await page.goto(STAMPS);
    await staysShut(page);
    expect(await mark(page)).toBe('"skipped"');
  });

  test('a full storage means no dialog', async ({ page }) => {
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

    test('someone who hasn\'t answered it doesn\'t get the dialog yet', async ({ page }) => {
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
  });
});

test.describe('the tour', () => {
  const stops = [
    ['1 of 4', 'Worlds and Account', ['Skip', 'Next']],
    ['2 of 4', 'Goals', ['Skip', 'Back', 'Next']],
    ['3 of 4', 'Dashboard timers', ['Skip', 'Back', 'Next']],
    ['4 of 4', 'Theme', ['Try light', 'Back', 'Done']]
  ];

  test('walks the four stops on the Dashboard, keeps the session, and goes back to where it started', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await expect(page).toHaveURL(/\/dashboard\?demo=true$/);
    for (const [count, title, buttons] of stops) {
      await expect(card(page).getByRole('heading', { name: title })).toBeVisible();
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
      if (title !== 'Theme') await card(page).getByRole('button', { name: 'Next' }).click();
    }
    await card(page).getByRole('button', { name: 'Back' }).click();
    await expect(card(page).getByText('3 of 4')).toBeVisible();
    await card(page).getByRole('button', { name: 'Next' }).click();
    await card(page).getByRole('button', { name: 'Done' }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/account\/world-1\/stamps\?demo=true$/);
  });

  test('stop 3 marks the table clear of the sticky pills, not the resets strip', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await card(page).getByRole('button', { name: 'Next' }).click();
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

  test('a reload ends it, and the dialog stays shut', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    await page.reload();
    await staysShut(page);
    await expect(card(page)).toHaveCount(0);
  });

  for (const [filters, count, heading] of [
    [['account', 'characters', 'timers'], '3', 'Dashboard timers'],
    [['goals', 'account', 'characters'], '3', 'Goals'],
    [['account', 'characters'], '2', 'Theme']
  ]) {
    test(`a stop switched off in the pills is skipped: ${filters.join(', ')}`, async ({ page }) => {
      await open(page, { storage: { 'dashboard-filters': JSON.stringify(filters), 'dashboard-goals-filter-added': 'true' } });
      await page.goto('/dashboard?demo=true');
      await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
      await startTour(page);
      await expect(card(page).getByText(`1 of ${count}`)).toBeVisible();
      await card(page).getByRole('button', { name: 'Next' }).click();
      await expect(card(page).getByRole('heading', { name: heading })).toBeVisible();
      await expect(card(page).getByText(`2 of ${count}`)).toBeVisible();
    });
  }

  test('a footer player: the theme switches live, back and on, and Done keeps it', async ({ page }) => {
    await open(page);
    await page.goto('/dashboard?demo=true');
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await startTour(page);
    for (let i = 0; i < 3; i += 1) await card(page).getByRole('button', { name: 'Next' }).click();
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
    // Goals don't draw on a profile view.
    await expect(card(page).getByText('1 of 3')).toBeVisible();
    await card(page).getByRole('button', { name: 'Next' }).click();
    await card(page).getByRole('button', { name: 'Next' }).click();
    await expect(card(page).getByRole('heading', { name: 'Theme' })).toBeVisible();
    const menu = page.locator('[data-tour="theme-menu"]');
    await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await menu.getByRole('menuitemradio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveClass(/\blight\b/);
    await menu.getByRole('menuitem', { name: 'Settings' }).click({ force: true });
    await expect(page).toHaveURL(/\/dashboard\?profile=Tester$/);
    await card(page).getByRole('button', { name: 'Back' }).click();
    await expect(menu).toHaveCount(0);
  });
});
