import { holesInfo } from '../../../data/website-data';
import { getBucketBonus } from '@parsers/world-5/caverns/the-well';
import { cleanUnderscore, createRange, lavaLog, notateNumber } from '@utility/helpers';
import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getStampsBonusByEffect } from '@parsers/stamps';


const jarNames = [
  'Simple Jar',
  'Tall Jar',
  'Ornate Jar',
  'Great Jar',
  'Enchanted Jar',
  'Artisan Jar',
  'Epic Jar',
  'Gilded  Jar',
  'Ceremony Jar',
  'Heirloom Jar'
]

export const getTheJars = (holesObject, accountData) => {
  const jarEffects = holesInfo?.[65]?.split(' ');
  const jarTypes = Math.round(holesObject?.extraCalculations?.[37]);
  const unlockedSlots = getJarSlots({ holesObject });
  const opalChance = getOpalChance({ holesObject });
  const newCollectibleChance = getNewCollectibleChance({ holesObject });
  const newJarCost = getNewJarCost({ holesObject });
  const enchantChance = getEnchantChance({ holesObject });
  const rupieValue = getRupieValue({ holesObject, accountData });
  const jarAesthetic = getJarAesthetic({ holesObject });
  const jars = jarNames.map((name, index) => {
    const bonus = index === 1 ? notateNumber(100 * opalChance, 'Small') : index === 2
      ? notateNumber(100 * newCollectibleChance, 'Small')
      : index === 1 ? enchantChance : ''
    return {
      name,
      effect: cleanUnderscore(jarEffects?.[index]).replace('{', bonus),
      unlocked: index <= jarTypes,
      req: getProductionReq({ holesObject, i: index })
    }
  });
  const perHour = getProductionPerHour({ holesObject, accountData });
  const activeSlots = createRange(0, unlockedSlots - 1).map((_, index) => {
    return {
      progress: holesObject?.jarProgress?.[index + 3],
      jarType: holesObject?.jarProgress?.[index],
      req: jars?.[holesObject?.jarProgress?.[index]]?.req
    }
  });
  const rupies = createRange(0, 11).map((index) => {
    return holesObject?.wellSediment?.slice(20)?.[index] ?? '0';
  });

  const collectibles = holesObject?.jarStuff?.slice(0, 16).map((level, index) => {
    const [name, bonusModifier, , description] = holesInfo?.[67]?.split(' ')?.[index]?.split('|');
    const bonus = getJarBonus({ holesObject, i: index });
    return {
      level,
      bonus,
      name: cleanUnderscore(name).toLowerCase().capitalizeAllWords(),
      bonusModifier,
      description: description.replace('{', bonus).replace('}', 1 + bonus / 100),
      doubled: holesObject?.extraCalculations?.[62] === index
    }
  });

  return {
    unlockedSlots,
    opalChance,
    newJarCost,
    rupieValue,
    jarAesthetic,
    activeSlots,
    rupies,
    perHour,
    jars,
    collectibles
  }
}

const getRupieType = ({ holesObject, t }) => {
  return 0 === t ? (1e3 <= holesObject?.wellSediment?.[21]
    ? c.randomInt(0, 2)
    : 100 <= holesObject?.wellSediment?.[20] ? c.randomInt(0, 1) : 0) : 3 === t
    ? (5e5 <= holesObject?.wellSediment?.[24] ? c.randomInt(3, 5)
      : 1e4 <= holesObject?.wellSediment?.[23] ? c.randomInt(3, 4) : 3)
    : 5 === t ? 10 : 6 === t ? (5e7 <= holesObject?.wellSediment?.[24]
      ? c.randomInt(6, 8)
      : 6e6 <= holesObject?.wellSediment?.[23] ? c.randomInt(6, 7) : 6) : 8 === t ? 11 : 9
}

const getRupieValue = ({ holesObject, accountData }) => {
  const stampBonus = getStampsBonusByEffect(accountData, 'CavernRes') || 0;
  return (1 + (getBucketBonus({ ...holesObject, t: 62, i: 1 })
      + (getBucketBonus({ ...holesObject, t: 65, i: 2 })
        + getBucketBonus({ ...holesObject, t: 68, i: 4 }))))
    * (1 + (getMeasurementBonus({ holesObject, accountData, t: 10 })
      + getMeasurementBonus({ holesObject, accountData, t: 14 })) / 100)
    * Math.max(1, getBucketBonus({ ...holesObject, t: 80, i: 1 })
      * Math.pow(1.1, holesObject?.extraCalculations?.[5]))
    * (1 + holesObject?.extraCalculations?.[60] / 100)
    * (1 + getJarBonus({ holesObject, i: 3 }) / 100)
    * (1 + getJarBonus({ holesObject, i: 17 }) / 100)
    * (1 + getJarBonus({ holesObject, i: 28 }) / 100)
    * (1 + (getJarBonus({ holesObject, i: 0 })
      + (getJarBonus({ holesObject, i: 6 })
        + (getJarBonus({ holesObject, i: 13 })
          + (getJarBonus({ holesObject, i: 21 })
            + getJarBonus({ holesObject, i: 33 }))))) / 100)
    * (1 + stampBonus / 100);
}

