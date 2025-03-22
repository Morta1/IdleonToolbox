import { createArrayOfArrays, tryToParse } from '../utility/helpers';
import { items, obols } from '../data/website-data';
import { addStoneDataToEquip } from './items';

const obolStats = ['STR', 'AGI', 'WIS', 'LUK', 'Weapon_Power', 'Defence', 'UQ1txt', 'UQ2txt'];

export const getObols = (idleonData, account = true) => {
  const obolsOrderRaw = tryToParse(idleonData?.ObolEqO1) || (account
    ? idleonData?.ObolEquippedOrder?.[1]
    : idleonData?.ObolEquippedOrder);
  const obolsEquippedRaw = tryToParse(idleonData?.ObolEqMAPz1) || (account
    ? idleonData?.ObolEquippedMap?.[1]
    : idleonData?.ObolEquippedMap);
  const obolsInvRaw = tryToParse(idleonData?.ObolInvOr);
  return parseObols(obolsOrderRaw, obolsEquippedRaw, obolsInvRaw, account);
}

export const parseObols = (obolsRaw, obolsEquippedRaw, obolsInvRaw, account) => {
  const obolsType = account ? obols.family : obols.character;
  const obolsMapping = obolsRaw?.map((obol, index) => ({
    displayName: items?.[obol]?.displayName,
    rawName: obol,
    ...(!account ? { index: calculateWeirdObolIndex(index) } : {}),
    ...(obolsType?.[index] ? obolsType[index] : {})
  }));
  const obolsList = createObolsWithUpgrades(obolsMapping, obolsEquippedRaw);
  obolsList.sort((a, b) => a.index - b.index);
  const stats = getStatsFromObols(obolsList, account);
  return {
    inventory: createArrayOfArrays(obolsInvRaw) || [],
    list: obolsList,
    stats
  };
}

export const createObolsWithUpgrades = (charItems, stoneData) => {
  return charItems.reduce((res, item, itemIndex) => {
    const { rawName } = item;
    if (rawName === 'Blank') return [...res, item];
    const stoneResult = addStoneDataToEquip(items?.[rawName], stoneData?.[itemIndex]);
    return rawName ? [...res, {
      ...(rawName === 'Blank' ? {} : { ...item, ...items?.[rawName], ...stoneResult })
    }] : res
  }, []);
}

const getStatsFromObols = (obols, account) => {
  const bonusText = account ? 'familyBonus' : 'personalBonus';
  return obols?.reduce((res, obol) => {
    Object.entries(obol).forEach(([statName, statValue]) => {
      const stat = obolStats.includes(statName);
      if (!stat) return;
      if (res[statName]?.[bonusText] || res[statValue]?.[bonusText]) {
        if (statName === 'UQ1txt' || statName === 'UQ2txt') {
          if (statValue === 0) return;
          const reg = statName.match(/\d/g)?.[0];
          res[statValue] = {
            [bonusText]: (res?.[statValue]?.[bonusText] ?? 0) + obol?.[`UQ${reg}val`] || 0
          }
        } else {
          res[statName] = { [bonusText]: (res?.[statName]?.[bonusText] ?? 0) + statValue }
        }
      } else {
        if (statName === 'UQ1txt' || statName === 'UQ2txt') {
          if (statValue === 0) return;
          const reg = statName.match(/\d/g)?.[0];
          res[statValue] = { [bonusText]: (res?.[statValue]?.[bonusText] ?? 0) + obol?.[`UQ${reg}val`] || 0 }
        } else {
          res[statName] = { [bonusText]: statValue }
        }
      }
    })
    return res;
  }, {});
}

export const mergeCharacterAndAccountObols = (charObols, accObols) => {
  const allKeys = new Set([...Object.keys(charObols.stats), ...Object.keys(accObols.stats)]);
  return Array.from(allKeys).reduce((res, key) => {
    const { personalBonus } = charObols.stats?.[key] ?? 0;
    const { familyBonus } = accObols.stats?.[key] ?? 0;
    res[key] = {
      personalBonus: personalBonus,
      familyBonus: familyBonus
    }
    return res;
  }, {});
}

const calculateWeirdObolIndex = (index) => {
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

export const getObolsBonus = (obols, bonus) => {
  const { personalBonus = 0, familyBonus = 0 } = obols?.stats?.[bonus] || {};
  return !personalBonus && !familyBonus ? 0 : (personalBonus ?? 0) + (familyBonus ?? 0);
}