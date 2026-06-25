import { holesInfo } from '@website-data';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getFountainBonusTotal } from '@parsers/world-5/caverns/the-fountain';
import { cleanUnderscore, createRange, lavaLog, notateNumber } from '@utility/helpers';
import { getMeasurementBonus, getStudyBonus } from '@parsers/world-5/hole';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';


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

export const getTheJars = (holesObject: any, jarsRaw: any, accountData: any) => {
  const jarEffects = holesInfo?.[65];
  const jarTypes = Math.round(holesObject?.extraCalculations?.[37]);
  const unlockedSlots = getJarSlots({ holesObject });
  const opalChance = getOpalChance({ holesObject, account: accountData });
  const newCollectibleChance = getNewCollectibleChance(holesObject, accountData);
  const newJarCost = getNewJarCost({ holesObject });
  const enchant = getEnchantChance({ holesObject, account: accountData });
  const rupieValue = getRupieValue({ holesObject, accountData });
  const jarAesthetic = getJarAesthetic({ holesObject });
  const jars = jarNames.map((name, index) => {
    const bonus = index === 1 ? notateNumber(100 * opalChance, 'Small') : index === 2
      ? notateNumber(100 * newCollectibleChance, 'Small')
      : index === 4 ? enchant.label : ''
    return {
      name,
      effect: cleanUnderscore(jarEffects?.[index])!.replace('{', String(bonus)),
      unlocked: index <= jarTypes,
      req: getProductionReq({ holesObject, i: index }),
      destroyed: holesObject?.extraCalculations?.slice(40, 50)?.[index] || 0,
      // Enchanted Jar (index 4): expose precise odds, per-tier scaling and source breakdown
      enchant: index === 4 ? enchant : undefined
    }
  });
  const totalEnhancingLevels = (holesObject?.jarStuff?.slice(0, 40) ?? [])
    .reduce((sum: number, level: any) => sum + (level >= 2 ? level - 1 : 0), 0);
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

  const collectibles = holesObject?.jarStuff?.slice(0, 40).map((level: any, index: any) => {
    const [name, bonusModifier, , description] = holesInfo?.[67]?.[index]?.split('|') ?? [];
    const bonus = getJarBonus({ holesObject, i: index, account: accountData });
    return {
      level,
      bonus,
      name: (cleanUnderscore(name) as any).toLowerCase().capitalizeAllWords(),
      bonusModifier,
      description: description.replace('{', String(bonus)).replace('}', String(1 + bonus / 100)),
      doubled: holesObject?.extraCalculations?.[62] === index
    }
  });

  const perHour = getProductionPerHour({ holesObject, accountData, collectibles });

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
    totalEnhancingLevels,
    collectibles
  }
}

const _randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRupieType = ({ holesObject, t }: any) => {
  return 0 === t ? (1e3 <= holesObject?.wellSediment?.[21]
    ? _randomInt(0, 2)
    : 100 <= holesObject?.wellSediment?.[20] ? _randomInt(0, 1) : 0) : 3 === t
    ? (5e5 <= holesObject?.wellSediment?.[24] ? _randomInt(3, 5)
      : 1e4 <= holesObject?.wellSediment?.[23] ? _randomInt(3, 4) : 3)
    : 5 === t ? 10 : 6 === t ? (5e7 <= holesObject?.wellSediment?.[24]
      ? _randomInt(6, 8)
      : 6e6 <= holesObject?.wellSediment?.[23] ? _randomInt(6, 7) : 6) : 8 === t ? 11 : 9
}

const getRupieValue = ({ holesObject, accountData }: any) => {
  const stampBonus = getStampsBonusByEffect(accountData, 'more_Resources_from_all_Caverns') || 0;
  const schematicBonus1 = getSchematicBonus({ holesObject, t: 62, i: 1 });
  const schematicBonus2 = getSchematicBonus({ holesObject, t: 65, i: 2 });
  const schematicBonus3 = getSchematicBonus({ holesObject, t: 68, i: 4 });
  const accountOptionBonus = Math.max(1, Math.pow(1.5, accountData?.accountOptions?.[355]));
  const lampBonus = 1 + getLampBonus({ holesObject, t: 99, i: 0, account: accountData }) / 400;
  const monumentBonus = 1 + getMonumentBonus({ holesObject, t: 2, i: 1 }) / 100;
  const measurementBonus1 = getMeasurementBonus({ holesObject, accountData, t: 10 });
  const measurementBonus2 = getMeasurementBonus({ holesObject, accountData, t: 14 });
  const schematicBonus4 = Math.max(1, getSchematicBonus({ holesObject, t: 80, i: 1 })
    * Math.pow(1.1, holesObject?.extraCalculations?.[5]));
  const extraCalcBonus = 1 + holesObject?.extraCalculations?.[60] / 100;
  const jarBonus1 = 1 + getJarBonus({ holesObject, i: 3, account: accountData }) / 100;
  const jarBonus2 = 1 + getJarBonus({ holesObject, i: 17, account: accountData }) / 100;
  const jarBonus3 = 1 + getJarBonus({ holesObject, i: 28, account: accountData }) / 100;
  const jarBonus4 = 1 + (getJarBonus({ holesObject, i: 0, account: accountData })
    + getJarBonus({ holesObject, i: 6, account: accountData })
    + getJarBonus({ holesObject, i: 13, account: accountData })
    + getJarBonus({ holesObject, i: 21, account: accountData })
    + getJarBonus({ holesObject, i: 33, account: accountData })) / 100;
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

  const breakdown = {
    statName: "Rupie value",
    totalValue: notateNumber(value, 'MultiplierInfo'),
    categories: [
      {
        name: "Base Value",
        sources: [
          { name: "Schematic Bonuses", value: 1 + schematicBonus1 + schematicBonus2 + schematicBonus3 },
        ],
      },
      {
        name: "Multiplicative",
        sources: [
          { name: "Rupie Slug (Gem shop)", value: accountOptionBonus },
          { name: "Lamp", value: lampBonus },
          { name: "Monument", value: monumentBonus },
          { name: "Measurements", value: 1 + (measurementBonus1 + measurementBonus2) / 100 },
          { name: "Schematic", value: schematicBonus4 },
          { name: "Gilded Jars", value: extraCalcBonus },
          { name: "Collectibles", value: jarBonus1 * jarBonus2 * jarBonus3 * jarBonus4 },
          { name: "Stamps", value: stampBonusMultiplier },
        ],
      },
    ],
  };

  return { value, breakdown };
}

