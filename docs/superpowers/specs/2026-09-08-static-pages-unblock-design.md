# Stop blocking static pages on hydration

**Date:** 2026-09-08 (revised same day after code-level review)
**Status:** Approved design
**Repo:** `IdleonToolbox` (Next 16.2.11 pages router, `output: 'export'`, React 19.2, MUI 6.4, React Compiler on, `reactStrictMode: false`)

## Problem

Every exported page ships an empty body. `<WaitForRouter>` in `pages/_app.jsx` renders `<></>`
at build time and until the first client effect, so `out/*.html` holds head tags, a spinner
(`PreHydrationLoader`) and a hidden `<nav>` of links (`CrawlLinks`). A visitor sees the spinner
until the JS has downloaded, parsed and run: ~0.7 s on desktop, ~10 s on a throttled phone. A
crawler sees no body text.

This is not a user-data gate. `DataLoadingWrapper` (`hooks/usePageDataLoading.js`) already
scopes the account-data wait to `/account/**`, `/characters`, `/dashboard`, `/settings` and
non-offline `/tools/*`. Wiki, builds, patch notes, leaderboards, guilds, statistics and the home
page never wait on account data. They wait on hydration only.

`WaitForRouter` exists as a workaround for hydration mismatches that would otherwise throw
React #418 on every page (measured 2026-08-09 and 2026-08-16 with the gate replaced by a
pass-through). Verified against current code:

1. `AppProvider.init()` returns `{}` when `window` is undefined, so `state.isLoading` is
   `undefined` at build and `true` on the client. `NavBar` renders `<LoginButton/>` at build and
   `<AuthSkeleton/>` on first client render. Every page, every visitor.
2. 33 `useMediaQuery(..., { noSsr: true })` call sites across 26 files. `noSsr` disables MUI's
   server snapshot, so build output is `false` and the first client render is the real match.
3. Three further guaranteed mismatches the earlier experiments never reached because (1) fired
   first: `pages/index.jsx:60` picks a random hero image in a `useState` initialiser;
   `pages/leaderboards.jsx:51-54` reads localStorage in a `useState` initialiser behind a
   `typeof window` guard; `components/tools/builds/BuildDetail.jsx:116-123` formats dates in the
   build machine's timezone.

Separately, a static wiki page loads ~3.8 MB of JS before it can hydrate:

| chunk | bytes | referenced by | cause |
|---|---|---|---|
| firebase (auth + database + firestore) | 696,629 | 4832 of 4834 pages | `_app.jsx:10` → `AppProvider.jsx:2` static import; `firebase/index.js:24-26` calls `getAuth/getDatabase/getFirestore` at module top |
| game data (`items.json` + `shared-data.json` + `cards.json`) | 1,655,113 | 4818 of 4834 pages | **not** from `_app`. Wiki pages reach it through `EntityPanel` → `CardBonus.jsx:4` and `EntityPanel` → … → `components/common/styles.jsx:6`, both importing `parsers/cards.ts`, whose line 1 imports `@website-data`. The barrel `data/website-data/index.js:33-37` has two side-effecting statements (`itemsArray = Object.values(items)…`, `export const {…} = shared`) that pin 2.4 MB regardless of which key is used |

The two wiki consumers need only two pure functions (`calculateAmountToNextLevel`,
`calcCardBonus`), neither of which touches the data.

## Goal

Static pages paint their real UI from the exported HTML before any JS runs, and load only the
JS they need. Data pages keep today's behaviour: shell paints immediately, content waits for
account data through `DataLoadingWrapper` exactly as now.

## Non-goals

- No server runtime. `output: 'export'`, GitHub Pages deploy, `getStaticProps` only.
- No placeholder shell. The 2026-09-05 h1/description LCP shell was removed on 2026-09-08 and is
  not coming back; this renders the real components at build time instead.
- No parser, account-page, routing or localStorage schema changes beyond one new key.
- No change to what `DataLoadingWrapper` gates.
- No z-processing change. The barrel's side effects stay; consumers stop reaching it.
- Builds pages keep their `hydrate.js` game-data import; that is their content, not waste.

## Design

Three phases, each shippable on its own. Phase 3 depends on phase 2.

### Phase 1: lazy-load JS static pages never use

**1a. Firebase behind `import()`, no behaviour change.** A tiny `firebase/lazy.js` memoises one
dynamic import of `firebase/index.js`:

```js
let pending = null;
export const loadFirebase = () => {
  if (!pending) pending = import('./index');
  return pending;
};
export const firebaseRequested = () => pending !== null;
```

`AppProvider.jsx` drops its static firebase import and awaits `loadFirebase()` at each of its
six call sites (`checkUserStatus` in `handleProfile` and `handleUnauthenticatedUser`,
`subscribe` in `handleUnauthenticatedUser` and the auth poll, `signInWithCustom` and
`signInWithToken` in the auth poll, `userSignOut` in `logout`). `EmailLogin.jsx` does the same
for `signInWithEmailPassword`. `Tournament/Leaderboard.jsx` is page-scoped and stays.

