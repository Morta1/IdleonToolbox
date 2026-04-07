import {
  research as researchData,
  ButtonTasks as buttonTasksData,
  ButtonBonusPerPress as bonusPerPressData,
  ButtonBonusNames as bonusNamesData
} from '@website-data';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { isCompanionBonusActive, getGoldenFoodMulti } from '@parsers/misc';
import { getClassExpMulti, getDropRate, getPlayerConstructionSpeed } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';

/**
 * Parses a raw bonus name like "}x_Res._XP" or "+{%_Class_XP" into
 * a clean display name and format type.
 */
function parseBonusName(raw: string): { name: string; displayFormat: 'multi' | 'additive' } {
  const isAdditive = raw.startsWith('+{%');
  const cleaned = raw
    .replace(/^[}+{%x_]+/, '') // strip format prefix
    .replace(/_/g, ' ')        // underscores to spaces
    .replace(/@/g, '')         // strip @ markers
    .replace(/[^\x20-\x7E]/g, '') // strip non-ASCII (kanji markers)
    .trim();
  return { name: cleaned, displayFormat: isAdditive ? 'additive' : 'multi' };
}

export const getButton = (account: any) => {
  const accountOptions = account?.accountOptions ?? [];
  const tasks: any[] = buttonTasksData ?? [];
  const bonusPerPress: number[] = (bonusPerPressData as any) ?? [];
  const rawBonusNames: string[] = (bonusNamesData as any) ?? [];
  const parsedBonuses = rawBonusNames.map(parseBonusName);

  const totalPresses = Number(accountOptions?.[594]) || 0;
  const instaSkipsLeft = Number(accountOptions?.[595]) || 0;
  // Grid 126 mode 1 = level (integer insta skip count per week)
  const instaSkipsPerWeek = getResearchGridBonus(account, 126, 1);

  // Task order lookup: researchData[39] is a 100-element permutation table
  const permutationTable = researchData?.[39] ?? [];

  // Bonus multiplier: (1 + companion147 / 100) * (1 + grid125 / 100)
  const companion147Active = isCompanionBonusActive(account, 147);
  const companion147Bonus = companion147Active ? (account?.companions?.list?.at(147)?.bonus ?? 0) : 0;
  const grid125Bonus = getResearchGridBonus(account, 125, 0);
  const bonusMulti = (1 + companion147Bonus / 100) * (1 + grid125Bonus / 100);

  // Compute all 9 bonus values and boost counts
  const categoryCount = bonusPerPress.length || 9;
  const bonusValues = new Array(categoryCount).fill(0);
  for (let s = 0; s < totalPresses; s++) {
    const categoryIndex = Math.floor(s / 5) % categoryCount;
    bonusValues[categoryIndex] += (bonusPerPress[categoryIndex] ?? 0) * bonusMulti;
  }

  // Boost count = number of COMPLETED groups of 5 presses for each category
  const completedGroups = Math.floor(totalPresses / 5);
  const fullCycles = Math.floor(completedGroups / categoryCount);
  const remainder = completedGroups % categoryCount;
  const boostCounts = Array.from({ length: categoryCount }, (_, i) =>
    fullCycles + (i < remainder ? 1 : 0)
  );

  const bonuses = parsedBonuses.map(({ name, displayFormat }, index) => ({
    name,
    value: bonusValues[index] ?? 0,
    displayFormat,
    displayValue: displayFormat === 'multi'
      ? `${Math.round(100 * (1 + (bonusValues[index] ?? 0) / 100)) / 100}x`
      : `+${Math.round(100 * (bonusValues[index] ?? 0)) / 100}%`,
    bonusPerPress: bonusPerPress[index] ?? 0,
    level: boostCounts[index] ?? 0
  }));

  // Build the raw task sequence: one entry per upcoming press, no deduplication.
  // Generate enough for ~10 bonus cycles (450 presses) to support cycle selection in the UI.
  const permLen = permutationTable.length || 100;
  const maxPresses = 450;
  // First pass: build raw sequence with press numbers per task index
  const rawSequence: { taskIdx: number; pressAtOffset: number; bonusIdx: number }[] = [];
  for (let offset = 0; offset < maxPresses; offset++) {
    const pressAtOffset = totalPresses + offset;
    const pressIdx = pressAtOffset % permLen;
    const permVal = Number(permutationTable[pressIdx]) || 0;
    const taskIdx = tasks.length > 0 ? permVal % tasks.length : 0;
    rawSequence.push({ taskIdx, pressAtOffset, bonusIdx: Math.floor(pressAtOffset / 5) % categoryCount });
  }

  // Build future requirements lookup: for each position, find next 5 occurrences of same task
  const taskSequence = rawSequence.map((entry, i) => {
    const task = tasks[entry.taskIdx];
    if (!task) return null;
    const req = getTaskRequirement(task, entry.pressAtOffset);
    const progress = getTaskProgress(entry.taskIdx, account);
    const futureRequirements: number[] = [];
    for (let j = i + 1; j < rawSequence.length && futureRequirements.length < 5; j++) {
      if (rawSequence[j].taskIdx === entry.taskIdx) {
        futureRequirements.push(getTaskRequirement(task, rawSequence[j].pressAtOffset));
      }
    }
    return {
      index: entry.taskIdx,
      description: formatTaskDescription(task[0], req),
      requirement: req,
      futureRequirements,
      progress,
      isReady: progress >= req,
      bonusIdx: entry.bonusIdx,
      pressNumber: entry.pressAtOffset
    };
  }).filter(Boolean);

  // Rotation state: which bonus category is currently being filled and progress within it
  const activeBonusIndex = Math.floor(totalPresses / 5) % 9;
  const pressesIntoCurrentBonus = totalPresses % 5;

  return {
    totalPresses,
    instaSkipsLeft,
    instaSkipsPerWeek,
    currentTask: taskSequence[0] ?? null,
    bonusMulti,
    bonuses,
    activeBonusIndex,
    pressesIntoCurrentBonus,
    taskSequence
  };
};

