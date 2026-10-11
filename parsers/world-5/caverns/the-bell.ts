import { holesInfo } from '@website-data';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getMeasurementBonus } from '@parsers/world-5/hole';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';
import { NUMBERED_GROUP, createBreakdown, evaluateBreakdownNode, flat, multiplier, productGroup } from '@parsers/breakdown';
import { numberWithCommas } from '@utility/helpers';

export const getTheBell = (holesObject: any, accountData: any) => {
  const bellMethodsOwned = Math.min(6, holesObject?.bellRelated?.[5] + 1);
  const newMethodChance = Math.min((0.6 / Math.max(1, 0.8
      * holesObject?.bellRelated?.[5] + 1))
    * (1 + (getSchematicBonus({ holesObject, t: 43, i: 25 })
      * holesObject?.extraCalculations?.[31]) / 100), 0.9);
  const bellsDescriptions = ['Ring_the_bell_to_get_+{_LV_of_a_random_bonus!',
    'Ping_the_bell_to_find_an_opal_instantly!', 'Clean_the_bell_for_a_}%_chance_to_unlock_a_new_improvement_method!',
    'Renew_the_bell_to_reset_all_bonuses..._but_you_keep_improvement_methods_&_opals!'];
  const bells = ['ring', 'ping', 'clean', 'renew'].map((name, index) => {
    const expRate = getBellExpRate(holesObject, accountData, index);
    const expReq = getBellExpReq(holesObject, index);
    const exp = holesObject?.bellRelated[2 * index];
    const bonus = getBellBonus({ holesObject, t: index });
    const readyUses = getBellReadyUses(holesObject, index);
    return { name, expRate, description: bellsDescriptions?.[index], bonus, expReq, exp, readyUses };
  })
  const improvementMethods = holesInfo[60].map((description: any, index: any) => {
    const level = holesObject?.bellImprovementMethods?.[index];
    const bonus = getBellMethodQuantity(holesObject, index);
    const cost = getImprovementMethodCost(holesObject, index);
    const costType = getImprovementMethodCostType(holesObject, accountData, index);
    return {
      bonus,
      description,
      level,
      cost,
      ...costType
    }
  });
  const bellBonuses = (holesInfo[59] as any).toChunks(2).map(([description, baseValue]: any, index: any) => {
    const bonus = getBellBonus({ holesObject, t: index })
    return { description, baseValue: parseFloat(baseValue), bonus, level: holesObject?.bellRingLevels?.[index] };
  })
  return {
    bellMethodsOwned,
    newMethodChance,
    bells,
    improvementMethods,
    bellBonuses,
    rings: holesObject?.bellRelated?.[1],
    pings: holesObject?.bellRelated?.[3]
  };
}

const getImprovementMethodCostType = (holesObject: any, accountData: any, index: any) => {
  if (index === 0) {
    return { costType: 'money', owned: accountData?.currencies?.rawMoney };
  }
  if (index === 1) {
    return { costType: 'sediments', owned: Math.max(0, holesObject?.wellSediment?.[3] ?? 0) };
  }
  if (index === 2) {
    return { costType: 'bits', owned: accountData?.gaming?.bits };
  }
  if (index === 3) {
    return { costType: 'notes', owned: Math.max(0, holesObject?.wellSediment?.[14] ?? 0) };
  }
  if (index === 4) {
    return { costType: 'particles', owned: accountData?.atoms?.particles };
  }
  if (index === 5) {
    return { costType: 'rupie', owned: Math.max(0, holesObject?.wellSediment?.[25] ?? 0) };
  }
  return { costType: '', owned: 0 };
}
// count = the bell's use counter (bellRelated[2t+1]), overridable to price the uses after the next one
const getBellExpReq = (holesObject: any, t: any, count = holesObject?.bellRelated?.[2 * t + 1]) => {
  return 0 === t
    ? (5 + 3 * count) * Math.pow(1.05, count)
    : 1 === t
      ? (10 + (10 * count + Math.pow(count, 2.5)))
      * Math.pow(1.75, count)
      : 2 === t
        ? 100 * Math.pow(3, count)
        : 25
}

