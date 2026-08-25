# Entity Graph + Wiki Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a normalized entity graph (items, monsters, NPCs, quests) from website-data and a `/wiki` search page where every entity shows its connections as clickable links.

**Architecture:** A prebuild node script joins `data/website-data/*.json` into one committed `data/entity-graph.json` (nodes keyed by `kind:rawName`, flat typed edge list). Unresolved references land in a committed report, never silently dropped. A single Next.js page loads the graph client-side, indexes it in memory, and renders search + entity panels.

**Tech Stack:** Node (.mjs scripts, matching `utility/`), vitest 3 (tests in `__test__/`), Next.js pages router + MUI (existing site stack).

**Spec:** `docs/superpowers/specs/2026-08-24-entity-graph-design.md`

## Global Constraints

- Graph builder reads ONLY `data/website-data/*.json`. Never N.js. Missing relations = extend z-processing first.
- Canonical ID: `kind:rawName`. Kinds: `item`, `monster`, `npc`, `quest`. Relations: `drops`, `craftedFrom`, `rewards`, `requires`, `gives`. No other values in v1.
- Exact rawName matching only (after explicit `aliases.mjs`). No fuzzy matching anywhere.
- No `useMemo`/`useCallback`/IIFEs in React code (React Compiler handles memoization).
- No em dashes in any UI copy: use colons.
- Do NOT commit: the user commits manually. No commit steps in this plan.
- Generated outputs (`data/entity-graph.json`, `data/graph-stats.json`, `scripts/entity-graph/unresolved-report.json`) are build artifacts the user will commit alongside code.

## Verified data shapes (read before writing extractors)

- `items.json`: `{ [rawName]: { displayName, Type, typeGen, ID, ... } }` (2,431 keys, e.g. `Copper`)
- `monsters.json`: `{ [rawName]: { Name, AFKtype, Type, ... } }` (405 keys; `Type` is one of `Monster` (329), `Ore` (23), `Tree` (19), `Fish` (19), `Bug` (15): keep ALL as monster nodes, skilling nodes are valid drop sources)
- `monsterDrops.json`: `{ [monsterRawName]: Array<{ rawName, quantity, chance, questLink, ... }> }` (364 keys; entries are heterogeneous, some carry full item fields, but `rawName`/`quantity`/`chance`/`questLink` are always present)
- `crafts.json`: `{ [displayItemName]: { rawName, itemName, itemQuantity, materials: [{ rawName, itemName, itemQuantity }] } }` (420 keys; keyed by DISPLAY name, join on the `rawName` field, never the key)
- `quests.json`: `{ [npcRawName]: { [questIndex: numeric string]: quest, sprite, spriteAcross, spriteDown, spriteNumFrames } }` (94 NPCs). Quest entries are the numeric keys whose value has `QuestName`. Quest fields: `QuestName` (unique raw id), `Name` (display), `Type` (`Custom` | `ItemsAndSpaceRequired` | `None`), `itemReq: [{ rawName, name, amount }]` (only on `ItemsAndSpaceRequired`), `rewards: [{ rawName, name, amount }]`, `NextIndex`, `Difficulty`.
- Icons: items `public/data/{rawName}.png`, monsters `public/afk_targets/{Name}.png` (display Name). NPCs and quests have NO images: render text avatars.

---

### Task 1: Node extractors + shared test fixture

**Files:**
- Create: `scripts/entity-graph/nodes/items.mjs`
- Create: `scripts/entity-graph/nodes/monsters.mjs`
- Create: `scripts/entity-graph/nodes/npcs-quests.mjs`
- Create: `__test__/entity-graph/fixture.mjs`
- Test: `__test__/entity-graph/nodes.test.js`

**Interfaces:**
- Produces: `itemNodes(items) -> { [id]: node }`, `monsterNodes(monsters) -> { [id]: node }`, `npcQuestNodes(quests) -> { [id]: node }`. Node shape: `{ kind, rawName, name, icon? , category? }`. `icon` is a site-relative path or `null`.
- Produces fixture: `fixture.mjs` exporting `{ items, monsters, monsterDrops, crafts, quests }` minimal snippets used by all graph tests.

- [ ] **Step 1: Write the fixture**

