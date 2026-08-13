import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// Everything here reads the served bytes with no JS executed - the state Googlebot is in when it
// decides whether a page is worth indexing. Asserting against the hydrated DOM would pass even if
// the export shipped nothing at all, which is how the site went months with no <title>.

// A href pattern cannot tell a build slug from a class slug - 'blood-berserker' looks exactly
// like '<shortId>-<title>'. The hub ships the list of shortIds that have a static page, so the
// hrefs are matched against that rather than guessed at.
const staticIdsIn = (html) => {
  const json = html.match(/id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1];
  const builds = JSON.parse(json).props.pageProps.initialBuilds;
  // Every build in static props has an exported page - that is what getStaticPaths generated
  // them from. The slug lowercases the shortId, so this does too.
  return builds.map((b) => b.shortId.toLowerCase());
};

const buildHrefsIn = (html) => {
  const ids = staticIdsIn(html);
  const hrefs = [...html.matchAll(/href="(\/tools\/builds\/[^"]+)"/g)].map((m) => m[1]);
  return [...new Set(hrefs.filter((h) => ids.some((id) => h.startsWith(`/tools/builds/${id}-`))))];
};

test('the hub links every build in its HTML, not after a fetch', async ({ request }) => {
  const html = await (await request.get('/tools/builds')).text();
  // Every build that has a static page must be linked from the hub - the hub is the complete
  // index, not a 24-item teaser, and these links are the only ones a crawler sees without JS.
  expect(buildHrefsIn(html).length).toBe(staticIdsIn(html).length);
  expect(buildHrefsIn(html).length).toBeGreaterThan(50);
});

test('the hub links every class in its HTML', async ({ request }) => {
  const html = await (await request.get('/tools/builds')).text();
  for (const slug of ['beginner', 'warrior', 'archer', 'mage']) {
    expect(html, `no link to /tools/builds/${slug}`).toContain(`href="/tools/builds/${slug}"`);
  }
});

test('a build page ships its own title, not the route pattern fallback', async ({ request }) => {
  const hub = await (await request.get('/tools/builds')).text();
  const href = buildHrefsIn(hub)[0];
  expect(href, 'no build links on the hub to follow').toBeTruthy();

  const res = await request.get(href);
  expect(res.status(), `${href} did not serve a page`).toBe(200);
  const html = await res.text();

  const titles = [...html.matchAll(/<title[^>]*>([^<]*)<\/title>/g)].map((m) => m[1]);
  expect(titles, `${href} should have exactly one title`).toHaveLength(1);
  expect(titles[0]).toMatch(/Build — .+ \| Idleon Toolbox$/);
});

// Every build also answers on /tools/builds/view?id=, so without a canonical the two URLs compete
// for the same content. It has to hold in both states: in the served bytes (_document writes it)
// and after hydration (_app takes it over, and the export's copy retires).
test('a build page canonicalises to itself, before and after hydration', async ({ page, request }) => {
  const hub = await (await request.get('/tools/builds')).text();
  const href = buildHrefsIn(hub)[0];
  const expected = `https://idleontoolbox.com${href}`;

  const html = await (await request.get(href)).text();
  const inBytes = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  expect(inBytes, `${href} shipped no canonical`).toEqual([expected]);

  await page.goto(href);
  await waitForRender(page);

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expected);
});

// One URL serving many builds, kept alive only for builds published since the last deploy.
// Without the canonical it competes with the static page for the same content.
test('view?id= still serves and defers to the static page', async ({ request }) => {
  const res = await request.get('/tools/builds/view');
  expect(res.status()).toBe(200);
});

test('a class page with no builds is noindex, one with builds is not', async ({ request }) => {
  const empty = await (await request.get('/tools/builds/siege-breaker')).text();
  expect(empty).toContain('noindex');

  const populated = await (await request.get('/tools/builds/wizard')).text();
  expect(populated).toContain('<meta name="googlebot" content="index,follow"');
});
