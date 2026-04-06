# The Button + v2.3.501 Patch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "The Button" (new World 7 content) parser, page, and all cascading formula updates from game version 2.3.501.

**Architecture:** New parser `parsers/world-7/button.ts` computes button presses, task progress, and 9 bonus categories. Exports `getButtonBonus(account, index)` used by 8 other parsers as a multiplicative factor. New page under `pages/account/world-7/`. Three non-Button formula fixes also included (sushi UpgLvREQ, research w7a11 card, KillroyBonuses(5)).

**Tech Stack:** TypeScript parser, React/MUI page component, website-data.json static data.

**Debug Server:** MCP tools (`mcp__idleon__callFunction`, `mcp__idleon__getAttr`, `mcp__idleon__getDNSM`) at localhost:3100 are available for verification. Use `mcp__idleon__callFunction` with block `_customBlock_Minehead` and handler names like `Button_Bonuses`, `Button_Task`, `Button_REQ`, `Button_uHave`, `Button_BonusMULTI`, `Button_BonusPerTime` to verify values.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `parsers/world-7/button.ts` | Core parser: bonuses, tasks, progress, `getButtonBonus` export |
| Create | `pages/account/world-7/the-button.jsx` | Page component |
| Modify | `parsers/index.ts:320` | Wire `accountData.button = getButton(...)` |
| Modify | `components/constants.jsx:245` | Add `theButton` category to world-7 |
| Modify | `parsers/world-7/minehead.ts:184` | Add `getButtonBonus(account, 1)` to currencyGain |
| Modify | `parsers/world-7/research.ts:509-593` | Add `getButtonBonus(account, 0)` + w7a11 card + KillroyBonuses(5) |
| Modify | `parsers/world-7/sushiStation.ts:28-32,210` | Fix UpgLvREQ + add `getButtonBonus(account, 2)` |
| Modify | `parsers/world-5/sailing.ts:646` | Add `getButtonBonus(account, 3)` to artifact chance |
| Modify | `parsers/world-6/summoning.ts:241-295` | Add `getButtonBonus(account, 4)` to AllMasterclassDropz |
| Modify | `parsers/world-6/farming.ts:701` | Add `getButtonBonus(account, 5)` to crop evolution |
| Modify | `parsers/world-7/spelunking.ts:599` | Add `getButtonBonus(account, 6)` to POW multi |
| Modify | `parsers/world-4/cooking.ts:316` | Add `getButtonBonus(account, 7)` to cooking speed |

---

## Task 1: Update website-data.json with ButtonTasks

**Files:**
- Modify: `data/website-data.json`

The ButtonTasks static data needs to be extracted from the game resources and added to website-data.json. This is a prerequisite for the parser.

- [ ] **Step 1: Extract ButtonTasks from game data**

Use the debug server to get the full ButtonTasks array:

```
mcp__idleon__search({ query: "ButtonTasks" })
```

The data is a 2D array where each entry is: `[description, baseReq, scalingType, scalingFactor, extra]`.

- [ ] **Step 2: Add ButtonTasks to website-data.json**

Add the `"ButtonTasks"` key at the top level of `data/website-data.json`. The array should contain all ~60 task entries exactly as extracted from the game.

Also verify `research` array now has index 39 (the task-order lookup table). If not, add it.

- [ ] **Step 3: Verify data loads**

Run the dev server and check the console for no JSON parse errors:
```bash
cd C:\Dev\idleon\toolbox\IdleonToolbox && npm run dev
```

---

## Task 2: Create button.ts parser

**Files:**
- Create: `parsers/world-7/button.ts`

This is the core parser. It computes:
1. Button press count and remaining presses
2. Current task (index, description, requirement, player progress)
3. All 9 bonus values
4. The bonus multiplier (companion 147 + grid 125)

- [ ] **Step 1: Create the parser file with imports and raw data access**

```typescript
// parsers/world-7/button.ts
import { tryToParse } from '@utility/helpers';
import { research as researchData, buttonTasks as buttonTasksData } from '@website-data';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { isCompanionBonusActive } from '@parsers/misc';
import type { IdleonData, Account } from '../types';
```

Note: `buttonTasks` import name depends on the key name in website-data.json. If the key is `ButtonTasks`, the import would be `{ ButtonTasks as buttonTasksData }`. Check the actual key name after Task 1.

- [ ] **Step 2: Implement getButton**

