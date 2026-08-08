# Restore search indexability for /tools/builds

**Date:** 2026-08-08
**Status:** Approved design, not yet implemented

## Problem

On 2026-04-22, commit `feb2c4dedd` ("Community builds: new browse/publish/like feature end-to-end") replaced a bundled `data/builds.json` (69,625 lines) with a cross-origin Cloudflare Worker API. Search traffic to builds pages collapsed the next day and has not recovered.

### Evidence

Google Search Console, 7-day trailing:

```
2026-04-22   clicks 670   impressions 9,918    <- rewrite ships
2026-04-23   daily impressions 9,078 -> 7,330  (-19% in one day)
2026-04-30   impressions 7,204
2026-05-15   impressions 5,934                 (-40%, then flat)
```

Average position held at 7.4–8.0 throughout, so this is an indexing loss, not a ranking penalty — pages stopped being shown at all.

Page-level, July 2025 vs July 2026:

```
page                          clicks         impressions
/tools/builds              2,796 -> 100    41,818 -> 2,224   -95%
/tools/builds?c=warrior&b=0  169 -> 0       3,197 -> 0       deindexed
/tools/builds?c=mage&b=2      87 -> 0         718 -> 0       deindexed
/data                         43 -> 0      18,131 -> 0       deindexed
```

Build-intent queries lost rankings, not just impressions:

```
query                     clk25  clk26 | pos25  pos26
idleon builds               707    146 |  1.09   2.94
idleon warrior build         65      2 |  1.97   8.49
idleon mage build            61      3 |  2.60   7.88
idleon wizard build          32      4 |  2.37   7.43
idleon barbarian build       38      8 |  2.42   7.42

TOTAL build-intent: clicks -82.6%, impressions -60.8%
```

Builds pages account for roughly 3,233 of the 4,856 total lost clicks — **67% of the site's entire search decline**.

### Root cause

Two compounding failures:

1. **Data moved behind a cross-origin fetch.** `services/builds.js` calls `https://builds.idleontoolbox.workers.dev/api`. Googlebot must render the page, issue a cross-origin request, wait, and re-render. It frequently does not complete this.
2. **`output: 'export'` ships empty HTML.** A build of current HEAD produces `out/index.html` at 6,012 bytes with **no `<title>` tag and zero visible body text**. Every page depends entirely on client-side rendering.

### Demand shape

Search demand is per-class, not per-build. Nobody searches for an individual community build's title; they search `idleon <class> build`. Across 15 months: **120 class-shaped queries, 72,292 impressions, 9,674 clicks**, converting at 20–33% CTR when ranked well.

```
idleon warrior build    3,941 impr   33.75% CTR
idleon mage build       3,214        25.26%
idleon barbarian build  2,643        28.49%
idleon squire build     1,298        29.58%
```

The deleted `?c=warrior&b=0` URLs targeted exactly this. Individual build pages cannot.

### Current inventory

110 community builds. By family: Mage 35, Warrior 35, Archer 27, Beginner 13. By subclass:

```
Barbarian 14   Wizard 13   Shaman 13   Bowman 13   Squire 11   Hunter 10
Maestro 7      Divine_Knight 5   Journeyman 4   Elemental_Sorcerer 4
Beast_Master 3   Bubonic_Conjuror 2   Blood_Berserker 2   Voidwalker 1
(no subclass set) 8

zero builds: Siege_Breaker, Arcane_Cultist, Death_Bringer, Wind_Walker
```

Created: Apr 93, May 4, Jun 11, Jul 2 — the April figure is the migration seed, so real growth is ~5/month and slowing.

Note the API's `class` field holds the **family** (Beginner/Warrior/Archer/Mage) and `subclass` holds the specific class. The full taxonomy is the 22 entries in `CLASSES` (`parsers/talents.ts`), not the 4 families in `FAMILY_ORDER`.

## Scope

| # | Item | Targets |
|---|------|---------|
| 1 | `/tools/builds` renders real static HTML | 84% of builds impression loss |
| 2 | `/tools/builds/[class]` — 18 static family + subclass pages | the position 2→8 collapse |
| 3 | Per-build metadata via embedded manifest, URLs unchanged | long tail |
| 4 | Build-time fetch helper — browser UA, fail-soft | enables 1–3 |

Explicitly **not** in scope: restoring `builds.json`, recovering the old `?c=&b=` URLs, scheduled rebuilds, publish webhooks, the sitewide empty-HTML problem.

## Design

### 4. Build-time fetch helper

New module `utility/builds/static-fetch.js`. Everything else depends on it, so it is described first.

