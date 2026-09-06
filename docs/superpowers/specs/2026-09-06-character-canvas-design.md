# Character Canvas: design

Date: 2026-09-06
Status: approved design, awaiting implementation plan

## Goal

A visual sandbox page where a visitor dresses an Idleon character: pick a class or one of their
own characters, equip items in the slots the game draws (hat, weapon, cape, costume), and watch
the character play the game's own idle, walk, attack and skilling animations, including a
skill effect sprite for attack talents. Loadouts are shareable by URL and exportable as PNG.

Pure visual. No stats, no damage numbers, no build planning. That is a separate future feature.

## Non-goals

- Stat recompute of any kind.
- Faithful projectile paths or per-talent motion. Effects play at a fixed offset.
- Art for shirts, pants, shoes, rings, pendants, tools, keychains, trophies, nametags: the game
  itself never draws them on the body.
- Saved loadouts with a backend. URL only.
- Pets, nametags above the head, hat rack tinting.

## Findings the design rests on

The player is a paper doll of separate Stencyl actors. Every layer is a sprite atlas in the APK at
`assets/assets/graphics/1x/sprite-<group>-<n>.png`; the record table `assets/assets/data/resources.mbs`
(already parsed by `z-processing/features/monsters/spriteMap.js`) holds each sheet's animation
name, columns, rows, frame count, durations and origin.

| Layer | Group | Sheets | Frame rule (from N.js) |
|---|---|---|---|
| Body | 21 | one per animation: `0` idle, `1` walk, `2a` spear attack, `2b` bow attack, `2c` wand attack, `2_` fists attack, `3`..`9` skilling, `Da` death, `Za` | frame = animation frame, 94x50 at 1x |
| Hat | 32 | `1` (normal), `4` (only while body plays `4`) | frame = item `ID` + 2, one hat per frame, attached at the body origin; per-frame nudged by `dx = AnimationOffsets[row][frame]`, `dy = AnimationOffsets[row][frame + n]`, one `(row, n)` pair per animation, parsed from the helmet actor's chain in N.js and shipped as `manifest.hatOffsets[anim] = { x: [], y: [] }` |
| Weapon | 25 | one per body animation, same names | drawn on idle (`0`), walk (`1`, from the idle sheet, fists hidden), climb (`4`, its own sheet) and the attack poses (`2a`, `2b`, `2c`, `2_`); hidden on `3`, `5`..`9`, `Da`, `Za` as in the game (`5`..`8` show a tools-slot tool this page does not model). Idle/walk/climb: frame = `weaponTypeOffset[Type]` + `ID`. Attack: frame = bodyFrame + block × bodyAnimFrames (sheet holds N weapons × N body frames). Placed at the body's top-left plus a flat per-animation offset from the weapon actor's chain, shipped as `manifest.weaponOffsets[anim] = { dx, dy }`, plus the hardcoded idle/walk bob, all put through the scale-2 pivot below |
| Cape | 574 | one per cape, animation name = cape `ID` | own loop for the sheet frame; placed at the body's top-left plus `CustomMaps.XYoffsetCape[anim]` indexed by the **body** frame, shipped as `manifest.capeOffsets[anim] = { x: [], y: [] }`. Behind everything except on pose `4`, where it is in front |
| Costume (slot 15) | 684 | one per costume `ID` | frame = `costumeFrameBase[bodyAnim]` + body frame. The bases are hardcoded in N.js's shirt actor, **not** the body animations concatenated in record order; they happen to tile the 163-frame sheet, but in a different order |
| Skill effect | 8 | ~37 animations, numeric names | animation = the branch's `WeaponType`, capped at `"100"` (see the cast table below) |
| Skill effect 2 | 576 | 21 animations, numeric names | animation = the branch's `WeaponType` |
| Buff popup | 210 | 37 animations, named (`Shout`, `Spd`, `Fire`, `Heart`, ...) | animation = the branch's `DummyText`; floats above the head rather than beside the body |

