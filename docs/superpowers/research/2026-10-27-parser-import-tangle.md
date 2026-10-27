# Parser import tangle: scoping note

> **Outcome 2026-10-27: not pursued.** A prototype of step 0 (goals UI on intent) cut the Owl page from 10,312 KB to only 10,178 KB. The data chunks also arrive through the nav's viewport prefetch of `/characters`, `/dashboard` and the rest, which `hooks/useNavPrefetch.js` keeps on account pages on purpose (~100 ms drawer clicks). Decision (user): keep viewport prefetch; download size on account pages is background and cached, so it isn't worth refactoring for. Effort goes to the main-thread freeze instead. The rest of this note is kept for reference.

Date: 2026-10-27. Branch `feat/parser-foundations`, uncommitted. Numbers come from a static import graph (value imports, `export ... from` and `import()` edges over parsers/, utility/, components/, pages/, hooks/, services/, data/website-data/) plus runtime chunk checks on the branch's static build (demo account).

## The problem in numbers

- Every account page downloads about **10.3 MB of main-thread JS** (raw), of which almost all 30 website-data files (**29 of 30**, about 9.4 MB of source JSON) are part. Wiki pages load 4 data files, so tree-shaking works when imports allow it.
- The parse worker adds its own copy (6.2 MB raw, about 860 KB gzip), because the main thread keeps loading the same code.
- From one parser file you reach almost all of them: `parsers/world-1/stamps.ts` alone reaches **100 of 118 parser files** and all 30 data files. 56 of the 84 account pages reach 100+ parser files through their own imports.

## Two separate causes

### 1. App-level: the navbar "Add goal" button (biggest, cheapest)

`components/common/NavBar/index.jsx` lazy-loads `components/goals/AddGoalButton.jsx` on every page with goals. That button imports the goals registry (`utility/goals/registry/index.js`), which statically imports every system descriptor (`bubble`, `stamp`, `grimoire`, `compass`, ...), and through them **101 parser files and all 30 data files**.

Effect, measured at runtime: `/account/clickers/owl` (whose own imports reach 2 parser files and no data) and `/account/world-1/bribes` both download 10.3 MB and 29 data files.

**27 of 84 account pages** reach 10 or fewer parser files through their own imports and would get light without this: royal-guardian, bubba, kangaroo, owl, friends-stats, guild, quests, storage, tournament, upgrade-vault, bundles, gem-shop, achievements, merits, tasks, bribes, forge, islands, vote-ballot, death-note, hat-rack, salt-lick, emperor, advice-fish, legend-talents, s3, sushi-station.

### 2. Parser-level hubs (structural, larger)

Hub score = average number of parser files that drop out of an account page's reach when that one file is cut (40 sampled account pages):

| File | Avg. parsers dropped | Imported by | Imports |
|---|---|---|---|
| `parsers/misc.ts` (2,073 lines) | 12.6 | 85 files (56 parsers, 10 utility, 9 components, 10 pages) | 39 |
| `parsers/world-5/hole.ts` | 5.8 | 29 | 37 |
| `parsers/world-2/alchemy.ts` | 5.3 | 50 | 31 |
| `parsers/talents.ts` | 3.0 | 59 | 28 |
| `parsers/world-1/stamps.ts` | 2.9 | 35 | 20 |
| `parsers/world-4/breeding.ts` | 2.9 | 24 | 20 |
| `parsers/character.ts` | 1.6 | 17 | 70 |

No single cut breaks the tangle; it mirrors the 58-section dependency cycle measured in `npm run parse:graph`. Pages that show cross-world totals (stamps, bubbles, dashboard, character stats) genuinely need most systems and will stay heavy unless they read values the worker already computed.

`utility/helpers.js` is imported by 90 parser files but is not itself a hub here (it imports only constants, clipboard and analytics).

## Review findings (three independent read-only reviews, 2026-10-27)

Confirmed: the Add goal button is the only eager app-level loader. On `/account/clickers/owl` the initial chunks are ~1.15 MB with no game data; the button's async group is 14 chunks / **7.29 MB**, including the three big data chunks (`3b8l…` items + shared-data 1.67 MB, `2e-t…` 1.86 MB, `2wyc…` monsterDrops 2.86 MB). The parseSave fallback and "copy for support" groups are equally heavy but only load on failure or click.