/**
 * Computes the requirement for a button task at a given press count.
 * Three scaling modes: linear, step, exponent.
 */
function getTaskRequirement(task: any, totalPresses: number): number {
  const [, rawBase, scalingType, rawFactor] = task;
  const base = Number(rawBase) || 0;
  const factor = Number(rawFactor) || 1;

  switch (scalingType) {
    case 'linear':
      return Math.ceil(base + totalPresses * factor);
    case 'step':
      return Math.ceil(base + totalPresses / factor);
    case 'exponent':
      return base * Math.pow(factor, totalPresses);
    default:
      return base;
  }
}

/**
 * Maps a task index to the player's current value for that task.
 * Uses parsed account data where available, raw idleonData only when necessary.
 * Indices that require complex live calculations return 0.
 */
function getTaskProgress(taskIndex: number, account: any): number {
  const opts = account?.accountOptions ?? [];

  switch (taskIndex) {
    // 0-3: TotalStats (STR/AGI/WIS/LUK) — per-character live calc, skip for now
    case 0: case 1: case 2: case 3: return 0;

    // 4-7: Class-specific resources (Grimoire/Compass/Tesseract)
    case 4: return Number(opts?.[330]) || 0;
    case 5: return Number(opts?.[358]) || 0;
    case 6: return Number(opts?.[390]) || 0;
    case 7: return Number(opts?.[391]) || 0;

    // 8-14: Statue levels
    case 8: return account?.statues?.[29]?.level ?? 0;   // DRAGON
    case 9: return account?.statues?.[2]?.level ?? 0;    // MINING
    case 10: return account?.statues?.[6]?.level ?? 0;   // LUMBERBOB
    case 11: return account?.statues?.[8]?.level ?? 0;   // OCEANMAN
    case 12: return account?.statues?.[9]?.level ?? 0;   // OL_RELIABLE
    case 13: return account?.statues?.[15]?.level ?? 0;  // BOX
    case 14: return account?.statues?.[16]?.level ?? 0;  // TWOSOUL

    // 15: Class EXP multi — computed by getClassExpMulti(), not stored on character
    // 16: Drop Rate multi — computed by getDropRate(), not stored on character
    case 15: case 16: return 0;

    // 17: Crystallin Stamp level
    case 17: return account?.stamps?.skills?.[2]?.level ?? 0;

    // 18-20: Alchemy bubble levels
    case 18: return account?.alchemy?.bubbles?.power?.[0]?.level ?? 0;     // Roid Ragin
    case 19: return account?.alchemy?.bubbles?.quicc?.[0]?.level ?? 0;     // Swift Steppin
    case 20: return account?.alchemy?.bubbles?.['high-iq']?.[0]?.level ?? 0; // Stable Jenius

    // 21: Construction Build Rate — computed by getPlayerConstructionSpeed(), not stored
    case 21: return 0;

    // 22: 3D Printer Copper sample
    case 22: {
      const printerData = account?.printer ?? [];
      for (const charPrinter of printerData) {
        const copper = charPrinter?.find?.((s: any) => s?.item === 'Copper');
        console.log('copper', copper);
        if (copper?.value) return copper?.value;
      }
      return 0;
    }

    // 23: Feathers (Orion)
    case 23: return Number(opts?.[253]) || 0;

    // 24: Total waves (Miniature Soul Apparatus)
    case 24: return account?.towers?.totalWaves ?? 0;

    // 25: Breeding Mob power in 1st storage slot
    case 25: return account?.breeding?.storedPets?.[0]?.power ?? 0;

    // 26: Foraging Speed (Desert Oasis)
    case 26: return account?.breeding?.territories?.[5]?.forageSpeed ?? 0;

    // 27: Ribbon tier on Yumi Peachring — stored in grimoire (Ribbon array)
    case 27: return Number(account?.grimoire?.ribbons?.[92]) || 0;

    // 28: Sausy Sausage meal level
    case 28: return account?.cooking?.meals?.[56]?.level ?? 0;

    // 29: Tome score
    case 29: return account?.tome?.totalPoints ?? 0;

    // 30-35: Skill levels (highest across characters)
    case 30: return account?.totalSkillsLevels?.laboratory?.level ?? 0;
    case 31: return account?.totalSkillsLevels?.sneaking?.level ?? 0;
    case 32: return account?.totalSkillsLevels?.spelunking?.level ?? 0;
    case 33: return account?.totalSkillsLevels?.mining?.level ?? 0;
    case 34: return account?.totalSkillsLevels?.chopping?.level ?? 0;
    case 35: return account?.totalSkillsLevels?.divinity?.level ?? 0;

    // 36: Divinity PTS
    case 36: return account?.divinity?.divinityPoints ?? 0;

    // 37: Gold bars in Sailing
    case 37: return account?.sailing?.lootPile?.[0]?.amount ?? 0;

    // 38: Artifact Find Chance multi — use the first boat's computed chance
    case 38: return parseFloat(account?.sailing?.boats?.[0]?.artifactChance?.value) || 0;

    // 39: Gaming Bits
    case 39: return account?.gaming?.bits ?? 0;

    // 40: Total plants picked in Gaming (Elegant Seashell)
    case 40: return account?.gaming?.totalPlantsPicked ?? 0;

    // 41: Palette Multi
    case 41: return account?.gaming?.paletteFinalBonus ?? 0;

    // 42: Items found (Slab)
    case 42: return account?.looty?.lootedItems ?? 0;

    // 43: White Essence in Summoning
    case 43: return account?.summoning?.essences?.[0] ?? 0;

    // 44: Total Career Wins in Summoning
    case 44: return account?.summoning?.totalWins ?? 0;

    // 45: Crop Transfer (Bean Trade)
    case 45: return account?.farming?.beanTrade ?? 0;

    // 46: Jade
    case 46: return account?.sneaking?.jadeCoins ?? 0;

    // 47: Golden Food Bonus % — DNSM.GfoodBonusMULTI, not parsed
    case 47: return 0;

    // 48: Total crops found
    case 48: return account?.farming?.cropsFound ?? 0;

    // 49: Max crystal damage — computed by getMaxDamage(), not stored
    case 49: return 0;

    // 50: Total Spelunking POW
    case 50: return account?.spelunking?.power?.value ?? 0;

    // 51: Best depth in Chucklemire
    case 51: return account?.spelunking?.bestCaveLevels?.[4] ?? 0;

    // 52: Coins
    case 52: return account?.currencies?.rawMoney ?? 0;

    // 53: Showdown level (Emperor)
    case 53: return (Number(opts?.[369]) || 0) + 1;

    // 54: Sushi Bucks
    case 54: return account?.sushiStation?.currency?.bucks ?? 0;

    // 55: Fish for Poppy
    case 55: return Number(opts?.[267]) || 0;

    // 56: Meat Slices (Bubba)
    case 56: return account?.bubba?.meatSlices ?? 0;

    // 57-59: Placeholder/unused tasks, return 1
    default: return taskIndex >= 57 ? 1 : 0;
  }
}