`ID` is the `ID` field in `website-data` items.json. Weapon type offsets come from the game's
`NumberOfWeaponsMAP` (FISTICUFF = 0, SPEAR = 2 + fist count, then BOW, then WAND chained).

Which sheet a talent plays is read out of the game rather than picked by hand.
`_customBlock_CastAttackofID1` (with its overflow `_customBlock_CastAttack2`) is one long chain of
`<skillIndex> == e` branches, each spawning the actor that draws that talent's effect. Within a
branch the first `WeaponType`, `getActorType(n)` and `DummyText` win; actor `7` maps to group 8,
`575` to group 576 and `209` to the group 210 buff popup, and every other actor (the `114`
projectiles like `Bow2`/`FireBomb`, plus `34`/`44`) flies through the world instead of playing on
the player, so those talents get no effect. `parseAttackEffects` in
`z-processing/features/_tooling/playerSprites.js` ships the result as
`manifest.attackEffects[skillIndex] = { layer, anim }` (65 talents on 2.3.528: 23 effect, 15
effect2, 27 buff). Entries naming a sheet the manifest does not ship are dropped at build time.
The only hand-picked part left is where to draw it: `EFFECT_NUDGES` per layer in
`utility/attackEffects.js`, with a small `EFFECT_NUDGE_OVERRIDES` map for the odd talent that reads
wrong at its layer default.

Skilling pose labels for `3`..`9` are not derived from the sprite data (there is no name string
per body animation): they were verified against the game's controller code instead. The hat's
pixel offset relative to the body origin does not need tuning:
`HAT_OFFSET` is a fixed `{ x: 0, y: 0 }` (every layer anchors by its own sheet origin), and the
per-frame bob/sway on top of that is read straight out of the game's `AnimationOffsets` table
(see the Hat row above) - not hand-picked.

## Architecture

Three units, each testable alone:

1. **Export** (z-processing): copies the six sprite groups out of the APK and writes a manifest.
2. **Paper doll resolver** (frontend, pure): turns loadout state + tick into a draw list.
3. **Canvas page** (frontend, React): UI around a `<canvas>` that draws the list.

### 1. Export: `z-processing/features/_tooling/playerSprites.js`