`logout()` must not throw before `dispatch(LOGOUT)` and `loadEmptyAccount()`: it calls
`userSignOut` only when `firebaseRequested()` and wraps the call in try/catch. Otherwise a failed
chunk load inside `handleUnauthenticatedUser`'s catch leaves `isLoading: false` with no
`state.account`, and every data page shows "Loading account data..." forever.

Effect: firebase leaves the shared chunk. Every visitor still downloads it after hydration
(because `checkUserStatus` still runs for everyone), so this alone changes chunk layout, not
bytes over the wire. It is the safe half.

**1b. `authHint`: skip firebase for known-anonymous visitors.** One localStorage key,
`authHint`, read and written through `utility/auth-hint.js` (try/catch around storage access):

| value | meaning | `handleUnauthenticatedUser` | `handleProfile`'s `checkUserStatus` |
|---|---|---|---|
| absent | never decided (first visit, or first visit after this ships) | load firebase, `checkUserStatus()` | runs |
| `'no'` | firebase said no user last time | skip firebase, `loadEmptyAccount()` | skipped, `signedIn: false` |
| `'yes'` | had a session | load firebase, `checkUserStatus()`, subscribe | runs |

Write sites, exactly these: `'yes'` after both `subscribe` calls succeed; `'no'` when
`checkUserStatus()` resolves `null`, and in `logout()`. Skip only on `'no'`, never on absent, so
an existing signed-in user whose first post-deploy visit is a `?profile=` link is not shown
"Login" (their hint is absent, and `subscribe` never runs on that path to write `'yes'`).

Effect: an anonymous returning visitor never downloads firebase. A signed-in user is unchanged.

**1c. Card math out of `parsers/cards.ts`.** `calculateAmountToNextLevel` and `calcCardBonus`
move to `parsers/cardMath.ts` (no imports). `parsers/cards.ts` re-exports them so its 30+
account-side importers are untouched. `components/wiki/CardBonus.jsx` and
`components/common/styles.jsx` import from `cardMath`. That removes the only edge from the
wiki page graph into `@website-data`.

Effect: wiki pages stop downloading 1.65 MB of JSON.

**Output gate for phase 1:** `e2e/chunk-audit.spec.js` fetches every `<script src>` a page
references and asserts none contains the firebase marker (`@firebase/`) on `/` and none contains
the items marker (`"displayName":"Copper_Ore"`) on a wiki entity page.

### Phase 2: deterministic first render

**2a. `AppProvider` state.** `useReducer` starts from a constant on both sides:

```js
const DEFAULT_STATE = {
  showRankOneOnly: false, showUnmaxedBoxesOnly: false, isLoading: true, pinnedPages: [],
  storageHydrated: false
};
```

A mount effect, declared before the init effect, dispatches `HYDRATE_STORAGE` with the values
`readStoredState()` reads from `STORAGE_KEYS`; the reducer sets `storageHydrated: true`. The init
effect gains `state.storageHydrated` in its deps and returns early until it is true, so the
closure it runs with holds the merged state. The `LOGOUT` whitelist keeps `storageHydrated`, or
the persist effect would go back to skipping writes after a logout. The persist effect's
`isInitializedRef` run-count skip becomes `if (!state.storageHydrated) return;`.

`CharactersDrawer.jsx:39` seeds its chip state from `state.filters` in a `useState`
initialiser. Today the drawer mounts after storage is read; after 2a it mounts on the first
render. The existing sync-source pattern in that file (already used for `displayedCharacters`)
is extended to `filters`.

**2b. `noSsr` removal.** All 33 sites, by rule:

- Delete: `NavBar/index.jsx:33` (`isXs` is never read).
- CSS breakpoint on the element where the value feeds only `sx`/`style`: `AppDrawer/index.jsx:59`
  (`'IT'` vs `'Idleon Toolbox'` becomes two spans toggled by `display`), `pages/index.jsx:61-62`
  (hero `textAlign`/`gap`/`width`/`mt` become responsive `sx` values with a `@media` key for the
  non-theme 1245 px and 1921 px widths).
- Plain `useMediaQuery(query)` everywhere else. MUI 6 with React 19 uses
  `useSyncExternalStore` with `getServerSnapshot = () => defaultMatches` (`false`), so build and
  first client render agree and the real value lands in a post-hydration re-render. No mismatch.
  The cost is one frame of the `false` layout on a viewport where the query is true; every
  remaining site is either inside a closed dialog/drawer, below `DataLoadingWrapper`, or a
  minor prop.

A vitest test greps `components/`, `pages/`, `hooks/` for `noSsr` and fails on any hit.

**2c. The three known mismatches.**

- `pages/index.jsx`: hero image order starts as `[0, 1, 2, 3, 4, 5]` on both sides; a mount
  effect shuffles positions 1..5 only. Slot 0 is what hydration compares, and it stays `bg_0`.
- `pages/leaderboards.jsx`: `showAnonymous` starts `true`; a mount effect reads the stored
  value. Data arrives after mount anyway.
