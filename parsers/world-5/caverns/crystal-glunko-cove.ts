import { commaNotation, lavaLog, notateNumber } from '@utility/helpers';
import { items, randomList2 } from '@website-data';
import { getSchematicBonus } from '@parsers/world-5/caverns/the-well';

// Cavern 18 — Crystal Glunko Cove. Mirrors N.js customBlock_Holes2 Cglunko_* handlers.
// Cove upgrade level t (0..23) lives in OptionsListAccount[630 + t]; gooey shapes (the cove currency)
// in OptionsListAccount[654 + shapeId] (0..11). randomList2 holds the cove definitions:
//   [11] names, [12] descriptions, [13] bonus-per-level, [14] cost base.
const COVE_UPGRADE_COUNT = 24;
const SHAPE_COUNT = 12;
const UPGRADE_OPTION_OFFSET = 630; // OptionsListAccount[630 + t] = upgrade level
const SHAPE_OPTION_OFFSET = 654;   // OptionsListAccount[654 + shapeId] = shapes owned

// Cglunko_upgBon: total bonus for upgrade t = level * bonusPerLevel.
export const getCglunkoBonus = (account: any, t: number): number =>
  (account?.accountOptions?.[UPGRADE_OPTION_OFFSET + t] ?? 0) * Number(randomList2?.[13]?.[t] ?? 0);

// Cglunko_upgCost: pow(costBase, level) + level, discounted by upgrade 7, with a 5x surcharge on odd indices.
const getCglunkoUpgCost = (account: any, t: number): number => {
  const level = account?.accountOptions?.[UPGRADE_OPTION_OFFSET + t] ?? 0;
  const costBase = Number(randomList2?.[14]?.[t] ?? 0);
  let cost = (Math.pow(costBase, level) + level) * (1 / (1 + getCglunkoBonus(account, 7) / 100));
  if (t % 2 === 1) cost *= 5;
  return cost < 1e6 ? Math.floor(Math.max(1, cost)) : cost;
};

const getShapesOwned = (account: any): number[] =>
  Array.from({ length: SHAPE_COUNT }, (_, i) => Math.max(0, account?.accountOptions?.[SHAPE_OPTION_OFFSET + i] ?? 0));

// Cglunko_Bdig: sum of digit-counts of the 6 blue shapes (OptionsListAccount[654..659]).
const getCglunkoBdig = (account: any): number => {
  let sum = 0;
  for (let i = 654; i <= 659; i++) sum += Math.ceil(lavaLog(account?.accountOptions?.[i] ?? 0));
  return sum;
};
// Cglunko_Pdig: sum of digit-counts of the 6 purp shapes (OptionsListAccount[660..665]).
const getCglunkoPdig = (account: any): number => {
  let sum = 0;
  for (let i = 660; i <= 665; i++) sum += Math.ceil(lavaLog(account?.accountOptions?.[i] ?? 0));
  return sum;
};

// Cglunko_DR: drop-rate multiplier active while a character is in Cavern 18.
const getCglunkoDropRate = (account: any): number => {
  const uB = (t: number) => getCglunkoBonus(account, t);
  const opt = (i: number) => account?.accountOptions?.[i] ?? 0;
  return (1 + (uB(1) + uB(17) + uB(21)) / 100)
    * (1 + uB(3) / 100)
    * (1 + uB(12) / 100)
    * (1 + (uB(10) * getCglunkoBdig(account)) / 100)
    * (1 + (uB(22) * getCglunkoPdig(account)) / 100)
    * (1 + (uB(4) * Math.ceil(lavaLog(opt(668)))) / 100)
    * (1 + (uB(18) * Math.ceil(lavaLog(opt(200)))) / 100);
};

// Cglunko_AFKgains: AFK-gains rate (fraction) while in Cavern 18.
const getCglunkoAfkGains = (account: any): number =>
  (10 + (getCglunkoBonus(account, 8) + getCglunkoBonus(account, 13))) / 100;

// Cglunko_DoublePickup: chance (0..3) to double-pick shapes, from schematics 101/103/105.
const getCglunkoDoublePickup = (holesObject: any): number =>
  Math.min((getSchematicBonus({ holesObject, t: 101, i: 10 })
    + getSchematicBonus({ holesObject, t: 103, i: 10 })
    + getSchematicBonus({ holesObject, t: 105, i: 10 })) / 100, 3);

const formatCoveDescription = (raw: string, bonus: number): string => {
  let desc = (raw || '').replace(/_/g, ' ');
  desc = desc.replaceAll('{', String(commaNotation(bonus)));
  desc = desc.replaceAll('}', String(notateNumber(1 + bonus / 100, 'MultiplierInfo')).replace('#', ''));
  desc = desc.replaceAll('$', String(commaNotation(bonus)));
  return desc;
};

export const getCrystalGlunkoCove = (holesObject: any, accountData: any) => {
  const names = randomList2?.[11] ?? [];
  const descriptions = randomList2?.[12] ?? [];
  const upgrades = names.slice(0, COVE_UPGRADE_COUNT).map((rawName: string, t: number) => {
    const bonus = getCglunkoBonus(accountData, t);
    // The Cove splits its 24 upgrades into two tabs (N.js GenINFO[270]):
    //   t 0..11  → Crystal (Gooey shapes 654..659),  t 12..23 → Jeweled (Quartz shapes 660..665).
    // Each upgrade is paid in one specific gooey shape; 2 upgrades share a shape (odd one has the 5x surcharge).
    const group = t < COVE_UPGRADE_COUNT / 2 ? 'crystal' : 'jeweled';
    const shapeId = Math.floor((t % 12) / 2) + 6 * Math.floor(t / 12);
    const shapeName = `HoleGshape${shapeId}`;
    // Each upgrade is LOCKED until its required shape is found (N.js: 0 >= OptionsListAccount[654 + shapeId]).
    const shapeOwned = Math.max(0, accountData?.accountOptions?.[SHAPE_OPTION_OFFSET + shapeId] ?? 0);
    const requirement = ((items as any)?.[shapeName]?.displayName || shapeName)
      .replace('_(Dungeon)', '').replace(/_/g, ' ');
    return {
      index: t,
      name: (rawName || '').replace(/_/g, ' '),
      level: accountData?.accountOptions?.[UPGRADE_OPTION_OFFSET + t] ?? 0,
      bonus,
      bonusPerLevel: Number(randomList2?.[13]?.[t] ?? 0),
      costBase: Number(randomList2?.[14]?.[t] ?? 0),
      cost: getCglunkoUpgCost(accountData, t),
      group,
      shapeId,
      shapeName,
      shapeOwned,
      unlocked: shapeOwned > 0,
      requirement,
      description: formatCoveDescription(descriptions?.[t], bonus)
    };
  });
  const shapes = getShapesOwned(accountData).map((owned, index) => ({
    index,
    name: `HoleGshape${index}`,
    owned
  }));

  return {
    upgrades,
    shapes,
    dropRate: getCglunkoDropRate(accountData),
    afkGains: getCglunkoAfkGains(accountData),
    multiKillTier: getCglunkoBonus(accountData, 6),
    multiKillBase: getCglunkoBonus(accountData, 15),
    respawn: getCglunkoBonus(accountData, 2),
    doublePickup: getCglunkoDoublePickup(holesObject),
    bdig: getCglunkoBdig(accountData),
    pdig: getCglunkoPdig(accountData)
  };
};
