import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

// Asserts on the raw served HTML, never on the rendered DOM. Every page shipped without a
// <title> for months while __test__/page-seo.test.js passed, because that test checks the
// PAGE_SEO map rather than the bytes a crawler receives. next/head silently dropped the tag.
// This spec is the output gate: it fetches each route the way Googlebot does, with no JS.

const PAGES_DIR = path.join(process.cwd(), 'pages');

const discoverRoutes = () => {
  const routes = [];
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        // A dynamic SEGMENT is not a URL either, and pages/wiki/[kind]/index.jsx puts one in a
        // directory name rather than a file name - walking into it yields "/wiki/[kind]", which
        // 404s. Same reasoning as the file-level check below.
        if (entry.includes('[')) continue;
        walk(full, `${prefix}/${entry}`);
        continue;
      }
      if (!entry.endsWith('.jsx')) continue;
      const name = entry.replace(/\.jsx$/, '');
      if (['_app', '_document', '_error'].includes(name)) continue;
      // Dynamic routes aren't URLs. The pages they generate are covered by exportedBuildRoutes.
      if (name.includes('[')) continue;
      routes.push(name === 'index' ? (prefix || '/') : `${prefix}/${name}`);
    }
  };
  walk(PAGES_DIR);
  return routes.sort();
};

// Read from out/ rather than the API: the point is to check what actually shipped, and these
// pages are the ones whose titles come from static props rather than the PAGE_SEO map.
const exportedBuildRoutes = () => {
  const dir = path.join(process.cwd(), 'out', 'tools', 'builds');
  const notClassPages = new Set(['new', 'edit', 'my-builds', 'view']);
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''))
      .filter((slug) => !notClassPages.has(slug))
      .map((slug) => `/tools/builds/${slug}`);
  } catch {
    return [];
  }
};

const titleOf = (html) => html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];

test.describe('static export ships crawlable head tags', () => {
  for (const route of [...discoverRoutes(), ...exportedBuildRoutes()]) {
    test(`${route} has a title and description in the served HTML`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status(), `${route} did not serve`).toBe(200);

      const html = await response.text();
      const occurrences = (html.match(/<title[^>]*>/g) || []).length;

      expect(occurrences, `${route} must have exactly one <title>`).toBe(1);
      expect(titleOf(html)?.trim(), `${route} has an empty <title>`).toBeTruthy();
      expect(html, `${route} is missing its meta description`).toMatch(
        /<meta name="description" content="[^"]+"/
      );
      // Two owners writing a description is how it drifts: _document's copy could not be deduped
      // against next/head's, so pages shipped two and the _document one went stale on navigation.
      const descriptions = (html.match(/<meta name="description"/g) || []).length;
      expect(descriptions, `${route} must have exactly one meta description`).toBe(1);
    });
  }
});

// Canonicals had the same failure shape as the title did: <NextSeo canonical> renders below the
// <WaitForRouter> gate, so for a long time no exported page carried one at all and nothing
// noticed. _app declares one above the gate now.
test.describe('static export ships canonicals', () => {
  for (const route of [...discoverRoutes(), ...exportedBuildRoutes()]) {
    test(`${route} names its own canonical URL`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)]
        .map((m) => m[1]);

      // A noindex page is deliberately exempt - it has nothing to consolidate, and
      // /tools/builds/view cannot name its own URL without the ?id= it renders from.
      if (/content="noindex/.test(html)) {
        expect(canonicals, `${route} is noindex and should not claim a canonical`).toHaveLength(0);
        return;
      }

      expect(canonicals, `${route} must have exactly one canonical`).toHaveLength(1);
      // The canonical must name THIS page. A route-pattern canonical ('/tools/builds/[slug]')
      // or a stale one from another page is worse than none.
      expect(canonicals[0]).toBe(`https://idleontoolbox.com${route === '/' ? '/' : route}`);
    });
  }
});

// The tab went blank for about a second on every page: next/head reconciled the head on
// hydration and removed the title _document had written, and NextSeo only restored it once the
// router gate opened. _app declares the title itself now, so next/head owns one from the first
// render onwards.
test('the title never blanks while the page hydrates', async ({ page }) => {
  const seen = [];
  await page.goto('/tools/builds/wizard');
  for (let i = 0; i < 12; i++) {
    seen.push(await page.title());
    await page.waitForTimeout(250);
  }
  const blanks = seen.filter((t) => !t?.trim());
  expect(blanks, `title blanked during hydration: ${JSON.stringify(seen)}`).toHaveLength(0);
  expect(seen.at(-1)).toBe('Idleon Wizard Builds | Idleon Toolbox');
});