- `spriteMap.js` gains `originX`/`originY` on every record (record offsets 29 and 33).
- `generatePlayerSprites({ mbsPath, graphicsDir, outDir, items })`:
  - Group ids hardcoded: `{ body: 21, hat: 32, weapon: 25, cape: 574, costume: 684, effect: 8 }`.
  - Copies each group's sheets to `exported/player-sprites/<layer>/<animName>.png`. Animation
    names are the file names (for costume and cape the name is the item `ID`).
  - Writes `exported/player-sprites/manifest.json`:

    ```json
    {
      "version": "2.3.528",
      "frameSize": { "w": 94, "h": 50 },
      "layers": {
        "body": { "0": { "file": "body/0.png", "across": 3, "down": 2, "numFrames": 5,
                          "frameW": 94, "frameH": 50, "originX": 47, "originY": 50,
                          "durations": [100, 100, 100, 100, 100] }, "...": {} },
        "hat": {}, "weapon": {}, "cape": {}, "costume": {}, "effect": {}
      },
      "weaponTypeOffsets": { "FISTICUFF": 0, "SPEAR": 14, "BOW": 31, "WAND": 46 },  // illustrative values
      "weaponOffsets": { "2a": { "dx": -28, "dy": -40 }, "2c": { "dx": 0, "dy": -30 } },
      "capeOffsets": { "0": { "x": [0, 0, 0, 0, 0], "y": [1, 0, 0, 1, 1] } },
      "costumeFrameBase": { "0": 0, "1": 5, "4": 11, "3": 15, "2_": 22, "2a": 39, "2b": 50,
                            "2c": 63, "Za": 76, "Da": 83, "9": 93, "5": 101, "6": 113,
                            "8": 125, "7": 142 },
      "hatFrameOffset": 2
    }
    ```

  - `weaponTypeOffsets` is derived from item IDs: each type starts after the previous type's
    highest contiguous ID in the order FISTICUFF, SPEAR, BOW, WAND (verified against the idle
    sheet: 0 blank, 1..12 fists, 13..28 spears, 29..42 bows, 43..55 wands, so offsets 0/12/28/42).
    Placeholder items with an out-of-range ID (a SPEAR with ID 99) are ignored here and reported
    as unsupported by the resolver.
  - `costumeFrameBase` is parsed out of `resources/N.js` by `parseCostumeFrameBases`, which reads
    the shirt actor's own `"<anim>" == ...getAnimation() ? setCurrentFrame(Math.round(<base> + ...`
    chain and adds `'0': 0` for the final else branch (which carries no base). It throws when
    fewer than two branches match, meaning the chain moved.
  - `weaponOffsets` is parsed by `parseWeaponOffsets` out of the weapon actor's
    `"<anim>" == ...h[this._WeaponID].getAnimation() ? (setX(...getX() + <dx>), setY(...getY() + <dy>))`
    chain (a missing `+ n` term is 0). Branches that compute their offset per frame (`0`, `1`, `Za`)
    do not match that shape and are deliberately absent. Throws below 3 matches.
  - `capeOffsets` is parsed by `parseCapeOffsets` out of `CustomMaps.XYoffsetCape`'s
    `e.h[<key>] = [...]` rows (keys appear bare, quoted, or as dot properties), each split into
    x and y halves. Throws when the map is gone.
  - Attack sheets hold one block of body-animation-length frames per weapon: block = ID for
    FISTICUFF (block 0 is unarmed), ID - 1 for SPEAR/BOW/WAND.
  - Sanity asserts, export throws on failure so a game update cannot silently ship wrong art:
    body has `0`, `1`, `2a`, `2b`, `2c`, `2_`; hat sheet `1` frames ≥ max hat `ID` + 3; weapon
    sheet `0` frames = max offset + max `ID` of that type + 1; every attack weapon sheet's
    frame count is divisible by the matching body animation's frame count; and the costume
    tiling invariant: every body animation has a base, and sorting the (base, numFrames) pairs
    by base, the first base is 0, each base + numFrames equals the next base, and the last end
    equals every multi-frame costume sheet's frame count (163 in 2.3.528). 1-frame placeholder
    costume sheets are skipped. Failure throws
    `player sprites: costume bases do not tile the sheet (<detail>)`.
- Wired into `core/process.js` in the sprite generation `Promise.all`. `syncToFrontend` gets
  `'player-sprites': 'player-sprites'` in `entityDirMap` (merge copy into `public/`); the
  manifest is written with `exportToFile('player-sprites-manifest.json', ..., true)` so it
  travels to `IdleonToolbox/data/` like `sprite-manifest.json`.
- Budget: about 100 PNGs, roughly 2 MB total. Sheets ship as-is, no slicing.

### 2. Resolver: `IdleonToolbox/utility/paperDoll.js`

Pure functions, no DOM.

```js
resolveLayers(manifest, state, tick) -> [{ sheet, sx, sy, w, h, dx, dy }]
```

- `state = { weaponType, hat, weapon, cape, costume, pose, effect }` where item fields are
  `{ rawName, ID, Type }` or null, `pose` is a body animation name, `effect` is
  `{ anim, startedAt } | null`.
- `tick` is elapsed ms; each layer picks its frame from its own `durations`, looping. The effect
  plays once then returns nothing.
