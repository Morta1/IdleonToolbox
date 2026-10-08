# Alert settings: labels and help for review

**Date:** 2026-10-06
**Branch:** `feat/dashboard-alert-settings`
**Source of truth:** `utility/dashboard/alertMeta.js` (`alertMeta`, `sectionMeta`), guarded by
`__test__/utility/alert-meta.test.js`
**Spec:** `2026-10-06-dashboard-alert-settings-design.md`, section 2 "Metadata registry"

Every tracker (98) and every option (189) in `baseTrackers` has a plain label. The spec counts 186
options; the 3 extra are the group B/C options that have landed since (Gaming `drops`, Cards
`passiveCards`, Alchemy `noActivity`). The tables below are generated from the file, so they match
it exactly. Help text over 110 characters is shortened here, not in the file.

Reading the tables: a row with a tracker key is the alert card itself; the rows under it are its
options. "Current name" is what today's dialog shows (`camelToTitleCase` of the key, plus the input
label and category heading where there is one). "Q" in Notes points at the questions below.

## Questions for review

**Resolved 2026-10-07:** all as recommended. Q1 fixed (lastLooted honours its checkbox), Q2 fixed (a
full shelf alerts at threshold 0), Q3/Q4 wording kept, Q5 buckets min lowered to 0, Q12 help added
to "Show skills not maxed yet"; the rest kept as written. Q13-Q19 were built into the R2 window, and
icons (Q19) were settled in a later review.

**Possible bugs found while reading the alert code** (not changed; this pass is labels only)

1. **Q1 Sneaking `lastLooted` ignores its checkbox.** `account.js:1333` checks the minutes but never
   `lastLooted.checked`, so unticking it does nothing. Fix in R1, or leave?
2. **Q2 Cooking `ribbons` never alerts on a full shelf.** The alert value is the number of empty
   slots, and `Account.jsx:451` only renders it when truthy. With the default threshold 0, a full
   shelf (0 empty) produces `0` and shows nothing; it fires only for 1..threshold empty slots. My help
   says "this many empty slots or fewer": is that the intent, and should 0 work?
3. **Q3 Printer `includeResource` says "Exclude" but ticked items alert.** The code excludes the
   unticked keys (`account.js:700`), and every default is ticked, so all the "parked on purpose"
   materials from `getPrinterExclusions` alert by default, which contradicts the comment in
   `printer.ts`. I labelled it "Watched printed items" (ticked = alerts). Confirm the wording, and
   whether the defaults should start unticked.
4. **Q4 Printer `showAlertWhenFull`: my reading.** When on, an item alerts only once storage already
   holds the atom conversion amount (`atomable`); when off, it alerts as soon as printing would push it
   past. Label "Only once storage is at the cap". Please confirm.
5. **Q5 Hole `buckets` "Set 0 for max" cannot be typed.** The input has `minValue: 1`. Kept the help
   ("0 uses its max"); drop it, or lower the min to 0?

**Not sure what it does** (worded conservatively)

