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
  { route: '/patch-notes' },
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
