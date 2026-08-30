# Wiki Entity Changelog Design

**Date:** 2026-08-30
**Status:** approved for implementation

## Problem

The wiki says what an entity *is* today. It cannot say what it *was*. "Was this
nerfed?" is one of the most common questions a player asks about an item, a
monster or a companion, and idleon.wiki cannot answer it either.

## What makes this possible

`z-processing/versioned-data/` holds 28 snapshots of the full website-data
export, `website-data-2.3.43.json` through `website-data-2.3.527.json`, 254MB in
total. They are already entity-shaped: `items` keyed by rawName, `monsters` by
rawName, `companions` by index. Diffing consecutive snapshots yields a per-entity
history with no new extraction work.

Validated by prototype across all 28 snapshots:

- **714 entities** carry at least one event
- **336 added**, **460 changed** events
- **49KB** without values, **336KB** with before/after values

## The core hazard

**The snapshots move when our extractor changes, not only when the game does.**
A naive diff is unusable: 2.3.523 -> 2.3.525 reports ~500 changed entities, and
almost all of them are ours (`durations` on 268 monsters from the sprite
pipeline, `upgradedTourPower`/`upgradedEffect` on 170 companions from Pet Mart+,
`gems`/`candy` on 60 achievements).

Three filters, in order, each catching what the previous one misses:

1. **Ignore fields absent from the older snapshot.** A field appearing for the
   first time is our extractor adding it. Collapses that 500 to 5.

2. **Ignore a field that lands on the same new value across >=25% of one kind,
   minimum 20 entities.** Filter 1 misses value-level extractor *fixes*. The
   proof case: 2.3.495 reports 396 changed monsters, and it is
   `Type: "G.MONSTER_TYPE" -> "Monster"` on 316 of them, an unresolved constant
   getting resolved. A real rebalance does not set 316 monsters to one identical
   string. The 20-entity floor stops small collections tripping it.

3. **A curated per-kind field allowlist.** Filters 1 and 2 are statistical and
   catch structural noise. Whether a sprite Y-offset is interesting is a
   judgement call, and it belongs in a hand-written list. There are only **74
   distinct changed fields** across the whole archive, so this is a bounded
   one-time job, not open-ended maintenance.

After all three, exactly one suppression fires across the full run, and it is
the correct one.

## Honest limits, to be stated on the page

- History begins at **2.3.43**, because that is where the snapshot archive
  begins. Older entities must read "no recorded changes since 2.3.43", never
  "never changed".
- An extraction **bugfix** changes a value and is indistinguishable from a game
  change. The `TalentBook1` quantity fix (3,649,200 -> 1) is exactly this shape.
  Rare, inspectable, and must not be hidden from the reader.

## Field census

Every field that changes at least once, by kind, with occurrence count.

| Kind | Keep | Drop |
|---|---|---|
| items | UQ1txt(92) UQ1val(40) UQ2txt(27) Type(21) desc_line1(14) displayName(11) lvReqToEquip(1) Weapon_Power(1) STR(1) AGI(1) WIS(1) LUK(1) Upgrade_Slots_Left(1) Class(1) | typeGen(18) ID(4) |
| monsters | RespawnTime(33) MonsterHPTotal(15) ExpGiven(9) Defence(3) Name(3) MoveSPEED(3) Damages(1) SpecialType(1) | Type(76) DeathFrame(4) HeightOfMonster(4) sprite(3) MovingFrame(1) MonsterFace(1) spriteAcross(1) spriteDown(1) spriteNumFrames(1) |
| companions | effect(29) bonus(16) tourPower(12) name(2) upgradedTourPower(1) upgradedEffect(1) upgradedBonus(1) | x(12) z(10) filler(2) rawName(2) x8(1) |
| crafts | materials(89) subType(5) | |
| achievements | desc(4) rewards(4) name(3) | |
| cards | perTier(2) effect(2) bonus(2) displayName(1) | visualIndex(2) |
| vials | desc(2) x1(1) | |
| talents | all fields (a field IS a talent name: DETONATION, BACKUP_ENERGY) | |
| stamps | out of scope for v1 | all (fields are array indices) |

`monsters.Type` is dropped despite 76 occurrences: filter 2 removes the 316-entity
bulk event, and what survives is the same constant-resolution churn in smaller
batches. It has never carried a real game change in the archive.

## Architecture

**Compute in z-processing**, where the 254MB of snapshots already live and where
IdleonToolbox never has to see them.

**Export as a standalone file, not a website-data key.** `entity-history.json`
follows the `sprite-manifest.json` precedent: `exportToFile(name, data, true)`
writes to `exported/`, and `syncToFrontend` copies every top-level file there to
`IdleonToolbox/data/`. This is not decoration. Adding it to `allFields` would put
the history inside the next versioned snapshot, which then feeds the next
history: unbounded recursive growth.

**The graph stamps it onto nodes.** `build.mjs` reads
`data/entity-history.json` and sets `node.history`. Each entity page then carries
only its own handful of events through the existing slice mechanism, so the
336KB never ships to an entity page.

**The rollup page reads the graph at build time.** `/wiki/changelog` uses
`getStaticProps` over `data/entity-graph.json` and emits a per-version rollup, so
no client fetch and no 336KB payload.

**Raw field names cross the boundary; labels live in the site.** z-processing
emits `{ field: 'MonsterHPTotal', from: 3700, to: 4200 }`. IdleonToolbox owns the
copy that turns that into "Health 3,700 -> 4,200". Extractor produces data, site
produces words.

## UX

**Per-entity** is the stronger half and ships first. A "Changes" section under
the relations, reverse chronological, one row per version. It answers the
question at the moment the reader is looking at the thing.

**Global** `/wiki/changelog` falls out of the same dataset. Most versions are 5
to 30 events and read as a flat list; 2.3.492 is 181 added plus 97 changed, a
world release, so rows group by kind with a count per group.

## Out of scope for v1

- Stamps (array-index field names need their own shape)
- Any snapshot older than 2.3.43
- Diffing anything not already an entity kind in the graph