```js
// Fetches all builds at build time.
// Throws on failure — see "Why the build must fail rather than degrade".
// Returns Array<BuildSummary>.
export async function fetchAllBuildsAtBuildTime() {}
```

Two non-obvious requirements:

**Browser User-Agent is mandatory.** The Worker sits behind Cloudflare's browser-integrity check. A default `fetch` receives `HTTP 403, error code 1010`. Verified:

```
bare request       -> HTTP 403 (error code: 1010)
with browser UA    -> HTTP 200
```

**Must fail loudly.** Throw a descriptive error on fetch failure, timeout, or an empty result. Do not swallow errors and return a partial list — the reasoning is in "Why the build must fail rather than degrade" below. The error message should name the endpoint and status so a red CI run is self-explanatory.

Pagination: `listBuilds` returns `{ items, nextCursor }`. Follow `nextCursor` with `limit=100` until exhausted. Cap iterations (~60 pages) as a runaway guard.

### 1. `/tools/builds` static landing page

Add `getStaticProps` to `pages/tools/builds.jsx`. It calls the helper and passes the build list as props, so the first render has real content with no network round-trip.

The page already sets `NextSeo` at line 283 with a correct title and description — that stays. What changes is that build cards render server-side into the static HTML, giving Google real content and internal links to the class pages.

Existing client-side behaviour is unchanged. The props supply only the *initial* render; search, tag filtering, sorting, and pagination continue to call the Worker at runtime exactly as they do today. The static content is what a crawler sees on first paint, not a replacement for the interactive list.

### 2. `/tools/builds/[class]` per-class pages

New file `pages/tools/builds/[class].jsx`, using a **flat namespace covering both families and subclasses**.

```
/tools/builds/warrior           family    always generated
/tools/builds/archer            family    always
/tools/builds/mage              family    always
/tools/builds/beginner          family    always
/tools/builds/barbarian         subclass  14 builds
/tools/builds/wizard            subclass  13 builds
/tools/builds/journeyman        subclass   4 builds
/tools/builds/voidwalker        subclass   1 build
/tools/builds/siege-breaker     NOT generated — 0 builds
```

All 22 names in `CLASSES` (`parsers/talents.ts`) are unique, so no nesting is required. A flat segment also matches query intent more directly — `idleon barbarian build` maps to `/tools/builds/barbarian`.

Slugs are the `CLASSES` key lowercased with underscores replaced by hyphens: `Blood_Berserker` → `blood-berserker`.

#### Why subclasses, not just the four families

Search demand sits overwhelmingly at the subclass level:

```
family-level terms :  44 queries   4,443 clicks   24,128 impressions
subclass-only terms: 109 queries   6,789 clicks   68,753 impressions
```

Subclass demand is **2.85x** family demand. Four family pages alone would address only 26% of class-related impressions. The largest individual subclass queries:

```
idleon journeyman (+variants)      6,633 impr
idleon elemental sorcerer (+var)   4,098
idleon maestro (+variants)         3,275
idleon shaman (+variants)          2,815
idleon barbarian build             2,643
idleon bubonic conjuror (+var)     2,488
idleon divine knight (+variants)   2,303
idleon siege breaker build         2,090   <- zero builds available
idleon wizard build                2,128
```

#### Path generation

