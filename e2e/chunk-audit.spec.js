import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

// Asserts on the JS a page actually references, fetched the way a browser would. Chunk names
// are hashed, so a chunk is recognised by a string it must contain, not by its filename.
const FIREBASE_MARKER = '@firebase/';
const ITEMS_MARKER = '"displayName":"Copper_Ore"';

const scriptsOf = (html) => [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);

// The first sorted out/<dir>/*.html not in `skip`. Falls back rather than throwing: a readdir at
// collection time takes the whole file down before a test runs when out/ is missing, which reads as
// a broken spec instead of a missing build.
const firstExportedRoute = (dir, { skip = [] } = {}) => {
  try {
    const file = readdirSync(path.join(process.cwd(), 'out', ...dir.split('/')))
      .filter((f) => f.endsWith('.html') && !skip.includes(f))
      .sort()[0];
    return `/${dir}/${file.replace(/\.html$/, '')}`;
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

// An entity, a system page and a moved listing: the last two share their routes with listings and entities.
for (const route of [firstExportedRoute('wiki/monster'), '/wiki/sneaking', '/wiki/equinox/upgrades']) {
  test(`a wiki page (${route}) references no firebase chunk`, async ({ request }) => {
    const scripts = await referencedScripts(request, route);
    expect(offenders(scripts, FIREBASE_MARKER)).toEqual([]);
  });

  test(`a wiki page (${route}) references no game-data items chunk`, async ({ request }) => {
    const scripts = await referencedScripts(request, route);
    expect(offenders(scripts, ITEMS_MARKER)).toEqual([]);
  });
}

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

// wikiTables is read only by the graph build. trapTimeUnits is one of its keys with no other source in app code,
// so a chunk holding it bundles wikiTables.json. Read inside the test: a missing out/ fails here, not at collection.
const WIKI_TABLES_MARKER = 'trapTimeUnits';
const exportedChunks = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return exportedChunks(full);
  return entry.name.endsWith('.js') ? [{ src: path.relative(process.cwd(), full), body: readFileSync(full, 'utf-8') }] : [];
});

// The wiki's client tables (utility/wiki/game-constants.mjs) are wiki-only data too: only wiki pages may load them. An app
// page that imports a wiki helper (utility/helpers.js re-exports growth) must reach it without effects.mjs.
const CLIENT_TABLES_MARKER = 'decayHundredthsBelow';
const exportedPages = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return entry.name === 'wiki' || entry.name === '_next' ? [] : exportedPages(full);
  return entry.name.endsWith('.html') ? [full] : [];
});

test('no page outside the wiki references a chunk with the wiki\'s client tables', () => {
  // A marker that left the module would make this pass vacuously, and so would a build that ships it nowhere.
  expect(readFileSync(path.join(process.cwd(), 'utility', 'wiki', 'game-constants.mjs'), 'utf-8')).toContain(CLIENT_TABLES_MARKER);
  const out = path.join(process.cwd(), 'out');
  expect(offenders(exportedChunks(path.join(out, '_next', 'static')), CLIENT_TABLES_MARKER).length).toBeGreaterThan(0);
  const pages = exportedPages(out);
  expect(pages.length).toBeGreaterThan(0);
  const bodies = new Map();
  const bodyOf = (src) => {
    if (!bodies.has(src)) bodies.set(src, readFileSync(path.join(out, src), 'utf-8'));
    return bodies.get(src);
  };
  const hits = pages.filter((page) => scriptsOf(readFileSync(page, 'utf-8'))
    .some((src) => src.startsWith('/_next/') && bodyOf(src).includes(CLIENT_TABLES_MARKER)));
  expect(hits.map((page) => path.relative(out, page).split(path.sep).join('/'))).toEqual([]);
});

test('no exported chunk carries a wiki-only table', () => {
  // A marker that left wikiTables would make this pass vacuously.
  const wikiTables = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'website-data', 'wikiTables.json'), 'utf-8'));
  expect(Object.keys(wikiTables)).toContain(WIKI_TABLES_MARKER);
  const chunks = exportedChunks(path.join(process.cwd(), 'out', '_next', 'static'));
  expect(chunks.length).toBeGreaterThan(0);
  expect(offenders(chunks, WIKI_TABLES_MARKER)).toEqual([]);
});
