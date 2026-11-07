import { test, expect } from '@playwright/test';
import { firstExportedRoute } from './route-helpers';
import { waitForRender } from './wait-helpers';

// React reports a hydration mismatch as a console error (minified #418/#423/#425) and answers it
// by re-rendering the whole root client-side, which is the cost the static export exists to avoid.
// The samples run in a timezone and locale the build machine does not have, and in the states the
// export cannot know about: anonymous, demo data, stored preferences.

const WIDTHS = [1280, 1500, 390];
const HYDRATION_ERROR = /#418|#423|#425|hydrat/i;

const SAMPLES = [
  { route: '/' },
  { route: '/leaderboards', seed: { 'leaderboard:showAnonymous': 'false' } },
  { route: '/tools/builds' },
  { route: '/tools/builds/wizard' },
  { route: '/wiki' },
  { route: '/wiki/monster' },
  { route: firstExportedRoute('wiki/monster') },
  // A system page, one on the URL its kind's listing used to hold, a system kind's listing, and an entity under it.
  { route: '/wiki/sneaking' },
  { route: '/wiki/equinox' },
  { route: '/wiki/equinox/upgrades' },
  { route: firstExportedRoute('wiki/equinox/upgrades') },
  // Sortable listings. The first is the deep-link case the isReady rule exists for: the sort lives
  // in the query, which is empty on the first render. The last is a sorted listing on the slug route.
  { route: '/wiki/monster?sort=health&order=desc' },
  { route: '/wiki/item' },
  { route: '/wiki/sushi-station/upgrades' },
  { route: '/wiki/equinox/upgrades?sort=name&order=desc' },
  // Registry and calculator pages: the level field and filled sentence render at build time.
  { route: '/wiki/owl/feather-generation' },
  { route: '/wiki/vial/copper-corona' },
  { route: '/wiki/changelog' },
  { route: '/patch-notes' },
  { route: '/guilds' },
  { route: '/statistics' },
  // A page whose first render depends on router.query: on a static export it is empty until
  // isReady, so anything read from it during render is a mismatch waiting to happen.
  { route: '/leaderboards?t=Skills' },
  { route: '/leaderboards?player=Baker333' },
  { route: '/leaderboards?t=skills&m=mining' },
  // Not a 200, but page.goto follows it and the export still has to hydrate.
  { route: '/404' },
  // Data pages export DataLoadingWrapper's loader; the deep link must still hydrate cleanly.
  { route: '/account/world-4/cooking?t=Kitchens' },
  { route: '/account/world-3/printer' },
  { route: '/account/world-1/stamps?demo=true' },
  {
    route: '/characters?demo=true',
    seed: {
      filters: JSON.stringify({ Inventory: true }),
      pinnedPages: JSON.stringify([{ name: 'stamps', url: '/account/world-1/stamps' }])
    }
  }
  // Without out/ the exported-route readers fall back to /wiki, and a repeated test title fails collection.
].filter(({ route }, i, all) => all.findIndex((other) => other.route === route) === i);

// The scheme reaches <html> before React runs, from storage and the device, and the export knows neither. A stored
// light has to beat a device that prefers dark, and system has to follow a device either way.
const SCHEMES = [
  { mode: 'light', device: 'dark', paints: 'light' },
  { mode: 'system', device: 'light', paints: 'light' },
  { mode: 'system', device: 'dark', paints: 'dark' }
];