```typescript
export const getButton = (idleonData: IdleonData, account: Account) => {
  const raw = tryToParse(idleonData?.Research) || idleonData?.Research;
  const accountOptions = tryToParse(idleonData?.OptLacc) || account?.accountOptions;
  const tasks: any[] = (buttonTasksData as any) ?? [];

  // --- Core state ---
  const totalPresses = Number(accountOptions?.[594]) || 0;
  const pressesRemaining = Number(accountOptions?.[595]) || 0;

  // --- Insta skips per week (from research grid 126) ---
  const instaSkipsPerWeek = getResearchGridBonus(account, 126, 0);

  // --- Task order lookup: research[39] is a permutation table ---
  const taskOrderTable: number[] = ((researchData as any)?.[39] ?? []).map(Number);

  // --- Current task index ---
  // Formula: Research[39][ pressCount % 100 ] mod ButtonTasks.length
  const lookupIndex = totalPresses - 100 * Math.floor(totalPresses / 100); // pressCount % 100
  const rawTaskIndex = taskOrderTable[lookupIndex] ?? 0;
  const currentTaskIndex = tasks.length > 0
    ? rawTaskIndex - tasks.length * Math.floor(rawTaskIndex / tasks.length)
    : 0;

  // --- Current task requirement ---
  const currentTask = tasks[currentTaskIndex];
  const requirement = currentTask ? getButtonREQ(currentTask, totalPresses) : 0;

  // --- Button_uHave: what the player currently has for this task ---
  const playerHas = getButtonUHave(currentTaskIndex, idleonData, account);

  // --- Bonus multiplier ---
  // (1 + Companion(147) / 100) * (1 + Grid_Bonus(125) / 100)
  const companion147Bonus = isCompanionBonusActive(account, 147)
    ? (account?.companions?.list?.at(147)?.bonus ?? 0) : 0;
  const grid125Bonus = getResearchGridBonus(account, 125, 0);
  const bonusMulti = (1 + companion147Bonus / 100) * (1 + grid125Bonus / 100);

  // --- Compute all 9 bonuses ---
  const bonusPerPress = [2, 3, 2, 2, 4, 5, 4, 25, 5];
  const bonusNames = [
    'Research XP',
    'Minehead Currency',
    'Sushi Bucks',
    'Artifact Odds',
    'Summoning',
    'Spelunk POW',
    'Cooking SPD',
    'Crop Evo',
    'Class XP'
  ];
  // Game display format: indices 0-7 use "}x" (multiplier), index 8 uses "+{%" (additive)
  const bonusDisplayFormats = ['multi', 'multi', 'multi', 'multi', 'multi', 'multi', 'multi', 'multi', 'additive'];

  const bonusValues = new Array(9).fill(0);
  for (let s = 0; s < totalPresses; s++) {
    const categoryIndex = Math.floor(s / 5) - 9 * Math.floor(Math.floor(s / 5) / 9); // floor(s/5) % 9
    bonusValues[categoryIndex] += bonusPerPress[categoryIndex] * bonusMulti;
  }

  const bonuses = bonusValues.map((value, idx) => ({
    name: bonusNames[idx],
    value,
    bonusPerPress: bonusPerPress[idx],
    displayFormat: bonusDisplayFormats[idx],
    // For 'multi' format: display as "Nx" where N = 1 + value/100
    // For 'additive' format: display as "+N%"
    displayValue: bonusDisplayFormats[idx] === 'multi'
      ? 1 + value / 100
      : value
  }));

  // --- All tasks with descriptions ---
  const allTasks = tasks.map((task: any, idx: number) => ({
    index: idx,
    description: (task?.[0] ?? '').replace(/_/g, ' '),
    baseReq: Number(task?.[1]) || 0,
    scalingType: task?.[2] ?? 'exponent',
    scalingFactor: Number(task?.[3]) || 1,
  }));

  return {
    totalPresses,
    pressesRemaining,
    instaSkipsPerWeek,
    currentTaskIndex,
    currentTask: currentTask ? {
      index: currentTaskIndex,
      description: (currentTask[0] ?? '').replace(/_/g, ' '),
      requirement,
      playerHas,
      isComplete: playerHas >= requirement,
    } : null,
    bonuses,
    bonusMulti,
    allTasks,
  };
};
```

- [ ] **Step 3: Implement getButtonREQ helper**