// One <title>, one canonical and one description, no matter how many places write them. The
// DOM-based tests below deliberately cover more than one page kind: every duplicate-tag bug found
// so far was invisible on /tools/builds/wizard, where both writers happen to agree.
const HYDRATED_SAMPLE = ['/', '/tools/builds', '/tools/builds/wizard', '/account/misc/guild'];

for (const route of HYDRATED_SAMPLE) {
  test(`head tags are not duplicated after hydration on ${route}`, async ({ page }) => {
    await page.goto(route);
    await waitForRender(page);
    await expect(page.locator('title')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  });
}

// The description used to come from _document, which next/head cannot dedupe or update: the tag
// froze at whatever page the visitor landed on and every later navigation left it describing the
// wrong page.
test('the description follows a client-side navigation', async ({ page }) => {
  await page.goto('/tools/builds/wizard');
  await waitForRender(page);

  await page.getByRole('link', { name: 'Shaman', exact: true }).first().click();
  await expect(page).toHaveURL(/\/tools\/builds\/shaman/);
  await page.waitForTimeout(1500);

  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]'))
    .toHaveAttribute('content', /Shaman/);
});

// next-seo emits a robots tag whether or not the page asked for one, and it replaces _app's by
// meta-name dedupe. A page that ships noindex must therefore repeat it in its own <NextSeo>, or
// it un-noindexes itself the moment JS runs - which is invisible to any check on the bytes.
test('a noindex page stays noindex after hydration', async ({ page }) => {
  await page.goto('/tools/builds/view?id=nonexistent');
  await waitForRender(page);

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute('content', /noindex/);
  // Nothing to consolidate, and the 404 case would otherwise claim a canonical for a URL that
  // does not resolve.
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

// The canonical is built from asPath, so it follows a client-side navigation. A build-time value
// would be right only for the URL the visitor first landed on.
test('the canonical follows a client-side navigation', async ({ page }) => {
  await page.goto('/tools/builds/wizard');
  await waitForRender(page);

  await page.getByRole('link', { name: 'Shaman', exact: true }).first().click();
  await expect(page).toHaveURL(/\/tools\/builds\/shaman/);
  await page.waitForTimeout(1500);

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]'))
    .toHaveAttribute('href', 'https://idleontoolbox.com/tools/builds/shaman');
});

// PAGE_SEO is keyed by route pattern, so every page from a dynamic route would share one title
// unless the page supplies its own through static props. This is the assertion that catches a
// regression back to that.
test('every page from the slug route gets its own title, not the fallback', async ({ request }) => {
  const routes = exportedBuildRoutes();
  expect(routes.length, 'no pages were exported for the slug route').toBeGreaterThan(1);

  const titles = [];
  for (const route of routes) {
    const html = await (await request.get(route)).text();
    titles.push(titleOf(html));
  }

  for (const title of titles) {
    expect(title).not.toBe('Idleon Builds by Class | Idleon Toolbox');
  }

  // One route serves class pages and build pages; their titles say which is which. Class titles
  // must be unique - two classes sharing one is the route-pattern fallback leaking back in.
  // Build titles legitimately repeat: two people can publish "Wizard / AFK (~50)".
  const classTitles = titles.filter((t) => /^Idleon .+ Builds \| /.test(t));
  expect(classTitles.length, 'no class pages among the exported routes').toBeGreaterThan(1);
  expect(new Set(classTitles).size, `class titles were not unique: ${classTitles.join(' | ')}`)
    .toBe(classTitles.length);

  const buildTitles = titles.filter((t) => / Build — .+ \| /.test(t));
  expect(buildTitles.length, 'no build pages among the exported routes').toBeGreaterThan(1);
});

// Field data (Sept 2026) put the LCP element on nearly every page at the h1, painted only after
// hydration with render-delay the whole of the metric. The pre-hydration shell now ships it in
// the bytes. Same gate as the head tags: assert on the served HTML, never the rendered DOM.
test.describe('static export ships the page heading', () => {
  for (const route of [...discoverRoutes(), ...exportedBuildRoutes()]) {
    test(`${route} has an h1 in the served HTML`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      // A noindex page (the 404, /tools/builds/view) has no heading to ship.
      if (/content="noindex/.test(html)) return;
      expect(html, `${route} shipped no h1`).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
    });
  }

  // The hero outsizes every text block on the landing page: unless it is in the export too, its
  // own post-hydration paint re-anchors LCP and the heading buys nothing. In the bytes, the
  // browser's preload scanner requests it before any script runs.
  test('/ ships the hero image', async ({ request }) => {
    const html = await (await request.get('/')).text();
    expect(html).toMatch(/<img[^>]+src="\/etc\/bg_0\.png"/);
  });
});
