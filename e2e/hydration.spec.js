import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

// React reports a hydration mismatch as a console error (minified #418/#423/#425) and answers it
// by re-rendering the whole root client-side, which is exactly the cost the static export is
// meant to avoid. One sample per page kind, at three widths, in a timezone and locale the build
// machine does not have, in the states the export cannot know about: anonymous, demo data,
// stored preferences.

const WIDTHS = [1280, 1500, 390];
const HYDRATION_ERROR = /#418|#423|#425|hydrat/i;

const firstWikiEntityRoute = () => {
  try {
    const dir = path.join(process.cwd(), 'out', 'wiki', 'monster');
    const file = readdirSync(dir).find((f) => f.endsWith('.html'));
    return `/wiki/monster/${file.replace(/\.html$/, '')}`;
  } catch {
    return '/wiki';
  }
};

const SAMPLES = [
  { route: '/' },
  { route: '/leaderboards', seed: { 'leaderboard:showAnonymous': 'false' } },
  { route: '/tools/builds' },
  { route: '/tools/builds/wizard' },
  { route: '/wiki' },
  { route: '/wiki/monster' },
  { route: firstWikiEntityRoute() },
  { route: '/wiki/changelog' },
  { route: '/patch-notes' },
  { route: '/guilds' },
  { route: '/statistics' },
  // A page whose first render depends on router.query: on a static export it is empty until
  // isReady, so anything read from it during render is a mismatch waiting to happen.
  { route: '/leaderboards?t=Skills' },
  // Not a 200, but page.goto follows it and the export still has to hydrate: the 404 is the page
  // a mistyped or retired URL lands on, which makes it the one nobody notices breaking.
  { route: '/404' },
  { route: '/account/world-1/stamps?demo=true' },
  {
    route: '/characters?demo=true',
    seed: {
      filters: JSON.stringify({ Inventory: true }),
      pinnedPages: JSON.stringify([{ href: '/account/world-1/stamps', label: 'Stamps' }])
    }
  }
];

for (const width of WIDTHS) {
  for (const { route, seed } of SAMPLES) {
    test(`${route} hydrates without a mismatch at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        timezoneId: 'Asia/Jerusalem',
        locale: 'de-DE'
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

      expect(errors.filter((text) => HYDRATION_ERROR.test(text))).toEqual([]);
      await context.close();
    });
  }
}

// The tab strip reads the router every render, the data used to be read once in a useState
// initialiser. With no hydration gate router.query is {} on the first render of a statically
// exported page, so the two disagreed: Skills highlighted, global data underneath.
test.describe('a tab deep link selects the tab and its data', () => {
  test('/leaderboards?t=Skills asks for the skills leaderboard', async ({ page }) => {
    const requested = [];
    // Stubbed rather than left live, so the assertion is about which leaderboard the page asked
    // for and not about what the API happens to be serving. The stub answers in the shape of the
    // leaderboard it was asked for, and only the skills one carries a Mining section, so the
    // heading below is proof of which response the page is rendering.
    // Matched by predicate, not by a URL glob: the page's own document request is
    // /leaderboards?t=Skills, and a glob loose enough to catch the API call catches that too,
    // which answers the navigation itself with JSON.
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

    await page.goto('/leaderboards?t=Skills');
    await waitForRender(page);

    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText(/skills/i);
    await expect(page.getByText('Mining', { exact: true })).toBeVisible();
    // The default goes out first and is discarded: the query cannot be held back with `enabled`
    // because isLoading then differs between the export (where the server router reports ready)
    // and the first client render, which is a hydration mismatch on the whole page. What matters
    // is that the tab's own leaderboard is what the page ends up asking for and showing.
    expect(requested.at(-1)).toBe('skills');
  });
});
