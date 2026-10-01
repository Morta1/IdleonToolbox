import { notateNumber, number2letter, tryToParse } from "@utility/helpers";
import {
  jadeUpgrades,
  ninjaEquipment,
  ninjaExtraInfo,
  ninjaUpgrades,
  pristineCharms as rawPristineCharms,
  randomList
} from '@website-data';
import { getLabBonus } from "@parsers/world-4/lab";
import { getBestActiveCharacter, getHighestTalentAcrossCharacters } from "@parsers/talents";
import { getLegendTalentBonus } from "@parsers/world-7/legendTalents";
import { getUpgradeVaultBonus } from "@parsers/misc/upgradeVault";
import { getPaletteBonus } from "@parsers/world-5/gaming";
import { getCompassBonus } from "@parsers/class-specific/compass";
import { getCloudBonus } from "@parsers/world-3/equinox";
import { getLandRank } from "@parsers/world-6/farming";
import { getGambitBonus } from "@parsers/world-5/caverns/gambit";
import { getBubbleBonus } from "@parsers/world-2/alchemy";
import { getStarSignBonus } from "@parsers/starSigns";
import { getStatueBonus } from "@parsers/world-1/statues";
import { getCardLevel } from "@parsers/cards";
import { getAchievementStatus } from "@parsers/achievements";
import { getVoteBonus } from "@parsers/world-2/voteBallot";
import { getLampBonus } from "@parsers/world-5/caverns/the-lamp";
import { getSchematicBonus } from "@parsers/world-5/caverns/the-well";
import { getIsland } from "@parsers/world-2/islands";
import { getEmperorBonus } from "@parsers/world-6/emperor";
import { getSushiBonus } from "@parsers/world-7/sushiStation";
import { getJellyBonus } from "@parsers/world-7/jellyOperator";
import { isCompanionBonusActive } from "@parsers/misc";

export const getSneaking = (idleonData: any, serverVars: any, charactersData: any, account: any) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  const rawSpelunking = tryToParse(idleonData?.Spelunk);
  return parseSneaking(rawSneaking, rawSpelunking, serverVars, charactersData, account);
};

const doorMaxHps = ninjaExtraInfo?.[3];
// Gemstone counters are capped at 10M gems.
const GEMSTONE_MAX_VALUE = 1e7;
// Pristine charms live in their own list rather than in `ninjaEquipment`, but inventory slots
// reference them by raw name like any other item.
const pristineCharmItems: Record<string, any> = rawPristineCharms.reduce((result, charm) => ({
  ...result,
  [charm.rawName]: charm
}), {});

