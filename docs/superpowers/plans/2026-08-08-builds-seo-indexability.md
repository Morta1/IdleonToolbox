# Builds SEO Indexability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore search indexability for `/tools/builds` by pre-rendering the landing page, 18 class pages, and per-build metadata into the Next.js static export.

**Architecture:** A dependency-free ESM helper fetches all community builds from the Cloudflare Worker at build time. A second dependency-free module turns that build list into route slugs. `getStaticProps`/`getStaticPaths` consume both to emit real static HTML with correct `<title>` tags. Per-build URLs keep their existing `?id=` query param and get metadata from a manifest embedded in the page's static props.

**Tech Stack:** Next.js 16.2.10 (Pages Router, `output: 'export'`), React 19, next-seo 5.15, vitest + jsdom, Node 24, GitHub Actions → GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-08-builds-seo-indexability-design.md`

## Global Constraints

- **`output: 'export'`** — `getStaticPaths` MUST use `fallback: false`. `fallback: true` and `fallback: 'blocking'` are unsupported and will fail the build.
- **No URL changes to existing routes.** `/tools/builds/view?id=<shortId>` stays a query param. Do not create `view/[id].jsx`.
- **Browser User-Agent is mandatory** on every build-time request to the Worker. Without it Cloudflare returns `HTTP 403, error code 1010`.
- **Build-time fetch failure MUST fail the build.** Never return a partial or empty list — a "successful" deploy missing subclass paths 404s URLs Google has indexed.
- **Modules imported by `utility/generate-sitemap.mjs` must be dependency-free ESM `.mjs`.** It is a plain Node script and cannot resolve `@parsers/talents` (TypeScript) or Next path aliases.
- **Tests:** vitest, located under `__test__/`, matching `__test__/**/*.test.{js,ts,jsx,tsx}`. Run with `npm test`.
- **Threshold is 1** — a subclass gets a page if it has at least one build. The 4 families always get pages regardless of count.
- **Slug format:** `CLASSES` key lowercased, underscores → hyphens. `Blood_Berserker` → `blood-berserker`.
- **Components stay `.jsx`** per CLAUDE.md. New utilities are `.mjs` for the Node-import constraint above.
- **Patch notes:** per CLAUDE.md, user-facing changes get an entry in `data/patch-notes.js`. Covered in Task 6.
- **Commit once per task**, on the `feat/builds-seo-indexability` branch only. Never commit to `main` and never push. The branch is reviewed as a whole before merge. Each task's final step stages and commits that task's files.

---

### Task 1: Build-time builds fetcher

Fetches every community build from the Worker with cursor pagination. Throws on any failure so a broken fetch fails the build rather than silently shipping fewer pages.

**Files:**
- Create: `utility/builds/static-fetch.mjs`
- Test: `__test__/utility/builds/static-fetch.test.js`

**Interfaces:**
- Consumes: nothing (entry point).
- Produces:
  - `fetchAllBuildsAtBuildTime(): Promise<Build[]>` — throws `Error` on failure.
  - `Build` shape (as returned by the Worker's list endpoint):
    `{ shortId: string, title: string, class: string, subclass: string|null, ownerName: string, tags: string[], likeCount: number, viewCount: number, createdAt: string }`
  - `BUILD_FETCH_USER_AGENT: string`

- [ ] **Step 1: Write the failing test**

Create `__test__/utility/builds/static-fetch.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchAllBuildsAtBuildTime,
  resetBuildsCacheForTests,
  BUILD_FETCH_USER_AGENT
} from '@utility/builds/static-fetch.mjs';

const build = (shortId, cls = 'Warrior', subclass = 'Barbarian') => ({
  shortId, title: `Build ${shortId}`, class: cls, subclass,
  ownerName: 'Anon', tags: ['afk'], likeCount: 0, viewCount: 1,
  createdAt: '2026-07-01T00:00:00.000Z'
});

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });

