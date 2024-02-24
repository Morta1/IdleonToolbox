import { number2letter, tryToParse } from "@utility/helpers";
import {
  jadeUpgrades,
  ninjaEquipment,
  ninjaExtraInfo,
  ninjaUpgrades,
  pristineCharms as rawPristineCharms
} from '../../data/website-data';

export const getSneaking = (idleonData: any, serverVars: any, serializedCharactersData: any) => {
  const rawSneaking = tryToParse(idleonData?.Ninja);
  return parseSneaking(rawSneaking, serverVars, serializedCharactersData)
}

const parseSneaking = (rawSneaking: any, serverVars: any, serializedCharactersData: any) => {
  const jadeEmporiumUnlocks = rawSneaking?.[102]?.[9];
  const jadeCoins = rawSneaking?.[102]?.[1];
  const ninjaUpgradeLevels = rawSneaking?.[103];
  console.log('rawSneaking.slice(0, serializedCharactersData?.length)', rawSneaking.slice(0, serializedCharactersData?.length));
  const playersInfo = rawSneaking.slice(0, serializedCharactersData?.length)?.map(([floor, activityInfo]: [number, number]) => ({ floor, activityInfo }));
  const dropList: any = ninjaExtraInfo.slice(13, 21).map((string: any) => string.split(' ').toChunks(2))
    ?.map((array) => array?.map(([itemName, dropChance]: [string, string]): any => ({
      ...ninjaEquipment[itemName as keyof typeof ninjaEquipment],
      dropChance
    })));
  const upgrades = ninjaUpgrades?.map((upgrade, index) =>
    ({ ...upgrade, level: ninjaUpgradeLevels?.[index] }));
  const order = (ninjaExtraInfo[24] as string).split(" ");
  const characterEquipments = parseNinjaItems(rawSneaking?.slice(12, 12 + (serializedCharactersData?.length * 4)), true);
  const players = serializedCharactersData.map((_: any, index: number) => ({
    equipment: characterEquipments?.[index],
    ...playersInfo[index]
  }));
  const inventory = parseNinjaItems(rawSneaking?.slice(60, 99), false);
  const orderedEmporium = jadeUpgrades.map((upgrade, index) => ({
    ...upgrade,
    index: order?.indexOf(index + ''),
    unlocked: jadeEmporiumUnlocks?.indexOf(number2letter?.[index]) !== -1
  }))
  orderedEmporium.sort((a, b) => a.index - b.index);
  const jadeEmporium = orderedEmporium.map((upgrade, index) => {
    return {
      ...upgrade,
      cost: (300 + 500 * index + Math.pow(index, 3)) * Math.pow(serverVars['A_empoExpon'], index)
    }
  }).slice(0, 28);
  const pristineCharms = rawPristineCharms.map((charm, index) =>
    ({
      ...charm,
      unlocked: rawSneaking?.[107]?.[index],
      value: charm?.bonus.includes('}') ? (1 + charm?.x3 / 100) : charm?.x3
    }))
  return {
    jadeEmporium,
    jadeCoins,
    upgrades,
    characterEquipments,
    inventory,
    players,
    pristineCharms,
    dropList
  };
}

const parseNinjaItems = (array: any, doChunks: boolean) => {
  let result = array?.map(([itemName, level]: [string, string]): any => ({
    ...ninjaEquipment[itemName as keyof typeof ninjaEquipment],
    level,
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

export const isJadeBonusUnlocked = (account: any, bonusName: string) => {
  return account?.sneaking?.jadeEmporium?.find(({ name }: { name: string }) => name === bonusName)?.unlocked;
}
export const getCharmBonus = (account: any, bonusName: string) => {
  return account?.sneaking?.pristineCharms?.find(({ name }: { name: string }) => name === bonusName)?.value ?? 1;
}