const parseSneaking = (rawSneaking: any, rawSpelunking: any, serverVars: any, charactersData: any, account: any) => {
  const gemStonesUnlocked = rawSneaking?.[106]?.filter((name: any) => name.includes('NjGem'));

  let gemStones = Object.entries(ninjaEquipment)
    .reduce((result: any[], [key, data]) => key.includes('NjGem') ? [...result, data] : result, [] as any[])
    .map((data: any, index) => {
      const unlocked = gemStonesUnlocked?.[index];
      const baseValue = account?.accountOptions?.[233 + index] ?? 0;
      const bonus = baseValue < .5 ? 0 : getGemstoneBonus({ ...(data as any), baseValue }, index, 0, charactersData);
      const description = randomList?.[102]?.[index];

      return {
        ...data,
        unlocked,
        baseValue,
        bonus,
        description
      };
    });

  gemStones = gemStones.map((data, index) => {
    const bonus = data?.baseValue < .5 ? 0 : getGemstoneBonus(data, index, gemStones?.[5]?.bonus, charactersData);
    // Gem counters cap at 10M, so the highest reachable bonus is the one you'd get at a full counter.
    const maxBonus = getGemstoneBonus({ ...data, baseValue: GEMSTONE_MAX_VALUE }, index, gemStones?.[5]?.bonus, charactersData);
    let notatedBonus, description = data.description ?? '';
    // Descriptions using '$' display a diminishing-returns value instead of the raw bonus.
    const isDiminishing = data.description.includes('$');
    const displayBonus = isDiminishing ? 100 * (1 - 1 / (1 + bonus / 100)) : bonus;
    const displayMaxBonus = isDiminishing ? 100 * (1 - 1 / (1 + maxBonus / 100)) : maxBonus;

    if (data.description.includes('}')) {
      notatedBonus = notateNumber(bonus, 'Big');
      description = description.replace('}', notatedBonus);
    }

    if (isDiminishing) {
      notatedBonus = notateNumber(displayBonus, 'Big');
      description = description.replace('$', notatedBonus);
    }

    // The bonus formula is x3 + x5 * (baseValue / (1000 + baseValue)).
    // The saturating term is how close this gemstone is to its max possible bonus, normalized to the 10M counter cap.
    const maxSaturation = GEMSTONE_MAX_VALUE / (1e3 + GEMSTONE_MAX_VALUE);
    const saturationPct = Math.min(100, data.baseValue / (1e3 + data.baseValue) / maxSaturation * 100);

    return {
      ...data,
      bonus,
      maxBonus,
      displayBonus,
      displayMaxBonus,
      notatedBonus,
      saturationPct,
      description: description.replace('{', '+').replace(/@/g, '')
    };
  });

  const sneakingExpThing = rawSneaking?.[102]?.[0];
  const jadeEmporiumUnlocks = rawSneaking?.[102]?.[9];
  const jadeCoins = rawSneaking?.[102]?.[1] ?? 0;
  const lastLooted = rawSneaking?.[102]?.[2];
  const ninjaUpgradeLevels = rawSneaking?.[103];
  const totalNinjaUpgradeLevels = ninjaUpgradeLevels?.reduce((sum: any, level: any) => sum + level, 0);
  const beanstalkData = rawSneaking?.[104];
  const doorsCurrentHp = rawSneaking?.[100];

  const currentUnlockedFloors = doorMaxHps.reduce((sum: any, doorHp: any, index: any) => {
    const updatedDoorHp = (account?.accountOptions?.[231] < account?.accountOptions?.[232]
      ? 0
      : parseFloat(doorHp));
    return sum + ((updatedDoorHp - doorsCurrentHp?.[index] <= 0) ? 1 : 0);
  }, 1);

  const selectedNinjaMastery = account.accountOptions?.[231];
  const ninjaMastery = account.accountOptions?.[232];

  const unlockedFloors = ninjaMastery > 0 ? 12 * ninjaMastery : Math.min(12, currentUnlockedFloors);

  const playersInfo = rawSneaking?.slice(0, charactersData?.length)?.map(([floor, activityInfo]: any) => ({
    floor,
    activityInfo
  }));

  const dropList = ninjaExtraInfo.slice(13, 23).map((entry: any) => entry.toChunks(2))
    ?.map((array: any) => array?.map(([itemName, dropChance]: any) => ({
      ...(ninjaEquipment as Record<string, any>)[itemName],
      dropChance
    })));

  const spelunkProgress = rawSpelunking?.[13]?.[3] ?? 0; // This tracks how many special upgrades are unlocked

  const upgrades = ninjaUpgrades?.map((upgrade, index) => {
    const level = ninjaUpgradeLevels?.[index];
    const isSpecialUpgrade = index > 16;

    let isUnlocked = false;

    if (isSpecialUpgrade) {
      // Special upgrades unlock sequentially
      isUnlocked = spelunkProgress > (index - 17);
    } else {
      // All normal upgrades are unlocked once you have access to the ninja system
      isUnlocked = true;
    }

    return {
      ...upgrade,
      level,
      value: (level ?? 0) * (upgrade.modifier ?? 1),
      isUnlocked,
      isSpecialUpgrade,
      prerequisiteIndex: !isSpecialUpgrade ? upgrade.x9 : null,
      unlockOrder: isSpecialUpgrade ? index - 17 + 1 : null,
      position: {
        locked: { x: upgrade.x0, y: upgrade.x1 },
        unlocked: { x: upgrade.x10, y: upgrade.x11 }
      },
      size: {
        width: upgrade.x2,
        height: upgrade.x3
      }
    };
  })

  const order = ninjaExtraInfo[24];
  const inventory = parseNinjaItems(rawSneaking?.slice(60, 99), false, gemStones, account, 60);
  const characterEquipments = parseNinjaItems(rawSneaking?.slice(12, 12 + (charactersData?.length * 4)), true, gemStones?.[3]?.bonus, account, 12);

  const players = charactersData.map((_: any, index: any) => ({
    equipment: characterEquipments?.[index]?.map((equip: any) => ({
      ...equip,
      value: equip?.value
    })),
    ...(playersInfo?.[index] || [])
  }));

  let totalJadeEmporiumUnlocked = 0;

  const orderedEmporium = jadeUpgrades.map((upgrade, index) => {
    const unlocked = jadeEmporiumUnlocks ? jadeEmporiumUnlocks?.indexOf(number2letter?.[index]) !== -1 : false;
    if (unlocked) totalJadeEmporiumUnlocked += 1;

    return {
      ...upgrade,
      originalIndex: index,
      index: order?.indexOf(index + ''),
      unlocked
    };
  });

  orderedEmporium.sort((a, b) => a.index - b.index);

  const lootedItems = account?.looty?.rawLootedItems;

  const jadeEmporium = orderedEmporium.map((upgrade, index) => {
    let bonus;
    if (index === 42) {
      bonus = 1;
    }
    else if (index === 8 || index === 6) {
      const slabSovereignty = getLabBonus(account?.lab?.labBonuses, 15);
      const multi = Math.floor(Math.max(0, lootedItems - 1000) / 10);
      bonus = (index === 6 ? 3 : 5) * multi * (1 + slabSovereignty / 100);
    }

    return {
      ...upgrade,
      // cost: (300 + 500 * index + Math.pow(index, 3)) * Math.pow(Math.max(1, serverVars['A_empoExpon']), index) * Math.pow(3.07, Math.max(0, index - 28)),
      cost: (300 + 500 * index + Math.pow(index, 3)) * Math.pow(2.52, index) * Math.pow(3.07, Math.max(0, index - 28)) * Math.pow(160, Math.max(0, index - 38)),
      bonus
    };
  });

  const pristineCharms = rawPristineCharms.map((charm, index) => ({
    ...charm,
    unlocked: rawSneaking?.[107]?.[index],
    value: charm?.bonus.includes('}') ? (1 + charm?.x3 / 100) : charm?.x3,
    baseValue: charm?.x3
  }));

  const ninjaMasteryBonuses = randomList?.[101]?.map((mastery: any, index: any) => {
    const [description, bonus] = mastery.split('{');
    return { index, description, bonus };
  });

  const itemsMaxLevel = getItemsMaxLevel(upgrades, gemStones, inventory, account);

  const charmRollCounter = account?.accountOptions?.[402] || 0;
  const remainingPristineRolls = Math.max(0, 120 - charmRollCounter);
  const remainingSymbolRolls = Math.max(0, 75 - charmRollCounter);
  const pristineCharmChance = 0.001 * Math.max(0, 1.5 - charmRollCounter / 80)
    * (1 + getCompassBonus(account, 54) / 100);

  return {
    totalNinjaUpgradeLevels,
    sneakingExpThing,
    jadeEmporium,
    jadeCoins,
    upgrades,
    characterEquipments,
    inventory,
    players,
    pristineCharms,
    dropList,
    doorsCurrentHp,
    beanstalkData,
    totalJadeEmporiumUnlocked,
    unlockedFloors,
    gemStones,
    lastLooted,
    ninjaMasteryBonuses,
    ninjaMastery,
    itemsMaxLevel,
    dailyCharmRollCount: charmRollCounter,
    remainingPristineRolls,
    remainingSymbolRolls,
    pristineCharmChance
  };
};

