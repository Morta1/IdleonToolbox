---
alwaysApply: true
---

## Read first, by task

The rules every change needs are below. Task-specific ones live in `docs/`; read the file before starting that task:
- Building or changing UI: `docs/design-system.md` (which shared piece to use, where controls go, colours, type and
  numbers). A change to one of those rules updates that file in the same commit.
- Writing a test, or running page-check, e2e or a build: `docs/testing.md`.
- A page's title, description or canonical, a new or dynamic route, `getStaticProps`, or anything that renders at build:
  `docs/static-export-and-seo.md`.
- Translating obfuscated game code, changing a parser, adding a `.ts` file or a path alias: `docs/parsers.md`.
- Adding, renaming or changing a dashboard alert or tracker: `docs/dashboard-alerts.md`.

## New page
- When being asked to create new page, make sure to add it to the correct folder path, when unsure, ask.
- Update the relevant PAGES path at `components/constants.jsx`
- In case tabs are being added to the page, make sure to update the tabs array as well.
- Every new page should have an icon, if an icon is not being provided, you can use "/data/ClassIconsNA2.png" as a temporary file.

## Testing and deploys
When testing add "http://localhost:3001?demo=true" to be able to access all pages without login in.

Pre-commit runs the full vitest suite. Never `--no-verify`. `QUICK_COMMIT=1` runs only the tests a commit touches, plus
the type check, for commits between checks; how tests are written and run is in `docs/testing.md`.

Before a push to `main` (a deploy), check what the change can break, not everything:
- Always: the full vitest suite on what goes out (the commit hook without `QUICK_COMMIT`, about a minute), and each
  changed page looked at, desktop and phone width.
- No local build: the deploy builds every page itself (`deploy.yml`), and a failed build deploys nothing.
- e2e only for what several pages share: the nav, the page frame or the side ads, patch notes or What's new, page titles,
  metadata or routing, anything that can render differently on the server and in the browser (dates, storage, the URL),
  and shared building blocks (`CardGrid`, `IconTile`, `Panel`, `ItemCard`, `Toolbar`). Then the spec that covers it, not
  the whole suite. A change that stays on one page (a layout tweak, a number format, an alert setting) skips it.

## Components

This project uses **React Compiler** (`reactCompiler: true` in `next.config.js`), so manual memoization with `useMemo` and
`useCallback` is generally unnecessary. Components stay `.jsx`; parsers are `.ts` (`docs/parsers.md`).

Every page renders at build, so **the first render must be identical on the build machine and the client**: no
`localStorage`, `typeof window`, `Date`, `Math.random` or timezone/locale formatting in render or in a `useState`
initialiser; read those in an effect, or gate the markup on `useHydrated()`. Never seed a `useState` from `router.query`,
which is empty on the first render. The rest of the export's rules: `docs/static-export-and-seo.md`.

### Local storage

Use `useLocalStorage` from `@mantine/hooks` (`[value, setValue, remove]`), never
`localStorage.getItem`/`setItem` with `useState`. For a one-off read outside render, use
`readLocalStorageValue`. Keys may be dynamic (e.g. scoped by `state.uid`) — the hook re-reads when
the key changes.

- Values are JSON-serialized: `'public'` is stored as `"public"`.
- Omit `defaultValue` when "never set" must stay distinguishable — it gets written back to storage.

### Date & time formatting

All user-facing dates and times must respect user preferences (DD/MM vs MM/DD, 24h vs 12h). Preferences are stored in localStorage (`pref-dateFormat`, `pref-timeFormat`) and exposed via `PreferencesContext`.

**In React components**, use one of these hooks — never hardcode format strings like `'dd/MM/yyyy HH:mm:ss'`:

- **`useFormatDate`** (`@hooks/useFormatDate`) — returns `formatDate(dateMs, options?)`. Use for direct date formatting.
  - Options: `{ showSeconds, shortYear, timeOnly }` (all default `false` except `showSeconds` which defaults `true`)
  - Example: `formatDate(timestamp)`, `formatDate(date, { timeOnly: true })`, `formatDate(date, { shortYear: true, showSeconds: false })`
- **`useRealDate`** (`@hooks/useRealDate`) — returns `(ms, shouldFormat?) => string`. Drop-in replacement for `getRealDateInMs`. Handles the "X days" fallback for non-date values.
  - Example: `const getRealDateInMs = useRealDate();` then use like before.

**Outside React** (parsers, utilities): `getRealDateInMs` in `utility/helpers.js` accepts an optional `formatString` parameter. No React components should import this directly — use the hooks instead.

**Formats that are intentionally unambiguous** (e.g., `'MMM do, yyyy'` showing month names) do not need migration.

**Data export formats** (e.g., clipboard export, image footers in `Breakdown.hook.js`) may use the preference system too, so the exported data matches what the user sees on screen.

## Patch notes
Every user-facing change (feature or fix) gets a patch note entry in `data/patch-notes.js`.

- **Always ask first.** Never add a patch note entry unprompted — propose it and wait for approval, or add it only when asked.
- Once approved, add it as part of the change itself, in the same commit — don't leave it for later.
- Append to the top (newest) entry's `features` or `fixes` array **only if its `date` is today**. If the top entry's date is any earlier day, it has shipped — add a new entry above it instead: bump the patch version by one, set `date` to today (DD/MM/YYYY), carry `gameVer` over, and leave the unused `features`/`fixes` array empty.
- Make sure the patch notes are concise and easy to understand, don't add too much information.
- Describe the user-visible effect, not the implementation.
- Skip only for changes users can't see: refactors, tests, tooling, docs, type-only changes.

## Empty-account contract (parsers)

Every page must render logged-out, showing the full catalog at zero (SEO requirement). Gotchas:

- **Loop the catalog, not the save.** Save-driven loops produce an empty page with no save. Most common way to break this.
- **Return populated objects, never `undefined`/`null`/`[]`** for content that exists regardless of progress. Feature-locked sections are the exception — `null` + `unlocked: false`, pinned by `null-fallback-shape.test.js`.
- **`?? 0` is wrong where the identity is 1** (multipliers, rates). A default that's wrong when data IS present silently changes real users' numbers.
- **No hardcoded content counts** — derive from the catalog, or it goes stale next game update.
- **A guard added for the empty case usually also fires on real saves.** Check both.
- `parseData` returns `{ account, characters }`, not `{ accountData, charactersData }` (that's internal).
- Verify real-save output is unchanged against the five `__test__/fixtures/`. Gates: `empty-account.test.js`, `nan-elimination.test.js` (NaN **and** non-finite), `e2e/no-nan.spec.js`.
- Helpers: `liveEntries` (`parsers/catalog.ts`) drops placeholder rows; `safeSection` isolates a throwing parser.

## Comments

Few and load-bearing — why, not what. No narrating the investigation.

Never delete a directive comment: `// @vitest-environment jsdom`, `eslint-*`, `@ts-*`, `webpackChunkName`, `prettier-ignore`. They're behaviour, not documentation.
