import { number2letter, tryToParse } from "@utility/helpers";
import {
  jadeUpgrades,
  ninjaEquipment,
  ninjaExtraInfo,
  ninjaUpgrades,
  pristineCharms as rawPristineCharms
} from '../../data/website-data';

export const getSneaking = (idleonData: any, serverVars: any, serializedCharactersData: any, account: any) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  return parseSneaking(rawSneaking, serverVars, serializedCharactersData, account)
}

const parseSneaking = (rawSneaking: any, serverVars: any, serializedCharactersData: any, account: any) => {
  const jadeEmporiumUnlocks = rawSneaking?.[102]?.[9];
  const jadeCoins = rawSneaking?.[102]?.[1];
  const ninjaUpgradeLevels = rawSneaking?.[103];
  const beanstalkData = rawSneaking?.[104];
  const doorsCurrentHp = rawSneaking?.[100];
  const playersInfo = rawSneaking?.slice(0, serializedCharactersData?.length)?.map(([floor, activityInfo]: [number, number]) => ({
    floor,
    activityInfo
  }));
  const dropList: any = ninjaExtraInfo.slice(13, 21).map((string: any) => string.split(' ').toChunks(2))
    ?.map((array) => array?.map(([itemName, dropChance]: [string, string]): any => ({
      ...ninjaEquipment[itemName as keyof typeof ninjaEquipment],
      dropChance
    })));
  const upgrades = ninjaUpgrades?.map((upgrade, index) =>
    ({ ...upgrade, level: ninjaUpgradeLevels?.[index], value: ninjaUpgradeLevels?.[index] * (upgrade.modifier ?? 1) }));
  const order = (ninjaExtraInfo[24] as string).split(" ");
  const inventory = parseNinjaItems(rawSneaking?.slice(60, 99), false);
  const goldScroll = getInventoryNinjaItem({ sneaking: { inventory } }, 'Gold_Scroll');
  const characterEquipments = parseNinjaItems(rawSneaking?.slice(12, 12 + (serializedCharactersData?.length * 4)), true);
  const players = serializedCharactersData.map((_: any, index: number) => ({
    equipment: characterEquipments?.[index]?.map((equip: any) => ({
      ...equip,
      value: equip?.value * (1 + goldScroll / 100)
    })),
    ...(playersInfo?.[index] || [])
  }));
  const orderedEmporium = jadeUpgrades.map((upgrade, index) => ({
    ...upgrade,
    originalIndex: index,
    index: order?.indexOf(index + ''),
    unlocked: jadeEmporiumUnlocks?.indexOf(number2letter?.[index]) !== -1
  }))
  orderedEmporium.sort((a, b) => a.index - b.index);
  const jadeEmporium = orderedEmporium.map((upgrade, index) => {
    let bonus;
    if (index === 8) {
      const lootedItems = account?.looty?.rawLootedItems;
      const multi = Math.floor(Math.max(0, lootedItems - 1000) / 10);
      bonus = 5 * multi;
    }
    return {
      ...upgrade,
      cost: (300 + 500 * index + Math.pow(index, 3)) * Math.pow(serverVars['A_empoExpon'], index),
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
  return {
    jadeEmporium,
    jadeCoins,
    upgrades,
    characterEquipments,
    inventory,
    players,
    pristineCharms,
    dropList,
    doorsCurrentHp,
    beanstalkData
  };
}
const parseNinjaItems = (array: any, doChunks: boolean) => {
  let result = array?.map(([itemName, level]: [string, string]): any => ({
    ...ninjaEquipment[itemName as keyof typeof ninjaEquipment],
    level
  }))
  if (doChunks) {
    return result?.toChunks(4)?.map((array: any) => array.map((item: any) => ({ ...item, value: getItemValue(item) })));
  }
  return result?.map((item: any) => ({ ...item, value: getItemValue(item) }));
}
const getItemValue = ({ type, level, x3, x4 }: { type: number, level: number, x3: number, x4: number }) => {
  return 1 == type
    ? x3 * Math.pow(1.23, level)
    : 2 == type
      ? Math.min(x3 + x4 * (level / (level + 50)), x4) : 0;
}

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
  return account?.sneaking?.pristineCharms?.find(({ name }: { name: string }) => name === bonusName)?.baseValue ?? 1;
}