export const getLocalNinjaUpgradeBonus = (upgrades: any, index: any, gemstones: any, inventory: any, account: any) => {
  const { level: rawLevel, modifier } = upgrades?.[index] ?? {};
  const level = rawLevel ?? 0;
  const masteryLootLevel = upgrades?.[3]?.level || 0;
  const selectedMasteryLevel = account?.accountOptions?.[231] || 0;

  if (index === 11) {
    const goldStar = getInventoryNinjaItem({ sneaking: { inventory } }, 'Gold_Star') || 0;
    const fireFrostBonus = gemstones?.[7]?.bonus || 0;
    const paletteBonus30 = getPaletteBonus(account, 30) || 0;
    const vaultBonus88 = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 88) || 0;
    // 100 * Dreamstuff("CloudBonus", 53) - equinox challenge "Get a LV. 7 slot in Sneaking, using Symbols"
    const cloudBonus53 = 100 * getCloudBonus(account?.equinox?.challenges, 53);
    return Math.round(
      level * modifier
      + masteryLootLevel * selectedMasteryLevel
      + goldStar
      + Math.ceil(fireFrostBonus)
      + Math.floor(paletteBonus30 + vaultBonus88 + cloudBonus53)
    );
  }
  if (index === 6 || index === 7 || index === 10 || index === 12) {
    return level * modifier + masteryLootLevel * selectedMasteryLevel;
  }
  return level * modifier;
};

