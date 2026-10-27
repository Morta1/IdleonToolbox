import { commaNotation, lavaLog, notateNumber, tryToParse } from '@utility/helpers';
import { grimoire, mapEnemiesArray, mapNames, monsterCoinQuantity, monsters, randomList } from '@website-data';
import { liveEntries } from '@parsers/catalog';
import { getTalentBonus } from '@parsers/talents';
import { getStatsFromGear } from '@parsers/items';
import { getGambitBonus } from '@parsers/world-5/caverns/gambit';
import { getEmperorBonus } from '@parsers/world-6/emperor';
import { getOptimizedGenericUpgrades } from '@parsers/genericUpgradeOptimizer';
import { getMasterclassCostReduction, getAllMasterclassDropz } from '@parsers/misc';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getJewelBonus } from '@parsers/world-4/lab';
import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getExoticMarketBonus } from '@parsers/world-6/farming';
import { getCharmBonus } from '@parsers/world-6/sneaking';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { getLoreBossBonus } from '@parsers/world-7/spelunking';
import { getMeritocracyBonus } from '@parsers/world-2/voteBallot';
import { additiveGroup, createBreakdown, multiplier, NUMBERED_GROUP, percent } from '@parsers/breakdown';
import { OPT } from '@parsers/accountOptions';

export const boneNames = [
  'Femur',
  'Ribcage',
  'Cranium',
  'Bovinae'
];

export const GRIMOIRE_UPGRADE_CATEGORIES = {
  damage: {
    name: 'Damage',
    stats: ['damage'],
    upgradeIndices: [0, 6, 8, 13, 16, 18, 20, 21, 28, 31, 33, 35, 43, 46, 50]
  },
  accuracy: {
    name: 'Accuracy',
    stats: ['accuracy'],
    upgradeIndices: [1, 7, 12, 25, 37, 38, 41, 47]
  },
  defence: {
    name: 'Defence',
    stats: ['defence'],
    upgradeIndices: [2, 7, 15, 27, 30, 38, 40, 49]
  },
  hp: {
    name: 'HP',
    stats: ['hp'],
    upgradeIndices: [3, 7, 19, 34, 38, 42]
  },
  crit: {
    name: 'Crit',
    stats: ['critChance', 'critDamage'],
    upgradeIndices: [10, 20]
  },
  extraBones: {
    name: 'Extra Bones',
    stats: ['extraBones'],
    upgradeIndices: [23, 48]
  }
};

export const getGrimoire = (idleonData: any, charactersData: any, account: any) => {
  const grimoireRaw = tryToParse(idleonData?.Grimoire) || idleonData?.Grimoire;
  const ribbonRaw = tryToParse(idleonData?.Ribbon) || idleonData?.Ribbon;
  return parseGrimoire(grimoireRaw, ribbonRaw, charactersData, account);
};

const parseGrimoire = (grimoireRaw: any, ribbonRaw: any, charactersData: any, account: any) => {
  const bones = boneNames.map((_, index) => account?.accountOptions?.[330 + index] ?? 0);
  const totalUpgradeLevels = grimoireRaw?.reduce((sum: any, level: any) => sum + level, 0) ?? 0;
  const totalBonesCollected = account?.accountOptions?.[OPT.grimoireBonesCollected] ?? 0;
  let upgrades = liveEntries<any>(grimoire).map(({ entry: upgrade, index }) => {
    const { x1, x2 } = upgrade;
    const level = grimoireRaw?.[index] ?? 0;
    const cost = getUpgradeCost({ x1, x2, index, level, account: account })
    return {
      ...upgrade,
      index,
      level,
      cost
    }
  });
  upgrades = upgrades.map((upgrade, index) => {
    const bonus = calcGrimoireBonus(upgrades, index);
    return {
      ...upgrade,
      index,
      unlocked: upgrade?.unlockLevel <= totalUpgradeLevels,
      bonus,
      monsterProgress: getMonsterProgress(account, index),
      description: upgrade?.description.replace('{', '' + commaNotation(bonus)).replace('}', '' + notateNumber(1 + bonus / 100, 'MultiplierInfo'))
    }
  })
  const nextUnlock = upgrades?.find(({ unlocked }: any) => !unlocked);

  return {
    totalUpgradeLevels,
    bones,
    upgrades,
    nextUnlock,
    totalBonesCollected,
    monsterDrops: getMonsterDrops(),
    ribbons: ribbonRaw
  };
}