Corrections to step 1 below:
- Swapping `descriptorsForRoute` alone saves nothing. Three more static paths pull the full registry or a hub parser into the button: `utility/goals/resolve.js` (imports the registry; sorts by registry order), `components/goals/parts/actions.js` (registry lookup just for `wikiId`), and `components/goals/GoalPopover.jsx` (imports `@parsers/world-2/alchemy` directly).
- `utility/goals/registry/totals/pages.js` (767 lines) imports ~20 parsers for every page's totals and must be split per page.
- `resolveGoals` order must come from a data-free list (the `GOAL_ROUTES` key order differs from the registry order).

Options the note missed:
- **Quick win: load the goals UI on hover, focus or click instead of at mount.** It takes the 7.3 MB off first load on every goal-enabled page immediately, before any refactor. The visible button then has to be a small data-free shell in the NavBar.
- **Barrel floor (~1.7 MB):** anything importing `@website-data` gets `items.json` + `shared-data.json` because the barrel runs module-level code (`itemsArray = Object.values(items)…`, the shared-data destructure). Fix in the z-processing generator: pure re-exports, a lazy `itemsArray`, `shared-data` split by system.
- `package.json` has no `"sideEffects"` field; worth testing what Turbopack does with it.

Decide by main-thread blocking (longest task, TBT, field INP), not bytes: desktop visitors cache JS. Before steps 2 and 3:
- profile the remaining ~1.3–1.5 s longest task (compile/eval vs structured-clone receive vs React render);
- pull GA pageviews for the 27 light pages vs the heavy ones. If the light pages are a small share of traffic, stop after step 1.

### Revised order

0. **Hover/focus/click loading of the goals UI** (hours). Measure owl before and after.
1. **Per-route goal descriptors** as above, plus the three decouplings, the `totals/pages.js` split, a loader-map parity test, and a chunk budget check for the owl route (about 1–1.5 days).
2. **Barrel fix in the generator** (about a day, z-processing).
3. Steps 2–4 below **only if** the profiling and traffic numbers justify them.

## Recommended order (original, before review)

1. **Lazy goals registry (first, about 1 day).** The Add goal button should load only the descriptors for the current route (`descriptorsForRoute` already knows them), each through `import()`, instead of the whole registry. Same for any other app-level consumer of the full registry or of `utility/dashboard/account.js` (dashboard alerts reach 102 parser files; check it only loads on the dashboard).
   - First page to slim and measure: **`/account/clickers/owl`** (own imports: 2 parser files, no data). Success: its main-thread JS drops far below 10.3 MB and it loads no website-data chunks except what owl.ts needs. Then check the other 26 light pages, plus the e2e chunk audit and the goals tests.
2. **Split `parsers/misc.ts` by concern (2 to 4 days).** It is a grab-bag (killroy, minibosses, slab, currencies, bundles, companions, friends, cost reductions...). Move each concern into its own small module, starting with what light pages and other parsers import most. Measure reach after each split.
3. **Then hole.ts, alchemy.ts, talents.ts the same way** (about a week together), always keeping pure lookup helpers (bonus getters that only need data plus account fields) in leaf modules, like `parsers/cardMath.ts` and `parsers/powerTypes.ts` already do for the wiki.
4. **Heavy pages (open-ended, weeks):** only reading values the worker computed would make stamps, bubbles or dashboard light. That is option A from the review: components stop calling parser helpers at render. Decide after steps 1 to 3 show how much is left.

## Effort and risk

- Step 1: small, low risk, biggest payoff per hour. Verification: chunk audit e2e, page-text diff (`e2e/page-diff.local.spec.js`), goals tests.
- Steps 2 to 3: medium, mechanical moves with no value changes, gated by `npm run parse:golden -- --compare` and the worker parity check. Risk: circular imports reordering module init (check for undefined-at-import errors in the e2e smoke run).
- Step 4: large; a separate project.

## Not measured yet

- The size of the owl page after step 1 (the main number to measure first).
- Whether the dashboard alerts code (`utility/dashboard/account.js`) also loads on non-dashboard pages; the runtime probe was inconclusive because its marker string is shared with the goals registry.