```js
// __test__/entity-graph/fixture.mjs
export const items = {
  Copper: { displayName: 'Copper_Ore', Type: 'ORE', typeGen: 'bOre', ID: 5 },
  CraftMat1: { displayName: 'Thread', Type: 'MATERIAL', typeGen: 'bCraft', ID: 1 },
  EquipmentShirts1: { displayName: 'Orange_Tee', Type: 'SHIRT', typeGen: 'aShirt', ID: 2 },
  Quest14: { displayName: 'Employment_Statistics', Type: 'QUEST_ITEM', typeGen: 'qItem', ID: 3 },
  StoneT2: { displayName: 'Tool_Upgrade_Stone_II', Type: 'UPGRADE', typeGen: 'dStone', ID: 4 },
  Grasslands1: { displayName: 'Spore_Cap', Type: 'MATERIAL', typeGen: 'bCraft', ID: 6 },
};

export const monsters = {
  mushG: { Name: 'Green_Mushroom', AFKtype: 'FIGHTING', Type: 'Monster' },
  Copper: { Name: 'Copper_Ore_Node', AFKtype: 'MINING', Type: 'Ore' },
};

export const monsterDrops = {
  mushG: [
    { rawName: 'Grasslands1', quantity: 1, chance: 0.35, questLink: 'N/A' },
    { rawName: 'COIN', quantity: 3, chance: 1, questLink: 'N/A' },
  ],
};

export const crafts = {
  Orange_Tee: {
    rawName: 'EquipmentShirts1', itemName: 'Orange_Tee', itemQuantity: 1,
    materials: [{ rawName: 'CraftMat1', itemName: 'Thread', itemQuantity: 1 }],
  },
};

export const quests = {
  TP_Pete: {
    1: {
      Type: 'Custom', QuestName: 'TP_Pete1', Name: 'Retribution_Time', NextIndex: 4,
      rewards: [{ rawName: 'StoneT2', name: 'Tool_Upgrade_Stone_II', amount: 2 }],
    },
    2: {
      Type: 'ItemsAndSpaceRequired', QuestName: 'TP_Pete2', Name: 'The_Rats_are_to_Blame', NextIndex: 7,
      itemReq: [{ rawName: 'Quest14', name: 'Employment_Statistics', amount: 50 }],
      rewards: [{ rawName: 'ExpBalloon99', name: 'Missing_Balloon', amount: 2 }],
    },
    sprite: 'x', spriteAcross: 1, spriteDown: 1, spriteNumFrames: 1,
  },
};
```

Note `ExpBalloon99` is deliberately NOT in `items`: later tasks assert it becomes an unresolved report entry.

- [ ] **Step 2: Write failing node tests**

```js
// __test__/entity-graph/nodes.test.js
import { describe, it, expect } from 'vitest';
import { itemNodes } from '../../scripts/entity-graph/nodes/items.mjs';
import { monsterNodes } from '../../scripts/entity-graph/nodes/monsters.mjs';
import { npcQuestNodes } from '../../scripts/entity-graph/nodes/npcs-quests.mjs';
import { items, monsters, quests } from './fixture.mjs';

describe('node extractors', () => {
  it('builds item nodes keyed by item:rawName', () => {
    const nodes = itemNodes(items);
    expect(nodes['item:Copper']).toEqual({
      kind: 'item', rawName: 'Copper', name: 'Copper_Ore',
      icon: '/data/Copper.png', category: 'ORE',
    });
    expect(Object.keys(nodes)).toHaveLength(6);
  });

  it('builds monster nodes for all Types including skilling nodes', () => {
    const nodes = monsterNodes(monsters);
    expect(nodes['monster:mushG']).toEqual({
      kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom',
      icon: '/afk_targets/Green_Mushroom.png', category: 'Monster',
    });
    expect(nodes['monster:Copper'].category).toBe('Ore');
  });

  it('builds npc and quest nodes, skipping sprite metadata keys', () => {
    const nodes = npcQuestNodes(quests);
    expect(nodes['npc:TP_Pete']).toEqual({
      kind: 'npc', rawName: 'TP_Pete', name: 'TP_Pete', icon: null,
    });
    expect(nodes['quest:TP_Pete2']).toEqual({
      kind: 'quest', rawName: 'TP_Pete2', name: 'The_Rats_are_to_Blame', icon: null,
    });
    expect(Object.keys(nodes)).toHaveLength(3); // 1 npc + 2 quests, no "sprite" node
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run __test__/entity-graph/nodes.test.js`
Expected: FAIL, cannot resolve `scripts/entity-graph/nodes/items.mjs`.

- [ ] **Step 4: Implement the three node extractors**

```js
// scripts/entity-graph/nodes/items.mjs
export const itemNodes = (items) => {
  const nodes = {};
  for (const [rawName, item] of Object.entries(items)) {
    nodes[`item:${rawName}`] = {
      kind: 'item',
      rawName,
      name: item.displayName,
      icon: `/data/${rawName}.png`,
      category: item.Type,
    };
  }
  return nodes;
};
```

```js
// scripts/entity-graph/nodes/monsters.mjs
export const monsterNodes = (monsters) => {
  const nodes = {};
  for (const [rawName, monster] of Object.entries(monsters)) {
    nodes[`monster:${rawName}`] = {
      kind: 'monster',
      rawName,
      name: monster.Name,
      icon: `/afk_targets/${monster.Name}.png`,
      category: monster.Type,
    };
  }
  return nodes;
};
```