```typescript
/**
 * Computes the requirement for a button task.
 * Game: customBlock_Minehead("Button_REQ", 0, 0)
 *
 * Three scaling modes based on task[2]:
 *   "linear":   ceil(base + presses * factor)
 *   "step":     ceil(base + presses / factor)
 *   "exponent": base * factor^presses
 */
const getButtonREQ = (task: any, totalPresses: number): number => {
  const base = Number(task?.[1]) || 0;
  const scalingType = task?.[2] ?? 'exponent';
  const factor = Number(task?.[3]) || 1;

  if (scalingType === 'linear') {
    return Math.ceil(base + totalPresses * factor);
  }
  if (scalingType === 'step') {
    return Math.ceil(base + totalPresses / factor);
  }
  // exponent
  return base * Math.pow(factor, totalPresses);
};
```

- [ ] **Step 4: Implement getButtonUHave helper**

This maps each task index to the player's current value for that resource. Many map directly to parsed account data. Some need raw idleonData access.

```typescript
/**
 * Returns how much the player currently has for a given button task index.
 * Game: customBlock_Minehead("Button_uHave", taskIndex, 0)
 *
 * Maps 57 task indices to various account fields.
 */
const getButtonUHave = (taskIndex: number, idleonData: IdleonData, account: Account): number => {
  const acctOpts = account?.accountOptions;
  const statues = tryToParse(idleonData?.StatueLevels) || idleonData?.StatueLevels;
  const cauldronInfo = tryToParse(idleonData?.CauldronInfo) || idleonData?.CauldronInfo;
  const divinity = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  const sailing = tryToParse(idleonData?.Sailing) || idleonData?.Sailing;
  const gaming = tryToParse(idleonData?.Gaming) || idleonData?.Gaming;
  const gamingSprout = tryToParse(idleonData?.GamingSprout) || idleonData?.GamingSprout;
  const cards = tryToParse(idleonData?.Cards) || idleonData?.Cards;
  const summon = tryToParse(idleonData?.Summon) || idleonData?.Summon;
  const ninja = tryToParse(idleonData?.Ninja) || idleonData?.Ninja;
  const sushi = tryToParse(idleonData?.Sushi) || idleonData?.Sushi;
  const bubba = tryToParse(idleonData?.Bubba) || idleonData?.Bubba;
  const meals = tryToParse(idleonData?.Meals) || idleonData?.Meals;
  const lv0 = tryToParse(idleonData?.Lv0) || idleonData?.Lv0;
  const printer = tryToParse(idleonData?.Printer) || idleonData?.Printer;
  const totemInfo = tryToParse(idleonData?.TotemInfo) || idleonData?.TotemInfo;
  const petsStored = tryToParse(idleonData?.PetsStored) || idleonData?.PetsStored;
  const ribbon = tryToParse(idleonData?.Ribbon) || idleonData?.Ribbon;

  switch (taskIndex) {
    // Stats: 0=STR, 1=AGI, 2=WIS, 3=LUK
    // These require TotalStats which is character-level. Use account-level approximation.
    case 0: return account?.totalSkillsLevels?.strength?.level ?? 0;
    case 1: return account?.totalSkillsLevels?.agility?.level ?? 0;
    case 2: return account?.totalSkillsLevels?.wisdom?.level ?? 0;
    case 3: return account?.totalSkillsLevels?.luck?.level ?? 0;

    // Grimoire resources
    case 4: return Number(acctOpts?.[330]) || 0;
    case 5: return Number(acctOpts?.[358]) || 0;
    case 6: return Number(acctOpts?.[390]) || 0;
    case 7: return Number(acctOpts?.[391]) || 0;

    // Statue levels: [statueIndex][0]
    case 8: return Number(statues?.[29]?.[0]) || 0;  // DRAGON
    case 9: return Number(statues?.[2]?.[0]) || 0;   // MINING
    case 10: return Number(statues?.[6]?.[0]) || 0;  // LUMBERBOB
    case 11: return Number(statues?.[8]?.[0]) || 0;  // OCEANMAN
    case 12: return Number(statues?.[9]?.[0]) || 0;  // OL RELIABLE
    case 13: return Number(statues?.[15]?.[0]) || 0; // BOX
    case 14: return Number(statues?.[16]?.[0]) || 0; // TWOSOUL

    // Complex stats - use 0 as fallback for ones needing live game state
    case 15: return 0; // ExpMulti — requires live character calc
    case 16: return 0; // Drop_Rarity — requires live character calc

    // Stamp level
    case 17: {
      const stampLevels = tryToParse(idleonData?.StampLevel) || idleonData?.StampLevel;
      return Number(stampLevels?.[2]?.[2]) || 0;
    }

    // Alchemy bubble levels
    case 18: return Number(cauldronInfo?.[0]?.[0]) || 0;
    case 19: return Number(cauldronInfo?.[1]?.[0]) || 0;
    case 20: return Number(cauldronInfo?.[2]?.[0]) || 0;

    // Construction Build Rate — complex, skip
    case 21: return 0;

    // Printer copper sample
    case 22: {
      if (!printer || !Array.isArray(printer)) return 0;
      const copperIdx = printer.indexOf('Copper');
      return copperIdx >= 0 ? Number(printer[copperIdx + 1]) || 0 : 0;
    }

    // Feathers (Orion)
    case 23: return Number(acctOpts?.[253]) || 0;

    // Total waves (sum TotemInfo[0][0..7])
    case 24: {
      if (!totemInfo?.[0]) return 0;
      let sum = 0;
      for (let i = 0; i <= 7; i++) sum += Number(totemInfo[0][i]) || 0;
      return sum;
    }

    // Breeding mob power (1st slot)
    case 25: return Number(petsStored?.[0]?.[2]) || 0;

    // Desert Oasis Foraging Speed — complex, skip
    case 26: return 0;

    // Ribbon tier
    case 27: return Number(ribbon?.[92]) || 0;

    // Sausy Sausage meal level
    case 28: return Number(meals?.[0]?.[56]) || 0;

    // Tome Score
    case 29: return account?.tome?.totalScore ?? 0;

    // Skill levels from Lv0
    case 30: return Number(lv0?.[12]) || 0; // Laboratory
    case 31: return Number(lv0?.[17]) || 0; // Sneaking
    case 32: return Number(lv0?.[19]) || 0; // Spelunking
    case 33: return Number(lv0?.[1]) || 0;  // Mining
    case 34: return Number(lv0?.[3]) || 0;  // Choppin
    case 35: return Number(lv0?.[14]) || 0; // Divinity

    // Divinity PTS
    case 36: return Number(divinity?.[24]) || 0;

    // Sailing gold bars
    case 37: return Number(sailing?.[1]?.[0]) || 0;

    // Artifact Find Chance multi — complex, skip
    case 38: return 0;

    // Gaming bits
    case 39: return Number(gaming?.[0]) || 0;

    // Plants evolved (Elegant Seashell)
    case 40: return Number(gamingSprout?.[28]?.[1]) || 0;

    // Palette Multi — complex, skip
    case 41: return 0;

    // Slab items found
    case 42: return Array.isArray(cards?.[1]) ? cards[1].length : 0;

    // White Essence
    case 43: return Number(summon?.[2]?.[0]) || 0;

    // Total Career Wins — complex, skip
    case 44: return 0;

    // Bean Trade QTY — complex, skip
    case 45: return 0;

    // Jade
    case 46: return Number(ninja?.[102]?.[1]) || 0;

    // Golden Food Bonus %
    case 47: {
      const gfoodMulti = account?.cooking?.meals?.gfoodBonusMulti ?? 1;
      return Math.max(0, 100 * (gfoodMulti - 1));
    }

    // Total crops found
    case 48: return account?.farming?.totalCrops ?? 0;

    // Max crystal damage — complex, skip
    case 49: return 0;

    // Spelunking power
    case 50: return account?.spelunking?.power?.value ?? 0;

    // Best Chucklemire Depth
    case 51: {
      const spelunk = tryToParse(idleonData?.Spelunk) || idleonData?.Spelunk;
      return Number(spelunk?.[1]?.[4]) || 0;
    }

    // Coins
    case 52: return Number(idleonData?.Money) || 0;

    // Showdown level (Emperor)
    case 53: return (Number(acctOpts?.[369]) || 0) + 1;

    // Sushi Bucks
    case 54: return Number(sushi?.[4]?.[3]) || 0;

    // Fish (Poppy)
    case 55: return Number(acctOpts?.[267]) || 0;

    // Meat Slices (Bubba)
    case 56: return Number(bubba?.[0]?.[0]) || 0;

    // Placeholder indices 57-59
    case 57: case 58: case 59: return 1;

    default: return 0;
  }
};
```

