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
    const rerolled = Object.values(stoneData?.[itemIndex] || {}).some((value) => !isNaN(value) && value > 0);
    return rawName ? [...res, {
      ...(rawName === 'Blank' ? {} : { ...item, ...items?.[rawName], ...stoneResult }),
      rerolled
    }] : res
  }, []);
}

export const getPowerType = (type) => {
  let fixedType = type.toLowerCase();
  if (!fixedType) return 'Weapon Power';
  if (fixedType.includes('obolbronzeworship')) {
    return 'Worship Power';
  }
  if (fixedType.includes('obolbronzetrapping')) {
    return 'Trapping Power';
  }
  if (fixedType.includes('mining')) {
    return 'Mining Power';
  } else if (fixedType.includes('fishin')) {
    return 'Fishing Power';
  } else if (fixedType.includes('choppin')) {
    return 'Choppin Power';
  } else if (fixedType.includes('catch')) {
    return 'Catching Power';
  }
  return 'Weapon Power'
}

const getStatsFromObols = (obols, account) => {
  const bonusText = account ? 'familyBonus' : 'personalBonus';
  return obols?.reduce((res, obol) => {
    Object.entries(obol).forEach(([statName, statValue]) => {
      const stat = obolStats.includes(statName);
      if (!stat) return;
      let realStatName = statName;
      if (statName === 'Weapon_Power' && statValue > 0) {
        realStatName = getPowerType(obol?.UQ1txt || obol?.rawName).replace(/ /, '_');
      }
      if (res[realStatName]?.[bonusText] || res[statValue]?.[bonusText]) {
        if (realStatName === 'UQ1txt' || realStatName === 'UQ2txt') {
          if (statValue === 0) return;
          const reg = realStatName.match(/\d/g)?.[0];
          res[statValue] = {
            [bonusText]: (res?.[statValue]?.[bonusText] ?? 0) + obol?.[`UQ${reg}val`] || 0
          }
        } else {
          res[realStatName] = { [bonusText]: (res?.[realStatName]?.[bonusText] ?? 0) + statValue }
        }
      } else {
        if (realStatName === 'UQ1txt' || realStatName === 'UQ2txt') {
          if (statValue === 0) return;
          const reg = realStatName.match(/\d/g)?.[0];
          res[statValue] = { [bonusText]: (res?.[statValue]?.[bonusText] ?? 0) + obol?.[`UQ${reg}val`] || 0 }
        } else {
          res[realStatName] = { [bonusText]: statValue }
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