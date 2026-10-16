import { gameTable } from '../data.mjs';

// Each upgrade's bonus term: the petUpgradeBonus table, the per-index arms of Breeding("PetUpgBONUS"). A `level` arm
// is the bare level and an `affine` one is base + perLevel x level. No table or no arm, no term.
const bonusTerm = (bonus) => {
  if (bonus?.form === 'level') return { formula: 'linear', args: { perLevel: 1 } };
  if (bonus?.form === 'linear') return { formula: 'linear', args: { perLevel: bonus.perLevel } };
  if (bonus?.form === 'affine') return { formula: 'growth', args: { func: 'bigBase', x1: bonus.base, x2: bonus.perLevel } };
  if (bonus?.form === 'ceilPow') return { formula: 'ceilPow', args: { scale: bonus.scale, exponent: bonus.exponent } };
  return null;
};

// Rarity of the Egg is the arm the game also multiplies by min(2, 1 + achievementRate x status) of an achievement
// (Gilded Shells), which is player data, so the page names the achievement and its once-earned multiplier.
const achievementField = (index, data) => {
  const bonus = gameTable(data, 'petUpgradeBonus')?.[index];
  const achievement = bonus?.achievement === undefined ? null : data.achievements?.[bonus.achievement];
  return achievement
    ? { label: `With the ${achievement.name.replace(/_/g, ' ')} achievement`, value: `x${(1 + bonus.achievementRate).toFixed(2)}` }
    : null;
};

// The upgrade Breeding("PetUpgMaxLV") adds Minehead("BonusQTY", 3) to: the petUpgradeMaxLevel table. No table, every
// upgrade is capped at its data max level.
const raisedUpgrade = (data) => gameTable(data, 'petUpgradeMaxLevel')?.upgrade;

// UPKEEP: the grid greys slot t (upgrade t + 1) below Breeding level 5t + 5 * max(0, t - 6). Not extracted: no handler computes it, only the grid's draw code compares Lv0[11] with it.
const breedingLevelFor = (index) => 5 * (index - 1) + 5 * Math.max(0, index - 7);

const mealOf = (entry, data) => String(data.cookingMenu?.[entry.foodIndex]?.name ?? '').replace(/_/g, ' ');

export default {
  kind: 'petupgrade',
  section: 'petUpgrades',
  key: (entry, index) => `PetUpgrade${index}`,
  // UPKEEP: Gene Splicing's name carries a `}` and a hint after it; the name is the part before.
  name: (entry) => entry.name.split(/_*\}/)[0],
  // UPKEEP: the art is offset by one (PetUpg<i - 1>), because row 0 is not an upgrade.
  icon: (entry, index) => `/data/PetUpg${index - 1}.png`,
  fallbackIcon: '/data/ClassIcons52.png',
  // UPKEEP: row 0 is the panel shown with nothing selected.
  skip: (entry, index) => (index === 0 ? 'the empty selection panel, not an upgrade' : false),
  // The prose, then the effect line the panel prints under it.
  describe: (entry) => `${entry.description}@${entry.boostEffect}`,
  effect: (entry, index, data) => {
    const term = bonusTerm(gameTable(data, 'petUpgradeBonus')?.[index]);
    return {
      levelLabel: 'Upgrade level',
      cap: index === raisedUpgrade(data) ? null : entry.maxLevel,
      terms: term ? [{ token: '}', ...term }] : []
    };
  },
  // PetUpgCostREAL: the meal is cost 1 and the Dead Cells cost 0. Nothing in it is a discount.
  cost: (entry, index, data) => [
    { formula: 'linearPowFromOne', args: { base: entry.baseCost, rate: entry.costScale }, currency: mealOf(entry, data), note: 'No discounts apply.' },
    { formula: 'linearPowFromOne', args: { base: entry.baseMatCost, rate: entry.costMatScale }, currency: 'Dead Cells', currencyIcon: '/data/PetDeadCell.png', note: 'No discounts apply.' }
  ],
  fields: (entry, index, data) => [
    ...(breedingLevelFor(index) > 0 ? [{ label: 'Breeding level needed', value: breedingLevelFor(index) }] : []),
    achievementField(index, data),
    ...(index === raisedUpgrade(data) ? [{ label: 'Base max level', value: `${entry.maxLevel} (raised by Mr. Minehead)` }] : [])
  ].filter(Boolean),
  // UPKEEP: the meal page is named by its position in the cooking menu (CookingM<foodIndex>), as mealNodes builds it.
  costs: (entry) => [{ node: `meal:CookingM${entry.foodIndex}`, qty: entry.baseCost }]
};