**Note on skipped indices (15, 16, 21, 26, 38, 41, 44, 45, 49):** These require live game state or complex cross-system calculations (TotalStats for damage, PixelHelperActor references, etc.). They return 0 for now. These can be filled in incrementally as the data becomes available. The UI should handle 0 gracefully (show "N/A" or similar).

- [ ] **Step 5: Implement getButtonBonus export**

```typescript
/**
 * Returns the Button_Bonuses value for a given bonus index (0-8).
 * Used by other parsers as: (1 + getButtonBonus(account, index) / 100)
 *
 * Game: customBlock_Minehead("Button_Bonuses", index, 0)
 */
export const getButtonBonus = (account: any, index: number): number => {
  return account?.button?.bonuses?.[index]?.value ?? 0;
};
```

- [ ] **Step 6: Verify against debug server**

Use MCP tools to compare:
```
mcp__idleon__getDNSM({ key: "Button_Bonsuz" })  → should match bonusValues array
mcp__idleon__callFunction({ block: "_customBlock_Minehead", handler: "Button_Task", params: [0, 0] })  → should match currentTaskIndex
mcp__idleon__callFunction({ block: "_customBlock_Minehead", handler: "Button_REQ", params: [0, 0] })  → should match requirement
mcp__idleon__callFunction({ block: "_customBlock_Minehead", handler: "Button_BonusMULTI", params: [0, 0] })  → should match bonusMulti
```