const getMonsterDrops = () => {
  const excludedMaps = ([
    'Nothing', 'Z', 'Copper',
    'Iron', 'Starfire', 'Plat', 'Void',
    'Filler', 'JungleZ', 'Grandfrog\'s_Gazebo',
    'Grandfrog\'s_Backyard', 'Gravel_Tomb', 'Heaty_Hole',
    'Igloo\'s_Basement', 'Inside_the_Igloo', 'End_Of_The_Road',
    'Efaunt\'s_Tomb', 'Eycicles\'s_Nest', 'Enclave_a_la_Troll',
    'Chizoar\'s_Cavern', 'KattleKruk\'s_Volcano', 'Castle_Interior', 'Emperor\'s_Castle'] as any).toSimpleObject();
  const list = Object.values(mapNames).map((mapName, index) => {
    const monsterRawName = mapEnemiesArray?.[index];
    const coinQuantity = (monsterCoinQuantity as any)?.[monsterRawName];
    const boneType = 6e3 === Math.floor(coinQuantity)
    || 12500 === Math.floor(coinQuantity) || 22e3 === Math.floor(coinQuantity) ||
    35e4 === Math.floor(coinQuantity) ? 0 : 4e5 === Math.floor(coinQuantity) ?
      1 : 3700 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 27) % 4, 3)
        : 740 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 27) % 3, 2) :
          190 <= coinQuantity ? Math.min(Math.floor(coinQuantity / 27) % 2, 1) : 0;
    const boneQuantity = 3 <= boneType
      ? Math.pow(Math.max(1, coinQuantity - 3699), 0.9) : 2 <= boneType
        ? Math.pow(Math.max(1, coinQuantity - 739), 0.9) : 1 <= boneType
          ? Math.pow(Math.max(1, coinQuantity - 189), 0.9) : Math.pow(Math.max(coinQuantity, coinQuantity), 0.9);
    return {
      ...monsters?.[monsterRawName],
      rawName: monsterRawName,
      mapName,
      boneType,
      boneQuantity
    }
  }).filter(({
               mapName,
               AFKtype
             }) => AFKtype === 'FIGHTING' && !excludedMaps[mapName] && !AFKtype.includes('Fish') && !AFKtype.includes('Bug') && !mapName.includes('Colosseum'));

  // Filter to get the final list with unique items by rawName
  return list.filter((item, index, self) =>
    index === self.findIndex((t) => t.rawName === item.rawName)
  );

}

// RANDOlist[104] is a kill-target ladder shared by several upgrades, each counting its progress in its own
// OptionsListAccount slot. Past the last monster the game shows "All_Done!".
export const getMonsterLadderTarget = (progress: number) => {
  const monsterList = randomList?.[104] ?? [];
  return progress < monsterList.length ? monsters?.[monsterList[progress]]?.Name : 'All_Done!';
}

// Grimoire upgrade index -> the OptionsListAccount slot holding its monster ladder progress
const GRIMOIRE_LADDER_OPTIONS: Record<number, number> = { 13: 334, 21: 335, 31: 336 };

const getMonsterProgress = (account: any, index: any) => {
  const optionIndex = GRIMOIRE_LADDER_OPTIONS[index];
  return optionIndex === undefined ? undefined : getMonsterLadderTarget(account?.accountOptions?.[optionIndex] ?? 0);
}

