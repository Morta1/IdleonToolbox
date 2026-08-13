import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// A generated class page must be the hub with a class preselected, not a stripped-down landing
// page for crawlers. It previously had no search, no sort, no tag filter and bare unstyled text
// links - better for Googlebot, worse for anyone who clicked through from it.

const CONTROLS = [
  { name: 'search field', locator: (p) => p.getByPlaceholder(/Search builds/i) },
  { name: 'class strip', locator: (p) => p.getByRole('link', { name: 'All', exact: true }) },
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

// Class slugs and build slugs share the /tools/builds/ namespace, so an href pattern can't tell
// 'blood-berserker' from a build slug. The links say which they are.
const classPageLinks = (page) => page.locator('a[data-class-link]');
const buildLinks = (page) => page.locator(
  'a[href^="/tools/builds/"]:not([data-class-link]):not([href$="/my-builds"])'
  + ':not([href$="/new"]):not([href$="/edit"])'
);

test('build cards link to the class pages they belong to', async ({ page }) => {
  await page.goto('/tools/builds?demo=true');
  await waitForRender(page);

  const hrefs = await classPageLinks(page)
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')));

  expect(hrefs.length, 'no class links found').toBeGreaterThan(0);
  // Families and subclasses both, e.g. /tools/builds/mage and /tools/builds/wizard.
  expect(new Set(hrefs).size, 'should link to more than one class').toBeGreaterThan(1);
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

  const cards = buildLinks(page);
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

// One control, one URL per class. The strip replaced a MUI menu whose items were never in the
// DOM until it opened - so no crawler ever saw a class link, and changing class took two clicks.
test('the class strip links every family from the hub', async ({ page }) => {
  await page.goto('/tools/builds?demo=true');
  await waitForRender(page);

  for (const fam of ['Beginner', 'Warrior', 'Archer', 'Mage']) {
    await expect(page.getByRole('link', { name: fam, exact: true }).first())
      .toHaveAttribute('href', `/tools/builds/${fam.toLowerCase()}`);
  }
  await expect(page.getByRole('link', { name: 'All', exact: true }))
    .toHaveAttribute('href', '/tools/builds');
});

test('a family page exposes its subclasses, and only its own', async ({ page }) => {
  await page.goto('/tools/builds/warrior?demo=true');
  await waitForRender(page);

  await expect(page.getByRole('link', { name: 'Blood Berserker', exact: true }).first())
    .toHaveAttribute('href', '/tools/builds/blood-berserker');
  // A Mage subclass has no business in the strip on a Warrior page. Cards can still name one,
  // so this checks the strip itself.
  await expect(page.locator('a[data-class-link][href="/tools/builds/wizard"]')).toHaveCount(0);
});

test('clicking a family in the strip navigates to its page', async ({ page }) => {
  await page.goto('/tools/builds?demo=true');
  await waitForRender(page);

  await page.getByRole('link', { name: 'Warrior', exact: true }).first().click();
  await expect(page).toHaveURL(/\/tools\/builds\/warrior/);
  await expect(page.getByRole('heading', { name: /Idleon Warrior Builds/i })).toBeVisible();
});

// The redirect that used to live here turned an unvalidated param into a router path
// ('../../etc' navigated to /etc) and trained browsers to autocomplete /tools/builds into a
// class URL. The param now falls through to the hub, which canonicalises to itself.
for (const value of ['Blood_Berserker', 'garbage', '../../etc']) {
  test(`?class=${value} stays on the hub`, async ({ page }) => {
    await page.goto(`/tools/builds?class=${encodeURIComponent(value)}&demo=true`);
    await waitForRender(page);
    expect(new URL(page.url()).pathname).toBe('/tools/builds');
  });
}

// BuildCard stopped being one big <a> so the class links could live inside it. These cover what
// that restructure could plausibly break.
test.describe('build card click targets', () => {
  test('clicking the card body opens the build', async ({ page }) => {
    await page.goto('/tools/builds?demo=true');
    await waitForRender(page);

    // The class icon sits inside the card's clickable area but inside no anchor, so clicking it
    // exercises the card's own onClick rather than a link. The strip's pills carry the same
    // icons inside anchors and are decorative there, so alt text is what separates them.
    const icon = page.locator('img[src*="ClassIcons"][alt]:not([alt=""])').first();
    await expect(icon).toBeVisible();
    await icon.click();

    await expect(page).toHaveURL(/\/tools\/builds\/[a-z0-9]+-/);
  });

  test('clicking a class breadcrumb opens the class page, not the build', async ({ page }) => {
    await page.goto('/tools/builds?demo=true');
    await waitForRender(page);

    const crumb = classPageLinks(page).last();
    const href = await crumb.getAttribute('href');
    await crumb.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test('the build title is a real link, so it survives middle click and keyboard', async ({ page }) => {
    await page.goto('/tools/builds?demo=true');
    await waitForRender(page);

    const titleLink = buildLinks(page).first();
    await expect(titleLink).toHaveAttribute('href', /^\/tools\/builds\//);
    await expect(titleLink).toBeVisible();
  });
});