---

## Task 3: Wire button parser into parsers/index.ts

**Files:**
- Modify: `parsers/index.ts`

- [ ] **Step 1: Add import**

At the top of `parsers/index.ts`, add after the minehead import (line 82):

```typescript
import { getButton } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add accountData.button assignment**

In the `serializeData` function, add after `accountData.research` (line 322) and before `accountData.sushiStation` (line 323):

```typescript
accountData.button = getButton(idleonData, accountData);
```

This placement ensures `account.research` (needed for grid 125/126) and `account.companions` are already populated.

---

## Task 4: Update minehead.ts — add Button_Bonuses(1) to currencyGain

**Files:**
- Modify: `parsers/world-7/minehead.ts:1,184`

- [ ] **Step 1: Add import**

At line 1 of `minehead.ts`, add to imports:

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add multiplier to currencyGain formula**

At line 184, the formula currently ends with:
```typescript
    * (1 + getSushiBonus(account, 12) / 100);
```

Change to:
```typescript
    * (1 + getSushiBonus(account, 12) / 100)
    * (1 + getButtonBonus(account, 1) / 100);
```

- [ ] **Step 3: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_Minehead", handler: "CurrencyGain", params: [0, 0] })
```

Compare the game value against the toolbox's computed `currencyGain`.

---

## Task 5: Update research.ts — add Button_Bonuses(0) + w7a11 card + KillroyBonuses(5)

**Files:**
- Modify: `parsers/world-7/research.ts:16-17,522,547,553,578,586-587`

Three changes in `getResearchEXPmulti` (lines 509-593):

- [ ] **Step 1: Add imports**

Add to the import section:

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
import { getKillRoyShopBonus } from '@parsers/misc';
```

Note: `getCardBonusByEffect` is already imported (line 16).

- [ ] **Step 2: Add w7a11 card level variable**

After line 522 (`const cardBonus = ...`), add:

```typescript
const cardW7b1 = Math.min(getCardLevel(account?.cards, 'w7b1'), 10);
const cardW7b4 = Math.min(2 * getCardLevel(account?.cards, 'w7b4'), 10);
const cardW7a11 = Math.min(getCardLevel(account?.cards, 'w7a11'), 10);
```

**Important:** The game uses individual `CardLv` lookups with min caps, not the aggregate `getCardBonusByEffect`. You'll need to check if a `getCardLevel` function exists. If not, use:

```typescript
const getCardLevel = (cards: any, cardId: string): number => {
  // card star level from the cards data structure
  return Number(cards?.cardList?.find((c: any) => c?.cardId === cardId)?.stars) || 0;
};
```

Or if the existing card passive sum already includes these correctly, replace the existing `cardBonus` line with the 3 individual lookups and sum them. Check against the game's additive sum to decide.

- [ ] **Step 3: Add KillroyBonuses(5) variable**

After the card variables, add:

```typescript
const killroyResearchBonus = getKillRoyShopBonus(account, 5);
```

- [ ] **Step 4: Update the additive sum (lines 530-547)**

Add the new card term to the additive sum. If replacing `cardBonus` with individual card lookups:

```typescript
const additive =
    stickerBonus +
    mealResearchXP +
    dancingCoral +
    cropDepot +
    grid50 +
    grid90 +
    grid110 +
    grid112_2 +
    zenith +
    msaBonus +
    slab +
    tomeLoreEpi +
    cardW7b1 + cardW7b4 + cardW7a11 +
    arcade63 +
    grid31 +
    grid94_2 +
    prehistoricSetBonus;