// game: Summoning("Grimoire_*") reads FAMINE_O'_FISH x log(SkillStats("FishingEfficiency")) for crits;
// the efficiency (getSkillEfficiency('fishing', ...)) needs the damage parser, so callers pass it in
export const getWraithStats = (character: any, account: any, fishingEfficiency = 0) => {
  const { upgrades, totalUpgradeLevels } = account?.grimoire || {};
  const bulwarkStyle = getTalentBonus(character?.flatTalents, 'BULWARK_STYLE');
  const wraithForm = getTalentBonus(character?.flatTalents, 'WRAITH_FORM');
  const marauderStyle = getTalentBonus(character?.flatTalents, 'MARAUDER_STYLE');
  const famineFishX = getTalentBonus(character?.flatTalents, 'FAMINE_O\'_FISH');
  const famineFishY = getTalentBonus(character?.flatTalents, 'FAMINE_O\'_FISH', true);
  const hp = (10 + (calcGrimoireBonus(upgrades, 3)
      + (calcGrimoireBonus(upgrades, 19)
        + (calcGrimoireBonus(upgrades, 34)
          + calcGrimoireBonus(upgrades, 42)))))
    * (1 + (calcGrimoireBonus(upgrades, 7)
      + calcGrimoireBonus(upgrades, 38)) / 100)
    * (1 + (bulwarkStyle
      * (totalUpgradeLevels / 100)) / 100);
  const damage = (5 + (calcGrimoireBonus(upgrades, 0)
      + (calcGrimoireBonus(upgrades, 6)
        + (calcGrimoireBonus(upgrades, 16)
          + (calcGrimoireBonus(upgrades, 33)
            + calcGrimoireBonus(upgrades, 46))))))
    * (1 + wraithForm / 100)
    * (1 + (calcGrimoireBonus(upgrades, 8)
      + (calcGrimoireBonus(upgrades, 28)
        + (calcGrimoireBonus(upgrades, 43)
          + calcGrimoireBonus(upgrades, 50)))) / 100)
    * (1 + ((account?.accountOptions?.[OPT.grimoireKnockouts] ?? 0)
      * calcGrimoireBonus(upgrades, 13)
      + ((account?.accountOptions?.[OPT.grimoireEliminations] ?? 0)
        * calcGrimoireBonus(upgrades, 21)
        + (account?.accountOptions?.[OPT.grimoireAnnihilations] ?? 0)
        * calcGrimoireBonus(upgrades, 31))) / 100)
    * (1 + (calcGrimoireBonus(upgrades, 18)
      * lavaLog(account?.accountOptions?.[OPT.grimoireFemurs] ?? 0)) / 100)
    * (1 + (marauderStyle * (totalUpgradeLevels / 100)) / 100);
  const accuracy = (2 + (calcGrimoireBonus(upgrades, 1)
      + (calcGrimoireBonus(upgrades, 12)
        + (calcGrimoireBonus(upgrades, 25)
          + (calcGrimoireBonus(upgrades, 37)
            + calcGrimoireBonus(upgrades, 47))))))
    * (1 + (calcGrimoireBonus(upgrades, 7)
      + calcGrimoireBonus(upgrades, 38)) / 100)
    * (1 + (calcGrimoireBonus(upgrades, 41)
      * lavaLog(account?.accountOptions?.[OPT.grimoireCraniums] ?? 0)) / 100)
    * (1 + (marauderStyle
      * (totalUpgradeLevels / 100)) / 100);
  const defence = (calcGrimoireBonus(upgrades, 2)
      + (calcGrimoireBonus(upgrades, 15)
        + (calcGrimoireBonus(upgrades, 30)
          + (calcGrimoireBonus(upgrades, 40)
            + calcGrimoireBonus(upgrades, 49)))))
    * (1 + (calcGrimoireBonus(upgrades, 7)
      + calcGrimoireBonus(upgrades, 38)) / 100)
    * (1 + (calcGrimoireBonus(upgrades, 27)
      * lavaLog(account?.accountOptions?.[OPT.grimoireRibcages] ?? 0)) / 100)
    * (1 + (bulwarkStyle
      * (totalUpgradeLevels / 100)) / 100);
  const critChance = 10 + (calcGrimoireBonus(upgrades, 10)
    + famineFishX
    * lavaLog(fishingEfficiency))
  const critDamage = 1 + (25 + calcGrimoireBonus(upgrades, 20)
    + famineFishY
    * lavaLog(fishingEfficiency)) / 100;
  const baseExtraBones = getExtraBonesBonus(character, account);

  return {
    hp,
    damage,
    accuracy,
    defence,
    critChance,
    critDamage,
    extraBones: baseExtraBones.value,
    extraBonesBreakdown: baseExtraBones.breakdown
  };
}

