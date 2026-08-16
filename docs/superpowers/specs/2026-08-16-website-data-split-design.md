# Split website-data.json so pages ship only the keys they import

**Date:** 2026-08-16
**Status:** Approved design, not yet implemented
**Repos touched:** `z-processing` (generator), `IdleonToolbox` (consumer)

## Problem

`data/website-data.json` is 9.8 MB on disk and compiles into a single bundle chunk of
6.1 MB raw / 0.7 MB gzip, shipped via `JSON.parse('...')`. That chunk is referenced by
**225 of 242 exported pages (93%)**, including all 137 `/tools/builds/*` pages, because
a single JSON module is atomic — importing one key pulls all 143.

Page weight correlates perfectly with the CrUX field data. Account pages measure 5–9 s
LCP against a 2.2 s desktop / 3.3 s mobile homepage that passes. The homepage was
initially misread as the problem; it is only the *example URL* labelling a Search Console
URL group whose real members are the account pages.

### Evidence

Per-key byte distribution of the 143 keys (raw `JSON.stringify` bytes, 6.08 MB total):

```
 rank  key                size     cumulative
   1   monsterDrops       2.08MB      34.3%
   2   items              0.91MB      49.2%
   3   itemsArray         0.87MB      63.5%
   4   crafts             0.42MB      70.3%
   5   quests             0.21MB      73.8%
  6-9  monsters, talents, achievements, taskUnlocks
                          0.44MB      80.9%
```

117 keys are under 20 KB and sum to **0.60 MB combined** — 10% of the total. Splitting
those individually buys almost nothing and costs 117 files.

### Spike result

A throwaway spike split three keys (`monsterDrops`, `crafts`, `quests`) behind a barrel
and repointed the alias. Build succeeded with **zero consumer changes**. Per-page chunk
references afterward:

```
index.html                      — none —
leaderboards.html               — none —
account/world-7/research.html   rest-3.38MB                       <- monsterDrops GONE
tools/builds/warrior.html       rest-3.38MB, monsterDrops-2.08MB
dashboard.html                  rest-3.38MB, monsterDrops-2.08MB
account/world-3/printer.html    rest-3.38MB, monsterDrops-2.08MB
```

`account/world-7/research` fell from 6.09 MB to 3.38 MB — **44% off, from splitting 3 of
143 keys**. Tree-shaking works through a JSON barrel. All spike changes were reverted;
the tree was clean at `c328d007a6`.

## Decisions

| Question | Decision |
|---|---|
| Granularity | Threshold: any key ≥ 20 KB gets its own file, the rest collapse into one |
| Catch-all filename | `shared-data.json` |
| `itemsArray` | Derive from `items`; stop emitting it |
| Chunk-grouping anomaly | Investigate with a 2 h timebox, then ship regardless |
| Verification bar | Equivalence tests + per-page chunk manifest + local traces |

The threshold is evaluated at generate time on every run, so a new or growing key splits
itself with no list to maintain. Consumers never observe which side of the threshold a key
sits on — `import { compass } from '@website-data'` resolves identically either way — so
threshold churn never causes a code change.

A hardcoded top-N list was rejected for the opposite reason: a future 3 MB key would land
silently in the catch-all and re-inflate every page, with nothing to catch it.

## Approach

Three options were considered.

**A — generator splits, toolbox commits the output.** *(chosen)* Follows the pipeline that
already exists; `syncToFrontend` is the established bridge between the repos. Side benefit:
git history stops rewriting a 9.8 MB blob on every regeneration — only changed keys churn.

**B — toolbox splits at build time**, keeping the single blob committed and exploding it
into a gitignored directory during `prebuild`. Rejected: the 9.8 MB blob stays in history
forever, `data/website-data.json` keeps existing so a stray import silently bypasses the
split, and data-shaping logic lands in the consumer rather than the pipeline that owns it.

**C — deep imports, no barrel** (`import monsterDrops from '@website-data/monsterDrops'`).
Rejected: 116 import sites change for no gain, since the spike already proved the barrel
tree-shakes.