```

If keeping `cardBonus` and just adding `cardW7a11`, check whether `getCardBonusByEffect` already sums w7a11's passive. If it does, no change to the additive sum is needed (the card data update handles it). If the game formula uses capped individual levels rather than passives, replace with the 3 individual terms above.

- [ ] **Step 5: Add multiplicative factors (line 553)**

Change:
```typescript
const value = additiveFactor * grid70Factor * companionFactor * (1 + getSushiBonus(account, 0) / 100);
```

To:
```typescript
const value = additiveFactor * grid70Factor * companionFactor
    * (1 + getSushiBonus(account, 0) / 100)
    * (1 + getButtonBonus(account, 0) / 100)
    * (1 + (killroyResearchBonus - 1) * 100 / 100);
```

**Note on killroyResearchBonus:** `getKillRoyShopBonus(account, 5)` returns `1 + (opts[469] / (150 + opts[469])) * 0.8`. The game formula uses `(1 + KillroyBonuses(5) / 100)` where `KillroyBonuses(5)` returns just the bonus percentage. So the integration depends on whether the killroy helper returns a multiplier or a percentage. Verify with:
```
mcp__idleon__callFunction({ block: "_customBlock_RandomEvent", handler: "KillroyBonuses", params: [5, 0] })
```

If it returns a percentage (e.g., 30 meaning +30%), use:
```typescript
* (1 + killroyResearchBonus / 100)  // where killroyResearchBonus is the raw % value
```

If `getKillRoyShopBonus` returns a multiplier (e.g., 1.3), convert appropriately.

- [ ] **Step 6: Update breakdown (lines 558-590)**

Add the new sources to the breakdown:

In the 'Additive %' category sources array, update the card entry and add the w7a11 entry.

In the 'Multiplicative' category, add:
```typescript
{ name: 'Button Bonus', value: 1 + getButtonBonus(account, 0) / 100 },
{ name: 'Killroy Research', value: killroyResearchBonus },
```

- [ ] **Step 7: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_ResearchStuff", handler: "ResearchEXPmulti", params: [0, 0] })
```

---

## Task 6: Update sushiStation.ts — fix UpgLvREQ + add Button_Bonuses(2) to currencyMulti

**Files:**
- Modify: `parsers/world-7/sushiStation.ts:1,29,210`

Two changes: fix the UpgLvREQ formula and add button bonus to currencyMulti.

- [ ] **Step 1: Add import**

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Fix UpgLvREQ formula (lines 28-32)**

Change:
```typescript
const getUpgLvREQ = (t: number) => {
  return Math.floor(1 + (Math.min(3, t) + Math.min(6, t) + (3 * t
    - Math.max(0, t - 4) - Math.max(0, t - 8)
    + (Math.floor(t / 6) + Math.floor(t / 17)))));
};
```

To:
```typescript
const getUpgLvREQ = (t: number) => {
  return Math.floor(1 + (Math.min(2, t) + Math.min(4, t) + (3 * t
    - Math.max(0, t - 4) - Math.max(0, t - 8)
    + (Math.floor(t / 6) + Math.floor(t / 17)))));
};
```

- [ ] **Step 3: Add Button_Bonuses(2) to currencyMulti (line 210)**

Change:
```typescript
    * (1 + (100 * sailingArt39) / 100);
```

To:
```typescript
    * (1 + getButtonBonus(account, 2) / 100)
    * (1 + (100 * sailingArt39) / 100);
```

- [ ] **Step 4: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_SushiStuff", handler: "CurrencyMulti", params: [0, 0] })
mcp__idleon__callFunction({ block: "_customBlock_SushiStuff", handler: "UpgLvREQ", params: [5, 0] })
```

---

## Task 7: Update sailing.ts — add Button_Bonuses(3) to artifact chance

**Files:**
- Modify: `parsers/world-5/sailing.ts:1,646`

- [ ] **Step 1: Add import**

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add multiplier to getBoatArtifactChance (line 646)**

Change:
```typescript
    * (1 + getSushiBonus(account, 7) / 100);
```

To:
```typescript
    * (1 + getSushiBonus(account, 7) / 100)
    * (1 + getButtonBonus(account, 3) / 100);
```

- [ ] **Step 3: Update breakdown**

Add to the multiplicative sources in the breakdown (after line 646):
```typescript
{ name: 'Button Bonus', value: 1 + getButtonBonus(account, 3) / 100 },
```

- [ ] **Step 4: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_Sailing", handler: "BoatArtiMulti", params: [0, 0] })
```

