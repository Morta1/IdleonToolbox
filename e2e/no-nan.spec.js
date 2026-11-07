import { test, expect } from '@playwright/test';
import { discoverRoutes } from './route-helpers';
import { waitForRender } from './wait-helpers';

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
  'Signed-out pages no longer show NaN, undefined or repeated weeks',
]);

const ALLOWED_UNDEFINED_TEXT = new Set([
  'Task Board no longer fails to load when signed out, and Event Shop, Gem Shop, Weekly Bosses, Rift, Spelunking, and Formulas pages no longer show the word "undefined" for currencies, purchases, task progress, and rates when signed out',
]);

const ALLOWED_INFINITY_TEXT = new Set([
  'Infinity Hammer',
  // A patch note describing an Infinity bug, same as the NaN entries above: the word is the
  // subject of the sentence, not a value that leaked onto the page.
  'Sneaking: a weapon past level 110 showed an Infinity stat instead of its real value',
]);

// The start of a longer sentence on the page, so never matched with exact: true.
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

// A page's first tab hid the guest faults 5g found on the others. Two levels: the page's own strip, and the tabs each of
// its tabs opens. A sprite-only tab goes by its aria-label.
const readTabs = async (page, offending, above) => {
  const tabs = above
    ? page.locator('main [role="tab"]:visible:not([disabled])')
    : page.locator('main [role="tablist"]:visible').first().locator('[role="tab"]:not([disabled])');
  const listed = await tabs.evaluateAll((list) => list.map((tab) => (tab.getAttribute('aria-label') || tab.innerText).replace(/\s+/g, ' ').trim()));
  const names = [...new Set(listed)].filter((name) => name && !above?.includes(name));
  for (const name of names) {
    const tab = page.locator('main').getByRole('tab', { name, exact: true }).first();
    if (!await tab.isVisible()) continue;
    await tab.click();
    await waitForRender(page);
    const hits = (await findOffendingTextNodes(page)).filter((text) => !isAllowed(text));
    offending.push(...hits.map((text) => `[${name}] ${text.slice(0, 200)}`));
    if (!above) await readTabs(page, offending, names);
  }
};

const routes = discoverRoutes({ skip: ['_app', '_document', '_error', '404'] });

// Account pages once bounced a logged-out visitor to the landing page or left them on the loader.
// They must stay put, render the empty account and say why its numbers are zero.
const isAccountPage = (route) => route.startsWith('/account/');

// Renamed pages kept alive as a client redirect for old links.
const MOVED_PAGES = new Map([
  ['/account/class-specific/royal-guardian', '/account/class-specific/royal-armory'],
]);

