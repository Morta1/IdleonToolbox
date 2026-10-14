// UPKEEP: Breeding("PetUpgBONUS") hardcodes each upgrade's bonus by table index (Breeding.js:259-285, breeding.ts calcUpgradeBonus).
// The table's bonusQuantity column disagrees on 5 and 11, so the game's numbers are copied here.
const BONUS_TERMS = {
  1: { formula: 'linear', args: { perLevel: 4 } },
  2: { formula: 'linear', args: { perLevel: 1 } },
  3: { formula: 'linear', args: { perLevel: 25 } },
  4: { formula: 'linear', args: { perLevel: 1 } },
  // The game also multiplies this by min(2, 1 + 0.1 * status) from achievement 221 (Gilded Shells, 1.10x), which is player data.
  5: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.25 } },
  6: { formula: 'linear', args: { perLevel: 6 } },
  7: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.15 } },
  8: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 2 } },
  9: { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.02 } },
  10: { formula: 'linear', args: { perLevel: 10 } },
  11: { formula: 'ceilPow', args: { scale: 12, exponent: 0.698 } },
  12: { formula: 'linear', args: { perLevel: 5 } }
};

// UPKEEP: Rarity of the Egg is table index 5, and breeding.ts multiplies it by the status of achievement 221 (1.10x once earned).
const RARITY_OF_THE_EGG = 5;
const EGG_RARITY_ACHIEVEMENT = 221;

// UPKEEP: PetUpgMaxLV adds Minehead("BonusQTY", 3) to the upgrade at table index 6 (Blooming Axe) only.
const BLOOMING_AXE = 6;

// UPKEEP: the grid greys slot t (upgrade t + 1) below Breeding level 5t + 5 * max(0, t - 6).
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
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    cap: index === BLOOMING_AXE ? null : entry.maxLevel,
    terms: [{ token: '}', ...BONUS_TERMS[index] }]
  }),
  // PetUpgCostREAL: the meal is cost 1 and the Dead Cells cost 0. Nothing in it is a discount.
  cost: (entry, index, data) => [
    { formula: 'linearPowFromOne', args: { base: entry.baseCost, rate: entry.costScale }, currency: mealOf(entry, data), note: 'No discounts apply.' },
    { formula: 'linearPowFromOne', args: { base: entry.baseMatCost, rate: entry.costMatScale }, currency: 'Dead Cells', note: 'No discounts apply.' }
  ],
  fields: (entry, index, data) => [
    ...(breedingLevelFor(index) > 0 ? [{ label: 'Breeding level needed', value: breedingLevelFor(index) }] : []),
    ...(index === RARITY_OF_THE_EGG ? [{ label: `With the ${data.achievements[EGG_RARITY_ACHIEVEMENT].name.replace(/_/g, ' ')} achievement`, value: 'x1.10' }] : []),
    ...(index === BLOOMING_AXE ? [{ label: 'Base max level', value: `${entry.maxLevel} (raised by Mr. Minehead)` }] : [])
  ],
  // UPKEEP: the meal page is named by its position in the cooking menu (CookingM<foodIndex>), as mealNodes builds it.
  costs: (entry) => [{ node: `meal:CookingM${entry.foodIndex}`, qty: entry.baseCost }]
};