const getProductionPerHour = ({ holesObject, accountData }) => {
  return 36e3 * (1 + (getJarBonus({ holesObject, i: 1 })
      + (getJarBonus({ holesObject, i: 15 })
        + (getJarBonus({ holesObject, i: 24 })
          + getMeasurementBonus({ holesObject, accountData, t: 12 })))) / 100)
    * (1 + (getBucketBonus({ ...holesObject, t: 72, i: 10 })
      * lavaLog(holesObject?.extraCalculations?.[38])) / 100)
}

const getJarAesthetic = ({ holesObject }) => {
  const result = getBucketBonus({ ...holesObject, t: 62, i: 1 }) +
    (getBucketBonus({ ...holesObject, t: 63, i: 1 }) +
      (getBucketBonus({ ...holesObject, t: 64, i: 1 }) +
        (getBucketBonus({ ...holesObject, t: 65, i: 1 }) +
          (getBucketBonus({ ...holesObject, t: 66, i: 1 }) +
            (getBucketBonus({ ...holesObject, t: 67, i: 1 }) +
              getBucketBonus({ ...holesObject, t: 68, i: 1 }))))));

  return Math.round(Math.min(result, 7));
}

const getJarSlots = ({ holesObject }) => {
  return 1 === getBucketBonus({ ...holesObject, t: 66, i: 1 })
    ? 3 :
    1 === getBucketBonus({ ...holesObject, t: 63, i: 1 })
      ? 2 : 1
}

const getProductionReq = ({ holesObject, i }) => {
  return (1e3 + 2e3 * i)
    / ((1 + getBucketBonus({ ...holesObject, t: 67, i: 30 }) / 100)
      * (1 + (getBucketBonus({ ...holesObject, t: 74, i: 5 })
        * lavaLog(holesObject?.extraCalculations[Math.round(Math.max(0, i - 1) + 40)])) / 100))
}

const getNewJarCost = ({ holesObject }) => {
  return 50 * Math.pow(1 + holesObject?.extraCalculations?.[37], 1.5)
    * Math.pow(4.8, holesObject?.extraCalculations?.[37]);
}

const getOpalChance = ({ holesObject }) => {
  return 0.25
    * Math.pow(0.43, holesObject?.opalsPerCavern?.[10])
    * (1 + getJarBonus({ holesObject, i: 2 }) / 100)
    * (1 + getJarBonus({ holesObject, i: 14 }) / 100)
    * (1 + getJarBonus({ holesObject, i: 27 }) / 100);
}

export const getJarBonus = ({ holesObject, i }) => {
  const all = holesInfo?.[67].split(' ')?.[i];
  return holesObject?.jarStuff?.[i] * parseFloat(all.split('|')[1]);
}

const getNewCollectibleChance = ({ holesObject }) => {
  let value = 0;
  let value2 = 0;

  for (let i = 0; i < 10; i++) {
    if (getBucketBonus({ ...holesObject, t: 76, i: 1 }) === 1) {
      const index = Math.round(20 + value2);
      const logValue = Math.ceil(lavaLog(holesObject?.wellSediment[index]));

      value2 += logValue;
    }
  }

  const bonus1 = getJarBonus({ holesObject, i: 7 }) / 100;
  const bonus2 = getJarBonus({ holesObject, i: 25 }) / 100;
  const multiplier = Math.max(1, Math.pow(1.02, value2));

  let value3 = (1 + bonus1) * multiplier * (1 + bonus2);

  for (let i = 0; i < 40; i++) {
    if (holesObject?.jarStuff?.[i] >= 1) {
      value++;
    }
  }

  // Final return calculation
  if (value === 0) return 0.25;

  const chanceFactor = Math.pow(value, 1.9);
  if (value < 16) {
    return (0.2 * value3) / (1 + chanceFactor);
  } else {
    return (0.2 * value3) / (1 + chanceFactor + Math.pow(value - 16, 2));
  }
}

const getEnchantChance = ({ holesObject }) => {
  let value = 0;

  for (let i = 0; i < 40; i++) {
    const holeValue = holesObject?.jarStuff?.[i];
    if (holeValue >= 2) {
      value += (holeValue - 1);
    }
  }

  // Calculate final return value
  const jarBonus1 = 1 + getJarBonus({ holesObject, i: 10 }) / 100;
  const jarBonus2 = 1 + getJarBonus({ holesObject, i: 18 }) / 100;
  const jarBonus3 = 1 + getJarBonus({ holesObject, i: 26 }) / 100;
  const jarBonus4 = 1 + getJarBonus({ holesObject, i: 34 }) / 100;
  const studyBonus = 1 + getStudyBonus(holesObject, 10, 0) / 100;
  const upgradeFactor = Math.max(1, getBucketBonus({ ...holesObject, t: 73, i: 1 })
    * Math.pow(1.02, lavaLog(holesObject?.extraCalculations?.[39])));

  return (0.35 / (1 + Math.pow(value, 1.3))) * jarBonus1 * upgradeFactor * jarBonus2 * studyBonus * jarBonus3 * jarBonus4;
}


// TODO: TBD
// 11 == this._DN4 ? a.engine.getGameAttribute("Holes")[11][39] = c.asNumber(a.engine.getGameAttribute("Holes")[11][39])
//   + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
//   : 10 == this._DN4 ? a.engine.getGameAttribute("Holes")[11][38] = c.asNumber(a.engine.getGameAttribute("Holes")[11][38])
//     + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
//     : a.engine.getGameAttribute("Holes")[9][Math.round(20 + this._DN4)] = c.asNumber(a.engine.getGameAttribute("Holes")[9][Math.round(20 + this._DN4)])
//       + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