- Positioning. Body, costume, hat and effect position by their own sheet's `originX/Y`; the hat
  adds `manifest.hatOffsets[pose]` per body frame plus the constant `HAT_OFFSET` (image-local
  coordinates on the body actor, so they scale with it and are used as they are), and the effect
  adds its map's `dx`/`dy` nudge. The weapon and the cape do **not** use their own origins: the
  game places both relative to the body frame's top-left (`-body.originX, -body.originY`).
  - **Scale-2 pivot.** The game grows every player actor to scale 2 (`_PlayerSize` 200,
    `growTo(2, 2)`), each scaled around its OWN sprite origin, while the actor coordinates and the
    offset tables (`weaponOffsets`, `capeOffsets`, the idle and walk bobs) are world pixels applied
    to the unscaled top-left. A raw world offset therefore lands in sprite pixels as
    `scaledOffset(rawX, rawY, layerSheet, bodySheet)`:
    `offX = (rawX + (originX_layer - originX_body) * (1 - S)) / S`, same for y, with `S = GAME_SCALE = 2`.
    Live 2.3.528 check on `2a`: body 94x50 origin (47, 50) at (859, 674), weapon 152x110 origin
    (76, 110) at (831, 634) - raw `(-28, -40)` renders at `(-28.5, -50)` sprite px. A layer sharing
    the body's frame size and origin (idle/walk/climb weapon, cape, costume) reduces to `raw / 2`.
    Results stay fractional: the canvas draws at 3x and `drawImage` accepts fractions.
  - Weapon, per body pose (`weaponPlacement(pose, Type, bodyFrame)`), with
    `typeOffset = weaponTypeOffsets[Type]` and `block = Type === 'FISTICUFF' ? ID : ID - 1`:
    - `0` idle: sheet `0`, frame `typeOffset + ID`, raw `(0, idleBob)`, where `idleBob` is the
      game's hardcoded `+2` world px on body frames 0, 3 and 4, or on frames 0, 1 and 4 for a
      `FISTICUFF`. Drawn behind the body except for `FISTICUFF`.
    - `1` walk: the same idle sheet `0` and frame `typeOffset + ID`, raw `(0, walkBob)` with
      `walkBob` = `-4` world px while the body frame is < 2, `-2` on frame 2, `0` after. Fists are
      hidden (not unsupported: the game just draws nothing). Drawn behind the body except for `FISTICUFF` (same rule as idle, sheet `0`).
    - `4` climb: sheet `4`, frame `typeOffset + ID` for every type, raw `(0, 0)`, in front.
    - `2a`/`2b`/`2c`/`2_` attacks: sheet = pose, frame `bodyFrame + block * body.numFrames`, raw
      offset from `manifest.weaponOffsets[pose]` (a pose with no branch is `(0, 0)`). For 2.3.528:
      `2_: (14, 11)`, `2a: (-28, -40)`, `2c: (0, -30)`, `7: (-18, 16)`, `8: (-13, -30)`.
    - `3`, `5`..`9`, `Da`, `Za`: no weapon. `5`..`8` show the tool from the tools slot in the game,
      which this page has no slot for, so nothing is drawn and nothing is reported unsupported.
  - Cape: `dx = bodyTopLeft.dx + scaledOffset(capeOffsets[pose].x[bodyFrame], ...)`, same for y,
    `(0, 0)` when the pose has no row. `manifest.capeOffsets` is `CustomMaps.XYoffsetCape`
    (`parseCapeOffsets`), one int array per animation, first half x per frame, second half y. It is
    indexed by the **body's** frame, not the cape's own loop frame; the cape's sheet frame still
    comes from its own loop. Most cape sheets share the body's frame size and origin, so the pivot
    is a plain halving; a handful are taller and are not.
- Draw order, from the game's actor depth rules (cape z = `min(body, weapon) - 1`, or
  `max(body, weapon) + 1` on `4`; weapon z = `body - 1` when drawn from sheet `0` (poses `0` and `1`) unless FISTICUFF, else `body + 1`;
  costume z = `body + 1`, or `cape - 1` on `4`; the hat is an image attached to the body):
  - pose `0` or `1` with a non-FISTICUFF weapon: cape, weapon, body, hat, costume, effect
  - every other pose except `4`: cape, body, hat, costume, weapon, effect
  - pose `4` (climb): body, hat, weapon, costume, cape, effect
- Rules implemented exactly as the findings table. Attack pose for a weapon type comes from
  `attackPoseForType(Type)`; fists with no weapon fall back to `2_`.
