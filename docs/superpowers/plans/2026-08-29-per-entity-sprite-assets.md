# Per-Entity Sprite Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure monster/NPC asset extraction into per-entity folders with static + animation-state variants (idle/walk/death), plus a generated manifest and a frontend helper that replaces ad-hoc path string building.

**Architecture:** z-processing gains a new generator (`features/_tooling/entitySprites.js`) that slices each monster's single sprite sheet into state ranges using `MovingFrame`/`DeathFrame`/MBS `durations`, writes `exported/monsters/<rawName>/` and `exported/npc-sprites/<name>/`, and emits `sprite-manifest.json`. Sync merge-copies these into `IdleonToolbox/public/monsters/` and `public/npcs/` (never deleting hand-added files). The frontend gains `utility/spriteImages.js` (`monsterImage`, `npcImage`) with manifest-backed fallbacks; dynamic call sites migrate to it. Old flat `afk_targets/`/`npcs/` outputs keep being generated and synced, so anything not migrated keeps working.

**Tech Stack:** Node.js (CommonJS) + sharp + omggif in z-processing (`node --test core/*.test.js`); Next.js + vitest in IdleonToolbox.

**Spec:** Inline, see Context below (no separate spec doc; this plan came out of a two-repo investigation on 2026-08-29).

## Global Constraints

- **NO git commits in any task.** The user commits manually. Tasks end at "tests pass".
- No em dashes in any UI copy or code comments (use a colon instead).
- No `useMemo`/IIFEs in React code (React Compiler handles memoization).
- `data/website-data/*` and `data/sprite-manifest.json` are generated: never hand-edit; fix z-processing and re-run the pipeline.
- z-processing is CommonJS (`require`/`module.exports`); IdleonToolbox uses ES modules.
- The in-app Browser pane cannot load this app. Verify via Playwright MCP against `npm run build` + `npx serve out` (or `npm run start`).
- Repos: `C:\Dev\idleon\toolbox\z-processing` and `C:\Dev\idleon\toolbox\IdleonToolbox`. Paths below are relative to whichever repo the task names.

## Context (what the investigation found)

- Each monster has ONE sprite sheet + ONE animation record. States are frame ranges: `[0..MovingFrame)` = idle, `[MovingFrame..DeathFrame)` = walk, `[DeathFrame..numFrames)` = death. Per-frame ms delays come from the MBS `durations` array.
- `buildSpriteMap` (features/monsters/spriteMap.js:196-202) already returns `durations`, but `features/monsters/index.js:16-24` doesn't copy it onto monsters. `features/npcRoster.js:30-35` likewise drops `record.durations`. Consequence: NPC GIFs get a flat 100ms delay and include the hidden 1ms "reset" frame 0 (sprites.js:135-137 sees an empty array).
- `generateMonsterPNGs` writes only frame 0 to flat `exported/afk_targets/{Name}.png` (Name-keyed, collision-prone: the `Ghost_ghost` hack in `parsers/class-specific/compass.ts:301`).
- `syncToFrontend` (core/Utils.js:257) copies `['afk_targets', 'npcs']` file-by-file, flat only, never wipes. `public/npcs` and `public/afk_targets` contain ~50 hand-added files that must survive (Chesty.png, Captain.gif, Boat.gif, world pngs, Divinity.png, Dog.png, Glimbo.png, Nothing.png, ...). Those hand-added assets and their call sites are deliberately NOT migrated.
- Tree/Bug/Fish monsters without their own MBS record share composite sheets (`sprite-2-17`/`sprite-2-57`/`sprite-2-62`) with `spriteFrame = DeathFrame` as a single-frame index (features/monsters/index.js:26-49). Range slicing is meaningless for them: static only.
- `Mface{N}.png` head icons are pre-cut, face-id-keyed, shared many-to-one, live in `public/data/`. They stay there; the manifest records each monster's face id.
- 96/410 monsters have no body art (bosses etc.); the helper's fallback chain (body -> face -> legacy path) turns their broken images into face icons. Extracting boss sheets is a separate follow-up.

---

### Task 1: Plumb `durations` through monsters and npcRoster (z-processing)

**Files:**
- Modify: `features/monsters/index.js:16-24`
- Modify: `features/npcRoster.js:29-35`

**Interfaces:**
- Produces: `monsters[rawName].durations` (number[] of per-frame ms) and `npcRoster[name].durations` (number[]). Task 3's generator and the existing `generateNpcGIFs` reset-frame/timing branch consume these.

- [ ] **Step 1: Copy durations in features/monsters/index.js**

In the `spriteMap` loop, after `monsters[internalId].spriteNumFrames = entry.numFrames;` add:

```js
        monsters[internalId].durations = entry.durations;
```

- [ ] **Step 2: Copy durations in features/npcRoster.js**

Change the roster entry to:

```js
      roster[record.name] = {
        sprite: record.sprite,
        spriteAcross: record.across,
        spriteDown: record.down,
        spriteNumFrames: record.numFrames,
        durations: record.durations
      };
```

- [ ] **Step 3: Run existing tests**

Run in z-processing: `npm test`
Expected: all existing `core/*.test.js` pass (nothing reads these fields yet).

Note: this also fixes the live NPC GIF bug for free. `generateNpcGIFs` (sprites.js:135-137, 152) already branches on `npcData.durations`; once populated, the reset frame is skipped and real delays are used. Verified in Task 6.

---

### Task 2: Extract shared `encodeGif` helper (z-processing, behavior-preserving refactor)

**Files:**
- Modify: `features/_tooling/sprites.js`