```js
// scripts/entity-graph/nodes/npcs-quests.mjs
const isQuestEntry = (value) => value && typeof value === 'object' && value.QuestName;

export const npcQuestNodes = (quests) => {
  const nodes = {};
  for (const [npcRawName, npcData] of Object.entries(quests)) {
    nodes[`npc:${npcRawName}`] = { kind: 'npc', rawName: npcRawName, name: npcRawName, icon: null };
    for (const quest of Object.values(npcData)) {
      if (!isQuestEntry(quest)) continue;
      nodes[`quest:${quest.QuestName}`] = {
        kind: 'quest', rawName: quest.QuestName, name: quest.Name, icon: null,
      };
    }
  }
  return nodes;
};
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run __test__/entity-graph/nodes.test.js`
Expected: 3 passed.

---

### Task 2: Edge extractors: drops + crafts

**Files:**
- Create: `scripts/entity-graph/edges/drops.mjs`
- Create: `scripts/entity-graph/edges/crafts.mjs`
- Test: `__test__/entity-graph/edges.test.js`

**Interfaces:**
- Consumes: fixture from Task 1.
- Produces: `dropEdges(monsterDrops) -> rawEdge[]`, `craftEdges(crafts) -> rawEdge[]`. Raw edge shape: `{ from, to, rel, meta, source }` where `source` is the extractor name (used by the unresolved report). Endpoints are canonical IDs built with template literals; resolution happens later (Task 4), extractors do no lookups.

- [ ] **Step 1: Write failing tests**

```js
// __test__/entity-graph/edges.test.js
import { describe, it, expect } from 'vitest';
import { dropEdges } from '../../scripts/entity-graph/edges/drops.mjs';
import { craftEdges } from '../../scripts/entity-graph/edges/crafts.mjs';
import { monsterDrops, crafts } from './fixture.mjs';

describe('drop edges', () => {
  it('emits monster -> item drops with chance and quantity', () => {
    const edges = dropEdges(monsterDrops);
    expect(edges).toContainEqual({
      from: 'monster:mushG', to: 'item:Grasslands1', rel: 'drops',
      meta: { chance: 0.35, quantity: 1 }, source: 'drops',
    });
    // COIN passes through as an edge; the resolver decides its fate via ignore list
    expect(edges).toHaveLength(2);
  });
});

describe('craft edges', () => {
  it('emits product -> material craftedFrom edges using rawName not the display key', () => {
    const edges = craftEdges(crafts);
    expect(edges).toEqual([{
      from: 'item:EquipmentShirts1', to: 'item:CraftMat1', rel: 'craftedFrom',
      meta: { quantity: 1 }, source: 'crafts',
    }]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __test__/entity-graph/edges.test.js`
Expected: FAIL, modules missing.

- [ ] **Step 3: Implement**

```js
// scripts/entity-graph/edges/drops.mjs
export const dropEdges = (monsterDrops) => {
  const edges = [];
  for (const [monsterRawName, drops] of Object.entries(monsterDrops)) {
    for (const drop of drops) {
      if (!drop?.rawName) continue;
      edges.push({
        from: `monster:${monsterRawName}`,
        to: `item:${drop.rawName}`,
        rel: 'drops',
        meta: { chance: drop.chance, quantity: drop.quantity },
        source: 'drops',
      });
    }
  }
  return edges;
};
```

```js
// scripts/entity-graph/edges/crafts.mjs
export const craftEdges = (crafts) => {
  const edges = [];
  for (const recipe of Object.values(crafts)) {
    for (const material of recipe?.materials || []) {
      if (!recipe?.rawName || !material?.rawName) continue;
      edges.push({
        from: `item:${recipe.rawName}`,
        to: `item:${material.rawName}`,
        rel: 'craftedFrom',
        meta: { quantity: material.itemQuantity },
        source: 'crafts',
      });
    }
  }
  return edges;
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run __test__/entity-graph/edges.test.js`
Expected: 2 passed.

---

### Task 3: Edge extractors: quest items + quest-npc

**Files:**
- Modify: `scripts/entity-graph/edges/` (add two files)
- Create: `scripts/entity-graph/edges/quest-items.mjs`
- Create: `scripts/entity-graph/edges/quest-npc.mjs`
- Test: `__test__/entity-graph/edges.test.js` (append)

**Interfaces:**
- Consumes: fixture `quests`; `isQuestEntry` logic duplicated locally (3 lines, not worth a shared module).
- Produces: `questItemEdges(quests) -> rawEdge[]` (rels `rewards` + `requires`), `questNpcEdges(quests) -> rawEdge[]` (rel `gives`, meta.order = numeric quest index).

