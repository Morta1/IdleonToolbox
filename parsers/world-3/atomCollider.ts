
import { atomsInfo } from '@website-data';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { isSuperbitUnlocked, getPaletteBonus } from '@parsers/world-5/gaming';
import { getStampsBonusByEffect } from '@parsers/world-1/stamps';
import { getGrimoireBonus } from '@parsers/class-specific/grimoire';
import { getCompassBonus } from '@parsers/class-specific/compass';
import { getEventShopBonus } from '@parsers/misc';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getMenagerieBoost, isMenagerieUnlockOwned } from '@parsers/world-7/menagerie';
import type { IdleonData, Account } from '../types';
import { saveField } from '@parsers/saveField';
import { OPT } from '@parsers/accountOptions';
import { NUMBERED_GROUP, additiveGroup, createBreakdown, flat, percent } from '@parsers/breakdown';

export const getAtoms = (idleonData: IdleonData, account: Account) => {
  const atomsRaw = saveField(idleonData, 'Atoms') || idleonData?.Atoms
  const divinityRaw = saveField(idleonData, 'Divinity') || idleonData?.Divinity;
  return parseAtoms(divinityRaw, atomsRaw, account);
}

// AtomInfo indices whose AtomBonuses value is not simply level x baseBonus
const HYDROGEN_INDEX = 0;
const CARBON_INDEX = 5;
const FLUORIDE_INDEX = 8;
const NEON_INDEX = 9;
const MAX_STAMP_REDUCTION = 90;
const WIZARD_DAMAGE_PER_OVER_LEVEL = 2;
const VOID_PLATE_MEAL_LEVEL = 30;
// game: AtomCost floors the cost only below this
const UNFLOORED_ATOM_COST = 1e6;

// game: AtomCollider("AtomBonuses", index). Hydrogen grows per day since the last stamp max-lv upgrade
// (capped at 90), Carbon is +2% wizard damage per tower level above 50 (its level only raises the cap),
// Fluoride is a cooking speed multiplier compounding once per Lv 30+ meal.
const calcAtomBonus = (index: number, level: number, account: Account) => {
  const baseBonus = level * (atomsInfo?.[index]?.baseBonus ?? 0);
  if (index === HYDROGEN_INDEX) {
    return Math.min(MAX_STAMP_REDUCTION, baseBonus * Number(account?.accountOptions?.[OPT.hydrogenDays] ?? 0));
  }
  if (index === CARBON_INDEX) {
    return WIZARD_DAMAGE_PER_OVER_LEVEL * (account?.towers?.wizardOverLevels ?? 0);
  }
  if (index === FLUORIDE_INDEX) {
    const voidMeals = account?.cooking?.meals?.filter((meal: any) => meal?.level >= VOID_PLATE_MEAL_LEVEL)?.length ?? 0;
    return Math.pow(1 + baseBonus / 100, voidMeals);
  }
  return baseBonus;
}

// The atom panel's "Total bonus" text: Fluoride shows its multiplier as a percent (Math.max(0, 100 * (x - 1)))
const getAtomBonusDisplay = (index: number, value: number) => index === FLUORIDE_INDEX
  ? Math.max(0, 100 * (value - 1))
  : value;

const parseAtoms = (divinityRaw: any, atomsRaw: any, account: Account) => {
  const localAtoms = atomsRaw ?? [];
  const particles = divinityRaw?.[39] ?? 0;
  const costCut = getAtomCostCut(account, localAtoms?.[NEON_INDEX] ?? 0);
  const maxLevelBreakdown = getAtomMaxLevelBreakdown(account);
  const maxLevel = maxLevelBreakdown.totalValue;
  const atoms = atomsInfo?.map((atomInfo, index) => {
    const level = localAtoms?.[index] ?? 0;
    const costObject = { multi: costCut.multi, atomInfo, level };
    const cost = getCost(costObject);
    const nextLeveCost = getCost({ ...costObject, level: level + 1 });
    const costToMax = getCostToMax({ ...costObject, maxLevel });

    const value = calcAtomBonus(index, level, account);
    return {
      level,
      maxLevel,
      rawName: `Atom${index}`, ...(atomsInfo?.[index] || {}),
      cost,
      nextLeveCost,
      costToMax,
      value,
      bonus: getAtomBonusDisplay(index, value)
    }
  });

  // game: "AtomCollider:AtomsAvailableAtAll" - 11 base atoms plus one per unlock source. The atoms past that count are
  // locked, in their order
  const unlockSources = [
    { name: 'Compass upgrade 47', unlocked: Math.min(1, getCompassBonus(account, 47)) > 0 },
    { name: 'Compass upgrade 58', unlocked: Math.min(1, getCompassBonus(account, 58)) > 0 },
    { name: 'Jelly Operator', unlocked: Math.min(1, getJellyBonus(account, 17)) > 0 },
    { name: 'Minehead', unlocked: Math.min(1, getMineheadBonusQTY(account, 7)) > 0 },
    { name: 'Sushi Station', unlocked: Math.min(1, getSushiBonus(account, 22)) > 0 },
    { name: 'Menagerie', unlocked: isMenagerieUnlockOwned(account, 16) }
  ];
  const totalAtomsAvailable = Math.round(BASE_ATOMS + unlockSources.filter(({ unlocked }) => unlocked).length);

  return {
    particles,
    atoms: atoms.map((atom, index) => ({ ...atom, locked: index >= totalAtomsAvailable })),
    totalAtomsAvailable,
    unlockSources,
    costCut,
    maxLevelBreakdown,
    stampReducer: atoms?.[HYDROGEN_INDEX]?.value ?? 0
  }
}

