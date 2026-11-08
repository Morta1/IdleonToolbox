# Static export and page titles

Read before touching a page's title, description or canonical, a route (a new page, a dynamic `[param].jsx`,
`getStaticProps`), or anything that renders at build. The one rule every component change needs, the first render matching
the build, is also in `CLAUDE.md`.

## Page titles and descriptions

`data/page-seo.js` is **generated — do not edit by hand**. `<title>`, `<meta name="description">`
and `<link rel="canonical">` all come from `_app`'s `<Head>` as well as each page's `<NextSeo>`: a
data page renders a loader at build, so its NextSeo never runs in the export, and the title must
not blank during hydration. After changing a `<NextSeo>` title or description, re-run
`node utility/generate-page-seo.mjs`.

- **Never write a head tag from `_document`.** It lands outside `next/head`'s control and can't be
  deduped against the page's `<NextSeo>` copy: every page shipped two descriptions, and
  `_document`'s froze at the landing page while `NextSeo`'s followed the route.
- **The canonical must keep `key="canonical"`.** next-seo emits its own under that key, and
  `next/head` collapses two `<link>`s only when keys match.
- **A page shipping `seoNoindex` must repeat `noindex` in its own `<NextSeo>`.** next-seo emits a
  robots tag regardless and replaces `_app`'s by meta-name dedupe, so the page un-noindexes itself
  once JS runs — invisible to any check on the bytes.
- **`PAGE_SEO` is keyed by route pattern**, so all pages from one `[param].jsx` share an entry.
  Those pages pass `seoTitle`/`seoDescription`/`seoNoindex` through `getStaticProps` instead, and
  need an `OVERRIDES` entry or the generator reports them.
- **Match `<title[^>]*>`, not `<title>`.** Next emits `<title data-next-head="">`; a naive regex
  finds 1 of 251 files and calls the site untitled.
- `e2e/static-head.spec.js` is the gate, and needs both halves — raw served HTML with no JS, and
  the same counts re-measured after hydration. The two states have disagreed in both directions.
- Keep `<NextSeo>` above any early-return loader, or the page loses its title while loading.

## Static export gotchas

`/tools/builds/[slug]` learned both the hard way.
- **Two dynamic siblings can't coexist.** `[class].jsx` and `[build].jsx` in one directory is a
  build error — Next refuses different param names for one dynamic path. One route branches on
  what the slug turns out to be.
- **Slugs that reach the filesystem must be lowercase.** The export writes one file per page, and
  a local export runs on a case-insensitive filesystem: `frZFgN-x` and `FRzfGn-x` overwrite each
  other on Windows while staying distinct on GitHub Pages.
- **`fallback: false` means anything published after the deploy 404s.** `/tools/builds/view?id=`
  stays alive for exactly that case, and is `noindex` because it duplicates every build page.
- **Everything renders at build time.** There is no router gate: the export is the real page,
  with `AppProvider` at `DEFAULT_STATE` (`isLoading: true`, no account, storage not yet merged).
  Data pages therefore export `DataLoadingWrapper`'s loader; static pages export their body.
  A page that throws under `DEFAULT_STATE` fails `next build`, which is the intended alarm.
- **The first render must be identical on the build machine and the client.** No `localStorage`,
  `typeof window`, `Date`, `Math.random` or timezone/locale formatting in render or in a
  `useState` initialiser; read those in an effect, or gate the markup on `useHydrated()`
  (`hooks/useHydrated.js`). No `useMediaQuery(..., { noSsr: true })`: `__test__/no-nossr.test.js`
  fails on any. One mismatch anywhere makes React discard the server DOM for the whole page.
  `e2e/hydration.spec.js` is the gate: sample routes, three widths, foreign timezone and locale,
  seeded storage, zero React #418/#423/#425.
- **`router.query` is empty on the first render of any page whose URL can carry a query string.**
  Next only fills it for an `autoExport` page after mount, so `router.isReady` is `false` and
  `router.query` is `{}` while the export's markup is being matched. Derive from the router during
  render (`router.isReady ? router.query.x : fallback`, which re-renders the moment `isReady`
  flips) or read it in an effect: never seed a `useState` initialiser from it, or a deep link
  freezes on the fallback while everything that reads the router live moves on without it.
- **Links must be real anchors to reach a crawler.** A `<Link component="button">` ships no
  `href`. Wiki listings render anchors for every row, including the ones a collapsed band hides.
- **Firebase and game data load on demand.** `firebase/lazy.js` is the only importer of
  `firebase/index.js`; `authHint` in localStorage lets a known-anonymous visitor skip it. Pure
  helpers the wiki needs live in data-free modules (`parsers/cardMath.ts`, `parsers/powerTypes.ts`),
  never next to a `@website-data` import. `e2e/chunk-audit.spec.js` is the gate.
