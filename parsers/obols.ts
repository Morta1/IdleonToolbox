import { createArrayOfArrays, tryToParse } from '@utility/helpers';
import { items, obols } from '@website-data';
import { addStoneDataToEquip } from './items';
import type { IdleonData } from './types';
import { getPowerType } from './powerTypes';

// Re-exported so existing importers keep working. Modules needing ONLY this should import
// from './powerTypes' — obols.ts reaches items.ts and from there the parser graph.
export { getPowerType };

const obolStats: string[] = ['STR', 'AGI', 'WIS', 'LUK', 'Weapon_Power', 'Defence', 'UQ1txt', 'UQ2txt'];


export const getObols = (idleonData: IdleonData, account: boolean = true): Record<string, any> => {
  const obolsOrderRaw = tryToParse(idleonData?.ObolEqO1) || (account
    ? (idleonData as any)?.ObolEquippedOrder?.[1]
    : (idleonData as any)?.ObolEquippedOrder);
  const obolsEquippedRaw = tryToParse(idleonData?.ObolEqMAPz1) || (account
    ? (idleonData as any)?.ObolEquippedMap?.[1]
    : (idleonData as any)?.ObolEquippedMap);
  const obolsInvRaw = tryToParse(idleonData?.ObolInvOr);
  return parseObols(obolsOrderRaw, obolsEquippedRaw, obolsInvRaw, account);
}

export const parseObols = (obolsRaw: any, obolsEquippedRaw: any, obolsInvRaw: any, account: boolean): Record<string, any> => {
  const obolsType = account ? obols.family : obols.character;
  const obolsMapping = obolsRaw?.map((obol: any, index: number) => ({
    displayName: items?.[obol]?.displayName,
    rawName: obol,
    ...(!account ? { index: calculateWeirdObolIndex(index) } : {}),
    ...(obolsType?.[index] ? obolsType[index] : {})
  }));
  const obolsList = createObolsWithUpgrades(obolsMapping, obolsEquippedRaw);
  obolsList.sort((a: any, b: any) => a.index - b.index);
  const stats = getStatsFromObols(obolsList, account);
  return {
    inventory: createArrayOfArrays(obolsInvRaw) || [],
    list: obolsList,
    stats
  };
}

export const createObolsWithUpgrades = (charItems: any[] | undefined, stoneData: any): any[] => {
  return (charItems ?? []).reduce((res: any[], item: any, itemIndex: number) => {
    const { rawName } = item;
    if (rawName === 'Blank') return [...res, item];
    const stoneResult = addStoneDataToEquip(items?.[rawName], stoneData?.[itemIndex]);
    const rerolled = Object.values(stoneData?.[itemIndex] || {}).some((value: any) => !isNaN(value) && value > 0);
    return rawName ? [...res, {
      ...(rawName === 'Blank' ? {} : { ...item, ...items?.[rawName], ...stoneResult }),
      rerolled
    }] : res
  }, []);
}


const getStatsFromObols = (obols: any[], account: boolean): Record<string, any> => {
  const bonusText = account ? 'familyBonus' : 'personalBonus';
  return obols?.reduce((res: Record<string, any>, obol: any) => {
    Object.entries(obol).forEach(([statName, statValue]: [string, any]) => {
      if (!obolStats.includes(statName)) return;
      const uqSlot = statName === 'UQ1txt' ? 1 : statName === 'UQ2txt' ? 2 : null;
      if (uqSlot && statValue === 0) return;
      let realStatName = uqSlot ? statValue : statName;
      if (statName === 'Weapon_Power' && statValue > 0) {
        realStatName = getPowerType(obol?.UQ1txt || obol?.rawName).replace(/ /, '_');
      }
      const value = Number(uqSlot ? obol?.[`UQ${uqSlot}val`] : statValue) || 0;
      // The game sums an obol's stat only when it is positive, so a reroll that took a stat below
      // zero takes nothing away from the total.
      res[realStatName] = { [bonusText]: (res[realStatName]?.[bonusText] ?? 0) + Math.max(0, value) };
    })
    return res;
  }, {});
}

export const mergeCharacterAndAccountObols = (charObols: Record<string, any>, accObols: Record<string, any>): Record<string, any> => {
  const allKeys = new Set([...Object.keys(charObols.stats), ...Object.keys(accObols.stats)]);
  return Array.from(allKeys).reduce((res: Record<string, any>, key: string) => {
    const { personalBonus } = charObols.stats?.[key] ?? 0;
    const { familyBonus } = accObols.stats?.[key] ?? 0;
    res[key] = {
      personalBonus: personalBonus,
      familyBonus: familyBonus
    }
    return res;
  }, {});
}

const calculateWeirdObolIndex = (index: number): number => {
  switch (index) {
    case 12:
      return 13;
    case 13:
      return 14;
    case 14:
      return 12;
    case 17:
      return 15;
    case 15:
      return 17;
    case 16:
      return 19;
    case 18:
      return 16;
    case 19:
      return 18;
    default:
      return index;
  }
}

export const getObolsBonus = (obols: Record<string, any>, bonus: string): number => {
  const { personalBonus = 0, familyBonus = 0 } = obols?.stats?.[bonus] || {};
  return !personalBonus && !familyBonus ? 0 : (personalBonus ?? 0) + (familyBonus ?? 0);
}