/**
 * Formats a button task description:
 * - Replaces underscores with spaces
 * - Resolves { placeholder with the computed requirement
 */
function formatTaskDescription(rawDescription: string, requirement: number): string {
  if (!rawDescription) return '';
  let desc = rawDescription.replace(/_/g, ' ');
  // Replace { with the requirement value
  desc = desc.split('{').join(formatLargeNumber(requirement));
  return desc.trim();
}

/**
 * Formats large numbers with commas for display in task descriptions.
 */
function formatLargeNumber(value: number): string {
  if (value >= 1e15) return value.toExponential(2);
  return Math.floor(value).toLocaleString('en-US');
}

/**
 * Returns the button bonus value for a given bonus index (0-8).
 * Used by other parsers to read computed button bonuses.
 */
export const getButtonBonus = (account: any, index: number): number => {
  return account?.button?.bonuses?.[index]?.value ?? 0;
};

/**
 * Returns the character-specific progress value for per-character task indices.
 * Called from the UI when a character is selected to override account-level values.
 * Returns null if the index doesn't need character-specific computation.
 */
export const getCharacterTaskProgress = (taskIndex: number, character: any, account: any, characters: any[]): number | null => {
  switch (taskIndex) {
    case 0: return character?.stats?.strength ?? 0;
    case 1: return character?.stats?.agility ?? 0;
    case 2: return character?.stats?.wisdom ?? 0;
    case 3: return character?.stats?.luck ?? 0;
    case 15: {
      const result = getClassExpMulti(character, account, characters);
      return result?.value ?? 0;
    }
    case 16: {
      const result = getDropRate(character, account, characters);
      return result?.dropRate ?? 0;
    }
    case 21: return getPlayerConstructionSpeed(character, account) ?? 0;
    case 47: {
      const multi = getGoldenFoodMulti(character, account, characters);
      return Math.max(0, 100 * ((multi?.value ?? 1) - 1));
    }
    case 49: {
      const result = getMaxDamage(character, characters, account);
      return result?.maxDamage ?? 0;
    }
    default: return null;
  }
};
