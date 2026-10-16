import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers';

// Everything here reads the served bytes with no JS executed - the state Googlebot is in when it
// decides whether a page is worth indexing. Asserting against the hydrated DOM would pass even if
// the export shipped nothing at all, which is how the site went months with no <title>.

// A href pattern cannot tell a build slug from a class slug - 'blood-berserker' looks exactly
// like '<shortId>-<title>'. The hub ships the list of shortIds that have a static page, so the
// hrefs are matched against that rather than guessed at.
const pagePropsIn = (html) => {
  const json = html.match(/id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)?.[1];
  return JSON.parse(json).props.pageProps;
};

const staticIdsIn = (html) => {
  const builds = pagePropsIn(html).initialBuilds;
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

// Every build also answers on /tools/builds/view?id=, so without a canonical the two URLs compete
// for the same content. static-head.spec.js checks the served bytes of every build page; this is
// the hydrated half, where _app takes the canonical over and the export's copy retires.
test('a build page linked from the hub canonicalises to itself after hydration', async ({ page, request }) => {
  const hub = await (await request.get('/tools/builds')).text();
  const href = buildHrefsIn(hub)[0];
  expect(href, 'no build links on the hub to follow').toBeTruthy();
  const expected = `https://idleontoolbox.com${href}`;

  await page.goto(href);
  await waitForRender(page);

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expected);
});

// Which classes have builds changes whenever someone publishes, so the pages are found from the
// export itself: the hub's class links, plus each class page's siblings (the hub skips empty ones).
const classPages = async (request) => {
  const hub = await (await request.get('/tools/builds')).text();
  const ids = staticIdsIn(hub);
  const queue = [...new Set([...hub.matchAll(/href="\/tools\/builds\/([a-z-]+)"/g)].map((m) => m[1]))]
    .filter((slug) => slug !== 'my-builds' && !ids.some((id) => slug.startsWith(`${id}-`)));
  const pages = new Map();
  while (queue.length) {
    const slug = queue.shift();
    if (pages.has(slug)) continue;
    const html = await (await request.get(`/tools/builds/${slug}`)).text();
    const props = pagePropsIn(html);
    pages.set(slug, { html, props });
    queue.push(...(props.siblings || []));
  }
  return [...pages.values()].filter(({ props }) => props.kind === 'class');
};

test('a class page with no builds is noindex, one with builds is not', async ({ request }) => {
  const pages = await classPages(request);
  const empty = pages.find(({ props }) => props.builds.length === 0);
  const populated = pages.find(({ props }) => props.builds.length > 0);
  expect(empty, 'every class has a build, nothing to check noindex on').toBeTruthy();

  expect(empty.html).toContain('noindex');
  expect(populated.html).toContain('<meta name="googlebot" content="index,follow"');
});
