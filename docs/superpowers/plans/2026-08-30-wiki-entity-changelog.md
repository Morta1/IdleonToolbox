# Wiki Entity Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every wiki entity a "Changes" section showing what the game changed about it and in which version, plus a `/wiki/changelog` page that rolls the same data up by version.

**Architecture:** z-processing diffs its 28 `versioned-data/website-data-*.json` snapshots into a per-entity event list, filters out its own extractor churn with three stacked rules, and exports `entity-history.json` as a standalone file (the `sprite-manifest.json` pattern) which `syncToFrontend` copies to `IdleonToolbox/data/`. The entity-graph build stamps each entity's events onto its node, so an entity page carries only its own history through the existing slice mechanism. The rollup page reads the finished graph at build time.

**Tech Stack:** Node (CommonJS) + `node --test` in z-processing; ESM build scripts, React/MUI and vitest in IdleonToolbox.

**Spec:** `docs/superpowers/specs/2026-08-30-wiki-entity-changelog-design.md`

## Global Constraints

- **Two repos.** z-processing is `C:\Dev\idleon\toolbox\z-processing`, the site is `C:\Dev\idleon\toolbox\IdleonToolbox`. The `cd` does not persist between shell calls: prefix every command.
- **Never edit generated data.** `data/website-data/*` and `data/entity-history.json` are outputs. Fix the z-processing source and regenerate.
- **The graph reads only `data/*.json`**, never `N.js`.
- **No `useMemo`/`useCallback`/IIFEs** in React. React Compiler handles memoization.
- **No em dashes**, anywhere, in code comments or UI copy. Use a colon.
- **Tooltips hang off an InfoIcon**, never off plain text.
- **No `image-rendering: pixelated`.**
- **Pre-commit runs the full vitest suite. Never `--no-verify`.**
- **Do not commit or push unless asked.** The user decides when.
- **Patch notes require asking first.** Propose, do not add unprompted.
- z-processing tests: `npm test` runs `node --test core/*.test.js`, so a new test file must live in `core/` and end `.test.js`.
- Site tests: `npx vitest run <path>`.

---

### Task 1: The diff engine

**Files:**
- Create: `z-processing/features/entityHistory.js`
- Create: `z-processing/core/entityHistory.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `HISTORY_KINDS: string[]` — the website-data keys diffed, in order.
  - `FIELD_ALLOW: Record<string, string[] | '*'>` — per kind, the fields worth reporting. `'*'` means every field.
  - `diffSnapshots(older, newer, version)` -> `Array<{ id: string, kind: string, event: object }>` where `event` is `{ v, t: 'added' }` or `{ v, t: 'changed', fields: Array<{ field, from, to }> }`.
  - `buildHistory(snapshots)` -> `Record<string, Array<event>>` keyed `"<kind>/<id>"`, where `snapshots` is `Array<{ version: string, data: object }>` already in ascending version order.

- [ ] **Step 1: Write the failing test**

Create `z-processing/core/entityHistory.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { diffSnapshots, buildHistory, FIELD_ALLOW } = require('../features/entityHistory');

const snap = (monsters, items = {}) => ({ monsters, items });

test('reports a value change on an allowlisted field', () => {
  const older = snap({ mushG: { Name: 'Green Mushroom', MonsterHPTotal: 15 } });
  const newer = snap({ mushG: { Name: 'Green Mushroom', MonsterHPTotal: 20 } });
  assert.deepStrictEqual(diffSnapshots(older, newer, '2.3.50'), [{
    id: 'mushG',
    kind: 'monsters',
    event: { v: '2.3.50', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 15, to: 20 }] }
  }]);
});

test('reports an entity the newer snapshot introduces', () => {
  const older = snap({});
  const newer = snap({ mushG: { Name: 'Green Mushroom', MonsterHPTotal: 15 } });
  assert.deepStrictEqual(diffSnapshots(older, newer, '2.3.50'), [
    { id: 'mushG', kind: 'monsters', event: { v: '2.3.50', t: 'added' } }
  ]);
});

// Filter 1. A field appearing for the first time is our extractor adding it, not the game.
test('ignores a field the older snapshot did not have', () => {
  const older = snap({ mushG: { Name: 'Green Mushroom' } });
  const newer = snap({ mushG: { Name: 'Green Mushroom', MonsterHPTotal: 20 } });
  assert.deepStrictEqual(diffSnapshots(older, newer, '2.3.50'), []);
});

// Filter 2. The proof case: 2.3.495 set Type to the literal "Monster" on 316 monsters at once,
// an unresolved constant getting resolved. A rebalance never sets 316 monsters to one string.
test('ignores a field that lands on the same new value across a quarter of a kind', () => {
  const older = { monsters: {} }, newer = { monsters: {} };
  for (let i = 0; i < 40; i++) {
    older.monsters['m' + i] = { Name: 'm' + i, SpecialType: 'G.SPECIAL' };
    newer.monsters['m' + i] = { Name: 'm' + i, SpecialType: 'Boss' };
  }
  assert.deepStrictEqual(diffSnapshots(older, newer, '2.3.50'), []);
});

// The floor stops a small collection tripping the ratio: 8 vials is not a bulk rewrite.
test('keeps a shared value below the twenty entity floor', () => {
  const older = { vials: {} }, newer = { vials: {} };
  for (let i = 0; i < 8; i++) {
    older.vials['v' + i] = { desc: 'old' };
    newer.vials['v' + i] = { desc: 'new' };
  }
  assert.strictEqual(diffSnapshots(older, newer, '2.3.50').length, 8);
});

// Filter 3. Whether a sprite offset is interesting is a judgement call, not a statistic.
test('drops a field that is not on the allowlist for its kind', () => {
  const older = snap({ mushG: { Name: 'Green Mushroom', DeathFrame: 1 } });
  const newer = snap({ mushG: { Name: 'Green Mushroom', DeathFrame: 2 } });
  assert.deepStrictEqual(diffSnapshots(older, newer, '2.3.50'), []);
});