**Interfaces:**
- Produces: `encodeGif(frames, durations)` -> `Buffer` and `extractFrames(sheetPath, across, down, numFrames)` -> `[{data, width, height}]`, both added to `module.exports`. Task 3 imports both. `frames` are raw RGBA objects as `extractFrames` returns them; `durations[fi]` is ms (defaults to 100 when missing).

- [ ] **Step 1: Add encodeGif above generateNpcGIFs**

```js
// Shared GIF encoder: palette from all frames, index 0 transparent, centisecond delays.
function encodeGif(frames, durations) {
  const { width, height } = frames[0];
  const { palette, indexFor } = buildPalette(frames);
  const bufSize = width * height * frames.length * 5 + 1024;
  const buf = Buffer.alloc(bufSize);
  const gw = new GifWriter(buf, width, height, { loop: 0, palette });
  for (let fi = 0; fi < frames.length; fi++) {
    const frame = frames[fi];
    const delay = Math.max(1, Math.round((durations[fi] ?? 100) / 10));
    const indices = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const a = frame.data[i * 4 + 3];
      indices[i] = a < 128 ? 0 : indexFor(frame.data[i * 4], frame.data[i * 4 + 1], frame.data[i * 4 + 2]);
    }
    gw.addFrame(0, 0, width, height, indices, { delay, disposal: 2, transparent: 0 });
  }
  return buf.slice(0, gw.end());
}
```

- [ ] **Step 2: Use it in generateNpcGIFs**

Replace lines 140-167 (from `const { width, height } = animFrames[0];` through the `fs.writeFileSync(...)`) with:

```js
      fs.writeFileSync(path.join(gifOutputDir, `${npcName}.gif`), encodeGif(animFrames, frameDurations));
```

(The `{ width, height }` destructure must stay if `pngOutputDir` still uses it below; keep `const { width, height } = animFrames[0];` for that.)

- [ ] **Step 3: Use it in both generateAllSprites branches**

Multi-variant branch: replace the palette/buffer/loop block (lines 226-248) with:

```js
            fs.writeFileSync(path.join(gifDir, `${record.name}${vi}.gif`), encodeGif(varFrames, varDurations));
```

Single-animation branch: replace lines 256-279 with:

```js
          fs.writeFileSync(path.join(gifDir, `${record.name}.gif`), encodeGif(animFrames, frameDurations));
```

- [ ] **Step 4: Export the helpers**

```js
module.exports = { generateMonsterPNGs, generateNpcGIFs, generateAllSprites, generateFontAtlasSprites, extractFrames, encodeGif };
```

- [ ] **Step 5: Run tests + syntax check**

Run: `npm test` and `node -e "require('./features/_tooling/sprites')"`
Expected: pass / no throw.

---

### Task 3: New per-entity generator + manifest (z-processing, TDD)

**Files:**
- Create: `features/_tooling/entitySprites.js`
- Test: `core/entitySprites.test.js` (lives in core/ so the `node --test core/*.test.js` glob picks it up)

**Interfaces:**
- Consumes: `extractFrames`, `encodeGif` from `./sprites` (Task 2); `monster.durations` / `npcRoster[name].durations` (Task 1).
- Produces:
  - `monsterVariantRanges(monster)` -> `{ staticFrame, ranges }` where `ranges` is `{ idle?: [start, end), walk?: [start, end), death?: [start, end) }` (pure, exported for tests).
  - `generateEntitySprites({ monsters, npcRoster, graphicsDir, monstersOutDir, npcsOutDir })` -> manifest object:
    ```json
    {
      "monsters": { "mushG": { "name": "Green_Mushroom", "face": 1, "variants": ["static", "idle", "walk", "death"] } },
      "monstersByName": { "Green_Mushroom": "mushG" },
      "npcs": { "Scripticus": ["static", "idle"] }
    }
    ```
  - On-disk layout: `<monstersOutDir>/<rawName>/static.png|idle.gif|walk.gif|death.gif`, `<npcsOutDir>/<name>/static.png|idle.gif`.

- [ ] **Step 1: Write the failing test**

`core/entitySprites.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { monsterVariantRanges } = require('../features/_tooling/entitySprites');

test('normal monster splits into idle/walk/death ranges', () => {
  // Bandit_Bob: 26 frames, MovingFrame 4, DeathFrame 13
  const { staticFrame, ranges } = monsterVariantRanges({
    spriteNumFrames: 26, MovingFrame: 4, DeathFrame: 13
  });
  assert.strictEqual(staticFrame, 0);
  assert.deepStrictEqual(ranges, { idle: [0, 4], walk: [4, 13], death: [13, 26] });
});

test('spriteFrame fallback (Tree/Bug/Fish shared sheets) is static-only', () => {
  const { staticFrame, ranges } = monsterVariantRanges({
    spriteNumFrames: 20, MovingFrame: 2, DeathFrame: 5, spriteFrame: 7
  });
  assert.strictEqual(staticFrame, 7);
  assert.deepStrictEqual(ranges, {});
});

test('no MovingFrame: whole sheet is one idle animation', () => {
  const { ranges } = monsterVariantRanges({ spriteNumFrames: 6 });
  assert.deepStrictEqual(ranges, { idle: [0, 6] });
});

test('single-frame ranges are dropped', () => {
  // MovingFrame 1 leaves a 1-frame idle: no idle gif
  const { ranges } = monsterVariantRanges({ spriteNumFrames: 10, MovingFrame: 1, DeathFrame: 8 });
  assert.deepStrictEqual(ranges, { walk: [1, 8], death: [8, 10] });
});

test('DeathFrame missing or <= MovingFrame: rest of sheet is walk', () => {
  const { ranges } = monsterVariantRanges({ spriteNumFrames: 10, MovingFrame: 4 });
  assert.deepStrictEqual(ranges, { idle: [0, 4], walk: [4, 10] });
});

test('out-of-range markers are ignored', () => {
  const { ranges } = monsterVariantRanges({ spriteNumFrames: 10, MovingFrame: 40, DeathFrame: 50 });
  assert.deepStrictEqual(ranges, { idle: [0, 10] });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `../features/_tooling/entitySprites`.

- [ ] **Step 3: Implement entitySprites.js**

```js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { extractFrames, encodeGif } = require('./sprites');

