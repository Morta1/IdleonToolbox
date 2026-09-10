import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

// Asserts on the JS a page actually references, fetched the way a browser would. Chunk names
// are hashed, so a chunk is recognised by a string it must contain, not by its filename.
const FIREBASE_MARKER = '@firebase/';
const ITEMS_MARKER = '"displayName":"Copper_Ore"';

const scriptsOf = (html) => [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);

// Falls back rather than throwing: a readdir at collection time takes the whole file down before
// a test runs when out/ is missing, which reads as a broken spec instead of a missing build.
const firstWikiEntityRoute = () => {
  try {
    const dir = path.join(process.cwd(), 'out', 'wiki', 'monster');
    const file = readdirSync(dir).find((f) => f.endsWith('.html'));
    return `/wiki/monster/${file.replace(/\.html$/, '')}`;
  } catch {
    return '/wiki';
  }
};

const referencedScripts = async (request, route) => {
  const html = await (await request.get(route)).text();
  const sources = scriptsOf(html);
  expect(sources.length, `${route} references no scripts`).toBeGreaterThan(0);
  return Promise.all(sources.map(async (src) => ({ src, body: await (await request.get(src)).text() })));
};

const offenders = (scripts, marker) => scripts.filter(({ body }) => body.includes(marker)).map(({ src }) => src);

test('the home page references no firebase chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, '/');
  expect(offenders(scripts, FIREBASE_MARKER)).toEqual([]);
});

test('a wiki entity page references no firebase chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, firstWikiEntityRoute());
  expect(offenders(scripts, FIREBASE_MARKER)).toEqual([]);
});

test('a wiki entity page references no game-data items chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, firstWikiEntityRoute());
  expect(offenders(scripts, ITEMS_MARKER)).toEqual([]);
});

const loadedScriptUrls = (page) => page.evaluate(() =>
  performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.endsWith('.js')));

const loadedScripts = async (page, request) => {
  const urls = await loadedScriptUrls(page);
  return Promise.all(urls.map(async (url) => ({ src: url, body: await (await request.get(url)).text() })));
};

test.describe('firebase loads only when a session might exist', () => {
  test('a visitor whose last visit had no session never downloads firebase', async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem('authHint', 'no'));
    await page.goto('/');
    await waitForRender(page);
    // Give a wrongly-triggered dynamic import time to show up before reading the resource list.
    await page.waitForTimeout(1500);
    expect(offenders(await loadedScripts(page, request), FIREBASE_MARKER)).toEqual([]);
  });

  test('an undecided visitor downloads firebase once and is then marked as having no session', async ({ page, request }) => {
    await page.goto('/');
    await waitForRender(page);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('authHint'))).toBe('no');
    expect(offenders(await loadedScripts(page, request), FIREBASE_MARKER).length).toBeGreaterThan(0);
  });
});