- Costume frame = `manifest.costumeFrameBase[pose] + bodyFrame`. A pose with no base (or a frame
  past the sheet) makes the costume unsupported rather than drawing the wrong pose: that mistake
  is what made an idle character in a costume look like it was choppin.
- Missing sheet, missing `ID`, or `ID` past the sheet's frame count: the layer is dropped and
  the rawName is returned in a second value, `{ layers, unsupported: [rawName] }`, for the UI.

`IdleonToolbox/utility/attackEffects.js`: `{ [talentName]: { anim: '12', dx: 30, dy: -10 } }`,
hand-filled for the main attack talent of each base class first, growable. Like every other layer,
the effect anchors by its own sheet origin (`dx: -sheet.originX, dy: -sheet.originY`); `dx`/`dy` in
the map are then a pixel nudge on top of that anchor, from the body's feet, not a substitute
anchor.

### 3. Page: `IdleonToolbox/pages/tools/character-canvas.jsx`

Components under `components/tools/character-canvas/`:

- `PaperDollCanvas.jsx`: owns the `<canvas>`, preloads the sheets it needs (Image cache keyed by
  file), runs a `requestAnimationFrame` loop while playing, draws `resolveLayers` output at an
  integer scale (3x default, 2x below 600px wide). Default `image-rendering`. Exposes
  `toPNG()` for the download button. Pauses when the tab is hidden.
- `SourcePicker.jsx`: with a loaded profile, a character dropdown that seeds the loadout from
  `character.equipment` (slot indices 0 hat, 1 weapon, 12 cape, 15 costume) and the class;
  without one, a class picker on a blank mannequin. Switching source replaces the loadout.
- `SlotGrid.jsx`: the 16 game equipment slots in game order. Drawn slots are active; the rest are
  rendered greyed with an `InfoIcon` tooltip "The game does not draw this slot on the body".
- `ItemPickerDialog.jsx`: Autocomplete over `itemsArray` filtered by slot type and class
  requirement, with a clear option.
- `PoseBar.jsx`: idle, walk, attack, skilling poses (labels from a small map filled during
  implementation), play/pause, download PNG.
- `AttackList.jsx`: talents of the selected class with `castTime`, click plays the weapon-type
  attack pose plus the effect the game's cast chain maps that talent to. Talents the chain gives no
  player-drawn actor (projectiles) still play the swing; their chip shows outlined instead of filled.

State: one `useState` loadout object in the page; no context, no store. React Compiler handles
memoization; no `useMemo`, no IIFEs.

URL: `?class=Barbarian&hat=EquipmentHats1&weapon=EquipmentSword1&cape=EquipmentCape1&costume=...&pose=2a`.
Read once on mount, written with `router.replace(..., { shallow: true })` on change. These params
describe this page only, so they are deliberately not added to `SESSION_QUERY_PARAMS`. The page
sets a canonical of the clean URL so parameter variants do not index as duplicates.

Registration: `PAGES.TOOLS.characterCanvas` in `components/constants.jsx` (icon
`data/EquipmentHats1`), `offlineTools.characterCanvas = true` in `ToolsDrawer.jsx`,
`/tools/character-canvas` in `data/page-seo.js` and the sitemap.

## Error handling

- Sheet fails to load: warn once, skip that layer, keep drawing the rest.
- Item without art (new item after the last export): slot shows the item icon plus a small
  "art not exported yet" chip; canvas skips it.
- No profile and no class in the URL: Beginner on a blank mannequin.
- Invalid rawName in the URL: ignored, slot stays empty.

## Testing

- `__test__/paperDoll.test.js` (vitest): frame math per rule against a small hand-built
  manifest fixture: hat frame = ID + 2, weapon idle offset, weapon attack index, costume global
  pose index, cape loop, effect one-shot end, unsupported list, draw order.
- `z-processing/core/playerSprites.test.js`: runs the export against the real MBS and graphics
  dir when present, asserts manifest shape and every sanity invariant; skips when the APK
  extraction is absent.
