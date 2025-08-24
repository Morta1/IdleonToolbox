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

export const getSneaking = (idleonData: any, serverVars: any, charactersData: any, account: any) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  return parseSneaking(rawSneaking, serverVars, charactersData, account)
}

const doorMaxHps = (ninjaExtraInfo?.[3] as string).split(' ');

const parseSneaking = (rawSneaking: any, serverVars: any, charactersData: any, account: any) => {
  const gemStonesUnlocked = rawSneaking?.[106]?.filter((name: string) => name.includes('NjGem'));
  let gemStones = Object.entries(ninjaEquipment)
    .reduce((result: any, [key, data]) => key.includes('NjGem') ? [...result, data] : [], [])
    .map((data: any, index: number) => {
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
      }
    })
  gemStones = gemStones.map((data: any, index: number) => {
    const bonus = data?.baseValue < .5 ? 0 : getGemstoneBonus(data, index, gemStones?.[5]?.bonus, charactersData);
    let notatedBonus, description = data.description ?? '';
    if (data.description.includes('}')) {
      notatedBonus = notateNumber(bonus, 'Big')
      description = description.replace('}', notatedBonus)
    }
    if (data.description.includes('$')) {
      notatedBonus = notateNumber(100 * (1 - 1 / (1 + bonus / 100)), 'Big')
      description = description.replace('$', notatedBonus)
    }
    return { ...data, bonus, notatedBonus, description: description.replace('{', '+').replace(/@/g, '') }
  });
  const sneakingExpThing = rawSneaking?.[102]?.[0];
  const jadeEmporiumUnlocks = rawSneaking?.[102]?.[9];
  const jadeCoins = rawSneaking?.[102]?.[1];
  const lastLooted = rawSneaking?.[102]?.[2];
  const ninjaUpgradeLevels = rawSneaking?.[103];
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
  const playersInfo = rawSneaking?.slice(0, charactersData?.length)?.map(([floor, activityInfo]: [number, number]) => ({
    floor,
    activityInfo
  }));
  const dropList: any = ninjaExtraInfo.slice(13, 23).map((string: any) => string.split(' ').toChunks(2))
    ?.map((array) => array?.map(([itemName, dropChance]: [string, string]): any => ({
      ...ninjaEquipment[itemName as keyof typeof ninjaEquipment],
      dropChance
    })));
  const upgrades = ninjaUpgrades?.map((upgrade, index) => ({
    ...upgrade,
    level: ninjaUpgradeLevels?.[index + 1],
    value: ninjaUpgradeLevels?.[index + 1] * (upgrade.modifier ?? 1)
  }));

  const order = (ninjaExtraInfo[24] as string).split(" ");
  const inventory = parseNinjaItems(rawSneaking?.slice(60, 99), false, gemStones);
  const characterEquipments = parseNinjaItems(rawSneaking?.slice(12, 12 + (charactersData?.length * 4)), true, gemStones?.[3]?.bonus);
  const players = charactersData.map((_: any, index: number) => ({
    equipment: characterEquipments?.[index]?.map((equip: any) => ({
      ...equip,
      value: equip?.value
    })),
    ...(playersInfo?.[index] || [])
  }));
  let totalJadeEmporiumUnlocked = 0
  const orderedEmporium = jadeUpgrades.map((upgrade, index) => {
    const unlocked = jadeEmporiumUnlocks ? jadeEmporiumUnlocks?.indexOf(number2letter?.[index]) !== -1 : false;
    if (unlocked) {
      totalJadeEmporiumUnlocked += 1;
    }
    return {
      ...upgrade,
      originalIndex: index,
      index: order?.indexOf(index + ''),
      unlocked
    };
  })
  orderedEmporium.sort((a, b) => a.index - b.index);
  const lootedItems = account?.looty?.rawLootedItems;
  const jadeEmporium = orderedEmporium.map((upgrade, index) => {
    let bonus;
    if (index === 8 || index === 6) {
      const slabSovereignty = getLabBonus(account?.lab?.labBonuses, 15);
      const multi = Math.floor(Math.max(0, lootedItems - 1000) / 10);
      bonus = (index === 6 ? 3 : 5) * multi * (1 + slabSovereignty / 100);
    }
    return {
      ...upgrade,
      cost: (300 + 500 * index + Math.pow(index, 3)) * Math.pow(Math.max(1, serverVars['A_empoExpon']), index) * Math.pow(3.07, Math.max(0, index - 28)),
      bonus
    }
  })
  const pristineCharms = rawPristineCharms.map((charm, index) =>
    ({
      ...charm,
      unlocked: rawSneaking?.[107]?.[index],
      value: charm?.bonus.includes('}') ? (1 + charm?.x3 / 100) : charm?.x3,
      baseValue: charm?.x3
    }));
  const ninjaMasteryBonuses = (randomList?.[101] as string).split(' ').map((mastery: any, index: any) => {
    const [description, bonus] = mastery.split('{');
    return { index, description, bonus }
  });
  const itemsMaxLevel = getItemsMaxLevel(selectedNinjaMastery, ninjaMastery, upgrades, gemStones, inventory);
  return {
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
    itemsMaxLevel
  };
}

