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
const picture = (page) => dialog(page).getByTestId('before-after');
const lines = (page) => dialog(page).locator('li button');
const labels = (page) => picture(page).getByTestId('before-after-label');
const nextPicture = (page) => dialog(page).getByRole('button', { name: 'Next', exact: true });
const counter = (page, shown) => dialog(page).getByText(`${shown} of 4.`);
const linePos = (page) => picture(page).evaluate((node) => parseFloat(getComputedStyle(node).getPropertyValue('--pos')));
const dragLineTo = async (page, share) => {
  const box = await picture(page).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * share, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
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

  test('everything shows with no scroll in a 1366 x 650 window, and the picture is close to full size', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 650 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(dialog(page).getByText('Ctrl + K searches them all')).toBeVisible();
    await expect.poll(() => dialog(page).locator('.MuiDialogContent-root').evaluate((body) => body.scrollHeight - body.clientHeight)).toBe(0);
    await expect(lines(page)).toHaveCount(4);
    for (const line of await lines(page).all()) await expect(line).toBeInViewport({ ratio: 1 });
    await expect(picture(page)).toBeInViewport({ ratio: 1 });
    await expect(dialog(page).getByRole('button', { name: 'Show me around' })).toBeInViewport({ ratio: 1 });
    expect((await page.locator('.MuiDialog-paper').boundingBox()).width).toBe(960);
    expect((await picture(page).boundingBox()).width).toBeGreaterThanOrEqual(585);
    await expect(dialog(page).locator('img')).toHaveCount(2);
    const broken = await dialog(page).locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode().then(() => null, () => image.src))));
    expect(broken.filter(Boolean)).toEqual([]);
  });

  test('at 1366 x 768 the picture is its full 614 x 337', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    const { width, height } = await picture(page).boundingBox();
    expect(Math.round(width)).toBe(614);
    expect(Math.round(height)).toBe(337);
    await expect.poll(() => dialog(page).locator('.MuiDialogContent-root').evaluate((body) => body.scrollHeight - body.clientHeight)).toBe(0);
  });

  for (const [width, height, words, sheet, stacked] of [
    [1000, 800, ['Worlds and Account tabs', 'to the right of the page title'], false, false],
    [800, 800, ['Worlds and Account tabs', 'above the page title'], false, true],
    [384, 832, ['Worlds and Account tabs', 'above the page title'], true, true]
  ]) {
    test(`at ${width} wide only Got it shows, the words fit the burger, and every picture is one height`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page);
      await page.goto(STAMPS);
      await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
      for (const line of words) await expect(dialog(page).getByText(line)).toBeVisible();
      await expect(dialog(page).getByText('top bar')).toHaveCount(0);
      await expect(dialog(page).getByRole('button', { name: 'Show me around' })).toHaveCount(0);
      await expect(dialog(page).getByRole('button', { name: 'Got it' })).toBeVisible();
      await expect(page.locator('.MuiDrawer-paper[role="dialog"]')).toHaveCount(sheet ? 1 : 0);
      const stage = await picture(page).boundingBox();
      const list = await lines(page).first().boundingBox();
      expect(stacked ? list.y > stage.y + stage.height : list.x + list.width <= stage.x).toBe(true);
      if (!sheet) await expect.poll(() => dialog(page).locator('.MuiDialogContent-root').evaluate((body) => body.scrollHeight - body.clientHeight)).toBe(0);
      const heights = [Math.round(stage.height)];
      for (let i = 0; i < 3; i += 1) {
        await nextPicture(page).click();
        await expect(counter(page, i + 2)).toBeVisible();
        heights.push(Math.round((await picture(page).boundingBox()).height));
      }
      expect(new Set(heights).size).toBe(1);
    });
  }
});