const getItemsMaxLevel = (upgrades: any, gemstones: any, inventory: any, account: any) => {
  return [
    { name: 'Gemstone', value: Math.floor(getLocalNinjaUpgradeBonus(upgrades, 6, gemstones, inventory, account)) },
    { name: 'Kunai', value: Math.floor(getLocalNinjaUpgradeBonus(upgrades, 7, gemstones, inventory, account)) },
    { name: 'Gloves', value: Math.floor(getLocalNinjaUpgradeBonus(upgrades, 10, gemstones, inventory, account)) },
    { name: 'Charm', value: Math.floor(getLocalNinjaUpgradeBonus(upgrades, 11, gemstones, inventory, account)) },
    { name: 'Nunchaku', value: Math.floor(getLocalNinjaUpgradeBonus(upgrades, 12, gemstones, inventory, account)) }
  ];
};

const getGemstoneBonus = (gemstone: any, index: any, fifthGemstoneBonus: any, characters: any) => {
  const talentBonus = getHighestTalentAcrossCharacters(characters, 'GENERATIONAL_GEMSTONES', getBestActiveCharacter(characters)) ?? 0;

  return index === 5
    ? gemstone?.x3 + gemstone?.x5 * (gemstone?.baseValue / (1e3 + gemstone?.baseValue))
    : (gemstone?.x3 + gemstone?.x5 * (gemstone?.baseValue / (1e3 + gemstone?.baseValue)))
    * (1 + fifthGemstoneBonus / 100)
    * Math.max(1, talentBonus);
};