describe('fetchAllBuildsAtBuildTime', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_BUILDS_URL', 'https://example.test/api');
    resetBuildsCacheForTests();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fetches once and shares the result across callers', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: null }));
    const [first, second] = await Promise.all([
      fetchAllBuildsAtBuildTime(),
      fetchAllBuildsAtBuildTime()
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('does not cache a failure — a retry can still succeed', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
      .mockResolvedValueOnce(okResponse({ items: [build('a')], nextCursor: null }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/500/);
    const result = await fetchAllBuildsAtBuildTime();
    expect(result).toHaveLength(1);
  });

  it('returns builds from a single page', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: null }));
    const result = await fetchAllBuildsAtBuildTime();
    expect(result).toHaveLength(1);
    expect(result[0].shortId).toBe('a');
  });

  it('sends a browser User-Agent to get past Cloudflare', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [build('a')], nextCursor: null }));
    await fetchAllBuildsAtBuildTime();
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers['User-Agent']).toBe(BUILD_FETCH_USER_AGENT);
    expect(BUILD_FETCH_USER_AGENT).toMatch(/Mozilla/);
  });

  it('follows nextCursor until exhausted', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(okResponse({ items: [build('a')], nextCursor: 'c1' }))
      .mockResolvedValueOnce(okResponse({ items: [build('b')], nextCursor: null }));
    const result = await fetchAllBuildsAtBuildTime();
    expect(result.map((b) => b.shortId)).toEqual(['a', 'b']);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('passes the cursor on the second request', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(okResponse({ items: [build('a')], nextCursor: 'c1' }))
      .mockResolvedValueOnce(okResponse({ items: [build('b')], nextCursor: null }));
    await fetchAllBuildsAtBuildTime();
    expect(global.fetch.mock.calls[1][0]).toContain('cursor=c1');
  });

  it('throws on a non-ok response rather than returning a partial list', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/403/);
  });

  it('throws when the API returns zero builds', async () => {
    global.fetch = vi.fn(async () => okResponse({ items: [], nextCursor: null }));
    await expect(fetchAllBuildsAtBuildTime()).rejects.toThrow(/no builds/i);
  });

  it('skips malformed records but keeps valid ones', async () => {
    global.fetch = vi.fn(async () => okResponse({
      items: [build('a'), { title: 'no id' }, { shortId: 'c' }],
      nextCursor: null
    }));
    const result = await fetchAllBuildsAtBuildTime();
    expect(result.map((b) => b.shortId)).toEqual(['a']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- static-fetch`
Expected: FAIL — cannot resolve `@utility/builds/static-fetch.mjs`.

- [ ] **Step 3: Write the implementation**

Create `utility/builds/static-fetch.mjs`:

```js
// Build-time fetcher for community builds.
//
// Dependency-free ESM on purpose: utility/generate-sitemap.mjs is a plain Node
// script and cannot resolve Next path aliases or TypeScript sources.
//
// This module THROWS on failure by design. Subclass page paths are derived from
// this data, so a build that silently proceeds with fewer builds would deploy a
// site missing pages Google has already indexed. A failed build leaves the
// previous deploy serving; a degraded build 404s live URLs.

// Cloudflare's browser-integrity check rejects default fetch agents with
// HTTP 403 / error code 1010. A browser UA is required.
export const BUILD_FETCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const PAGE_SIZE = 100;
const MAX_PAGES = 60; // runaway guard: 6000 builds

const isValidBuild = (item) =>
  Boolean(item && typeof item.shortId === 'string' && typeof item.class === 'string');

// getStaticProps runs once per generated page, so [class].jsx alone would
// refetch everything 18 times. Memoise the in-flight promise: one fetch per
// build process, shared by every caller. Not exported — callers should not
// need to know this exists.
let cachedBuildsPromise = null;

export function resetBuildsCacheForTests() {
  cachedBuildsPromise = null;
}

export function fetchAllBuildsAtBuildTime() {
  if (!cachedBuildsPromise) {
    cachedBuildsPromise = doFetchAllBuilds().catch((error) => {
      // Don't cache a rejection — a retry should be able to succeed.
      cachedBuildsPromise = null;
      throw error;
    });
  }
  return cachedBuildsPromise;
}

async function doFetchAllBuilds() {
  const base = process.env.NEXT_PUBLIC_BUILDS_URL;
  if (!base) {
    throw new Error('NEXT_PUBLIC_BUILDS_URL is not set — cannot fetch builds at build time');
  }

  const all = [];
  let cursor = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set('cursor', cursor);
    const url = `${base}/builds?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BUILD_FETCH_USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`Builds API returned HTTP ${response.status} for ${url}`);
    }

    const data = await response.json();
    all.push(...(data?.items || []).filter(isValidBuild));

    cursor = data?.nextCursor || null;
    if (!cursor) break;
  }

  if (all.length === 0) {
    throw new Error('Builds API returned no builds — refusing to build a site without build pages');
  }

  return all;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- static-fetch`
Expected: PASS, 9 tests.

- [ ] **Step 5: Verify against the real Worker**

Run: `node -e "import('./utility/builds/static-fetch.mjs').then(async m => { process.env.NEXT_PUBLIC_BUILDS_URL='https://builds.idleontoolbox.workers.dev/api'; const b = await m.fetchAllBuildsAtBuildTime(); console.log('builds:', b.length); })"`
Expected: `builds: 110` (or higher — the count grows over time).

If this prints an HTTP 403, the User-Agent is not being sent correctly.

- [ ] **Step 6: Commit**

```bash
git add utility/builds/static-fetch.mjs __test__/utility/builds/static-fetch.test.js
```

---

### Task 2: Class routing helpers

Pure functions turning a build list into route slugs, and a slug back into a filtered build list. This is where the threshold-1 rule lives.

**Files:**
- Create: `utility/builds/class-paths.mjs`
- Test: `__test__/utility/builds/class-paths.test.js`

**Interfaces:**
- Consumes: the `Build` shape from Task 1.
- Produces:
  - `BUILD_FAMILIES: string[]` — `['Beginner', 'Warrior', 'Archer', 'Mage']`
  - `classToSlug(name: string): string`
  - `slugToDisplayName(slug: string): string`
  - `getBuildClassSlugs(builds: Build[]): string[]`
  - `buildsForSlug(builds: Build[], slug: string): Build[]`
  - `isFamilySlug(slug: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `__test__/utility/builds/class-paths.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  BUILD_FAMILIES,
  classToSlug,
  slugToDisplayName,
  getBuildClassSlugs,
  buildsForSlug,
  isFamilySlug
} from '@utility/builds/class-paths.mjs';

const b = (shortId, cls, subclass) => ({ shortId, title: shortId, class: cls, subclass });

const FIXTURE = [
  b('1', 'Warrior', 'Barbarian'),
  b('2', 'Warrior', 'Barbarian'),
  b('3', 'Warrior', 'Blood_Berserker'),
  b('4', 'Warrior', null),
  b('5', 'Mage', 'Wizard'),
  b('6', 'Beginner', 'Voidwalker')
];

describe('classToSlug', () => {
  it('lowercases a simple class name', () => {
    expect(classToSlug('Warrior')).toBe('warrior');
  });

  it('converts underscores to hyphens', () => {
    expect(classToSlug('Blood_Berserker')).toBe('blood-berserker');
    expect(classToSlug('Elemental_Sorcerer')).toBe('elemental-sorcerer');
  });
});

describe('slugToDisplayName', () => {
  it('title-cases a single word', () => {
    expect(slugToDisplayName('warrior')).toBe('Warrior');
  });

  it('title-cases each word of a hyphenated slug', () => {
    expect(slugToDisplayName('blood-berserker')).toBe('Blood Berserker');
  });
});

describe('isFamilySlug', () => {
  it('recognises the four families', () => {
    expect(isFamilySlug('warrior')).toBe(true);
    expect(isFamilySlug('mage')).toBe(true);
  });

  it('rejects subclasses', () => {
    expect(isFamilySlug('barbarian')).toBe(false);
  });
});

describe('getBuildClassSlugs', () => {
  it('always includes all four families', () => {
    const slugs = getBuildClassSlugs([]);
    expect(slugs).toEqual(expect.arrayContaining(['beginner', 'warrior', 'archer', 'mage']));
  });

  it('includes families even when they have no builds', () => {
    const slugs = getBuildClassSlugs([b('1', 'Warrior', 'Barbarian')]);
    expect(slugs).toContain('archer');
  });

  it('includes any subclass with at least one build (threshold 1)', () => {
    const slugs = getBuildClassSlugs(FIXTURE);
    expect(slugs).toContain('barbarian');
    expect(slugs).toContain('blood-berserker');
    expect(slugs).toContain('voidwalker');
  });

  it('omits subclasses with no builds', () => {
    const slugs = getBuildClassSlugs(FIXTURE);
    expect(slugs).not.toContain('siege-breaker');
    expect(slugs).not.toContain('arcane-cultist');
  });

  it('ignores builds with a null subclass', () => {
    const slugs = getBuildClassSlugs([b('4', 'Warrior', null)]);
    expect(slugs).toEqual(expect.arrayContaining(['warrior']));
    expect(slugs.filter((s) => s === 'warrior')).toHaveLength(1);
  });

  it('returns no duplicates', () => {
    const slugs = getBuildClassSlugs(FIXTURE);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('buildsForSlug', () => {
  it('returns every build in a family, including subclassed ones', () => {
    const result = buildsForSlug(FIXTURE, 'warrior');
    expect(result.map((x) => x.shortId)).toEqual(['1', '2', '3', '4']);
  });

  it('returns only builds of a specific subclass', () => {
    const result = buildsForSlug(FIXTURE, 'barbarian');
    expect(result.map((x) => x.shortId)).toEqual(['1', '2']);
  });

  it('matches hyphenated subclass slugs', () => {
    const result = buildsForSlug(FIXTURE, 'blood-berserker');
    expect(result.map((x) => x.shortId)).toEqual(['3']);
  });

  it('returns an empty array for an unknown slug', () => {
    expect(buildsForSlug(FIXTURE, 'siege-breaker')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- class-paths`
Expected: FAIL — cannot resolve `@utility/builds/class-paths.mjs`.

- [ ] **Step 3: Write the implementation**

Create `utility/builds/class-paths.mjs`:

```js
// Routing helpers for /tools/builds/[class].
//
// Dependency-free ESM on purpose — utility/generate-sitemap.mjs imports this
// and is a plain Node script that cannot resolve Next aliases or TypeScript.
//
// BUILD_FAMILIES mirrors FAMILY_ORDER in utility/builds/classes.js. It is
// duplicated rather than imported because that module reaches into
// parsers/talents.ts. These four families are fixed game concepts.

export const BUILD_FAMILIES = ['Beginner', 'Warrior', 'Archer', 'Mage'];

const FAMILY_SLUGS = BUILD_FAMILIES.map((f) => f.toLowerCase());

export const classToSlug = (name) => String(name).toLowerCase().replace(/_/g, '-');

export const slugToDisplayName = (slug) =>
  String(slug)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const isFamilySlug = (slug) => FAMILY_SLUGS.includes(slug);

// Families always get a page so they can act as the catch-all for subclasses
// with no builds. Subclasses get a page if they have at least one build.
export function getBuildClassSlugs(builds) {
  const slugs = new Set(FAMILY_SLUGS);
  for (const build of builds || []) {
    if (build?.subclass) slugs.add(classToSlug(build.subclass));
  }
  return [...slugs];
}

export function buildsForSlug(builds, slug) {
  const list = builds || [];
  if (isFamilySlug(slug)) {
    return list.filter((build) => classToSlug(build?.class) === slug);
  }
  return list.filter((build) => build?.subclass && classToSlug(build.subclass) === slug);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- class-paths`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit**

```bash
git add utility/builds/class-paths.mjs __test__/utility/builds/class-paths.test.js
```

---

### Task 3: `/tools/builds/[class]` static class pages

The 18 pages that target the collapsed class queries. This is the highest-value task in the plan.

**Files:**
- Create: `pages/tools/builds/[class].jsx`
- Test: `__test__/pages/builds-class-page.test.jsx`

**Interfaces:**
- Consumes: `fetchAllBuildsAtBuildTime` (Task 1); `getBuildClassSlugs`, `buildsForSlug`, `slugToDisplayName` (Task 2); the existing `BuildCard` component at `components/tools/builds/BuildCard.jsx`.
- Produces: `getBuildClassStaticPaths(builds)` and `getBuildClassStaticProps(builds, slug)` — exported pure helpers so the page's data logic is testable without Next's build pipeline.

- [ ] **Step 1: Write the failing test**

Create `__test__/pages/builds-class-page.test.jsx`:

```js
import { describe, it, expect } from 'vitest';
import {
  getBuildClassStaticPaths,
  getBuildClassStaticProps
} from '../../pages/tools/builds/[class].jsx';

const b = (shortId, cls, subclass) => ({
  shortId, title: shortId, class: cls, subclass,
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0
});

const FIXTURE = [
  b('1', 'Warrior', 'Barbarian'),
  b('2', 'Warrior', 'Barbarian'),
  b('3', 'Mage', 'Wizard')
];

describe('getBuildClassStaticPaths', () => {
  it('uses fallback: false, required by output: export', () => {
    expect(getBuildClassStaticPaths(FIXTURE).fallback).toBe(false);
  });

  it('emits a path entry per slug in the shape Next expects', () => {
    const { paths } = getBuildClassStaticPaths(FIXTURE);
    expect(paths).toContainEqual({ params: { class: 'barbarian' } });
    expect(paths).toContainEqual({ params: { class: 'warrior' } });
  });

  it('includes all four families plus subclasses that have builds', () => {
    const { paths } = getBuildClassStaticPaths(FIXTURE);
    const slugs = paths.map((p) => p.params.class);
    expect(slugs).toEqual(expect.arrayContaining([
      'beginner', 'warrior', 'archer', 'mage', 'barbarian', 'wizard'
    ]));
    expect(slugs).not.toContain('siege-breaker');
  });
});

describe('getBuildClassStaticProps', () => {
  it('passes only the builds for that slug', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'barbarian');
    expect(props.builds.map((x) => x.shortId)).toEqual(['1', '2']);
  });

  it('includes every build in the family for a family slug', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'warrior');
    expect(props.builds).toHaveLength(2);
  });

  it('exposes the display name used in the title', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'barbarian');
    expect(props.displayName).toBe('Barbarian');
  });

  it('title-cases multi-word subclass names', () => {
    const withBB = [...FIXTURE, b('4', 'Warrior', 'Blood_Berserker')];
    const { props } = getBuildClassStaticProps(withBB, 'blood-berserker');
    expect(props.displayName).toBe('Blood Berserker');
  });

  it('returns an empty build list for a family with no builds', () => {
    const { props } = getBuildClassStaticProps(FIXTURE, 'archer');
    expect(props.builds).toEqual([]);
    expect(props.displayName).toBe('Archer');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- builds-class-page`
Expected: FAIL — cannot resolve `pages/tools/builds/[class].jsx`.

- [ ] **Step 3: Write the page**

Create `pages/tools/builds/[class].jsx`:

```jsx
import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import BuildCard from '@components/tools/builds/BuildCard';
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  BUILD_FAMILIES,
  buildsForSlug,
  classToSlug,
  getBuildClassSlugs,
  slugToDisplayName
} from '@utility/builds/class-paths.mjs';

// Exported for tests: the data logic, separated from Next's build pipeline.
export function getBuildClassStaticPaths(builds) {
  return {
    // fallback MUST be false — output: 'export' does not support true/'blocking'.
    paths: getBuildClassSlugs(builds).map((slug) => ({ params: { class: slug } })),
    fallback: false
  };
}

export function getBuildClassStaticProps(builds, slug) {
  return {
    props: {
      slug,
      displayName: slugToDisplayName(slug),
      builds: buildsForSlug(builds, slug)
    }
  };
}

export async function getStaticPaths() {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildClassStaticPaths(builds);
}

export async function getStaticProps({ params }) {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildClassStaticProps(builds, params.class);
}

const BuildClassPage = ({ slug, displayName, builds }) => {
  const title = `Idleon ${displayName} Builds | Idleon Toolbox`;
  const description = builds.length
    ? `Browse ${builds.length} community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`
    : `Community ${displayName} builds for Legends of Idleon — talent trees, gear and progression.`;

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={`https://idleontoolbox.com/tools/builds/${slug}`}
      />

      <Stack gap={2} sx={{ mt: 2 }}>
        <Typography variant="h2" component="h1" sx={{ fontSize: 28 }}>
          Idleon {displayName} Builds
        </Typography>

        <Typography variant="body1" color="text.secondary">
          {builds.length
            ? `${builds.length} community ${displayName} build${builds.length === 1 ? '' : 's'} for Legends of Idleon.`
            : `No ${displayName} builds have been published yet.`}
        </Typography>

        {/* Internal links so crawlers reach every class page from any other. */}
        <Stack direction="row" gap={1} flexWrap="wrap">
          {BUILD_FAMILIES.map((family) => (
            <Link key={family} href={`/tools/builds/${classToSlug(family)}`}>
              {family} builds
            </Link>
          ))}
          <Link href="/tools/builds">All builds</Link>
        </Stack>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {builds.map((build) => (
            <BuildCard key={build.shortId} build={build}/>
          ))}
        </Box>
      </Stack>
    </>
  );
};

export default BuildClassPage;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- builds-class-page`
Expected: PASS, 8 tests.

- [ ] **Step 5: Verify the real static output**

Run: `npm run build`

Then confirm the files exist and carry real titles:

```bash
ls out/tools/builds/warrior.html out/tools/builds/barbarian.html
grep -o '<title>[^<]*</title>' out/tools/builds/barbarian.html
grep -c 'siege-breaker' out/sitemap.xml || true
```

Expected: both files exist; the title is `<title>Idleon Barbarian Builds | Idleon Toolbox</title>`; roughly 18 files under `out/tools/builds/`.

If `<title>` is missing, `NextSeo` is not being emitted into the static HTML — check that the page is not wrapped in a client-only gate.

- [ ] **Step 6: Do NOT add these to `components/constants.jsx`**

CLAUDE.md says new pages get registered in `components/constants.jsx`. That does not apply here, and this step exists to stop you doing it.

`PAGES.TOOLS` is the **navigation menu** — each entry renders a nav item with an icon (`'builds': { icon: 'data/SmithingHammerChisel_x1' }`). These 18 class pages are SEO landing pages reached from search and from the in-page links added in Step 3, not nav destinations. Adding them would put 18 entries in the tools menu.

`/tools/builds` itself is already registered and stays as the single nav entry.

No change to `components/constants.jsx`.

- [ ] **Step 7: Commit**

```bash
git add "pages/tools/builds/[class].jsx" __test__/pages/builds-class-page.test.jsx
```

---

### Task 4: Static landing page for `/tools/builds`

Makes the single highest-traffic builds URL render real content instead of an empty shell. Existing client-side search, filtering, and pagination are unchanged — the props only seed the first render.

**Files:**
- Modify: `pages/tools/builds.jsx` (add `getStaticProps`; change the `items` and `loading` initial state at lines 162 and 164)
- Test: `__test__/pages/builds-landing.test.jsx`

**Interfaces:**
- Consumes: `fetchAllBuildsAtBuildTime` (Task 1).
- Produces: page prop `initialBuilds: Build[]`.

- [ ] **Step 1: Write the failing test**

Create `__test__/pages/builds-landing.test.jsx`:

```js
import { describe, it, expect } from 'vitest';
import { getBuildsLandingStaticProps } from '../../pages/tools/builds.jsx';

const b = (shortId) => ({
  shortId, title: shortId, class: 'Warrior', subclass: 'Barbarian',
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0
});

describe('getBuildsLandingStaticProps', () => {
  it('passes the fetched builds through as initialBuilds', () => {
    const { props } = getBuildsLandingStaticProps([b('1'), b('2')]);
    expect(props.initialBuilds.map((x) => x.shortId)).toEqual(['1', '2']);
  });

  it('returns an empty array rather than undefined when given none', () => {
    const { props } = getBuildsLandingStaticProps([]);
    expect(props.initialBuilds).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- builds-landing`
Expected: FAIL — `getBuildsLandingStaticProps` is not exported.

- [ ] **Step 3: Add the data plumbing to the page**

In `pages/tools/builds.jsx`, add these imports alongside the existing ones:

```jsx
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
```

Add near the top level of the module, above the component:

```jsx
// Exported for tests: separates the data shape from Next's build pipeline.
export function getBuildsLandingStaticProps(builds) {
  return { props: { initialBuilds: builds || [] } };
}

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return getBuildsLandingStaticProps(builds);
}
```

- [ ] **Step 4: Seed the component's initial state from props**

Change the component signature to accept the prop, then change two `useState` calls.

At line 162, replace:

```jsx
  const [items, setItems] = useState([]);
```

with:

```jsx
  const [items, setItems] = useState(initialBuilds || []);
```

At line 164, replace:

```jsx
  const [loading, setLoading] = useState(true);
```

with:

```jsx
  // Already have server-rendered builds — don't show a skeleton over real content.
  const [loading, setLoading] = useState(!initialBuilds?.length);
```

Update the component's props destructuring to include `initialBuilds`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- builds-landing`
Expected: PASS, 2 tests.

- [ ] **Step 6: Verify build titles appear in the static HTML**

Run: `npm run build`

```bash
grep -o '<title>[^<]*</title>' out/tools/builds.html
```

Expected: `<title>Builds | Idleon Toolbox</title>`.

Then confirm real build content is present — pick any title from the live list:

```bash
node -e "const h=require('fs').readFileSync('out/tools/builds.html','utf8'); const t=h.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); console.log('visible chars:', t.length); console.log(t.slice(0,300));"
```

Expected: several thousand visible characters including build titles — not 0, which is what the page produces today.

- [ ] **Step 7: Commit**

```bash
git add pages/tools/builds.jsx __test__/pages/builds-landing.test.jsx
```

---

### Task 5: Per-build metadata via embedded manifest

Gives `/tools/builds/view?id=<shortId>` a correct `<title>` on first render without changing its URL. The manifest ships in the page's static props, so no cross-origin fetch is needed before metadata resolves.

**Files:**
- Modify: `pages/tools/builds/view.jsx` (add `getStaticProps`; use the manifest for `NextSeo` at lines 104-106)
- Test: `__test__/pages/builds-view-manifest.test.jsx`

**Interfaces:**
- Consumes: `fetchAllBuildsAtBuildTime` (Task 1).
- Produces:
  - `toBuildSummary(build: Build): BuildSummary` where `BuildSummary` is
    `{ shortId, title, class, subclass, ownerName, tags, likeCount }`
  - `findInManifest(manifest: BuildSummary[], shortId: string): BuildSummary|null`
  - `buildSeoTitle(summary: BuildSummary|null): string`
  - `buildSeoDescription(summary: BuildSummary|null): string`

- [ ] **Step 1: Write the failing test**

Create `__test__/pages/builds-view-manifest.test.jsx`:

```js
import { describe, it, expect } from 'vitest';
import {
  toBuildSummary,
  findInManifest,
  buildSeoTitle,
  buildSeoDescription
} from '../../pages/tools/builds/view.jsx';

const full = {
  shortId: 'Zfy6pb', title: 'Mago de talar', class: 'Mage', subclass: 'Wizard',
  ownerName: 'Anon', tags: ['afk', 'choppin'], likeCount: 3, viewCount: 344,
  createdAt: '2026-07-04T05:32:36.235Z', talents: { huge: 'payload' }
};

describe('toBuildSummary', () => {
  it('keeps the fields needed for metadata', () => {
    expect(toBuildSummary(full)).toEqual({
      shortId: 'Zfy6pb', title: 'Mago de talar', class: 'Mage', subclass: 'Wizard',
      ownerName: 'Anon', tags: ['afk', 'choppin'], likeCount: 3
    });
  });

  it('drops heavy fields that would bloat the page payload', () => {
    expect(toBuildSummary(full).talents).toBeUndefined();
    expect(toBuildSummary(full).viewCount).toBeUndefined();
  });
});

describe('findInManifest', () => {
  const manifest = [toBuildSummary(full)];

  it('finds a build by shortId', () => {
    expect(findInManifest(manifest, 'Zfy6pb').title).toBe('Mago de talar');
  });

  it('returns null for a build published since the last deploy', () => {
    expect(findInManifest(manifest, 'unknown')).toBeNull();
  });

  it('returns null when the id is undefined during first render', () => {
    expect(findInManifest(manifest, undefined)).toBeNull();
  });
});

describe('buildSeoTitle', () => {
  it('includes subclass and class for a known build', () => {
    expect(buildSeoTitle(toBuildSummary(full)))
      .toBe('Mago de talar — Wizard Mage Build | Idleon Toolbox');
  });

  it('omits the subclass when there is none', () => {
    const noSub = toBuildSummary({ ...full, subclass: null });
    expect(buildSeoTitle(noSub)).toBe('Mago de talar — Mage Build | Idleon Toolbox');
  });

  it('falls back to a generic title for an unknown build', () => {
    expect(buildSeoTitle(null)).toBe('Build | Idleon Toolbox');
  });
});

describe('buildSeoDescription', () => {
  it('mentions author, class and tags', () => {
    const d = buildSeoDescription(toBuildSummary(full));
    expect(d).toContain('Anon');
    expect(d).toContain('Wizard Mage');
    expect(d).toContain('afk');
  });

  it('falls back to generic copy for an unknown build', () => {
    expect(buildSeoDescription(null)).toBe('Community build for Legends of Idleon');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- builds-view-manifest`
Expected: FAIL — those functions are not exported from `view.jsx`.

- [ ] **Step 3: Add the manifest helpers and data fetching**

In `pages/tools/builds/view.jsx`, add the import:

```jsx
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
```

Add above the component:

```jsx
// Only the fields metadata needs. The full talent payload still comes from the
// Worker at runtime — this manifest exists so <title> resolves on first render
// instead of waiting on a cross-origin fetch Googlebot may never complete.
export function toBuildSummary(build) {
  return {
    shortId: build.shortId,
    title: build.title,
    class: build.class,
    subclass: build.subclass,
    ownerName: build.ownerName,
    tags: build.tags,
    likeCount: build.likeCount
  };
}

export function findInManifest(manifest, shortId) {
  if (!shortId) return null;
  return (manifest || []).find((entry) => entry.shortId === shortId) || null;
}

const classLabel = (summary) =>
  [summary.subclass?.replace(/_/g, ' '), summary.class].filter(Boolean).join(' ');

export function buildSeoTitle(summary) {
  if (!summary) return 'Build | Idleon Toolbox';
  return `${summary.title} — ${classLabel(summary)} Build | Idleon Toolbox`;
}

export function buildSeoDescription(summary) {
  if (!summary) return 'Community build for Legends of Idleon';
  const tags = (summary.tags || []).join(', ');
  const tagPart = tags ? ` — ${tags}.` : '.';
  return `${summary.title} by ${summary.ownerName}. ${classLabel(summary)} build for Legends of Idleon${tagPart} ${summary.likeCount || 0} likes.`;
}

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return { props: { manifest: builds.map(toBuildSummary) } };
}
```

- [ ] **Step 4: Use the manifest for SEO in the component**

Accept `manifest` in the component props. After `const shortId = router.query?.id;` (line 33), add:

```jsx
  // Resolves synchronously on first render for any build present at build time.
  const summary = findInManifest(manifest, shortId);
```

Replace the `NextSeo` block at lines 104-106 with:

```jsx
      <NextSeo
        title={buildSeoTitle(summary) }
        description={buildSeoDescription(summary)}
      />
```

Leave the existing `getBuild(shortId)` fetch at line 48 untouched — it still supplies the full talent data, and it is the fallback for builds published since the last deploy.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- builds-view-manifest`
Expected: PASS, 10 tests.

- [ ] **Step 6: Verify manually in a dev server**

Run: `npm run dev`

Open `http://localhost:3001/tools/builds/view?id=Zfy6pb` and confirm the browser tab title reads the build's name rather than a generic one. Then open a `?id=` for a build that does not exist and confirm the page still renders its normal not-found handling rather than crashing.

- [ ] **Step 7: Commit**

```bash
git add pages/tools/builds/view.jsx __test__/pages/builds-view-manifest.test.jsx
```

---

### Task 6: Sitemap generation and patch notes

The generator globs `pages/**` and derives URLs from filenames, so `[class].jsx` would emit a literal `/tools/builds/[class]` URL. This task fixes that, adds the real class URLs, drops the non-indexable builds routes, and fixes the pre-existing staleness bug.

**Files:**
- Modify: `utility/generate-sitemap.mjs`
- Modify: `data/patch-notes.js`
- Test: `__test__/utility/sitemap-builds.test.js`

**Interfaces:**
- Consumes: `fetchAllBuildsAtBuildTime` (Task 1); `getBuildClassSlugs` (Task 2).
- Produces: `buildClassSitemapEntries(slugs: string[], today: string): string` and `EXCLUDED_BUILD_ROUTES: string[]`.

- [ ] **Step 1: Write the failing test**

Create `__test__/utility/sitemap-builds.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  buildClassSitemapEntries,
  EXCLUDED_BUILD_ROUTES
} from '@utility/generate-sitemap.mjs';

describe('buildClassSitemapEntries', () => {
  it('emits a url block per slug', () => {
    const xml = buildClassSitemapEntries(['warrior', 'barbarian'], '2026-08-08');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/warrior');
    expect(xml).toContain('https://idleontoolbox.com/tools/builds/barbarian');
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it('never emits the literal dynamic route segment', () => {
    const xml = buildClassSitemapEntries(['warrior'], '2026-08-08');
    expect(xml).not.toContain('[class]');
  });

  it('uses the supplied lastmod date', () => {
    expect(buildClassSitemapEntries(['warrior'], '2026-08-08')).toContain('<lastmod>2026-08-08</lastmod>');
  });

  it('returns an empty string for no slugs', () => {
    expect(buildClassSitemapEntries([], '2026-08-08')).toBe('');
  });
});

describe('EXCLUDED_BUILD_ROUTES', () => {
  it('excludes interactive and user-specific builds routes', () => {
    expect(EXCLUDED_BUILD_ROUTES).toEqual(expect.arrayContaining([
      '/tools/builds/new',
      '/tools/builds/edit',
      '/tools/builds/my-builds',
      '/tools/builds/view'
    ]));
  });

  it('does not exclude the builds landing page', () => {
    expect(EXCLUDED_BUILD_ROUTES).not.toContain('/tools/builds');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- sitemap-builds`
Expected: FAIL — those exports do not exist.

- [ ] **Step 3: Update the generator**

Edit `utility/generate-sitemap.mjs`. Add these imports at the top:

```js
import { fetchAllBuildsAtBuildTime } from './builds/static-fetch.mjs'
import { getBuildClassSlugs } from './builds/class-paths.mjs'
```

Add these exports above `generateSitemap`:

```js
// Interactive or user-specific pages with no search value. /view without a
// query param renders nothing at all.
export const EXCLUDED_BUILD_ROUTES = [
  '/tools/builds/new',
  '/tools/builds/edit',
  '/tools/builds/my-builds',
  '/tools/builds/view'
]

export function buildClassSitemapEntries(slugs, today) {
  return (slugs || []).map((slug) => `  <url>
    <loc>https://idleontoolbox.com/tools/builds/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')
}
```

Replace the body of `generateSitemap` with:

```js
async function generateSitemap() {
  const pages = await globby([
    'pages/**/*{.js,.jsx,.mdx}',
    '!pages/_*.js',
    '!pages/_*.jsx',
    '!pages/404.jsx',
    '!pages/api',
    // Dynamic route — real slugs are appended below. Without this exclusion the
    // glob emits a literal /tools/builds/[class] URL.
    '!pages/tools/builds/[class].jsx',
  ])

  const routeOf = (page) =>
    page.replace('pages', '').replace('.jsx', '').replace('.js', '').replace('.mdx', '')

  const keptPages = pages.filter((page) => !EXCLUDED_BUILD_ROUTES.includes(routeOf(page)))

  const builds = await fetchAllBuildsAtBuildTime()
  const today = new Date().toISOString().split('T')[0]
  const classEntries = buildClassSitemapEntries(getBuildClassSlugs(builds), today)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${keptPages.map(addPage).join('\n')}
${classEntries}
</urlset>`

  fs.writeFileSync('public/sitemap.xml', sitemap)
  // postbuild runs after next build has already produced out/, so writing only
  // to public/ leaves the deployed sitemap one build stale.
  if (fs.existsSync('out')) fs.writeFileSync('out/sitemap.xml', sitemap)
}
```

Change the bottom of the file. The current version calls `generateSitemap()` at module scope, which would fire a network request and write files the moment the test imports this module. Guard it so it only runs when executed directly, and surface failures:

```js
import path from 'path'
import { fileURLToPath } from 'url'

// Only run when invoked as a script (npm postbuild), not when imported by tests.
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isDirectRun) {
  console.log('starting sitemap generation')
  generateSitemap()
    .then(() => console.log('finished sitemap generation'))
    .catch((error) => {
      console.error('sitemap generation failed:', error.message)
      process.exit(1)
    })
}
```

Add `path` and `url` to the imports at the top of the file alongside the existing `fs` and `globby` imports.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- sitemap-builds`
Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the generated sitemap**

Run: `npm run build`

```bash
grep -c '<url>' out/sitemap.xml
grep -o '<loc>[^<]*builds[^<]*</loc>' out/sitemap.xml
```

Expected: the builds entries list `/tools/builds` plus the 18 class URLs; no `[class]`; no `/tools/builds/new`, `/edit`, `/my-builds`, or `/view`.

- [ ] **Step 6: Add a patch note**

Per CLAUDE.md, user-facing changes get an entry in `data/patch-notes.js`. Open it, and append to the newest unreleased version's `features` array (or create a new version entry if the top one has already shipped):

```js
'Added browsable build pages for every class and subclass, e.g. /tools/builds/barbarian'
```

Describe the user-visible effect, not the SEO mechanics.

- [ ] **Step 7: Run the whole suite**

Run: `npm test`
Expected: PASS — all pre-existing tests plus the 51 added by this plan (9 + 16 + 8 + 2 + 10 + 6).

Confirm the sitemap module's import guard works: the suite must not hit the network or write `public/sitemap.xml` while running. If `git status` shows a modified sitemap after `npm test`, the `isDirectRun` guard is wrong.

- [ ] **Step 8: Commit**

```bash
git add utility/generate-sitemap.mjs data/patch-notes.js __test__/utility/sitemap-builds.test.js
```

---

## Post-implementation verification

Run once after all six tasks:

- [ ] `npm test` — full suite passes
- [ ] `npm run build` — completes without error
- [ ] `ls out/tools/builds/` — roughly 18 class pages plus `new`, `edit`, `my-builds`, `view`
- [ ] `grep -o '<title>[^<]*</title>' out/tools/builds/barbarian.html` — real title, not missing
- [ ] `grep '\[class\]' out/sitemap.xml` — no matches
- [ ] Break the fetch deliberately (set `NEXT_PUBLIC_BUILDS_URL` to an unreachable host) and confirm `npm run build` **fails** rather than emitting a site with only 4 class pages. This is the single most important behaviour in the plan — a degraded build 404s indexed URLs.

## What this changes for existing behaviour

Tasks 1, 2 and 3 are purely additive — new files and a new route. Tasks 4, 5 and 6 modify existing files. No existing URL changes, and no existing route stops working. The genuine changes in behaviour are:

**1. The build now depends on the Worker.** Today `npm run build` is fully self-contained. After this it makes build-time requests, so a Worker outage blocks every deploy, including unrelated fixes. Deliberate — see the spec's "Why the build must fail rather than degrade" — but it is a real reduction in deploy independence. Mitigated by the memoised fetch: one request cycle per build, not twenty.

**2. `view.jsx` ships a larger payload.** The manifest adds roughly 40KB (110 summaries) to every build-page visit. If the build count grows past a few thousand this stops being negligible and the manifest should be trimmed to the fields metadata actually reads, or split per class. Worth revisiting above ~1,000 builds.

**3. `/tools/builds` may flash.** Static props seed the list, then the existing `useEffect` fetches and replaces it. If ordering differs between the build-time list and the first client fetch, users see content shift. Verify during Task 4 Step 6: load the page with a throttled network and watch whether the list visibly reorders. If it does, sort both by the same key before rendering.

**4. Four URLs leave the sitemap** — `/tools/builds/new`, `/edit`, `/my-builds`, `/view`. None appear in the top pages of 15 months of Search Console data, so the traffic impact is nil. Removing a URL from a sitemap does not deindex it; it only stops advertising it.

**5. Build time increases slightly.** One full pagination (~2 requests) plus 18 extra static pages. Expect a few seconds on a 4-minute build.

## Notes for the implementer

- **Do not** create `pages/tools/builds/view/[id].jsx`. Per-build URLs intentionally keep `?id=`. The spec explains why: `fallback: false` would 404 every build published between deploys.
- **Do not** add a cron or deploy webhook. The existing push-to-main workflow already rebuilds at a 1-day median cadence, which is below Google's crawl latency.
- The four families always get pages even at zero builds — they are the catch-all for subclasses with no page of their own (Siege Breaker has 2,090 monthly impressions and zero builds).
- Results are not immediately visible. Google must re-crawl and re-rank; the spec's success criteria are measured at 4–8 weeks.
