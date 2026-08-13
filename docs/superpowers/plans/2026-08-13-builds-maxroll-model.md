# Builds: maxroll routing model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every community build its own static URL, ship every build link in the hub's HTML, replace the class dropdown with a crawlable two-row link strip, and delete the client-side `?class=` redirect.

**Architecture:** Mirror maxroll's build-guide model within the limits of `output: 'export'`. One namespace, `/tools/builds/<slug>`, serving both the 22 class pages and the 111 build pages from a single dynamic route. Class navigation becomes real `<a href>` links instead of a MUI menu. The hub gets its full build list from static props and filters in memory, so the Cloudflare Worker is no longer on the first-paint path. `/tools/builds/view?id=` stays alive — under `fallback: false` it is the only route that can serve a build published since the last deploy.

**Tech Stack:** Next.js 16.2.11 pages router with `output: 'export'`, React 19.2.4, MUI v6, React Compiler, next-seo, Playwright, Vitest.

## Global Constraints

- `output: 'export'`: `getStaticPaths` MUST use `fallback: false`. There are no server redirects, no rewrites, no middleware. Anything not in `paths` is a hard 404.
- Static export writes one file per page into `out/tools/builds/`. Local exports run on a **case-insensitive filesystem** (Windows), so two slugs differing only in case silently overwrite each other. Build slugs MUST be lowercase.
- A build published after the last deploy has no static page. It MUST resolve through `/tools/builds/view?id=<shortId>`, never a 404.
- `next/head` drops `<title>`; titles ship from `_document.jsx`, which prefers `pageProps.seoTitle` over the `PAGE_SEO` map. Dynamic routes need a `PAGE_SEO` OVERRIDES entry.
- Never `--no-verify`. Pre-commit runs the full vitest suite.
- Every user-facing change gets a `data/patch-notes.js` entry (Task 8 carries it for this whole plan).
- **No commit steps in this plan.** The user decides when to commit and when to push.
- `data/website-data.json` is generated — never edit by hand.
- Assert head tags against **served bytes** (`e2e/static-head.spec.js`), never the hydrated DOM.

---

## File Structure

**Create**
- `utility/builds/build-pages.mjs` — build slug derivation, href resolution, SEO strings, path-collision guard. Dependency-free ESM: `utility/generate-sitemap.mjs` imports it under plain Node.
- `components/tools/builds/ClassStrip.jsx` — two-row horizontal link strip replacing the picker on browse pages.
- `components/tools/builds/BuildView.jsx` — the build detail body, shared by the static page and `view.jsx`.
- `pages/tools/builds/[slug].jsx` — replaces `[class].jsx`; serves class pages and build pages.
- `__test__/utility/builds/build-pages.test.js`
- `__test__/pages/builds-slug-page.test.jsx`
- `e2e/builds-static-pages.spec.js`

**Modify**
- `pages/tools/builds.jsx` — all builds from static props, in-memory filtering, no `?class=` redirect.
- `pages/tools/builds/view.jsx` — renders `BuildView`, canonicalises to the static URL.
- `components/tools/builds/BuildsBrowser.jsx` — `ClassStrip` instead of `ClassPicker`; `staticIds` passthrough.
- `components/tools/builds/BuildCard.jsx` — href resolves to the static page when one exists.
- `utility/generate-sitemap.mjs` — build entries become static URLs; prune covers them.
- `utility/generate-page-seo.mjs` — OVERRIDES key rename.
- `data/patch-notes.js`, `CLAUDE.md`.

**Delete**
- `pages/tools/builds/[class].jsx` (renamed), `__test__/pages/builds-class-page.test.jsx` (replaced by the slug-page test).

`components/tools/builds/ClassPicker.jsx` **stays** — `BuildForm.jsx` uses it to pick a class when authoring a build. Only the browse pages stop using it.

---

### Task 1: Build slug and href derivation

**Files:**
- Create: `utility/builds/build-pages.mjs`
- Test: `__test__/utility/builds/build-pages.test.js`

**Interfaces:**
- Consumes: `classToSlug` from `utility/builds/class-paths.mjs`.
- Produces: `titleSlug(title)`, `buildToSlug(build)`, `buildStaticHref(build)`, `buildHref(build, staticIds)`, `staticIdSet(builds)`, `assertNoSlugCollisions(classSlugs, buildSlugs)`, `toBuildSummary(build)`, `buildSeoTitle(summary)`, `buildSeoDescription(summary)`.

- [ ] **Step 1: Write the failing test**