const parseNinjaItems = (array: any, doChunks: any, gemstones: any, account: any, baseItemId: number) => {
  const gemstoneBonus = gemstones?.[3]?.bonus || 0;

  let result = array?.map(([itemName, level]: any, index: any) => {
    const itemId = baseItemId + index;
    // Symbol upgrades apply to inventory items (raw 60+) and to character equipment item slots
    // (raw 14+4t and 15+4t - i.e. the last two of each 4-slot character chunk; hat and weapon don't have symbols).
    const isInventoryItem = itemId >= 60;
    const isCharSymbolSlot = !isInventoryItem && itemId >= 14 && (itemId - 14) % 4 < 2;
    const hasSymbol = isInventoryItem || isCharSymbolSlot;
    const symbolLVID = hasSymbol ? itemIdToSymbolLevelId(itemId) : -1;
    return {
      ...((ninjaEquipment as Record<string, any>)[itemName] ?? pristineCharmItems[itemName]),
      level,
      symbolBonus: hasSymbol ? getSymbolBonus(account, symbolLVID) : 0,
      symbolLevel: hasSymbol ? (account?.spelunking?.sneakingSlots?.[symbolLVID] ?? 0) : 0
    };
  });

  if (doChunks) {
    return result?.toChunks(4)?.map((array: any) => array.map((item: any) => {
      // rawValue too, so these items answer getInventoryNinjaItem's comparison like inventory ones
      const rawValue = getItemValue(item);
      return { ...item, rawValue, value: rawValue };
    }));
  }

  return result?.map((item: any) => {
    const legendTalentBonus = getLegendTalentBonus(account, 6) || 0;
    const symbolBonus = item?.symbolBonus || 0;
    const rawValue = getItemValue(item);

    return {
      ...item,
      rawValue,
      value: rawValue * (item?.name?.startsWith('Gold_')
        ? (1 + gemstoneBonus / 100) * (1 + legendTalentBonus / 100) * (1 + symbolBonus / 100)
        : 1)
    }
  });
};

const getSymbolBonus = (account: any, index: any) => {
  const slotLevel = account?.spelunking?.sneakingSlots?.[index] ?? 0;
  return 999 == index ?
    50 * (slotLevel + 1)
    : 50 * slotLevel;
}

const itemIdToSymbolLevelId = (itemId: any) => {
  return 60 > itemId ? Math.round(itemId - 14) - 2 * Math.floor((itemId - 14) / 4) : Math.round(itemId - 36);
}

const getItemValue = ({ type, subType, level, x3, x5 }: any) => {
  if (type === 1) {
    if (subType === 0) {
      return 10 * x3 * ((level + 10) / (level + 40));
    }
    if (level < 111) {
      return x3
        * Math.pow(1.23, level)
        * Math.pow(0.92, Math.max(0, level - 80))
        * Math.pow(0.94, Math.max(0, level - 110));
    }
    // Past 110 the game folds the three terms into a single factor (1.23 * 0.92 * 0.94). Same
    // curve, but 1.23^level no longer overflows to Infinity on a high level weapon.
    return x3 * Math.pow(1.23, 110) * Math.pow(0.92, 30) * Math.pow(1.063704, level - 110);
  }

  if (type === 2) {
    const firstPart = Math.min(x3 + x5 * (level / (level + 50)), x5);
    const secondPart = Math.min(x5 * (level / (level + 900)), x5);
    return firstPart + secondPart;
  }

  return 0;
};

// Deliberately compares the raw stat against the stored MULTIPLIED value - the game does
// `if (ItemStat(slot) > NJbonusPerms[subType]) NJbonusPerms[subType] = ItemStat(slot) * gem * legend * symbol`,
// so the two sides of that test are on different scales. It is a game quirk, not a typo: symbol
// bonuses are per-item, so which duplicate wins can differ from plain max-by-value. Match it.
export const getInventoryNinjaItem = (account: any, equipName: any) => {
  return (account?.sneaking?.inventory ?? []).reduce((best: number, item: any) => {
    if (item?.name !== equipName) return best;
    return (item?.rawValue ?? 0) > best ? (item?.value ?? 0) : best;
  }, 0);
};

export const getNinjaEquipmentBonus = (account: any, playerIndex: any, equipName: any) => {
  return account?.sneaking?.players?.[playerIndex]?.equipment?.reduce((sum: any, item: any) => {
    return sum + (item?.name === equipName ? item?.value : 0);
  }, 0);
};

export const getNinjaUpgradeBonus = (account: any, bonusName: any) => {
  return account?.sneaking?.upgrades?.find(({ name }: any) => name === bonusName)?.value;
};