---

## Task 8: Update summoning.ts — add Button_Bonuses(4) via AllMasterclassDropz

**Files:**
- Modify: `parsers/world-6/summoning.ts:1,241-295`

The game has a standalone `AllMasterclassDropz` multiplier that applies to all winner bonus computations. This multiplier was modified to include `Button_Bonuses(4)`. The full formula:

```
(1 + KillroyBonuses(4) / 100) * (1 + ShopUpgBonus(49) / 100)
* (1 + AlchVials["7masta"] / 100) * (1 + Button_Bonuses(4) / 100)
* (1 + Companions(38)) * (1 + EtcBonuses("101") / 100)
```

The existing `getLocalWinnerBonus` does NOT include this multiplier. For now, add only the `Button_Bonuses(4)` factor since the other terms are a pre-existing gap.

- [ ] **Step 1: Add import**

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add Button_Bonuses(4) to getLocalWinnerBonus**

In `getLocalWinnerBonus` (lines 241-295), the non-raw branches (lines 256-264, 266-278, 280-292) each compute a `val`. After each `val` computation, multiply by the button bonus.

For the `else` branch (lines 280-292), change:

```typescript
  else {
    const multiCalc: any = getLocalWinnerBonus(rawWinnerBonuses, account, 31);
    const multi: any = multiCalc === 0 ? 0 : multiCalc;
    val = 3.5 * rawValue *
      (1 + charmBonus / 100) *
      (1 + (10 * gemShopBonus) / 100) *
      (1 + (artifactBonus +
        Math.min(10, level * bonusPerLevel) +
        firstAchievement +
        secondAchievement +
        armorSetBonus +
        emperorBonus +
        multi) / 100);
  }
```

To:

```typescript
  else {
    const multiCalc: any = getLocalWinnerBonus(rawWinnerBonuses, account, 31);
    const multi: any = multiCalc === 0 ? 0 : multiCalc;
    val = 3.5 * rawValue *
      (1 + charmBonus / 100) *
      (1 + (10 * gemShopBonus) / 100) *
      (1 + (artifactBonus +
        Math.min(10, level * bonusPerLevel) +
        firstAchievement +
        secondAchievement +
        armorSetBonus +
        emperorBonus +
        multi) / 100) *
      (1 + getButtonBonus(account, 4) / 100);
  }
```

Apply the same `* (1 + getButtonBonus(account, 4) / 100)` to the other two non-raw branches (index 19 at line 264, and index 20-33 at line 278).

Do NOT add it to the raw branch (lines 253-255, indices 20/22/24/31) — those return `rawValue` unmodified.

- [ ] **Step 3: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_Summoning", handler: "AllMasterclassDropz", params: [0, 0] })
```

Compare the game's multiplier against the toolbox computed value.

---

## Task 9: Update farming.ts — add Button_Bonuses(5) to crop evolution

**Files:**
- Modify: `parsers/world-6/farming.ts:1,701`

- [ ] **Step 1: Add import**

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add multiplier to getCropEvolution (line 701)**

Change:
```typescript
    * (1 + getSushiBonus(account, 35) / 100)
    * crop?.seed?.nextCropChance
```

To:
```typescript
    * (1 + getSushiBonus(account, 35) / 100)
    * (1 + getButtonBonus(account, 5) / 100)
    * crop?.seed?.nextCropChance
```

- [ ] **Step 3: Update breakdown**

Add to the breakdown sources:
```typescript
{ name: 'Button Bonus', value: 1 + getButtonBonus(account, 5) / 100 },
```

- [ ] **Step 4: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_FarmingStuffs", handler: "NextCropChance", params: [0, 0] })
```

---

## Task 10: Update spelunking.ts — add Button_Bonuses(6) to POW multi

**Files:**
- Modify: `parsers/world-7/spelunking.ts:1,599`

- [ ] **Step 1: Add import**

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add multiplier to powerMulti (line 599)**

Change:
```typescript
    * (1 + getSushiBonus(account, 20) / 100);
```

To:
```typescript
    * (1 + getSushiBonus(account, 20) / 100)
    * (1 + getButtonBonus(account, 6) / 100);
```

- [ ] **Step 3: Update breakdown**

Add to the Power breakdown multiplicative sources:
```typescript
{ name: 'Button Bonus', value: 1 + getButtonBonus(account, 6) / 100 },
```