const GIF_MIN_FRAMES = 2;

// A monster has one sheet and one animation record; states are frame ranges within it:
//   [0..MovingFrame) idle, [MovingFrame..DeathFrame) walk, [DeathFrame..numFrames) death.
// Shared-sheet fallbacks (Tree/Bug/Fish set spriteFrame) get a static frame only:
// slicing a composite sheet would animate other mobs' frames.
function monsterVariantRanges(monster) {
  const numFrames = monster.spriteNumFrames;
  if (monster.spriteFrame != null) return { staticFrame: monster.spriteFrame, ranges: {} };
  const ranges = {};
  const valid = (v) => Number.isInteger(v) && v > 0 && v < numFrames;
  const moving = valid(monster.MovingFrame) ? monster.MovingFrame : null;
  const death = valid(monster.DeathFrame) ? monster.DeathFrame : null;
  if (moving != null) {
    if (moving >= GIF_MIN_FRAMES) ranges.idle = [0, moving];
    if (death != null && death > moving) {
      if (death - moving >= GIF_MIN_FRAMES) ranges.walk = [moving, death];
      if (numFrames - death >= GIF_MIN_FRAMES) ranges.death = [death, numFrames];
    } else if (numFrames - moving >= GIF_MIN_FRAMES) {
      ranges.walk = [moving, numFrames];
    }
  } else if (numFrames >= GIF_MIN_FRAMES) {
    ranges.idle = [0, numFrames];
  }
  return { staticFrame: 0, ranges };
}

// Frame 0 of a sheet can be a 1ms hidden "reset" pose: drop it when a range starts there.
function sliceRange(frames, durations, [start, end]) {
  let s = start;
  if (s === 0 && durations[0] === 1 && end - s > 1) s = 1;
  return { frames: frames.slice(s, end), durations: durations.slice(s, end) };
}

async function writeStatic(sheetPath, across, down, frameIdx, outPath) {
  const meta = await sharp(sheetPath).metadata();
  const frameW = Math.floor(meta.width / across);
  const frameH = Math.floor(meta.height / down);
  const col = frameIdx % across;
  const row = Math.floor(frameIdx / across);
  await sharp(sheetPath)
    .extract({ left: col * frameW, top: row * frameH, width: frameW, height: frameH })
    .toFile(outPath);
}

async function generateEntitySprites({ monsters, npcRoster, graphicsDir, monstersOutDir, npcsOutDir }) {
  console.log(`Generating per-entity sprites into ${monstersOutDir} and ${npcsOutDir}`);
  fs.rmSync(monstersOutDir, { recursive: true, force: true });
  fs.rmSync(npcsOutDir, { recursive: true, force: true });
  fs.mkdirSync(monstersOutDir, { recursive: true });
  fs.mkdirSync(npcsOutDir, { recursive: true });

  const manifest = { monsters: {}, monstersByName: {}, npcs: {} };

  // Type === 'Monster' last so monstersByName prefers real monsters on Name collisions
  // (same rule generateMonsterPNGs uses for its last-writer-wins ordering).
  const entries = Object.entries(monsters).sort((a, b) =>
    (a[1].Type === 'Monster' ? 1 : 0) - (b[1].Type === 'Monster' ? 1 : 0));

  let monsterCount = 0;
  for (const [rawName, monster] of entries) {
    if (!monster.sprite || !monster.Name) continue;
    const sheetPath = path.join(graphicsDir, `${monster.sprite}.png`);
    if (!fs.existsSync(sheetPath)) continue;
    try {
      const outDir = path.join(monstersOutDir, rawName);
      fs.mkdirSync(outDir, { recursive: true });
      const { staticFrame, ranges } = monsterVariantRanges(monster);
      await writeStatic(sheetPath, monster.spriteAcross, monster.spriteDown, staticFrame, path.join(outDir, 'static.png'));
      const variants = ['static'];
      const durations = monster.durations || [];
      if (Object.keys(ranges).length > 0 && durations.length > 1) {
        const frames = await extractFrames(sheetPath, monster.spriteAcross, monster.spriteDown, monster.spriteNumFrames);
        for (const [variant, range] of Object.entries(ranges)) {
          const slice = sliceRange(frames, durations, range);
          if (slice.frames.length < GIF_MIN_FRAMES) continue;
          fs.writeFileSync(path.join(outDir, `${variant}.gif`), encodeGif(slice.frames, slice.durations));
          variants.push(variant);
        }
      }
      manifest.monsters[rawName] = { name: monster.Name, face: monster.MonsterFace ?? null, variants };
      manifest.monstersByName[monster.Name] = rawName;
      monsterCount++;
    } catch { /* skip missing or broken sheets */ }
  }

  let npcCount = 0;
  for (const [npcName, npcData] of Object.entries(npcRoster || {})) {
    if (!npcData.sprite) continue;
    const sheetPath = path.join(graphicsDir, `${npcData.sprite}.png`);
    if (!fs.existsSync(sheetPath)) continue;
    try {
      const outDir = path.join(npcsOutDir, npcName);
      fs.mkdirSync(outDir, { recursive: true });
      const across = npcData.spriteAcross ?? 1;
      const down = npcData.spriteDown ?? 1;
      const durations = npcData.durations || [];
      const hasReset = durations[0] === 1 && (npcData.spriteNumFrames ?? 1) > 1;
      await writeStatic(sheetPath, across, down, hasReset ? 1 : 0, path.join(outDir, 'static.png'));
      const variants = ['static'];
      const frames = await extractFrames(sheetPath, across, down, npcData.spriteNumFrames);
      const slice = sliceRange(frames, durations, [0, frames.length]);
      if (slice.frames.length >= GIF_MIN_FRAMES && durations.length > 1) {
        fs.writeFileSync(path.join(outDir, 'idle.gif'), encodeGif(slice.frames, slice.durations));
        variants.push('idle');
      }
      manifest.npcs[npcName] = variants;
      npcCount++;
    } catch { /* skip missing or broken sheets */ }
  }

  console.log(`Generated per-entity sprites for ${monsterCount} monsters, ${npcCount} npcs`);
  return manifest;
}