export const isJadeBonusUnlocked = (account: any, bonusName: any) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }: any) => name === bonusName)?.unlocked;
};

export const getJadeEmporiumBonus = (account: any, bonusName: any) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }: any) => name === bonusName)?.bonus;
};

export const getCharmBonus = (account: any, bonusName: any) => {
  return account?.sneaking?.pristineCharms?.find(({ name, unlocked }: any) => name === bonusName && unlocked)?.baseValue ?? 0;
};

// NinjaInfo[9]. From Mastery 1 the game rescales every floor by base[11]^mastery and pins floor 0.
export const getFloorDifficulty = (floor: number, mastery: number) => {
  const base = ninjaExtraInfo?.[9] ?? [];
  if (!mastery || floor === 0) return Number(base?.[floor] ?? 0);
  return 0.1 * Number(base?.[floor]) * Math.pow(Number(base?.[11]), mastery);
};

export const getDetectionChance = (stealth: number, difficulty: number) => {
  return Math.max(0, Math.min(1, 1 - 1.1 * stealth / (stealth + difficulty)));
};

// Inverse of getDetectionChance: the stealth at which detection drops to `target` (0..1).
export const getStealthForDetection = (target: number, difficulty: number) => {
  return (1 - target) * difficulty / (0.1 + target);
};

// Game: NinjaBonus(t, subType) - the two charm slots (raw 14+4t, 15+4t), boosted by Gold_Scroll and the slot symbol.
const getNinjaCharmBonus = (account: any, playerIndex: number, subType: number) => {
  const goldScroll = getInventoryNinjaItem(account, 'Gold_Scroll');
  const charms = account?.sneaking?.players?.[playerIndex]?.equipment?.slice(2, 4) ?? [];
  return charms.reduce((sum: number, item: any) => item?.subType === subType && item?.name
    ? sum + (item?.rawValue ?? 0) * (1 + goldScroll / 100) * (1 + (item?.symbolBonus ?? 0) / 100)
    : sum, 0);
};

// Game: Ninja("Stealth", t). Split so the UI can re-run it for any floor / flower count / floor-mates:
// stealth = baseStealth * (1 + sum(floorMates' floorMateBonus) / 100) * (1 + flowers * flowerBonus / 100).
// The game reads farming level, star sign and statue talent from the logged-in character, approximated
// by the most recently played one.
const getNinjaStealthParts = (account: any, characters: any[], playerIndex: number, activeCharacter: any) => {
  const character = characters?.[playerIndex];
  const sneakingLevel = character?.skillsInfo?.sneaking?.level ?? 0;
  const upgrades = account?.sneaking?.upgrades;
  const wayOfStealth = upgrades?.[13]?.value ?? 0;
  const shhhh = upgrades?.[23]?.value ?? 0;

  const fractalStealth = getIsland(account, 'Fractal')?.shop
    ?.find(({ effect, unlocked }: any) => effect?.includes('Stealth') && unlocked) ? 1 : 0;
  const tomePoints = account?.tome?.totalPoints ?? 0;
  const tomeBubble = getBubbleBonus(account, 'STEALTH_CHAPTER', false) * Math.floor(Math.max(0, (tomePoints - 5e3) / 2e3));
  const farmingLevel = activeCharacter?.skillsInfo?.farming?.level ?? 0;
  const landRank = getLandRank(account?.farming?.ranks, 4, characters, activeCharacter) ?? 0;
  const holesObject = account?.hole?.holesObject;

  const multi = (1 + landRank * farmingLevel / 100)
    * (1 + getNinjaCharmBonus(account, playerIndex, 7) / 100)
    * (1 + getCompassBonus(account, 45) / 100)
    * (1 + getGambitBonus(account, 11) / 100)
    * (1 + getNinjaCharmBonus(account, playerIndex, 4) / 100)
    * (1 + getNinjaCharmBonus(account, playerIndex, 17) / 100)
    * (1 + getInventoryNinjaItem(account, 'Gold_Beads') / 100)
    * (1 + (tomeBubble + getStarSignBonus(activeCharacter, account, 'Ninja_Twin')) / 100)
    * (1 + getStatueBonus(account, 26, activeCharacter?.flatTalents) / 100)
    * (1 + 4 * getCardLevel(account?.cards, 'Crystal5') / 100)
    * (1 + 5 * getAchievementStatus(account?.achievements, 368) / 100)
    * (1 + (account?.sneaking?.gemStones?.[0]?.bonus ?? 0) / 100)
    * (1 + getVoteBonus(account, 25) / 100)
    * (1 + getLampBonus({ holesObject, t: 2, i: 1, account }) / 100)
    * Math.max(1, getSchematicBonus({ holesObject, t: 54, i: 0 }) ?? 0);

  const baseStealth = (10 + wayOfStealth * sneakingLevel)
    * multi
    * (1 + 2 * fractalStealth * sneakingLevel / 100)
    * (1 + getEmperorBonus(account, 0) / 100)
    * (1 + getSushiBonus(account, 32) / 100)
    * (1 + getJellyBonus(account, 16) / 100)
    * (1 + shhhh / 100)
    * (1 + 39 * (isCompanionBonusActive(account, 163) ? 1 : 0));

  return {
    baseStealth,
    // Smoke_Bomb + Lotus_Flower: given to every OTHER ninja on the same floor
    floorMateBonus: getNinjaCharmBonus(account, playerIndex, 8) + getNinjaCharmBonus(account, playerIndex, 16)
  };
};

