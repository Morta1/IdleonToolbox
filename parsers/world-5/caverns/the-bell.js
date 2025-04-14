import { holesInfo } from '../../../data/website-data';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';
import { getMonumentBonus } from '@parsers/world-5/caverns/bravery';
import { getMeasurementBonus } from '@parsers/world-5/hole';
import { getJarBonus } from '@parsers/world-5/caverns/the-jars';

export const getTheBell = (holesObject, accountData) => {
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
    return { name, expRate, description: bellsDescriptions?.[index], bonus, expReq, exp };
  })
  const improvementMethods = holesInfo[60].split(' ').map((description, index) => {
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
  const bellBonuses = holesInfo[59].split(' ').toChunks(2).map(([description, baseValue], index) => {
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

const getImprovementMethodCostType = (holesObject, accountData, index) => {
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
const getBellExpReq = (holesObject, t) => {
  return 0 === t
    ? (5 + 3 * (holesObject?.bellRelated?.[1])) * Math.pow(1.05, (holesObject?.bellRelated?.[1]))
    : 1 === t
      ? (10 + (10 * (holesObject?.bellRelated?.[3]) + Math.pow((holesObject?.bellRelated?.[3]), 2.5)))
      * Math.pow(1.75, (holesObject?.bellRelated?.[3]))
      : 2 === t
        ? 100 * Math.pow(3, (holesObject?.bellRelated?.[5]))
        : 25
}
const getImprovementMethodCost = (holesObject, t) => {
  const info = holesInfo?.[42]?.split(' ');
  return 0 === t
    ? (info[t]) * Math.pow(1.25, (holesObject?.bellImprovementMethods?.[t]))
    : 2 === t
      ? (info[t]) * Math.pow(1.5, (holesObject?.bellImprovementMethods?.[t]))
      : (info[t]) * Math.pow(1.1, (holesObject?.bellImprovementMethods?.[t]))

}
const getBellExpRate = (holesObject, accountData, t) => {
  if (t === 0) {
    const monumentBonus = getMonumentBonus({ holesObject, t: 0, i: 7 });
    const measurementBonus = getMeasurementBonus({ holesObject, accountData, t: 2 });
    const methodQuantity0 = getBellMethodQuantity(holesObject, 0, 0);
    const methodQuantity2 = getBellMethodQuantity(holesObject, 2, 0);
    const methodQuantity4 = getBellMethodQuantity(holesObject, 4, 0);
    const methodQuantity5 = getBellMethodQuantity(holesObject, 5, 0);
    const totalMethodQuantity = methodQuantity0 + methodQuantity2 + methodQuantity4 + methodQuantity5;
    const jarBonus11 = getJarBonus({ holesObject, i: 11 });
    const jarBonus36 = getJarBonus({ holesObject, i: 36 });

    const value = 10 * (1 + monumentBonus / 100)
      * (1 + measurementBonus / 100)
      * (1 + totalMethodQuantity / 100)
      * (1 + jarBonus11 / 100)
      * (1 + jarBonus36 / 100);

    return {
      value,
      breakdown: [
        { name: 'Base', value: 10 },
        { name: 'Monument bonus', value: 1 + monumentBonus / 100 },
        { name: 'Measurement bonus', value: 1 + measurementBonus / 100 },
        { name: 'Method Quantity', value: 1 + totalMethodQuantity / 100 },
        { name: 'Big Beef Rock (Jar)', value: 1 + jarBonus11 / 100 },
        { name: 'Twisted Rupie (Jar)', value: 1 + jarBonus36 / 100 }
      ]
    };
  }

  if (t === 1) {
    const monumentBonus = getMonumentBonus({ holesObject, t: 0, i: 7 });
    const measurementBonus = getMeasurementBonus({ holesObject, accountData, t: 2 });
    const methodQuantity = getBellMethodQuantity(holesObject, 3, 0);

    const value = 10 * (1 + monumentBonus / 100)
      * (1 + measurementBonus / 100)
      * (1 + methodQuantity / 100);

    return {
      value,
      breakdown: [
        { name: 'Base', value: 10 },
        { name: 'Monument Bonus', value: 1 + monumentBonus / 100 },
        { name: 'Measurement Bonus', value: 1 + measurementBonus / 100 },
        { name: 'Method Quantity', value: 1 + methodQuantity / 100 }
      ]
    };
  }

  if (t === 2) {
    const methodQuantity = getBellMethodQuantity(holesObject, 1, 0);
    const value = 10 * (1 + methodQuantity / 100);

    return {
      value,
      breakdown: [
        { name: 'Base', value: 10 },
        { name: 'Method Quantity', value: 1 + methodQuantity / 100 }
      ]
    };
  }

  return {
    value: 10,
    breakdown: [
      { name: 'Base', value: 10 }
    ]
  };
}
const getBellMethodQuantity = (holesObject, t) => {
  return 2 * holesObject?.bellImprovementMethods?.[t]
    * Math.max(1, getSchematicBonus({ holesObject, t: 45, i: 0 }) * holesInfo?.[61]?.split(' ')?.[t]);
}
export const getBellBonus = ({ holesObject, t }) => {
  const info = holesInfo[59]?.split(' ')
  return holesObject?.bellRingLevels[t]
    * info[Math.round(2 * t + 1)];
}