6. **Q6 Alchemy `alternateParticles`** reads `accountOptions[135] > 0` ("alternate particles upgrades
   available"). I do not know which upgrade this is, so the label only repeats the alert title, and
   the group (Cauldrons) is a guess.
7. **Q7 Alchemy `bargainTag` / `gems`** fire while the liquid shop price is still at its base, which I
   read as "not bought today". Labels: "Bargain Tag not bought today", "Alchemy gems not bought today".
8. **Q8 Shops:** help says "still has stock in its shop". I did not claim a daily restock since the
   code does not show one.
9. **Q9 `gemsFromBosses`:** `(600 - accountOptions[195]) / 4`. I do not know if that cap is weekly or
   lifetime, so the label is just "Boss kills left for gems" (group Account).
10. **Q10 `passiveCards`:** label "Passive card equipped", no help. Add "Passive cards work without
    being equipped"? I did not want to state a mechanic the code does not show.
11. **Q11 Characters post office `unspentPoints`:** the old input label said "Number of boxes" but it
    compares unspent points, strictly more than the value, and only while a box is not maxed. Labelled
    "Unspent box points", help says "more than this".
12. **Q12 Crystal Countdown:** with both `showMaxed` and `showNonMaxed` off, nothing shows at all. Worth
    a help line or a foldInto? Left as two plain checkboxes.

**Judgement calls**

13. **Q13 Groups are not contiguous in key order.** Royal Guardian `sharedNodes` and `restockLocked`
    are in Outposts but sit after Units and Rank caps in `baseTrackers`; the Hole groups interleave
    too. The editor must render by group (first appearance order), or the options need reordering.
14. **Q14 Groups beyond Royal Guardian.** Every tracker with 8+ options got groups: Miscellaneous
    (Daily, Events, Account), Alchemy (Liquid shop, Cauldrons, Vials), The Hole (Resource caverns,
    Monuments, Other caverns, Villagers and studies). Royal Guardian: Outposts, Units, Rank caps as
    asked, with `sharedNodes` and `restockLocked` under Outposts.
15. **Q15 `dependsOn`.** Verified in the alert code. Beyond the six requested (five modifiers plus `overkillBeforeReset`) I added
    `matsThreshold` to `materials` (only read inside the materials check), `subtractGreenStacks` to
    `vials` and `alwaysShowTalents` to `talents`.
    Deliberately not marked: `showAlertWhenFull` (changes the whole printer alert, `includeResource` is
    a picker), `eggsRarity`/`eggs`, `jarsFull`/`jars`, the two Crystal Countdown filters (independent),
    and `saltBalanceDirection` (it has `foldInto: 'saltBalance'` instead).
16. **Q16 `inline`.** Only trackers whose whole control is one number: Talent library (`books`), Atom
    collider (`stampReducer`), Emperor (`emperor`), Characters post office (`unspentPoints`). Trackers
    with one checkbox and no number (Traps, Forge, Hat rack...) are not inline.
17. **Q17 Tracker renames.** `General.etc` is "Miscellaneous", `World 6.etc` is "Emperor" (its only
    option), `World 7.construction` is "Jeweled cogs", W3 `construction` is "Construction and
    refinery", the timers `Etc` section is "Other". Also "Talent library", "Orion the owl", "Poppy the
    kangaroo", "Class form items", "W2 boss raid".
18. **Q18 Clicker units.** Only 3 clickers have a `category`; I gave the unit to all five (Mega
    Feather Restart to Orion, Greatest Catch to Poppy). `unit` sits on the tracker for timers, while
    the spec table lists `unit` at option level only: the editor needs to read it there.
19. **Q19 Icons.** Omitted where the call site icon is dynamic (Material tracker, Miscellaneous, Hat
    rack, Laboratory, Beanstalk, Gallery, Crystal Countdown, Better tool, Talents, sailing trades,
    minibosses, closest building, closest salt). No section icons yet. `data/ConTower0` is used for
    both the 3D printer and Construction, as in the spec example.
20. **Q20 Timer names I inferred.** "Boss and miniboss respawns" (the `minibosses` box also shows boss
    respawns), "Library books", "Charge Syphon overflow", "Fountain coin bar" and "Fountain marble
    bar" (the tile itself shows the bar name from game data).
21. **Q21 Thresholds that are strictly greater.** Kangaroo `shinyThreshold` alerts above the value
    (min 100) and Characters post office above it; every other threshold is "this many or more".
    Labels say "reached" where it reads naturally; help states the exact rule for those two.
22. **Q22 Help skipped** where the label says it all (84 of the 189 options). Say if any of those deserve one.

## Account

### General (`General`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `tasks` | | Tasks | **Daily tasks** | | icon etc/Merit_0 |
| | `tasks` | Tasks (heading: Worlds) | Worlds to check | Alerts when the daily task of a ticked world is not done yet. |  |
| `materialTracker` | | Material Tracker | **Material tracker** | | no icon |
| `guild` | | Guild | **Guild tasks** | | icon etc/GP |
| | `daily` | Daily | Daily guild tasks left |  |  |
| | `weekly` | Weekly | Weekly guild tasks left |  |  |
| `shops` | | Shops | **Town shops** | | icon data/ShopEZ0 |
| | `shops` | Shops | Watched shop items | Alerts while a ticked item still has stock in its shop. Shops of worlds you have not finished are skipped. | Q8 |
| `etc` | | Etc | **Miscellaneous** | | Renamed from Etc; no icon |
| | `dungeonTraits` | Dungeon Traits | Dungeon trait not selected |  | group Account |
| | `randomEvents` | Random Events | No random event done today |  | group Daily |
| | `keys` | Keys | Keys and tickets ready | Alerts when keys or colosseum tickets have not been picked up for 3 days or more. | group Account |
| | `miniBosses` | Mini Bosses (input: Bosses threshold) | Miniboss kills stacked | Alerts when a miniboss has this many kills available. The lowest value is 2. | unit kills; group Account |
| | `newCharacters` | New Characters | New character slot available | Alerts when your total character levels unlock another character. | group Account |
| | `gemsFromBosses` | Gems From Bosses | Boss kills left for gems |  | Q9; group Account |
| | `familyObols` | Family Obols | Empty family obol slots |  | group Account |
| | `freeCompanion` | Free Companion | Free companion to claim |  | group Events |
| | `petMartGems` | Pet Mart Gems | Free Pet Mart gems |  | group Events |
| | `tournamentRegister` | Tournament Register | Not registered for the Pet Tournament | Alerts when you have not registered for the current Pet Tournament. | group Events |
| | `raidRegister` | Raid Register | Not registered for the Raid | Alerts when you have not registered for the current Raid. | group Events |
| | `dailyCrystals` | Daily Crystals | Daily guaranteed crystals left | Alerts while guaranteed crystal mob kills remain for today. | group Daily |
| | `arcanistDailyDrops` | Arcanist Daily Drops (heading: arcanistDailyDrops) | Arcanist drops left today | Alerts while Arcanist weapon or ring drops remain for today (100 of each a day). Each drop type can be turn... | group Daily |
| | `topOfTheMornin` | Top Of The Mornin | Top of the Mornin kills left | Alerts while Top of the Mornin kills remain for today. | group Daily |
| | `glimmerwickCandle` | Glimmerwick Candle | Glimmerwick Candle not used today | Alerts when you own a Glimmerwick Candle and have not wished on it today. | group Daily |

### World 1 (`World 1`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `stamps` | | Stamps | **Stamps** | | icon data/GildedStamp |
| | `gildedStamps` | Gilded Stamps | Gilded stamps available |  |  |
| | `showGildedWhenNoAtomDiscount` | Show Gilded When No Atom Discount | Only when the stamp atom discount is 0 | Holds the gilded stamps alert back while the Stamp Reducer atom still gives a discount. | dependsOn gildedStamps |
| | `affordableStampLevels` | Affordable Stamp Levels (input: Max coin spend) | Stamps you can max with coins | Alerts when stamps can be levelled to max for at most this share of your account coins, cheapest first. | unit % |
| | `exaltedStamps` | Exalted Stamps | Exalted stamps to apply | Alerts when you have compass exalted stamps you have not applied yet. |  |
| `owl` | | Owl | **Orion the owl** | | icon etc/Owl_4 |
| | `featherRestart` | Feather Restart | Feather Restart affordable |  |  |
| | `megaFeatherRestart` | Mega Feather Restart | Mega Feather Restart affordable |  |  |
| `forge` | | Forge | **Forge** | | icon data/ForgeA |
| | `emptySlots` | Empty Slots | Empty forge slots |  |  |

### World 2 (`World 2`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `alchemy` | | Alchemy | **Alchemy** | | icon data/aJarB0 |
| | `bargainTag` | Bargain Tag (heading: liquidShop) | Bargain Tag not bought today |  | Q7; group Liquid shop |
| | `gems` | Gems | Alchemy gems not bought today |  | Q7; group Liquid shop |
| | `sigils` | Sigils (heading: sigils) | Sigils ready to level up |  | group Cauldrons |
| | `liquids` | Liquids (input: Liquid percent) (heading: liquids) | Liquid almost full | Alerts when a liquid cauldron is filled to this percent of its capacity. | unit %; group Cauldrons |
| | `vials` | Vials (heading: vials) | Vials you can level up |  | group Vials |
| | `vialsAttempts` | Vials Attempts | Vial attempts left | Alerts when you have vial attempts and own the item a locked vial needs. | group Vials |
| | `p2wUpgrades` | P2W Upgrades | Affordable P2W upgrades | Cauldron and liquid P2W upgrades you can level with your account coins. | group Cauldrons |
| | `subtractGreenStacks` | Subtract Green Stacks | Leave a green stack in storage | Counts 10M fewer of each vial item, so a vial only alerts once you can level it and keep a green stack. | dependsOn vials; group Vials |
| | `alternateParticles` | Alternate Particles | Alternate particle upgrades available |  | Q6; group Cauldrons |
| `islands` | | Islands | **Islands** | | icon data/Island1 |
| | `unclaimedDays` | Unclaimed Days (input: Threshold) | Island days unclaimed | Alerts when you have not collected your islands for this many days. | unit days |
| | `shimmerIsland` | Shimmer Island | Shimmer trial not claimed this week |  |  |
| | `garbageUpgrade` | Garbage Upgrade | Garbage Gain upgrade affordable |  |  |
| | `collectibleGarbage` | Collectible Garbage (input: Threshold) | Garbage waiting on Trash Island | A single collection is capped at 100 garbage. Anything above it is lost. |  |
| | `crystalIsland` | Crystal Island (input: Days) | Crystal Island days unclaimed | Caps at 14 days, and a capped island spawns fewer giant crystal mobs (15) than 13 days does (27). | unit days |
| `postOffice` | | Post Office | **Post office shipments** | | icon data/UIlilbox |
| | `dailyShipments` | Daily Shipments (heading: dailyShipments) | Shipments to check | Alerts when a ticked shipment has no completed order today. |  |
| | `showAlertOnlyWhen0Shields` | Show Alert Only When 0 Shields | Only when the shipment has no shields |  | dependsOn dailyShipments; old helper "Daily shipments alert" dropped |
| `arcade` | | Arcade | **Arcade** | | icon data/PachiBall0 |
| | `balls` | Balls | Ball capacity almost full | Alerts within 5% of your max ball capacity. |  |
| | `unmaxedRotation` | Unmaxed Rotation | Shop rotation upgrades below max | Alerts when the current arcade shop rotation has upgrades below max level. |  |
| | `includeSuper` | Include Super | Count Super upgrades as unmaxed | Also alerts when a rotation upgrade is maxed but not Super upgraded (Lv 101). | dependsOn unmaxedRotation |
| `weeklyBosses` | | Weekly Bosses | **W2 boss raid** | | icon data/Trophie |
| | `daily` | Daily | Daily boss raid not done | Alerts when you have not reset the W2 boss raid today (bonus class exp and damage). |  |
| | `trophy` | Trophy | Trophies left this week | Alerts until you have beaten 5 skulls this week, the point where trophies stop dropping. |  |
| `killRoy` | | Killroy | **Killroy** | | icon etc/Killroy |
| | `general` | General | Killroy available | Alerts when you have not done a Killroy run this week. |  |
| | `underHundredKills` | Under Hundred Kills | Monsters under 100 kills | Alerts when the current Killroy has monsters below 100 Killroy kills (for equinox). |  |
| | `skulls` | Skulls | Unspent Killroy skulls |  |  |
| `kangaroo` | | Kangaroo | **Poppy the kangaroo** | | icon etc/KShiny |
| | `shinyThreshold` | Shiny Threshold (input: Shiny Catch %) | Shiny catch progress reached | Alerts when your shiny catch progress is above this percent. | unit % |
| | `fisherooReset` | Fisheroo Reset | Fisheroo Reset affordable |  |  |
| | `greatestCatch` | Greatest Catch | Greatest Catch affordable |  |  |

### World 3 (`World 3`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `printer` | | Printer | **3D printer** | | icon data/ConTower0 |
| | `includeResource` | Include Resource (heading: atoms) | Watched printed items | Alerts when printing a ticked item will turn into atoms. Untick an item to silence it. Items not listed alw... | Q3 |
| | `showAlertWhenFull` | Show Alert When Full | Only once storage is at the cap | Waits until storage already holds the atom conversion amount, instead of alerting as soon as printing would... | Q4 |
| `library` | | Library | **Talent library** | | inline: books; icon data/Libz |
| | `books` | Books (input: Book threshold) | Books ready | Alerts when the library has this many books ready. | unit books |
| `construction` | | Construction | **Construction and refinery** | | Renamed: covers the refinery too; icon data/ConTower0 |
| | `flags` | Flags | Finished flags on the board |  |  |
| | `buildings` | Buildings | Buildings ready to build |  |  |
| | `materials` | Materials (heading: Materials) | Salts out of materials | Alerts when a ticked salt has run out of materials, or will within the lead time below. |  |
| | `matsThreshold` | Mats Threshold (input: Materials lead time) | Warn ahead of time | Alerts this many hours before a salt runs out of materials. 0 alerts only once they are gone. | dependsOn materials; unit h |
| | `rankUp` | Rank Up (heading: Refinery Rank up) | Salts ready to rank up |  |  |
| | `saltBalance` | Salt Balance (heading: Refinery salt balance) | Salt balance | Compares each ticked salt to the highest rank the previous salt can keep fuelled. |  |
| | `saltBalanceDirection` | Salt Balance Direction (heading: Alert when a salt is) | Alert when a salt is | The limit is the highest rank the previous salt can keep fuelled. | foldInto saltBalance |
| `hatRack` | | Hat Rack | **Hat rack** | | no icon |
| | `hatsMissing` | Hats Missing | Owned hats missing from the rack |  |  |
| `equinox` | | Equinox | **Equinox** | | icon data/Quest78 |
| | `bar` | Bar | Equinox bar full | Only while an unlocked upgrade is still below max level. |  |
| | `challenges` | Challenges | Completed challenges to claim |  |  |
| | `foodLust` | Food Lust (input: Stacks threshold) | Food Lust stacks | Alerts once you hold this many stacks, capped at your Food Lust level, so the default only alerts when Food... | unit stacks |
| `atomCollider` | | Atom Collider | **Atom collider** | | inline: stampReducer; icon data/Atom0 |
| | `stampReducer` | Stamp Reducer (input: Threshold) | Stamp Reducer reached | Alerts when the Stamp Reducer atom reaches this percent. The max is 90. | unit % |
| `traps` | | Traps | **Traps** | | icon data/TrapBoxSet1 |
| | `trapsOverdue` | Traps Overdue | Traps ready to collect |  |  |

### World 4 (`World 4`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `breeding` | | Breeding | **Breeding** | | icon data/PetEgg1 |
| | `eggs` | Eggs | Egg nest full |  |  |
| | `eggsRarity` | Eggs Rarity (input: Eggs rarity) | Egg rarity reached | Alerts when any egg is at least this rarity: 1 is Base, 2 Copper, 3 Iron. |  |
| | `shinies` | Shinies (input: Level threshold) | Shiny level reached | Alerts when a fenced shiny pet reaches this shiny level. |  |
| | `breedability` | Breedability (input: Level threshold) | Breedability level reached | Alerts when a fenced pet reaches this breedability level. |  |
| `cooking` | | Cooking | **Cooking** | | icon data/CookingSpice0 |
| | `spices` | Spices | Spice clicks left |  |  |
| | `ribbons` | Ribbons (input: Ribbons threshold) | Empty ribbon slots | Alerts when the ribbon shelf has this many empty slots or fewer (28 slots). | Q2 |
| | `meals` | Meals (heading: meals) | Meals ready to level up |  |  |
| | `alertOnlyCookedMeal` | Alert Only Cooked Meal | Only meals a kitchen is cooking |  | dependsOn meals |
| | `cookingMastery` | Cooking Mastery | Unspent Cooking Mastery points |  |  |
| `laboratory` | | Laboratory | **Laboratory** | | no icon |
| | `chipsRotation` | Chips Rotation | Chip to claim in the repository |  |  |
| | `jewelsRotation` | Jewels Rotation | Jewel to claim in the repository |  |  |
| `tome` | | Tome | **Tome** | | icon data/EquipmentNametag22 |
| | `nametagClaim` | Nametag Claim | Ranking nametags to claim | Alerts when Tome ranking nametags are available to claim. |  |

### World 5 (`World 5`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `gaming` | | Gaming | **Gaming** | | icon etc/Sprouts |
| | `sprouts` | Sprouts | Sprouts at capacity |  |  |
| | `drops` | Drops | Sprinkler drops at capacity |  |  |
| | `squirrel` | Squirrel (input: Hours threshold) | Squirrel not clicked | Alerts when this many hours have passed since you clicked the squirrel. | unit h |
| | `shovel` | Shovel (input: Hours threshold) | Shovel not clicked | Alerts when this many hours have passed since you clicked the shovel. | unit h |
| `sailing` | | Sailing | **Sailing** | | icon npcs/Chesty |
| | `captains` | Captains | Better captain in the shop |  |  |
| | `chests` | Chests | Chest capacity full |  |  |
| | `alwaysAlertEnderCaptains` | Always Alert Ender Captains | Every Ender captain in the shop | Alerts on every Ender captain in the shop, even when all your captains are already Ender and its stats are... | dependsOn captains |
| `hole` | | Hole | **The Hole** | | icon data/HoleWellBucket0 |
| | `buckets` | Buckets (input: Sediment threshold) | Sediment reached | Alerts when a well sediment reaches this amount. 0 uses its max. | Q5; group Resource caverns |
| | `motherlode` | Motherlode | Motherlode layer ready to break |  | group Resource caverns |
| | `evertree` | Evertree | Evertree layer ready to break |  | group Resource caverns |
| | `bottomlessTrench` | Bottomless Trench | Bottomless Trench layer ready to break |  | group Resource caverns |
| | `bravery` | Bravery (input: Reward multi threshold) | Bravery story ready | Alerts when the Bravery reward multi reaches this value. | group Monuments |
| | `theBell` | The Bell | Bell ready to ring |  | group Other caverns |
| | `theHarp` | The Harp (input: Power threshold) | Harp power reached | Alerts when Harp power reaches this percent. | unit %; group Other caverns |
| | `theHive` | The Hive | Hive layer ready to break |  | group Resource caverns |
| | `grotto` | Grotto | Monarch ready to fight |  | group Other caverns |
| | `justice` | Justice (input: Reward multi threshold) | Justice story ready | Alerts when the Justice reward multi reaches this value. | group Monuments |
| | `villagersLevelUp` | Villagers Level Up | Villagers ready to level up |  | group Villagers and studies |
| | `wisdom` | Wisdom (input: Reward multi threshold) | Wisdom game ready | Alerts when the Wisdom reward multi reaches this value. | group Monuments |
| | `jars` | Jars (input: Jars threshold) | Jars to break | Alerts when you have this many jars. The max is 120. | unit jars; group Other caverns |
| | `studyLevelUp` | Study Level Up | Studies ready to level up |  | group Villagers and studies |
| | `jarsFull` | Jars Full | Jar slots full |  | group Other caverns |
| | `lanterns` | Lanterns (input: Remaining lanterns threshold) | Blinding Lanterns left today | Alerts when at least this many lantern uses remain today. The daily cap is 12. | group Other caverns |

### World 6 (`World 6`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `sneaking` | | Sneaking | **Sneaking** | | icon data/NjUpgI14 |
| | `lastLooted` | Last Looted (input: Last looted) | Sneaking loot not collected | Alerts when this many minutes have passed since you last looted sneaking rewards. | Q1; unit min |
| | `remainingPristineRolls` | Remaining Pristine Rolls | Pristine charm rolls left |  |  |
| | `remainingSymbolRolls` | Remaining Symbol Rolls | Symbol rolls left |  |  |
| `beanstalk` | | Beanstalk | **Beanstalk** | | no icon |
| | `readyToPlant` | Ready To Plant | Golden food ready to rank up | Alerts when you own enough of a golden food to rank it up on the beanstalk. |  |
| `farming` | | Farming | **Farming** | | icon data/FarmPlant1 |
| | `plots` | Plots (input: OG Threshold) | Plots at OG level | Alerts when a plot reaches this OG level: 1 is x2, 2 is x4, 3 is x8, 4 is x16. 0 alerts on any OG. |  |
| | `finishedPlots` | Finished Plots (input: Hours) | Plots slow to double | How long you are willing to wait for a plot to double. Slower plots get flagged: collect them to start the... | unit h |
| | `totalCrops` | Total Crops (input: Crop Threshold) | Crops ready to collect | Alerts when your plots hold this many crops in total. |  |
| | `missingPlots` | Missing Plots | Empty plots |  |  |
| | `beanTrade` | Bean Trade (input: Bean trade value) | Bean trade value reached | Alerts when your bean trade reaches this value. |  |
| | `exoticPurchases` | Exotic Purchases | Exotic market purchases left |  |  |
| `summoning` | | Summoning | **Summoning** | | icon data/SumUpgIc2 |
| | `familiar` | Familiar (input: Threshold) | Familiar upgrade below level | Alerts while the familiar upgrade is below this level and not maxed. |  |
| | `battleAttempts` | Battle Attempts | Battle attempts left |  |  |
| `etc` | | Etc | **Emperor** | | Renamed from Etc; inline: emperor; icon data/Boss6 |
| | `emperor` | Emperor (input: Attempts) | Emperor attempts stacked | Alerts at this number, or at your attempt cap if it is lower. | unit attempts |

### World 7 (`World 7`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `royalGuardian` | | Royal Guardian | **Royal Guardian** | | icon etc/Royal_Outpost |
| | `idleOutposts` | Idle Outposts | Outposts on an empty resource | Alerts when an outpost is connected to an empty resource and another in range still has some. | group Outposts |
| | `unwiredOutposts` | Unwired Outposts | Outposts with nothing connected | Alerts when an outpost has no resource connected, and one is in range. | group Outposts |
| | `idleSupportCamps` | Idle Support Camps | Support camps boosting nothing | Alerts when a support camp is not boosting any outpost. | group Outposts |
| | `unspentPts` | Unspent Pts (input: Unspent PTS per outpost) | Unspent PTS per outpost | Alerts when a single outpost holds this many unspent PTS or more. | unit PTS; group Outposts |
| | `claimableMaps` | Claimable Maps | Maps ready to claim | Alerts when a map has met its kill requirement and an outpost can be claimed. | group Outposts |
| | `idleUnits` | Idle Units | Units on claimed maps | Alerts when units are clearing a map you have already claimed, or are not assigned anywhere, while their wo... | group Units |
| | `overkillWorkers` | Overkill Workers (input: Hours to empty within) | Spare Workers | Alerts when an outpost has more Workers than it needs to empty its resource within this many hours. Workers... | unit h; group Units |
| | `overkillBeforeReset` | Overkill Before Reset | Measure against the daily reset | Uses the time left until the daily reset instead of the hours above. A resource only restocks and gains a l... | dependsOn overkillWorkers; group Units |
| | `strandedWorkers` | Stranded Workers | Workers on empty resources | Alerts when every resource of an outpost is empty and nothing better is in range, while Workers are still a... | group Units |
| | `idleGuards` | Idle Guards | Guards with unneeded range | Alerts when an outpost has Guards whose range it does not need, so they could be Traders or Surveyors. Also... | group Units |
| | `sharedNodes` | Shared Nodes (input: Hours to empty within) | Resources shared by two outposts | Alerts when two outposts share a resource and one of them empties it within this many hours on its own, so... | Q13; unit h; group Outposts |
| | `tradeRank` | Trade Rank (input: Trade rank) | Trade rank reached | Alerts when an outpost reaches this Trade rank while Traders are still assigned to it, so you can move them... | unit Traders; group Rank caps |
| | `intelRank` | Intel Rank (input: Intel rank) | Intel rank reached | Alerts when an outpost reaches this Intel rank while Surveyors are still assigned to it, so you can move th... | unit Surveyors; group Rank caps |
| | `commandRank` | Command Rank (input: Command rank) | Command rank reached | Alerts when an outpost reaches this Command rank while Commanders are still sent to it, so you can move the... | unit Commanders; group Rank caps |
| | `militaryRank` | Military Rank (input: Military rank) | Military rank reached | Alerts when an outpost reaches this Military rank while Knights are still sent to it, so you can move them... | unit Knights; group Rank caps |
| | `purityRank` | Purity Rank (input: Purity rank) | Purity rank reached | Alerts when an outpost reaches this Purity rank while Priests are still sent to it, so you can move them el... | unit Priests; group Rank caps |
| | `restockLocked` | Restock Locked | Resource Replenish not bought | Alerts until you buy Resource Replenish in the armory, the one-time upgrade that refills empty resources ev... | Q13; group Outposts |
| `gallery` | | Gallery | **Gallery** | | no icon |
| | `trophiesMissing` | Trophies Missing | Owned trophies not on display |  |  |
| | `nametagsMissing` | Nametags Missing | Owned nametags not on display |  |  |
| `spelunking` | | Spelunking | **Spelunking** | | icon data/Spelunking0 |
| | `pageReads` | Page Reads | Page reads left today |  |  |
| | `fullStaminaCharacters` | Full Stamina Characters (input: Characters threshold) | Characters at full stamina | Alerts when at least this many characters have full stamina. | unit characters |
| | `overstimLevel` | Overstim Level (input: Overstim level threshold) | Overstim level reached | Alerts when your Overstim level reaches this value. |  |
| `legendTalents` | | Legend Talents | **Legend talents** | | icon data/LegendTalentIcon0 |
| | `pointsLeftToSpend` | Points Left To Spend | Unspent legend talent points |  |  |
| | `cheaperMasterclassUpgrades` | Cheaper Masterclass Upgrades | Cheaper masterclass upgrades left |  |  |
| `zenithMarket` | | Zenith Market | **Zenith market** | | icon etc/Cluster |
| | `doubleCluster` | Double Cluster | Double Clusters affordable |  |  |
| | `clusterFarming` | Cluster Farming (heading: Alert when Cluster Farming is) | Alert when Cluster Farming is | On turns statues into clusters, off keeps levelling statues. Pick the state you want to be reminded about. |  |
| `construction` | | Construction | **Jeweled cogs** | | Renamed from Construction; icon data/CogCry0 |
| | `jeweledCogs` | Jeweled Cogs | Jeweled cog pulls left |  |  |
| `minehead` | | Minehead | **Minehead** | | icon data/MineHead0 |
| | `dailyTries` | Daily Tries | Daily attempts left |  |  |
| | `currencyUpgrades` | Currency Upgrades (heading: Alert when you can afford these mine currency upgrades) | Affordable currency upgrades | Alerts when you can afford a ticked mine currency upgrade. |  |
| `research` | | Research | **Research** | | icon data/ResObsClip |
| | `insightLevel` | Insight Level (input: Insight level threshold) | Observation insight level reached | Alerts when a found observation reaches this insight level. |  |
| | `observationRollsLeft` | Observation Rolls Left | Observation rolls left today |  |  |
| `sushiStation` | | Sushi Station | **Sushi station** | | icon data/Sushi6 |
| | `fuelFull` | Fuel Full | Fuel full |  |  |
| | `shakerUses` | Shaker Uses | Shakers with uses left | Alerts when a ticked shaker has uses available. |  |
| | `knowledgeLevelUp` | Knowledge Level Up | Sushi ready for a knowledge level up |  |  |
| `jellyOperator` | | Jelly Operator | **Jelly operator** | | icon data/JellyUnit0 |
| | `operationsLeft` | Operations Left | Operations left today |  |  |
| | `slotsToBuy` | Slots To Buy | Slots you can unlock |  |  |
| | `emptySlots` | Empty Slots | Open slots with no cell |  |  |
| | `virusesUnplaced` | Viruses Unplaced | Viruses you can place |  |  |
| `clamWork` | | Clam Work | **Clam work** | | icon data/ClamPearl0 |
| | `promotionAffordable` | Promotion Affordable | Promotion affordable | Pearls are spent even when the promotion fails, and a successful one resets your pearls and every clam upgr... |  |
| `theButton` | | The Button | **The Button** | | icon etc/ButtonG |
| | `instaSkipAvailable` | Insta Skip Available | Insta-skip available |  |  |
| | `taskReady` | Task Ready | Task ready |  |  |

## Characters

### Characters

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `cards` | | Cards | **Cards** | | icon data/CardSet0 |
| | `cardSet` | Card Set | Wrong card set | Alerts on a fighting set while skilling, a skilling set while fighting, or the Blunder Hills set past level... |  |
| | `passiveCards` | Passive Cards | Passive card equipped |  | Q10 |
| `anvil` | | Anvil | **Anvil** | | icon data/ClassIcons43 |
| | `unspentPoints` | Unspent Points (input: Points Threshold) | Unspent anvil points | Alerts when a character has at least this many unspent points. | unit points |
| | `missingHammers` | Missing Hammers | Missing hammers |  |  |
| | `anvilOverdue` | Anvil Overdue (input: Minutes) | Production almost full | Alerts this many minutes before an anvil product is full. | unit min |
| `worship` | | Worship | **Worship** | | icon data/ClassIcons50 |
| | `unendingEnergy` | Unending Energy | Unending Energy past 10 hours | Alerts when a character with the Unending Energy prayer has been AFK for more than 10 hours. |  |
| | `chargeOverdue` | Charge Overdue | Worship charge full | Alerts within 5% of max charge. |  |
| `traps` | | Traps | **Traps** | | icon data/TrapBoxSet1 |
| | `missingTraps` | Missing Traps | Trap slot unused |  |  |
| | `trapsOverdue` | Traps Overdue | Traps ready to collect |  |  |
| `quests` | | Quests | **Quests** | | icon etc/Picnic_Stowaway |
| | `picnicDaily` | Picnic Daily | Picnic Stowaway daily not done | Alerts when a character has not completed any Picnic Stowaway daily quest today. |  |
| `alchemy` | | Alchemy | **Alchemy** | | icon data/aJarB0 |
| | `missingBubbles` | Missing Bubbles | Active bubble slot empty |  |  |
| | `noActivity` | No Activity | No alchemy activity |  |  |
| `obols` | | Obols | **Obols** | | icon data/ObolLocked1 |
| | `missingObols` | Missing Obols | Empty obol slots |  |  |
| `postOffice` | | Post Office | **Post office** | | inline: unspentPoints; icon data/UIboxUpg0 |
| | `unspentPoints` | Unspent Points (input: Number of boxes) | Unspent box points | Alerts when a character has more unspent points than this and a box is not maxed. | Q11; unit points |
| `starSigns` | | Star Signs | **Star signs** | | icon data/SignStar1b |
| | `missingStarSigns` | Missing Star Signs | Empty star sign slots | Stops once every star sign is infinite. |  |
| `crystalCountdown` | | Crystal Countdown | **Crystal Countdown** | | no icon |
| | `showMaxed` | Show Maxed | Show maxed skills |  | Q12 |
| | `showNonMaxed` | Show Non Maxed | Show skills not maxed yet |  | Q12 |
| | `skills` | Skills (heading: skills) | Skills to track | Maestro only. |  |
| `tools` | | Tools | **Better tool available** | | no icon |
| `divinityStyle` | | Divinity Style | **Divinity style** | | icon etc/Div_Style_7 |
| `talents` | | Talents | **Talents** | | no icon |
| | `talents` | Talents (heading: cooldowns) | Cooldown talents ready | Alerts when a ticked talent is off cooldown. |  |
| | `alwaysShowTalents` | Always Show Talents (heading: Misc) | Show talents still on cooldown | Shows every ticked talent with its countdown, not only the ready ones. | dependsOn talents |
| | `superTalentLeftToSpend` | Super Talent Left To Spend | Unspent super talent points |  |  |
| | `unmaxedTalents` | Unmaxed Talents | Talents below max level | Alerts when a class talent still has talent points left to spend before its max level. |  |
| | `libraryUpgradableTalents` | Library Upgradable Talents | Talents the library can raise | Alerts when a maxed class talent could still be raised by a Talent Book Library book. |  |
| `equipment` | | Equipment | **Equipment** | | icon data/EquipmentTransparent1 |
| | `availableUpgradesSlots` | Available Upgrades Slots | Items with upgrade slots left |  |  |
| | `emptyGearSlots` | Empty Gear Slots (heading: emptyGearSlots) | Empty gear slots | Only the first equipment page is checked. Tools, food and the second page are ignored. |  |
| `bags` | | Bags | **Carry bags** | | icon data/MaxCapBagM13 |
| | `unmaxedBags` | Unmaxed Bags | Carry bags below max tier |  |  |
| `classSpecific` | | Class Specific | **Class form items** | | icon data/EquipmentWandsArc0 |
| | `wrongItems` | Wrong Items | Form items used outside form | Alerts when Arcanist or Tempest form items are equipped while the form is off. |  |
| | `betterWeapon` | Better Weapon | Better form weapon in inventory | Alerts when there is a better form weapon for your class in your inventory. |  |
| | `betterRing` | Better Ring (heading: betterRing) | Better form ring in inventory | Compares rings of the same type, counting only the ticked stats. Wind Walker rings roll a single stat and a... |  |

## Timers

### General (`General`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `daily` | | Daily | **Daily reset** | | icon etc/Daily |
| `weekly` | | Weekly | **Weekly reset** | | icon etc/Weekly |
| `serverWeekly` | | Server Weekly | **Server weekly reset** | | icon etc/Server |
| `companions` | | Companions | **Next free companion** | | icon afk_targets/Dog |
| `syphonCharge` | | Syphon Charge | **Charge Syphon overflow** | | icon data/UISkillIcon475 |
| `closestFullWorship` | | Closest Full Worship | **Closest full worship** | | icon data/WorshipSkull3 |
| `dungeonHappyHour` | | Dungeon Happy Hour | **Dungeon happy hour** | | icon etc/Happy_Hour |
| `randomEvents` | | Random Events | **Next random event** | | icon etc/Mega_Grumblo |
| `sailingTrades` | | Sailing Trades | **Next sailing trade** | | no icon |

### Other (`Etc`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `library` | | Library | **Library books** | | icon data/Libz |
| `minibosses` | | Minibosses | **Boss and miniboss respawns** | | no icon |
| `bonusTimeLeft` | | Bonus Time Left | **Vote bonus week** | | icon etc/Weekly |
| `meritocracyTimeLeft` | | Meritocracy Time Left | **Meritocracy vote week** | | icon etc/Weekly |

### Clickers (`Clickers`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `featherRestart` | | Feather Restart (heading: Orion) | **Feather Restart** | | icon etc/Owl_4; unit Orion |
| `megaFeatherRestart` | | Mega Feather Restart | **Mega Feather Restart** | | Q18; icon etc/Owl_8; unit Orion |
| `fisherooReset` | | Fisheroo Reset (heading: Poppy) | **Fisheroo Reset** | | icon etc/KUpga_6; unit Poppy |
| `greatestCatch` | | Greatest Catch | **Greatest Catch** | | Q18; icon etc/KUpga_11; unit Poppy |
| `megaFleshRestart` | | Mega Flesh Restart (heading: Bubba) | **Mega Flesh Restart** | | icon etc/Bubbo_Upgrade_8; unit Bubba |

### World 3 (`World 3`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `printer` | | Printer | **Next printer cycle** | | icon data/ConTower0 |
| `closestTrap` | | Closest Trap | **Closest trap** | | icon data/TrapBoxSet1 |
| `closestFlag` | | Closest Flag | **Closest flag** | | icon data/CogFLflag |
| `closestBuilding` | | Closest Building | **Closest building** | | no icon |
| `closestSalt` | | Closest Salt | **Closest salt** | | no icon |
| | `salts` | Salts | Salts to include | Only the ticked salts are considered when picking the closest one. |  |
| `equinox` | | Equinox | **Equinox bar full** | | icon data/Quest78 |

### World 5 (`World 5`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `bravery` | | Bravery | **Bravery monument** | | icon etc/Bravery_Statue |
| `justice` | | Justice | **Justice monument** | | icon data/Justice_Monument_x1 |
| `wisdom` | | Wisdom | **Wisdom monument** | | icon data/Wisdom_Monument_x1 |
| `villagers` | | Villagers | **Villager level ups** | | icon etc/Villager_0 |
| | `villagers` | Villagers | Villagers to show |  |  |
| `coinFill` | | Coin Fill | **Fountain coin bar** | | icon data/HoleFountainBar0 |
| `marbleFill` | | Marble Fill | **Fountain marble bar** | | icon data/HoleFountainBar1 |

### World 6 (`World 6`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `cropsReady` | | Crops Ready | **Next crop fully grown** | | icon data/FarmPlant6 |

### World 7 (`World 7`)

| Tracker | Option | Current name (key) | New label | Help | Notes |
|---|---|---|---|---|---|
| `researchLevelUp` | | Research Level Up | **Research level up** | | icon data/ClassIcons61 |
| `sushiFuelFull` | | Sushi Fuel Full | **Sushi fuel full** | | icon etc/Fuel |
| `observationInsight` | | Observation Insight | **Observation insight level ups** | | icon data/ResMagni1 |
| `royalNodeCap` | | Royal Node Cap | **Next outpost resource empty** | | icon data/UISkillIcon226 |
| `overstim` | | Overstim | **Overstim level up** | | icon data/CaveShopUpg6 |
