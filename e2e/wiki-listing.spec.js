import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// The sortable listings. Every expectation comes from the page's own __NEXT_DATA__, so no count or name is
// typed here and a game update cannot break the spec.

const NEXT_DATA = /id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s;

const propsIn = (html) => JSON.parse(html.match(NEXT_DATA)[1]).props.pageProps;

const propsOf = (page) => page.evaluate(() => JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps);

// The name comparator's own collator: "Rank 5" before "Rank 10", case and accents ignored.
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const firstRow = (page, kind) => page.locator(`table tbody a[href^="/wiki/${kind}/"]`).first();

// A crawler reads the served bytes: every listing row is an anchor there, the rows a collapsed band hides
// included. Only entity links start with /wiki/<kind>/ on an unmoved listing; a moved one's rail link would too.
for (const kind of ['item', 'sushiupgrade']) {
  test(`/wiki/${kind} links every row in its HTML`, async ({ request }) => {
    const html = await (await request.get(`/wiki/${kind}`)).text();
    const hrefs = new Set([...html.matchAll(new RegExp(`href="(/wiki/${kind}/[^"]+)"`, 'g'))].map((match) => match[1]));
    const expected = new Set(propsIn(html).entries.map((entry) => `/wiki/${kind}/${entry.node.slug}`));
    expect([...hrefs].sort()).toEqual([...expected].sort());
  });
}

// The export is unsorted; the sort lands once the router is ready, so the assertion retries until it does.
test('a deep link sorts monsters by health once the router is ready', async ({ page }) => {
  await page.goto('/wiki/monster?sort=health&order=desc');
  await waitForRender(page);
  const { columns, entries } = await propsOf(page);
  const at = columns.findIndex((column) => column.key === 'health');
  const strongest = entries.reduce((best, entry) => ((entry.cells[at] ?? -Infinity) > (best.cells[at] ?? -Infinity) ? entry : best));
  await expect(firstRow(page, 'monster')).toHaveAttribute('href', `/wiki/monster/${strongest.node.slug}`);
});

test('a deep link sorts the moved Equinox listing on its own path', async ({ page }) => {
  await page.goto('/wiki/equinox/upgrades?sort=name&order=desc');
  await waitForRender(page);
  const { entries } = await propsOf(page);
  const last = [...entries].sort((a, b) => collator.compare(a.label, b.label) || collator.compare(a.disambig ?? '', b.disambig ?? '')).at(-1);
  await expect(firstRow(page, 'equinox')).toHaveAttribute('href', `/wiki/equinox/${last.node.slug}`);
});

// A phone shows the name and one column; totem fills five, so it is the widest table there is.
test.describe('on a phone', () => {
  test.use({ viewport: { width: 384, height: 832 } });
  for (const kind of ['item', 'monster', 'sushiupgrade', 'totem']) {
    test(`/wiki/${kind} does not scroll sideways`, async ({ page }) => {
      await page.goto(`/wiki/${kind}`);
      await waitForRender(page);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1920, height: 950 } });
  test('/wiki/sushiupgrade heads every column', async ({ page }) => {
    await page.goto('/wiki/sushiupgrade');
    await waitForRender(page);
    const { columns } = await propsOf(page);
    expect(await page.locator('table thead th').allTextContents()).toEqual(['Name', ...columns.map((column) => column.label)]);
  });
});