module.exports = { generateEntitySprites, monsterVariantRanges };
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all `entitySprites.test.js` tests PASS, existing tests still pass.

---

### Task 4: Wire generator into the pipeline + gitignore (z-processing)

**Files:**
- Modify: `core/process.js` (the `Sprite/GIF Generation` block, ~lines 585-594)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `generateEntitySprites` (Task 3), `exportToFile(name, data, true)` from `core/Utils.js` (third arg `true` writes to `exported/`, so it syncs to `IdleonToolbox/data/`).
- Produces: `exported/monsters/<rawName>/*`, `exported/npc-sprites/<name>/*`, `exported/sprite-manifest.json`. Task 5 syncs these; Task 7 imports the manifest.

- [ ] **Step 1: Add the require**

Next to the existing sprites require in `core/process.js`:

```js
const { generateEntitySprites } = require('../features/_tooling/entitySprites');
```

- [ ] **Step 2: Extend the generation block**

`exported/npc-sprites` is a separate dir because `generateNpcGIFs` wipes `exported/npcs` inside the same `Promise.all` (racing a subfolder writer would lose files). Replace the block with:

```js
    const graphicsDir = path.join(projectRoot, 'resources', 'graphics', '1x');
    const allSpriteRecords = buildAllSpriteRecords(mbsPath);
    const [, , , , entityManifest] = await Promise.all([
      generateMonsterPNGs(monsters, graphicsDir, path.join(projectRoot, 'exported', 'afk_targets')),
      generateNpcGIFs(npcRoster, graphicsDir, path.join(projectRoot, 'exported', 'npcs')),
      generateAllSprites(allSpriteRecords, graphicsDir, path.join(projectRoot, 'exported', 'sprites')),
      generateFontAtlasSprites(graphicsDir, path.join(projectRoot, 'exported', 'font-sprites')),
      generateEntitySprites({
        monsters,
        npcRoster,
        graphicsDir,
        monstersOutDir: path.join(projectRoot, 'exported', 'monsters'),
        npcsOutDir: path.join(projectRoot, 'exported', 'npc-sprites')
      }),
    ]);
    await exportToFile('sprite-manifest.json', entityManifest, true);
```

- [ ] **Step 3: Gitignore the new output dirs**

Add to `.gitignore` next to the other `/exported/` lines:

```
/exported/monsters
/exported/npc-sprites
```

- [ ] **Step 4: Syntax check**

Run: `node -e "require('./core/process')"` and `npm test`
Expected: no throw / pass.

---

### Task 5: Recursive merge sync (z-processing, TDD)

**Files:**
- Modify: `core/Utils.js` (syncToFrontend, ~line 255)
- Test: `core/mergeDirRecursive.test.js`

**Interfaces:**
- Produces: `mergeDirRecursive(src, dst)` exported from `core/Utils.js`: copies recursively, creates dirs, overwrites files, NEVER deletes anything in dst. syncToFrontend maps `exported/monsters -> public/monsters` and `exported/npc-sprites -> public/npcs`.

- [ ] **Step 1: Write the failing test**