const getProductionPerHour = ({ holesObject, accountData, collectibles }: any) => {
  const base = 36e3;
  const jarBonus1 = getJarBonus({ holesObject, i: 1, account: accountData });
  const jarBonus15 = getJarBonus({ holesObject, i: 15, account: accountData });
  const jarBonus24 = getJarBonus({ holesObject, i: 24, account: accountData });
  const measurementBonus = getMeasurementBonus({ holesObject, accountData, t: 12 });
  const collectibleMultiplier = 1 + (jarBonus1 + jarBonus15 + jarBonus24 + measurementBonus) / 100;

  const schematicBonus = getSchematicBonus({ holesObject, t: 72, i: 10 });
  const whiteRupies = holesObject?.extraCalculations?.[38];
  const whiteRupiesMultiplier = 1 + (schematicBonus * lavaLog(whiteRupies)) / 100;

  const value = base * collectibleMultiplier * whiteRupiesMultiplier;

  const breakdown = {
    statName: "Progress per hour",
    totalValue: notateNumber(value, 'Big'),
    categories: [
      {
        name: "Base",
        sources: [
          { name: "Base rate", value: base }
        ]
      },
      {
        name: "Multiplicative",
        sources: [
          { name: "Collectibles + Measurements", value: collectibleMultiplier },
          { name: "White Rupies (Schematic)", value: whiteRupiesMultiplier }
        ]
      },
      {
        name: "Additive (in Collectibles + Measurements)",
        sources: [
          { name: collectibles?.[1]?.name, value: jarBonus1 },
          { name: collectibles?.[15]?.name, value: jarBonus15 },
          { name: collectibles?.[24]?.name, value: jarBonus24 },
          { name: "Measurement", value: measurementBonus }
        ]
      }
    ]
  };

  return { value, breakdown };
}

const getJarAesthetic = ({ holesObject }: any) => {
  const result = getSchematicBonus({ holesObject, t: 62, i: 1 }) +
    (getSchematicBonus({ holesObject, t: 63, i: 1 }) +
      (getSchematicBonus({ holesObject, t: 64, i: 1 }) +
        (getSchematicBonus({ holesObject, t: 65, i: 1 }) +
          (getSchematicBonus({ holesObject, t: 66, i: 1 }) +
            (getSchematicBonus({ holesObject, t: 67, i: 1 }) +
              getSchematicBonus({ holesObject, t: 68, i: 1 }))))));

  return Math.round(Math.min(result, 7));
}

const getJarSlots = ({ holesObject }: any) => {
  return 1 === getSchematicBonus({ holesObject, t: 66, i: 1 })
    ? 3 :
    1 === getSchematicBonus({ holesObject, t: 63, i: 1 })
      ? 2 : 1
}

const getProductionReq = ({ holesObject, i }: any) => {
  return (1e3 + 2e3 * i)
    / ((1 + getSchematicBonus({ holesObject, t: 67, i: 30 }) / 100)
      * (1 + (getSchematicBonus({ holesObject, t: 74, i: 5 })
        * lavaLog(holesObject?.extraCalculations[Math.round(Math.max(0, i - 1) + 40)])) / 100))
}

const getNewJarCost = ({ holesObject }: any) => {
  return 50 * Math.pow(1 + holesObject?.extraCalculations?.[37], 1.5)
    * Math.pow(4.8, holesObject?.extraCalculations?.[37]);
}

const getOpalChance = ({ holesObject, account }: any) => {
  return 0.25
    * Math.pow(0.43, holesObject?.opalsPerCavern?.[10])
    * (1 + getJarBonus({ holesObject, i: 2, account }) / 100)
    * (1 + getJarBonus({ holesObject, i: 14, account }) / 100)
    * (1 + getJarBonus({ holesObject, i: 27, account }) / 100);
}

