# website-data Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `data/website-data.json` into 25 per-key files plus a `shared-data.json` catch-all behind a barrel, so each page bundles only the keys it imports.

**Architecture:** A pure partitioner in `z-processing/core/splitData.js` decides per key — ≥ 20 KB gets its own file, everything else collapses into `shared-data.json` — and emits an `index.js` barrel re-exporting all of them. `itemsArray` is a *derived* export: excluded from the emitted files, reconstructed in the barrel from `items`. The toolbox's `@website-data` alias repoints at the barrel; because the ambient `declare module '@website-data'` is unchanged, the 113 files importing from the alias need no edit.

**Tech Stack:** Node 24 (CommonJS in z-processing, ESM in the toolbox), `node:test` built-in runner for z-processing, Vitest for the toolbox, Next 16.2.11 + Turbopack `output: 'export'`.

**Spec:** `docs/superpowers/specs/2026-08-16-website-data-split-design.md`

## Global Constraints

- **Do not commit.** The user decides when to commit. Every task ends at "verify", never at "commit". Leave changes in the working tree.
- **Never hand-edit `data/website-data.json` or anything under `data/website-data/`.** It is generated. Fix `z-processing` and regenerate.
- Threshold is exactly `20480` bytes, measured as `Buffer.byteLength(JSON.stringify(value))`.
- Catch-all filename is exactly `shared-data.json`.
- No new runtime or dev dependencies in either repo. z-processing uses the built-in `node:test`.
- z-processing is CommonJS (`require`/`module.exports`). The toolbox is ESM.
- Two repos: `C:\Dev\idleon\toolbox\z-processing` and `C:\Dev\idleon\toolbox\IdleonToolbox`. Paths below are relative to whichever repo the task names.
- No React `useMemo` and no IIFEs in toolbox code — the React Compiler handles memoization.

## Reference values

Recomputed from the current blob; used as expected values in several tests.

```
total keys                143
keys >= 20480 bytes        26   (includes itemsArray)
keys <  20480 bytes       117
files emitted              26   (25 heavy + shared-data.json)
barrel export names       143   (142 emitted + itemsArray derived)
EquipmentKeychain entries   30
  divergent (the bug)       25   (EquipmentKeychain0..24 - zeroed in itemsArray, real in items)
  zeroed in items too        4   (EquipmentKeychain25..28 - no stat data, must stay zeroed)
  already matching           1   (EquipmentKeychain29)
```

Sizes below are as WRITTEN (`JSON.stringify(x, null, 2)`), not compact. `shared-data.json` is
0.61 MB compact but 0.94 MB on disk. On-disk size is not the metric that matters — the bundler
re-serializes JSON into the chunk, so Task 8's chunk-byte measurement is authoritative.

---

### Task 1: Chunk manifest tool and baseline capture

Must come first. Once the blob is split, the "before" numbers are unrecoverable without a checkout.

**Repo:** IdleonToolbox

**Files:**
- Create: `utility/chunk-manifest.mjs`
- Test: `__test__/utility/chunk-manifest.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `parseChunkRefs(html: string): string[]` — chunk basenames referenced by one HTML file. `buildManifest(outDir: string): Array<{page: string, chunks: string[], bytes: number}>` — sorted by `bytes` descending.

- [ ] **Step 1: Write the failing test**

Create `__test__/utility/chunk-manifest.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseChunkRefs, buildManifest } from '@utility/chunk-manifest.mjs';

describe('parseChunkRefs', () => {
  it('pulls chunk basenames out of script src attributes', () => {
    const html = '<script src="/_next/static/chunks/3hfc-ch9u_y9d.js"></script>';
    expect(parseChunkRefs(html)).toEqual(['3hfc-ch9u_y9d.js']);
  });

  // Next inlines the same chunk list a second time inside __NEXT_DATA__, so a naive
  // scan double-counts every chunk and doubles every page's reported bytes.
  it('deduplicates a chunk referenced more than once', () => {
    const html = '<script src="/_next/static/chunks/a.js"></script>'
      + '<script>{"chunks":["static/chunks/a.js"]}</script>';
    expect(parseChunkRefs(html)).toEqual(['a.js']);
  });

  it('ignores non-chunk scripts', () => {
    expect(parseChunkRefs('<script src="/_next/static/css/x.css"></script>')).toEqual([]);
  });

  it('returns an empty array for a page with no scripts', () => {
    expect(parseChunkRefs('<html><body>hi</body></html>')).toEqual([]);
  });
});