const BASE_ATOMS = 11;
const BASE_MAX_LEVEL = 20;

// game: AtomMaxLv, 20 plus its sources
const getAtomMaxLevelBreakdown = (account: Account) => {
  const superbit = isSuperbitUnlocked(account, 'Isotope_Discovery') ? 10 : 0;
  const compass = getCompassBonus(account, 53);
  const eventShop = getEventShopBonus(account, 28) ? 20 : 0;
  const menagerie = getMenagerieBoost(account, 17);
  const value = Math.round(BASE_MAX_LEVEL + superbit + compass + eventShop + menagerie);
  return createBreakdown('Atom max level', value, [
    flat('Base', BASE_MAX_LEVEL),
    flat('Isotope Discovery (Superbit)', superbit),
    flat('Compass', compass),
    flat('Event shop', eventShop),
    flat('Menagerie', menagerie)
  ], { combine: 'sum' });
};

// game: AtomCost's divisor, 1 + the sum of every atom cost cut / 100, the same for every atom
export const getAtomCostCut = (account: Account, neonLevel: number) => {
  const sources = [
    percent('Palette', getPaletteBonus(account, 35)),
    percent('Stamps', getStampsBonusByEffect(account, 'Lower_Atom_Upgrade_Costs')),
    percent('Neon (Atom)', calcAtomBonus(NEON_INDEX, neonLevel, account)),
    percent('Atom Redux (Superbit)', 10 * ((isSuperbitUnlocked(account, 'Atom_Redux')?.unlocked ?? 0) ? 1 : 0)),
    percent('Grimoire', getGrimoireBonus((account as any)?.grimoire?.upgrades, 51)),
    percent('Compass', getCompassBonus(account, 50)),
    percent('Atom Split (Bubble)', getBubbleBonus(account, 'ATOM_SPLIT', false)),
    percent('Atom Collider level', ((account as any)?.towers?.data?.[8]?.level ?? 0) / 10),
    percent('Merit', 7 * ((account as any)?.tasks?.[2]?.[4]?.[6] ?? 0)),
    percent('Bubba', (account as any)?.bubba?.bonuses?.atomCost?.bonus ?? 0)
  ];
  // The game's own order, grimoire and compass added together first: a float sum in another order moves the last digit
  const [palette, stamps, neon, redux, grimoire, compass, bubble, collider, merit, bubba] = sources.map(({ value }: any) => Number(value) || 0);
  const sum = palette + stamps + neon + redux + (grimoire + compass) + bubble + collider + merit + bubba;
  const multi = 1 / (1 + sum / 100);
  return { sum, multi, breakdown: createBreakdown('Atom cost divisor', 1 + sum / 100, [additiveGroup(NUMBERED_GROUP, sources)]) };
};

const getCost = ({ multi, atomInfo, level }: any) => {
  // 'AtomCost' == e
  const cost = multi * (atomInfo?.x3 + atomInfo?.x1 * level) * Math.pow(atomInfo?.x2, level);
  return cost < UNFLOORED_ATOM_COST ? Math.floor(cost) : cost;
}
const getCostToMax = (costObject: any) => {
  let total = 0;
  for (let i = costObject?.level; i < costObject?.maxLevel; i++) {
    total += getCost(({ ...costObject, level: i }));
  }
  return total
}

// game: AtomCollider("AtomBonuses", index), looked up by atom name
export const getAtomBonus = (account: Account, name: string): number => {
  const atom: any = account?.atoms?.atoms?.find((atom: any) => atom?.name === name);
  return atom?.value ?? 0;
}

export const getAtomColliderThreshold = (threshold: number) => {
  return 0 === threshold ? 15e6 : 1 === threshold
    ? 25e6 : 2 === threshold ? 1e8 : 3 === threshold ? 25e7 : 105e7;
}

export const calcTotalAtomLevels = (atoms: any[]) => {
  return atoms?.reduce((sum, { level }) => sum + level, 0);
}