## Design

### 1. Generator (z-processing)

`reduceToFile('exported', 'website-data.json', allFields)` at `core/process.js:526` becomes
`reduceToSplitFiles('exported', 'website-data', allFields)`. Behaviour:

1. Reduce `allFields` into one object exactly as today.
2. For each key, `Buffer.byteLength(JSON.stringify(value)) >= 20480` → own `<key>.json`;
   otherwise accumulate into `shared-data.json`.
3. Emit `index.js`, the barrel.
4. Emit the declaration file from the **unsplit** object using the existing
   `generateDeclarations`, so the ambient `declare module '@website-data'` is byte-identical
   to today's.

`{ itemsArray }` **stays** in the `allFields` array at `core/process.js:470`. Removing it
there would also strip it from `versioned-data/` and from the generated `.d.ts`, both of
which must stay complete. Instead the splitter treats it as a *derived export*: excluded
from the emitted files, reconstructed in the barrel from `items`. This yields **25 heavy
files plus `shared-data.json`** — 26 emitted files covering 142 keys, with `itemsArray`
restored as the 143rd name by the barrel.

`versioned-data/website-data-<version>.json` stays a single file. It is an archive feeding
`tools/versionCompare.js`, not shipped to users. The regression baseline in
`extractor/regression.js` is unchanged for the same reason.

`validateData` (`core/Utils.js:123`) currently reads one path and asserts no key is empty.
It gains a directory mode that reassembles from the emitted files and runs the identical
check, preserving today's "all 143 fields non-empty" guarantee rather than weakening it.

`syncToFrontend` (`core/Utils.js:174`) copies only top-level *files* from `exported/` and
skips directories, so it would silently skip the split output. It gains a recursive copy
for `website-data/`, plus deletion of the now-stale `data/website-data.json` and
`data/website-data.d.json.ts` in the toolbox on first run.

### 2. The `itemsArray` derivation

`itemsArray` is exactly `Object.values(items)` — same order, same fields, same values —
except 25 `EquipmentKeychain*` entries where `itemsArray` carries `UQ1txt`/`UQ1val` of
`[0, 0]` and `items` carries the real values.

Root cause, `features/items.js:87-90` — two hand-maintained object literals that drifted:

```js
items[itemName] = { ...details, displayName, itemType, rawName: itemName, ...extraData };
//                                                                        ^^^^^^^^^^^^^ keychains
if (!excludedItems[itemName] && !itemsArray?.some(({ rawName }) => rawName === itemName)) {
  itemsArray = [...itemsArray, { ...details, displayName, rawName: itemName, itemType }]
  //                                                       no extraData
}
```

`extraData` is `keychains[itemName]`, spread into `items` only. Deriving `itemsArray` from
`items` deletes the duplicated literal, which is why the divergence cannot recur.

**Provenance — this is an oversight, not a design decision.** The two literals were
equivalent from `a572e5d0` (2023-03-16) until `5921946` "feat: keychains" (2025-04-22),
whose diff touches the `items[itemName]` line only; the `itemsArray` line does not appear
in it. `extraData` is declared inside the `if (!excludedItems[itemName])` block, so the
`itemsArray` branch below cannot reach it — the divergence is fallout from where the
variable was scoped. That same commit added `rawName: itemName` to `items`, a field
`itemsArray` had carried since 2023, showing the author was syncing one literal forward
without looking at the other. `itemsArray` therefore carries the raw game placeholder
`UQ1txt: 0, UQ1val: 0`, which is what appears when enrichment never runs; every consumer
gates on `UQ1txt && UQ1val`, so nothing reads the zeros as meaningful. The stats have been
missing from `itemsArray` for roughly 16 months.

**Deliverable:** a warning comment above `createItems` in `features/items.js` recording
that `itemsArray` is no longer emitted, that it is derived from `items` downstream, and
that any new per-item enrichment must go into `items` — anything added to a second literal
will diverge again and this is the drift that produced the keychain bug.