describe('buildManifest', () => {
  const withOut = () => {
    const root = mkdtempSync(path.join(tmpdir(), 'manifest-'));
    const chunks = path.join(root, '_next', 'static', 'chunks');
    mkdirSync(chunks, { recursive: true });
    writeFileSync(path.join(chunks, 'big.js'), 'x'.repeat(1000));
    writeFileSync(path.join(chunks, 'small.js'), 'x'.repeat(10));
    mkdirSync(path.join(root, 'account'), { recursive: true });
    writeFileSync(path.join(root, 'index.html'),
      '<script src="/_next/static/chunks/small.js"></script>');
    writeFileSync(path.join(root, 'account', 'research.html'),
      '<script src="/_next/static/chunks/big.js"></script>');
    return root;
  };

  it('reports every page with its chunk bytes, heaviest first', () => {
    const rows = buildManifest(withOut());
    expect(rows).toEqual([
      { page: 'account/research.html', chunks: ['big.js'], bytes: 1000 },
      { page: 'index.html', chunks: ['small.js'], bytes: 10 }
    ]);
  });

  // A chunk named in the HTML but absent on disk must not crash the run or silently
  // count as zero without a trace.
  it('counts a missing chunk as zero bytes and still lists it', () => {
    const root = withOut();
    writeFileSync(path.join(root, 'ghost.html'),
      '<script src="/_next/static/chunks/nope.js"></script>');
    const row = buildManifest(root).find((r) => r.page === 'ghost.html');
    expect(row).toEqual({ page: 'ghost.html', chunks: ['nope.js'], bytes: 0 });
  });

  it('returns an empty array when out/ does not exist', () => {
    expect(buildManifest(path.join(tmpdir(), 'no-such-out'))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __test__/utility/chunk-manifest.test.js`
Expected: FAIL — `Failed to resolve import "@utility/chunk-manifest.mjs"`

- [ ] **Step 3: Write the implementation**

Create `utility/chunk-manifest.mjs`:

```js
// Reports how many bytes of JS chunks each exported page pulls in. Used to prove the
// website-data split moved bytes off pages that never imported those keys, and to catch a
// page silently gaining weight.
//
// Usage: node utility/chunk-manifest.mjs [outDir] > manifest.json
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const CHUNK_REF = /static\/chunks\/([A-Za-z0-9._-]+\.js)/g;

export function parseChunkRefs(html) {
  // Next lists each chunk twice - once as a <script src>, once inside __NEXT_DATA__ - so
  // matching without deduping doubles every page's reported weight.
  return [...new Set([...html.matchAll(CHUNK_REF)].map((m) => m[1]))];
}

function walk(dir, base = dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '_next') found.push(...walk(full, base));
    } else if (entry.endsWith('.html')) {
      found.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return found;
}

export function buildManifest(outDir) {
  if (!existsSync(outDir)) return [];
  const chunkDir = path.join(outDir, '_next', 'static', 'chunks');
  const sizeOf = (name) => {
    const full = path.join(chunkDir, name);
    // A chunk named in the HTML but missing on disk is worth surfacing, not crashing on.
    return existsSync(full) ? statSync(full).size : 0;
  };
  return walk(outDir)
    .map((page) => {
      const chunks = parseChunkRefs(readFileSync(path.join(outDir, page), 'utf8'));
      return { page, chunks, bytes: chunks.reduce((sum, c) => sum + sizeOf(c), 0) };
    })
    .sort((a, b) => b.bytes - a.bytes || a.page.localeCompare(b.page));
}

// pathToFileURL, not a template string: on Windows import.meta.url is file:///C:/... with
// three slashes, so a hand-built `file://${argv[1]}` never matches and the CLI silently
// does nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = process.argv[2] || path.resolve('out');
  process.stdout.write(JSON.stringify(buildManifest(outDir), null, 2));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __test__/utility/chunk-manifest.test.js`
Expected: PASS, 7 tests

- [ ] **Step 5: Capture the baseline**

```bash
cd /c/Dev/idleon/toolbox/IdleonToolbox
git status --short          # must be clean apart from the two new files
NODE_ENV=production npx next build
node utility/chunk-manifest.mjs out > /c/Users/Mor/AppData/Local/Temp/claude/C--Dev-idleon-toolbox/27784a5f-25ce-4913-af0c-eb5f5a218d1f/scratchpad/manifest-before.json
```

If the build fails with "Another next build process is already running", delete `.next/lock` only — **do not kill node processes**, they are the user's local servers.

- [ ] **Step 6: Verify the baseline is sane**

```bash
node -e "const m=require('C:/Users/Mor/AppData/Local/Temp/claude/C--Dev-idleon-toolbox/27784a5f-25ce-4913-af0c-eb5f5a218d1f/scratchpad/manifest-before.json');
console.log('pages',m.length);
console.log('pages over 5MB',m.filter(r=>r.bytes>5e6).length);
console.log('heaviest',m[0].page,(m[0].bytes/1048576).toFixed(2)+'MB');"
```

Expected: a few hundred pages, most of them over 5 MB, heaviest in the 6-10 MB range. If `pages` is 0 or every page reports 0 bytes, the regex or the walk is wrong — stop and fix before continuing.

Measured on 2026-08-16: **252 pages, 235 over 5 MB, heaviest `characters.html` at 9.39 MB.** Two pages legitimately report 0 bytes (`privacy-policy.html` and a Google verification file) because they reference no chunks.

---

### Task 2: The pure partitioner and barrel builder

**Repo:** z-processing

**Files:**
- Create: `core/splitData.js`
- Create: `core/splitData.test.js`
- Modify: `package.json` (add a `test` script)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `THRESHOLD_BYTES: number` — `20480`
  - `DERIVED_EXPORTS: Array<{name: string, from: string, expression: string}>`
  - `partition(data: object): {heavy: Record<string, unknown>, shared: Record<string, unknown>, derived: string[]}`
  - `buildBarrel(heavyKeys: string[], sharedKeys: string[]): string`

- [ ] **Step 1: Write the failing test**

Create `core/splitData.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { partition, buildBarrel, THRESHOLD_BYTES } = require('./splitData');

const big = (bytes) => ({ pad: 'x'.repeat(bytes) });

test('threshold is 20480 bytes', () => {
  assert.equal(THRESHOLD_BYTES, 20480);
});

test('a key at one byte under the threshold goes to shared', () => {
  // JSON.stringify({pad:'x'.repeat(n)}) is n + 10 bytes: {"pad":"<n>"}
  const { heavy, shared } = partition({ small: big(THRESHOLD_BYTES - 11) });
  assert.deepEqual(Object.keys(heavy), []);
  assert.deepEqual(Object.keys(shared), ['small']);
});

test('a key exactly at the threshold gets its own file', () => {
  const { heavy, shared } = partition({ chunky: big(THRESHOLD_BYTES - 10) });
  assert.deepEqual(Object.keys(heavy), ['chunky']);
  assert.deepEqual(Object.keys(shared), []);
});

// Losing a key silently would ship a barrel missing an export that 116 files import.
test('every input key lands in exactly one bucket', () => {
  const input = { a: big(30000), b: { x: 1 }, c: big(40000), d: [1, 2, 3] };
  const { heavy, shared } = partition(input);
  const landed = [...Object.keys(heavy), ...Object.keys(shared)].sort();
  assert.deepEqual(landed, ['a', 'b', 'c', 'd']);
});

test('reassembling the buckets reproduces the input exactly', () => {
  const input = { a: big(30000), b: { x: 1 }, nested: { deep: [{ y: 2 }] } };
  const { heavy, shared } = partition(input);
  assert.deepEqual({ ...heavy, ...shared }, input);
});

// itemsArray is rebuilt in the barrel from items; emitting it too would ship 0.87MB twice.
test('itemsArray is excluded from both buckets and reported as derived', () => {
  const { heavy, shared, derived } = partition({ items: big(30000), itemsArray: big(30000) });
  assert.deepEqual(Object.keys(heavy), ['items']);
  assert.deepEqual(Object.keys(shared), []);
  assert.deepEqual(derived, ['itemsArray']);
});

test('derived is empty when the source key is absent', () => {
  assert.deepEqual(partition({ a: { x: 1 } }).derived, []);
});

test('barrel re-exports each heavy key from its own file', () => {
  const out = buildBarrel(['monsterDrops', 'items'], []);
  assert.match(out, /export \{ default as monsterDrops \} from '\.\/monsterDrops\.json';/);
  assert.match(out, /export \{ default as items \} from '\.\/items\.json';/);
});

test('barrel destructures the shared keys off one import', () => {
  const out = buildBarrel([], ['compass', 'sigils']);
  assert.match(out, /import shared from '\.\/shared-data\.json';/);
  assert.match(out, /export const \{[\s\S]*compass,[\s\S]*sigils[\s\S]*\} = shared;/);
});

// A bare Object.values would alias itemsArray[i] and items[rawName] to one object; today
// they come from separate parses. The shallow copy preserves that.
test('barrel derives itemsArray from items with a shallow copy', () => {
  const out = buildBarrel(['items'], []);
  assert.match(out, /import items from '\.\/items\.json';/);
  assert.match(out, /export const itemsArray = Object\.values\(items\)\.map\(\(item\) => \(\{ \.\.\.item \}\)\);/);
});

// Asserts the behaviour (no shared import emitted), not the bare filename - the barrel's
// header comment mentions shared-data.json unconditionally, so a filename match would
// catch the documentation too.
test('barrel omits the shared import entirely when there are no shared keys', () => {
  const out = buildBarrel(['items'], []);
  assert.doesNotMatch(out, /import shared from/);
  assert.doesNotMatch(out, /= shared;/);
});

test('barrel omits the derived export when items is not a heavy key', () => {
  assert.doesNotMatch(buildBarrel(['crafts'], []), /itemsArray/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/Dev/idleon/toolbox/z-processing && node --test core/splitData.test.js`
Expected: FAIL — `Cannot find module './splitData'`

- [ ] **Step 3: Write the implementation**

Create `core/splitData.js`:

```js
// Splits the website-data object into one file per large key plus a single shared-data.json
// for everything small, and writes the barrel that re-exports them under '@website-data'.
//
// Why: a single JSON module is atomic, so importing one key pulled all 143 - a 6.1MB chunk
// onto 225 of 242 exported pages. Per-key files let the bundler drop what a page never
// imports.
//
// Membership is decided by size on every run, so a new or growing key splits itself with no
// list to maintain. Consumers never see which side of the line a key is on: the barrel
// exports the same names either way.

// 117 of 143 keys are under 20KB and sum to only 0.60MB combined. Giving each its own file
// buys nothing and costs 117 files, so they ride together.
const THRESHOLD_BYTES = 20480;

// itemsArray was a hand-maintained duplicate of Object.values(items) that drifted: commit
// 5921946 (2025-04-22) added keychain stats to the items literal and not the array one,
// leaving 25 EquipmentKeychain entries with UQ1txt/UQ1val of 0 for ~16 months. Deriving it
// deletes the duplicate literal, so the drift cannot recur - and saves 0.87MB.
//
// The shallow copy is load-bearing: a bare Object.values would make itemsArray[i] and
// items[rawName] the same object, where today two separate parses keep them distinct.
const DERIVED_EXPORTS = [{
  name: 'itemsArray',
  from: 'items',
  expression: "Object.values(items).map((item) => ({ ...item }))"
}];

const partition = (data) => {
  const derivedNames = DERIVED_EXPORTS.filter((d) => data[d.from] !== undefined).map((d) => d.name);
  const heavy = {}, shared = {};
  for (const [key, value] of Object.entries(data)) {
    if (derivedNames.includes(key)) continue;
    if (Buffer.byteLength(JSON.stringify(value)) >= THRESHOLD_BYTES) {
      heavy[key] = value;
    } else {
      shared[key] = value;
    }
  }
  return { heavy, shared, derived: derivedNames };
};

const buildBarrel = (heavyKeys, sharedKeys) => {
  const lines = [
    '// Auto-generated by z-processing. Do not edit.',
    "// Keys >= 20KB get their own file; the rest ride in shared-data.json.",
    ''
  ];

  for (const key of heavyKeys) {
    lines.push(`export { default as ${key} } from './${key}.json';`);
  }

  const derived = DERIVED_EXPORTS.filter((d) => heavyKeys.includes(d.from));
  if (derived.length) {
    lines.push('');
    for (const d of derived) {
      lines.push(`import ${d.from} from './${d.from}.json';`);
      lines.push(`export const ${d.name} = ${d.expression};`);
    }
  }

  if (sharedKeys.length) {
    lines.push('');
    lines.push("import shared from './shared-data.json';");
    lines.push('export const {');
    lines.push(sharedKeys.map((key) => `  ${key}`).join(',\n'));
    lines.push('} = shared;');
  }

  lines.push('');
  return lines.join('\n');
};

module.exports = { THRESHOLD_BYTES, DERIVED_EXPORTS, partition, buildBarrel };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test core/splitData.test.js`
Expected: PASS, 12 tests

- [ ] **Step 5: Add the test script**

`package.json` has an empty `"scripts": {}`. Set it to:

```json
"scripts": {
  "test": "node --test core/*.test.js"
}
```

- [ ] **Step 6: Verify the script runs**

Run: `npm test`
Expected: PASS, 12 tests

---

### Task 3: The writer, wired into the generator

**Repo:** z-processing

**Files:**
- Modify: `core/splitData.js` (add `reduceToSplitFiles`)
- Modify: `core/splitData.test.js` (add writer tests)
- Modify: `core/Utils.js:270-286` (re-export)
- Modify: `core/process.js:526`
- Modify: `features/items.js:59` (warning comment)

**Interfaces:**
- Consumes: `partition`, `buildBarrel` from Task 2
- Produces: `reduceToSplitFiles(folder: string, dirName: string, sections: Array<object>): Promise<void>` — writes `<folder>/<dirName>/*.json` plus `index.js`

Note `core/process.js:470` keeps `{ itemsArray }` in `allFields`. The versioned archive and the generated `.d.ts` must stay complete; only the *emitted files* skip it, which `partition` already handles.

- [ ] **Step 1: Write the failing test**

Append to `core/splitData.test.js`:

```js
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { reduceToSplitFiles } = require('./splitData');

const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), 'split-'));

test('writes one file per heavy key plus shared-data.json and index.js', async () => {
  const root = scratch();
  await reduceToSplitFiles(root, 'website-data', [
    { items: big(30000) }, { compass: { a: 1 } }
  ]);
  const dir = path.join(root, 'website-data');
  assert.deepEqual(fs.readdirSync(dir).sort(),
    ['index.js', 'items.json', 'shared-data.json']);
});

test('reassembling the written files reproduces the input', async () => {
  const root = scratch();
  const sections = [{ items: big(30000) }, { compass: { a: 1 } }, { sigils: [1, 2] }];
  await reduceToSplitFiles(root, 'website-data', sections);
  const dir = path.join(root, 'website-data');
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
  assert.deepEqual(
    { items: read('items.json'), ...read('shared-data.json') },
    sections.reduce((acc, s) => ({ ...acc, ...s }), {})
  );
});

// The 0.87MB saving evaporates if the array is written out as well as derived.
test('does not write itemsArray.json', async () => {
  const root = scratch();
  await reduceToSplitFiles(root, 'website-data', [
    { items: big(30000) }, { itemsArray: big(30000) }
  ]);
  const files = fs.readdirSync(path.join(root, 'website-data'));
  assert.ok(!files.includes('itemsArray.json'));
  assert.match(fs.readFileSync(path.join(root, 'website-data', 'index.js'), 'utf-8'),
    /export const itemsArray = /);
});

test('replaces a stale file left by a previous run', async () => {
  const root = scratch();
  const dir = path.join(root, 'website-data');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'gone.json'), '{"stale":true}');
  await reduceToSplitFiles(root, 'website-data', [{ compass: { a: 1 } }]);
  assert.ok(!fs.existsSync(path.join(dir, 'gone.json')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `reduceToSplitFiles is not a function`

- [ ] **Step 3: Write the implementation**

Add to `core/splitData.js`, above `module.exports`:

```js
const fs = require('fs');
const asyncFs = require('fs').promises;
const nodePath = require('path');

const reduceToSplitFiles = async (folder, dirName, sections) => {
  const data = sections.reduce((acc, section) => {
    const [name, value] = Object.entries(section)[0];
    return { ...acc, [name]: value };
  }, {});

  const target = nodePath.isAbsolute(folder)
    ? nodePath.join(folder, dirName)
    : nodePath.join(__dirname, '..', folder, dirName);

  // A key that dropped below the threshold, or vanished from the game, leaves a stale file
  // that the barrel no longer imports but git still tracks. Start clean.
  await asyncFs.rm(target, { recursive: true, force: true });
  await asyncFs.mkdir(target, { recursive: true });

  const { heavy, shared } = partition(data);

  for (const [key, value] of Object.entries(heavy)) {
    await asyncFs.writeFile(
      nodePath.join(target, `${key}.json`), JSON.stringify(value, null, 2), 'utf-8');
  }
  await asyncFs.writeFile(
    nodePath.join(target, 'shared-data.json'), JSON.stringify(shared, null, 2), 'utf-8');
  await asyncFs.writeFile(
    nodePath.join(target, 'index.js'),
    buildBarrel(Object.keys(heavy), Object.keys(shared)), 'utf-8');

  console.log(`Successfully created ${Object.keys(heavy).length + 1} data files in ${dirName}/`);
};
```

Extend the exports on the last line:

```js
module.exports = { THRESHOLD_BYTES, DERIVED_EXPORTS, partition, buildBarrel, reduceToSplitFiles };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS, 16 tests

- [ ] **Step 5: Re-export from Utils and wire into process.js**

In `core/Utils.js`, add near the top (after the existing requires on lines 1-4):

```js
const { reduceToSplitFiles } = require('./splitData');
```

Add `reduceToSplitFiles` to the `module.exports` object at line 270.

In `core/process.js:35`, extend the destructure:

```js
const { reduceToFile, reduceToSplitFiles, validateData, syncToFrontend } = require('./Utils');
```

Replace `core/process.js:526`:

```js
      await reduceToSplitFiles('exported', fileName, allFields);
```

Leave line 523 (`versioned-data`) and line 470 (`{ itemsArray }`) exactly as they are.

- [ ] **Step 6: Add the warning comment**

Insert directly above `const createItems = async (staticData, keychains) => {` at `features/items.js:59`:

```js
// WARNING: enrich `items` only. `itemsArray` is no longer exported from here - the frontend
// derives it as Object.values(items), so anything added to a second per-item literal will
// silently diverge from the first.
//
// That is exactly what happened once already: commit 5921946 "feat: keychains" (2025-04-22)
// spread `extraData` into the `items` literal and not the `itemsArray` one, because
// `extraData` is scoped inside the `if (!excludedItems[itemName])` block above it. The 25
// EquipmentKeychain entries carried UQ1txt/UQ1val of 0 for roughly 16 months before anyone
// noticed.
```

- [ ] **Step 7: Verify nothing else broke**

Run: `npm test && node -e "require('./core/process.js'); console.log('process.js loads')"`
Expected: 16 tests PASS, then `process.js loads`

---

### Task 4: validateData directory mode

**Repo:** z-processing

**Files:**
- Modify: `core/Utils.js:123`
- Create: `core/validateData.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `validateData(pathToFileOrDir: string): void` — unchanged signature; now accepts a directory

- [ ] **Step 1: Write the failing test**

Create `core/validateData.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateData } = require('./Utils');

const dirWith = (files) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-'));
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), JSON.stringify(value), 'utf-8');
  }
  fs.writeFileSync(path.join(root, 'index.js'), '// barrel', 'utf-8');
  return root;
};

test('passes when every key across every file is non-empty', () => {
  const dir = dirWith({ 'items.json': { a: 1 }, 'shared-data.json': { compass: [1] } });
  assert.doesNotThrow(() => validateData(dir));
});

// The single-file mode has caught empty sections for years; splitting must not lose that.
test('fails when a key inside shared-data is empty', () => {
  const dir = dirWith({ 'items.json': { a: 1 }, 'shared-data.json': { compass: [] } });
  assert.throws(() => validateData(dir), /compass/);
});

test('fails when a whole heavy file is empty', () => {
  const dir = dirWith({ 'items.json': {}, 'shared-data.json': { compass: [1] } });
  assert.throws(() => validateData(dir), /items/);
});

test('ignores index.js when reassembling', () => {
  const dir = dirWith({ 'shared-data.json': { compass: [1] } });
  assert.doesNotThrow(() => validateData(dir));
});

test('still validates a single file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-'));
  const file = path.join(root, 'one.json');
  fs.writeFileSync(file, JSON.stringify({ ok: [1], bad: [] }), 'utf-8');
  assert.throws(() => validateData(file), /bad/);
});

test('fails loudly when the path does not exist', () => {
  assert.throws(() => validateData(path.join(os.tmpdir(), 'nope')), /does not exist/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test core/validateData.test.js`
Expected: FAIL — the directory cases throw `Failed to parse JSON file` (it tries to `readFileSync` a directory)

- [ ] **Step 3: Write the implementation**

In `core/Utils.js`, replace the read block at lines 123-137 (from `const validateData = (filePath) => {` through the closing brace of the `try/catch` that parses JSON) with:

```js
const validateData = (filePath) => {

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Validation failed: File does not exist: ${filePath}`);
  }

  // Read and parse JSON. The exported data is a directory of per-key files now, so
  // reassemble it and run the identical check - splitting must not weaken validation.
  let data;
  try {
    if (fs.statSync(filePath).isDirectory()) {
      data = fs.readdirSync(filePath)
        .filter((name) => name.endsWith('.json'))
        .reduce((acc, name) => {
          const parsed = JSON.parse(fs.readFileSync(path.join(filePath, name), 'utf-8'));
          // shared-data.json holds many keys; a heavy file holds one, named for the file.
          return name === 'shared-data.json'
            ? { ...acc, ...parsed }
            : { ...acc, [name.replace(/\.json$/, '')]: parsed };
        }, {});
    } else {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    throw new Error(`Validation failed: Failed to parse JSON file: ${error.message}`);
  }
```

Leave the `isEmpty` helper and the detection loop untouched. One further change is required: the
existing throw carries only a count, while three of the six tests above assert on the offending
field's *name*. Append the names, so the exception identifies which fields failed rather than only
how many — the difference between a test that proves the validator found the right field and one
that proves only that it threw:

```js
    throw new Error(`Validation failed: ${emptyFields.length} empty field(s) found: ${emptyFields.join(', ')}`);
```

Verified: nothing in either repo matches on this message string.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test core/validateData.test.js`
Expected: PASS, 6 tests

- [ ] **Step 5: Point process.js at the directory**

Replace `core/process.js:531`:

```js
      const exportedFilePath = path.join(projectRoot, 'exported', fileName);
```

(dropping the `.json` suffix, so it resolves to the directory)

- [ ] **Step 6: Verify the whole z-processing suite**

Run: `npm test`
Expected: PASS, 22 tests

---

### Task 5: syncToFrontend copies the directory

**Repo:** z-processing

**Files:**
- Modify: `core/Utils.js:186-205`

**Interfaces:**
- Consumes: nothing
- Produces: no new exports; `syncToFrontend` gains directory handling

- [ ] **Step 1: Write the failing test**

Create `core/syncToFrontend.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { copyDirRecursive, STALE_FRONTEND_FILES } = require('./Utils');

test('copies every file in a nested directory', async () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), 'dst-'));
  fs.writeFileSync(path.join(src, 'items.json'), '{"a":1}');
  fs.mkdirSync(path.join(src, 'nested'));
  fs.writeFileSync(path.join(src, 'nested', 'deep.json'), '{"b":2}');
  await copyDirRecursive(src, path.join(dst, 'website-data'));
  assert.equal(fs.readFileSync(path.join(dst, 'website-data', 'items.json'), 'utf-8'), '{"a":1}');
  assert.equal(fs.readFileSync(path.join(dst, 'website-data', 'nested', 'deep.json'), 'utf-8'), '{"b":2}');
});

// A key dropping below the threshold leaves a file the barrel no longer imports.
test('removes a stale file already at the destination', async () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), 'dst-'));
  const target = path.join(dst, 'website-data');
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, 'gone.json'), '{"stale":true}');
  fs.writeFileSync(path.join(src, 'items.json'), '{"a":1}');
  await copyDirRecursive(src, target);
  assert.ok(!fs.existsSync(path.join(target, 'gone.json')));
});

// The 9.8MB monolith must go: leaving it in place means a stray import silently bypasses
// the split entirely. Tests the deletion itself - asserting the constant equals its own
// literal would be a tautology, and would leave this destructive path uncovered.
test('deletes the superseded monolith and its declaration, leaving other files alone', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-'));
  fs.writeFileSync(path.join(dataDir, 'website-data.json'), '{"big":true}');
  fs.writeFileSync(path.join(dataDir, 'website-data.d.json.ts'), 'declare module');
  fs.writeFileSync(path.join(dataDir, 'builds.json'), '{"keep":true}');
  await removeStaleFrontendFiles(dataDir);
  assert.equal(fs.existsSync(path.join(dataDir, 'website-data.json')), false);
  assert.equal(fs.existsSync(path.join(dataDir, 'website-data.d.json.ts')), false);
  assert.equal(fs.existsSync(path.join(dataDir, 'builds.json')), true);
});

// Runs on every sync, so the second run must not throw on files the first one removed.
test('is idempotent when the stale files are already gone', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-'));
  await removeStaleFrontendFiles(dataDir);
  await assert.doesNotReject(() => removeStaleFrontendFiles(dataDir));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test core/syncToFrontend.test.js`
Expected: FAIL — `copyDirRecursive is not a function`

- [ ] **Step 3: Write the implementation**

In `core/Utils.js`, add above `const syncToFrontend = async () => {` at line 174:

```js
// syncToFrontend copies only top-level files, so the split website-data/ directory would be
// skipped entirely without this.
const copyDirRecursive = async (src, dst) => {
  // Wipe first: a key that fell below the threshold leaves a file the barrel no longer
  // imports, and git would keep tracking it forever.
  await asyncFs.rm(dst, { recursive: true, force: true });
  await asyncFs.mkdir(dst, { recursive: true });
  for (const entry of await asyncFs.readdir(src)) {
    const from = path.join(src, entry);
    const to = path.join(dst, entry);
    if ((await asyncFs.stat(from)).isDirectory()) {
      await copyDirRecursive(from, to);
    } else {
      await asyncFs.copyFile(from, to);
    }
  }
};

// Superseded by data/website-data/. Deleted on sync so nothing can import the old blob.
const STALE_FRONTEND_FILES = ['website-data.json', 'website-data.d.json.ts'];

// Extracted so the deletion is testable without invoking syncToFrontend, which hardcodes
// the frontend repo path.
const removeStaleFrontendFiles = async (dataDir) => {
  for (const stale of STALE_FRONTEND_FILES) {
    await asyncFs.rm(path.join(dataDir, stale), { force: true });
  }
};
```

Inside `syncToFrontend`, replace the `if (stats.isFile()) { ... }` block (lines ~191-205) with:

```js
      if (stats.isDirectory()) {
        if (file === 'website-data') {
          await copyDirRecursive(sourcePath, path.join(dataDir, file));
          console.log(`Synced: ${file}/ -> data/`);
        }
        continue;
      }
      // lavaRand.js goes to utility, all others go to data
      if (file === 'lavaRand.js') {
        await asyncFs.copyFile(sourcePath, path.join(utilityDir, file));
        console.log(`Synced: ${file} -> utility/`);
      } else {
        await asyncFs.copyFile(sourcePath, path.join(dataDir, file));
        console.log(`Synced: ${file} -> data/`);
      }
```

Then, immediately after the `for` loop over `files` closes, add:

```js
    await removeStaleFrontendFiles(dataDir);
```

Add `copyDirRecursive`, `STALE_FRONTEND_FILES` and `removeStaleFrontendFiles` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test core/syncToFrontend.test.js`
Expected: PASS, 3 tests

- [ ] **Step 5: Verify the whole suite**

Run: `npm test`
Expected: PASS, 25 tests

---

### Task 6: Migrate the existing blob and prove equivalence

Running the full extractor needs the game APK and its static data. This task instead applies the *same* `partition` and `buildBarrel` used by the generator to the blob already on disk, so the toolbox work is unblocked and the migration is proven byte-for-byte. The generator path is covered by Tasks 2-5's unit tests and takes effect on the user's next real regeneration.

**Repo:** IdleonToolbox (reads z-processing's module)

**Files:**
- Create: `<scratchpad>/migrate-split.mjs` — throwaway, deleted in Step 5
- Create: `data/website-data/*.json`, `data/website-data/index.js` — generated
- Rename: `data/website-data.d.json.ts` → `data/website-data.d.ts`

- [ ] **Step 1: Write the migration script**

Create `C:\Users\Mor\AppData\Local\Temp\claude\C--Dev-idleon-toolbox\27784a5f-25ce-4913-af0c-eb5f5a218d1f\scratchpad\migrate-split.mjs`:

```js
// Throwaway. Applies the generator's own partition/buildBarrel to the committed blob, then
// asserts the split reassembles to exactly the input.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const TOOLBOX = 'C:/Dev/idleon/toolbox/IdleonToolbox';
const { partition, buildBarrel } = require('C:/Dev/idleon/toolbox/z-processing/core/splitData.js');

const data = JSON.parse(fs.readFileSync(path.join(TOOLBOX, 'data/website-data.json'), 'utf-8'));
const { heavy, shared, derived } = partition(data);

const dir = path.join(TOOLBOX, 'data/website-data');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
for (const [key, value] of Object.entries(heavy)) {
  fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(value, null, 2), 'utf-8');
}
fs.writeFileSync(path.join(dir, 'shared-data.json'), JSON.stringify(shared, null, 2), 'utf-8');
fs.writeFileSync(path.join(dir, 'index.js'),
  buildBarrel(Object.keys(heavy), Object.keys(shared)), 'utf-8');

// Equivalence: reassemble from disk and compare against the original, with itemsArray
// rebuilt exactly as the barrel rebuilds it.
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
const rebuilt = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).reduce((acc, f) =>
  f === 'shared-data.json'
    ? { ...acc, ...read(f) }
    : { ...acc, [f.replace(/\.json$/, '')]: read(f) }, {});
rebuilt.itemsArray = Object.values(rebuilt.items).map((item) => ({ ...item }));

const keychain = (o) => /^EquipmentKeychain\d+$/.test(o.rawName);
assert.deepEqual(Object.keys(rebuilt).sort(), Object.keys(data).sort(), 'key set changed');
for (const key of Object.keys(data)) {
  if (key === 'itemsArray') continue;
  assert.deepEqual(rebuilt[key], data[key], `value changed for ${key}`);
}
assert.deepEqual(
  rebuilt.itemsArray.filter((x) => !keychain(x)),
  data.itemsArray.filter((x) => !keychain(x)),
  'itemsArray changed outside the keychains'
);
// 30 keychains exist. 25 diverged (zeroed in itemsArray, real in items) - the bug. 4 are
// zeroed in BOTH (EquipmentKeychain25-28, genuinely no stat data) and must stay zeroed.
// 1 (EquipmentKeychain29) already matched. So the invariant is "every keychain mirrors
// items", not "every keychain is non-zero".
const kc = rebuilt.itemsArray.filter(keychain);
assert.equal(kc.length, 30, `expected 30 keychains, got ${kc.length}`);
for (const x of kc) {
  const src = rebuilt.items[x.rawName];
  assert.deepEqual([x.UQ1txt, x.UQ1val], [src.UQ1txt, src.UQ1val], `keychain ${x.rawName} != items`);
}
const oldKc = new Map(data.itemsArray.filter(keychain).map((x) => [x.rawName, x]));
const changed = kc.filter((x) => {
  const o = oldKc.get(x.rawName);
  return o.UQ1txt !== x.UQ1txt || o.UQ1val !== x.UQ1val;
});
assert.equal(changed.length, 25, `expected 25 keychains fixed, got ${changed.length}`);

console.log('files    ', fs.readdirSync(dir).filter((f) => f.endsWith('.json')).length);
console.log('heavy    ', Object.keys(heavy).length);
console.log('shared   ', Object.keys(shared).length);
console.log('derived  ', derived);
console.log('shared MB', (fs.statSync(path.join(dir, 'shared-data.json')).size / 1048576).toFixed(2));
console.log('EQUIVALENCE OK');
```

- [ ] **Step 2: Run it**

```bash
cd /c/Dev/idleon/toolbox/IdleonToolbox
node "C:/Users/Mor/AppData/Local/Temp/claude/C--Dev-idleon-toolbox/27784a5f-25ce-4913-af0c-eb5f5a218d1f/scratchpad/migrate-split.mjs"
```

Expected output:

```
files     26
heavy     25
shared    117
derived   [ 'itemsArray' ]
shared MB 0.94
EQUIVALENCE OK
```

If any assertion fires, **stop**. Do not proceed to Task 7 — the split is lossy and `partition` must be fixed first.

- [ ] **Step 3: Rename the declaration file**

```bash
mv data/website-data.d.json.ts data/website-data.d.ts
```

Plain `mv`, not `git mv` — `git mv` stages, and nothing in this plan touches the index. The
rename shows as an unstaged delete plus an untracked file until the user commits.

Its contents are already correct: `generateDeclarations` ran on the full object, so `itemsArray` is still declared — which matches the barrel, since the barrel still exports it.

It must stay at `data/` root rather than becoming `data/website-data/index.d.ts`: it holds `declare module '@website-data'`, an ambient declaration, and sitting beside `index.js` it would additionally be read as that module's own type file.

- [ ] **Step 4: Delete the monolith**

```bash
rm data/website-data.json
```

Plain `rm`, not `git rm`, for the same reason. The file is tracked and committed at `9086dcc42b`,
so `git checkout data/website-data.json` restores it if anything goes wrong. **Do not run this
step until Step 2 has printed `EQUIVALENCE OK`.**

- [ ] **Step 5: Delete the throwaway script**

```bash
rm "C:/Users/Mor/AppData/Local/Temp/claude/C--Dev-idleon-toolbox/27784a5f-25ce-4913-af0c-eb5f5a218d1f/scratchpad/migrate-split.mjs"
```

- [ ] **Step 6: Verify the tree**

Run: `git status --short && ls data/website-data | head -5`
Expected: `data/website-data.json` deleted, `data/website-data.d.ts` renamed, `data/website-data/` untracked with 27 files.

---

### Task 7: Repoint the alias and normalise imports

**Repo:** IdleonToolbox

**Files:**
- Modify: `tsconfig.json:25-27`
- Modify: `vitest.config.js:15`
- Modify: `pages/tools/card-search.jsx:4`
- Modify: `pages/tools/item-browser.jsx:2`
- Modify: `pages/tools/item-planner.jsx:1`
- Test: `__test__/data/website-data-barrel.test.js`

**Interfaces:**
- Consumes: `data/website-data/index.js` from Task 6
- Produces: `@website-data` resolving to the barrel in both TypeScript and Vitest

- [ ] **Step 1: Write the failing test**

Create `__test__/data/website-data-barrel.test.js`:

```js
import { describe, it, expect } from 'vitest';
import * as data from '@website-data';

describe('website-data barrel', () => {
  // 142 keys are emitted as files; itemsArray is derived in the barrel. A missing name is a
  // build break for whichever of the 116 importing files needed it.
  it('exports 143 names', () => {
    expect(Object.keys(data)).toHaveLength(143);
  });

  it('has no empty export', () => {
    const empty = Object.entries(data).filter(([, v]) =>
      v === null || v === undefined
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    expect(empty.map(([k]) => k)).toEqual([]);
  });

  it('still exports the keys that live in shared-data', () => {
    expect(data.compass).toBeDefined();
    expect(data.sigils).toBeDefined();
    expect(data.ButtonBonusNames).toBeDefined();
  });

  it('still exports the heavy keys', () => {
    expect(Object.keys(data.items).length).toBeGreaterThan(2000);
    expect(Object.keys(data.monsterDrops).length).toBeGreaterThan(0);
  });

  it('derives itemsArray from items', () => {
    expect(data.itemsArray).toEqual(Object.values(data.items));
  });

  // A bare Object.values would alias the two; today they come from separate parses, and
  // hatRack.ts-style code that mutates a copy would start corrupting items.
  it('gives itemsArray its own objects rather than aliasing items', () => {
    const first = Object.keys(data.items)[0];
    expect(data.itemsArray[0]).not.toBe(data.items[first]);
    expect(data.itemsArray[0]).toEqual(data.items[first]);
  });

  // Regression guard for the fix this change ships: commit 5921946 spread keychain stats
  // into the items literal only, leaving 25 of these at 0 for ~16 months. Asserted against
  // items rather than hardcoded, so it survives every regeneration.
  //
  // 30 keychains exist, and NOT all of them should be non-zero: EquipmentKeychain25-28 are
  // zeroed in `items` itself (genuinely no stat data) and must stay that way. The invariant
  // is that every keychain mirrors items - asserting "all non-zero" would fail on those 4.
  it('mirrors items for every keychain', () => {
    const keychains = data.itemsArray.filter((x) => /^EquipmentKeychain\d+$/.test(x.rawName));
    expect(keychains).toHaveLength(30);
    for (const kc of keychains) {
      expect(kc.UQ1txt).toBe(data.items[kc.rawName].UQ1txt);
      expect(kc.UQ1val).toBe(data.items[kc.rawName].UQ1val);
    }
  });

  // The 25 that actually carried the bug. Pinning the count stops a future regeneration
  // from silently re-zeroing them without the suite noticing.
  it('leaves exactly four keychains legitimately zeroed', () => {
    const zeroed = data.itemsArray
      .filter((x) => /^EquipmentKeychain\d+$/.test(x.rawName))
      .filter((x) => x.UQ1txt === 0 && x.UQ1val === 0)
      .map((x) => x.rawName);
    expect(zeroed).toEqual([
      'EquipmentKeychain25', 'EquipmentKeychain26', 'EquipmentKeychain27', 'EquipmentKeychain28'
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __test__/data/website-data-barrel.test.js`
Expected: FAIL — the alias still points at the deleted `data/website-data.json`

- [ ] **Step 3: Repoint both aliases**

`tsconfig.json`, replacing lines 25-27:

```json
      "@website-data": [
        "data/website-data/index.js"
      ]
```

`vitest.config.js:15`:

```js
      { find: '@website-data', replacement: path.resolve(__dirname, 'data/website-data/index.js') },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __test__/data/website-data-barrel.test.js`
Expected: PASS, 8 tests

- [ ] **Step 5: Normalise the three bare-path imports**

These resolve through `baseUrl` rather than the alias, so they bypass the ambient declaration and lose their types.

`pages/tools/card-search.jsx:4` — change `from 'data/website-data'` to `from '@website-data'`.
`pages/tools/item-browser.jsx:2` — same.
`pages/tools/item-planner.jsx:1` — same.

- [ ] **Step 6: Verify no bare-path imports remain**

Run: `grep -rn "from 'data/website-data'" --include=*.js --include=*.jsx --include=*.ts --include=*.tsx pages components parsers utility hooks`
Expected: no output

- [ ] **Step 7: Update CLAUDE.md, which this change falsifies in three places**

`CLAUDE.md` documents the old layout and will actively mislead after this change.

Under **TypeScript → Type definitions**, the auto-generated list names the declaration file by its
old name. Change:

```
  - `data/website-data.d.json.ts` — types for `website-data.json` (generated by `z-processing/typeGenerator.js`)
```

to:

```
  - `data/website-data.d.ts` — types for the `@website-data` module (generated by `z-processing/tools/typeGenerator.js`)
```

Under **TypeScript → Path aliases**, change `` `@website-data` → `data/website-data.json` `` to
`` `@website-data` → `data/website-data/index.js` (a barrel over per-key files) ``.

That same section opens "Configured in both `tsconfig.json` and `next.config.js`". Verified false:
`next.config.js` contains no `alias`, `resolve`, `webpack` or `turbopack` key at all — Next reads
`tsconfig.json`'s `paths` natively. Change it to "Configured in `tsconfig.json` (Next reads its
`paths` natively) and mirrored in `vitest.config.js`".

Finally, under **Obfuscated code**, `` @IdleonToolbox/data/website-data.json `` no longer exists as
a file. Change that bullet to point at `@IdleonToolbox/data/website-data/` and note that
`shared-data.json` holds the many small keys while large keys get their own file.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS — 60 files, 1,077 tests (58 / 1,062 at baseline, plus Task 1's 7 and this task's 8)

If a parser test fails on a keychain value, that is the intended behaviour change — confirm the new value matches `items[rawName]` and update the fixture. Any other failure is a real regression.

---

### Task 8: Build, measure, compare

**Repo:** IdleonToolbox

**Files:** none modified — this task produces measurements

- [ ] **Step 1: Build**

```bash
NODE_ENV=production npx next build
```

Expected: `✓ Compiled successfully`. A failure naming `@website-data` means the alias is wrong; a failure naming a specific key means `partition` dropped it.

- [ ] **Step 2: Dump the after-manifest**

```bash
node utility/chunk-manifest.mjs out > "C:/Users/Mor/AppData/Local/Temp/claude/C--Dev-idleon-toolbox/27784a5f-25ce-4913-af0c-eb5f5a218d1f/scratchpad/manifest-after.json"
```

- [ ] **Step 3: Compare**

```bash
node -e "
const S='C:/Users/Mor/AppData/Local/Temp/claude/C--Dev-idleon-toolbox/27784a5f-25ce-4913-af0c-eb5f5a218d1f/scratchpad/';
const before=new Map(require(S+'manifest-before.json').map(r=>[r.page,r.bytes]));
const after=require(S+'manifest-after.json');
const mb=b=>(b/1048576).toFixed(2);
let worse=[],delta=0;
for(const r of after){
  const b=before.get(r.page); if(b===undefined) continue;
  delta+=r.bytes-b;
  if(r.bytes>b) worse.push([r.page,mb(b),mb(r.bytes)]);
}
console.log('pages before',before.size,'after',after.length);
console.log('total delta',mb(delta)+'MB');
console.log('pages that GREW:',worse.length);
worse.slice(0,20).forEach(x=>console.log('  ',x[0],x[1],'->',x[2]));
for(const p of ['account/world-7/research.html','dashboard.html','tools/builds/warrior.html','index.html']){
  const r=after.find(x=>x.page===p);
  if(r) console.log(p, mb(before.get(p)||0),'->',mb(r.bytes),'| shared-data present:',r.chunks.some(c=>/shared/.test(c)));
}
"
```

Acceptance: `pages that GREW` is **0**. `account/world-7/research.html` drops substantially. Record whether `shared-data` appears on pages importing no small keys — either answer is acceptable, but it must be recorded.

- [ ] **Step 4: Trace the four pages**

Serve the build, then use chrome-devtools MCP at 4× CPU throttling and Slow 4G:

```bash
npx serve@latest out -l 3002 --no-clipboard
```

Trace `http://localhost:3002/account/world-7/research`, `/dashboard`, `/tools/builds/warrior`, and `/` — the last as a control that must not regress. Record the LCP breakdown (TTFB / load delay / load duration / render delay) for each.

- [ ] **Step 5: Eyeball the keychain change**

Open a page rendering `ItemDisplay` for an `EquipmentKeychain*` item. It now shows a "Misc" row of the form `+1,2,5 Base Defence` where it previously showed none. Confirm the text is sensible rather than malformed — `UQ1val` is a comma-joined triple (`"1,2,5"`), not a scalar, so it renders as three tiers.

- [ ] **Step 6: Report**

Summarise: total bytes moved, pages that grew (expected 0), the four pages' before/after chunk bytes and LCP, whether `shared-data` tree-shakes, and whether `tools/builds/warrior.html` still references `monsterDrops`.

---

### Task 9: The builds-page anomaly — 2 hour timebox

Only if Task 8 Step 6 shows `tools/builds/warrior.html` still referencing `monsterDrops.json`.

**Repo:** IdleonToolbox

**Files:** unknown until diagnosed — this is an investigation

Context: `monsterDrops` is imported only by `parsers/class-specific/{compass,grimoire,tesseract}.ts`, `parsers/generated-types.ts`, `pages/account/class-specific/grimoire.jsx`, and `pages/tools/guaranteed-drop-calculator.jsx`. None is in the builds tree, yet the spike showed builds pages pulling it. 137 of 242 pages are `/tools/builds/*`, so this is 2.08 MB on 57% of the site.

- [ ] **Step 1: Confirm it is grouping, not a real import path**

```bash
node -e "
const fs=require('fs');const path=require('path');
const seen=new Set();const stack=['pages/tools/builds/[slug].jsx'];const parent=new Map();
const RE=/(?:import\s(?:[^'\"]*?\sfrom\s)?|export\s[^'\"]*?\sfrom\s)['\"]([^'\"]+)['\"]/g;
const ALIAS={'@components':'components','@parsers':'parsers','@utility':'utility','@hooks':'hooks'};
const resolve=(from,spec)=>{
  let base;
  if(spec.startsWith('.')) base=path.join(path.dirname(from),spec);
  else { const k=Object.keys(ALIAS).find(a=>spec.startsWith(a+'/')); if(!k) return null;
         base=spec.replace(k,ALIAS[k]); }
  for(const e of ['','.ts','.tsx','.js','.jsx','/index.ts','/index.tsx','/index.js','/index.jsx'])
    if(fs.existsSync(base+e)&&fs.statSync(base+e).isFile()) return (base+e).split(path.sep).join('/');
  return null;
};
while(stack.length){
  const f=stack.pop(); if(seen.has(f))continue; seen.add(f);
  let src; try{src=fs.readFileSync(f,'utf8')}catch{continue}
  if(/monsterDrops/.test(src)&&/@website-data/.test(src)){
    let chain=[f],c=f; while(parent.has(c)){c=parent.get(c);chain.push(c)}
    console.log('REACHES monsterDrops via:'); chain.reverse().forEach((x,i)=>console.log('  '.repeat(i+1)+x));
  }
  for(const m of src.matchAll(RE)){
    const r=resolve(f,m[1]); if(r&&!seen.has(r)){parent.set(r,f);stack.push(r)}
  }
}
console.log('files reachable from the builds route:',seen.size);
"
```

If it prints a chain, there is a real import path and the fix is to break it (move the offending symbol, or `import()` it dynamically). If it prints none, Turbopack's chunk grouping is over-including and Step 2 applies.

- [ ] **Step 2: Check the shared layout**

`pages/_app.jsx` renders on every page. Confirm nothing it imports reaches `@website-data`:

```bash
grep -n "@website-data\|@parsers" pages/_app.jsx components/common/WaitForRouter.jsx components/common/CrawlLinks.jsx
```

A parser import in `_app.jsx` would put the whole parser graph — and `monsterDrops` with it — on all 242 pages.

- [ ] **Step 3: Decide at the timebox**

If root-caused within 2 hours, fix it and re-run Task 8 Steps 1-3. If not, stop. Record in the spec's "Open, to be settled by measurement" section: what was ruled out, the exact chunk bytes involved, and the reproduction command. The split ships on its own merits either way.

---

## Notes for the executor

- **Nothing here is committed.** The user commits. Leave every change in the working tree and say what was touched.
- Task 6 must print `EQUIVALENCE OK` before Task 7 starts. If it does not, the split is lossy — fix `partition`, do not work around it.
- Task 1 Step 5 must run against a clean tree. If the baseline is captured after any change, it is not a baseline.
- The 25 keychains changing from `0` to real values is intended, is the fix for a 16-month-old bug, and is user-visible. Do not "correct" it back.
- If `npx next build` reports another build already running, delete `.next/lock` and nothing else. The 50+ node processes are the user's local servers.
- z-processing regeneration needs the game APK and is not part of this plan. Tasks 2-5 are covered by unit tests; they take effect on the user's next real data run.