const getUpgradeCost = ({ index, level, x1, x2, account, forceLegendTalent }: any) => {
  return 3 * Math.pow(1.05, index) * getMasterclassCostReduction(account, forceLegendTalent) * (level + (x1 + level) * Math.pow(x2 + 0.01, level));
}

// Summed cost of every level from the upgrade's current one up to targetLevel (capped at x4).
export const getGrimoireTotalUpgradeCost = (account: any, upgrade: any, targetLevel: number, forceLegendTalent?: boolean) => {
  const end = Math.min(targetLevel, upgrade?.x4 ?? targetLevel);
  let total = 0;
  for (let level = upgrade?.level ?? 0; level < end; level++) {
    total += getUpgradeCost({ ...upgrade, level, account, forceLegendTalent });
  }
  return total;
}

export const getExtraBonesBonus = (character: any, account: any) => {
  const { upgrades } = account?.grimoire || {};
  // game GetTalentNumber(1, 196 / 198) and EtcBonuses("76") all read the character itself
  const grimoire = getTalentBonus(character?.flatTalents, 'GRIMOIRE');
  const graveyardShift = getTalentBonus(character?.flatTalents, 'GRAVEYARD_SHIFT');

  const { value: gearBonus } = getStatsFromGear(character, 76, account);
  const emperorBonus = getEmperorBonus(account, 1);
  const charmBonus = getCharmBonus(account, 'Glimmerchain'); // Pristine charm 18
  const arcadeBonus = getArcadeBonus(account?.arcade?.shop, 'Deathbringer_Bones')?.bonus ?? 0;
  // game MainframeBonus(121): ids of 100+ are jewels (121 - 100 = Deadly Wrath Jewel), not lab bonuses
  const mainframeBonus = getJewelBonus(account?.lab?.jewels, 21);
  const paletteBonus = getPaletteBonus(account, 22) ?? 0;
  const exoticBonus = getExoticMarketBonus(account, 53) ?? 0;
  const bubbleBonus = getBubbleBonus(account, 'BONE_BUBBLE') ?? 0; // AlchBubbles.W13 = BONE_BUBBLE (power, stat tag W13)
  const loreBonus = getLoreBossBonus(account, 0) ?? 0; // Tome epilogue (LoreEpiBon 0)
  const meritocracyBonus = getMeritocracyBonus(account, 25) ?? 0;
  const { value: allMasterclassDropz, breakdown: masterclassDropsGroup } = getAllMasterclassDropz(character, account);

  const gambitMulti = Math.min(2, 1 + getGambitBonus(account, 12));
  const gearMulti = Math.min(1.5, 1 + gearBonus / 100);
  const grimoireUpgrades = calcGrimoireBonus(upgrades, 23)
    + calcGrimoireBonus(upgrades, 48) * lavaLog(account?.accountOptions?.[OPT.grimoireBovinae] ?? 0);
  const upgradeBonus = grimoireUpgrades + arcadeBonus + mainframeBonus + paletteBonus + exoticBonus;

  const value = (1 + charmBonus / 100)
    * (1 + loreBonus / 100)
    * allMasterclassDropz
    * (1 + grimoire / 100)
    * (1 + meritocracyBonus / 100)
    * gambitMulti
    * gearMulti
    * (1 + (emperorBonus + bubbleBonus) / 100)
    * (1 + upgradeBonus / 100)
    * (1 + (1 * graveyardShift) / 100); // GenInfo kill-count not tracked in save

  return {
    value,
    breakdown: createBreakdown('Extra Bones', notateNumber(value, 'MultiplierInfo') + 'x', [
      multiplier('Talent (Grimoire)', 1 + grimoire / 100),
      multiplier('Talent (Graveyard Shift)', 1 + graveyardShift / 100),
      multiplier('Charm (Glimmerchain)', 1 + charmBonus / 100),
      multiplier('Tome Epilogue', 1 + loreBonus / 100),
      multiplier('Meritocracy', 1 + meritocracyBonus / 100),
      multiplier('Gambit', gambitMulti, { note: 'At most ×2' }),
      multiplier('Gear', gearMulti, { note: 'At most ×1.5' }),
      additiveGroup(NUMBERED_GROUP, [
        percent('Emperor', emperorBonus),
        percent('Bubble', bubbleBonus)
      ]),
      additiveGroup(NUMBERED_GROUP, [
        percent('Upgrades', grimoireUpgrades),
        percent('Arcade', arcadeBonus),
        percent('Lab', mainframeBonus),
        percent('Palette', paletteBonus),
        percent('Exotic Market', exoticBonus)
      ]),
      masterclassDropsGroup
    ])
  };
}