`core/mergeDirRecursive.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mergeDirRecursive } = require('./Utils');

test('merge copies nested files and preserves existing dst files', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-test-'));
  const src = path.join(tmp, 'src');
  const dst = path.join(tmp, 'dst');
  fs.mkdirSync(path.join(src, 'mushG'), { recursive: true });
  fs.writeFileSync(path.join(src, 'mushG', 'static.png'), 'new');
  fs.mkdirSync(dst, { recursive: true });
  fs.writeFileSync(path.join(dst, 'handmade.png'), 'keep me');

  await mergeDirRecursive(src, dst);

  assert.strictEqual(fs.readFileSync(path.join(dst, 'mushG', 'static.png'), 'utf-8'), 'new');
  assert.strictEqual(fs.readFileSync(path.join(dst, 'handmade.png'), 'utf-8'), 'keep me');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('merge overwrites files but keeps extra files in existing subdirs', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-test-'));
  const src = path.join(tmp, 'src');
  const dst = path.join(tmp, 'dst');
  fs.mkdirSync(path.join(src, 'Scripticus'), { recursive: true });
  fs.writeFileSync(path.join(src, 'Scripticus', 'idle.gif'), 'v2');
  fs.mkdirSync(path.join(dst, 'Scripticus'), { recursive: true });
  fs.writeFileSync(path.join(dst, 'Scripticus', 'idle.gif'), 'v1');
  fs.writeFileSync(path.join(dst, 'Scripticus', 'manual.png'), 'keep');

  await mergeDirRecursive(src, dst);

  assert.strictEqual(fs.readFileSync(path.join(dst, 'Scripticus', 'idle.gif'), 'utf-8'), 'v2');
  assert.strictEqual(fs.readFileSync(path.join(dst, 'Scripticus', 'manual.png'), 'utf-8'), 'keep');
  fs.rmSync(tmp, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, `mergeDirRecursive` is not a function.

- [ ] **Step 3: Implement in core/Utils.js**

Add near `copyDirRecursive`:

```js
// Recursive add/overwrite copy that never deletes anything in dst. Used for the
// per-entity sprite dirs, where public/ carries hand-added files that must survive.
const mergeDirRecursive = async (src, dst) => {
  await asyncFs.mkdir(dst, { recursive: true });
  const entries = await asyncFs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await mergeDirRecursive(from, to);
    } else {
      await asyncFs.copyFile(from, to);
    }
  }
};
```

Add to `module.exports`.

- [ ] **Step 4: Use it in syncToFrontend**

After the existing `spriteDirs` loop add:

```js
    // Per-entity sprite dirs: merge-copy so hand-added files in public/ survive.
    const entityDirMap = { monsters: 'monsters', 'npc-sprites': 'npcs' };
    for (const [srcName, dstName] of Object.entries(entityDirMap)) {
      const srcDir = path.join(exportedDir, srcName);
      try {
        await asyncFs.access(srcDir);
      } catch {
        continue;
      }
      await mergeDirRecursive(srcDir, path.join(publicDir, dstName));
      console.log(`Synced: ${srcName}/ -> public/${dstName}/`);
    }
```

Also check the top-level file-copy loop at the start of syncToFrontend: it skips directories (except `website-data`), so `exported/monsters` and `exported/npc-sprites` are already ignored there. `sprite-manifest.json` is a top-level file and lands in `IdleonToolbox/data/` automatically.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS (including the existing `core/syncToFrontend.test.js`).

---

### Task 6: Run the pipeline and verify outputs (z-processing)

**Files:** none (execution + inspection)

- [ ] **Step 1: Run the pipeline**

Run in z-processing: `node createLatestVersion.js` (the routine full run; it re-extracts from the existing apks/asars and ends with syncToFrontend). Takes several minutes.

- [ ] **Step 2: Verify per-entity outputs exist**

```powershell
(Get-ChildItem C:\Dev\idleon\toolbox\IdleonToolbox\public\monsters -Directory).Count
(Get-ChildItem C:\Dev\idleon\toolbox\IdleonToolbox\public\npcs -Directory).Count
Get-ChildItem C:\Dev\idleon\toolbox\IdleonToolbox\public\monsters\mushG
Get-ChildItem C:\Dev\idleon\toolbox\IdleonToolbox\public\npcs\Scripticus
```

Expected: ~275 monster dirs, ~118 npc dirs; `mushG` has `static.png` plus gifs; `Scripticus` has `static.png` + `idle.gif`.

- [ ] **Step 3: Verify hand-added files survived**

```powershell
Test-Path C:\Dev\idleon\toolbox\IdleonToolbox\public\npcs\Chesty.png
Test-Path C:\Dev\idleon\toolbox\IdleonToolbox\public\npcs\Captain.gif
Test-Path C:\Dev\idleon\toolbox\IdleonToolbox\public\afk_targets\Boat.gif
```

Expected: all True (also confirm flat `public\npcs\Scripticus.gif` still exists).

- [ ] **Step 4: Verify the manifest**

```powershell
$m = Get-Content C:\Dev\idleon\toolbox\IdleonToolbox\data\sprite-manifest.json | ConvertFrom-Json
$m.monsters.mushG
$m.monstersByName.Green_Mushroom
$m.npcs.Scripticus
```

Expected: mushG entry with `name Green_Mushroom`, a face id, variants including static; `monstersByName.Green_Mushroom -> mushG`; Scripticus `["static","idle"]`. Also spot-check `$m.monstersByName.Ghost` resolves to the event mob per the Monster-type-wins rule (Type 'Monster' processed last), and that a Tree monster (e.g. a rawName with `spriteFrame`) has variants `["static"]` only.

- [ ] **Step 5: Verify GIF timing fix**

Open `public\npcs\Scripticus\idle.gif` and the regenerated flat `public\npcs\Scripticus.gif` in a browser; frame delays should now vary (not a uniform 100ms tick) and the animation should not flash a blank/reset first frame. Open `public\monsters\<some Monster rawName>\walk.gif` and `death.gif` and confirm they show walking/dying frames, not the whole sheet cycle.

---

### Task 7: Frontend sprite helper (IdleonToolbox, TDD)

**Files:**
- Create: `utility/spriteImages.js`
- Modify: `utility/helpers.js:396-402` (remove getActivityIcon), `components/characters/Activity.jsx:2,30`, `components/dashboard/Characters.jsx:4,116`
- Test: `__test__/spriteImages.test.js`

**Interfaces:**
- Consumes: `prefix` from `@utility/helpers`, `data/sprite-manifest.json` (Task 6 output, committed by the user).
- Produces (all return complete `src` strings with prefix and extension):
  - `monsterImage(nameOrRaw, variant = 'static')`: variants `'static' | 'idle' | 'walk' | 'death' | 'face'`. Accepts rawName or display Name. Fallback chain: requested variant -> static -> `data/Mface<face>.png` -> legacy `afk_targets/<nameOrRaw>.png`.
  - `npcImage(name, variant = 'idle')`: variants `'idle' | 'static'`. Falls back to legacy `npcs/<name>.gif`.
  - `getActivityIcon(character)` (moved here from helpers.js, now returns a full src).

Note the import direction: spriteImages.js imports from helpers.js, never the reverse (avoids a cycle).

- [ ] **Step 1: Write the failing test**

`__test__/spriteImages.test.js`:

```js
import { describe, expect, it, vi } from 'vitest';