// Exp is uncapped and a use subtracts the req, so a bell can bank several uses.
// Ring/Ping bump their counter on every use, raising the next req. Clean only bumps it when a
// method unlocks and Renew's req is flat, so both are priced at the current req.
export const getBellReadyUses = (holesObject: any, t: any) => {
  let exp = holesObject?.bellRelated?.[2 * t] ?? 0;
  let count = holesObject?.bellRelated?.[2 * t + 1] ?? 0;
  let req = getBellExpReq(holesObject, t, count);
  if (!(req > 0)) return 0;
  if (t >= 2) return Math.floor(exp / req);
  let uses = 0;
  while (exp >= req && uses < 1000) {
    exp -= req;
    uses++;
    count++;
    req = getBellExpReq(holesObject, t, count);
  }
  return uses;
}
const getImprovementMethodCost = (holesObject: any, t: any) => {
  const info = holesInfo?.[42];
  return 0 === t
    ? Number(info[t]) * Math.pow(1.25, (holesObject?.bellImprovementMethods?.[t]))
    : 2 === t
      ? Number(info[t]) * Math.pow(1.5, (holesObject?.bellImprovementMethods?.[t]))
      : Number(info[t]) * Math.pow(1.1, (holesObject?.bellImprovementMethods?.[t]))

}
const BELL_BASE_EXP_RATE = 10;
const BELL_NAMES = ['Ring', 'Ping', 'Clean', 'Renew'];

// Each bell's exp/hr multipliers: ring and ping share the monument and measurement, ring adds the jars
const getBellExpMultipliers = (holesObject: any, accountData: any, t: any) => {
  const methodLine = (methods: number[]) => multiplier('Improvement methods', 1 + methods
    .reduce((sum, method) => sum + getBellMethodQuantity(holesObject, method, 0), 0) / 100);
  const monumentAndMeasurement = () => [
    multiplier('Monument', 1 + getMonumentBonus({ holesObject, t: 0, i: 7 }) / 100),
    multiplier('Measurement', 1 + getMeasurementBonus({ holesObject, accountData, t: 2 }) / 100)
  ];
  if (t === 0) {
    return [
      ...monumentAndMeasurement(),
      methodLine([0, 2, 4, 5]),
      multiplier('Big Beef Rock (Jar)', 1 + getJarBonus({ holesObject, i: 11, account: accountData }) / 100),
      multiplier('Twisted Rupie (Jar)', 1 + getJarBonus({ holesObject, i: 36, account: accountData }) / 100)
    ];
  }
  if (t === 1) return [...monumentAndMeasurement(), methodLine([3])];
  if (t === 2) return [methodLine([1])];
  return [];
}

const getBellExpRate = (holesObject: any, accountData: any, t: any) => {
  const multipliers = productGroup(NUMBERED_GROUP, getBellExpMultipliers(holesObject, accountData, t));
  const value = BELL_BASE_EXP_RATE * evaluateBreakdownNode(multipliers);
  return {
    value,
    breakdown: createBreakdown(`${BELL_NAMES[t]} exp rate`, `${numberWithCommas(Math.floor(value))} / hr`, [
      flat('Base', BELL_BASE_EXP_RATE),
      multipliers
    ])
  };
}
const getBellMethodQuantity = (holesObject: any, t: any, _unused2?: any) => {
  return 2 * holesObject?.bellImprovementMethods?.[t]
    * Math.max(1, getSchematicBonus({ holesObject, t: 45, i: 0 }) * Number(holesInfo?.[61]?.[t]));
}
// game: "BellBonuss"
export const getBellBonus = ({ holesObject, t }: any) => {
  const info = holesInfo[59]
  return holesObject?.bellRingLevels[t]
    * Number(info[Math.round(2 * t + 1)]);
}
