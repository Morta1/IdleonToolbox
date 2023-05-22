import { tryToParse } from "../utility/helpers";
import { atomsInfo } from "../data/website-data";
import { getBubbleBonus } from "./alchemy";
import { isSuperbitUnlocked } from "./gaming";

export const getAtoms = (idleonData, account) => {
  const atomsRaw = tryToParse(idleonData?.Atoms) || idleonData?.Atoms
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  return parseAtoms(divinityRaw, atomsRaw, account);
}

const parseAtoms = (divinityRaw, atomsRaw, account) => {
  const localAtoms = atomsRaw ?? [];
  const particles = Math.floor(divinityRaw?.[39]);
  const atoms = atomsInfo?.map((atomInfo, index) => {
    const level = localAtoms?.[index];
    const atomColliderLevel = account?.towers?.data?.[8]?.level ?? 0;
    const atomReductionFromAtom = atomsRaw?.[9] ?? 0;
    const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'ATOM_SPLIT', false)
    const reduxSuperbit = isSuperbitUnlocked(account, 'Atom_Redux')?.unlocked ?? 0;
    const maxLevelSuperbit = isSuperbitUnlocked(account, 'Isotope_Discovery') ?? 0;
    const maxLevel = Math.round(20 + 10 * (+!!maxLevelSuperbit));

    const cost = (1 / (1 + (atomReductionFromAtom + 10 * (reduxSuperbit ? 1 : 0) + bubbleBonus + atomColliderLevel / 10 + 7
        * account?.tasks?.[2][4][6]) / 100))
      * (atomInfo?.x3 + atomInfo?.x1 * level) * Math.pow(atomInfo?.x2, level);

    const bonus = parseAtomBonus(atomInfo, level, account);
    return { level, maxLevel, rawName: `Atom${index}`, ...(atomsInfo?.[index] || {}), cost: Math.floor(cost), bonus }
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

const parseAtomBonus = (atomInfo, level, account) => {
  if (atomInfo?.name === 'Fluoride_-_Void_Plate_Chef') {
    const voidMeals = account?.cooking?.meals?.reduce((res, { level }) => level >= 30 ? res + 1 : res, 0);
    return 100 * (Math.pow(1 + atomInfo?.baseBonus * level / 100, voidMeals) - 1);
  } else if (atomInfo?.name === 'Carbon_-_Wizard_Maximizer') {
    return 2 * account?.towers?.wizardOverLevels;
  }
}

export const getAtomBonus = (atoms, name) => {
  return atoms?.filter((atom) => {
    return atom?.name === name;
  }).map((atom) => {
    if (name === 'Fluoride_-_Void_Plate_Chef' || name === 'Carbon_-_Wizard_Maximizer') {
      return atom?.bonus
    } else {
      return atom?.level * atom?.baseBonus;
    }
  })?.[0];
}

export const getAtomColliderThreshold = (threshold) => {
  return 0 === threshold ? 15e6 : 1 === threshold
    ? 25e6 : 2 === threshold ? 1e8 : 3 === threshold ? 25e7 : 105e7;
}