- `components/tools/builds/BuildDetail.jsx`: dates render only once `useHydrated()` is true
  (`hooks/useHydrated.js`, a `useSyncExternalStore` that returns `false` on the server and
  `true` on the client). The export carries the build without its timestamps; the hydrated
  page adds them.

**Output gate for phase 2:** `e2e/hydration.spec.js` loads a sample of routes (`/`,
`/wiki/monster/<slug>`, `/tools/builds/wizard`, `/leaderboards`, `/account/world-1/stamps?demo=true`,
`/characters` with seeded `filters`) at 1280, 1500 and 390 px and asserts no console error or
page error mentions `#418`, `#423`, `#425` or `Hydration`. With the gate still in place this
passes trivially; it exists so phase 3 can be verified by the same test.

### Phase 3: remove the gate

Prerequisite inside this phase: `components/wiki/EntityList.jsx` rows render real `href`
anchors (via a new `hrefFor` prop, same shape as `EntityPanel`'s), and a band that is collapsed
still emits its hidden entries as text-only anchors in a `display: none` `<nav>`. Today every
row is a `<Link component="button">`, and `/wiki/<kind>` and `/wiki/changelog` get their
crawlable links from `CrawlLinks`; deleting it first would leave those pages with zero entity
anchors. (`/wiki/changelog` already renders real hrefs. `EntityPanel` and the builds hub do too.)

Then `WaitForRouter`, `PreHydrationLoader` and `CrawlLinks` are deleted with their tests;
`_app.jsx` renders the provider tree unconditionally; `crawlLinks`/`crawlHeading` props leave
`pages/wiki/[kind]/index.jsx`, `pages/wiki/[kind]/[slug].jsx`, `pages/wiki/changelog.jsx`,
`pages/tools/builds/[slug].jsx` and `utility/builds/build-pages.mjs`; gate-era comments are
rewritten in `_app.jsx`, `_document.jsx`, `PageTitle.jsx` (`PAGE_H1_SX` comment), `PageLoadingProvider.jsx`,
`view.jsx`, `BuildCard.jsx`, `firebase/index.js`, `seo-head.mjs`, `generate-page-seo.mjs`,
`build-pages.mjs`; `CLAUDE.md`'s "Page titles and descriptions" and "Static export gotchas"
sections are updated.

`_app`'s `<Head>` block stays. Data pages still render `DataLoadingWrapper`'s loader at build
(`isLoading: true` in `DEFAULT_STATE`), so their `<NextSeo>` never runs and `PAGE_SEO` remains
their source. Static pages now render their own `<NextSeo>` at build too. `next/head` dedupes
title by tag, description and canonical by key, og:title and og:description by key, robots by
meta name, so the export carries one of each with the page's copy winning. `static-head.spec.js`
gains `og:title` and `robots` counts in both halves, because those two tags gain a build-time
writer here.

**Effect on UX.** Static pages paint NavBar, breadcrumbs and page body from the HTML before JS.
Plain anchors work pre-hydration. Data pages paint NavBar plus "Loading account data..."
immediately. Post-hydration behaviour is unchanged.

**Effect on output.** Per-page HTML grows (inlined emotion CSS and NavBar markup; entity pages
with large relation tables grow most). Total `out/` size is recorded before and after in the
plan's final report; GitHub Pages bandwidth is a known concern.

## Verification

- `npm test` green after every task. `npm run lint` clean.
- `npm run build` succeeds (with `NEXT_PUBLIC_BUILDS_URL` pointed at the production worker, see
  plan constraints); `npm run test:e2e:nobuild` green, including the three new specs.
- Chrome, real browser (the in-app pane cannot run this app), phase 3 exit criterion beyond the
  e2e sample: `?profile=<name>` with `authHint` absent, a signed-in session, a non-UTC timezone
  and non-`en` locale, `/leaderboards` with `showAnonymous=false` stored. Zero React #418/#423.
- Chunk audit before/after: bytes of JS referenced by `/` and by one wiki entity page.

## Risks

- **Prerender errors are build failures, not caught errors.** Error boundaries do not run during
  `next build`. Any of the ~3,500 wiki entity pages that throws under `DEFAULT_STATE` fails the
  build. That is the desired outcome (loud, before deploy), but it is where phase 3 can stall.
- **One missed mismatch re-renders the whole root.** There is no Suspense boundary, so React 19's
  recovery from #418 discards the server DOM for the entire page: it still works, but the
  phase-3 gain is forfeited on that page. The hydration e2e spec is the guard.
- **`authHint` stuck on `'no'`.** Impossible by construction: `'no'` is only written when firebase
  itself reported no user or on explicit logout, and every login path writes `'yes'` before the
  next load.
- **Init ordering.** If the init effect ran before `HYDRATE_STORAGE`, `state.account` and
  `state.signedIn` would still read as absent (neither is stored), so the outcome would be the
  same; the guard exists for the persist effect and consumers, not for init's branch choice.
