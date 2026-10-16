import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';
import { entityPath, listingHref } from '../utility/wiki/kinds.mjs';

// The sortable listings. Every expectation comes from the page's own __NEXT_DATA__, so no count or name is
// typed here and a game update cannot break the spec.

const NEXT_DATA = /id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s;

const propsIn = (html) => JSON.parse(html.match(NEXT_DATA)[1]).props.pageProps;

const propsOf = (page) => page.evaluate(() => JSON.parse(document.getElementById('__NEXT_DATA__').textContent).props.pageProps);

// The name comparator's own collator: "Rank 5" before "Rank 10", case and accents ignored.
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

// Entity links sit one level under their listing's URL, for a loose kind and a system kind alike.
const firstRow = (page, kind) => page.locator(`table tbody a[href^="${listingHref(kind)}/"]`).first();

// A crawler reads the served bytes: every listing row is an anchor there, the rows a collapsed band hides
// included. Only entity links start with the listing's URL and a slash.
for (const kind of ['item', 'sushiupgrade']) {
  test(`${listingHref(kind)} links every row in its HTML`, async ({ request }) => {
    const html = await (await request.get(listingHref(kind))).text();
    const hrefs = new Set([...html.matchAll(new RegExp(`href="(${listingHref(kind)}/[^"]+)"`, 'g'))].map((match) => match[1]));
    const expected = new Set(propsIn(html).entries.map((entry) => entityPath(kind, entry.node.slug)));
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

test('a deep link sorts the Equinox listing under its system', async ({ page }) => {
  await page.goto('/wiki/equinox/upgrades?sort=name&order=desc');
  await waitForRender(page);
  const { entries } = await propsOf(page);
  const last = [...entries].sort((a, b) => collator.compare(a.label, b.label) || collator.compare(a.disambig ?? '', b.disambig ?? '')).at(-1);
  await expect(firstRow(page, 'equinox')).toHaveAttribute('href', entityPath('equinox', last.node.slug));
});

// A phone shows the name and one column; totem fills five, so it is the widest table there is. The table's own
// scroll box is checked too: a table too wide for it scrolls inside it and never widens the page.
test.describe('on a phone', () => {
  test.use({ viewport: { width: 384, height: 832 } });
  for (const kind of ['item', 'monster', 'sushiupgrade', 'totem']) {
    test(`${listingHref(kind)} does not scroll sideways`, async ({ page }) => {
      await page.goto(listingHref(kind));
      await waitForRender(page);
      const fit = await page.evaluate(() => {
        const box = document.querySelector('table').parentElement;
        return {
          page: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          table: box.scrollWidth <= box.clientWidth
        };
      });
      expect(fit).toEqual({ page: true, table: true });
    });
  }
});

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1920, height: 950 } });
  test('/wiki/sushi-station/upgrades heads every column', async ({ page }) => {
    await page.goto(listingHref('sushiupgrade'));
    await waitForRender(page);
    const { columns } = await propsOf(page);
    expect(await page.locator('table thead th').allTextContents()).toEqual(['Name', ...columns.map((column) => column.label)]);
  });
});