- [ ] **Step 1: Append failing tests**

```js
// append to __test__/entity-graph/edges.test.js
import { questItemEdges } from '../../scripts/entity-graph/edges/quest-items.mjs';
import { questNpcEdges } from '../../scripts/entity-graph/edges/quest-npc.mjs';
import { quests } from './fixture.mjs';

describe('quest item edges', () => {
  it('emits rewards and requires edges', () => {
    const edges = questItemEdges(quests);
    expect(edges).toContainEqual({
      from: 'quest:TP_Pete1', to: 'item:StoneT2', rel: 'rewards',
      meta: { amount: 2 }, source: 'quest-items',
    });
    expect(edges).toContainEqual({
      from: 'quest:TP_Pete2', to: 'item:Quest14', rel: 'requires',
      meta: { amount: 50 }, source: 'quest-items',
    });
    expect(edges).toHaveLength(3); // 2 rewards + 1 requires
  });
});

describe('quest npc edges', () => {
  it('emits npc -> quest gives edges with order', () => {
    const edges = questNpcEdges(quests);
    expect(edges).toEqual([
      { from: 'npc:TP_Pete', to: 'quest:TP_Pete1', rel: 'gives', meta: { order: 1 }, source: 'quest-npc' },
      { from: 'npc:TP_Pete', to: 'quest:TP_Pete2', rel: 'gives', meta: { order: 2 }, source: 'quest-npc' },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __test__/entity-graph/edges.test.js`
Expected: new tests FAIL, modules missing.

- [ ] **Step 3: Implement**

```js
// scripts/entity-graph/edges/quest-items.mjs
const isQuestEntry = (value) => value && typeof value === 'object' && value.QuestName;

export const questItemEdges = (quests) => {
  const edges = [];
  for (const npcData of Object.values(quests)) {
    for (const quest of Object.values(npcData)) {
      if (!isQuestEntry(quest)) continue;
      for (const reward of quest.rewards || []) {
        if (!reward?.rawName) continue;
        edges.push({
          from: `quest:${quest.QuestName}`, to: `item:${reward.rawName}`,
          rel: 'rewards', meta: { amount: reward.amount }, source: 'quest-items',
        });
      }
      for (const req of quest.itemReq || []) {
        if (!req?.rawName) continue;
        edges.push({
          from: `quest:${quest.QuestName}`, to: `item:${req.rawName}`,
          rel: 'requires', meta: { amount: req.amount }, source: 'quest-items',
        });
      }
    }
  }
  return edges;
};
```

```js
// scripts/entity-graph/edges/quest-npc.mjs
const isQuestEntry = (value) => value && typeof value === 'object' && value.QuestName;

export const questNpcEdges = (quests) => {
  const edges = [];
  for (const [npcRawName, npcData] of Object.entries(quests)) {
    for (const [index, quest] of Object.entries(npcData)) {
      if (!isQuestEntry(quest)) continue;
      edges.push({
        from: `npc:${npcRawName}`, to: `quest:${quest.QuestName}`,
        rel: 'gives', meta: { order: Number(index) }, source: 'quest-npc',
      });
    }
  }
  return edges;
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run __test__/entity-graph/edges.test.js`
Expected: all passed.

---

### Task 4: Resolver, aliases/ignore, orchestrator, emit

**Files:**
- Create: `scripts/entity-graph/aliases.mjs`
- Create: `scripts/entity-graph/ignore.mjs`
- Create: `scripts/entity-graph/resolve.mjs`
- Create: `scripts/entity-graph/build.mjs`
- Modify: `package.json` (add `build:graph` script, chain into `prebuild`)
- Test: `__test__/entity-graph/resolve.test.js`

**Interfaces:**
- Consumes: node extractors (Task 1), edge extractors (Tasks 2-3).
- Produces: `resolveEdges(nodes, rawEdges, { aliases, ignore }) -> { edges, unresolved }`. Resolved edge drops the `source` field (`{ from, to, rel, meta }`); unresolved entry is `{ id, source, from, to, rel }`. `build.mjs` writes `data/entity-graph.json` (`{ nodes, edges }`), `data/graph-stats.json`, `scripts/entity-graph/unresolved-report.json`.
- `aliases.mjs` exports `{ [wrongId]: correctId }`; `ignore.mjs` exports a `Set` of IDs (e.g. `item:COIN`).

- [ ] **Step 1: Write failing resolver tests**