export const getJarBonus = ({ holesObject, i, account }: any) => {
  const all = holesInfo?.[67]?.[i];
  const legendTalentBonus = getLegendTalentBonus(account, 29);
  return holesObject?.jarStuff?.[i] * parseFloat(all.split('|')[1]) * (1 + legendTalentBonus / 100);
}

export const getNewCollectibleChance = (holesObject: any, account: any) => {
  const hasBUpg = getSchematicBonus({ holesObject, t: 76, i: 1 }) === 1;
  const bonus7 = getJarBonus({ holesObject, i: 7, account }) / 100;
  const bonus25 = getJarBonus({ holesObject, i: 25, account }) / 100;

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

  const dn = holesObject?.jarStuff?.reduce((count: any, v: any) => count + (v >= 1 ? 1 : 0), 0);

  if (dn === 0) {
    return 0.25;
  }
  const base = 0.2 * dn2;
  const denomination = 1 + Math.pow(dn, 1.9);
  const penalty = dn > 15 ? Math.pow(1.5, dn - 16) : 1;
  return (base / denomination) / penalty;
}

// Format a probability (0-1) as a percentage string that stays useful even for
// tiny values. The game floors anything under 0.01% to "0%"; we keep precision.
const formatEnchantPercent = (chance: number) => {
  const percent = 100 * chance;
  if (percent === 0) return '0';
  if (percent >= 0.01) return notateNumber(percent, 'Small');
  // Below 0.01%: show meaningful precision via scientific notation.
  return percent.toExponential(4);
}

const getEnchantChance = ({ holesObject, account }: any) => {
  let enhancingLevels = 0;

  for (let i = 0; i < 40; i++) {
    const holeValue = holesObject?.jarStuff?.[i];
    if (holeValue >= 2) {
      enhancingLevels += (holeValue - 1);
    }
  }

  // Each source below mirrors a multiplicative term in the game formula.
  const base = 0.35 / (1 + (Math.pow(enhancingLevels, 1.23) + Math.pow(1.1, enhancingLevels)));
  const jarBonus9 = getJarBonus({ holesObject, i: 9, account });
  const jarBonus18 = getJarBonus({ holesObject, i: 18, account });
  const jarBonus26 = getJarBonus({ holesObject, i: 26, account });
  const jarBonus34 = getJarBonus({ holesObject, i: 34, account });
  const collectiblesMulti = (1 + jarBonus9 / 100) * (1 + jarBonus18 / 100)
    * (1 + jarBonus26 / 100) * (1 + jarBonus34 / 100);
  const engineerMulti = Math.max(1, getSchematicBonus({ holesObject, t: 73, i: 1 }) *
    Math.pow(1.1, lavaLog(holesObject?.extraCalculations?.[39])));
  // Game: (1 + StudyBolaiaBonuses(10,0)/100). Older code double-wrapped this.
  const studyMulti = 1 + getStudyBonus(holesObject, 10, 0) / 100;
  const fountainMulti = 1 + getFountainBonusTotal(holesObject, 2, 15) / 100;

  const value = base * collectiblesMulti * engineerMulti * studyMulti * fountainMulti;

  // Higher tier jars roll the enchant 10x more often per tier, so effective odds
  // scale by 10^(tier-1) (capped at 100%). Lets players target a tier.
  const tiers = createRange(1, 10).map((tier) => ({
    tier,
    chance: Math.min(1, value * Math.pow(10, tier - 1)),
    label: formatEnchantPercent(Math.min(1, value * Math.pow(10, tier - 1)))
  }));

  const breakdown = {
    statName: "Enchant chance",
    totalValue: `${formatEnchantPercent(value)}%`,
    categories: [
      {
        name: "Base",
        sources: [
          { name: `Base (after ${enhancingLevels} enhancing levels)`, value: base }
        ]
      },
      {
        name: "Multiplicative",
        sources: [
          { name: "Collectibles", value: collectiblesMulti },
          { name: "Engineer (Schematic)", value: engineerMulti },
          { name: "Study", value: studyMulti },
          { name: "Fountain", value: fountainMulti }
        ]
      }
    ]
  };

  return { value, label: formatEnchantPercent(value), tiers, breakdown };
}

// TODO: TBD
// 11 == this._DN4 ? a.engine.getGameAttribute("Holes")[11][39] = c.asNumber(a.engine.getGameAttribute("Holes")[11][39])
//   + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
//   : 10 == this._DN4 ? a.engine.getGameAttribute("Holes")[11][38] = c.asNumber(a.engine.getGameAttribute("Holes")[11][38])
//     + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
//     : a.engine.getGameAttribute("Holes")[9][Math.round(20 + this._DN4)] = c.asNumber(a.engine.getGameAttribute("Holes")[9][Math.round(20 + this._DN4)])
//       + n._customBlock_Holes("JarRupieValue", 0, 0) * Math.pow(10, c.asNumber(a.engine.getGameAttribute("Jars")[this._DRI | 0][1]))