```js
// __test__/utility/builds/build-pages.test.js
import { describe, it, expect } from 'vitest';
import {
  assertNoSlugCollisions,
  buildHref,
  buildToSlug,
  staticIdSet,
  titleSlug
} from '../../../utility/builds/build-pages.mjs';

const b = (shortId, title) => ({ shortId, title });

describe('titleSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(titleSlug('Active/Afk Wizard (150+)')).toBe('active-afk-wizard-150');
  });

  it('collapses runs and trims leading/trailing separators', () => {
    expect(titleSlug('  ~~Wizard // AFK ~~ ')).toBe('wizard-afk');
  });

  it('caps length without leaving a trailing hyphen', () => {
    const slug = titleSlug('a'.repeat(40) + ' ' + 'b'.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('returns an empty string for a title with nothing sluggable', () => {
    expect(titleSlug('!!! ???')).toBe('');
    expect(titleSlug(undefined)).toBe('');
  });
});

describe('buildToSlug', () => {
  // The export writes one file per slug on a case-insensitive filesystem, so an uppercase
  // shortId in the path would let 'frZFgN-x' and 'FRzfGn-x' overwrite each other locally
  // while staying distinct on GitHub Pages.
  it('lowercases the shortId', () => {
    expect(buildToSlug(b('OacmGM', 'Active ES'))).toBe('oacmgm-active-es');
  });

  it('falls back to -build when the title slugifies to nothing', () => {
    expect(buildToSlug(b('Zfy6pb', '???'))).toBe('zfy6pb-build');
  });

  // Without the suffix a shortId that happens to spell a class ('wizard') would produce
  // '/tools/builds/wizard' and overwrite a class page.
  it('always keeps a suffix so a slug can never equal a bare class slug', () => {
    expect(buildToSlug(b('wizard', ''))).toBe('wizard-build');
  });
});

describe('buildHref', () => {
  const ids = staticIdSet([b('OacmGM', 'Active ES')]);

  it('points at the static page for a build that has one', () => {
    expect(buildHref(b('OacmGM', 'Active ES'), ids)).toBe('/tools/builds/oacmgm-active-es');
  });

  // fallback: false means a build published since the last deploy has no exported file.
  // Linking it to a static path would 404; view?id= still resolves it at runtime.
  it('falls back to view?id= for a build published since the last deploy', () => {
    expect(buildHref(b('NEWnew', 'Fresh'), ids)).toBe('/tools/builds/view?id=NEWnew');
  });

  it('falls back when no id set is available at all', () => {
    expect(buildHref(b('OacmGM', 'Active ES'), undefined))
      .toBe('/tools/builds/view?id=OacmGM');
  });

  it('matches ids case-insensitively, since the slug lowercased them', () => {
    expect(buildHref(b('oacmgm', 'Active ES'), ids)).toBe('/tools/builds/oacmgm-active-es');
  });
});

describe('assertNoSlugCollisions', () => {
  it('accepts disjoint, unique sets', () => {
    expect(() => assertNoSlugCollisions(['wizard'], ['abc123-x', 'def456-y'])).not.toThrow();
  });

  // Two paths writing one file is a page silently replaced by another. Fail the build.
  it('throws when a build slug duplicates another build slug', () => {
    expect(() => assertNoSlugCollisions(['wizard'], ['abc123-x', 'abc123-x']))
      .toThrow(/abc123-x/);
  });

  it('throws when a build slug collides with a class slug', () => {
    expect(() => assertNoSlugCollisions(['wizard'], ['wizard'])).toThrow(/wizard/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run __test__/utility/builds/build-pages.test.js`
Expected: FAIL — cannot resolve `utility/builds/build-pages.mjs`.

- [ ] **Step 3: Write the module**

```js
// utility/builds/build-pages.mjs
//
// Slugs, hrefs and metadata for /tools/builds/<slug>.
//
// Dependency-free ESM on purpose — utility/generate-sitemap.mjs imports this and is a plain
// Node script that cannot resolve Next aliases or TypeScript.

const MAX_TITLE_SLUG = 60;

export const titleSlug = (title) =>
  String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TITLE_SLUG)
    .replace(/-+$/, '');

// The shortId is lowercased because output: 'export' writes one file per slug and local
// exports run on a case-insensitive filesystem. The title suffix is never omitted: a shortId
// that happened to spell a class name would otherwise produce that class's URL.
export const buildToSlug = (build) => {
  const id = String(build?.shortId || '').toLowerCase();
  const rest = titleSlug(build?.title);
  return rest ? `${id}-${rest}` : `${id}-build`;
};

export const buildStaticHref = (build) => `/tools/builds/${buildToSlug(build)}`;

export const staticIdSet = (builds) =>
  new Set((builds || []).map((b) => String(b?.shortId || '').toLowerCase()));

// A build published after the last deploy has no exported page — fallback: false makes that a
// hard 404 — so it keeps the runtime route instead.
export const buildHref = (build, staticIds) =>
  staticIds?.has(String(build?.shortId || '').toLowerCase())
    ? buildStaticHref(build)
    : `/tools/builds/view?id=${build?.shortId}`;

// Two entries claiming one path means one page silently replaces the other in out/. Fail the
// build rather than deploy whichever won.
export function assertNoSlugCollisions(classSlugs, buildSlugs) {
  const seen = new Set(classSlugs);
  const clashes = [];
  for (const slug of buildSlugs) {
    if (seen.has(slug)) clashes.push(slug);
    seen.add(slug);
  }
  if (clashes.length) {
    throw new Error(
      `Build slugs collide with an existing page path: ${[...new Set(clashes)].join(', ')}`
    );
  }
}

// -- Metadata (moved verbatim from pages/tools/builds/view.jsx) ---------------

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

// The subclass alone, not "Barbarian Warrior" — the family adds no search value and produces
// nonsense like "Journeyman Beginner". Falls back to the family for builds with no subclass.
const classLabel = (summary) => (summary.subclass || summary.class || '').replace(/_/g, ' ');

// Class first, user title second. Build titles are free text and frequently useless as
// keywords ("Laealwaysforgets 2"); leading with them pushed the term the page actually targets
// past Google's ~60-char cutoff on 52 of 111 builds.
export function buildSeoTitle(summary) {
  if (!summary) return 'Build | Idleon Toolbox';
  return `${classLabel(summary)} Build — ${summary.title} | Idleon Toolbox`;
}

export function buildSeoDescription(summary) {
  if (!summary) return 'Community build for Legends of Idleon';
  const tags = (summary.tags || []).join(', ');
  const tagPart = tags ? ` — ${tags}.` : '.';
  return `${summary.title} by ${summary.ownerName}. ${classLabel(summary)} build for Legends of Idleon${tagPart} ${summary.likeCount || 0} likes.`;
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run __test__/utility/builds/build-pages.test.js`
Expected: PASS.

