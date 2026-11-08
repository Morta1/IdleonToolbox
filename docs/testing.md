# Testing

Read before writing a test or running page-check, e2e or a build. The short version (commits, deploys) is in `CLAUDE.md`.

## Hand checks

Hand checks run on `node tools/page-check.mjs <routes>` (static export on `E2E_PORT`, default 3002): sizes, demo and guest,
forced failed sections, API replies through `--setup`, one image sheet per page, text dumps that compare with `diff -r`, and a
DOM scan for broken words, overlaps, text out of its card, tall rows, hidden table heads and raw game marks. Extend it instead
of writing a one-off script. A hit is a lead, and a clean run isn't "looks right": it can't see a floating footer.
`--compare <old build>` measures each route's content height, area per ink and short card rows against another site (the
pre-4.0 build), for finding pages that spend more room than they did.

## E2E gotchas

`npm run test:e2e` builds, then serves `out/` on **3002**, or on `E2E_PORT` when set; `test:e2e:nobuild` reuses `out/`.
- E2E runs against the **static export, not `next dev`**. A stale `out/` tests old code.
- Never `waitForLoadState('networkidle')` — ad scripts never let it settle. Use `waitForRender` from `e2e/wait-helpers.js`.
- Navigate with relative paths; the port lives only in `E2E_PORT` (default 3002), which both Playwright configs and
  `npm run serve:e2e` read. Two checkouts running e2e or screens at once each set their own.
  Both configs start a fresh server per run and stop at once if something already listens on the port.

## Commits and builds

- Pre-commit runs the full vitest suite. Never `--no-verify`. `QUICK_COMMIT=1` runs the tests that import a staged
  file plus the tests that read sources from disk, which `vitest related` can't connect to what they check, and
  the build's type check (`tsc --noEmit --incremental -p tsconfig.build.json`): for commits between a plan's gates,
  and the gate runs the full suite. A new test that scans sources joins `SOURCE_SCANS` in `.husky/pre-commit`.
- `FAST_BUILD=1 npm run build` exports two wiki entity pages per kind (plus the ones e2e names) instead of ~8,000
  and writes no sitemap: for checks between a plan's gates. A plan's gate or close builds every page; for a deploy, the
  deploy's own build does. `node tools/needs-build.mjs` says whether a change needs that build at all (exit 0 yes, 1 no):
  tests, docs and tool config don't.
- A worktree's build needs `TURBOPACK_ROOT` set to the main checkout, or Turbopack can't resolve the worktree's own files.

## Suite size

On 2026-11-07, after two sweeps: vitest 7,099 tests, 53 s on 10 workers; e2e 607 tests, 253 s on 4.
A plan's close states its counts and full-run times beside these, and a jump needs a reason. No fixed cap: the count alone
misleads, since folding thousands of rows saved seconds while reusing parses and renders saved the time.

## Writing vitest tests

The suite was trimmed by ~780 redundant cases on 2026-10-11 and ~4,700 on 2026-11-07; don't regrow them.
- **Search before adding.** Grep `__test__/` for the function under test. If another file already asserts the
  same function on the same fixture, extend that test instead of starting a new one.
- **A sweep is one test per rule.** A rule over a derived list (a registry, every table, every save) goes through
  `expectNoBreaks` (`helpers/sweep.js`) or `onEachFixture` (`helpers/save-fixtures.js`), and the failure names what broke.
  `it.each` is for rows with their own expected value.
- **It must be able to fail.** Break the code once and watch a new test fail before committing it.
- **Proof of one change isn't a test.** Showing that a refactor or fix changed nothing is `parse:golden`'s job: no copies
  of old code to compare against, and no tests kept only for a finished plan.
- **Name a test for the system it checks,** never a plan or task (`task-10-...`). Tests for a temporary feature go when
  its code goes.
- **Time is the real cost.** A new check joins a parse or render another test already pays for, and a search or
  optimizer runs the shortest input that still catches the break.
- **Setup written a second time moves to `__test__/helpers/`.** Look there first.
- **Account-wide sweeps already exist; don't repeat them per stat or section:**
  - `breakdown-totals.test.js` rebuilds every breakdown on every fixture/character and checks for NaN lines.
    A new breakdown only needs registering in `__test__/helpers/breakdown-totals.js`, not its own rebuild test.
  - `nan-elimination.test.js` gates NaN/Infinity across the whole parsed tree; per-field `isFinite` tests are redundant.
  - `empty-account.test.js` / `null-fallback-shape.test.js` own the logged-out shape.
- **Live-verified values:** one `live-verified-*.test.js` per game system; a new reading from the same DNSM
  table goes into that file's existing `GAME` table, not a new file. A row is a number the game's logic computes,
  never a catalog value, and never a reading another row already pins.
- **Test the real code.** Never assert a formula you copied into the test file, a constant against itself, or
  `toBeDefined`/`> 0` alone. A verbatim copy of the game expression is fine as an *oracle* the parser is compared against.
- **One exact assertion beats many partial ones:** `toEqual(fullList)` instead of `toContain` + `not.toContain` trios.
- **Same branch, different inputs = one `it.each` table.** Separate `it` blocks are for separate branches. One row per
  band, threshold or branch, not several inside one band.
- Parse a fixture once (`parseFixture` caches per fixture; use module scope or `beforeAll`), never per test.
- No hard-coded catalog/data counts; derive from the source data so a game update doesn't break the test.
- No debug or scratch tests under `__test__/`: the glob picks up every `*.test.*` file there, untracked ones included.

## Writing browser tests

The vitest rules apply too.
- **Only what a browser alone can see.** If vitest can check it, it goes there.
- **Extend a spec before adding one.** Every gate pays for each spec's run time.
- **A check over many routes is one test per kind of route,** and its failure lists the routes that broke.
- **Routes come from `discoverRoutes` (`e2e/route-helpers.js`) or `getAllTestCases` (`e2e/smoke-helpers.js`).** A helper
  a second spec needs moves into one of those files.