test.describe('the picture', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(picture(page)).toBeVisible();
  });

  test('dragging moves the line, and it starts at the middle', async ({ page }) => {
    expect(await linePos(page)).toBe(50);
    await dragLineTo(page, 0.25);
    expect(await linePos(page)).toBeCloseTo(25, 0);
    // The upper picture is cut at the line.
    expect(await picture(page).locator('img').last().evaluate((image) => getComputedStyle(image).clipPath)).toMatch(/^inset\(0px 7[45](\.\d+)?% 0px 0px\)$/);
  });

  test('the arrow keys carry on from a drag, 2 at a time, with the focus still on the range', async ({ page }) => {
    await dragLineTo(page, 0.3);
    await expect(picture(page).getByRole('slider')).toBeFocused();
    const value = Number(await picture(page).getByRole('slider').inputValue());
    await page.keyboard.press('ArrowRight');
    expect(await linePos(page)).toBe(value + 2);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    expect(await linePos(page)).toBe(value - 2);
    await expect(picture(page).getByRole('slider')).toBeFocused();
  });

  test('the knob shows the focus ring from the keyboard, not from a drag', async ({ page }) => {
    const ring = () => picture(page).locator('[data-knob]').evaluate((knob) => getComputedStyle(knob).outlineStyle);
    await dragLineTo(page, 0.4);
    expect(await ring()).toBe('none');
    await page.keyboard.press('ArrowRight');
    expect(await ring()).toBe('solid');
    await dragLineTo(page, 0.6);
    expect(await ring()).toBe('none');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(picture(page).getByRole('slider')).toBeFocused();
    expect(await ring()).toBe('solid');
  });

  test('each label rides on its own side and fades when that side has no room', async ({ page }) => {
    const seen = () => labels(page).evaluateAll((all) => all.map((label) => getComputedStyle(label).opacity));
    const [before, after] = await labels(page).all();
    await expect(before).toHaveText('Before');
    await expect(after).toHaveText('After');
    expect(await seen()).toEqual(['1', '1']);
    await dragLineTo(page, 0);
    expect(await seen()).toEqual(['0', '1']);
    await dragLineTo(page, 1);
    expect(await seen()).toEqual(['1', '0']);
    await dragLineTo(page, 0.5);
    expect(await seen()).toEqual(['1', '1']);
    const line = await picture(page).locator('[data-line]').boundingBox();
    expect((await before.boundingBox()).x + (await before.boundingBox()).width).toBeLessThan(line.x);
    expect((await after.boundingBox()).x).toBeGreaterThan(line.x);
  });

  test('clicking a line swaps the picture and sets the line back to the middle', async ({ page }) => {
    await dragLineTo(page, 0.2);
    await expect(lines(page).nth(0)).toHaveAttribute('aria-current', 'true');
    await lines(page).nth(2).click();
    await expect(lines(page).nth(2)).toHaveAttribute('aria-current', 'true');
    await expect(lines(page).nth(0)).not.toHaveAttribute('aria-current');
    await expect(counter(page, 3)).toBeVisible();
    await expect(picture(page).locator('img').first()).toHaveAttribute('src', /timers-after\.webp$/);
    await expect(picture(page).locator('img').last()).toHaveAttribute('src', /timers-before\.webp$/);
    expect(await linePos(page)).toBe(50);
  });

  test('the Theme pair reads Dark and Light', async ({ page }) => {
    await lines(page).nth(3).click();
    await expect(labels(page)).toHaveText(['Dark', 'Light']);
    await expect(picture(page).locator('img').first()).toHaveAttribute('src', /theme-light\.webp$/);
  });

  test('Next goes through all four and back to the first', async ({ page }) => {
    for (const shown of [2, 3, 4, 1]) {
      await nextPicture(page).click();
      await expect(counter(page, shown)).toBeVisible();
      await expect(lines(page).nth(shown - 1)).toHaveAttribute('aria-current', 'true');
    }
  });
});

test('every picture of this width is fetched once it\'s open, and none before', async ({ page }) => {
  const asked = new Set();
  page.on('request', (request) => {
    if (request.url().includes('/etc/whatsnew/')) asked.add(request.url());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, { regular: false });
  await page.goto(STAMPS);
  await staysShut(page);
  expect(asked.size).toBe(0);
  await open(page);
  await page.evaluate(() => localStorage.removeItem('whatsNew'));
  await page.reload();
  await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
  await expect.poll(() => [...asked].filter((url) => !url.includes('/phone-')).length).toBe(8);
  expect(asked.size).toBe(8);
});

test.describe('the sweep', () => {
  const positions = (page, ms) => picture(page).evaluate((node, time) => new Promise((resolve) => {
    const seen = new Set();
    const end = performance.now() + time;
    const tick = () => {
      seen.add(parseFloat(getComputedStyle(node).getPropertyValue('--pos')));
      if (performance.now() < end) requestAnimationFrame(tick);
      else resolve([...seen]);
    };
    tick();
  }), ms);

  test('the line sweeps the first time each picture shows, and not again', async ({ page }) => {
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(picture(page)).toBeVisible();
    await expect.poll(() => linePos(page), { intervals: [50] }).not.toBe(50);
    await expect.poll(() => linePos(page), { timeout: 5000 }).toBe(50);
    await nextPicture(page).click();
    await expect.poll(() => linePos(page), { intervals: [50] }).not.toBe(50);
    await expect.poll(() => linePos(page), { timeout: 5000 }).toBe(50);
    await lines(page).nth(0).click();
    await expect(counter(page, 1)).toBeVisible();
    expect(await positions(page, 500)).toEqual([50]);
  });

  test('prefers-reduced-motion: it stays still', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(picture(page)).toBeVisible();
    expect(await positions(page, 800)).toEqual([50]);
  });
});

