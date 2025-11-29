import { notateNumber, number2letter, tryToParse } from "@utility/helpers";
import {
  jadeUpgrades,
  ninjaEquipment,
  ninjaExtraInfo,
  ninjaUpgrades,
  pristineCharms as rawPristineCharms,
  randomList
} from '../../data/website-data';
import { getLabBonus } from "@parsers/lab";
import { CLASSES, getHighestTalentByClass } from "@parsers/talents";
import { getLegendTalentBonus } from "@parsers/world-7/legendTalents";

export const getSneaking = (idleonData, serverVars, charactersData, account) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  const rawSpelunking = tryToParse(idleonData?.Spelunk);
  return parseSneaking(rawSneaking, rawSpelunking, serverVars, charactersData, account);
};

const doorMaxHps = (ninjaExtraInfo?.[3]).split(' ');

const parseSneaking = (rawSneaking, rawSpelunking, serverVars, charactersData, account) => {
  const gemStonesUnlocked = rawSneaking?.[106]?.filter(name => name.includes('NjGem'));

  let gemStones = Object.entries(ninjaEquipment)
    .reduce((result, [key, data]) => key.includes('NjGem') ? [...result, data] : result, [])
    .map((data, index) => {
      const unlocked = gemStonesUnlocked?.[index];
      const baseValue = account?.accountOptions?.[233 + index] ?? 0;
      const bonus = baseValue < .5 ? 0 : getGemstoneBonus({ ...data, baseValue }, index, 0, charactersData);
      const description = typeof randomList?.[102] === 'string' ? randomList?.[102]?.split(' ')[index] : undefined;

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
    let notatedBonus, description = data.description ?? '';

    if (data.description.includes('}')) {
      notatedBonus = notateNumber(bonus, 'Big');
      description = description.replace('}', notatedBonus);
    }

    if (data.description.includes('$')) {
      notatedBonus = notateNumber(100 * (1 - 1 / (1 + bonus / 100)), 'Big');
      description = description.replace('$', notatedBonus);
    }

    return {
      ...data,
      bonus,
      notatedBonus,
      description: description.replace('{', '+').replace(/@/g, '')
    };
  });

  const sneakingExpThing = rawSneaking?.[102]?.[0];
  const jadeEmporiumUnlocks = rawSneaking?.[102]?.[9];
  const jadeCoins = rawSneaking?.[102]?.[1];
  const lastLooted = rawSneaking?.[102]?.[2];
  const ninjaUpgradeLevels = rawSneaking?.[103];
  const totalNinjaUpgradeLevels = ninjaUpgradeLevels?.reduce((sum, level) => sum + level, 0);
  const beanstalkData = rawSneaking?.[104];
  const doorsCurrentHp = rawSneaking?.[100];

  const currentUnlockedFloors = doorMaxHps.reduce((sum, doorHp, index) => {
    const updatedDoorHp = (account?.accountOptions?.[231] < account?.accountOptions?.[232]
      ? 0
      : parseFloat(doorHp));
    return sum + ((updatedDoorHp - doorsCurrentHp?.[index] <= 0) ? 1 : 0);
  }, 1);

  const selectedNinjaMastery = account.accountOptions?.[231];
  const ninjaMastery = account.accountOptions?.[232];

  const unlockedFloors = ninjaMastery > 0 ? 12 * ninjaMastery : Math.min(12, currentUnlockedFloors);

  const playersInfo = rawSneaking?.slice(0, charactersData?.length)?.map(([floor, activityInfo]) => ({
    floor,
    activityInfo
  }));

  const dropList = ninjaExtraInfo.slice(13, 23).map(string => string.split(' ').toChunks(2))
    ?.map(array => array?.map(([itemName, dropChance]) => ({
      ...ninjaEquipment[itemName],
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
      value: level * (upgrade.modifier ?? 1),
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

  const order = (ninjaExtraInfo[24]).split(" ");
  const inventory = parseNinjaItems(rawSneaking?.slice(60, 99), false, gemStones, account);
  const characterEquipments = parseNinjaItems(rawSneaking?.slice(12, 12 + (charactersData?.length * 4)), true, gemStones?.[3]?.bonus, account);

  const players = charactersData.map((_, index) => ({
    equipment: characterEquipments?.[index]?.map(equip => ({
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

  const ninjaMasteryBonuses = (randomList?.[101]).split(' ').map((mastery, index) => {
    const [description, bonus] = mastery.split('{');
    return { index, description, bonus };
  });

  const itemsMaxLevel = getItemsMaxLevel(selectedNinjaMastery, ninjaMastery, upgrades, gemStones, inventory);

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
    dailyCharmRollCount: account?.accountOptions?.[402]
  };
};

export const getLocalNinjaUpgradeBonus = (upgrades, index, gemstones, inventory, account) => {
  const { level, modifier } = upgrades?.[index];
  const goldEye = getInventoryNinjaItem({ sneaking: { inventory } }, 'Gold_Eye');
  const fireFrostBonus = gemstones?.[7]?.bonus;

  return index === 11
    ? level * modifier + (upgrades?.[3]?.level * account?.accountOptions?.[231] + (goldEye + Math.ceil(fireFrostBonus)))
    : index === 6 || index === 7 || index === 10 || index === 12
      ? level * modifier + upgrades?.[3]?.level * account?.accountOptions?.[231]
      : level * modifier;
};

const getItemsMaxLevel = (selectedMasteryLevel, masteryLevel, upgrades, gemstones, inventory) => {
  const goldStarBonus = getInventoryNinjaItem({ sneaking: { inventory } }, 'Gold_Star') || 0;

  const masteryBonus = (upgrades?.[2]?.value || 0) * selectedMasteryLevel;
  const baseLevel = masteryBonus;
  const fireFrostBonus = gemstones?.[7]?.bonus;

  const getUpgradeValue = index => upgrades?.[index]?.value || 0;

  return [
    { name: 'Gemstone', value: Math.floor(baseLevel + getUpgradeValue(5)) },
    { name: 'Kunai', value: Math.floor(baseLevel + getUpgradeValue(6)) },
    { name: 'Gloves', value: Math.floor(baseLevel + getUpgradeValue(9)) },
    { name: 'Charm', value: Math.floor(baseLevel + getUpgradeValue(10) + goldStarBonus + fireFrostBonus) },
    { name: 'Nunchaku', value: Math.floor(baseLevel + getUpgradeValue(11)) }
  ];
};

const getGemstoneBonus = (gemstone, index, fifthGemstoneBonus, characters) => {
  const talentBonus = getHighestTalentByClass(characters, CLASSES.Wind_Walker, 'GENERATIONAL_GEMSTONES') ?? 0;

  return index === 5
    ? gemstone?.x3 + gemstone?.x5 * (gemstone?.baseValue / (1e3 + gemstone?.baseValue))
    : (gemstone?.x3 + gemstone?.x5 * (gemstone?.baseValue / (1e3 + gemstone?.baseValue)))
    * (1 + fifthGemstoneBonus / 100)
    * Math.max(1, talentBonus);
};

const parseNinjaItems = (array, doChunks, gemstones, account) => {
  const gemstoneBonus = gemstones?.[3]?.bonus || 0;

  let result = array?.map(([itemName, level], index) => ({
    ...ninjaEquipment[itemName],
    level,
    symbolBonus: getSymbolBonus(account, itemIdToSymbolLevelId(60 + index)),
    symbolLevel: account?.spelunking?.sneakingSlots?.[24 + index]
  }));

  if (doChunks) {
    return result?.toChunks(4)?.map(array => array.map(item => ({ ...item, value: getItemValue(item) })));
  }

  return result?.map(item => {
    const legendTalentBonus = getLegendTalentBonus(account, 6);
    const symbolBonus = item?.symbolBonus || 0;

    return {
      ...item,
      value: getItemValue(item) * (item?.name?.startsWith('Gold_') ? 1 + gemstoneBonus / 100
        * (1 + symbolBonus / 100) * (1 + legendTalentBonus / 100) : 1)
    }
  });
};

const getSymbolBonus = (account, index) => {
  return 999 == index ?
    50 * (account?.spelunking?.sneakingSlots?.[index] + 1)
    : 50 * account?.spelunking?.sneakingSlots?.[index];
}

const itemIdToSymbolLevelId = (itemId) => {
  return 60 > itemId ? Math.round(itemId - 14) - 2 * Math.floor((itemId - 14) / 4) : Math.round(itemId - 36);
}

const getItemValue = ({ type, subType, level, x3, x5 }) => {
  if (type === 1) {
    if (subType === 0) {
      return 10 * x3 * ((level + 10) / (level + 40));
    } else {
      return x3
        * Math.pow(1.23, level)
        * Math.pow(0.92, Math.max(0, level - 80))
        * Math.pow(0.94, Math.max(0, level - 110));
    }
  }

  if (type === 2) {
    const firstPart = Math.min(x3 + x5 * (level / (level + 50)), x5);
    const secondPart = Math.min(x5 * (level / (level + 900)), x5);
    return firstPart + secondPart;
  }

  return 0;
};

export const getInventoryNinjaItem = (account, equipName) => {
  return account?.sneaking?.inventory?.find(({ name }) => name === equipName)?.value;
};

export const getNinjaEquipmentBonus = (account, playerIndex, equipName) => {
  return account?.sneaking?.players?.[playerIndex]?.equipment?.reduce((sum, item) => {
    return sum + (item?.name === equipName ? item?.value : 0);
  }, 0);
};

export const getNinjaUpgradeBonus = (account, bonusName) => {
  return account?.sneaking?.upgrades?.find(({ name }) => name === bonusName)?.value;
};

export const isJadeBonusUnlocked = (account, bonusName) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }) => name === bonusName)?.unlocked;
};

export const getJadeEmporiumBonus = (account, bonusName) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }) => name === bonusName)?.bonus;
};

export const getCharmBonus = (account, bonusName) => {
  return account?.sneaking?.pristineCharms?.find(({ name, unlocked }) => name === bonusName && unlocked)?.baseValue ?? 0;
};

export const calcTotalBeanstalkLevel = (beanstalk = []) => {
  return beanstalk?.reduce((res, level) => res + level, 0);
};