export const getGrimoireBonus = (upgrades: any, index: any) => {
  return upgrades?.[index]?.bonus || 0;
}

export const calcGrimoireBonus = (upgrades: any, index: any): any => {
  const upgrade = upgrades?.[index];
  return 9 === index || 11 === index || 26 === index || 36 === index || 39 === index || 17 === index || 32 === index || 45 === index
    ? upgrade?.level
    * upgrade?.x5
    : upgrade?.level
    * upgrade?.x5
    * (1 + calcGrimoireBonus(upgrades, 36) / 100);

}

export const getOptimizedGrimoireUpgrades = (character: any, account: any, category = 'damage', maxUpgrades = 100, options = {}) => {
  const categoryInfo = (GRIMOIRE_UPGRADE_CATEGORIES as Record<string, any>)[category];
  return getOptimizedGenericUpgrades({
    character,
    account,
    category,
    maxUpgrades,
    categoryInfo,
    getUpgrades: (acc: any) => acc?.grimoire?.upgrades || [],
    getResources: (acc: any) => acc?.grimoire?.bones || [],
    getCurrentStats: (upgrades: any, char: any, acc: any, extraArgs: any) =>
      getWraithStats(char, { ...acc, grimoire: { ...acc.grimoire, upgrades } }, extraArgs?.fishingEfficiency),
    getUpgradeCost: (upgrade: any, index: any, {forceLegendTalent}: any) => getUpgradeCost({ ...upgrade, index, level: upgrade.level, x1: upgrade.x1, x2: upgrade.x2, account, forceLegendTalent }),
    updateResourcesAfterUpgrade: (resources: any, upgrade: any, resourceNames: any, cost: any) => {
      const boneIdx = upgrade.boneType ?? upgrade.x3;
      if (resources[boneIdx] !== undefined) resources[boneIdx] -= cost;
    },
    resourceNames: boneNames,
    // Unlock gate is total levels bought anywhere in the tree, so it moves as the walk buys
    getUnlockedIndices: (upgrades: any) => {
      const totalLevels = upgrades.reduce((sum: number, upgrade: any) => sum + (upgrade?.level ?? 0), 0);
      return new Set(upgrades
        .filter((upgrade: any) => (upgrade?.unlockLevel ?? 0) <= totalLevels)
        .map((upgrade: any) => upgrade.index));
    },
    heldResourceOptionBase: 330, // accountOptions[330 + type] = bones currently held
    extraArgs: options
  });
};