```js
// __test__/entity-graph/resolve.test.js
import { describe, it, expect } from 'vitest';
import { resolveEdges } from '../../scripts/entity-graph/resolve.mjs';

const nodes = {
  'monster:mushG': { kind: 'monster' },
  'item:Grasslands1': { kind: 'item' },
  'item:Copper': { kind: 'item' },
};

describe('resolveEdges', () => {
  it('keeps edges whose endpoints exist, strips source', () => {
    const raw = [{ from: 'monster:mushG', to: 'item:Grasslands1', rel: 'drops', meta: { chance: 1 }, source: 'drops' }];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore: new Set() });
    expect(edges).toEqual([{ from: 'monster:mushG', to: 'item:Grasslands1', rel: 'drops', meta: { chance: 1 } }]);
    expect(unresolved).toEqual([]);
  });

  it('applies aliases before matching', () => {
    const raw = [{ from: 'monster:mushG', to: 'item:CopperOre', rel: 'drops', meta: {}, source: 'drops' }];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: { 'item:CopperOre': 'item:Copper' }, ignore: new Set() });
    expect(edges[0].to).toBe('item:Copper');
    expect(unresolved).toEqual([]);
  });

  it('silently drops ignored ids, reports unknown ids', () => {
    const raw = [
      { from: 'monster:mushG', to: 'item:COIN', rel: 'drops', meta: {}, source: 'drops' },
      { from: 'monster:mushG', to: 'item:Nope', rel: 'drops', meta: {}, source: 'drops' },
    ];
    const { edges, unresolved } = resolveEdges(nodes, raw, { aliases: {}, ignore: new Set(['item:COIN']) });
    expect(edges).toEqual([]);
    expect(unresolved).toEqual([{ id: 'item:Nope', source: 'drops', from: 'monster:mushG', to: 'item:Nope', rel: 'drops' }]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __test__/entity-graph/resolve.test.js`
Expected: FAIL, module missing.

- [ ] **Step 3: Implement resolver + starter lists**

```js
// scripts/entity-graph/aliases.mjs
// Explicit rawName alias corrections. Map of wrongId -> correctId.
// Populated during Task 5 triage. Never add fuzzy logic here.
export const aliases = {};
```

```js
// scripts/entity-graph/ignore.mjs
// IDs that are deliberately not entities (currencies, pseudo-drops).
// Populated during Task 5 triage.
export const ignore = new Set([
  'item:COIN',
]);
```

```js
// scripts/entity-graph/resolve.mjs
export const resolveEdges = (nodes, rawEdges, { aliases, ignore }) => {
  const edges = [];
  const unresolved = [];
  for (const rawEdge of rawEdges) {
    const from = aliases[rawEdge.from] || rawEdge.from;
    const to = aliases[rawEdge.to] || rawEdge.to;
    if (ignore.has(from) || ignore.has(to)) continue;
    const missing = !nodes[from] ? from : (!nodes[to] ? to : null);
    if (missing) {
      unresolved.push({ id: missing, source: rawEdge.source, from, to, rel: rawEdge.rel });
      continue;
    }
    edges.push({ from, to, rel: rawEdge.rel, meta: rawEdge.meta });
  }
  return { edges, unresolved };
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run __test__/entity-graph/resolve.test.js`
Expected: 3 passed.

- [ ] **Step 5: Write the orchestrator**