export const getNinjaStealth = (ninja: any, flowers: number, flowerBonus: number, floorMates: any[]) => {
  const mateMulti = 1 + floorMates.reduce((sum, mate) => sum + (mate?.floorMateBonus ?? 0), 0) / 100;
  return ninja?.baseStealth * mateMulti * (1 + flowers * flowerBonus / 100);
};

// Funeral Flower stacks needed for `ninja` to reach `target` detection; 0 if already there, Infinity if unreachable.
export const getFlowersForDetection = (ninja: any, target: number, difficulty: number, flowerBonus: number, floorMates: any[]) => {
  const required = getStealthForDetection(target, difficulty);
  const withoutFlowers = getNinjaStealth(ninja, 0, flowerBonus, floorMates);
  if (withoutFlowers >= required) return 0;
  if (!flowerBonus) return Infinity;
  return Math.ceil((required / withoutFlowers - 1) * 100 / flowerBonus);
};

export const getSneakingDetection = (idleonData: any, account: any, characters: any[]) => {
  const flowerStacks: number[] = (tryToParse(idleonData?.Spelunk) || idleonData?.Spelunk)?.[15]
    ?? new Array(12).fill(0);
  const mastery = account?.accountOptions?.[231] ?? 0;
  const flowerBonus = account?.sneaking?.upgrades?.[21]?.value ?? 0;
  const activeCharacter = getBestActiveCharacter(characters);
  const ninjas = (characters ?? []).map((character: any, playerIndex: number) => ({
    playerIndex,
    name: character?.name,
    floor: account?.sneaking?.players?.[playerIndex]?.floor ?? 0,
    ...getNinjaStealthParts(account, characters, playerIndex, activeCharacter)
  })).map((ninja: any, _: number, all: any[]) => {
    const floorMates = all.filter((mate) => mate.playerIndex !== ninja.playerIndex && mate.floor === ninja.floor);
    const stealth = getNinjaStealth(ninja, flowerStacks?.[ninja.floor] ?? 0, flowerBonus, floorMates);
    return {
      ...ninja,
      stealth,
      detection: getDetectionChance(stealth, getFloorDifficulty(ninja.floor, mastery))
    };
  });

  return { ninjas, flowerStacks, flowerBonus, mastery };
};

export const calcTotalBeanstalkLevel = (beanstalk = []) => {
  return beanstalk?.reduce((res, level) => res + level, 0);
};