- [ ] **Step 5: Verify against the live data**

Run:
```bash
node -e "import('./utility/builds/build-pages.mjs').then(async (m) => {
  process.loadEnvFile('.env.local');
  const { fetchAllBuildsAtBuildTime } = await import('./utility/builds/static-fetch.mjs');
  const builds = await fetchAllBuildsAtBuildTime();
  const slugs = builds.map(m.buildToSlug);
  console.log('builds', builds.length, 'unique slugs', new Set(slugs).size);
  console.log('longest', Math.max(...slugs.map((s) => s.length)));
})"
```
Expected: `builds 111 unique slugs 111`. Any mismatch means Task 3's `assertNoSlugCollisions` would fail the build — investigate before continuing.

---

### Task 2: Extract the build detail body

**Files:**
- Create: `components/tools/builds/BuildView.jsx`
- Modify: `pages/tools/builds/view.jsx`
- Modify: `__test__/pages/builds-view-manifest.test.jsx`

**Interfaces:**
- Consumes: `toBuildSummary`, `findInManifest`, `buildSeoTitle`, `buildSeoDescription`, `buildStaticHref`, `staticIdSet` from Task 1.
- Produces: `<BuildView shortId summary />` — the whole detail UI, no routing of its own. Task 3 renders it for the static route.

The current `view.jsx` mixes three things: reading `?id=`, fetching the build, and rendering it. Only the last is reusable.

- [ ] **Step 1: Create the component**

Move everything from `view.jsx` between the `getStaticProps` export and the default export into `components/tools/builds/BuildView.jsx`, changing only the inputs:

```jsx
// components/tools/builds/BuildView.jsx
//
// The detail UI, with no opinion on where shortId came from. /tools/builds/<slug> reads it from
// a static path, /tools/builds/view reads it from ?id= — the second is how a build published
// since the last deploy resolves, since fallback: false gives it no page of its own.

const BuildView = ({ shortId, summary }) => {
  // ...body of the current ViewBuild, minus `const shortId = router.query?.id`
  // and minus `const summary = findInManifest(manifest, shortId)`.
};

export default BuildView;
```

Keep `<NextSeo>` inside `BuildView`? **No** — the two callers need different canonicals. Leave `NextSeo` in each page and pass nothing SEO-related here.

- [ ] **Step 2: Rewrite view.jsx around it**

```jsx
// pages/tools/builds/view.jsx
import { fetchAllBuildsAtBuildTime } from '@utility/builds/static-fetch.mjs';
import {
  buildSeoDescription,
  buildSeoTitle,
  buildStaticHref,
  findInManifest,
  toBuildSummary
} from '@utility/builds/build-pages.mjs';
import BuildView from '@components/tools/builds/BuildView';

export async function getStaticProps() {
  const builds = await fetchAllBuildsAtBuildTime();
  return { props: { manifest: builds.map(toBuildSummary) } };
}

const ViewBuild = ({ manifest }) => {
  const router = useRouter();
  const shortId = router.query?.id;
  const summary = findInManifest(manifest, shortId);

  return (
    <>
      <NextSeo
        title={buildSeoTitle(summary)}
        description={buildSeoDescription(summary)}
        // Every build in the manifest also has a static page. Two URLs serving one build is a
        // split of its own ranking signals, so this one defers to the static path.
        canonical={summary ? `https://idleontoolbox.com${buildStaticHref(summary)}` : undefined}
      />
      <BuildView shortId={shortId} summary={summary}/>
    </>
  );
};
```

- [ ] **Step 3: Repoint the existing manifest test**

`__test__/pages/builds-view-manifest.test.jsx` imports `toBuildSummary`, `findInManifest` and `buildSeoTitle` from `pages/tools/builds/view.jsx`. Change the import to `utility/builds/build-pages.mjs`. Do not change the assertions — they are testing the same functions.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run __test__/pages/builds-view-manifest.test.jsx`
Expected: PASS, same count as before the move.

---

### Task 3: One dynamic route for classes and builds

**Files:**
- Create: `pages/tools/builds/[slug].jsx` (content largely moved from `[class].jsx`)
- Delete: `pages/tools/builds/[class].jsx`, `__test__/pages/builds-class-page.test.jsx`
- Create: `__test__/pages/builds-slug-page.test.jsx`
- Modify: `utility/generate-page-seo.mjs`

**Interfaces:**
- Consumes: Task 1's slug helpers; Task 2's `BuildView`; the existing `siblingSlugs`, `buildsForSlug`, `filterAndSortBuilds`.
- Produces: `getBuildSlugStaticPaths(builds)`, `getBuildSlugStaticProps(builds, slug)`. Props carry `kind: 'class' | 'build'`.

Next's pages router refuses two dynamic siblings with different param names (`You cannot use different slug names for the same dynamic path`), so `[class].jsx` and a hypothetical `[build].jsx` cannot coexist. One route, branching on the slug — which is also maxroll's shape: `/d4/build-guides/barbarian` and `/d4/build-guides/whirlwind-barbarian-guide` are the same route.

