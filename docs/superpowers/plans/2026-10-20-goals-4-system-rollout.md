# Goals 4: System Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every trackable system gets a descriptor and target icons on its page, including character-level, boolean and tier systems.

**Architecture:** No new architecture. Task 1 adds character scope to the UI; every later task is a batch of descriptors (one file each in `utility/goals/registry/`, plus its route in `utility/goals/routes.js`) and `<SetGoalButton system entryKey />` at each entry's render site. Plan 1's contract test covers every new descriptor; the NavBar `AddGoalButton` appears on each registered route.

**Tech Stack:** as plans 1-2.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md`

Depends on plans 1-3 and plan 5.

> **Update 2026-10-20 (header-only):** goals are added only from the header button. Tasks 3-8 add descriptors and routes only: skip every "wire `SetGoalButton`" step and every entry-icon browser check; instead check the header popover and `Goals n/m` panel on two pages per task. Tables fact-checked against the parsers on 2026-10-20.

## Global Constraints

- Everything from plans 1-3.
- **Keys**: a game index field, a stable `rawName`, or the **map position of a list that the parser builds 1:1 from the catalog or save without filtering or sorting** (marked "pos" below). Never a position in a filtered (`liveEntries`, `.filter`) or sorted list, never a display name. Where the tables say "add `xIndex` in the parser", add that field in the parser's map before any filter / sort.
- **Values**: always finite. Raw save fields get `?? 0`; truthy flags get `? 1 : 0`.
- **Max**: `realCap(n, placeholderAtLeast)`; placeholder caps seen: 999 (armory, minehead), 9999 (summoning), 99999 (spelunking, exported as `UNCAPPED_MAX_LEVEL`), 100000 (gem shop), `Infinity` (sushi: `Number.isFinite` check).
- **Icons**: the exact image the page renders for the entry (copy the page's expression). **Route**: the page that renders the entry; also added to `GOAL_ROUTES`.
- "save-driven" = list is empty for a logged-out account; allowed, the contract test only asserts it does not throw.
- A row that does not match the code after these corrections: fix it to match the code and say so in the commit; a system that cannot meet the contract test is dropped from the batch and listed in the task report.
- Each task ends with: `npm test` green, Browser pane check on two of its pages (`?demo=true`: add a goal from an entry icon, see it on `/dashboard`), screenshots of those two pages.

## Review Focus

1. Lists that look stable but are filtered or sorted (gallery, jade emporium, exotic market, observations, lore bosses, gaming imports, tome): each gets a key-stability assertion (same entry, same key in `latest` and `highend`) in its task, in addition to the contract test.
2. Character goals on a page that shows one character at a time: the entry icon must carry that character's `scope`. Test in Task 1.
3. Fields absent when zero or not yet unlocked: covered by the contract test's finite check; each such descriptor uses `?? 0` / `? 1 : 0`.
4. Tier names must match what the page shows: artifacts have 8 tiers (None, Base, Ancient, Eldritch, Sovereign, Omnipotent, Transcendent, Verisimilitude, `Sailing/Artifacts.jsx:11-19`). Test in Task 5.
5. Pages with several systems (general misc page, Hole, Sailing, Spelunking, Royal Guardian): the header popover offers a system select. Browser check in Tasks 2, 5 and 7.

---

### Task 1: Character scope

**Files:**
- Create: `components/goals/parts/CharacterPicker.jsx`
- Modify: `components/goals/GoalPopover.jsx` (picker for `scope: 'character'` systems when no `initial.scope`), `components/goals/SetGoalButton.jsx` (`scope={{ char: name }}`), `components/dashboard/goals/Goals.jsx` (character goals under the character name)
- Create descriptors: `skill`, `talent`, `starTalent`, `postOffice`, `charLevel`
- Modify: `components/characters/Skills.jsx`, `Talents.jsx`, the star talents view, `PostOffice.jsx`, and the character level display
- Test: extend `__test__/components/GoalPopover.test.jsx`

| system | list (per character) | key | metric(s) |
|---|---|---|---|
| `skill` | `Object.entries(character.skillsInfo)` minus `'character'` (`parseMaps.ts:87`, page skips it `Skills.jsx:82`) | skill name | `level` |
| `talent` | `character.flatTalents ?? []` (no-class characters lack it, `character.ts:288`) | `String(talentId)` | `level` = `baseLevel`, max `realCap(maxLevel)` |
| `starTalent` | `character.flatStarTalents ?? []` | `String(talentId)` | `level`, max `realCap(maxLevel)` (`-1` when absent, `talents.ts:124`) |
| `postOffice` | `character.postOffice?.boxes ?? []` minus `'Filler'` (`PostOffice.jsx:16`) | pos (unfiltered map, `postoffice.ts:13`) | `level`, max `maxLevel` |
| `charLevel` | `[character]` | `'level'` | `level` |

- [ ] **Step 1: Write the failing tests**: talent popover without a character shows the picker; with `scope={{ char: 'A' }}` it does not; the saved goal has `scope: { char: 'A' }` and resolves against character A only.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS; browser check on the characters page (talents, skills).
- [ ] **Step 5: Commit** `Goals: character goals for skills, talents, post office and level`

---

### Task 2: Worlds 1-2

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `statue` | `/account/misc/general` | `account.statues` | `String(statueIndex)` | `level`; `tier` = `statueGrades[statueIndex] ?? 0`, tiers None / Gold / Onyx / Zenith defined in the descriptor (no page labels) |
| `forge` | `/account/world-1/forge` | `account.forge.upgrades` | `String(index)` | `level`, max `maxLevel` |
| `owl` | `/account/clickers/owl` | `account.owl.upgrades` | `String(index)` | `level ?? 0` |
| `bribe` | `/account/world-1/bribes` | `account.bribes` | `String(index)` | boolean `done ? 1 : 0` |
| `arcade` | `/account/world-2/arcade-shop` | `account.arcade.shop` minus `isArcadePlaceholder` | `String(index)` | `level`, max `ARCADE_OMEGA_LEVEL` (`arcade.ts:20`) |
| `vial` | `/account/world-2/vials` | `account.alchemy.vials` | `mainItem` | `level`, max `MAX_VIAL_LEVEL` |
| `sigil` | `/account/world-2/sigils` | `account.alchemy.p2w.sigils` | `String(index)` | `tier` = `unlocked + 1`, tiers Locked / Unlocked / Boost / Jade / Ethereal / Eclectic (defined in the descriptor) |
| `cauldronUpgrade` | `/account/world-2/cauldrons` | `p2w.cauldrons[i]` × speed / newBubble / boostReq and `p2w.liquids[i]` × regen / capacity | `` `cauldron:${i}:${part}` `` / `` `liquid:${i}:${part}` `` | `level`, max from `CAULDRONS_MAX_LEVELS`; groups: cauldron / liquid |
| `killroyKills` | `/account/world-2/killroy` | `account.killroy.list` | `rawName` | `kills` = `Number(killRoyKills) \|\| 0` |
| `killroyUpgrade` | `/account/world-2/killroy` | `account.killroy.upgrades` | pos | `level ?? 0` |
| `killroyShop` | `/account/world-2/killroy` | `account.killroy.permanentUpgrades` minus slot 2 (always 0) | `String(i)` (shop index minus 10) | `level`; `percentOfMax` = `progress` except slot 0 (none) |
| `kangaroo` | `/account/clickers/kangaroo` | `account.kangaroo.upgrades`, `.tarUpgrades` | `` `${list}:${pos}` `` | `level ?? 0` |
| `island` | `/account/world-2/islands` | `account.islands.list` | `String(index)` | boolean `unlocked ? 1 : 0` |

- [ ] Steps: add descriptors + routes; contract test → fix until PASS; wire `SetGoalButton` on each page; `npm test`; browser check (vials; general page system select with statues). **Commit** `Goals: worlds 1 and 2 systems`

---

### Task 3: World 3

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `shrine` | `/account/misc/general` | `account.shrines` | `rawName` | `level` = `shrineLevel` |
| `prayer` | `/account/world-3/prayers` | `account.prayers` | `String(prayerIndex)` | `level`, max `maxLevel` |
| `salt` | `/account/world-3/refinery` | `account.refinery.salts` | `rawName` | `rank` |
| `saltLick` | `/account/world-3/salt-lick` | `account.saltLick` | pos (rawName repeats) | `level`, max `maxLevel` |
| `building` | `/account/world-3/buildings` | `account.towers.data` | `String(index)` | `level`, max `getExtraMaxLevels(account, maxLevel, atomLevel, index)` as `buildings.jsx:62` |
| `atom` | `/account/world-3/atom-collider` | `account.atoms.atoms` | `rawName` | `level`, max `maxLevel` |
| `equinoxUpgrade` | `/account/world-3/equinox` | `account.equinox.upgrades` | pos | `level` = `lvl`, max `maxLvl` |
| `equinoxChallenge` | `/account/world-3/equinox` | `account.equinox.challenges` | pos | boolean `current === -1 ? 1 : 0` |
| `totem` | `/account/world-3/worship` | `account.totems` | pos | `wave` = `maxWave ?? 0` |
| `deathNote` | `/account/world-3/death-note` | `account.deathNote[world].mobs` and `.miniBosses` | `rawName` | `kills`; `rank` = number of kill thresholds met (`DEATH_NOTE_RANKS`, mini bosses use their own table, `deathNote.ts:60-72`), tier labels = the thresholds; groups: world |
| `hatRack` | `/account/world-3/hat-rack` | `account.hatRack?.allPremiumHelmets ?? []` | `rawName` | boolean `isAcquired ? 1 : 0` |
| `armorSet` | `/account/world-3/armor-smithy` | `account.armorSmithy?.sets ?? []` | `setName` | boolean `unlocked ? 1 : 0` |

- [ ] Steps as Task 2 (browser check: prayers, death note). **Commit** `Goals: world 3 systems`

---

### Task 4: World 4 and account-wide collections

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `pet` | `/account/world-4/breeding` | `account.breeding.pets[world]` | `monsterRawName` | `level`; `shiny` = `shinyLevel`, max `getMaxShinyLevel`; `breedability` = `breedingLevel ?? 0`, max `MAX_BREEDABILITY_LEVEL`; groups: world |
| `petUpgrade` | `/account/world-4/breeding` | `account.breeding.petUpgrades` (save-driven) | `String(upgradeIndex ?? pos)` | `level`, max `maxLevel` |
| `meal` | `/account/world-4/cooking` | `account.cooking.meals` | `rawName` | `level`, max `account.cooking.mealMaxLevel` |
| `kitchen` | `/account/world-4/cooking` | `account.cooking.kitchens` (save-driven; add `kitchenIndex` in the parser before the locked filter, `cooking.ts:964-985`) | `String(kitchenIndex)` | `speed` = `speedLv`, `fire` = `fireLv`, `luck` = `luckLv` |
| `chip` | `/account/world-4/laboratory` | `account.lab.chips` | `String(index)` | `owned` = `totalAmount ?? 0` |
| `jewel` | `/account/world-4/laboratory` | `account.lab.jewels` | `String(index)` | boolean `acquired ? 1 : 0` |
| `tome` | `/account/world-4/tome` | `account.tome.tome` (add `tomeIndex` in the parser before the re-sort, `tome.ts:39-57,73`) | `String(tomeIndex)` | `quantity`; `points`, max `maxPoints` |
| `card` | `/tools/card-search` | `Object.values(account.cards)` | `String(cardIndex)` | `stars` = `amount > 0 ? stars + 1 : 0`, tiers None, 1★ ... 7★ (descriptor); `amount` |
| `achievement` | `/account/task-board/achievements` | `account.achievements` | pos | boolean `completed ? 1 : 0` |
| `task` | `/account/task-board/tasks` | `account.tasksDescriptions[world]` minus slot 8 (rotates daily) | `` `${world}:${i}` `` | `level`, max `maxLevel` |
| `merit` | `/account/task-board/merits` | `account.meritsDescriptions[world]` | `` `${world}:${i}` `` | `level`, max `totalLevels` |
| `taskUnlock` | `/account/task-board/unlocks` | `account.taskUnlocks.taskUnlocksList` | `` `${col}:${i}` `` | boolean `unlocked ? 1 : 0` |
| `rift` | `/account/world-4/rift` | `[account.rift]` | `'rift'` | `level` = `currentRift ?? 0`, max `list?.length ?? null` |

- [ ] Steps as Task 2 (browser check: breeding, cooking). Key-stability test for `tome`. **Commit** `Goals: world 4 and account collections`

---

### Task 5: World 5

All gaming rows read `account.gaming?.x ?? []` (`account.gaming` can be null, `index.ts:293`).

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `god` | `/account/world-5/divinity` | `account.divinity.deities` | `rawName` | `level`, max `maxLevel` |
| `fertilizer` | `/account/world-5/gaming` | `gaming.fertilizerUpgrades` | pos | `level ?? 0` |
| `gamingImport` | `/account/world-5/gaming` | `gaming.imports` (filter drops only the last entry) | the digits of `rawName` (`GamingItem3_0` → `3`) | `level ?? 0` |
| `superbit` | `/account/world-5/gaming` | `gaming.superbitsUpgrades` | `String(originalIndex)` | boolean `unlocked ? 1 : 0` |
| `logBook` | `/account/world-5/gaming` | `gaming.logBook` | `rawName` without `.png` | boolean `unlocked`; boolean `crowned` |
| `palette` | `/account/world-5/gaming` | `gaming.palette` filtered to objects (last element is a number) | pos | `level ?? 0` |
| `villager` | `/account/world-5/hole` | `account.hole.villagers` | `String(index)` | `level` |
| `majik` | `/account/world-5/hole` | `account.hole.majiks[tree]` | `` `${tree}:${pos}` `` | `level ?? 0`, max `maxLevel`; groups: tree |
| `measurement` | `/account/world-5/hole` | `account.hole.measurements` | pos | `level ?? 0` |
| `study` | `/account/world-5/hole` | `account.hole.studies.studies` | pos (`listIndex` repeats) | `level` |
| `schematic` | `/account/world-5/hole` | `account.hole.engineerBonuses` | `String(index)` | boolean `unlocked ? 1 : 0` |
| `artifact` | `/account/world-5/sailing` | `account.sailing.artifacts` | `rawName` | `tier` = `acquired ?? 0`, tiers None / Base / Ancient / Eldritch / Sovereign / Omnipotent / Transcendent / Verisimilitude |
| `captain` | `/account/world-5/sailing` | `account.sailing.captains` (save-driven) | `String(captainIndex)` | `level` |
| `boat` | `/account/world-5/sailing` | `account.sailing.boats` (save-driven) | `String(boatIndex)` | `level`, `loot` = `lootLevel`, `speed` = `speedLevel` |
| `lootPile` | `/account/world-5/sailing` | `account.sailing.lootPile` (save-driven) | `rawName` | `amount` |
| `slab` | `/account/world-5/slab` | `account.looty.slabItems` | `itemRawName` | boolean `obtained ? 1 : 0` |

Tests: artifact tier names; key stability for `gamingImport`. Browser check: sailing (system select), hole. **Commit** `Goals: world 5 systems`

---

### Task 6: World 6

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `farmMarket` | `/account/world-6/farming` | `account.farming.market` | pos | `level ?? 0`, max `maxLvl` (current cap) |
| `exoticMarket` | `/account/world-6/farming` | `account.farming.exoticMarket` | `String(index)` | `level` |
| `landRank` | `/account/world-6/farming` | `account.farming.ranks` | pos | `level` = `upgradeLevel ?? 0`, max `realCap(maxLevel)` |
| `crop` | `/account/world-6/farming` | catalog crop id range (as `Crop.jsx:11` loops `seedInfo`) | crop id | `count` = `account.farming.crop?.[id] ?? 0` |
| `sticker` | `/account/world-6/farming` | `account.farming.stickers` minus `Nonexistent_Sticker` | sticker name (unique) | `count` |
| `sneakUpgrade` | `/account/world-6/sneaking` | `account.sneaking.upgrades` | pos | `level ?? 0` |
| `jade` | `/account/world-6/sneaking` | `account.sneaking.jadeEmporium` | `String(originalIndex)` | boolean `unlocked ? 1 : 0` |
| `gemstone` | `/account/world-6/sneaking` | `account.sneaking.gemStones` | `rawName` | `value` = `baseValue`, max `1e7` |
| `pristineCharm` | `/account/world-6/sneaking` | `account.sneaking.pristineCharms` | `rawName` | boolean `unlocked ? 1 : 0` |
| `summonUpgrade` | `/account/world-6/summoning` | `account.summoning.upgrades` flattened by colour | `String(originalIndex)` | `level`, max `realCap(maxLvl, 9999)`; groups: colour |
| `summonBattle` | `/account/world-6/summoning` | `account.summoning.allBattles[world]` | `enemyId` | boolean `won ? 1 : 0`; groups: world |
| `emperor` | `/account/world-6/emperor` | `[account.emperor]` | `'emperor'` | `showdown` = `highestEmperorShowdown ?? 0` |

Tests: key stability for `exoticMarket`, `jade`. Browser check: farming, summoning. **Commit** `Goals: world 6 systems`

---

### Task 7: World 7

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `legendTalent` | `/account/world-7/legend-talents` | `account.legendTalents.talents` | `String(originalIndex)` | `level`, max `maxLevel` (icon uses the display `index`) |
| `spelunkUpgrade` | `/account/world-7/spelunking` | `account.spelunking.upgrades` | `String(originalIndex)` | `level`, max `realCap(x3, UNCAPPED_MAX_LEVEL)` (export it from `spelunking.ts:905-909`) |
| `spelunkChapter` | `/account/world-7/spelunking` | `account.spelunking.chapters[c]` | `` `${c}:${i}` `` | `level` |
| `discovery` | `/account/world-7/spelunking` | `account.spelunking.discoveries[cave].slice(0, -1)` (last rock is the lore boss) | `` `${cave}:${name}` `` | boolean `acquired ? 1 : 0` |
| `loreBoss` | `/account/world-7/spelunking` | `account.spelunking.loreBosses` | `String(index)` | boolean `defeated`; `grandDiscoveries` = `grandDiscoveriesFound`, max 10 |
| `elixir` | `/account/world-7/spelunking` | `account.spelunking.elixirs` | `String(index)` | `quantity` |
| `researchSquare` | `/account/world-7/research` | `account.research.gridSquares` minus placeholder `"Name"` rows | `String(index)` | `level`, max `maxLv` |
| `observation` | `/account/world-7/research` | `account.research.observations` | `String(index)` | `insight` = `insightLevel` |
| `coralKid` | `/account/world-7/coral-reef` | `account.coralReef.coralKidUpgrades` | `String(index)` | `level` |
| `dancingCoral` | `/account/world-7/coral-reef` | `account.coralReef.dancingCoral` | `String(index)` | `level` |
| `reefUpgrade` | `/account/world-7/coral-reef` | `account.coralReef.reefUpgrades` | `String(index)` | `level`, max `x1` |
| `clamPearl` | `/account/world-7/clam-work` | `account.clamWork.upgrades` | `String(index)` | `level` |
| `scurge` | `/account/world-7/clam-work` | `account.clamWork.scurge.upgrades` | `String(index)` | `level` |
| `mineheadUpgrade` | `/account/world-7/minehead` | `account.minehead.upgrades` minus the max-0 row | `String(index)` | `level`, max `realCap(maxLevel, 999)` |
| `mineheadOpponent` | `/account/world-7/minehead` | `account.minehead.opponents` | `String(index)` | boolean `beaten ? 1 : 0` |
| `glimbo` | `/account/world-7/glimbo` | `account.minehead.glimbo` | `String(vaultIdx)` | `trades` (no max) |
| `sushiUpgrade` | `/account/world-7/sushi-station` | `account.sushiStation.upgrades` | `String(upgradeIndex)` | `level`, max `Number.isFinite(maxLevel) ? maxLevel : null` |
| `sushiKnowledge` | `/account/world-7/sushi-station` | `account.sushiStation.knowledge` | `rawName` | `level` |
| `jellyUpgrade` | `/account/world-7/jelly-operator` | `account.jellyOperator.upgrades` | `String(id)` | `level`, max `realCap(maxLevel)` |
| `jellyCell` | `/account/world-7/jelly-operator` | `account.jellyOperator.cells` | `String(index)` | `level` |
| `jellyObstruction` | `/account/world-7/jelly-operator` | `account.jellyOperator.obstructions` minus `placeholder` | `String(index)` | boolean `defeated ? 1 : 0` |
| `menagerieUnlock` | `/account/world-7/menagerie` | `account.menagerie.unlocks` | `String(index)` | boolean `owned ? 1 : 0` |
| `menagerieBoost` | `/account/world-7/menagerie` | `account.menagerie.boosts` | `String(index)` | `level` |
| `trophy` | `/account/world-7/gallery` | `account.gallery.allTrophies` | `rawName` | boolean `isAcquired ? 1 : 0` |
| `nametag` | `/account/world-7/gallery` | `account.gallery.allNametags` | `rawName` | `level ?? 0` |
| `buttonBonus` | `/account/world-7/the-button` | `account.button.bonuses` | `String(index)` | `level` |

Tests: key stability for `loreBoss`, `observation`, `trophy`. Browser check: spelunking (system select), research. **Commit** `Goals: world 7 systems`

---

### Task 8: Misc and class-specific remainder

| system | route | list | key | metric(s) |
|---|---|---|---|---|
| `guildBonus` | `/account/misc/guild` | `account.guild.guildBonuses` | `String(index)` | `level`, max `maxLevel` |
| `gemShop` | `/account/prem-currency/gem-shop` | catalog `gemShop.json` rows with a unique `globalIndex` (skip specials and placeholders, dedupe) joined with `account.gemShopPurchases[globalIndex] ?? 0` | `String(globalIndex)` | `purchases`, max `realCap(maxPurchases, 100000)` |
| `companion` | `/account/prem-currency/pets` | `account.companions.list` | pos | boolean `copies > 0 ? 1 : 0` (`acquired` is also true for tokens) |
| `dungeonItem` | `/account/misc/dungeons` | `account.dungeons.rngItems` (add `index` in the map before `liveEntries`, `dungeons.ts:29-40`) | `String(index)` | `level`, max `maxLevel` |
| `dungeonUpgrade` | `/account/misc/dungeons` | `.upgrades`, `.insideUpgrades` (same `index` fix) | `` `${list}:${index}` `` | `level` |
| `vaultUpgrade` | `/account/misc/upgrade-vault` | `account.upgradeVault.upgrades` (add `index` before `liveEntries`, `upgradeVault.ts:30-36`) | `String(index)` | `level`, max `maxLevel` |
| `constellation` | `/account/misc/constellations` | `account.constellations` | `String(rawIndex)` | boolean `done ? 1 : 0` |
| `starSign` | `/account/misc/constellations` | `account.starSigns` | `starName` | boolean `unlocked ? 1 : 0` |
| `key` | `/account/misc/general` | `account.currencies.KeysAll` plus one `colosseumTickets` total row (the three ticket rows share one amount) | `rawName` / `'tickets'` | `amount` |
| `orblet` | `/account/class-specific/royal-guardian` | `account.royalGuardian.orbletMarket` | `String(index)` | `level`, max `maxLevel` |
| `royalStatue` | `/account/class-specific/royal-guardian` | `account.royalGuardian.royalStatues` minus `!named` | `String(index)` | `level` |
| `statueFlair` | `/account/class-specific/royal-guardian` | `account.royalGuardian.statueFlair.statues` | `String(index)` | `level`, max `maxLevel` (current cap) |
| `apocalypse` | `/account/class-specific/apocalypses` | per character `zow` / `chow` / `wow` lists | `` `${kind}:${mapName}` `` (`afkTarget` collides) | `kills` with a finite guard; character scope |
| `bones` | `/account/class-specific/grimoire` | `account.grimoire.bones` (numbers) | pos | `amount` |
| `dust` | `/account/class-specific/compass` | `account.compass.dusts` | pos | `amount` = `value` |
| `tachyon` | `/account/class-specific/tesseract` | `account.tesseract.tachyons` | pos | `amount` = `value` |

Browser check: upgrade vault, gem shop. **Commit** `Goals: misc and class-specific systems`

---

### Not in scope

Hole cavern layers and cavern sub-collections (formatted-string numbers, untyped), beanstalk (built in the page), menagerie missions (moving requirement), obols / equipment / equipped cards / active prayers (no numeric progress), construction board, weekly bosses (raw only), cooking spices (index bug, separate task), summoning stones (save-driven with no catalog fallback), speedrun difficulty (unconfirmed whether `BossInfo[n][0]` is progress or a selected difficulty). Revisit after tester feedback.