vi.mock('../data/sprite-manifest.json', () => ({
  default: {
    monsters: {
      mushG: { name: 'Green_Mushroom', face: 1, variants: ['static', 'idle', 'walk', 'death'] },
      moonman: { name: 'Moonmoon', face: 12, variants: ['static'] },
      Boss2A: { name: 'Efaunt', face: 23, variants: [] }
    },
    monstersByName: { Green_Mushroom: 'mushG', Moonmoon: 'moonman', Efaunt: 'Boss2A' },
    npcs: { Scripticus: ['static', 'idle'], Stiltzcho: ['static'] }
  }
}));

const { monsterImage, npcImage, getActivityIcon } = await import('../utility/spriteImages');

describe('monsterImage', () => {
  it('resolves rawName to the per-entity static png', () => {
    expect(monsterImage('mushG')).toBe('/monsters/mushG/static.png');
  });
  it('resolves display Name through monstersByName', () => {
    expect(monsterImage('Green_Mushroom', 'walk')).toBe('/monsters/mushG/walk.gif');
  });
  it('falls back to static when the variant is missing', () => {
    expect(monsterImage('moonman', 'death')).toBe('/monsters/moonman/static.png');
  });
  it('falls back to the face icon when no body art exists', () => {
    expect(monsterImage('Efaunt')).toBe('/data/Mface23.png');
  });
  it('face variant returns the Mface icon', () => {
    expect(monsterImage('mushG', 'face')).toBe('/data/Mface1.png');
  });
  it('unknown names keep the legacy afk_targets path', () => {
    expect(monsterImage('Divinity')).toBe('/afk_targets/Divinity.png');
  });
});

describe('npcImage', () => {
  it('returns the idle gif by default', () => {
    expect(npcImage('Scripticus')).toBe('/npcs/Scripticus/idle.gif');
  });
  it('returns the static png on request', () => {
    expect(npcImage('Scripticus', 'static')).toBe('/npcs/Scripticus/static.png');
  });
  it('falls back to static when idle is missing', () => {
    expect(npcImage('Stiltzcho')).toBe('/npcs/Stiltzcho/static.png');
  });
  it('unknown npcs keep the legacy flat gif path', () => {
    expect(npcImage('Chesty')).toBe('/npcs/Chesty.gif');
  });
});

