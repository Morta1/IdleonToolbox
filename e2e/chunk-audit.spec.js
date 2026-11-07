import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { firstExportedRoute } from './route-helpers';
import { waitForRender } from './wait-helpers';

// Asserts on the JS a page actually references, fetched the way a browser would. Chunk names
// are hashed, so a chunk is recognised by a string it must contain, not by its filename.
const FIREBASE_MARKER = '@firebase/';
const ITEMS_MARKER = '"displayName":"Copper_Ore"';

const scriptsOf = (html) => [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);

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

// GameIcon's sprite bounds (~530 KB) load as their own chunk after the page; no page ships them in its own scripts.
const SPRITE_BOUNDS_MARKER = '"data/Tach0_x1.png":[';

test('a page with game icons references no sprite-bounds chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, '/account/world-5/hole');
  expect(offenders(scripts, SPRITE_BOUNDS_MARKER)).toEqual([]);
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

// The What's new dialog and tour load only for the visitor who gets them. The gate's end date keeps them shut here, so a guest's
// whole visit fetches neither.
const WHATS_NEW_MARKER = 'Show me around';

test('a guest never downloads the What\'s new dialog', async ({ page, request }) => {
  // A marker that left the dialog would make this pass vacuously.
  expect(offenders(exportedChunks(path.join(process.cwd(), 'out', '_next', 'static')), WHATS_NEW_MARKER).length).toBeGreaterThan(0);
  await page.addInitScript(() => localStorage.setItem('authHint', 'no'));
  await page.goto('/');
  await waitForRender(page);
  await page.waitForTimeout(1500);
  expect(offenders(await loadedScripts(page, request), WHATS_NEW_MARKER)).toEqual([]);
});

// The guild pages read one pure helper from the parsers (parsers/guildLevel.ts): the data barrel (1.67 MB) was theirs
// for a guest until it left parsers/guild.ts.
for (const route of ['/guilds', '/guilds/detail']) {
  test(`a guest on ${route} fetches no game-data chunk`, async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem('authHint', 'no'));
    await page.goto(route);
    await waitForRender(page);
    await page.waitForTimeout(1500);
    expect(offenders(await loadedScripts(page, request), ITEMS_MARKER)).toEqual([]);
  });
}

// The first GameIcon that mounts starts the sprite-bounds download, not the module's import: a page that imports a
// card with an icon slot but draws no icon (Statistics' Panels) never asks for it.
test('a page with no game icon never downloads the sprite bounds', async ({ page, request }) => {
  await page.route(/\/visualizations$/, (route) => route.fulfill({
    status: 200,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: JSON.stringify({ topPrayers: [{ prayer: 1, count: 5 }, { prayer: 5, count: 3 }] })
  }));
  await page.goto('/statistics');
  await expect(page.getByText(/top prayers/i).first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  expect(offenders(await loadedScripts(page, request), SPRITE_BOUNDS_MARKER)).toEqual([]);
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

// The site draws its charts itself (bars and columns in HTML, lines in components/common/charts/LineChart): no
// chart library ships. TooltipWrapper is the displayName of the tooltip every nivo chart mounts; this test's first
// version proved the marker live while the guild page still drew nivo lines.
const NIVO_MARKER = 'TooltipWrapper';

test('no exported page ships nivo', () => {
  expect(offenders(exportedChunks(path.join(process.cwd(), 'out', '_next', 'static')), NIVO_MARKER)).toEqual([]);
});

// The wiki's search index (about 7,600 names, 167 KB gzipped) is the quick search's last group: it loads when
// the panel opens, never with a page. One of its rows, as the index writes it.
const WIKI_INDEX_MARKER = '"label":"Copper Ore","slug":"copper-ore"';

test('no page references the wiki search index', async ({ request }) => {
  for (const route of ['/', '/account/world-4/cooking', firstExportedRoute('wiki/monster')]) {
    const scripts = await referencedScripts(request, route);
    expect(offenders(scripts, WIKI_INDEX_MARKER), route).toEqual([]);
  }
});

test('the quick search loads the wiki index only once it opens', async ({ page, request }) => {
  await page.addInitScript(() => localStorage.setItem('authHint', 'no'));
  await page.goto('/');
  await waitForRender(page);
  expect(offenders(await loadedScripts(page, request), WIKI_INDEX_MARKER)).toEqual([]);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  // Also proves the marker exists, so the test above cannot pass vacuously.
  await expect.poll(async () => offenders(await loadedScripts(page, request), WIKI_INDEX_MARKER).length).toBeGreaterThan(0);
});