- Playwright screenshot of the page with a fixed loadout URL, per the browser verification
  workflow (`npm run build` + `npx serve out`).
- One manual pass: compare the idle Barbarian with hat and weapon against an in-game screenshot to
  set `HAT_OFFSET`.

## Rollout

1. Export + manifest, synced into the site.
2. Resolver with tests.
3. Page with idle pose only, hat and weapon.
4. Walk, attack, skilling poses, cape, costume.
5. Attack list and the parsed `attackEffects` table.
6. URL sharing, PNG download, registration and SEO entries.

## Revision 2026-09-06: Outfit and Skills tabs

Design canvas: https://claude.ai/code/artifact/a3758220-4bdb-4e13-86b7-ab92e0bd937e

Cosmetics and skill playback are different intents, so the page splits into two site tabs
(`Tabber`, query key `t`, values `Outfit` and `Skills`). One nav entry, one URL, one shared loadout.

**Outfit tab**
- One `Character` field (MUI Autocomplete, free text). Picking one of the profile's characters loads
  its outfit and name; typing sets only the name on the label. Without a profile it is a plain
  name field. No class selector: the body sprite is class-agnostic, so the item picker lists
  every hat, weapon, cape and costume regardless of class (the option shows the class requirement
  as a caption).
- Only the six slots the game draws, in this order: Hat, Weapon, Cape, Costume, Trophy, Nametag.
  Each card shows the item icon, the slot label and the item name. The other ten game slots are
  gone from the page.
- Poses: every pose except Attack (Idle, Walk, Jump, Climb, Mining, Choppin, Fishing, Catching,
  Divinity), pause, download PNG. The share link is the URL.

**Skills tab**
- Class select (moved here from the old SourcePicker), then the class's attack talents grouped by
  talent tab in path order (e.g. Rage Basics, Warrior, Barbarian). Each row: icon, name, and a
  caption `swing + effect`, `popup` or `swing only`; `swing only` rows are dimmed. The playing row
  is highlighted.
- The stage wears the Outfit tab's look. The pose is always the weapon-type attack pose; a talent
  click plays its effect.
- Controls: Replay (re-casts the current talent), Loop toggle (re-cast when the effect ends),
  Slow motion toggle (quarter speed), download PNG, and a caption `<Talent>: N frames, S s` for the
  playing effect.

URL: `t` is preserved by the loadout mirror; `class`, `name`, `trophy`, `nametag` and the four
drawn slots stay as before; `pose` only carries Outfit poses.

### Amendments 2026-09-06 (after first build)

- Outfit tab poses are only Idle, Walk and Attack. Attack is the weapon-type swing with no effect.
- The page renders no `h2` of its own; the app header already shows "Character Canvas". The blurb stays.
- No free-text name. With a loaded profile the Outfit tab shows a `Character` Select (Blank mannequin
  plus the profile's characters); picking one loads its outfit and name. Without a profile the
  mannequin is the only source and no selector is shown. The label name is the character's name or
  `Mannequin`; `name` stays in the URL so shared links keep it.

### Amendments 2026-09-06 (second round): no Skills, companion

- The Skills tab is removed. The page is a single view: canvas, poses Idle / Walk / Attack, pause,
  download; Character select, Wardrobe. No `t` or `class` URL params. Unarmed Attack is the fists
  swing. Skill effects are no longer exported or drawn.
- Companion: a seventh Wardrobe card "Companion" picks one of the game's companions (the
  `companions` website data). The canvas draws the companion's monster idle frames (frames 0 to
  MovingFrame, the same rule as the site's monster gifs) at the body's 2x scale, feet on the
  player's ground line, to the right of the player, behind the body, looping on its own clock.
  URL `companion=<rawName>`; seeded from the profile's current companion when picked. Companions
  without art (4 of 175) show the "no art yet" chip. The horizontal gap is a constant tuned against
  an in-game screenshot; the game's follower placement code was not extracted.
- Page renamed to Wardrobe (`/tools/wardrobe`) on 2026-09-06.
