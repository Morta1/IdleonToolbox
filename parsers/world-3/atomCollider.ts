import { tryToParse } from '@utility/helpers';
import { atomsInfo } from '@website-data';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { isSuperbitUnlocked, getPaletteBonus } from '@parsers/world-5/gaming';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getCompassBonus } from '@parsers/class-specific/compass';
import { getEventShopBonus } from '@parsers/misc';
import type { IdleonData, Account } from '../types';

export const getAtoms = (idleonData: IdleonData, account: Account) => {
  const atomsRaw = tryToParse(idleonData?.Atoms) || idleonData?.Atoms
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  return parseAtoms(divinityRaw, atomsRaw, account);
}

const parseAtoms = (divinityRaw: any, atomsRaw: any, account: Account) => {
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
    const eventShopBonus = getEventShopBonus(account, 28) ? 20 : 0;
    const maxLevel = Math.round(20 + (10 * (maxLevelSuperbit ? 1 : 0) + compassBonus + eventShopBonus));
    

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
  const value = Math.min(90, (stampReducer?.level ?? 0) * Number(daysSinceUsed));

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
                 }: any) => {
  // 'AtomCost' == e
  const grimoireBonus = getGrimoireBonus(account?.grimoire?.upgrades, 51);
  const compassBonus = getCompassBonus(account, 50);
  const paletteBonus = getPaletteBonus(account, 35);
  const bubbaAtomCostBonus = account?.bubba?.bonuses?.atomCost?.bonus ?? 0;
  const baseCost = (1 / (1 + (paletteBonus + stampBonusReduction + atomReductionFromAtom + 10 * (reduxSuperbit ? 1 : 0)
    + (grimoireBonus + compassBonus) + bubbleBonus + atomColliderLevel / 10 + 7 * account?.tasks?.[2][4][6] + bubbaAtomCostBonus) / 100));
  return baseCost * (atomInfo?.x3 + atomInfo?.x1 * level) * Math.pow(atomInfo?.x2, level);
}
const getCostToMax = (costObject: any) => {
  let total = 0;
  for (let i = costObject?.level; i < costObject?.maxLevel; i++) {
    total += getCost(({ ...costObject, level: i }));
  }
  return total
}

const parseAtomBonus = (atomInfo: any, level: number, account: Account) => {
  if (atomInfo?.name === 'Fluoride_-_Void_Plate_Chef') {
    const voidMeals = account?.cooking?.meals?.reduce((res: any, { level }: any) => level >= 30 ? res + 1 : res, 0);
    return 100 * (Math.pow(1 + atomInfo?.baseBonus * level / 100, voidMeals) - 1);
  } else if (atomInfo?.name === 'Carbon_-_Wizard_Maximizer') {
    return atomInfo?.baseBonus * account?.towers?.wizardOverLevels;
  }
}

export const getAtomBonus = (account: Account, name: string) => {
  const allAtoms = account?.atoms?.atoms;
  return allAtoms?.filter((atom: any) => {
    return atom?.name === name;
  }).map((atom: any) => {
    if (name === 'Fluoride_-_Void_Plate_Chef') {
      return atom?.bonus
    } else if (name === 'Carbon_-_Wizard_Maximizer') {
      return atom?.baseBonus * account?.towers?.wizardOverLevels;
    } else {
      return atom?.level * atom?.baseBonus;
    }
  })?.[0];
}

export const getAtomColliderThreshold = (threshold: number) => {
  return 0 === threshold ? 15e6 : 1 === threshold
    ? 25e6 : 2 === threshold ? 1e8 : 3 === threshold ? 25e7 : 105e7;
}

export const calcTotalAtomLevels = (atoms: any[]) => {
  return atoms?.reduce((sum, { level }) => sum + level, 0);
}