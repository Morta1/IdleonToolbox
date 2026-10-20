# Goals 4: System Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every trackable system gets a descriptor and target icons on its page, including character-level systems, boolean and tier systems.

**Architecture:** No new architecture. Task 1 adds character scope to the UI; every later task is a batch of descriptors (one file each in `utility/goals/registry/`) plus `<SetGoalButton system entryKey />` at each entry's render site. The plan 1 contract test covers every new descriptor automatically; the NavBar `AddGoalButton` appears automatically on each registered route.

**Tech Stack:** as plans 1-2.

**Spec:** `docs/superpowers/specs/2026-10-20-dashboard-goals-design.md`

Depends on plans 1-3.

## Global Constraints

- Everything from plans 1-3.
- Descriptor rules: key from a game index / stable `rawName` (never a filtered-array position or display name); max = `null` for uncapped and placeholder caps (`realCap`); icon = the exact image the page renders for that entry (copy the page's expression); `route` = the page that renders the entry.
- Boolean systems: one metric `{ boolean: true, value: 0 | 1, max: 1 }`. Tier systems: metric with `tiers: [...]`, value = tier index.
- A row in a table below that turns out not to match the code: fix the descriptor to match the code and note it in the commit message; a system that cannot meet the contract test is dropped from the batch and listed in the final report, never forced through.
- Each task ends with: `npm test` green, Browser pane check on two of its pages (`?demo=true`: add one goal from an entry icon, see it on `/dashboard`), screenshots of those two pages.

## Review Focus

1. Keys that look stable but are positions in a filtered or sorted list (gallery, jade emporium, exotic market, observations, lore bosses, imports). Contract test asserts unique keys; Tasks 5-7 add a test per such system that the key of a known entry is identical in `latest` and `highend`.
2. Character goals when two pages show the same system for different characters (talents per character): the entry icon must carry the page's character. Test in Task 1.
3. Systems whose value is absent when zero (Killroy `killRoyKills`, `level` possibly undefined in sneaking): value must be 0, not NaN. Covered by the contract test's finite check; each such descriptor uses `?? 0`.
4. Tier names must match what the page shows (artifacts: None, Base, Ancient, Eldritch, Sovereign, Omnipotent, Transcendent). Test in Task 5.
5. Pages with several systems (Hole, Sailing, Spelunking, Royal Guardian): the header popover must offer a system select. Covered by plan 2's `systems` prop; checked in the browser step of Tasks 5 and 7.

---

### Task 1: Character scope

**Files:**
- Create: `components/goals/parts/CharacterPicker.jsx`
- Modify: `components/goals/GoalPopover.jsx` (show `CharacterPicker` for `scope: 'character'` systems when no character is passed in), `components/goals/SetGoalButton.jsx` (`scope={{ char: name }}` prop), `components/dashboard/goals/Goals.jsx` (character goals grouped under the character name)
- Create descriptors: `skill`, `talent`, `starTalent`, `postOffice`, `charLevel`
- Modify: the characters page components rendering skills (`components/characters/Skills.jsx`), talents (`Talents.jsx`), star talents, post office (`PostOffice.jsx`), character level
- Test: `__test__/components/GoalPopover.test.jsx` (extend), contract test covers descriptors (character descriptors are listed per character of each fixture)

| system | list (per character) | key | metric(s) |
|---|---|---|---|
| `skill` | `Object.entries(character.skillsInfo)` | skill name | `level` (no max) |
| `talent` | `character.flatTalents` | `String(talentId)` | `level` = `baseLevel` (invested), max `realCap(maxLevel)` (-1 → null) |
| `starTalent` | `character.flatStarTalents` | `String(talentId)` | `level`, max `maxLevel` |
| `postOffice` | `character.postOffice.boxes` | `String(index)` | `level`, max `maxLevel` |
| `charLevel` | `[character]` | `'level'` | `level` |

- [ ] **Step 1: Write the failing tests**: popover for `talent` without a character shows the picker; with `scope={{ char: 'A' }}` it does not; a saved goal has `scope: { char: 'A' }` and resolves against character A only.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS + browser check on the characters page (talents tab, skills).
- [ ] **Step 5: Commit** `Goals: character goals for skills, talents, post office and level`

---

### Task 2: Worlds 1-2

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `statue` | `account.statues` | `String(statueIndex)` | `level`; `tier` (tiers None / Gold / Onyx / Zenith from `statueGrades`) | rawName changes with tier: never key on it |
| `forge` | `account.forge.upgrades` | `String(index)` | `level`, max `maxLevel` | |
| `owl` | `account.owl.upgrades` | `String(index)` | `level` | icons in `etc/` |
| `bribe` | `account.bribes` | `String(index)` | boolean `done` | |
| `arcade` | `account.arcade.shop` minus `isArcadePlaceholder` | `String(index)` | `level`, max 102 (omega) | |
| `vial` | `account.alchemy.vials` | `mainItem` | `level`, max `MAX_VIAL_LEVEL` | no index field |
| `sigil` | `account.alchemy.p2w.sigils` | `String(index)` | `tier` (tiers from the sigils page labels, value `unlocked + 1`) | charge EXP not tracked |
| `cauldronUpgrade` | `account.alchemy.p2w.cauldrons` × speed / newBubble / boostReq, `p2w.liquids` × regen / capacity | `` `${cauldron}:${part}` `` | `level`, max from `CAULDRONS_MAX_LEVELS` | groups: cauldron |
| `killroyKills` | `account.killroy.list` | `rawName` | `kills` = `killRoyKills ?? 0` | |
| `killroyUpgrade` | `account.killroy.upgrades` | `String(index)` | `level` | |
| `killroyShop` | `account.killroy.permanentUpgrades` | `String(i)` | `level`; `percentOfMax` = `progress` | |
| `kangaroo` | `account.kangaroo.upgrades`, `.tarUpgrades` | `` `${list}:${index}` `` | `level` | |
| `island` | `account.islands.list` | `String(index)` | boolean `unlocked` | |

- [ ] **Step 1:** add descriptors; run the contract test → FAIL until all pass. **Step 2:** fix until PASS. **Step 3:** wire `SetGoalButton` on each page's entries. **Step 4:** `npm test` + browser check (vials, statues) + screenshots. **Step 5: Commit** `Goals: worlds 1 and 2 systems`

---

### Task 3: World 3

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `shrine` | `account.shrines` | `String(index)` | `level` = `shrineLevel` | |
| `prayer` | `account.prayers` | `String(prayerIndex)` | `level`, max `maxLevel` | |
| `salt` | `account.refinery.salts` | `rawName` | `rank` | |
| `saltLick` | `account.saltLick` | `String(index)` | `level`, max `maxLevel` | |
| `building` | `account.towers.data` | `String(index)` | `level`, max `getExtraMaxLevels(account, maxLevel, atomLevel, index)` as `buildings.jsx:62` | |
| `atom` | `account.atoms.atoms` | `rawName` | `level`, max `maxLevel` | |
| `equinoxUpgrade` | `account.equinox.upgrades` | `String(index)` | `level` = `lvl`, max `maxLvl` | |
| `equinoxChallenge` | `account.equinox.challenges` | `String(index)` | boolean `current === -1` | -1 sentinel = done |
| `totem` | `account.totems` | `String(index)` | `wave` = `maxWave` | |
| `deathNote` | `account.deathNote[world].mobs` | `rawName` | `kills`; `rank` (tiers from `DEATH_NOTE_RANKS` via `getDeathNoteRank`) | groups: world |
| `hatRack` | `account.hatRack.allPremiumHelmets` | `rawName` | boolean `isAcquired` | list is sorted |
| `armorSet` | `account.armorSmithy.sets` | `setName` | boolean `unlocked` | |

- [ ] Steps as Task 2 (browser check: prayers, death note). **Commit** `Goals: world 3 systems`

---

### Task 4: World 4 and account-wide collections

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `pet` | `account.breeding.pets[world][i]` | `monsterRawName` | `level`; `shiny` (max `getMaxShinyLevel`); `breedability` (max `MAX_BREEDABILITY_LEVEL`) | groups: world |
| `petUpgrade` | `account.breeding.petUpgrades` | `String(upgradeIndex)` | `level`, max `maxLevel` | save-driven list (empty logged out) |
| `meal` | `account.cooking.meals` | `rawName` | `level`, max `account.cooking.mealMaxLevel` | |
| `kitchen` | `account.cooking.kitchens` | `String(index)` | `speed`, `fire`, `luck` | |
| `chip` | `account.lab.chips` | `String(index)` | `owned` = `totalAmount` | |
| `jewel` | `account.lab.jewels` | `rawName` | boolean `acquired` | |
| `tome` | `account.tome.tome` | catalog position, not the `index` field (display order) | `quantity`; `points`, max `maxPoints` | |
| `card` | `account.cards` | `cardIndex` | `stars` (tiers from the card page star labels; 0-based); `amount` | object keyed by display name: re-key |
| `achievement` | `account.achievements` | `String(index)` | boolean `completed` | |
| `task` | `account.tasksDescriptions[world]` minus slot 8 | `` `${world}:${i}` `` | `level`, max `maxLevel` | slot 8 rotates daily |
| `merit` | `account.meritsDescriptions[world]` | `` `${world}:${i}` `` | `level`, max `totalLevels` | |
| `taskUnlock` | `account.taskUnlocks.taskUnlocksList` | `` `${col}:${i}` `` | boolean `unlocked` | |
| `rift` | `[account.rift]` | `'rift'` | `level` = `currentRift`, max `list.length` | |

- [ ] Steps as Task 2 (browser check: breeding, cooking). **Commit** `Goals: world 4 and account collections`

---

### Task 5: World 5

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `god` | `account.divinity.deities` | `rawName` | `level`, max `maxLevel` | |
| `fertilizer` | `account.gaming.fertilizerUpgrades` | `String(index)` | `level` | |
| `gamingImport` | `account.gaming.imports` | `String(index)` from `GamingItem${i}` | `level` | filtered list: key test |
| `superbit` | `account.gaming.superbitsUpgrades` | `String(originalIndex)` | boolean `unlocked` | |
| `logBook` | `account.gaming.logBook` | `rawName` without `.png` | boolean `unlocked`; boolean `crowned` | |
| `palette` | `account.gaming.palette` | `String(index)` | `level` | |
| `villager` | `account.hole.villagers` | `String(index)` | `level` | `exp` is a formatted string: not tracked |
| `majik` | `account.hole.majiks[tree]` | `` `${tree}:${index}` `` | `level`, max `maxLevel` | groups: tree |
| `measurement` | `account.hole.measurements` | `String(index)` | `level` | |
| `study` | `account.hole.studies.studies` | `String(listIndex)` | `level` | |
| `schematic` | `account.hole.engineerBonuses` | `String(index)` | boolean `unlocked` | |
| `artifact` | `account.sailing.artifacts` | `String(index)` | `tier` (None, Base, Ancient, Eldritch, Sovereign, Omnipotent, Transcendent) | |
| `captain` | `account.sailing.captains` | `String(captainIndex)` | `level` | |
| `boat` | `account.sailing.boats` | `String(boatIndex)` | `level`, `loot` = `lootLevel`, `speed` = `speedLevel` | |
| `lootPile` | `account.sailing.lootPile` | `rawName` | `amount` | |
| `slab` | `account.looty.slabItems` | `itemRawName` | boolean `obtained` | |

Add the artifact tier-name test and the key-stability test for `gamingImport`. Browser check: sailing (system select in the header popover), hole. **Commit** `Goals: world 5 systems`

---

### Task 6: World 6

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `farmMarket` | `account.farming.market` | position in the unfiltered market (no id field: add `index` in `farming.ts` map if missing) | `level`, max `maxLvl` | |
| `exoticMarket` | `account.farming.exoticMarket` | `String(index)` | `level` | filtered list: key test |
| `landRank` | `account.farming.ranks` | `String(index)` | `level` = `upgradeLevel`, max `maxLevel` | |
| `crop` | `account.farming.crop` minus `beans` | crop id | `count` | |
| `sneakUpgrade` | `account.sneaking.upgrades` | `String(index)` | `level` = `level ?? 0` | |
| `jade` | `account.sneaking.jadeEmporium` | `String(originalIndex)` | boolean `unlocked` | sorted list: key test |
| `gemstone` | `account.sneaking.gemStones` | `rawName` | `value` = `baseValue`, max 1e7 | |
| `pristineCharm` | `account.sneaking.pristineCharms` | `rawName` | boolean `unlocked` | |
| `summonUpgrade` | `account.summoning.upgrades` (flatten colours) | `String(originalIndex)` | `level`, max `maxLvl` | groups: colour |
| `summonStone` | `account.summoning.summoningStones` | `String(index)` | `kills` | |
| `summonBattle` | `account.summoning.allBattles[world]` | `enemyId` | boolean `won` | groups: world |
| `emperor` | `[account.emperor]` | `'emperor'` | `showdown` = `highestEmperorShowdown` | |

Browser check: farming, summoning. **Commit** `Goals: world 6 systems`

---

### Task 7: World 7

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `legendTalent` | `account.legendTalents.talents` | `String(originalIndex)` | `level`, max `maxLevel` | icon uses the display `index` |
| `spelunkUpgrade` | `account.spelunking.upgrades` | `String(originalIndex)` | `level`, max `realCap(x3, UNCAPPED_MAX_LEVEL)` | |
| `spelunkChapter` | `account.spelunking.chapters[c]` | `` `${c}:${i}` `` | `level` | |
| `discovery` | `account.spelunking.discoveries[cave]` | `` `${cave}:${name}` `` | boolean `acquired` | |
| `loreBoss` | `account.spelunking.loreBosses` | `String(index)` | boolean `defeated`; `grandDiscoveries` max 10 | filtered list: key test |
| `elixir` | `account.spelunking.elixirs` | `String(index)` | `quantity` | |
| `researchSquare` | `account.research.gridSquares` | `String(index)` | `level`, max `maxLv` | |
| `observation` | `account.research.observations` | `String(index)` | `insight` = `insightLevel` | filtered list: key test |
| `coralKid` | `account.coralReef.coralKidUpgrades` | `String(index)` | `level` | |
| `dancingCoral` | `account.coralReef.dancingCoral` | `String(index)` | `level` | |
| `reefUpgrade` | `account.coralReef.reefUpgrades` | `String(index)` | `level`, max `x1` | |
| `clamPearl` | `account.clamWork.upgrades` | `String(index)` | `level` | |
| `scurge` | `account.clamWork.scurge.upgrades` | `String(index)` | `level` | |
| `mineheadUpgrade` | `account.minehead.upgrades` | `String(index)` | `level`, max `maxLevel` | |
| `mineheadOpponent` | `account.minehead.opponents` | `String(index)` | boolean `beaten` | |
| `glimbo` | `account.minehead.glimbo` | `String(vaultIdx)` | `trades`, max `currentMaxLevel` | |
| `sushiUpgrade` | `account.sushiStation.upgrades` | `String(upgradeIndex)` | `level`, max `maxLevel` | |
| `sushiKnowledge` | `account.sushiStation.knowledge` | `rawName` | `level` | |
| `jellyUpgrade` | `account.jellyOperator.upgrades` | `String(id)` | `level`, max `maxLevel` | |
| `jellyCell` | `account.jellyOperator.cells` | `String(index)` | `level` | |
| `jellyObstruction` | `account.jellyOperator.obstructions` | `String(index)` | boolean `defeated` | |
| `menagerieUnlock` | `account.menagerie.unlocks` | `String(index)` | boolean `owned` | |
| `menagerieBoost` | `account.menagerie.boosts` | `String(index)` | `level` | |
| `trophy` | `account.gallery.allTrophies` | `rawName` | boolean `isAcquired` | sorted list |
| `nametag` | `account.gallery.allNametags` | `rawName` | `level` | |
| `buttonBonus` | `account.button.bonuses` | `String(index)` | `level` | |

Browser check: spelunking (system select), research. **Commit** `Goals: world 7 systems`

---

### Task 8: Misc, class-specific remainder

| system | path | key | metric(s) | notes |
|---|---|---|---|---|
| `guildBonus` | `account.guild.guildBonuses` | `String(index)` | `level`, max `maxLevel` | |
| `gemShop` | catalog `gemShop.json` joined with `account.gemShopPurchases[globalIndex]` | `String(globalIndex)` | `purchases`, max `maxPurchases` | |
| `companion` | `account.companions.list` | `String(index)` | boolean `acquired` | |
| `dungeonItem` | `account.dungeons.rngItems` | `String(index)` | `level`, max `maxLevel` | |
| `dungeonUpgrade` | `account.dungeons.upgrades`, `.insideUpgrades` | `` `${list}:${index}` `` | `level` | |
| `vaultUpgrade` | `account.upgradeVault.upgrades` | `String(index)` | `level`, max `maxLevel` | |
| `constellation` | `account.constellations` | `String(rawIndex)` | boolean `done` | |
| `starSign` | `account.starSigns` | `starName` | boolean `unlocked` | |
| `key` | `account.currencies.KeysAll`, `ColosseumTickets.allTickets` | `rawName` | `amount` | |
| `orblet` | `account.royalGuardian.orbletMarket` | `String(index)` | `level`, max `maxLevel` | |
| `royalStatue` | `account.royalGuardian.royalStatues` | `String(index)` | `level` | |
| `statueFlair` | `account.royalGuardian.statueFlair.statues` | `String(index)` | `level`, max `maxLevel` | |
| `speedrun` | `account.speedrun.bosses` | `String(mapIndex)` | `difficulty` (tiers from `difficultyName`) | |
| `apocalypse` | per character `zow` / `chow` / `wow` lists | `` `${kind}:${afkTarget}` `` | `kills` | character scope |
| `masterclassCurrency` | `compass.dusts`, `tesseract.tachyons`, `grimoire.bones` | `` `${list}:${i}` `` | `amount` | |

Browser check: upgrade vault, gem shop. **Commit** `Goals: misc and class-specific systems`

---

### Not in scope (from the spec's "awkward" bucket)

Hole cavern layers and cavern sub-collections (formatted-string numbers, untyped), stickers (filtered, no index), beanstalk (built in the page), menagerie missions (moving requirement), obols / equipment / equipped cards / active prayers (no numeric progress), construction board, weekly bosses (raw only), cooking spices (index bug, separate task). Revisit after tester feedback.