`getStaticPaths` computes the list at build time from fetched data, with **`fallback: false`** — the only mode static export supports (`fallback: true` and `'blocking'` are on Next's unsupported-features list for `output: 'export'`).

- The four families from `FAMILY_ORDER` — always, regardless of build count. They act as the catch-all for subclasses with no page, so a Siege Breaker searcher lands on `/tools/builds/archer` rather than a dead end.
- Every subclass with **at least one build** (threshold 1).

Current inventory yields **4 family + 14 subclass = 18 pages**:

```
Barbarian 14   Wizard 13   Shaman 13   Bowman 13   Squire 11
Hunter 10      Maestro 7   Divine_Knight 5   Journeyman 4
Elemental_Sorcerer 4   Beast_Master 3   Bubonic_Conjuror 2
Blood_Berserker 2   Voidwalker 1
```

Threshold 1 rather than a higher bar: the gap between thresholds is only a few pages, and each page carries a genuine build with talent allocations, author, and tags. Thin-content risk applies to mass-generated doorway pages, not to eighteen real ones. Threshold 1 captures 100% of measurable subclass demand.

This is self-correcting — the check runs against live data each build, so subclasses gain pages as the community publishes, with no code change.

Threshold **0** is explicitly rejected: it would generate genuinely empty pages for Siege Breaker, Arcane Cultist, Death Bringer, and Wind Walker.

`getStaticProps` filters the fetched builds by family or subclass as appropriate and passes them as props.

Metadata per page:

```
title:       "Idleon {Class} Builds | Idleon Toolbox"
description: "Browse {n} community {Class} builds for Legends of Idleon —
              talent trees, gear and progression."
canonical:   https://idleontoolbox.com/tools/builds/{slug}
```

Route precedence note: `/tools/builds/[class]` sits alongside the static routes `new`, `edit`, `my-builds`, and `view`. Next resolves static routes before dynamic ones, and no class slug collides with those names, so this is safe. It would only become fragile if a future class were named after one of them.

### 3. Per-build metadata, URLs unchanged

`/tools/builds/view?id=<shortId>` **stays exactly as it is.** No URL migration, no redirect shim, no broken shared links.

The reason: in `output: 'export'`, query params are not part of the file path, so per-id static HTML would require a path param (`view/[id].jsx`), which forces `fallback: false`, which means **any build published since the last deploy returns 404 on direct navigation, refresh, or shared link**. With ~5 builds/month and a median 1-day deploy gap (p90 5, max 13), a new build could be unshareable for up to two weeks — hitting exactly the users worth encouraging. Static export also does not support `redirects`, so old links could not be mapped at config level.

Instead, add `getStaticProps` to `pages/tools/builds/view.jsx` that embeds a **summary manifest** of all builds into the page's static props:

```js
// per build: shortId, title, class, subclass, ownerName, tags, likeCount
```

At ~110 builds this is roughly 40KB, well within a page payload. On load, `view.jsx` looks up `router.query.id` in the manifest and renders title and metadata immediately — no network wait — then fetches full talent detail from the Worker as it does today (`view.jsx:48`).

This restores the pre-April rendering model, where Google successfully indexed query-param URLs because content rendered without a cross-origin dependency.

`NextSeo` at `view.jsx:104` is already correct; it simply fires too late today. With the manifest it resolves on first render:

```
title:       "{build.title} — {subclass} {class} Build | Idleon Toolbox"
description: "{title} by {ownerName}. {subclass} {class} build for
              Legends of Idleon — {tags}. {likeCount} likes."
```

Builds not in the manifest (published since last deploy) fall back to today's fetch-then-render path. Slower and not indexable until the next deploy, but fully functional — no 404.

### Sitemap

`public/sitemap.xml` is **generated**, not hand-maintained — `utility/generate-sitemap.mjs` runs as `postbuild` and globs `pages/**/*.{js,jsx,mdx}`, deriving each URL from its filename.

That glob breaks on dynamic routes: `pages/tools/builds/[class].jsx` would emit a literal `https://idleontoolbox.com/tools/builds/[class]` entry. The generator must therefore:

1. Exclude `[class].jsx` from the glob.
2. Fetch builds itself and append the 18 real class URLs.
3. Exclude `/tools/builds/new`, `/edit`, `/my-builds`, and `/view` — interactive or user-specific pages with no search value (`/view` without a query param renders nothing).

Because the generator is a plain Node script, any module it imports must be dependency-free ESM — it cannot reach `parsers/talents.ts` through `utility/builds/classes.js`. This is why the routing helpers live in standalone `.mjs` modules.

**Pre-existing bug to fix while here:** `postbuild` runs *after* `next build` has already produced `out/`, so the freshly written `public/sitemap.xml` is not copied into the deployed output — `out/sitemap.xml` is always one build stale. The generator should write to both `public/sitemap.xml` and `out/sitemap.xml`.

Also remove `/tools/builds/new`, `/tools/builds/edit`, and `/tools/builds/my-builds` — these are interactive, user-specific pages with no search value, and `/tools/builds/view` without a query param renders nothing.

## Freshness

No cron job and no publish webhook.

The existing workflow (`.github/workflows/deploy.yml`) rebuilds and deploys on every push to `main`. Measured cadence over the last 99 days: 115 commits, deploys on 46% of days, **median gap 1 day** (p90 5, max 13). New builds arrive at ~5/month.

A build published today is indexed at the next deploy, typically within a day — below Google's own crawl latency for new URLs. The repo is public, so Actions minutes are free and unlimited; builds run 4.0–4.4 minutes and the 18 class pages add seconds.

A second effect of the deploy cadence: because the subclass path list is computed per build, a subclass crossing from 0 to 1 build gains its page automatically at the next deploy, with no code change.

Two arguments against a webhook: GitHub Pages carries a documented soft limit of ~10 builds/hour, and per-publish rebuilds would make deploy frequency depend on user behaviour.

If the 13-day worst case proves annoying, a weekly `schedule:` trigger is a 3-line addition costing 4 free minutes a week. Not included by default.

## Error handling

| Failure | Behaviour |
|---------|-----------|
| Worker unreachable at build time | **Fail the build.** See below. |
| Worker returns malformed data | Validate shape per item; skip bad entries and continue. A few bad records must not fail the build. |
| Worker returns an empty list | Fail the build — indistinguishable from an outage, and the consequence is the same. |
| Build not in manifest | `view.jsx` falls back to client fetch. Functional, not indexed until next deploy. |
| Unknown class slug | `fallback: false` yields the existing 404 page. Correct. |

### Why the build must fail rather than degrade

An earlier draft of this spec had the helper return `[]` on failure so the deploy could proceed. **That is wrong**, because the 14 subclass paths are derived from live API data rather than a static list.

Compare the two outcomes when the Worker is down during a build:

- **Fail the build.** The workflow goes red, no deploy happens, and GitHub Pages keeps serving the previous successful deploy. All 18 pages stay live and indexed. Cost: you cannot ship until the Worker recovers or you retry.
- **Degrade to `[]`.** The build succeeds and deploys with only the 4 family pages. **14 URLs Google has indexed start returning 404** until the next successful build.

The second is strictly worse. A failed deploy is invisible to users; silently deleting indexed pages is not. Retrying is cheap — builds are 4 minutes and free.

The tradeoff is that an unrelated bugfix cannot ship during a Worker outage. That is acceptable given outages should be rare and short, and it is the conservative direction: the site keeps working exactly as it did before.

`getStaticPaths` should therefore throw a descriptive error on fetch failure rather than returning a partial path list.

## Testing

- **Helper:** unit tests for cursor pagination, UA header presence, and that a failed fetch throws rather than returning a partial list.
- **Path generation:** given a fixture build set, `getStaticPaths` returns the 4 families plus exactly the subclasses with ≥1 build, and omits zero-build subclasses (Siege Breaker, Arcane Cultist).
- **Static output:** after `npm run build`, assert `out/tools/builds/warrior.html` and `out/tools/builds/barbarian.html` exist and contain `<title>Idleon Warrior Builds` / `<title>Idleon Barbarian Builds`, and that `out/tools/builds.html` contains build titles as text. This directly regression-tests the empty-HTML failure that caused this incident.
- **View page:** manifest lookup renders metadata without a network call; unknown id still falls back to fetch.
- **Manual:** verify a shared `view?id=` link still resolves.

## Success criteria

Measured in Search Console 4–8 weeks post-deploy (Google needs to re-crawl):

- `/tools/builds` impressions recovering toward the 41,818/month baseline
- `idleon warrior build` and `idleon mage build` moving back from position ~8 toward ~2–3
- Subclass queries (`idleon barbarian build`, `idleon squire build`, `idleon journeyman build`) holding or improving on their current positions, with their traffic attributed to the new subclass pages rather than the homepage
- All 18 class pages appearing in the Pages report with non-zero impressions

## Known limitations

- The old `?c=warrior&b=0` URLs are not recovered. Their content (`builds.json`) was deleted and is out of scope.
- **Subclass page churn.** At threshold 1, a page can exist on the strength of a single build. If that build is deleted, the subclass drops to zero and its page disappears at the next deploy, 404ing a URL Google may have indexed. Currently this affects one page (Voidwalker, 1 build). Given ~5 builds published per month and no observed deletion activity, this is low-frequency and Google tolerates occasional 404s. If it becomes a problem, the page can keep rendering at zero builds and show the parent family's builds with a canonical pointing at the family page — deferred until it actually happens.
- **Siege Breaker and Arcane Cultist have demand but no supply.** 2,090 and 1,117 monthly impressions respectively, and zero builds. No SEO change reaches this; it needs someone to author builds for those subclasses. Noted because it is the single clearest gap between demand and inventory.
- Per-build pages remain dependent on Googlebot executing JS. Accepted deliberately: they are the low-value item, and the path-param alternative carries a worse cost in broken links.
- Recovery depends on Google re-crawling and re-ranking. Weeks, not days.
- 110 builds with ~5/month growth and only 2 in July means item 3's long-term value depends on the community feature gaining traction. Items 1 and 2 pay off regardless.

## Out of scope, worth separate consideration

The empty static export affects **every page**, not just builds — no `<title>`, zero body text sitewide. This spec fixes it for builds routes only. The general fix (the unresolved `WaitForRouter` gate) is a larger change and should be its own piece of work.
