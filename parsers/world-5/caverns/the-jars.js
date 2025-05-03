import { holesInfo } from '../../../data/website-data';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { cleanUnderscore, createRange, lavaLog, notateNumber } from '@utility/helpers';
import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';


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

export const getTheJars = (holesObject, jarsRaw, accountData) => {
  const jarEffects = holesInfo?.[65]?.split(' ');
  const jarTypes = Math.round(holesObject?.extraCalculations?.[37]);
  const unlockedSlots = getJarSlots({ holesObject });
  const opalChance = getOpalChance({ holesObject });
  const newCollectibleChance = getNewCollectibleChance(holesObject);
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
      req: getProductionReq({ holesObject, i: index }),
      destroyed: holesObject?.extraCalculations?.slice(40, 50)?.[index] || 0
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
  let rupies = createRange(0, 9).map((index) => {
    return holesObject?.wellSediment?.slice(20)?.[index] ?? '0';
  });
  const whiteDarkRupies = createRange(0, 1).map((index) => {
    return holesObject?.extraCalculations?.slice(38)?.[index] ?? '0';
  })
  rupies = [...rupies, ...whiteDarkRupies];

  const collectibles = holesObject?.jarStuff?.slice(0, 40).map((level, index) => {
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
    totalJars: jarsRaw?.length,
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
  const stampBonus = getStampsBonusByEffect(accountData, 'more_Resources_from_all_Caverns') || 0;
  const schematicBonus1 = getSchematicBonus({ holesObject, t: 62, i: 1 });
  const schematicBonus2 = getSchematicBonus({ holesObject, t: 65, i: 2 });
  const schematicBonus3 = getSchematicBonus({ holesObject, t: 68, i: 4 });
  const accountOptionBonus = Math.max(1, Math.pow(1.5, accountData?.accountOptions?.[355]));
  const lampBonus = 1 + getLampBonus({ holesObject, t: 99, i: 0 }) / 400;
  const monumentBonus = 1 + getMonumentBonus({ holesObject, t: 2, i: 1 }) / 100;
  const measurementBonus1 = getMeasurementBonus({ holesObject, accountData, t: 10 });
  const measurementBonus2 = getMeasurementBonus({ holesObject, accountData, t: 14 });
  const schematicBonus4 = Math.max(1, getSchematicBonus({ holesObject, t: 80, i: 1 })
    * Math.pow(1.1, holesObject?.extraCalculations?.[5]));
  const extraCalcBonus = 1 + holesObject?.extraCalculations?.[60] / 100;
  const jarBonus1 = 1 + getJarBonus({ holesObject, i: 3 }) / 100;
  const jarBonus2 = 1 + getJarBonus({ holesObject, i: 17 }) / 100;
  const jarBonus3 = 1 + getJarBonus({ holesObject, i: 28 }) / 100;
  const jarBonus4 = 1 + (getJarBonus({ holesObject, i: 0 })
    + getJarBonus({ holesObject, i: 6 })
    + getJarBonus({ holesObject, i: 13 })
    + getJarBonus({ holesObject, i: 21 })
    + getJarBonus({ holesObject, i: 33 })) / 100;
  const stampBonusMultiplier = 1 + stampBonus / 100;

  const value = (1 + schematicBonus1 + schematicBonus2 + schematicBonus3)
    * accountOptionBonus
    * lampBonus
    * monumentBonus
    * (1 + (measurementBonus1 + measurementBonus2) / 100)
    * schematicBonus4
    * extraCalcBonus
    * jarBonus1
    * jarBonus2
    * jarBonus3
    * jarBonus4
    * stampBonusMultiplier;

  const breakdown = [
    { title: 'Base Value' },
    { name: 'Schematic Bonuses', value: 1 + schematicBonus1 + schematicBonus2 + schematicBonus3 },
    { title: 'Multiplicative' },
    { name: 'Rupie Slug (Gem shop)', value: accountOptionBonus },
    { name: 'Lamp', value: lampBonus },
    { name: 'Monument', value: monumentBonus },
    { name: 'Measurements', value: 1 + (measurementBonus1 + measurementBonus2) / 100 },
    { name: 'Schematic', value: schematicBonus4 },
    { name: 'Gilded Jars', value: extraCalcBonus },
    { name: 'Collectibles', value: jarBonus1 * jarBonus2 * jarBonus3 * jarBonus4 },
    { name: 'Stamps', value: stampBonusMultiplier }
  ];

  return { value, breakdown };
}

const getProductionPerHour = ({ holesObject, accountData }) => {
  return 36e3 * (1 + (getJarBonus({ holesObject, i: 1 })
      + (getJarBonus({ holesObject, i: 15 })
        + (getJarBonus({ holesObject, i: 24 })
          + getMeasurementBonus({ holesObject, accountData, t: 12 })))) / 100)
    * (1 + (getSchematicBonus({ holesObject, t: 72, i: 10 })
      * lavaLog(holesObject?.extraCalculations?.[38])) / 100)
}

const getJarAesthetic = ({ holesObject }) => {
  const result = getSchematicBonus({ holesObject, t: 62, i: 1 }) +
    (getSchematicBonus({ holesObject, t: 63, i: 1 }) +
      (getSchematicBonus({ holesObject, t: 64, i: 1 }) +
        (getSchematicBonus({ holesObject, t: 65, i: 1 }) +
          (getSchematicBonus({ holesObject, t: 66, i: 1 }) +
            (getSchematicBonus({ holesObject, t: 67, i: 1 }) +
              getSchematicBonus({ holesObject, t: 68, i: 1 }))))));

  return Math.round(Math.min(result, 7));
}

const getJarSlots = ({ holesObject }) => {
  return 1 === getSchematicBonus({ holesObject, t: 66, i: 1 })
    ? 3 :
    1 === getSchematicBonus({ holesObject, t: 63, i: 1 })
      ? 2 : 1
}

const getProductionReq = ({ holesObject, i }) => {
  return (1e3 + 2e3 * i)
    / ((1 + getSchematicBonus({ holesObject, t: 67, i: 30 }) / 100)
      * (1 + (getSchematicBonus({ holesObject, t: 74, i: 5 })
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

export const getNewCollectibleChance = (holesObject) => {
  const hasBUpg = getSchematicBonus({ holesObject, t: 76, i: 1 }) === 1;
  const bonus7 = getJarBonus({ holesObject, i: 7 }) / 100;
  const bonus25 = getJarBonus({ holesObject, i: 25 }) / 100;

  let dn3 = 0;
  if (hasBUpg) {
    for (let i = 0; i < 10; i++) {
      const idx = Math.round(20 + i);
      const value = holesObject?.wellSediment?.[idx] || 0;
      dn3 += Math.ceil(lavaLog(value));
    }
  }

  const powerFactor = Math.max(1, Math.pow(1.02, dn3));
  const dn2 = (1 + bonus7) * powerFactor * (1 + bonus25);

  const dn = holesObject?.jarStuff?.reduce((count, v) => count + (v >= 1 ? 1 : 0), 0);

  if (dn === 0) {
    return 0.25;
  }
  const base = 0.2 * dn2;
  const denomination = 1 + Math.pow(dn, 1.9);
  const penalty = dn > 15 ? Math.pow(1.5, dn - 16) : 1;
  return (base / denomination) / penalty;
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
  const jarBonus1 = getJarBonus({ holesObject, i: 9 });
  const jarBonus2 = getJarBonus({ holesObject, i: 18 });
  const jarBonus3 = getJarBonus({ holesObject, i: 26 });
  const jarBonus4 = getJarBonus({ holesObject, i: 34 });
  const studyBonus = 1 + getStudyBonus(holesObject, 10, 0) / 100;

  return (0.35 / (1 + (Math.pow(value, 1.23) + Math.pow(1.1, value)))) *
    (1 + jarBonus1 / 100) *
    Math.max(1, getSchematicBonus({ holesObject, t: 73, i: 1 }) *
      Math.pow(1.1, lavaLog(holesObject?.extraCalculations?.[39]))) *
    (1 + jarBonus2 / 100) *
    (1 + studyBonus / 100) *
    (1 + jarBonus3 / 100) *
    (1 + jarBonus4 / 100);
}

// TODO: TBD
// 11 == this._DN4 ? a.engine.getGameAttribute("Holes")[11][39] = c.asNumber(a.engine.getGameAttribute("Holes")[11][39])
//   + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
//   : 10 == this._DN4 ? a.engine.getGameAttribute("Holes")[11][38] = c.asNumber(a.engine.getGameAttribute("Holes")[11][38])
//     + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
//     : a.engine.getGameAttribute("Holes")[9][Math.round(20 + this._DN4)] = c.asNumber(a.engine.getGameAttribute("Holes")[9][Math.round(20 + this._DN4)])
//       + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
