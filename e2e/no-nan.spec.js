import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

const PAGES_DIR = path.join(process.cwd(), 'pages');

const discoverRoutes = () => {
  const routes = [];
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}/${entry}`);
        continue;
      }
      if (!entry.endsWith('.jsx')) continue;
      const name = entry.replace(/\.jsx$/, '');
      if (['_app', '_document', '_error', '404'].includes(name)) continue;
      routes.push(name === 'index' ? (prefix || '/') : `${prefix}/${name}`);
    }
  };
  walk(PAGES_DIR);
  return routes.sort();
};

const NEEDS_QUERY_PARAM = new Map([
  ['/guilds/detail', 'needs a real ?name= (or similar) identifying a guild to render'],
  ['/tools/builds/view', 'needs a real ?id= identifying a saved build to render'],
  ['/tools/builds/edit', 'needs a real ?id= identifying a saved build to render'],
]);

const ALLOWED_NAN_TEXT = new Set([
  'Stamps, Islands, Keys, Breeding, and Summoning pages no longer show "NaN" for material costs, island costs, key totals, breeding progress, and summoning costs/bonuses',
  'The Hole, Research, Vote Ballot, Sneaking, Spelunking, Kangaroo, Farming, Alchemy, Clam Work, Owl, Library, Killroy, Gallery, Emperor, Task Board, Towers, Rift, Arcade, Atom Collider, and Coral Reef pages no longer show "NaN" for costs, bonuses, and rates - both signed out and while signed in',
  'Printer, Highscores, Equinox, and Sailing pages no longer show "NaN" for boosted print values, minigame upgrade costs, charge rate, and boat travel times, and your total account level no longer breaks if one of your character slots has no data',
  'Death Note, Cooking, Spelunking, and Buildings pages no longer show "NaN" for kill counts, meal breakpoints, amber totals, and build progress when signed out',
  'Formulas, General, Kangaroo, Refinery, Grimoire, Tesseract, Merits, Compass, Breeding, Owl, Killroy, Sigils, Weekly Bosses, Armor Smithy, Atom Collider, Worship, and Sneaking pages no longer show "NaN" for formula results, currencies, upgrade costs, and stats when signed out',
  'Gaming: sprout regrowth time, superbit tower-wave bonuses, and the acorn shop no longer show "NaN" before you have unlocked gaming, and Equinox no longer shows "Bosses killed: NaN"',
  'Dashboard: the companion claim and megaflesh timers no longer show "NaNENaN days" in their tooltips',
  'Active Stuff Calculator: every number showed as "NaN" if you had taken a snapshot before and then opened the page without being signed in - it now asks you to sign in instead',
]);

const ALLOWED_UNDEFINED_TEXT = new Set([
  'Task Board no longer fails to load when signed out, and Event Shop, Gem Shop, Weekly Bosses, Rift, Spelunking, and Formulas pages no longer show the word "undefined" for currencies, purchases, task progress, and rates when signed out',
]);

const ALLOWED_INFINITY_TEXT = new Set([
  'Infinity hammer',
  // A patch note describing an Infinity bug, same as the NaN entries above: the word is the
  // subject of the sentence, not a value that leaked onto the page.
  'Sneaking: a weapon past level 110 showed an Infinity stat instead of its real value',
]);

const ERROR_BOUNDARY_TEXT = ['This page failed to render', 'The app failed to load'];

const EXPECTED_DIRTY_ROUTES = [];

const OFFENDING_TEXT_PATTERN = new RegExp([
  'NaN',
  '\\bundefined\\b',
  '\\bInfinity\\b',
  'Invalid Date',
  '\\b\\d{4,}d:'
].join('|'));

const findOffendingTextNodes = async (page) => {
  return page.evaluate((pattern) => {
    const offending = new RegExp(pattern);
    const found = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (!text) continue;
      if (offending.test(text)) found.push(text);
    }
    return found;
  }, OFFENDING_TEXT_PATTERN.source);
};

const isAllowed = (text) => ALLOWED_NAN_TEXT.has(text)
  || ALLOWED_UNDEFINED_TEXT.has(text)
  || ALLOWED_INFINITY_TEXT.has(text);

const routes = discoverRoutes();

test.describe('No "NaN"/"undefined"/crash fallback reaches the rendered page for a logged-out visitor', () => {
  for (const route of routes) {
    if (NEEDS_QUERY_PARAM.has(route)) {
      // eslint-disable-next-line no-empty-function
      test.skip(`${route} (skipped: ${NEEDS_QUERY_PARAM.get(route)})`, () => {});
      continue;
    }

    const runner = EXPECTED_DIRTY_ROUTES.includes(route) ? test.fail : test;
    runner(`${route} renders no NaN/undefined/crash fallback`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForRender(page);

      const hits = await findOffendingTextNodes(page);
      const offending = hits
        .filter((text) => !isAllowed(text))
        .map((text) => text.slice(0, 200));

      for (const errorText of ERROR_BOUNDARY_TEXT) {
        const count = await page.getByText(errorText, { exact: true }).count();
        if (count > 0) offending.push(`[ErrorBoundary fallback] ${errorText}`);
      }

      expect(offending, `Bad text found on ${route}:\n${offending.join('\n')}`).toEqual([]);
    });
  }
});

test('active stuff calculator renders no NaN with a leftover snapshot and no save', async ({ page }) => {
  await page.addInitScript(() => {
    const snapshotTime = Date.now() - 3600_000;
    window.localStorage.setItem('activeDropPlayer', JSON.stringify({ playerId: 0, name: 'Someone', snapshotTime }));
    window.localStorage.setItem('activeDropAcc', JSON.stringify({ snapshotTime }));
  });
  await page.goto('/tools/active-stuff-calculator', { waitUntil: 'domcontentloaded' });
  await waitForRender(page);

  const hits = (await findOffendingTextNodes(page)).filter((text) => !isAllowed(text));
  expect(hits, `Bad text found:\n${hits.join('\n')}`).toEqual([]);
});

test('dashboard timer tooltips render no NaN/Infinity/undefined for a logged-out visitor', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await waitForRender(page);

  const hoverables = await page.$$('img');
  const seen = new Set();
  const offending = new Set();

  for (const target of hoverables) {
    try {
      await target.hover({ timeout: 800 });
      await page.waitForTimeout(100);
      const tips = await page.$$eval('[role="tooltip"]', (els) => els.map((el) => el.innerText));
      for (const text of tips) {
        seen.add(text);
        if (OFFENDING_TEXT_PATTERN.test(text) && !isAllowed(text)) offending.add(text.slice(0, 200));
      }
    } catch {
    }
  }

  expect(seen.size, 'expected the dashboard to expose timer tooltips to hover').toBeGreaterThan(5);
  expect([...offending], `Bad tooltip text:\n${[...offending].join('\n')}`).toEqual([]);
});
