# Entity Graph + Wiki Search Design

**Date:** 2026-08-24
**Status:** Approved design, pending implementation plan

## Problem

IdleonToolbox has no way to answer "where do I get item X" or "what is X used for". The
relations exist in `data/website-data/` (drops, crafts, quests) but are never joined.
Prior attempts failed on two things: ID/linking mismatches between sections, and scope
explosion (trying to cover every data section at once).

## Goals

- One normalized entity graph connecting items, monsters, NPCs, and quests.
- A `/wiki` search page: type an entity, see all its connections, click through them.
- Maintainable across game patches: regenerating website-data regenerates the graph,
  and any newly broken link is surfaced loudly instead of silently dropped.

## Non-goals (v1)

- Graph visualization (node-and-edge diagram UI).
- Multi-hop "path from A to B" queries (e.g. full recipe chains).
- Per-entity static routes (`/wiki/item/Copper` as build-time pages). Upgrade path only.
- Any relation source beyond the core four listed below.

## Source-of-truth layering

- `N.js` is the source of truth; only z-processing reads it.
- `website-data/` is the extracted product; the graph builder reads ONLY these files.
- If a relation is missing or incomplete in website-data, the fix is to extend
  z-processing to extract it into website-data first. The graph builder never parses
  N.js, and never patches around missing source data.

## Data model

One generated file: `data/entity-graph.json` with two parts.

### Nodes

Keyed by canonical ID `kind:rawName`. `rawName` is the game's own key (the existing key
of `items.json`, `monsterDrops.json`, `quests.json`). Display names are never used for
joining.

```json
{
  "item:Copper":    { "kind": "item", "rawName": "Copper", "name": "Copper_Ore", "icon": "Copper", "category": "Ore" },
  "monster:mushG":  { "kind": "monster", "rawName": "mushG", "name": "Green_Mushroom", "world": 1 },
  "npc:TP_Pete":    { "kind": "npc", "rawName": "TP_Pete", "name": "TP_Pete", "world": 1 },
  "quest:TP_Pete1": { "kind": "quest", "rawName": "TP_Pete1", "name": "Retribution_Time" }
}
```

Kinds in v1: `item`, `monster`, `npc`, `quest`.

### Edges

Flat list of typed relations with metadata:

```json
[
  { "from": "monster:mushG",           "to": "item:Grasslands1", "rel": "drops",       "meta": { "chance": 0.35, "quantity": 1 } },
  { "from": "item:EquipmentShirts1",   "to": "item:CraftMat1",   "rel": "craftedFrom", "meta": { "quantity": 1 } },
  { "from": "quest:TP_Pete1",          "to": "item:ExpBalloon1", "rel": "rewards",     "meta": { "amount": 2 } },
  { "from": "quest:TP_Pete1",          "to": "item:TestObj3",    "rel": "requires",    "meta": { "amount": 40 } },
  { "from": "npc:TP_Pete",             "to": "quest:TP_Pete1",   "rel": "gives",       "meta": { "order": 1 } }
]
```

Relations in v1 (the "core four" sources): `drops`, `craftedFrom`, `rewards`,
`requires`, `gives`.

Reverse directions (dropped by, used in, rewarded from) are NOT stored. The UI derives
them by indexing edges by both `from` and `to` at load time. One direction on disk means
no sync bugs between mirrored edges.

Scope control: adding a future source (e.g. shops) means a new `rel` value plus one
extractor file. The nodes/edges schema shape never changes.

## Build pipeline

Location: `IdleonToolbox/scripts/entity-graph/`. Runs as `npm run build:graph`, chained
into the site build.

```
scripts/entity-graph/
  build.js               orchestrator: nodes -> extractors -> resolve -> validate -> emit
  aliases.js             explicit rawName alias map (e.g. pseudo-entries)
  ignore.js              explicit ignore list (e.g. COIN)
  nodes/
    items.js             items.json -> item nodes (~2431)
    monsters.js          monsters.json -> monster nodes (filter non-combat entries)
    npcs-quests.js       quests.json -> npc nodes + quest nodes
  edges/
    drops.js             monsterDrops.json -> drops edges
    crafts.js            crafts.json -> craftedFrom edges
    quest-items.js       quests.json -> rewards + requires edges
    quest-npc.js         quests.json -> gives edges
```

Flow:

1. **Node pass** builds the full node map first.
2. **Edge pass**: each extractor is a pure function `(websiteData) => rawEdges[]`,
   roughly 30-60 lines. It emits rawName references as found; no lookups inside
   extractors.
3. **Resolve pass**: every edge endpoint is checked against the node map. Exact rawName
   match only (after aliases.js). No fuzzy matching, ever: fuzzy joins are how
   ID-mismatch bugs hide.
4. **Validate + report**: unresolved edges are written to
   `scripts/entity-graph/unresolved-report.json` with source extractor and raw value.
   Build warns and continues, printing the count diff against the committed report. New
   unresolved entries after a data regen are the early-warning signal that a game patch
   changed something.
5. **Emit**: `data/entity-graph.json` (nodes + edges) and `data/graph-stats.json`
   (counts per kind and per rel). Both are committed so every game-data update shows
   graph changes in the diff; a regen that silently nukes half the edges is visible.

Dirty-data policy: known pseudo-entries (`COIN`, dungeon currencies, etc.) are handled
via the explicit `aliases.js` / `ignore.js` lists in the same folder. Explicit lists,
never heuristics.

## Frontend: /wiki page

One route, `pages/wiki.jsx`, following existing pages-router patterns.

- **Loading**: `entity-graph.json` imported dynamically on page load (not in the main
  bundle). Estimated ~2,900 nodes + 5-8K edges, roughly 60-100KB gzipped. Indexed once
  in a plain module into `byId`, `edgesFrom`, `edgesTo` maps (no useMemo; React
  Compiler conventions apply).
- **Search**: client-side substring/prefix scoring over display names (underscores
  normalized to spaces). No search library at this size. Results grouped by kind, with
  icons.
- **Entity panel**: selecting a result shows the entity card plus relation sections
  derived from the indexed edges:
  - Item: Dropped by (with chance), Used in crafting, Crafted from, Quest reward from,
    Required by quest
  - Monster: Drops (table with chances)
  - NPC: Quests given
  - Quest: Given by, Rewards, Requires
  - Every entity mentioned in a section links to that entity's panel (wiki-style
    navigation inside one page).
- **URL state**: `/wiki?e=item:Copper` via shallow routing; shareable, back/forward
  works. Add `e` to the GSC nav-param allowlist.
- **Icons**: existing `public/data` images keyed by rawName, same convention as the rest
  of the site.

## Error handling

- Build: unresolved references never crash the build and never silently disappear; they
  land in the committed report and the console diff.
- Frontend: an `e` param that doesn't resolve to a node shows the empty search state,
  not an error.

## Testing

- Build script: vitest with fixture snippets (one monster with drops, one recipe, one
  quest chain) asserting emitted nodes/edges and unresolved-report behavior.
- Regression guard: committed `graph-stats.json` diff on every data regen.
- UI: manual verification, matching current site convention.

## Future extensions (explicitly out of v1)

Shops/vendors (`soldBy`), stamps/vials/cards usage sinks, per-entity static routes for
SEO, recipe-chain (multi-hop) view, graph visualization. Each is additive: new extractor
file and/or new UI section; schema unchanged.