No test (it's I/O glue over tested parts); verified by running it in Task 5.

```js
// scripts/entity-graph/build.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { itemNodes } from './nodes/items.mjs';
import { monsterNodes } from './nodes/monsters.mjs';
import { npcQuestNodes } from './nodes/npcs-quests.mjs';
import { dropEdges } from './edges/drops.mjs';
import { craftEdges } from './edges/crafts.mjs';
import { questItemEdges } from './edges/quest-items.mjs';
import { questNpcEdges } from './edges/quest-npc.mjs';
import { resolveEdges } from './resolve.mjs';
import { aliases } from './aliases.mjs';
import { ignore } from './ignore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
const readJson = (name) => JSON.parse(fs.readFileSync(path.join(dataDir, 'website-data', name), 'utf-8'));

const items = readJson('items.json');
const monsters = readJson('monsters.json');
const monsterDrops = readJson('monsterDrops.json');
const crafts = readJson('crafts.json');
const quests = readJson('quests.json');

const nodes = {
  ...itemNodes(items),
  ...monsterNodes(monsters),
  ...npcQuestNodes(quests),
};

const rawEdges = [
  ...dropEdges(monsterDrops),
  ...craftEdges(crafts),
  ...questItemEdges(quests),
  ...questNpcEdges(quests),
];

const { edges, unresolved } = resolveEdges(nodes, rawEdges, { aliases, ignore });

const stats = {
  nodes: Object.values(nodes).reduce((acc, n) => ({ ...acc, [n.kind]: (acc[n.kind] || 0) + 1 }), {}),
  edges: edges.reduce((acc, e) => ({ ...acc, [e.rel]: (acc[e.rel] || 0) + 1 }), {}),
  unresolved: unresolved.length,
};

const reportPath = path.join(__dirname, 'unresolved-report.json');
let previousCount = 0;
if (fs.existsSync(reportPath)) previousCount = JSON.parse(fs.readFileSync(reportPath, 'utf-8')).length;

fs.writeFileSync(path.join(dataDir, 'entity-graph.json'), JSON.stringify({ nodes, edges }));
fs.writeFileSync(path.join(dataDir, 'graph-stats.json'), JSON.stringify(stats, null, 2));
fs.writeFileSync(reportPath, JSON.stringify(unresolved, null, 2));

console.log('[entity-graph] nodes:', JSON.stringify(stats.nodes));
console.log('[entity-graph] edges:', JSON.stringify(stats.edges));
console.log(`[entity-graph] unresolved: ${unresolved.length} (was ${previousCount})`);
if (unresolved.length !== previousCount) {
  console.warn('[entity-graph] WARNING: unresolved count changed. Inspect scripts/entity-graph/unresolved-report.json and triage into aliases.mjs / ignore.mjs.');
}
```

- [ ] **Step 6: Wire npm scripts**

In `package.json`, add `"build:graph": "node scripts/entity-graph/build.mjs"` and change `"prebuild"` to `"node utility/build-worker.mjs && node scripts/entity-graph/build.mjs"`.

- [ ] **Step 7: Run full graph test suite**

Run: `npx vitest run __test__/entity-graph/`
Expected: all passed.

---

### Task 5: Real-data run + triage

**Files:**
- Modify: `scripts/entity-graph/aliases.mjs`, `scripts/entity-graph/ignore.mjs`
- Generated: `data/entity-graph.json`, `data/graph-stats.json`, `scripts/entity-graph/unresolved-report.json`

**Interfaces:**
- Consumes: everything from Tasks 1-4.
- Produces: committed-quality generated files; triaged alias/ignore lists.

- [ ] **Step 1: Run the build against real data**

Run: `npm run build:graph`
Expected: stats printed. Roughly: ~2,900+ nodes (2,431 items + 405 monsters + 94 npcs + ~340 quests), thousands of edges, some unresolved count.

- [ ] **Step 2: Triage every unresolved entry**

Open `scripts/entity-graph/unresolved-report.json`. For each distinct `id`, decide:
- Currency/pseudo-entry (COIN variants, dungeon credits/flurbos if not real items) -> add to `ignore.mjs` with a short comment.
- rawName drift (item renamed between sections) -> add to `aliases.mjs` mapping wrong -> correct, verify the correct ID exists in `items.json`.
- Genuinely missing from website-data -> leave in the report and note it as a z-processing follow-up (do NOT hack the graph builder).

Re-run `npm run build:graph` after each batch until remaining entries are only the documented z-processing follow-ups.

- [ ] **Step 3: Sanity-check the output**

Run: `node -e "const g=require('./data/entity-graph.json'); const e=g.edges.filter(x=>x.to==='item:Grasslands1'&&x.rel==='drops'); console.log(e); console.log('total edges:', g.edges.length)"`
Expected: at least one monster dropping Spore_Caps; plausible totals.

- [ ] **Step 4: Check output size**

Run: `node -e "console.log(require('fs').statSync('data/entity-graph.json').size)"`
Expected: under ~2MB raw. If wildly larger, investigate before continuing.

---

### Task 6: Client graph index + search

**Files:**
- Create: `lib/wiki/graph.js`
- Create: `lib/wiki/search.js`
- Test: `__test__/entity-graph/client.test.js`

**Interfaces:**
- Consumes: `data/entity-graph.json` shape `{ nodes, edges }`.
- Produces: `indexGraph(graph) -> { byId, edgesFrom, edgesTo, searchList }` where `edgesFrom`/`edgesTo` are `Map<id, edge[]>` and `searchList` is `[{ id, kind, label }]` with labels underscore-normalized. `searchEntities(searchList, query, limit = 30) -> searchList entries` (prefix matches ranked above substring matches, case-insensitive).

- [ ] **Step 1: Write failing tests**

```js
// __test__/entity-graph/client.test.js
import { describe, it, expect } from 'vitest';
import { indexGraph } from '../../lib/wiki/graph';
import { searchEntities } from '../../lib/wiki/search';

const graph = {
  nodes: {
    'item:Copper': { kind: 'item', rawName: 'Copper', name: 'Copper_Ore' },
    'item:CopperBar': { kind: 'item', rawName: 'CopperBar', name: 'Copper_Bar' },
    'monster:mushG': { kind: 'monster', rawName: 'mushG', name: 'Green_Mushroom' },
  },
  edges: [
    { from: 'monster:mushG', to: 'item:Copper', rel: 'drops', meta: { chance: 1 } },
  ],
};

describe('indexGraph', () => {
  it('indexes edges both directions', () => {
    const { edgesFrom, edgesTo, byId } = indexGraph(graph);
    expect(edgesFrom.get('monster:mushG')).toHaveLength(1);
    expect(edgesTo.get('item:Copper')[0].from).toBe('monster:mushG');
    expect(byId['item:Copper'].name).toBe('Copper_Ore');
  });

  it('builds a search list with space-normalized labels', () => {
    const { searchList } = indexGraph(graph);
    expect(searchList).toContainEqual({ id: 'item:Copper', kind: 'item', label: 'Copper Ore' });
  });
});

describe('searchEntities', () => {
  it('ranks prefix matches above substring matches, case-insensitive', () => {
    const { searchList } = indexGraph(graph);
    const results = searchEntities(searchList, 'copper');
    expect(results[0].id).toBe('item:Copper');
    expect(results.map(r => r.id)).toContain('item:CopperBar');
  });

  it('returns empty for empty query', () => {
    const { searchList } = indexGraph(graph);
    expect(searchEntities(searchList, '  ')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run __test__/entity-graph/client.test.js`
Expected: FAIL, modules missing.

- [ ] **Step 3: Implement**

```js
// lib/wiki/graph.js
export const indexGraph = (graph) => {
  const byId = graph.nodes;
  const edgesFrom = new Map();
  const edgesTo = new Map();
  for (const edge of graph.edges) {
    if (!edgesFrom.has(edge.from)) edgesFrom.set(edge.from, []);
    edgesFrom.get(edge.from).push(edge);
    if (!edgesTo.has(edge.to)) edgesTo.set(edge.to, []);
    edgesTo.get(edge.to).push(edge);
  }
  const searchList = Object.entries(byId).map(([id, node]) => ({
    id,
    kind: node.kind,
    label: (node.name || node.rawName).replace(/_/g, ' '),
  }));
  return { byId, edgesFrom, edgesTo, searchList };
};
```

```js
// lib/wiki/search.js
export const searchEntities = (searchList, query, limit = 30) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix = [];
  const substring = [];
  for (const entry of searchList) {
    const label = entry.label.toLowerCase();
    if (label.startsWith(q)) prefix.push(entry);
    else if (label.includes(q)) substring.push(entry);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...substring].slice(0, limit);
};
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run __test__/entity-graph/client.test.js`
Expected: all passed.

---

### Task 7: /wiki page

**Files:**
- Create: `pages/wiki.jsx`
- Create: `components/wiki/EntityPanel.jsx`
- Modify: GSC nav-param allowlist (find with `grep -rn "allowlist\|allowedParams" utility/ components/ pages/_app.jsx`: add `e` for `/wiki`)
- Modify: site navigation (add Wiki link where other top-level pages are registered; follow the existing pattern found in the nav component)

**Interfaces:**
- Consumes: `indexGraph`, `searchEntities` (Task 6), `data/entity-graph.json` via dynamic import.
- Produces: `/wiki?e=<id>` route.

- [ ] **Step 1: Build the page**

Follow existing page conventions (check `pages/tools/` pages for NextSeo usage, container layout, MUI imports). Core structure:

```jsx
// pages/wiki.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Autocomplete, Box, Container, TextField, Typography } from '@mui/material';
import { indexGraph } from '../lib/wiki/graph';
import { searchEntities } from '../lib/wiki/search';
import EntityPanel from '../components/wiki/EntityPanel';

const Wiki = () => {
  const router = useRouter();
  const [index, setIndex] = useState(null);
  const [options, setOptions] = useState([]);
  const selectedId = typeof router.query.e === 'string' ? router.query.e : null;

  useEffect(() => {
    let alive = true;
    import('../data/entity-graph.json').then((mod) => {
      if (alive) setIndex(indexGraph(mod.default || mod));
    });
    return () => { alive = false; };
  }, []);

  const handleSearch = (event, value) => {
    setOptions(index ? searchEntities(index.searchList, value || '') : []);
  };

  const handleSelect = (event, option) => {
    if (!option) return;
    router.push({ pathname: '/wiki', query: { e: option.id } }, undefined, { shallow: true });
  };

  const selectEntity = (id) => {
    router.push({ pathname: '/wiki', query: { e: id } }, undefined, { shallow: true });
  };

  const selectedNode = index && selectedId ? index.byId[selectedId] : null;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" sx={{ my: 2 }}>Wiki</Typography>
      <Autocomplete
        options={options}
        filterOptions={(x) => x}
        getOptionLabel={(option) => option.label}
        groupBy={(option) => option.kind}
        onInputChange={handleSearch}
        onChange={handleSelect}
        loading={!index}
        renderInput={(params) => <TextField {...params} label="Search items, monsters, NPCs, quests" />}
      />
      <Box sx={{ mt: 3 }}>
        {selectedNode
          ? <EntityPanel index={index} id={selectedId} onNavigate={selectEntity} />
          : <Typography color="text.secondary">Search for an entity to see where it comes from and what it is used for.</Typography>}
      </Box>
    </Container>
  );
};

export default Wiki;
```

- [ ] **Step 2: Build the entity panel**

```jsx
// components/wiki/EntityPanel.jsx
import { Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';

const REL_SECTIONS = {
  item: [
    { title: 'Dropped by', dir: 'to', rel: 'drops', show: (m) => m.chance != null ? `${(m.chance * 100).toPrecision(3)}%` : '' },
    { title: 'Crafted from', dir: 'from', rel: 'craftedFrom', show: (m) => `x${m.quantity}` },
    { title: 'Used in crafting', dir: 'to', rel: 'craftedFrom', show: (m) => `x${m.quantity}` },
    { title: 'Reward from quest', dir: 'to', rel: 'rewards', show: (m) => `x${m.amount}` },
    { title: 'Required by quest', dir: 'to', rel: 'requires', show: (m) => `x${m.amount}` },
  ],
  monster: [
    { title: 'Drops', dir: 'from', rel: 'drops', show: (m) => m.chance != null ? `${(m.chance * 100).toPrecision(3)}%` : '' },
  ],
  npc: [
    { title: 'Quests', dir: 'from', rel: 'gives', show: () => '' },
  ],
  quest: [
    { title: 'Given by', dir: 'to', rel: 'gives', show: () => '' },
    { title: 'Rewards', dir: 'from', rel: 'rewards', show: (m) => `x${m.amount}` },
    { title: 'Requires', dir: 'from', rel: 'requires', show: (m) => `x${m.amount}` },
  ],
};

const EntityPanel = ({ index, id, onNavigate }) => {
  const node = index.byId[id];
  if (!node) return <Typography color="text.secondary">Unknown entity.</Typography>;
  const sections = REL_SECTIONS[node.kind] || [];

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          {node.icon ? <img src={node.icon} alt="" width={32} height={32} style={{ objectFit: 'contain' }} /> : null}
          <Typography variant="h5">{node.name?.replace(/_/g, ' ')}</Typography>
          <Chip size="small" label={node.kind} />
        </Stack>
        {sections.map(({ title, dir, rel, show }) => {
          const edges = ((dir === 'from' ? index.edgesFrom.get(id) : index.edgesTo.get(id)) || [])
            .filter((edge) => edge.rel === rel);
          if (edges.length === 0) return null;
          return (
            <Stack key={title} sx={{ mt: 2 }} spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
              {edges.map((edge, i) => {
                const otherId = dir === 'from' ? edge.to : edge.from;
                const other = index.byId[otherId];
                if (!other) return null;
                return (
                  <Stack key={`${otherId}-${i}`} direction="row" spacing={1} alignItems="center">
                    {other.icon ? <img src={other.icon} alt="" width={20} height={20} style={{ objectFit: 'contain' }} /> : null}
                    <Link component="button" onClick={() => onNavigate(otherId)}>{other.name?.replace(/_/g, ' ')}</Link>
                    <Typography variant="caption" color="text.secondary">{show(edge.meta || {})}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EntityPanel;
```

Adjust styling/imports to match neighboring components once in the codebase (this is a functional skeleton; visual polish follows site conventions).

- [ ] **Step 3: Add `e` to the nav-param allowlist**

Find the allowlist used for the GSC param cleanup (see memory: nav allowlist killed duplicate param URLs). Add `e` as an allowed param for `/wiki`. If the mechanism is per-page, follow its existing shape exactly.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `http://localhost:3001/wiki`.
Verify: search "copper" finds Copper Ore; selecting it shows Dropped by / Used in crafting sections; clicking a monster link navigates the panel and updates `?e=`; browser back returns to the previous entity; unknown `?e=zzz` shows the empty state; no console errors.

- [ ] **Step 5: Full test suite + build**

Run: `npm run test` then `npm run build`.
Expected: all tests pass; static export succeeds with the graph build in prebuild.

---

## Self-review notes

- Spec coverage: data model (T1-T4), pipeline + loud resolver (T4-T5), aliases/ignore (T4-T5), frontend load/search/panel/URL (T6-T7), stats regression guard (T4), testing (fixtures in T1, unresolved behavior in T4). Per-entity routes/visualization/multi-hop: excluded per spec.
- No commit steps by user preference (memory: user commits manually).
- Type consistency: `rawEdge {from,to,rel,meta,source}` -> resolved `{from,to,rel,meta}` used consistently in T4 tests, T6 fixture, and EntityPanel.