export const getLocalNinjaUpgradeBonus = (upgrades: any, index: any, gemstones: any, inventory: any, account: any) => {
  const { level, modifier } = upgrades?.[index];
  const goldEye = getInventoryNinjaItem({ sneaking: { inventory } }, 'Gold_Eye');
  const fireFrostBonus = gemstones?.[7]?.bonus;
  return 11 === index ? level
    * modifier
    + (upgrades?.[3]?.level *
      account?.accountOptions?.[231]
      + (goldEye + Math.ceil(fireFrostBonus)))
    : 6 === index || 7 === index || 10 === index || 12 === index ? level
      * modifier +
      upgrades?.[3]?.level * account?.accountOptions?.[231]
      : level *
      modifier
}

const getItemsMaxLevel = (
  selectedMasteryLevel: number,
  masteryLevel: number,
  upgrades: any,
  gemstones: any,
  inventory: any
) => {
  const goldStarBonus = getInventoryNinjaItem({ sneaking: { inventory } }, 'Gold_Star') || 0;

  const masteryBonus = (upgrades?.[2]?.value || 0) * selectedMasteryLevel;
  const fourthMasteryBonus = masteryLevel >= 4 ? 30 : 0; // Not sure if this works
  const baseLevel = masteryBonus;
  const fireFrostBonus = gemstones?.[7]?.bonus;

  const getUpgradeValue = (index: number) => upgrades?.[index]?.value || 0;

  return [
    { name: 'Gemstone', value: Math.floor(baseLevel + getUpgradeValue(5)) },
    { name: 'Kunai', value: Math.floor(baseLevel + getUpgradeValue(6)) },
    { name: 'Gloves', value: Math.floor(baseLevel + getUpgradeValue(9)) },
    { name: 'Charm', value: Math.floor(baseLevel + getUpgradeValue(10) + goldStarBonus + fireFrostBonus) },
    { name: 'Nunchaku', value: Math.floor(baseLevel + getUpgradeValue(11)) }
  ];
};

const getGemstoneBonus: any = (gemstone: any, index: number, fifthGemstoneBonus: number, characters: any[]) => {
  // TODO: This is not 100% accurate because lava calculates AddedLevels from the current character (in-game)
  //  rather than the talent owner AddedLevels
  const talentBonus = getHighestTalentByClass(characters, CLASSES.Wind_Walker, 'GENERATIONAL_GEMSTONES') ?? 0;
  return 5 === index
    ? gemstone?.x3 + gemstone?.x5 * (gemstone?.baseValue / (1e3 + gemstone?.baseValue))
    : (gemstone?.x3 + gemstone?.x5 * (gemstone?.baseValue / (1e3 + gemstone?.baseValue)))
    * (1 + fifthGemstoneBonus / 100)
    * Math.max(1, talentBonus)
}
const parseNinjaItems = (array: any, doChunks: boolean, gemstones: any) => {
  const gemstoneBonus = gemstones?.[3]?.bonus || 0;
  let result = array?.map(([itemName, level]: [string, string]): any => ({
    ...ninjaEquipment[itemName as keyof typeof ninjaEquipment],
    level
  }))
  if (doChunks) {
    return result?.toChunks(4)?.map((array: any) => array.map((item: any) => ({ ...item, value: getItemValue(item) })));
  }
  return result?.map((item: any) => {
    return {
      ...item,
      value: getItemValue(item) * (item?.name?.startsWith('Gold_') ? 1 + gemstoneBonus / 100 : 1)
    }
  });
}
const getItemValue = ({ type, subType, level, x3, x5 }: {
  type: number,
  subType: number,
  level: number,
  x3: number,
  x5: number
}) => {
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

export const getInventoryNinjaItem = (account: any, equipName: string) => {
  return account?.sneaking?.inventory?.find(({ name }: { name: string }) => name === equipName)?.value;
}
export const getNinjaEquipmentBonus = (account: any, playerIndex: number, equipName: string) => {
  return account?.sneaking?.players?.[playerIndex]?.equipment?.reduce((sum: number, item: any) => {
    return sum + (item?.name === equipName ? item?.value : 0);
  }, 0);
}

export const getNinjaUpgradeBonus = (account: any, bonusName: string) => {
  return account?.sneaking?.upgrades?.find(({ name }: { name: string }) => name === bonusName)?.value;
}
export const isJadeBonusUnlocked = (account: any, bonusName: string) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }: { name: string }) => name === bonusName)?.unlocked;
}
export const getJadeEmporiumBonus = (account: any, bonusName: string) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }: { name: string }) => name === bonusName)?.bonus;
}
export const getCharmBonus = (account: any, bonusName: string) => {
  return account?.sneaking?.pristineCharms?.find(({ name, unlocked }: {
    name: string,
    unlocked: boolean
  }) => name === bonusName && unlocked)?.baseValue ?? 0;
}


export const calcTotalBeanstalkLevel = (beanstalk: []) => {
  return beanstalk?.reduce((res, level) => res + level, 0)
}