The derivation is not separable from the bug fix: `Object.values(items)` returns the correct
values by construction. Twenty-five keychain entries will therefore start reporting real
stats. This is intended, and is a user-visible behaviour change — see Risks.

### 3. Toolbox

**Files.** `data/website-data.json` and `data/website-data.d.json.ts` are deleted.
`data/website-data/` gains 25 heavy `.json` files, `shared-data.json`, and `index.js`.
All are tracked; `data/` is not gitignored in this repo.

**Alias.** Two sites — `tsconfig.json:25` and `vitest.config.js:15` — repoint to
`data/website-data/index.js`. These are the only two; there is no jest config and
`next.config.js` has no alias block (Next reads tsconfig `paths`).

**Barrel:**

```js
// Auto-generated by z-processing. Do not edit.
export { default as monsterDrops } from './monsterDrops.json';
export { default as items } from './items.json';
// ...23 more heavies

import items from './items.json';
export const itemsArray = Object.values(items).map((item) => ({ ...item }));

import shared from './shared-data.json';
export const { ButtonBonusNames, /* ...117 names... */ zenithMarket } = shared;
```

`export { default as items }` and `import items` coexist legally — a re-export creates no
local binding. The spike compiled this form.

The `.map((item) => ({ ...item }))` is deliberate. A bare `Object.values(items)` would make
`itemsArray[i]` and `items[rawName]` the *same object*, where today they come from two
separate parses and are distinct. Nothing in the codebase mutates an entry in place today
— `parsers/world-3/hatRack.ts:116` spreads before mutating, and every other consumer uses
`filter`/`map`/`Set` — but the shallow copy costs ~1 ms at module init and closes a bug
class that would be miserable to diagnose.

**Declaration file** moves to `data/website-data.d.ts`, *not* `data/website-data/index.d.ts`.
It contains `declare module '@website-data'`, an ambient declaration; placed beside
`index.js` it would additionally read as that module's own type file and the two roles
interact badly. At `data/` root it stays unambiguously ambient, matches today's behaviour,
and `tsconfig`'s `include: ["**/*.ts"]` still picks it up.

**Import specifiers.** 113 files use `from '@website-data'` and need no change. Three use
the bare path `from 'data/website-data'` — `pages/tools/card-search.jsx:4`,
`pages/tools/item-browser.jsx:2`, `pages/tools/item-planner.jsx:1` — which resolves through
`baseUrl` to the JSON today and would resolve to `data/website-data/index.js` by
directory-index lookup after the split. It works, but incidentally, and it bypasses the
ambient declaration so those three files lose their types. All three are normalised to
`@website-data`.

### 4. Testing

**One-shot migration check** (run during implementation, not committed): build the split
from the current `website-data.json`, reassemble it, `assert.deepStrictEqual` against the
original. Nothing proceeds until this passes. It cannot become a permanent test — the blob
is deleted, and a hash fixture would go stale on the next legitimate data regeneration.

**Permanent tests, z-processing.** Written before the implementation:

- a key at 20,479 bytes lands in `shared-data`; at 20,480 it gets its own file
- reassembling every emitted file reproduces the input object exactly
- the barrel's export names match the input keys exactly
- `itemsArray` is absent from the emitted files
- `validateData` directory mode rejects an empty field, as the single-file mode does

**Permanent tests, IdleonToolbox** — `__test__/data/website-data-barrel.test.js`:

- the barrel exports exactly 143 names (142 emitted + `itemsArray` derived)
- no export is `undefined`, `[]`, or `{}`
- `itemsArray` deep-equals `Object.values(items)`
- the 25 `EquipmentKeychain*` entries carry real `UQ1txt`/`UQ1val`, asserted **against
  `items`** rather than hardcoded, so the test stays true across regenerations

The existing suite (58 files / 1,062 tests) must stay green.

**Chunk manifest.** A committed `utility/chunk-manifest.mjs` walks `out/**/*.html`, extracts
referenced `_next/static/chunks/*`, and reports bytes per page. Reusable for future
performance work, and the artefact that answers the builds-page anomaly.