test.describe('No "NaN"/"undefined"/crash fallback reaches the rendered page for a logged-out visitor', () => {
  for (const route of routes) {
    if (NEEDS_QUERY_PARAM.has(route)) {
      // eslint-disable-next-line no-empty-function
      test.skip(`${route} (skipped: ${NEEDS_QUERY_PARAM.get(route)})`, () => {});
      continue;
    }

    const runner = EXPECTED_DIRTY_ROUTES.includes(route) ? test.fail : test;
    runner(`${route} renders no NaN/undefined/crash fallback`, async ({ page }) => {
      test.setTimeout(120_000);
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForRender(page);

      if (isAccountPage(route)) {
        expect(new URL(page.url()).pathname, `${route} redirected a logged-out visitor`)
          .toBe(MOVED_PAGES.get(route) ?? route);
        const bodyText = await page.locator('body').innerText();
        expect(bodyText).not.toContain('Loading account data');
        expect(bodyText).not.toContain('missing data');
        expect(bodyText).toContain('Browsing as a guest: numbers fill in once you sign in');
        expect(pageErrors).toEqual([]);
      }

      const hits = await findOffendingTextNodes(page);
      const offending = hits
        .filter((text) => !isAllowed(text))
        .map((text) => text.slice(0, 200));
      await readTabs(page, offending);

      for (const errorText of ERROR_BOUNDARY_TEXT) {
        const count = await page.getByText(errorText).count();
        if (count > 0) offending.push(`[ErrorBoundary fallback] ${errorText}`);
      }

      const unique = [...new Set(offending)];
      expect(unique, `Bad text found on ${route}:\n${unique.join('\n')}`).toEqual([]);
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

// A tool's first screen hid what its second one prints, so one optimizer's Run and one calculator's input per section that
// has them (World 5, misc, premium currency, clickers and the task board have neither). A guest wherever the tool draws
// for one; a tool that needs characters or land ranks reads the demo. Each step proves it landed.
const inGear = (label, value) => async (page) => {
  await page.getByRole('button', { name: 'Page settings' }).click();
  await page.getByRole('dialog', { name: 'Page settings' }).getByLabel(label, { exact: true }).fill(value);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Page settings, changed' })).toBeVisible();
};
const pickSecond = (label) => async (page) => {
  const field = page.getByRole('combobox', { name: label });
  const before = await field.innerText();
  await field.click();
  await page.getByRole('option').nth(1).click();
  await expect(field).not.toHaveText(before);
};
const TOOL_STATES = [
  ['World 1 calculator', '/account/world-1/stamps', inGear('Stamp reducer', '50')],
  ['World 2 calculator', '/account/world-2/bubbles', inGear('Bargain tags', '3')],
  ['World 3 optimizer', '/account/world-3/construction', async (page) => {
    await page.getByRole('button', { name: 'Optimize', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Clear', exact: true })).toBeVisible({ timeout: 45_000 });
  }],
  ['World 3 calculator', '/account/world-3/worship?t=Totems&demo=true', inGear('Worship efficiency', '100')],
  ['World 4 calculator', '/account/world-4/cooking?t=Meals&demo=true', inGear('Food Lust bosses', '5')],
  ['World 6 optimizer', '/account/world-6/farming?t=Rank+Optimizer&demo=true', pickSecond('Max upgrades')],
  ['World 7 optimizer', '/account/world-7/clam-work?t=Upgrade+Optimizer', pickSecond('Optimize for')],
  ['World 7 calculator', '/account/world-7/clam-work', inGear('Multikill', '100')],
  ['Class optimizer', '/account/class-specific/tesseract?t=Upgrade+Optimizer', pickSecond('Optimize for')],
  ['Class calculator', '/account/class-specific/tesseract', inGear('Levels ahead', '5')],
  ['Tools optimizer', '/tools/guaranteed-drop-calculator', async (page) => {
    await page.getByLabel('Material').click();
    await page.getByRole('option').first().click();
    await page.getByLabel('Drop rate').fill('300');
    await page.getByLabel('Kills with multikill').fill('1000');
    await page.getByLabel('Multikill bonus').fill('10');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText(/^x\d+ drop$/).first()).toBeVisible();
  }],
  ['Tools calculator', '/tools/bone-joe-calculator', async (page) => {
    const row = page.getByRole('row', { name: /Glunko/ });
    const before = await row.innerText();
    await page.getByLabel('Pickles').fill('5');
    await expect(row).not.toHaveText(before);
  }]
];

test.describe('A tool\'s second state renders no NaN/undefined/crash fallback', () => {
  for (const [name, route, step] of TOOL_STATES) {
    test(name, async ({ page }) => {
      test.setTimeout(90_000);
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await waitForRender(page);
      await step(page);
      await waitForRender(page);

      const offending = (await findOffendingTextNodes(page)).filter((text) => !isAllowed(text));
      expect(offending, `Bad text found on ${route}:\n${offending.join('\n')}`).toEqual([]);
      for (const errorText of ERROR_BOUNDARY_TEXT) await expect(page.getByText(errorText)).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  }
});

// A logged-out dashboard draws only its sign-in note, so the alert and timer hovers are read on the demo.
test('dashboard alert and timer previews render no NaN/Infinity/undefined', async ({ page }) => {
  // The demo draws over 500 icons, each hovered in turn
  test.setTimeout(180_000);
  await page.goto('/dashboard?demo=true', { waitUntil: 'domcontentloaded' });
  await waitForRender(page);

  const hoverables = await page.$$('[aria-haspopup="dialog"] img');
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