- [ ] **Step 1: Write the failing test**

```jsx
// __test__/pages/builds-slug-page.test.jsx
import '../../polyfills';
import { describe, it, expect } from 'vitest';
import {
  getBuildSlugStaticPaths,
  getBuildSlugStaticProps
} from '../../pages/tools/builds/[slug].jsx';

const b = (shortId, title, cls, subclass) => ({
  shortId, title, class: cls, subclass,
  ownerName: 'Anon', tags: [], likeCount: 0, viewCount: 0
});

const FIXTURE = [
  b('aaa111', 'Rage Build', 'Warrior', 'Barbarian'),
  b('bbb222', 'Second Barb', 'Warrior', 'Barbarian'),
  b('ccc333', 'Wiz Build', 'Mage', 'Wizard')
];

describe('getBuildSlugStaticPaths', () => {
  it('uses fallback: false, required by output: export', () => {
    expect(getBuildSlugStaticPaths(FIXTURE).fallback).toBe(false);
  });

  it('emits a path for every class and every build', () => {
    const slugs = getBuildSlugStaticPaths(FIXTURE).paths.map((p) => p.params.slug);
    expect(slugs).toContain('barbarian');
    expect(slugs).toContain('aaa111-rage-build');
  });

  // fallback: false makes any unlisted path a hard 404, and the class strip links every class.
  it('generates a page for classes with no builds yet', () => {
    const slugs = getBuildSlugStaticPaths(FIXTURE).paths.map((p) => p.params.slug);
    for (const empty of ['siege-breaker', 'arcane-cultist', 'death-bringer', 'wind-walker']) {
      expect(slugs, `${empty} would 404 from the class strip`).toContain(empty);
    }
  });

  it('throws rather than exporting two pages to one file', () => {
    const clashing = [...FIXTURE, b('wizard', '', 'Mage', 'Wizard'), b('wizard', '', 'Mage', 'Wizard')];
    expect(() => getBuildSlugStaticPaths(clashing)).toThrow(/wizard-build/);
  });
});

describe('getBuildSlugStaticProps', () => {
  it('serves a class page for a class slug', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'barbarian');
    expect(props.kind).toBe('class');
    expect(props.builds.map((x) => x.shortId)).toEqual(['aaa111', 'bbb222']);
    expect(props.seoTitle).toBe('Idleon Barbarian Builds | Idleon Toolbox');
  });

  it('serves a build page for a build slug', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build');
    expect(props.kind).toBe('build');
    expect(props.summary.shortId).toBe('ccc333');
    expect(props.seoTitle).toBe('Wizard Build — Wiz Build | Idleon Toolbox');
  });

  it('ships only the summary, not the talent payload, in build props', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build');
    expect(Object.keys(props.summary).sort())
      .toEqual(['class', 'likeCount', 'ownerName', 'shortId', 'subclass', 'tags', 'title']);
  });

  it('counts the builds actually on the page in a class description', () => {
    expect(getBuildSlugStaticProps(FIXTURE, 'barbarian').props.seoDescription)
      .toContain('2 community Barbarian builds');
  });

  it('drops the count for a class with no builds rather than saying zero', () => {
    const { props } = getBuildSlugStaticProps(FIXTURE, 'archer');
    expect(props.builds).toEqual([]);
    expect(props.seoDescription).not.toContain('0 community');
  });

  // Reachable so the strip can't 404, out of the index until it has something to rank on.
  it('noindexes an empty class, and only that case', () => {
    expect(getBuildSlugStaticProps(FIXTURE, 'siege-breaker').props.seoNoindex).toBe(true);
    expect(getBuildSlugStaticProps(FIXTURE, 'barbarian').props.seoNoindex).toBe(false);
    expect(getBuildSlugStaticProps(FIXTURE, 'ccc333-wiz-build').props.seoNoindex).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run __test__/pages/builds-slug-page.test.jsx`
Expected: FAIL — no `pages/tools/builds/[slug].jsx`.

- [ ] **Step 3: Create the route**

`git mv pages/tools/builds/[class].jsx "pages/tools/builds/[slug].jsx"`, then:

```jsx
// Keep the existing header comment about every class getting a page, then:

export const ALL_CLASS_SLUGS = CLASS_KEYS.map(classToSlug);

export function getBuildSlugStaticPaths(builds) {
  const buildSlugs = (builds || []).map(buildToSlug);
  assertNoSlugCollisions(ALL_CLASS_SLUGS, buildSlugs);
  return {
    // fallback MUST be false — output: 'export' does not support true/'blocking'.
    paths: [...ALL_CLASS_SLUGS, ...buildSlugs].map((slug) => ({ params: { slug } })),
    fallback: false
  };
}

export function getBuildSlugStaticProps(builds, slug) {
  const build = (builds || []).find((b) => buildToSlug(b) === slug);
  if (build) {
    const summary = toBuildSummary(build);
    return {
      props: {
        kind: 'build',
        slug,
        summary,
        seoTitle: buildSeoTitle(summary),
        seoDescription: buildSeoDescription(summary),
        seoNoindex: false
      }
    };
  }

  // ...the existing class-page body, with `kind: 'class'` added to props.
}

export async function getStaticPaths() {
  return getBuildSlugStaticPaths(await fetchAllBuildsAtBuildTime());
}

export async function getStaticProps({ params }) {
  return getBuildSlugStaticProps(await fetchAllBuildsAtBuildTime(), params.slug);
}

const BuildSlugPage = (props) => (
  props.kind === 'build' ? <BuildPage {...props}/> : <BuildClassPage {...props}/>
);

export default BuildSlugPage;
```