- [ ] **Step 4: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_Spelunk", handler: "POW_multi", params: [0, 0] })
```

---

## Task 11: Update cooking.ts — add Button_Bonuses(7) to cooking speed

**Files:**
- Modify: `parsers/world-4/cooking.ts:1,316`

- [ ] **Step 1: Add import**

```typescript
import { getButtonBonus } from '@parsers/world-7/button';
```

- [ ] **Step 2: Add multiplier to mealSpeed (line 316)**

Change:
```typescript
      * (1 + kitchenEffMultiplier / 100);
```

To:
```typescript
      * (1 + kitchenEffMultiplier / 100)
      * (1 + getButtonBonus(account, 7) / 100);
```

- [ ] **Step 3: Update breakdown**

Add to the Meal speed breakdown sources:
```typescript
{ name: 'Button Bonus', value: 1 + getButtonBonus(account, 7) / 100 },
```

- [ ] **Step 4: Verify**

```
mcp__idleon__callFunction({ block: "_customBlock_CookingR", handler: "CookingSPEED", params: [0, 0] })
```

---

## Task 12: Update constants.jsx — add theButton to world-7

**Files:**
- Modify: `components/constants.jsx:245`

- [ ] **Step 1: Add theButton category**

In the `'world 7'` categories array, add after the `minehead` entry (before `glimbo`):

```javascript
{ label: 'theButton', icon: 'data/ClassIconsNA2', tabs: [] },
```

The exact insertion point is after `{ label: 'minehead', icon: 'data/MineHead0', tabs: ['Upgrades', 'Opponents'] },`.

---

## Task 13: Create the-button.jsx page

**Files:**
- Create: `pages/account/world-7/the-button.jsx`

- [ ] **Step 1: Create the page component**

```jsx
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import { notateNumber, prefix } from '@utility/helpers';

const TheButton = () => {
  const { state } = useContext(AppContext);
  const button = state?.account?.button;

  if (!button) return <MissingData name={'the-button'} />;

  const { totalPresses, pressesRemaining, instaSkipsPerWeek, currentTask, bonuses, bonusMulti } = button;

  return <>
    <NextSeo
      title="The Button | Idleon Toolbox"
      description="The Button bonuses and task progress for Legends of Idleon"
    />

    {/* Top-level stats */}
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Total Presses'} value={totalPresses} />
      <CardTitleAndValue title={'Presses Left'} value={pressesRemaining} />
      <CardTitleAndValue title={'Insta Skips/Week'} value={instaSkipsPerWeek} />
      <CardTitleAndValue title={'Bonus Multiplier'} value={`${notateNumber(bonusMulti, 'MultiplierInfo')}x`} />
    </Stack>

    {/* Current Task */}
    {currentTask && (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Current Task</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>{currentTask.description
            .replace(/\{/g, notateNumber(currentTask.requirement, 'Big'))}</Typography>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              {notateNumber(currentTask.playerHas, 'Big')} / {notateNumber(currentTask.requirement, 'Big')}
            </Typography>
            {currentTask.isComplete
              ? <Typography color="success.main">Complete!</Typography>
              : <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (currentTask.playerHas / Math.max(1, currentTask.requirement)) * 100)}
                  sx={{ flexGrow: 1 }}
                />
            }
          </Stack>
        </CardContent>
      </Card>
    )}

    {/* Bonuses Table */}
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Button Bonuses</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Every 5 presses, the next bonus category receives its per-press amount.
        </Typography>
        <Stack gap={1}>
          {bonuses?.map((bonus, idx) => (
            <Stack key={idx} direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" sx={{ minWidth: 160 }}>{bonus.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                +{bonus.bonusPerPress}/press
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {bonus.displayFormat === 'multi'
                  ? `${notateNumber(bonus.displayValue, 'MultiplierInfo')}x`
                  : `+${notateNumber(bonus.value, 'Big')}%`
                }
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  </>;
};

export default TheButton;
```

- [ ] **Step 2: Verify the page loads**

Navigate to `http://localhost:3001/account/world-7/the-button?demo=true` and verify data renders.

---

## Verification Checklist

After all tasks are complete:

- [ ] Run `npm run dev` — no build errors
- [ ] Navigate to The Button page — data displays correctly
- [ ] Compare each bonus value against `mcp__idleon__getDNSM({ key: "Button_Bonsuz" })`
- [ ] Spot-check 2-3 cascading formulas against debug server values
- [ ] Verify sushi UpgLvREQ shows lower requirements than before
- [ ] Check research EXP multi breakdown includes new sources
