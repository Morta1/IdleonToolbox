import { test, expect } from '@playwright/test';

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
const mark = (page) => page.evaluate(() => localStorage.getItem('whatsNew'));
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