`BuildClassPage` is the existing component unchanged apart from its name and the `slug` it reads. `BuildPage`:

```jsx
const BuildPage = ({ slug, summary }) => (
  <>
    <NextSeo
      title={buildSeoTitle(summary)}
      description={buildSeoDescription(summary)}
      canonical={`https://idleontoolbox.com/tools/builds/${slug}`}
    />
    <BuildView shortId={summary.shortId} summary={summary}/>
  </>
);
```

- [ ] **Step 4: Update the SEO override key**

In `utility/generate-page-seo.mjs`, rename the `'/tools/builds/[class]'` OVERRIDES key to `'/tools/builds/[slug]'` and update its comment — the route now covers 22 class pages *and* 111 build pages, and both supply their own title through static props.

Then run: `node utility/generate-page-seo.mjs`

- [ ] **Step 5: Run the tests**

Run: `npx vitest run __test__/pages/builds-slug-page.test.jsx __test__/page-seo.test.js`
Expected: PASS. Delete `__test__/pages/builds-class-page.test.jsx` — every assertion in it is carried above.

- [ ] **Step 6: Export and verify the files exist**

Run: `npm run build`
Then: `ls out/tools/builds/*.html | wc -l`
Expected: 22 class pages + 111 build pages + `new/edit/my-builds/view` = **137**.

Then confirm a build page carries its own title in the served bytes, with no JS involved:
```bash
grep -o '<title>[^<]*</title>' out/tools/builds/oacmgm-*.html
```
Expected: a class-first title, not `Builds | Idleon Toolbox`.

---

### Task 4: Cards link to static pages

**Files:**
- Modify: `components/tools/builds/BuildCard.jsx`, `components/tools/builds/BuildsBrowser.jsx`
- Test: `e2e/builds-parity.spec.js` (existing card-target tests)

**Interfaces:**
- Consumes: `buildHref`, `staticIdSet` from Task 1.
- Produces: `BuildsBrowser` accepts a `staticIds` prop (a `Set` of lowercased shortIds) and passes it to each `BuildCard`.

- [ ] **Step 1: Thread the set through**

In `BuildCard.jsx`, replace the hardcoded href:

```jsx
// was: const buildHref = `/tools/builds/view?id=${build.shortId}`;
const href = buildHref(build, staticIds);
```

taking `staticIds` as a prop alongside `build`, and use `href` for both the card's `onClick` target and the title anchor. In `BuildsBrowser.jsx`:

```jsx
{builds.map((b) => <BuildCard key={b.shortId} build={b} staticIds={staticIds}/>)}
```

- [ ] **Step 2: Update the e2e card tests**

`e2e/builds-parity.spec.js` locates cards by `a[href^="/tools/builds/view"]`. Those hrefs are now static slugs. Replace the locator with a helper that matches either shape, and keep `classPageLinks` excluding it:

```js
// A build link is either the static page or the runtime fallback for one published since the
// last deploy. Both are legitimate; a card must have one of them.
const buildLinks = (page) => page.locator(
  'a[href^="/tools/builds/view?id="], a[href^="/tools/builds/"][href*="-"]'
);
```

Then extend `classPageLinks` to exclude slugs containing a `-` **only where they are build slugs** — class slugs like `blood-berserker` also contain hyphens, so match against the known class list instead:

```js
// Class slugs are a closed set; anything else under /tools/builds/ is a build page.
const CLASS_SLUGS = [/* the 22, imported from utility/builds/class-paths.mjs via the page */];
const classPageLinks = (page) => page.locator(
  CLASS_SLUGS.map((s) => `a[href="/tools/builds/${s}"]`).join(', ')
);
```

- [ ] **Step 3: Run**

Run: `npm run test:e2e -- builds-parity`
Expected: PASS, including `clicking the card body opens the build` — now landing on a static slug.

---

### Task 5: The hub ships every build

**Files:**
- Modify: `pages/tools/builds.jsx`
- Modify: `__test__/pages/builds-landing.test.jsx`

**Interfaces:**
- Consumes: `filterAndSortBuilds` (already used by the class page), `staticIdSet`.
- Produces: `getBuildsLandingStaticProps(builds)` → `{ initialBuilds: <all builds>, staticIds: <array> }`. `matchesSeedSlice` and `LANDING_SEED_LIMIT` are removed.

maxroll's hub ships 108 of 108 guide links in the HTML. Ours ships 24 of 111 and fetches the rest from a cross-origin Worker that Googlebot may never wait for. With every build in static props, filtering runs in memory exactly as it already does on class pages, and the Worker leaves the first-paint path entirely.

Keep one background fetch: builds published since the last deploy would otherwise be invisible on the hub until the next deploy. Merge them in by `shortId`; they get `view?id=` hrefs from Task 4 automatically.

- [ ] **Step 1: Rewrite the static props**

```jsx
// Every build, not a slice. 111 summaries is ~20KB of __NEXT_DATA__ against 4.5KB for 24 — the
// cost of the hub being a complete, crawlable index instead of a teaser.
export function getBuildsLandingStaticProps(builds) {
  const all = [...(builds || [])].sort(
    (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
  return { props: { initialBuilds: all, staticIds: [...staticIdSet(all)] } };
}
```

- [ ] **Step 2: Filter in memory**

Replace the debounce/cursor/`runFetch` machinery with:

```jsx
const [items, setItems] = useState(initialBuilds || []);
const visible = filterAndSortBuilds(items, filters);
```

and a single mount-time refresh:

```jsx
// Builds published since the last deploy have no static page and aren't in initialBuilds.
// One request, no debounce: filtering never touches the network now.
useEffect(() => {
  let cancelled = false;
  listBuilds({ sort: 'new', limit: 24 })
    .then((res) => {
      if (cancelled) return;
      const known = new Set(items.map((b) => b.shortId));
      const fresh = (res?.items || []).filter((b) => !known.has(b.shortId));
      if (fresh.length) setItems((prev) => [...fresh, ...prev]);
    })
    // The static list is complete as of the last deploy — a failed refresh costs at most the
    // newest few builds, which is not worth an error banner over a working page.
    .catch(() => {});
  return () => { cancelled = true; };
}, []);
```

Delete: `matchesSeedSlice`, `LANDING_SEED_LIMIT`, `runFetch`, `fetchIdRef`, `debounceTimer`, `prevTagsKey`, `prevSort`, `nextCursor`, `hasMore`/`onLoadMore` wiring, the `error` state and its `<Alert>`, and the `loading` skeleton (there is nothing to wait for). Keep the URL-mirroring effect for `sort`/`q`/`tags` — those stay shareable.

- [ ] **Step 3: Update the landing test**

`__test__/pages/builds-landing.test.jsx` asserts a 24-item cap and exercises `matchesSeedSlice`. Both concepts are gone. Replace with:

```jsx
it('returns every build, newest first', () => {
  const builds = [
    b('mid', '2026-08-05T00:00:00.000Z'),
    b('oldest', '2026-08-01T00:00:00.000Z'),
    b('newest', '2026-08-08T00:00:00.000Z')
  ];
  const { props } = getBuildsLandingStaticProps(builds);
  expect(props.initialBuilds.map((x) => x.shortId)).toEqual(['newest', 'mid', 'oldest']);
});

it('does not cap the list — the hub is the crawlable index of every build', () => {
  const builds = Array.from({ length: 60 }, (_, i) =>
    b(`build-${i}`, new Date(2026, 0, i + 1).toISOString()));
  expect(getBuildsLandingStaticProps(builds).props.initialBuilds).toHaveLength(60);
});

it('exposes the shortIds that have a static page, lowercased', () => {
  const { props } = getBuildsLandingStaticProps([b('OacmGM', '2026-08-01T00:00:00.000Z')]);
  expect(props.staticIds).toEqual(['oacmgm']);
});

it('returns an empty array rather than undefined when given none', () => {
  expect(getBuildsLandingStaticProps([]).props.initialBuilds).toEqual([]);
});
```

- [ ] **Step 4: Run and verify the served bytes**

Run: `npx vitest run __test__/pages/builds-landing.test.jsx && npm run build`
Then:
```bash
grep -o 'href="/tools/builds/[a-z0-9][^"]*"' out/tools/builds.html | sort -u | wc -l
```
Expected: ≥ 111 (every build) + the class links from Task 6. Before this task the same command returns roughly 20.

---

### Task 6: Class strip replaces the picker on browse pages

**Files:**
- Create: `components/tools/builds/ClassStrip.jsx`
- Modify: `components/tools/builds/BuildsBrowser.jsx`
- Test: `e2e/builds-parity.spec.js`

**Interfaces:**
- Consumes: `CLASS_KEYS`, `FAMILY_ORDER`, `FAMILY_THEME`, `familyOf` from `utility/builds/classes`; `classToSlug`, `slugToClassKey` from `class-paths.mjs`; `classes` from `@website-data` for icons.
- Produces: `<ClassStrip activeSlug={slug|null} />` — renders `<a href>` only, no callbacks. Navigation is the href.

The picker is a MUI `Menu`: its items are not in the DOM until it opens, so no crawler ever sees a class link there, and it takes two clicks to change class. maxroll uses a horizontally scrolling strip of anchor pills with `All` first. Our 22 classes don't fit one strip — maxroll never shows more than 12 — so it splits by family: five pills always, the active family's subclasses on a second row.

- [ ] **Step 1: Write the component**

```jsx
// components/tools/builds/ClassStrip.jsx
//
// maxroll's build-guide filter strip, adapted to a deeper class tree. Row one is the four
// families plus All; row two appears only once a family is active and holds that family's
// subclasses. Every pill is a real <a href> — that is what makes the class pages crawlable
// (the old MUI picker kept its items out of the DOM until opened) and what makes them
// middle-clickable. Both rows scroll horizontally rather than wrapping, so the control stays
// one line tall regardless of family size.

const SUBCLASSES = Object.fromEntries(
  FAMILY_ORDER.map((fam) => [fam, CLASS_KEYS.filter((k) => familyOf(k) === fam && k !== fam)])
);

const Pill = ({ href, label, iconIndex, active, color }) => (
  <Box
    component={Link}
    href={href}
    sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.75, flexShrink: 0,
      height: 34, px: 1.5, borderRadius: 999, textDecoration: 'none', fontSize: 13,
      fontWeight: 600, whiteSpace: 'nowrap',
      color: active ? color : 'rgba(255,255,255,0.75)',
      background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? `${color}88` : 'rgba(255,255,255,0.08)'}`,
      '&:hover': { background: active ? `${color}33` : 'rgba(255,255,255,0.07)' }
    }}
  >
    {iconIndex >= 0 && (
      <img src={`${prefix}data/ClassIcons${iconIndex}.png`} alt="" width={18} height={18}
        style={{ objectFit: 'contain' }}/>
    )}
    {label}
  </Box>
);

const Row = ({ children }) => (
  <Stack direction="row" gap={1}
    sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { height: 4 } }}>
    {children}
  </Stack>
);

const ClassStrip = ({ activeSlug }) => {
  const activeKey = activeSlug ? slugToClassKey(activeSlug) : null;
  const activeFamily = activeKey ? familyOf(activeKey) : null;
  const subclasses = activeFamily ? SUBCLASSES[activeFamily] : [];

  return (
    <Stack gap={1} sx={{ mb: 2 }}>
      <Row>
        <Pill href="/tools/builds" label="All" iconIndex={-1} active={!activeKey}
          color={ACCENT.primary}/>
        {FAMILY_ORDER.map((fam) => (
          <Pill key={fam} href={`/tools/builds/${classToSlug(fam)}`} label={fam}
            iconIndex={classes.indexOf(fam)} active={activeKey === fam}
            color={FAMILY_THEME[fam].primary}/>
        ))}
      </Row>
      {subclasses.length > 0 && (
        <Row>
          {subclasses.map((key) => (
            <Pill key={key} href={`/tools/builds/${classToSlug(key)}`} label={cleanUnderscore(key)}
              iconIndex={classes.indexOf(key)} active={activeKey === key}
              color={FAMILY_THEME[activeFamily].primary}/>
          ))}
        </Row>
      )}
    </Stack>
  );
};
```

- [ ] **Step 2: Swap it into BuildsBrowser**

Replace the `<ClassPicker .../>` block with `<ClassStrip activeSlug={activeClass}/>`, placed above the search field. Drop the now-unused `onClassChange` prop from `BuildsBrowser` and from both pages — navigation is the href. Keep the `Tags` pill and sort toggle where they are.

Leave `ClassPicker.jsx` alone; `BuildForm.jsx` still uses it to author a build.

- [ ] **Step 3: Update the e2e tests**

The two picker tests in `e2e/builds-parity.spec.js` (`the class picker navigates rather than filtering in place`, `the picker shows the current class on a class page`) describe a control that no longer exists. Replace with:

```js
test('the class strip links every family from the hub', async ({ page }) => {
  await page.goto('/tools/builds?demo=true');
  await waitForRender(page);
  for (const fam of ['Beginner', 'Warrior', 'Archer', 'Mage']) {
    await expect(page.getByRole('link', { name: fam, exact: true }))
      .toHaveAttribute('href', `/tools/builds/${fam.toLowerCase()}`);
  }
  await expect(page.getByRole('link', { name: 'All', exact: true }))
    .toHaveAttribute('href', '/tools/builds');
});

test('a family page exposes its subclasses as links', async ({ page }) => {
  await page.goto('/tools/builds/warrior?demo=true');
  await waitForRender(page);
  await expect(page.getByRole('link', { name: 'Blood Berserker', exact: true }))
    .toHaveAttribute('href', '/tools/builds/blood-berserker');
  // A Mage subclass must not be in the strip on a Warrior page.
  await expect(page.getByRole('link', { name: 'Wizard', exact: true })).toHaveCount(0);
});

// The whole point of replacing the menu: a crawler with no JS execution sees these.
test('class links are in the served HTML, not just the hydrated DOM', async ({ request }) => {
  const html = await (await request.get('/tools/builds')).text();
  for (const slug of ['beginner', 'warrior', 'archer', 'mage']) {
    expect(html).toContain(`href="/tools/builds/${slug}"`);
  }
});
```

Also update the `CONTROLS` parity list: `{ name: 'class strip', locator: (p) => p.getByRole('link', { name: 'All', exact: true }) }` replaces the `Class` button entry.

- [ ] **Step 4: Run**

Run: `npm run test:e2e -- builds-parity`
Expected: PASS.

---

### Task 7: Delete the legacy `?class=` redirect

**Files:**
- Modify: `pages/tools/builds.jsx`
- Modify: `e2e/builds-parity.spec.js`

`/tools/builds?class=X` currently `router.replace`s to `/tools/builds/x`. That is the only code in the app that can turn a hub URL into a class URL, and every time it runs it writes the class URL into browser history — which is what makes the omnibox complete `/tools/builds` to `/tools/builds/wind-walker` afterwards. The param predates a single deploy and has no consumer left.

- [ ] **Step 1: Remove the effect**

Delete the whole legacy-redirect `useEffect` and the `CLASS_SLUGS` set and its imports. The param now falls through to the unfiltered hub.

- [ ] **Step 2: Canonicalise**

```jsx
<NextSeo
  title="Builds | Idleon Toolbox"
  description="Browse and share optimized talent builds for every class and subclass in Legends of Idleon"
  // ?class=, ?sort=, ?q= and ?tags= are all views of this one page. Without a fixed canonical
  // each combination is a separate URL competing with it.
  canonical="https://idleontoolbox.com/tools/builds"
/>
```

- [ ] **Step 3: Replace the redirect tests**

The four `?class=` tests in `e2e/builds-parity.spec.js` (one valid, three invalid) assert redirect behaviour. Replace all four with one that pins the new contract:

```js
// The redirect that used to live here trained browsers to autocomplete /tools/builds into a
// class URL, and turned an unvalidated param into a router path ('../../etc' navigated to /etc).
for (const value of ['Blood_Berserker', 'garbage', '../../etc']) {
  test(`?class=${value} stays on the hub`, async ({ page }) => {
    await page.goto(`/tools/builds?class=${encodeURIComponent(value)}&demo=true`);
    await waitForRender(page);
    expect(new URL(page.url()).pathname).toBe('/tools/builds');
  });
}
```

- [ ] **Step 4: Run**

Run: `npm run test:e2e -- builds-parity && npx vitest run`
Expected: PASS.

---

### Task 8: Sitemap, docs, patch notes

**Files:**
- Modify: `utility/generate-sitemap.mjs`, `__test__/utility/sitemap-builds.test.js`
- Modify: `data/patch-notes.js`, `CLAUDE.md`

- [ ] **Step 1: Point build entries at the static URLs**

```js
// Each build now has its own exported page. The ?id= route still resolves builds published
// since the last deploy, but it is one URL serving many builds and canonicalises to the static
// path, so it has no place in the sitemap.
export function buildDetailSitemapEntries(builds, today) {
  return (builds || [])
    .filter((build) => SAFE_SHORT_ID.test(build?.shortId || ''))
    .map((build) => `  <url>
    <loc>https://idleontoolbox.com${buildStaticHref(build)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')
}
```

- [ ] **Step 2: Prune build slugs too**

`pruneUnexportedSlugs` already reads every `.html` in `out/tools/builds`, so it works unchanged — pass the build slugs through it as well:

```js
const classSlugs = pruneUnexportedSlugs(getBuildClassSlugs(builds), 'out')
const exportedBuilds = builds.filter(
  (b) => pruneUnexportedSlugs([buildToSlug(b)], 'out').length === 1
)
```

If that reads clumsily, refactor `pruneUnexportedSlugs` to take and return slugs once and filter both lists against the same `Set` — one directory read, not 111.

- [ ] **Step 3: Update the sitemap test**

`__test__/utility/sitemap-builds.test.js` asserts `?id=` URLs. Change to static paths, and add:

```js
it('never lists a build page that was not exported', () => {
  // A sitemap entry for a 404 is a crawler explicitly invited to a dead URL.
});
```

- [ ] **Step 4: Patch notes**

The top entry (`3.3.59`) has already shipped class pages. Add to its `features` / `fixes`, or open `3.3.60` if `3.3.59` is released — check before appending.

```js
'features': [
  'Builds: every community build now has its own shareable page, e.g. /tools/builds/oacmgm-active-es',
  'Builds: pick a class from the row of icons at the top of the page instead of a dropdown'
],
'fixes': [
  'Builds: the browse page no longer waits on a network request to show builds, and filtering is instant'
]
```

- [ ] **Step 5: Update CLAUDE.md**

Under the SEO section, record the two export gotchas this plan turned up, since both are invisible until they bite:
- one dynamic route serves classes and builds because Next refuses two dynamic siblings with different param names
- build slugs are lowercased because a local export writes files on a case-insensitive filesystem

- [ ] **Step 6: Full verification**

Run: `npx vitest run && npm run build && npm run test:e2e:nobuild`
Then confirm the shape of the export:
```bash
ls out/tools/builds/*.html | wc -l            # expect 137
grep -c '<loc>' out/sitemap.xml               # expect ~133 more than before
grep -o '<title>[^<]*</title>' out/tools/builds/wizard.html
```
Expected: all green, and `Idleon Wizard Builds | Idleon Toolbox` in the served bytes.

---

## What execution changed (2026-08-13)

Task 5's verification failed as written: after the rebuild, `out/tools/builds.html` contained
**zero** anchors. `WaitForRouter` in `_app.jsx` renders `<></>` at build time, so no page's body
reaches the export — sitewide, not just here. Removing the gate was investigated on 2026-08-09 and
rejected (two more gates below it, two systemic hydration-mismatch classes); the alternative that
shipped for head tags is to render above it.

Added Task 9, the same trick for links: `components/common/CrawlLinks.jsx` renders a plain
`<nav>` of `<a>` above the gate from `pageProps.crawlLinks`, then unmounts once hydrated — same
markup on server and first client render, so no mismatch, and no duplicate UI afterwards. The hub
supplies 22 class links + every build; a class page its builds plus its siblings; a build page its
class links plus the hub. Result: hub 0 → **143** anchors, `wizard` 17, `siege-breaker` 6.

Two defects surfaced while verifying in a browser, both fixed:
- `PageTitle` renders an `<h1>` from `PAGE_SEO[pathname]`, which is keyed by route *pattern* — so
  all 143 pages under `[slug]` displayed "Idleon Builds by Class". The route now opts out and
  `BuildDetail`'s title became the page's `<h1>`.
- A failed talent fetch replaced the whole page with an error banner, discarding the summary that
  static props already carry. The summary now stays and the error sits beneath it.

## Rollout note

Deploying this changes 111 URLs. `/tools/builds/view?id=X` keeps working and canonicalises to the new path, so nothing breaks for anyone holding an old link, and the sitemap tells Google about the replacements on the first crawl. Expect a few weeks of the two URLs coexisting in Search Console before the `?id=` ones drop out.