Acceptance: no page's total chunk bytes increase; `account/world-7/research` and the other
`itemsArray`-only tool pages drop measurably; whether `shared-data` is present on pages
importing zero small keys is recorded either way.

**Traces.** Serve `out/` locally, then chrome-devtools MCP at 4× CPU / Slow 4G on four
pages: `account/world-7/research` (worst CrUX offender), `dashboard`,
`tools/builds/warrior` (the anomaly), and `index` (control — currently passing, must not
regress). LCP breakdown captured before and after.

CrUX field confirmation runs on a 28-day rolling window, so it is follow-up observation,
not a gate on this work.

## Sequence

1. **Baseline first, before any edit.** Build current `main`, dump the chunk manifest, keep
   it. Once the blob is gone this is unrecoverable without a checkout.
2. **z-processing:** tests for `reduceToSplitFiles`, then the implementation, then
   `validateData` directory mode, then `syncToFrontend` recursive copy and stale-file
   cleanup, then the `createItems` warning comment.
3. **Run the generator**, then the one-shot equivalence check.
4. **Sync to toolbox:** alias flip at both sites, three import-line normalisations, delete
   `website-data.json` and `.d.json.ts`.
5. **Barrel test**, then the full suite.
6. **Build, diff the manifest**, then traces on the four pages.
7. **Timeboxed 2 h** on the builds-page anomaly if it survives.

## Risks

**The keychain change is user-visible.** `components/common/ItemDisplay.jsx:100` renders
`+{UQ1val}{UQ1txt}` as a "Misc" row, gated on both being truthy. Today the 25 keychains hold
`0`, so the row is hidden; afterwards it shows text of the form `+1,2,5 Base Defence`.
`components/dashboard/Characters.jsx:168` gates weapon and ring alerts similarly. This is the
intended fix, but it means keychain tooltips gain a row — to be eyeballed during the trace
pass rather than discovered in a bug report.

**Cross-repo staleness.** A stale z-processing checkout regenerates the monolith, the
toolbox alias points at a missing `index.js`, and the build fails loudly. Loud is the correct
failure mode; there is no path to silently wrong output.

**Rollback.** `git revert` in the toolbox restores both the blob and the alias in one commit.
z-processing reverts independently. Neither depends on the other reverting first.

**Not a risk, recorded for the avoidance of doubt.** Nothing here touches `WaitForRouter`,
`CrawlLinks`, JWT verification, or SEO gating. This work is orthogonal to the 2026-07-05
reverted growth run.

## Open, to be settled by measurement

**Does `shared-data.json` drop from a page importing zero small keys?** The spike proved
unused *re-exports* drop — `research.html` shed `monsterDrops`. It did not prove that a
*destructured* export drops, because no page in the spike avoided the catch-all entirely.
If it does not drop, the floor for every page is 0.60 MB raw / ~70 KB gzip rather than
zero. That is an acceptable floor either way, so this is a measurement item, not a risk.

**Why do builds pages pull `monsterDrops`?** In the spike, `tools/builds/warrior.html`
referenced `monsterDrops` despite having no static import path to it — the only importers
are `parsers/class-specific/{compass,grimoire,tesseract}.ts`,
`parsers/generated-types.ts`, `pages/account/class-specific/grimoire.jsx`, and
`pages/tools/guaranteed-drop-calculator.jsx`, none of which are in the builds tree.
Turbopack's chunk *grouping* over-includes relative to the static import graph.

This matters because 137 of 242 pages are `/tools/builds/*`. If the anomaly survives the
split, those pages still carry 2.08 MB — larger than everything the threshold split buys
them. Candidate causes to check within the timebox: a stray import in the shared layout, a
barrel re-export edge case, or a Turbopack grouping heuristic. If unresolved when the box
closes, the finding is documented with hard numbers from the manifest and the split ships
on its own merits.

## Non-goals

- Changing any parser, page, or component beyond the three import-specifier normalisations
- Splitting `versioned-data` or the regression baseline
- Addressing the empty-`<body>` static export problem (`WaitForRouter`) — separate work
- Waiting on CrUX field data before shipping