// A talent's fields ARE talent names, so the kind opts out of the allowlist entirely.
test('keeps every field on a kind marked with a star', () => {
  assert.strictEqual(FIELD_ALLOW.talents, '*');
  const older = { talents: { Death_Bringer: { DETONATION: { x1: 5 } } } };
  const newer = { talents: { Death_Bringer: { DETONATION: { x1: 7 } } } };
  const out = diffSnapshots(older, newer, '2.3.525');
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].event.fields[0].field, 'DETONATION');
});

test('chains snapshots into one history per entity, oldest first', () => {
  const history = buildHistory([
    { version: '2.3.49', data: snap({}) },
    { version: '2.3.50', data: snap({ mushG: { Name: 'Green Mushroom', MonsterHPTotal: 15 } }) },
    { version: '2.3.51', data: snap({ mushG: { Name: 'Green Mushroom', MonsterHPTotal: 20 } }) }
  ]);
  assert.deepStrictEqual(history['monsters/mushG'], [
    { v: '2.3.50', t: 'added' },
    { v: '2.3.51', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 15, to: 20 }] }
  ]);
});

test('leaves an unchanged entity out of the history entirely', () => {
  const history = buildHistory([
    { version: '2.3.49', data: snap({ mushG: { Name: 'Green Mushroom' } }) },
    { version: '2.3.50', data: snap({ mushG: { Name: 'Green Mushroom' } }) }
  ]);
  assert.deepStrictEqual(Object.keys(history), []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd /c/Dev/idleon/toolbox/z-processing && node --test core/entityHistory.test.js`
Expected: FAIL, `Cannot find module '../features/entityHistory'`

- [ ] **Step 3: Write the implementation**

Create `z-processing/features/entityHistory.js`:

```js
// A per-entity changelog, diffed out of the versioned-data snapshots.
//
// The snapshots are the full website-data export at each game version, already entity-shaped, so
// the history is a diff rather than new extraction. The hazard is that they also move when OUR
// extractor changes: a naive diff of 2.3.523 -> 2.3.525 reports ~500 changed entities and nearly
// all of them are ours. Three filters, each catching what the one before it misses.

// The kinds worth a history. Stamps are absent: their fields are array indices, which needs its
// own shape and covers 8 events in the whole archive.
const HISTORY_KINDS = ['items', 'monsters', 'companions', 'crafts', 'achievements', 'cards', 'vials', 'talents'];

// Filter 3, the curated half. Filters 1 and 2 are statistical and catch structural noise; whether
// a sprite Y-offset is worth a changelog line is a judgement call. Only 74 distinct fields change
// across the whole archive, so this is a bounded list rather than open-ended maintenance.
//
// monsters.Type is deliberately absent despite being the most frequent change in the archive: it
// is the same constant-resolution churn filter 2 catches in bulk, arriving in smaller batches.
const FIELD_ALLOW = {
  items: ['displayName', 'Type', 'Class', 'desc_line1', 'UQ1txt', 'UQ1val', 'UQ2txt', 'UQ2val',
    'sellPrice', 'lvReqToEquip', 'lvReqToCraft', 'Weapon_Power', 'Defence', 'STR', 'AGI', 'WIS',
    'LUK', 'Speed', 'Reach', 'Upgrade_Slots_Left'],
  monsters: ['Name', 'MonsterHPTotal', 'ExpGiven', 'Defence', 'RespawnTime', 'MoveSPEED', 'Damages', 'SpecialType'],
  companions: ['name', 'effect', 'bonus', 'tourPower', 'upgradedEffect', 'upgradedBonus', 'upgradedTourPower'],
  crafts: ['materials', 'subType', 'itemQuantity'],
  achievements: ['name', 'desc', 'rewards', 'gems', 'candy'],
  cards: ['displayName', 'effect', 'bonus', 'perTier'],
  vials: ['desc', 'x1'],
  // A talent's field names ARE talent names (DETONATION, BACKUP_ENERGY), so there is no list to
  // write and every field is meaningful.
  talents: '*'
};

// Filter 2. A field landing on one identical new value across this share of a kind is our
// extractor resolving something, not the game rebalancing every entity to the same number.
const BULK_SHARE = 0.25;
// ...but only once the sample is big enough to mean anything. Without the floor, one change in an
// eight entry collection is "100% of the kind".
const BULK_MIN = 20;

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const allows = (kind, field) => {
  const allow = FIELD_ALLOW[kind];
  return allow === '*' || (Array.isArray(allow) && allow.includes(field));
};

// Filter 1 lives here: only fields the older snapshot already had are compared, so a field
// appearing for the first time can never be reported.
const changedFields = (older, newer, kind) => Object.keys(older)
  .filter((field) => field in newer
    && allows(kind, field)
    && JSON.stringify(older[field]) !== JSON.stringify(newer[field]))
  .map((field) => ({ field, from: older[field], to: newer[field] }));

const bulkValues = (olderKind, newerKind, kind) => {
  const shared = Object.keys(olderKind).filter((id) => id in newerKind);
  const counts = {};
  for (const id of shared) {
    const older = olderKind[id], newer = newerKind[id];
    if (!isRecord(older) || !isRecord(newer)) continue;
    for (const { field, to } of changedFields(older, newer, kind)) {
      const key = `${field}=${JSON.stringify(to)}`;
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return new Set(Object.entries(counts)
    .filter(([, count]) => count >= BULK_MIN && count > shared.length * BULK_SHARE)
    .map(([key]) => key));
};

const diffSnapshots = (older, newer, version) => {
  const events = [];
  for (const kind of HISTORY_KINDS) {
    const olderKind = older?.[kind], newerKind = newer?.[kind];
    if (!isRecord(olderKind) || !isRecord(newerKind)) continue;
    const bulk = bulkValues(olderKind, newerKind, kind);
    for (const id of Object.keys(newerKind)) {
      if (!(id in olderKind)) {
        events.push({ id, kind, event: { v: version, t: 'added' } });
        continue;
      }
      const before = olderKind[id], after = newerKind[id];
      if (!isRecord(before) || !isRecord(after)) continue;
      const fields = changedFields(before, after, kind)
        .filter(({ field, to }) => !bulk.has(`${field}=${JSON.stringify(to)}`));
      if (fields.length > 0) events.push({ id, kind, event: { v: version, t: 'changed', fields } });
    }
  }
  return events;
};

// `snapshots` arrives oldest first. The first one seeds the comparison and produces no events of
// its own: everything in it predates the archive rather than being added by it.
const buildHistory = (snapshots) => {
  const history = {};
  for (let index = 1; index < snapshots.length; index++) {
    const { data: older } = snapshots[index - 1];
    const { data: newer, version } = snapshots[index];
    for (const { id, kind, event } of diffSnapshots(older, newer, version)) {
      const key = `${kind}/${id}`;
      (history[key] = history[key] || []).push(event);
    }
  }
  return history;
};

module.exports = { HISTORY_KINDS, FIELD_ALLOW, diffSnapshots, buildHistory };
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd /c/Dev/idleon/toolbox/z-processing && node --test core/entityHistory.test.js`
Expected: PASS, 8 tests

- [ ] **Step 5: Verify against the real archive**

Run this throwaway check (do not commit it) to confirm the numbers match the spec:

```bash
cd /c/Dev/idleon/toolbox/z-processing && node --max-old-space-size=4096 -e "
const fs=require('fs');
const {buildHistory}=require('./features/entityHistory');
const dir='versioned-data/';
const versions=fs.readdirSync(dir).filter(f=>/^website-data-[\d.]+[a-z]?\.json\$/.test(f))
  .map(f=>f.replace('website-data-','').replace('.json',''))
  .sort((a,b)=>{const p=v=>v.split('.').map(n=>parseInt(n,10)||0);const[a1,a2,a3]=p(a),[b1,b2,b3]=p(b);return a1-b1||a2-b2||a3-b3||a.localeCompare(b)});
const snapshots=versions.map(version=>({version,data:JSON.parse(fs.readFileSync(dir+'website-data-'+version+'.json','utf8'))}));
const h=buildHistory(snapshots);
const events=Object.values(h).flat();
console.log('entities',Object.keys(h).length,'added',events.filter(e=>e.t==='added').length,'changed',events.filter(e=>e.t==='changed').length);
console.log('KB',(JSON.stringify(h).length/1024).toFixed(0));
"
```

Expected: several hundred entities, and **zero** entries whose only changed field is
`monsters.Type`, `companions.x`, `companions.z` or `items.typeGen`. If any appear, the allowlist
in Step 3 is wrong: fix it and rerun.

- [ ] **Step 6: Commit**

```bash
cd /c/Dev/idleon/toolbox/z-processing && git add features/entityHistory.js core/entityHistory.test.js && git commit -m "Diff the versioned snapshots into a per-entity changelog"
```

---

### Task 2: Export it and sync it to the site

**Files:**
- Modify: `z-processing/core/process.js` (after the `reduceToFile('versioned-data', ...)` call, around line 570)
- Create: `z-processing/features/entityHistoryExport.js`
- Create: `z-processing/core/entityHistoryExport.test.js`

**Interfaces:**
- Consumes: `buildHistory(snapshots)` from Task 1.
- Produces: `readSnapshots(dir)` -> `Array<{ version, data }>` ascending; `compareVersions(a, b)` -> number. Writes `exported/entity-history.json`, which `syncToFrontend` copies to `IdleonToolbox/data/entity-history.json`.

- [ ] **Step 1: Write the failing test**

Create `z-processing/core/entityHistoryExport.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { compareVersions, readSnapshots } = require('../features/entityHistoryExport');

test('orders versions numerically, not as strings', () => {
  const sorted = ['2.3.50', '2.3.493a', '2.3.9', '2.3.493', '2.3.100'].sort(compareVersions);
  assert.deepStrictEqual(sorted, ['2.3.9', '2.3.50', '2.3.100', '2.3.493', '2.3.493a']);
});

test('reads every snapshot in a directory, oldest first', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
  fs.writeFileSync(path.join(dir, 'website-data-2.3.50.json'), JSON.stringify({ items: { a: { x: 1 } } }));
  fs.writeFileSync(path.join(dir, 'website-data-2.3.9.json'), JSON.stringify({ items: { a: { x: 0 } } }));
  // Not a snapshot: the type declaration sitting beside them must not be parsed as one.
  fs.writeFileSync(path.join(dir, 'website-data-2.3.50.d.json.ts'), 'export type X = 1;');

  const snapshots = readSnapshots(dir);
  assert.deepStrictEqual(snapshots.map((s) => s.version), ['2.3.9', '2.3.50']);
  assert.strictEqual(snapshots[1].data.items.a.x, 1);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd /c/Dev/idleon/toolbox/z-processing && node --test core/entityHistoryExport.test.js`
Expected: FAIL, `Cannot find module '../features/entityHistoryExport'`

- [ ] **Step 3: Write the implementation**

Create `z-processing/features/entityHistoryExport.js`:

```js
const fs = require('fs');
const path = require('path');
const { exportToFile } = require('../core/Utils');
const { buildHistory } = require('./entityHistory');

// Only the snapshots. versioned-data also holds `website-data-<version>.d.json.ts` type
// declarations, and JSON.parse on one of those throws.
const SNAPSHOT = /^website-data-([\d.]+[a-z]?)\.json$/;

// "2.3.100" sorts before "2.3.50" as a string and after it as a version. The trailing letter on
// 2.3.493a breaks parseInt, so it settles ties alphabetically instead.
const compareVersions = (a, b) => {
  const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [a1, a2, a3] = parts(a), [b1, b2, b3] = parts(b);
  return a1 - b1 || a2 - b2 || a3 - b3 || a.localeCompare(b);
};

const readSnapshots = (dir) => fs.readdirSync(dir)
  .map((file) => ({ file, match: SNAPSHOT.exec(file) }))
  .filter(({ match }) => match)
  .sort((a, b) => compareVersions(a.match[1], b.match[1]))
  .map(({ file, match }) => ({
    version: match[1],
    data: JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
  }));

// Written as its own exported file rather than a website-data key, and not merely for tidiness:
// a website-data key rides into the next versioned snapshot, which then feeds the next history.
// That recursion has no bound. syncToFrontend copies every top-level file in exported/ to the
// site's data/, which is how sprite-manifest.json already travels.
const createEntityHistory = async (projectRoot) => {
  const dir = path.join(projectRoot, 'versioned-data');
  const history = buildHistory(readSnapshots(dir));
  await exportToFile('entity-history.json', history, true);
  console.log(`${__filename} -> entity history: ${Object.keys(history).length} entities`);
  return history;
};

module.exports = { SNAPSHOT, compareVersions, readSnapshots, createEntityHistory };
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd /c/Dev/idleon/toolbox/z-processing && node --test core/entityHistoryExport.test.js`
Expected: PASS, 2 tests

- [ ] **Step 5: Wire it into the pipeline**

In `z-processing/core/process.js`, add the import beside the other feature imports near the top
(the block containing `const { createCompanions } = require('../features/companions');`):

```js
const { createEntityHistory } = require('../features/entityHistoryExport');
```

Then, immediately **after** the `await reduceToFile('versioned-data', ...)` line (around line 570)
and **before** the `if (!skipExported)` block, add:

```js
    // After the snapshot for this version is on disk, so the newest version is in its own history.
    // Never part of allFields: that would fold the history into the next snapshot and compound.
    await createEntityHistory(projectRoot);
```

- [ ] **Step 6: Run the pipeline and confirm the file lands in both repos**

Run: `cd /c/Dev/idleon/toolbox/z-processing && node createLatestVersion.js`

Then check both:

```bash
ls -l /c/Dev/idleon/toolbox/z-processing/exported/entity-history.json /c/Dev/idleon/toolbox/IdleonToolbox/data/entity-history.json
```

Expected: both exist, both a few hundred KB. If the site copy is missing, `syncToFrontend` did not
run in that entry point: check whether `createLatestVersion.js` calls it.

- [ ] **Step 7: Run the z-processing suite**

Run: `cd /c/Dev/idleon/toolbox/z-processing && npm test`
Expected: PASS, all files

- [ ] **Step 8: Commit**

```bash
cd /c/Dev/idleon/toolbox/z-processing && git add features/entityHistoryExport.js core/entityHistoryExport.test.js core/process.js exported/entity-history.json && git commit -m "Export the entity history and sync it to the site"
```

---

### Task 3: Stamp the history onto graph nodes

**Files:**
- Modify: `IdleonToolbox/scripts/entity-graph/build.mjs`
- Create: `IdleonToolbox/scripts/entity-graph/history.mjs`
- Create: `IdleonToolbox/__test__/entity-graph/history.test.js`

**Interfaces:**
- Consumes: `IdleonToolbox/data/entity-history.json` from Task 2, keyed `"<kind>/<id>"`.
- Produces: `HISTORY_NODE_KIND: Record<string, string>` mapping a website-data kind to a graph node kind; `attachHistory(nodes, history)` -> `number` (how many nodes were stamped). Sets `node.history` to the event array, newest first.

- [ ] **Step 1: Write the failing test**

Create `IdleonToolbox/__test__/entity-graph/history.test.js`:

```js
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { attachHistory, HISTORY_NODE_KIND } from '../../scripts/entity-graph/history.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

describe('attachHistory', () => {
  // The history is keyed by the website-data collection; the graph is keyed by node kind. They
  // agree on the raw id, and nothing else.
  it('maps a website-data collection onto its graph node kind', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, { 'monsters/mushG': [{ v: '2.3.50', t: 'added' }] });
    expect(nodes['monster:mushG'].history).toEqual([{ v: '2.3.50', t: 'added' }]);
  });

  // A reader wants the most recent change first; the diff produces them oldest first.
  it('puts the newest event first', () => {
    const nodes = { 'monster:mushG': { kind: 'monster', rawName: 'mushG' } };
    attachHistory(nodes, {
      'monsters/mushG': [
        { v: '2.3.50', t: 'added' },
        { v: '2.3.51', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 15, to: 20 }] }
      ]
    });
    expect(nodes['monster:mushG'].history.map((e) => e.v)).toEqual(['2.3.51', '2.3.50']);
  });

  // A companion is keyed by index in the history and by rawName in the graph, so it needs the
  // node's own index rather than a name lookup.
  it('matches a pet through its companion index', () => {
    const nodes = { 'pet:r0d': { kind: 'pet', rawName: 'r0d', companionIndex: 173 } };
    const stamped = attachHistory(nodes, { 'companions/173': [{ v: '2.3.525', t: 'added' }] });
    expect(stamped).toBe(1);
    expect(nodes['pet:r0d'].history).toHaveLength(1);
  });

  it('leaves a node with no history untouched', () => {
    const nodes = { 'monster:frogG': { kind: 'monster', rawName: 'frogG' } };
    attachHistory(nodes, {});
    expect(nodes['monster:frogG'].history).toBeUndefined();
  });

  it('ignores a history entry for an entity the graph does not carry', () => {
    const nodes = {};
    expect(attachHistory(nodes, { 'monsters/deleted': [{ v: '2.3.50', t: 'added' }] })).toBe(0);
  });
});

describe('the built graph', () => {
  it('stamps history onto real nodes', () => {
    const withHistory = Object.values(graph.nodes).filter((node) => node.history?.length);
    expect(withHistory.length).toBeGreaterThan(200);
  });

  // The whole point of the field allowlist: a changelog nobody can read is not a changelog.
  it('never reports a field the allowlist was meant to drop', () => {
    const banned = new Set(['typeGen', 'DeathFrame', 'HeightOfMonster', 'sprite', 'visualIndex', 'filler']);
    const leaked = Object.values(graph.nodes)
      .flatMap((node) => node.history || [])
      .flatMap((event) => event.fields || [])
      .filter((change) => banned.has(change.field));
    expect(leaked).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run __test__/entity-graph/history.test.js`
Expected: FAIL, cannot resolve `../../scripts/entity-graph/history.mjs`

- [ ] **Step 3: Write the implementation**

Create `IdleonToolbox/scripts/entity-graph/history.mjs`:

```js
// What the game changed about an entity, and when. Diffed in z-processing from its archive of
// per-version website-data snapshots, which the site never has to hold: this reads the finished
// entity-history.json the same way the graph reads any other data file.

// The history is keyed by the website-data collection it came from; the graph is keyed by node
// kind. The two agree on the raw id and on nothing else.
export const HISTORY_NODE_KIND = {
  items: 'item',
  monsters: 'monster',
  companions: 'pet',
  crafts: 'item',
  achievements: 'achievement',
  cards: 'item',
  vials: 'vial',
  talents: 'talent'
};

// A companion is keyed by its index in the game's list and by its rawName in the graph, so the
// node has to say which index it came from. Every other kind matches on rawName.
const idOf = (node) => (node.kind === 'pet' ? String(node.companionIndex ?? '') : node.rawName);

export const attachHistory = (nodes, history) => {
  const byKindAndId = new Map();
  for (const [key, events] of Object.entries(history || {})) {
    const separator = key.indexOf('/');
    const collection = key.slice(0, separator);
    const id = key.slice(separator + 1);
    const kind = HISTORY_NODE_KIND[collection];
    if (!kind) continue;
    const mapKey = `${kind}/${id}`;
    // crafts and cards both land on `item`, and an item can legitimately appear in both.
    byKindAndId.set(mapKey, [...(byKindAndId.get(mapKey) || []), ...events]);
  }

  let stamped = 0;
  for (const node of Object.values(nodes)) {
    const events = byKindAndId.get(`${node.kind}/${idOf(node)}`);
    if (!events?.length) continue;
    // Newest first: the question is almost always "what changed recently".
    node.history = [...events].reverse();
    stamped += 1;
  }
  return stamped;
};
```

- [ ] **Step 4: Wire it into the build**

In `IdleonToolbox/scripts/entity-graph/build.mjs`, add the import beside the other node/edge
imports at the top:

```js
import { attachHistory } from './history.mjs';
```

Add the data read beside the other `readJson` calls. It is NOT under `website-data`, so it needs
its own read (place it after `const classPromotions = readJson('classPromotions.json');`):

```js
// Not a website-data key: it is diffed from the version archive and exported on its own, the way
// sprite-manifest.json is. Absent on a fresh checkout that has not run z-processing yet, so a
// missing file degrades to no history rather than failing the build.
const historyPath = path.join(dataDir, 'entity-history.json');
const entityHistory = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf-8')) : {};
```

Then, immediately before the `// Some nodes name art the game never shipped.` block near the end,
add:

```js
const withHistory = attachHistory(nodes, entityHistory);
```

And add a line to the logging block at the bottom, beside the existing `task board gates` line:

```js
console.log(`[entity-graph] history on ${withHistory} entities`);
```

- [ ] **Step 5: Give pets their companion index**

`attachHistory` matches a pet on `companionIndex`, which `petNodes` does not currently set. In
`IdleonToolbox/scripts/entity-graph/nodes/pets.mjs`, inside the node literal, add it after
`rawName`:

```js
      // The history is keyed by the game's companion index rather than by rawName, so the node
      // has to carry the index it was built from.
      companionIndex: index,
```

- [ ] **Step 6: Rebuild and run the tests**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && node scripts/entity-graph/build.mjs && npx vitest run __test__/entity-graph/`
Expected: build prints `history on N entities` with N over 200; all entity-graph tests PASS

- [ ] **Step 7: Commit**

```bash
cd /c/Dev/idleon/toolbox/IdleonToolbox && git add scripts/entity-graph/history.mjs scripts/entity-graph/build.mjs scripts/entity-graph/nodes/pets.mjs __test__/entity-graph/history.test.js data/entity-graph.json && git commit -m "Stamp each entity's version history onto its graph node"
```

---

### Task 4: The per-entity Changes section

**Files:**
- Create: `IdleonToolbox/utility/wiki/history.js`
- Create: `IdleonToolbox/components/wiki/EntityHistory.jsx`
- Modify: `IdleonToolbox/components/wiki/EntityPanel.jsx`
- Create: `IdleonToolbox/__test__/entity-graph/entity-history-ui.test.js`

**Interfaces:**
- Consumes: `node.history` from Task 3.
- Produces: `FIELD_LABELS: Record<string, string>`; `fieldLabel(field)` -> string; `formatValue(value)` -> string; `EntityHistory` React component taking `{ node }`.

- [ ] **Step 1: Write the failing test**

Create `IdleonToolbox/__test__/entity-graph/entity-history-ui.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { fieldLabel, formatValue } from '../../utility/wiki/history';

describe('fieldLabel', () => {
  // "UQ1txt" is the game's name for an item's special bonus, and it is on 92 of the changes in
  // the archive. Shipping the raw name would make the most common line the least readable.
  it('names the game fields a reader could not decode', () => {
    expect(fieldLabel('UQ1txt')).toBe('Bonus');
    expect(fieldLabel('UQ1val')).toBe('Bonus value');
    expect(fieldLabel('MonsterHPTotal')).toBe('Health');
    expect(fieldLabel('ExpGiven')).toBe('EXP');
    expect(fieldLabel('RespawnTime')).toBe('Respawn time');
    expect(fieldLabel('materials')).toBe('Recipe');
  });

  // A talent's field IS the talent name, so there is nothing to look up and it must survive
  // readably rather than falling through as raw SCREAMING_SNAKE.
  it('turns an unmapped field into words rather than dropping it', () => {
    expect(fieldLabel('BACKUP_ENERGY')).toBe('Backup Energy');
    expect(fieldLabel('desc_line1')).toBe('Description');
  });
});

describe('formatValue', () => {
  it('renders a recipe as its materials rather than as JSON', () => {
    expect(formatValue([{ itemName: 'Frog_Leg', itemQuantity: 6 }, { itemName: 'Thread', itemQuantity: 10 }]))
      .toBe('Frog Leg x6, Thread x10');
  });

  it('cleans the underscores out of a game string', () => {
    expect(formatValue('%_DAMAGE_MULTI')).toBe('% DAMAGE MULTI');
  });

  it('groups a big number', () => {
    expect(formatValue(3649200)).toBe('3,649,200');
  });

  // The archive's most common shape by far: a field going from the game's zero placeholder to a
  // real value, which reads as the entity gaining a bonus it did not have.
  it('names the zero placeholder rather than printing a bare 0', () => {
    expect(formatValue(0)).toBe('none');
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run __test__/entity-graph/entity-history-ui.test.js`
Expected: FAIL, cannot resolve `../../utility/wiki/history`

- [ ] **Step 3: Write the label helpers**

Create `IdleonToolbox/utility/wiki/history.js`:

```js
// Turning a diff into a sentence. The extractor emits the game's own field names, which is the
// right boundary: it produces data, the site produces words.
import { cleanUnderscore } from '@utility/helpers';

// Only the fields a reader would not decode. Anything absent falls through to title case, which
// is what a talent name wants anyway: BACKUP_ENERGY is already the label.
export const FIELD_LABELS = {
  UQ1txt: 'Bonus',
  UQ1val: 'Bonus value',
  UQ2txt: 'Second bonus',
  UQ2val: 'Second bonus value',
  MonsterHPTotal: 'Health',
  ExpGiven: 'EXP',
  RespawnTime: 'Respawn time',
  MoveSPEED: 'Move speed',
  materials: 'Recipe',
  desc_line1: 'Description',
  desc: 'Description',
  displayName: 'Name',
  lvReqToEquip: 'Level to equip',
  lvReqToCraft: 'Level to craft',
  Weapon_Power: 'Weapon power',
  Upgrade_Slots_Left: 'Upgrade slots',
  tourPower: 'Tournament power',
  upgradedTourPower: 'Upgraded tournament power',
  upgradedEffect: 'Upgraded effect',
  upgradedBonus: 'Upgraded bonus',
  perTier: 'Per tier',
  SpecialType: 'Special type',
  subType: 'Type',
  x1: 'Value'
};

export const fieldLabel = (field) => FIELD_LABELS[field]
  ?? String(field || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

export const formatValue = (value) => {
  if (value == null) return 'none';
  // The game writes "no bonus here" as a literal 0, and a bare 0 beside an arrow reads as a real
  // number rather than as an absence.
  if (value === 0 || value === '0') return 'none';
  if (Array.isArray(value)) {
    // A recipe: the only array shape in the history.
    if (value.every((entry) => entry?.itemName)) {
      return value.map((entry) => `${cleanUnderscore(entry.itemName)} x${entry.itemQuantity}`).join(', ');
    }
    return value.map((entry) => formatValue(entry)).join(', ');
  }
  if (typeof value === 'number') return value.toLocaleString('en-US');
  if (typeof value === 'object') return JSON.stringify(value);
  return cleanUnderscore(String(value));
};
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run __test__/entity-graph/entity-history-ui.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Write the component**

Create `IdleonToolbox/components/wiki/EntityHistory.jsx`:

```jsx
import React from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { fieldLabel, formatValue } from '@utility/wiki/history';

// The archive starts here, so "no changes listed" means "none since 2.3.43" and must not be read
// as "this has never changed".
const ARCHIVE_START = '2.3.43';

// Diffed from our own per-version data exports, which move when the extractor changes as well as
// when the game does. Two statistical filters and a curated field list remove almost all of that,
// but an extraction bugfix is indistinguishable from a nerf, so the page says so rather than
// presenting every line as certain.
const CAVEAT = `Derived by comparing the game's data between versions, starting at ${ARCHIVE_START}. `
  + 'An occasional line may be a correction to how the data is read rather than a change to the game.';

const EntityHistory = ({ node }) => {
  if (!node?.history?.length) return null;

  return <Stack sx={{ mt: 3 }} gap={0.5}>
    <Stack direction={'row'} gap={0.5} alignItems={'center'}>
      <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'} letterSpacing={0.5}>
        Changes
      </Typography>
      <Tooltip title={CAVEAT}>
        <InfoIcon sx={{ fontSize: 14, cursor: 'pointer' }}/>
      </Tooltip>
    </Stack>
    {node.history.map((event) => <Stack
      key={event.v}
      direction={{ xs: 'column', sm: 'row' }}
      gap={{ xs: 0.25, sm: 1.5 }}
      sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'action.hover' }}
    >
      <Typography variant={'body2'} sx={{ minWidth: 72, fontVariantNumeric: 'tabular-nums' }}>
        {event.v}
      </Typography>
      {event.t === 'added'
        ? <Chip size={'small'} variant={'outlined'} label={'Added'} sx={{ alignSelf: 'flex-start' }}/>
        : <Stack gap={0.25}>
          {(event.fields || []).map(({ field, from, to }) => <Typography
            key={field}
            variant={'body2'}
            color={'text.secondary'}
          >
            {fieldLabel(field)}: {formatValue(from)} to {formatValue(to)}
          </Typography>)}
        </Stack>}
    </Stack>)}
  </Stack>;
};

export default EntityHistory;
```

- [ ] **Step 6: Render it on the entity page**

In `IdleonToolbox/components/wiki/EntityPanel.jsx`, add the import beside the other wiki component
imports at the top:

```jsx
import EntityHistory from './EntityHistory';
```

Then, in the left column, immediately **after** the closing `</Stack>)}` of the `sections.map(...)`
block and **before** the `</Box>` that closes the left column, add:

```jsx
        <EntityHistory node={node}/>
```

- [ ] **Step 7: Verify in the browser**

The Browser pane cannot load this app. Use the dev server on port 3001 with chrome-devtools MCP,
or Playwright, and open:

- `http://localhost:3001/wiki/item/summer-shell?demo=true` (a bonus value change)
- `http://localhost:3001/wiki/item/torn-jeans?demo=true` (a recipe change)
- `http://localhost:3001/wiki/monster/green-mushroom?demo=true`

Expected: a "Changes" heading with an info icon beside it, rows of `<version> <label>: <from> to
<to>`, newest first. No raw underscores, no `[object Object]`, no bare `0`.

- [ ] **Step 8: Run the full suite**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run`
Expected: PASS, zero failures

- [ ] **Step 9: Commit**

```bash
cd /c/Dev/idleon/toolbox/IdleonToolbox && git add utility/wiki/history.js components/wiki/EntityHistory.jsx components/wiki/EntityPanel.jsx __test__/entity-graph/entity-history-ui.test.js && git commit -m "Show what the game changed about an entity, and when"
```

---

### Task 5: The /wiki/changelog rollup page

**Files:**
- Create: `IdleonToolbox/pages/wiki/changelog.jsx`
- Create: `IdleonToolbox/utility/wiki/changelog.js`
- Create: `IdleonToolbox/__test__/entity-graph/changelog.test.js`
- Modify: `IdleonToolbox/components/wiki/WikiRail.jsx`

**Interfaces:**
- Consumes: `node.history` from Task 3, `fieldLabel`/`formatValue` from Task 4.
- Produces: `rollupByVersion(nodes)` -> `Array<{ version, added, changed, kinds: Array<{ kind, entries }> }>`, newest version first.

- [ ] **Step 1: Write the failing test**

Create `IdleonToolbox/__test__/entity-graph/changelog.test.js`:

```js
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { rollupByVersion } from '../../utility/wiki/changelog';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

const nodes = {
  'monster:mushG': {
    kind: 'monster', name: 'Green_Mushroom', slug: 'green-mushroom',
    history: [
      { v: '2.3.51', t: 'changed', fields: [{ field: 'MonsterHPTotal', from: 15, to: 20 }] },
      { v: '2.3.50', t: 'added' }
    ]
  },
  'item:Copper': {
    kind: 'item', name: 'Copper_Ore', slug: 'copper-ore',
    history: [{ v: '2.3.51', t: 'added' }]
  }
};

describe('rollupByVersion', () => {
  it('groups every entity change under its version, newest first', () => {
    const rollup = rollupByVersion(nodes);
    expect(rollup.map((row) => row.version)).toEqual(['2.3.51', '2.3.50']);
    expect(rollup[0].added).toBe(1);
    expect(rollup[0].changed).toBe(1);
  });

  // A world release is 181 added plus 97 changed, which is a wall as a flat list. Grouping by
  // kind is what keeps the big versions readable.
  it('groups a version by entity kind', () => {
    const [latest] = rollupByVersion(nodes);
    expect(latest.kinds.map((group) => group.kind).sort()).toEqual(['item', 'monster']);
    expect(latest.kinds.find((group) => group.kind === 'monster').entries[0].name).toBe('Green_Mushroom');
  });

  it('carries the slug so every row can link to its entity', () => {
    const [latest] = rollupByVersion(nodes);
    expect(latest.kinds.every((group) => group.entries.every((entry) => entry.slug))).toBe(true);
  });

  it('returns nothing when no node has a history', () => {
    expect(rollupByVersion({ 'monster:frogG': { kind: 'monster', name: 'Frog' } })).toEqual([]);
  });
});

describe('the real graph', () => {
  it('rolls up into versions a page can render', () => {
    const rollup = rollupByVersion(graph.nodes);
    expect(rollup.length).toBeGreaterThan(10);
    // Newest first, compared numerically: "2.3.9" > "2.3.100" as a string, so a string comparison
    // here would pass whichever way round the list came out.
    const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
    const [first] = parts(rollup[0].version);
    const ordered = rollup.every((row, index) => index === 0
      || parts(rollup[index - 1].version).join('.') !== parts(row.version).join('.'));
    expect(Number.isFinite(first)).toBe(true);
    expect(ordered).toBe(true);
    expect(parts(rollup[0].version)[2]).toBeGreaterThan(parts(rollup[rollup.length - 1].version)[2]);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run __test__/entity-graph/changelog.test.js`
Expected: FAIL, cannot resolve `../../utility/wiki/changelog`

- [ ] **Step 3: Write the rollup**

Create `IdleonToolbox/utility/wiki/changelog.js`:

```js
// The same per-entity history read the other way round: by version rather than by entity. Kept
// out of the page so the grouping can be tested without rendering MUI.

// "2.3.100" sorts before "2.3.50" as a string. Newest first, so the comparison is reversed.
const compareVersionsDesc = (a, b) => {
  const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [a1, a2, a3] = parts(a), [b1, b2, b3] = parts(b);
  return b1 - a1 || b2 - a2 || b3 - a3 || b.localeCompare(a);
};

export const rollupByVersion = (nodes) => {
  const versions = new Map();

  for (const node of Object.values(nodes || {})) {
    for (const event of node.history || []) {
      if (!versions.has(event.v)) versions.set(event.v, { version: event.v, added: 0, changed: 0, byKind: new Map() });
      const row = versions.get(event.v);
      if (event.t === 'added') row.added += 1; else row.changed += 1;
      if (!row.byKind.has(node.kind)) row.byKind.set(node.kind, []);
      row.byKind.get(node.kind).push({
        name: node.name,
        slug: node.slug,
        kind: node.kind,
        added: event.t === 'added',
        fields: event.fields || []
      });
    }
  }

  return [...versions.values()]
    .sort((a, b) => compareVersionsDesc(a.version, b.version))
    .map(({ version, added, changed, byKind }) => ({
      version,
      added,
      changed,
      kinds: [...byKind.entries()]
        .map(([kind, entries]) => ({ kind, entries: entries.sort((a, b) => String(a.name).localeCompare(String(b.name))) }))
        .sort((a, b) => a.kind.localeCompare(b.kind))
    }));
};
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run __test__/entity-graph/changelog.test.js`
Expected: PASS, 5 tests

- [ ] **Step 5: Write the page**

Create `IdleonToolbox/pages/wiki/changelog.jsx`:

```jsx
import React from 'react';
import { useRouter } from 'next/router';
import { Box, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import WikiRail from '@components/wiki/WikiRail';
import { KIND_PLURALS } from '@components/wiki/EntityPanel';
import { fieldLabel, formatValue } from '@utility/wiki/history';
import { sessionQuery } from '@utility/nav-query';
import { cleanUnderscore } from '@utility/helpers';

const ARCHIVE_START = '2.3.43';
const CAVEAT = `Derived by comparing the game's data between versions, starting at ${ARCHIVE_START}. `
  + 'An occasional line may be a correction to how the data is read rather than a change to the game.';

const Changelog = ({ versions }) => {
  const router = useRouter();
  const go = (href) => router.push({ pathname: href, query: sessionQuery(router.query) });

  return <WikiRail current={'changelog'}>
    <Box sx={{ maxWidth: 1200 }}>
    <NextSeo
      title={'Game changelog | Idleon Toolbox'}
      description={'What each Legends of Idleon patch changed: items, monsters, recipes, companions and talents, version by version.'}
    />
    <Stack direction={'row'} gap={0.5} alignItems={'center'} sx={{ mb: 2 }}>
      <Typography variant={'h5'} component={'h2'}>Game changelog</Typography>
      <Tooltip title={CAVEAT}>
        <InfoIcon sx={{ fontSize: 16, cursor: 'pointer' }}/>
      </Tooltip>
    </Stack>

    <Stack gap={2}>
      {versions.map(({ version, added, changed, kinds }) => <Card key={version} variant={'outlined'}>
        <CardContent>
          <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'}>
            <Typography variant={'h6'} component={'h3'}>{version}</Typography>
            {added > 0 ? <Chip size={'small'} variant={'outlined'} label={`${added} added`}/> : null}
            {changed > 0 ? <Chip size={'small'} variant={'outlined'} label={`${changed} changed`}/> : null}
          </Stack>

          {kinds.map(({ kind, entries }) => <Stack key={kind} sx={{ mt: 1.5 }} gap={0.25}>
            <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'} letterSpacing={0.5}>
              {KIND_PLURALS[kind] || kind}
            </Typography>
            {entries.map((entry) => <Stack
              key={`${entry.kind}-${entry.slug}`}
              direction={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 0, sm: 1.5 }}
            >
              <Link
                href={`/wiki/${entry.kind}/${entry.slug}`}
                variant={'body2'}
                underline={'hover'}
                sx={{ minWidth: 200 }}
                onClick={(event) => {
                  event.preventDefault();
                  go(`/wiki/${entry.kind}/${entry.slug}`);
                }}
              >
                {cleanUnderscore(entry.name)}
              </Link>
              <Typography variant={'body2'} color={'text.secondary'}>
                {entry.added
                  ? 'added'
                  : entry.fields.map(({ field, from, to }) =>
                    `${fieldLabel(field)}: ${formatValue(from)} to ${formatValue(to)}`).join(', ')}
              </Typography>
            </Stack>)}
          </Stack>)}
        </CardContent>
      </Card>)}
    </Stack>
    </Box>
  </WikiRail>;
};

export const getStaticProps = async () => {
  const { staticGraph } = await import('@utility/wiki/static-graph.mjs');
  const { rollupByVersion } = await import('@utility/wiki/changelog');
  const { graph } = staticGraph();
  const versions = rollupByVersion(graph.nodes);

  return {
    props: {
      versions,
      // Nothing below WaitForRouter reaches the static export, so the entity links only survive
      // as crawl links rendered above the gate.
      crawlLinks: versions.flatMap(({ kinds }) => kinds.flatMap(({ entries }) => entries
        .map((entry) => ({ h: `/wiki/${entry.kind}/${entry.slug}`, t: entry.name })))),
      crawlHeading: 'Entities changed by game version'
    }
  };
};

export default Changelog;
```

- [ ] **Step 6: Link it from the wiki rail**

In `IdleonToolbox/components/wiki/WikiRail.jsx`, add a `Divider` to the existing MUI import:

```jsx
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack } from '@mui/material';
```

Then, inside `<List dense disablePadding>`, immediately after the closing `</ListItemButton>)}` of
the `LISTED_KINDS.map(...)` block, add:

```jsx
        {/* Below the divider because it is not a category: it cuts across all of them. */}
        <Divider sx={{ my: 0.5 }}/>
        <ListItemButton component={'a'} href={'/wiki/changelog'} selected={current === 'changelog'}
                        onClick={(event) => go(event, '/wiki/changelog')}>
          <ListItemText primary={'Changelog'}/>
        </ListItemButton>
```

Every wiki page wraps its own content in the rail (`pages/wiki.jsx`, `pages/wiki/[kind]/index.jsx`
and `pages/wiki/[kind]/[slug].jsx` all do), which is why the page in Step 5 does the same with
`current={'changelog'}`.

- [ ] **Step 7: Verify the page and the export**

Run: `cd /c/Dev/idleon/toolbox/IdleonToolbox && npx vitest run && npm run build`
Expected: tests PASS; build succeeds; `out/wiki/changelog.html` exists

Then open `http://localhost:3001/wiki/changelog?demo=true` and confirm the newest version is at the
top, entries group under Items/Monsters/Pets headings, and every entity name links to its page.

- [ ] **Step 8: Commit**

```bash
cd /c/Dev/idleon/toolbox/IdleonToolbox && git add pages/wiki/changelog.jsx utility/wiki/changelog.js components/wiki/WikiRail.jsx __test__/entity-graph/changelog.test.js && git commit -m "Add the game changelog page"
```

---

## After the plan

Two things need a decision once this is working, and neither is in scope here:

- **A patch note.** CLAUDE.md requires asking first. This is a visible feature and deserves one,
  but propose it rather than adding it.
- **The sitemap.** `utility/generate-sitemap.mjs` builds its list from `LISTED_KINDS` plus entity
  slugs. `/wiki/changelog` is neither, so it will be missing until it is added explicitly.
