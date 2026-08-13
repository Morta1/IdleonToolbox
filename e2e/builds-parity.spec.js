import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// A generated class page must be the hub with a class preselected, not a stripped-down landing
// page for crawlers. It previously had no search, no sort, no tag filter and bare unstyled text
// links - better for Googlebot, worse for anyone who clicked through from it.

const CONTROLS = [
  { name: 'search field', locator: (p) => p.getByPlaceholder(/Search builds/i) },
  { name: 'tags filter', locator: (p) => p.getByRole('button', { name: /Tags/i }) },
  { name: 'New sort', locator: (p) => p.getByRole('button', { name: 'New', exact: true }) },
  { name: 'Top sort', locator: (p) => p.getByRole('button', { name: 'Top', exact: true }) },
  { name: 'New Build action', locator: (p) => p.getByRole('button', { name: /New Build/i }) },
  { name: 'My builds action', locator: (p) => p.getByRole('link', { name: /My builds/i }) }
];

for (const page of ['/tools/builds', '/tools/builds/barbarian']) {
  test(`${page} exposes the same browse controls`, async ({ page: p }) => {
    await p.goto(`${page}?demo=true`);
    await waitForRender(p);
    for (const { name, locator } of CONTROLS) {
      await expect(locator(p).first(), `${page} is missing the ${name}`).toBeVisible();
    }
  });
}

// The class pages have no navigation bar: the only crawlable links to them live inside the build
// cards, and a class page reaches its siblings through one line of text links. If either goes
// away, /tools/builds/<class> is reachable from the sitemap alone.
test('build cards link to the class pages they belong to', async ({ page }) => {
  await page.goto('/tools/builds?demo=true');
  await waitForRender(page);

  const classLinks = classPageLinks(page);
  const hrefs = await classLinks.evaluateAll((els) => els.map((e) => e.getAttribute('href')));

  expect(hrefs.length, 'no class links found in the cards').toBeGreaterThan(0);
  // Families and subclasses both, e.g. /tools/builds/mage and /tools/builds/wizard.
  expect(new Set(hrefs).size, 'cards should link to more than one class').toBeGreaterThan(1);
  for (const href of hrefs) {
    expect(href, `${href} is not a class page`).toMatch(/^\/tools\/builds\/[a-z0-9-]+$/);
  }
});

test('a class page links to its same-family siblings', async ({ page }) => {
  await page.goto('/tools/builds/wizard?demo=true');
  await waitForRender(page);

  const line = page.getByText(/Other Mage builds:/i);
  await expect(line).toBeVisible();
  await expect(line.getByRole('link', { name: 'Shaman', exact: true }))
    .toHaveAttribute('href', '/tools/builds/shaman');
});

test('class page filters its own builds without a network request', async ({ page }) => {
  const apiCalls = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/builds')) apiCalls.push(r.url());
  });

  await page.goto('/tools/builds/barbarian?demo=true');
  await waitForRender(page);

  const cards = page.locator('a[href^="/tools/builds/view"]');
  const before = await cards.count();
  expect(before, 'no build cards rendered - the rest of this test would be vacuous')
    .toBeGreaterThan(1);

  const firstBefore = await cards.first().getAttribute('href');
  await page.getByRole('button', { name: 'Top', exact: true }).click();
  await page.waitForTimeout(300);

  expect(await cards.count(), 'sorting should not change how many builds are shown').toBe(before);
  // Barbarian's newest build is not also its most-liked, so the order must actually move.
  expect(await cards.first().getAttribute('href'), 'sorting by Top did not reorder anything')
    .not.toBe(firstBefore);
  expect(apiCalls, `class page should not call the builds API: ${apiCalls.join(', ')}`)
    .toHaveLength(0);
});

// One control, one URL per class. The picker used to filter in place on the hub while a chip row
// navigated - same intent, two URLs, two behaviours. It navigates from both pages now.
test('the class picker navigates rather than filtering in place', async ({ page }) => {
  await page.goto('/tools/builds?demo=true');
  await waitForRender(page);

  await page.getByRole('button', { name: /Class/i }).first().click();
  await page.getByRole('menuitem', { name: 'Barbarian', exact: true }).click();

  await expect(page).toHaveURL(/\/tools\/builds\/barbarian/);
  await expect(page.getByRole('heading', { name: /Idleon Barbarian Builds/i })).toBeVisible();
});

test('the picker shows the current class on a class page', async ({ page }) => {
  await page.goto('/tools/builds/barbarian?demo=true');
  await waitForRender(page);
  await expect(page.getByRole('button', { name: /Class/i }).first()).toContainText('Barbarian');
});

test('a legacy ?class= link redirects to the class page', async ({ page }) => {
  await page.goto('/tools/builds?class=Blood_Berserker&demo=true');
  await waitForRender(page);
  await expect(page).toHaveURL(/\/tools\/builds\/blood-berserker/);
});

// BuildCard stopped being one big <a> so the class links could live inside it. These cover what
// that restructure could plausibly break.
// /tools/builds/{new,edit,my-builds,view} are pages, not classes - the header's My builds button
// matches a naive href prefix and is disabled, which is not what these tests mean.
const classPageLinks = (page) => page.locator(
  'a[href^="/tools/builds/"]:not([href*="view?id="]):not([href$="/my-builds"])'
  + ':not([href$="/new"]):not([href$="/edit"])'
);

test.describe('build card click targets', () => {
  test('clicking the card body opens the build', async ({ page }) => {
    await page.goto('/tools/builds?demo=true');
    await waitForRender(page);

    // The class icon sits inside the card's clickable area but inside no anchor, so it exercises
    // the card's own onClick rather than a link.
    // The class icon sits inside the card's clickable area but inside no anchor, so clicking it
    // exercises the card's own onClick rather than a link.
    const icon = page.locator('img[src*="ClassIcons"]').first();
    await expect(icon).toBeVisible();
    await icon.click();

    await expect(page).toHaveURL(/\/tools\/builds\/view\?id=[A-Za-z0-9]+/);
  });

  test('clicking a class breadcrumb opens the class page, not the build', async ({ page }) => {
    await page.goto('/tools/builds?demo=true');
    await waitForRender(page);

    const crumb = classPageLinks(page).first();
    const href = await crumb.getAttribute('href');
    await crumb.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test('the build title is a real link, so it survives middle click and keyboard', async ({ page }) => {
    await page.goto('/tools/builds?demo=true');
    await waitForRender(page);

    const titleLink = page.locator('a[href*="/tools/builds/view?id="]').first();
    await expect(titleLink).toHaveAttribute('href', /\/tools\/builds\/view\?id=/);
    await expect(titleLink).toBeVisible();
  });
});