// Real touches through the browser's own gesture handling, so touch-action and the sheet's listeners both get their say.
test.describe('on a touch phone', () => {
  test.use({ viewport: { width: 384, height: 832 }, hasTouch: true, isMobile: true });

  const touch = async (page, points) => {
    const client = await page.context().newCDPSession(page);
    const [first, ...rest] = points;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
    for (const point of rest) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
      await page.waitForTimeout(16);
    }
    return { end: () => client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) };
  };
  const stroke = (from, to, steps = 10) => Array.from({ length: steps + 1 }, (_, step) => ({
    x: from.x + ((to.x - from.x) * step) / steps, y: from.y + ((to.y - from.y) * step) / steps
  }));
  const sheet = (page) => page.locator('.MuiDrawer-paper[role="dialog"]');
  const sheetTop = async (page) => Math.round((await sheet(page).boundingBox()).y);
  const onPicture = async (page, across = 0.5) => {
    const box = await picture(page).boundingBox();
    return { x: box.x + box.width * across, y: box.y + box.height / 2 };
  };

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await page.goto(STAMPS);
    await expect(dialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(picture(page)).toBeVisible();
    // The sheet has slid in.
    await expect.poll(() => sheetTop(page)).toBeLessThan(832 * 0.5);
    await page.waitForTimeout(400);
  });

  test('a drag along the picture moves the line and leaves the sheet where it is', async ({ page }) => {
    const top = await sheetTop(page);
    const from = await onPicture(page, 0.5);
    const gesture = await touch(page, stroke(from, { x: from.x - 100, y: from.y + 30 }));
    expect(await linePos(page)).toBeLessThan(30);
    expect(await sheetTop(page)).toBe(top);
    await gesture.end();
    await expect(sheet(page)).toBeVisible();
    expect(await sheetTop(page)).toBe(top);
  });

  test('a swipe down that starts on the picture is the sheet\'s, and the line doesn\'t move on its way', async ({ page }) => {
    const top = await sheetTop(page);
    const from = await onPicture(page, 0.25);
    const gesture = await touch(page, stroke(from, { x: from.x + 60, y: from.y + 280 }));
    expect(await sheetTop(page)).toBeGreaterThan(top + 100);
    expect(await linePos(page)).toBe(50);
    await gesture.end();
    await expect(dialog(page)).toHaveCount(0);
  });

  test('a tap on the picture moves the line there', async ({ page }) => {
    const from = await onPicture(page, 0.8);
    const gesture = await touch(page, [from]);
    expect(await linePos(page)).toBe(50);
    await gesture.end();
    await expect.poll(() => linePos(page)).toBeCloseTo(80, 0);
    expect(await sheet(page).isVisible()).toBe(true);
  });

  test('a swipe down from the title still closes the sheet', async ({ page }) => {
    const box = await dialog(page).getByRole('heading', { name: 'What\'s new' }).boundingBox();
    const from = { x: box.x + 10, y: box.y + box.height / 2 };
    const gesture = await touch(page, stroke(from, { x: from.x, y: from.y + 400 }));
    await gesture.end();
    await expect(dialog(page)).toHaveCount(0);
  });
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
    ['1 of 5', 'Worlds and Account', ['Skip', 'Next'], /\/dashboard\?demo=true$/],
    ['2 of 5', 'Goals', ['Skip', 'Back', 'Next'], /\/dashboard\?demo=true$/],
    ['3 of 5', 'Dashboard timers', ['Skip', 'Back', 'Next'], /\/dashboard\?demo=true$/],
    ['4 of 5', 'Inside a page', ['Skip', 'Back', 'Next'], /\/account\/world-1\/stamps\?demo=true$/],
    ['5 of 5', 'Theme', ['Try light', 'Back', 'Done'], /\/account\/world-1\/stamps\?demo=true$/]
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
    await atStop(page, 'Inside a page');
    await card(page).getByRole('button', { name: 'Back' }).click();
    await atStop(page, 'Dashboard timers');
    await expect(page).toHaveURL(/\/dashboard\?demo=true$/);
    await next(page);
    await atStop(page, 'Inside a page');
    await next(page);
    await atStop(page, 'Theme');
    await card(page).getByRole('button', { name: 'Done' }).click();
    await expect(card(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/account\/world-1\/stamps\?demo=true$/);
    // Everything it pushed went at once: the entry behind the start is the visit's own, not a stop of the tour.
    await expect.poll(() => page.evaluate(() => window.history.state?.as)).toBe('/account/world-1/stamps?demo=true');
  });

  const toPageStop = async (page) => {
    for (let i = 0; i < 3; i += 1) await next(page);
    await atStop(page, 'Inside a page');
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
    await atStop(page, 'Inside a page');
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
    for (let i = 0; i < 3; i += 1) await next(page);
    await atStop(page, 'Theme');
    await expect(card(page).getByText('5 of 5')).toBeVisible();
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
    [['account', 'characters', 'timers'], '4', 'Dashboard timers'],
    [['goals', 'account', 'characters'], '4', 'Goals'],
    [['account', 'characters'], '3', 'Inside a page']
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
    // Goals don't draw on a profile view.
    await expect(card(page).getByText('1 of 4')).toBeVisible();
    await next(page);
    await next(page);
    await atStop(page, 'Inside a page');
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
