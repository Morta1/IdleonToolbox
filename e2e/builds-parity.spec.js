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

test('class page links to sibling classes and back to the hub', async ({ page }) => {
  await page.goto('/tools/builds/barbarian?demo=true');
  await waitForRender(page);

  await expect(page.getByRole('link', { name: 'All builds' })).toHaveAttribute(
    'href', '/tools/builds'
  );
  await expect(page.getByRole('link', { name: 'Wizard', exact: true })).toHaveAttribute(
    'href', '/tools/builds/wizard'
  );
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
