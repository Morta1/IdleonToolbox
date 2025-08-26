import { tryToParse } from '../utility/helpers';
import { atomsInfo } from '../data/website-data';
import { getBubbleBonus } from './alchemy';
import { isSuperbitUnlocked } from './gaming';
import { getStampsBonusByEffect } from '@parsers/stamps';
import { getGrimoireBonus } from '@parsers/grimoire';
import { getCompassBonus } from '@parsers/compass';

export const getAtoms = (idleonData, account) => {
  const atomsRaw = tryToParse(idleonData?.Atoms) || idleonData?.Atoms
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  return parseAtoms(divinityRaw, atomsRaw, account);
}

const parseAtoms = (divinityRaw, atomsRaw, account) => {
  const localAtoms = atomsRaw ?? [];
  const particles = divinityRaw?.[39];
  const atoms = atomsInfo?.map((atomInfo, index) => {
    const level = localAtoms?.[index] ?? 0;
    const atomColliderLevel = account?.towers?.data?.[8]?.level ?? 0;
    const atomReductionFromAtom = atomsRaw?.[9] ?? 0;
    const bubbleBonus = getBubbleBonus(account, 'ATOM_SPLIT', false)
    const reduxSuperbit = isSuperbitUnlocked(account, 'Atom_Redux')?.unlocked ?? 0;
    const maxLevelSuperbit = isSuperbitUnlocked(account, 'Isotope_Discovery') ?? 0;
    const stampBonusReduction = getStampsBonusByEffect(account, 'Lower_Atom_Upgrade_Costs');
    const compassBonus = getCompassBonus(account, 53);
    const maxLevel = Math.round(20 + (10 * (maxLevelSuperbit ? 1 : 0) + compassBonus));

    const costObject = {
      account,
      atomReductionFromAtom,
      reduxSuperbit,
      bubbleBonus,
      atomColliderLevel,
      stampBonusReduction,
      atomInfo,
      level
    };
    const cost = getCost(costObject);
    const nextLeveCost = getCost({ ...costObject, level: level + 1 });
    const costToMax = getCostToMax({ ...costObject, maxLevel })

    const bonus = parseAtomBonus(atomInfo, level, account);
    return {
      level,
      maxLevel,
      rawName: `Atom${index}`, ...(atomsInfo?.[index] || {}),
      cost: Math.floor(cost),
      nextLeveCost: Math.floor(nextLeveCost),
      costToMax: Math.floor(costToMax),
      bonus
    }
  });
  const daysSinceUsed = account?.accountOptions?.[134];
  const stampReducer = atoms?.find(({ name }) => name === 'Hydrogen_-_Stamp_Decreaser');
  const value = Math.min(90, (stampReducer?.level ?? 0) * daysSinceUsed);

  return {
    particles,
    atoms,
    stampReducer: value
  }
}

const getCost = ({
                   account,
                   atomReductionFromAtom,
                   reduxSuperbit,
                   bubbleBonus,
                   atomColliderLevel,
                   stampBonusReduction,
                   atomInfo,
                   level
                 }) => {
  // 'AtomCost' == e
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 51);
  const compassBonus = getCompassBonus(account, 50);
  const baseCost = (1 / (1 + (stampBonusReduction + atomReductionFromAtom + 10 * (reduxSuperbit ? 1 : 0)
    + (grimoireBonus + compassBonus) + bubbleBonus + atomColliderLevel / 10 + 7 * account?.tasks?.[2][4][6]) / 100));
  return baseCost * (atomInfo?.x3 + atomInfo?.x1 * level) * Math.pow(atomInfo?.x2, level);
}
const getCostToMax = (costObject) => {
  let total = 0;
  for (let i = costObject?.level; i < costObject?.maxLevel; i++) {
    total += getCost(({ ...costObject, level: i }));
  }
  return total
}

const parseAtomBonus = (atomInfo, level, account) => {
  if (atomInfo?.name === 'Fluoride_-_Void_Plate_Chef') {
    const voidMeals = account?.cooking?.meals?.reduce((res, { level }) => level >= 30 ? res + 1 : res, 0);
    return 100 * (Math.pow(1 + atomInfo?.baseBonus * level / 100, voidMeals) - 1);
  } else if (atomInfo?.name === 'Carbon_-_Wizard_Maximizer') {
    return atomInfo?.baseBonus * account?.towers?.wizardOverLevels;
  }
}

export const getAtomBonus = (account, name) => {
  const allAtoms = account?.atoms?.atoms;
  return allAtoms?.filter((atom) => {
    return atom?.name === name;
  }).map((atom) => {
    if (name === 'Fluoride_-_Void_Plate_Chef') {
      return atom?.bonus
    } else if (name === 'Carbon_-_Wizard_Maximizer') {
      return atom?.baseBonus * account?.towers?.wizardOverLevels;
    } else {
      return atom?.level * atom?.baseBonus;
    }
  })?.[0];
}

export const getAtomColliderThreshold = (threshold) => {
  return 0 === threshold ? 15e6 : 1 === threshold
    ? 25e6 : 2 === threshold ? 1e8 : 3 === threshold ? 25e7 : 105e7;
}

export const calcTotalAtomLevels = (atoms) => {
  return atoms?.reduce((sum, { level }) => sum + level, 0);
}