// The defaults are a first visit: nothing stored and Playwright's device, which prefers light, and the site stays dark.
const expectCleanHydration = async (browser, { route, seed, width, device = 'light', paints = 'dark' }) => {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    timezoneId: 'Asia/Jerusalem',
    locale: 'de-DE',
    colorScheme: device
  });
  const page = await context.newPage();
  if (seed) {
    await page.addInitScript((values) => {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    }, seed);
  }
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto(route);
  await waitForRender(page);
  // waitForRender returns once innerText stops changing, which the static body already is
  // before React runs: without this the assertion could pass on a page that never hydrated.
  await page.waitForFunction(() => window.next?.router?.isReady === true, null, { timeout: 30_000 });

  expect(errors.filter((text) => HYDRATION_ERROR.test(text))).toEqual([]);
  // Without this a seed that never took would pass as one more dark run.
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${paints}\\b`));
  await context.close();
};

// Each route meets every scheme once, each at another width, so a route sees all three widths and a scheme does too. A first
// visit adds one more width per route, rotating, so every width also sees first visits without tripling the run.
SAMPLES.forEach(({ route, seed }, routeIndex) => {
  const firstVisitWidth = WIDTHS[routeIndex % WIDTHS.length];
  test(`${route} hydrates without a mismatch at ${firstVisitWidth}px`, ({ browser }) => expectCleanHydration(browser, { route, seed, width: firstVisitWidth }));

  SCHEMES.forEach(({ mode, device, paints }, schemeIndex) => {
    const width = WIDTHS[(routeIndex + schemeIndex) % WIDTHS.length];
    test(`${route} hydrates without a mismatch at ${width}px, ${mode} on a device that prefers ${device}`, ({ browser }) => expectCleanHydration(browser, {
      route,
      seed: { ...seed, 'mui-mode': mode },
      width,
      device,
      paints
    }));
  });
});

// router.query is {} on the first render of a statically exported page, so a tab strip that reads
// the router live and data seeded once from a useState initialiser drift apart: the tab highlights
// Skills while the global leaderboard stays underneath.
test.describe('a tab deep link selects the tab and its data', () => {
  test('/leaderboards?t=Skills asks for the skills leaderboard', async ({ page }) => {
    const requested = [];
    // Matched by predicate, not by a URL glob: the page's own document request is
    // /leaderboards?t=Skills, and a glob loose enough to catch the API call catches that too,
    // answering the navigation itself with JSON. Only the skills shape carries a Mining section,
    // so the heading asserted below proves which response is being rendered.
    await page.route(
      (url) => url.pathname.endsWith('/leaderboards') && url.searchParams.has('leaderboard'),
      async (route) => {
        const leaderboard = new URL(route.request().url()).searchParams.get('leaderboard');
        requested.push(leaderboard);
        const section = leaderboard === 'skills' ? 'mining' : 'globalRanking';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalUsers: 1,
            createdAt: 1_700_000_000_000,
            [leaderboard]: {
              anonymous: { [section]: [{ mainChar: 'Tester', rank: 1, [section]: 100 }] },
              public: {}
            }
          })
        });
      }
    );

    // The cards wait for meta, and the live one refuses localhost: three retries, about 7 s of the 10 s below.
    await page.route(
      (url) => url.pathname.endsWith('/leaderboards/meta'),
      (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tabs: [{ key: 'skills', label: 'Skills', sections: [{ name: 'Gathering', metrics: [{ key: 'mining', label: 'Mining' }] }] }] })
      })
    );

    await page.goto('/leaderboards?t=Skills');
    await waitForRender(page);
    await page.waitForFunction(() => window.next?.router?.isReady === true, null, { timeout: 30_000 });

    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/skills/i);
    await expect(page.getByText('Mining', { exact: true })).toBeVisible();
    // The first render is Overview (router.query is {} until isReady), which asks for no tab at
    // all, so the tab's own request is the only one. `.at(-1)` stays so an extra request that
    // arrives first would not fail this on its own.
    expect(requested.at(-1)).toBe('skills');
  });
});

// A styled(MuiComponent) override built with @emotion/styled lands in the server-extracted CSS
// before MUI's own rule for the same property, so the export shows MUI's default until the next
// client re-render. MUI's styled engine injects in the right order; the Discord button is the canary.
test('a styled override of a MUI component wins in the export without JS', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  const background = await page.evaluate(() => {
    const button = document.querySelector('a[href="https://discord.gg/8Devcj7FzV"].MuiButton-root');
    return button ? getComputedStyle(button).backgroundColor : 'missing';
  });
  expect(background).toBe('rgb(88, 101, 242)');
  await context.close();
});
