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
 * Task 18 widened the gate: "NaN" text is only what arithmetic on undefined produces. String
 * interpolation/concatenation of an undefined value produces the literal word "undefined" instead,
 * which the NaN check above never sees - that's how a crash (task-board/tasks) and six other
 * "undefined"-rendering routes survived a green gate. The gate now also fails on any text node
 * containing the standalone word "undefined" (word-boundary matched, so prose like "the button is
 * undefined until clicked" would still trip it deliberately - legitimate copy needing the word goes
 * in ALLOWED_UNDEFINED_TEXT below, same pattern as ALLOWED_NAN_TEXT), and on the ErrorBoundary
 * fallback strings ("This page failed to render" / "The app failed to load") - a route that crashes
 * into the error boundary previously passed this gate trivially, because a caught crash renders
 * neither "NaN" nor prior fixture text, which is exactly how the tasks.jsx crash went unnoticed.
 *
 * Widened again after a logged-out sweep found six routes rendering broken numbers through a green
 * gate. "NaN" is only one of the shapes bad arithmetic takes, and the other shapes are all
 * well-formed finite strings this gate had no reason to look at: "-Infinity%" (traps, sailing - a
 * zero denominator rather than an absent one) and "20660d:12h:51m" (dashboard, pets, breeding - a
 * duration measured from the epoch instead of from a real timestamp). Both are as wrong on screen as
 * "NaN" is, and neither contains it. See OFFENDING_TEXT_PATTERN for what the gate now matches.
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
  'Gaming: sprout regrowth time, superbit tower-wave bonuses, and the acorn shop no longer show "NaN" before you have unlocked gaming, and Equinox no longer shows "Bosses killed: NaN"',
  'Dashboard: the companion claim and megaflesh timers no longer show "NaNENaN days" in their tooltips',
  'Active Stuff Calculator: every number showed as "NaN" if you had taken a snapshot before and then opened the page without being signed in - it now asks you to sign in instead',
]);

// Exact text that legitimately contains the standalone word "undefined" - same pattern as
// ALLOWED_NAN_TEXT above (a patch note describing this very fix quotes the word "undefined").
// Add an entry here (not a blanket route skip), so a real bug elsewhere on the same route still
// fails this test.
const ALLOWED_UNDEFINED_TEXT = new Set([
  'Task Board no longer fails to load when signed out, and Event Shop, Gem Shop, Weekly Bosses, Rift, Spelunking, and Formulas pages no longer show the word "undefined" for currencies, purchases, task progress, and rates when signed out',
]);

// The only page text that legitimately contains the word "Infinity": the gem shop item whose
// displayName in website-data.json is INFINITY_HAMMER, rendered through camelToTitleCase. Same
// pattern as the two allowlists above - an exact-text entry, not a route skip, so a real Infinity
// elsewhere on the gem shop page still fails.
const ALLOWED_INFINITY_TEXT = new Set([
  'Infinity hammer',
]);

// The exact fallback titles pages/_app.jsx passes to ErrorBoundary. A caught render crash shows one
// of these instead of the page's real content - it renders neither "NaN" nor "undefined", so
// without this explicit check a crashed page passes the rest of this gate trivially (this is how
// the task-board/tasks crash went unnoticed - see the task-18 report).
const ERROR_BOUNDARY_TEXT = ['This page failed to render', 'The app failed to load'];

// Batch 2 (task 17) fixed the last 17 dirty routes batch 1 left open - see the task-17 report for
// the full per-route root-cause table. Task 18 fixed the crash and seven "undefined"-rendering
// routes this gate's widened checks caught - see the task-18 report. This list is intentionally
// empty: every route discovered from pages/ must render with zero "NaN"/"undefined" text nodes and
// no ErrorBoundary fallback for a logged-out visitor. If a route becomes dirty in the future, add it
// here ONLY after a human has confirmed it is a pre-existing/known issue, not to silence a
// newly-introduced regression.
const EXPECTED_DIRTY_ROUTES = [];

/**
 * The single definition of "a number went wrong on screen", shared by the route walk and the tooltip
 * hover below. It lived in two places before and they drifted: the tooltip scan checked Infinity,
 * the route walk did not, and six routes rendered "-Infinity%" and epoch-derived timers through a
 * fully green gate for exactly that reason.
 *
 * Serialized as a string because it has to be injected into page.evaluate, where a closure over a
 * Node-side function is not available.
 */
const OFFENDING_TEXT_PATTERN = new RegExp([
  // Arithmetic on undefined. "NaNENaN" (notateNumber of a NaN) and "NaNx" are substrings of this.
  'NaN',
  // String interpolation of an undefined value, rather than arithmetic on one. Word-boundary
  // matched, so it catches "X / undefined" mid-sentence but not a longer identifier.
  '\\bundefined\\b',
  // Division by a zero denominator instead of an absent one. Covers "-Infinity" too: the "-" is a
  // non-word character, so the leading \b still holds.
  '\\bInfinity\\b',
  // `new Date(NaN)` reaching toLocaleString / date-fns.
  'Invalid Date',
  // A duration rendered as "20660d:12h:51m" - about 56.6 years, which is today minus the epoch. A
  // duration measured from 0 instead of from a real timestamp is always this shape. The threshold
  // is 4+ digits (1000 days, ~2.7 years); a sweep of all 106 routes matched only the three genuinely
  // broken timers at that threshold, no legitimate long countdown.
  '\\b\\d{4,}d:'
].join('|'));

// Full, untruncated text is what gets compared against the allowlists above; only the reported
// failure message truncates for readability.
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
      // Give the client-side empty-account parse time to land and the tree to render.
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

/**
 * The scan above reads text nodes that are in the DOM. MUI tooltips are not: they mount only while
 * hovered. Every timer card on the dashboard keeps its wording in one, and two of them shipped
 * reading "Next companion claim: NaNENaN days" and "Next megaflesh: NaNEInfinity days" through a
 * fully green gate - found by a user, not by this suite.
 *
 * Both came from the same shape: `now + (cost - owned) / rate` is NaN when the save has no data and
 * Infinity when a rate is 0, and getRealDateInMs sent both down its "too far out for a Date, show
 * N days" branch. The guard now lives in getRealDateInMs / useRealDate, but the reason this went
 * unnoticed was coverage, so hover them here too.
 */
/**
 * The route scan above always starts from a clean browser context, so it only ever sees pages in
 * their first-visit state. Some pages read localStorage the app itself wrote earlier, and that state
 * outlives signing out: the active stuff calculator kept a snapshot of your save under
 * `activeDropPlayer`/`activeDropAcc`, and with that present but no save loaded, every section
 * compared the snapshot against nothing and rendered "NaNENaN". A user found it; this suite could
 * not have, because it never had a snapshot to leave behind.
 *
 * The snapshot below is deliberately minimal - just enough for the page to believe one exists, which
 * is exactly the state that used to break it.
 */
test('active stuff calculator renders no NaN with a leftover snapshot and no save', async ({ page }) => {
  await page.addInitScript(() => {
    const snapshotTime = Date.now() - 3600_000;
    // @mantine/hooks' useLocalStorage stores JSON.
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
      // Not hoverable (offscreen, detached, covered) - skip it.
    }
  }

  // Without this the test would pass trivially on a dashboard that rendered no tooltips at all,
  // which is exactly the failure mode that let the two bugs above through.
  expect(seen.size, 'expected the dashboard to expose timer tooltips to hover').toBeGreaterThan(5);
  expect([...offending], `Bad tooltip text:\n${[...offending].join('\n')}`).toEqual([]);
});
