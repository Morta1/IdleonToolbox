/**
 * Task 16, batch 1: a permanent gate for "NaN" reaching the rendered page.
 *
 * The parser-level NaN gate (__test__/parsers/task-*-nan-elimination.test.js and friends) proves
 * `parseData` never emits NaN anywhere in the empty-account object, data/raw.json, or the five
 * __test__/fixtures/ saves. But values like "NaNENaN" (notateNumber formatting a NaN) and "NaNx"
 * are computed IN COMPONENTS at render time, from a mix of parser output and local arithmetic - no
 * parser-level assertion can ever see them. This spec renders every page as a LOGGED-OUT visitor
 * (fresh context, no auth state, no ?demo=true) and reads every text node in the DOM.
 *
 * Routes are discovered from pages/ rather than hardcoded, so a new page is covered automatically.
 *
 * A scan across all 106 routes (see nan-scan-results.json referenced in the task-16 report) found
 * 22 dirty routes / 369 offending text nodes. Batch 1 fixed the four highest-count routes -
 * death-note, cooking, spelunking, buildings (290 of the 369 nodes). Batch 2 (task 17) fixed the
 * remaining 17 routes, emptying EXPECTED_DIRTY_ROUTES below - every route in pages/ now renders
 * clean for a logged-out visitor.
 *
 * Any route added here in the future is run through test.fail(): Playwright inverts the pass/fail
 * result for a test wrapped this way, so the test SUITE goes green while a route is still dirty,
 * and turns red the moment that route becomes unexpectedly clean - which is the signal to delete it
 * from the list. Do not add a newly-broken route to this list to silence a failure; that defeats
 * the point of the gate. Only routes a human has confirmed are pre-existing/known should be listed.
 */
import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

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

// These three routes render nothing meaningful without a query param identifying which record to
// show (a guild, a build) - they are not part of the "every page renders the zeroed catalog for a
// logged-out visitor" contract this gate checks, so they are skipped rather than force-fed a route
// they were never designed to render standalone.
const NEEDS_QUERY_PARAM = new Map([
  ['/guilds/detail', 'needs a real ?name= (or similar) identifying a guild to render'],
  ['/tools/builds/view', 'needs a real ?id= identifying a saved build to render'],
  ['/tools/builds/edit', 'needs a real ?id= identifying a saved build to render'],
]);

// Exact patch-note sentences (data/patch-notes.js) that legitimately contain the literal word "NaN"
// as part of describing NaN fixes. Matched precisely by full text - not a blanket skip of '/' or
// '/patch-notes' - so a real NaN newly introduced on either page still fails this test.
const ALLOWED_NAN_TEXT = new Set([
  'Stamps, Islands, Keys, Breeding, and Summoning pages no longer show "NaN" for material costs, island costs, key totals, breeding progress, and summoning costs/bonuses',
  'The Hole, Research, Vote Ballot, Sneaking, Spelunking, Kangaroo, Farming, Alchemy, Clam Work, Owl, Library, Killroy, Gallery, Emperor, Task Board, Towers, Rift, Arcade, Atom Collider, and Coral Reef pages no longer show "NaN" for costs, bonuses, and rates - both signed out and while signed in',
  'Printer, Highscores, Equinox, and Sailing pages no longer show "NaN" for boosted print values, minigame upgrade costs, charge rate, and boat travel times, and your total account level no longer breaks if one of your character slots has no data',
  'Death Note, Cooking, Spelunking, and Buildings pages no longer show "NaN" for kill counts, meal breakpoints, amber totals, and build progress when signed out',
  'Formulas, General, Kangaroo, Refinery, Grimoire, Tesseract, Merits, Compass, Breeding, Owl, Killroy, Sigils, Weekly Bosses, Armor Smithy, Atom Collider, Worship, and Sneaking pages no longer show "NaN" for formula results, currencies, upgrade costs, and stats when signed out',
]);

// Batch 2 (task 17) fixed the last 17 dirty routes batch 1 left open - see the task-17 report for
// the full per-route root-cause table. This list is intentionally empty: every route discovered
// from pages/ must render with zero "NaN" text nodes for a logged-out visitor. If a route becomes
// dirty in the future, add it here ONLY after a human has confirmed it is a pre-existing/known
// issue, not to silence a newly-introduced regression.
const EXPECTED_DIRTY_ROUTES = [];

// Full, untruncated text is what gets compared against ALLOWED_NAN_TEXT (an exact-match allowlist);
// only the reported failure message truncates for readability.
const findNanTextNodes = async (page) => {
  return page.evaluate(() => {
    const found = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (!text || !/NaN/.test(text)) continue;
      found.push(text);
    }
    return found;
  });
};

const routes = discoverRoutes();

test.describe('No "NaN" reaches the rendered page for a logged-out visitor', () => {
  for (const route of routes) {
    if (NEEDS_QUERY_PARAM.has(route)) {
      // eslint-disable-next-line no-empty-function
      test.skip(`${route} (skipped: ${NEEDS_QUERY_PARAM.get(route)})`, () => {});
      continue;
    }

    const runner = EXPECTED_DIRTY_ROUTES.includes(route) ? test.fail : test;
    runner(`${route} renders no NaN`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      // Give the client-side empty-account parse time to land and the tree to render.
      await page.waitForTimeout(3500);

      const hits = await findNanTextNodes(page);
      const offending = hits.filter((text) => !ALLOWED_NAN_TEXT.has(text)).map((text) => text.slice(0, 200));

      expect(offending, `NaN text found on ${route}:\n${offending.join('\n')}`).toEqual([]);
    });
  }
});