describe('getActivityIcon', () => {
  it('returns the afk placeholder for no target', () => {
    expect(getActivityIcon({ afkTarget: 'Nothing' })).toBe('/data/Afkz5.png');
  });
  it('prefers the explicit monsterFace', () => {
    expect(getActivityIcon({ afkTarget: 'X', monsterFace: 5 })).toBe('/data/Mface5.png');
  });
  it('uses the item stack icon for targetMonster', () => {
    expect(getActivityIcon({ afkTarget: 'X', targetMonster: 'Copper' })).toBe('/data/Copper_x1.png');
  });
  it('routes afk monster targets through monsterImage', () => {
    expect(getActivityIcon({ afkTarget: 'Green_Mushroom' })).toBe('/monsters/mushG/static.png');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run __test__/spriteImages.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement utility/spriteImages.js**

```js
import { prefix } from '@utility/helpers';
import spriteManifest from '../data/sprite-manifest.json';

const GIF_VARIANTS = new Set(['idle', 'walk', 'death']);

// Full <img src> for a monster. Accepts rawName or display Name.
// Fallback chain: requested variant -> static -> face icon -> legacy afk_targets path.
export const monsterImage = (nameOrRaw, variant = 'static') => {
  const rawName = spriteManifest.monsters?.[nameOrRaw]
    ? nameOrRaw
    : spriteManifest.monstersByName?.[nameOrRaw];
  const entry = spriteManifest.monsters?.[rawName];
  if (!entry) return `${prefix}afk_targets/${nameOrRaw}.png`;
  if (variant === 'face') {
    if (entry.face != null && entry.face !== 0) return `${prefix}data/Mface${entry.face}.png`;
    variant = 'static';
  }
  if (entry.variants.includes(variant)) {
    return `${prefix}monsters/${rawName}/${variant}.${GIF_VARIANTS.has(variant) ? 'gif' : 'png'}`;
  }
  if (entry.variants.includes('static')) return `${prefix}monsters/${rawName}/static.png`;
  if (entry.face != null && entry.face !== 0) return `${prefix}data/Mface${entry.face}.png`;
  return `${prefix}afk_targets/${nameOrRaw}.png`;
};

// Full <img src> for an NPC (roster name). Falls back to the legacy flat gif for
// hand-added art that is not in the roster (Chesty, Captain, Boat).
export const npcImage = (name, variant = 'idle') => {
  const variants = spriteManifest.npcs?.[name];
  if (!variants) return `${prefix}npcs/${name}.gif`;
  if (variants.includes(variant)) {
    return `${prefix}npcs/${name}/${variant}.${variant === 'static' ? 'png' : 'gif'}`;
  }
  if (variants.includes('static')) return `${prefix}npcs/${name}/static.png`;
  return `${prefix}npcs/${name}.gif`;
};

// Moved from helpers.js; now returns a complete src (callers no longer add prefix/.png).
export const getActivityIcon = (character) => {
  const { afkTarget, targetMonster, monsterFace } = character || {};
  if (!afkTarget || afkTarget === '_' || afkTarget === 'Nothing') return `${prefix}data/Afkz5.png`;
  if (monsterFace != null && monsterFace !== 0) return `${prefix}data/Mface${monsterFace}.png`;
  if (targetMonster) return `${prefix}data/${targetMonster}_x1.png`;
  return monsterImage(afkTarget);
};
```

- [ ] **Step 4: Move getActivityIcon out of helpers.js and update its two consumers**

Delete `getActivityIcon` from `utility/helpers.js` (lines 396-402).

`components/characters/Activity.jsx`:
- Line 2: remove `getActivityIcon` from the helpers import; add `import { getActivityIcon } from '@utility/spriteImages';`
- Line 30: `<ActivityImg src={getActivityIcon({ afkTarget, targetMonster, monsterFace })} alt="" />`

`components/dashboard/Characters.jsx`:
- Line 4: remove `getActivityIcon` from the helpers import; add `import { getActivityIcon } from '@utility/spriteImages';`
- Line 116: `<IconImg src={getActivityIcon(character)} alt="activity icon"`

(`components/account/Worlds/World6/Sneaking/PlayersInventory.jsx` defines its own local `getActivityIcon`; leave it alone.)

- [ ] **Step 5: Run tests**

Run: `npx vitest run`
Expected: spriteImages tests PASS, no other suite broken (grep first: `grep -rn "getActivityIcon" --include=*.js* components pages utility __test__` must show only spriteImages.js, Activity.jsx, Characters.jsx, and the unrelated Sneaking local).

---

### Task 8: Migrate dynamic monster/NPC call sites (IdleonToolbox)

**Files (modify):**
- `components/account/Misc/class-specific/Compass/Medallions.jsx:49,74`
- `parsers/class-specific/compass.ts:297-308`
- `components/account/Misc/class-specific/Grimoire/Monsters.jsx:62`
- `components/account/Misc/Constellations.jsx:99`
- `components/account/Worlds/World4/Breeding/Territory.jsx:94,121`
- `components/account/Worlds/World4/Breeding/Pets/All.jsx:33,40` and `Pets/Other.jsx:53,81`
- `components/account/Worlds/World7/Tournament/Matches.jsx:37,77,88`, `Leaderboard.jsx:72`, `Companions.jsx:14`
- `components/tools/bone-joe-calculator/MinibossHp.jsx:87`, `CharacterMinibosses.jsx:72`
- `pages/account/prem-currency/pets.jsx:56`
- `parsers/world-6/summoning.ts:67,178,187,351` + `components/account/Worlds/World6/Summoning/Stones.jsx` + `Battles.jsx:61`
- `components/account/Misc/WorldQuest.jsx:67`
- `components/wiki/CategoryTiles.jsx:11,14,25`

**Interfaces:**
- Consumes: `monsterImage`, `npcImage` from `@utility/spriteImages` (Task 7). Line numbers are pre-change references; re-locate by the quoted code.

Mechanical rule: `` src={`${prefix}afk_targets/${X}.png`} `` becomes `src={monsterImage(X)}` (add the import, drop `prefix` from the import if now unused in that file). `monsterImage` accepts display names via `monstersByName`, so no caller needs to convert. Sites NOT migrated on purpose (hand-added art, kept on legacy paths): `afk_targets/Nothing|Divinity|Dog|Glimbo|Crystal_Carrot`, `npcs/Chesty|Captain|Boat`, `Account.jsx` Alert iconPaths, and all `data/Mface${...}` head-icon sites (Portals, Speedrun, Tesseract, Killroy, apocalypses, Observations, constants rift) which stay valid as-is.

- [ ] **Step 1: Simple swaps**

Apply the mechanical rule to: Grimoire/Monsters.jsx:62 (`monsterImage(Name)`), Constellations.jsx:99 (`monsterImage(monsterRaw)` : rawName preferred over the current `monsters?.[monsterRaw]?.Name` lookup, which can now be deleted), Territory.jsx:94/121 (`monsterImage(name)` using the raw key; delete the `realName` lookups if unused after), Tournament Matches (3 sites: `monsterImage(comp.name)`, `monsterImage(playerComp.name)`, `monsterImage(opponentComp.name)`), Leaderboard (`monsterImage(c.name)`), Companions (`monsterImage(name)`), MinibossHp + CharacterMinibosses (`monsterImage(name)`), pets.jsx (`monsterImage(name)`).

- [ ] **Step 2: Compass, delete the Ghost hack**

`parsers/class-specific/compass.ts`: delete the `imageNameByRaw` constant (line 301) and its comment block (297-300), and the `imageName: imageNameByRaw[monsterRawName],` line from the returned object.

`components/account/Misc/class-specific/Compass/Medallions.jsx`: remove `imageName` from the destructure (line 49); line 74 becomes:

```jsx
                     src={monsterImage(rawName)} alt={Name}/>
```

(rawName keying makes the `Ghost_ghost` disambiguation obsolete: `ghost` and `pghost` get separate folders.)

- [ ] **Step 3: Breeding pets, delete the denylist**

In both `Pets/All.jsx` and `Pets/Other.jsx`, replace

```js
const missingIcon = (icon === 'Mface23' || icon === 'Mface21' || icon === 'Mface31') && monsterRawName !== 'shovelR';
```

with

```js
const bodyIcon = icon?.startsWith('Mface');
```

and the img src with

```jsx
src={bodyIcon ? monsterImage(monsterRawName) : `${prefix}data/${icon}.png`}
```

keeping the styled-component prop as `missingIcon={bodyIcon}` so sizing is unchanged. INTENTIONAL VISUAL CHANGE: all monster-derived pets now show the body sprite (consistent with Territory.jsx) instead of a mix of heads and bodies; the helper still falls back to the face when no body art exists.

- [ ] **Step 4: Summoning parser + consumers**

`parsers/world-6/summoning.ts`: add `import { monsterImage } from '@utility/spriteImages';` and change the three emitters to full srcs (also update `prefix` import if needed, it exists in `@utility/helpers`):

```ts
// line 67
      allBattles[0].push({ ...monsterData, ...extraData, icon: monsterImage(whiteBattleIcons?.[index]) });
// line 178
        monsterIcon: isBoss6 ? `${prefix}data/${enemy?.enemyId}.png` : monsterImage(monsterName),
// line 187
        mapMonsterIcon: mapMonsterName ? monsterImage(mapMonsterName) : null
// line 351 (getBattleData)
  const icon = monsterImage(enemyId, 'face');
```

Consumers stop appending: `Stones.jsx` `` src={`${prefix}${monsterIcon}.png`} `` -> `src={monsterIcon}` and `` src={`${prefix}${mapMonsterIcon}.png`} `` -> `src={mapMonsterIcon}`; `Battles.jsx:61` -> `src={icon}`. Then grep to prove no consumer of these fields still appends: `grep -rn "monsterIcon\|mapMonsterIcon" --include=*.jsx components pages` must show no remaining `` `${prefix}${...}.png` `` around them.

- [ ] **Step 5: NPC sites**

`components/account/Misc/WorldQuest.jsx:67`:

```jsx
            <img width={50} height={50} src={npcImage(npc?.name)} alt="npc-icon" />
```

`components/wiki/CategoryTiles.jsx` KIND_ART (values stay prefix-less strings joined later, so use literal paths):
- `monster: 'monsters/mushG/static.png',`
- `npc: 'npcs/Scripticus/static.png',` (delete the Scripticus_Still comment; the generated still replaces the hand-made one; `etc/Scripticus_Still.png` itself can be deleted by the user later)
- `pet:` look up Whale's rawName in `data/sprite-manifest.json` (`monstersByName.Whale`) and use `'monsters/<thatRawName>/static.png'`.

- [ ] **Step 6: Run tests + dev smoke**

Run: `npx vitest run`
Expected: PASS. Then `npx next lint` (or the repo's eslint invocation) on the touched files: no unused-import warnings for `prefix`.

---

### Task 9: Entity-graph icons (IdleonToolbox, TDD via existing suite)

**Files:**
- Modify: `scripts/entity-graph/nodes/monsters.mjs:98`, `scripts/entity-graph/nodes/npcs.mjs:12`
- Test: `__test__/entity-graph/nodes.test.js:86-96`

**Interfaces:**
- Produces: monster node icons `/monsters/<rawName>/static.png`, npc node icons `/npcs/<rawName>/idle.gif`. `build.mjs:239-245` already nulls any icon whose file is missing under `public/`, so the 96 art-less monsters keep rendering the reserved empty box. `nodes/pets.mjs` intentionally stays on `/afk_targets/` (identical art; migrate later with the wiki-animation follow-up).

- [ ] **Step 1: Update the test first**

In `__test__/entity-graph/nodes.test.js`, change the npc expectation to:

```js
      icon: '/npcs/Grasslands_Gary/idle.gif',
```

If a monster-node test asserts an `/afk_targets/` icon, update it to the `/monsters/<rawName>/static.png` form the same way.

Run: `npx vitest run __test__/entity-graph/nodes.test.js`
Expected: FAIL on the icon assertion.

- [ ] **Step 2: Update the emitters**

`nodes/monsters.mjs:98`: `` icon: `/monsters/${rawName}/static.png`, ``
`nodes/npcs.mjs:12`: `` icon: `/npcs/${rawName}/idle.gif`, ``

- [ ] **Step 3: Tests pass, rebuild the graph**

Run: `npx vitest run __test__/entity-graph/nodes.test.js` (PASS), then `npm run build:graph`.
Expected: build log's nulled-icon count stays in the same ballpark as before (~96 art-less monsters plus NPCs whose idle.gif was skipped); `data/entity-graph.json` regenerates. Spot-check: `grep -c "/monsters/" data/entity-graph.json` > 200.

---

### Task 10: Build + browser verification (IdleonToolbox)

**Files:** none (verification)

- [ ] **Step 1: Full test suite + production build**

Run: `npx vitest run` then `npm run build`
Expected: PASS / build succeeds (prebuild reruns entity-graph).

- [ ] **Step 2: Serve and verify with Playwright MCP**

Run `npm run start` (serves `out/`), then with Playwright MCP (the in-app Browser pane cannot load this app):
- `http://localhost:3000/wiki` : category tiles show the mushroom/Scripticus/whale art (no broken images); open a monster page (e.g. Green Mushroom) and an NPC page (Scripticus): icons render from `/monsters/...` and `/npcs/.../idle.gif`.
- An account page needs profile data; instead verify assets directly: load `http://localhost:3000/monsters/mushG/walk.gif`, `/monsters/mushG/death.gif`, `/npcs/Scripticus/static.png` (200s, sane images via screenshot).
- Check the browser console on the wiki pages for 404s on `/monsters/` or `/npcs/` paths.

- [ ] **Step 3: Report**

Summarize for the user: counts generated, visual changes (breeding pets now body sprites; NPC gif timing fixed), what was intentionally left on legacy paths, and the follow-ups (boss sheet extraction for the 96 art-less monsters; animated monster art + pets migration in the wiki; deleting legacy flat outputs once burned in). The user commits when satisfied.
