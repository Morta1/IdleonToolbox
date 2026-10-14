// The "what does it do" strings the wiki shows, kept free of React, MUI and game data so the
// bot index builder (plain node) can use the exact same wording the pages do.
const roundTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const cleanUnderscore = (str) => (str ? String(str).replace(/_/g, ' ') : '');

// _customBlock_ArbitraryCode5Inputs, with null for a function name it has no case for.
const growthCurve = (func, level, x1, x2) => {
  let result;
  switch (func) {
    case 'add':
      if (x2 !== 0) {
        result = (((x1 + x2) / x2 + 0.5 * (level - 1)) / (x1 / x2)) * level * x1;
      }
      else {
        result = x1 * level;
      }
      break;
    case 'addLower':
      result = x1 + x2 * (level + 1);
      break;
    case 'addDECAY':
      if (level < 50001) {
        result = x1 * level;
      }
      else {
        result = x1 * Math.min(50000, level) + ((level - 50000) / (level - 50000 + 150000)) * x1 * 50000;
      }
      break;
    case 'decay':
      result = (x1 * level) / (level + x2);
      break;
    case 'decayLower':
      result = (x1 * (level + 1)) / (level + 1 + x2) - (x1 * level) / (level + x2);
      break;
    case 'decayMulti':
      result = 1 + (x1 * level) / (level + x2);
      break;
    case 'decayMultiLower':
      result = (x1 * (level + 1)) / (level + 1 + x2) - (x1 * level) / (level + x2);
      break;
    case 'bigBase':
      result = x1 + x2 * level;
      break;
    case 'bigBaseLower':
      result = x2;
      break;
    case 'intervalAdd':
      result = x1 + Math.floor(level / x2);
      break;
    case 'intervalAddLower':
      result = Math.max(Math.floor((level + 1) / x2), 0) - Math.max(Math.floor(level / x2), 0);
      break;
    case 'reduce':
      result = x1 - x2 * level;
      break;
    case 'reduceLower':
      result = x1 - x2 * (level + 1);
      break;
    case 'PtsSpentOnGuildBonus':
      result = (((x1 + x2) / x2 + 0.5 * (level - 1)) / (x1 / x2)) * level * x1 - x2 * level;
      break;
    case 'special1':
      result = 100 - (level * x1) / (level + x2);
      break;
    default:
      result = null;
  }
  return result;
};

// The game answers 0 for a function it does not know, and every parser caller relies on that.
export const growth = (func, level, x1, x2, shouldRound = true, _unused5) => {
  const result = growthCurve(func, level, x1, x2) ?? 0;
  return shouldRound ? roundTwo(result) : result;
};

// Every shape of level formula a wiki page fills in. A node names one per placeholder and carries
// its constants; nothing is ever evaluated from a string, so a new shape of game formula is a new
// named entry here with its own test.
export const FORMULAS = {
  // _customBlock_ArbitraryCode5Inputs: talents, bubbles, vials and most tables with a func column.
  // "txt" and "_" mean that half has no number; they, and any name growth has no case for, give
  // null rather than the game's 0 so the token stays in the sentence.
  growth: (level, { func, x1, x2 }) => growthCurve(func, level, x1, x2),
  linear: (level, { perLevel }) => perLevel * level,
  pow: (level, { base, rate }) => base * Math.pow(rate, level),
  linearPow: (level, { base, rate }) => base * level * Math.pow(rate, level),
  // Approaches 100 and never reaches it, floored to two decimals the way the game prints it.
  diminishingPercent: (level, { perLevel }) => Math.floor(1e4 * (1 - 1 / (1 + (perLevel * level) / 100))) / 100,
  // Poppy's first upgrade: its cost also scales with (1 + its own level), so level one is not free.
  linearPowFromOne: (level, { base, rate }) => base * (level + 1) * Math.pow(rate, level),
  // The Tar Pit adds the current level on top of the exponential.
  powPlusLevel: (level, { base, rate }) => level + base * Math.pow(rate, level),
  // One bonus per level, handed out in turn over `period` bonuses (Poppy's real-game bonuses).
  roundRobin: (level, { perStep, offset, period }) => perStep * Math.max(0, Math.ceil((level - offset) / period)),
  // Atom upgrade cost (AtomCost): an affine base times a power, floored below a million as the game floors it.
  // UPKEEP: 1e6 is the game's own floor threshold in atomCollider.ts getCost; re-check it on a game patch.
  affinePowFloor: (level, { base, perLevel, rate }) => {
    const cost = (base + perLevel * level) * Math.pow(rate, level);
    return cost < 1e6 ? Math.floor(cost) : cost;
  },
  // Shrine level-up time (ShrineHrREQ) in hours of shrine progress; level 0 is the unplaced shrine and costs nothing.
  // UPKEEP: 20 and 1.63 are the game's constants in WorkbenchStuff.js ShrineHrREQ (copied at Shrines.jsx:19); the
  // floor below level 20 is the game's too. Re-check all three on a game patch.
  shrineHours: (level) => {
    const hours = 20 * (level - 1) + 6 * level * Math.pow(1.63, level - 1);
    return Math.max(0, level < 20 ? Math.floor(hours) : hours);
  },
  // Shattershell Iteration's chance (Breeding PetUpgBONUS 11, breeding.ts calcUpgradeBonus).
  ceilPow: (level, { scale, exponent }) => Math.ceil(scale * Math.pow(level, exponent)),
  // Meal level-up cost (CookingMenuMealCosts, cooking.ts getMealLevelCost), before the companion,
  // achievement and Food Lust discounts. Factors run in the game's order so the result matches it exactly.
  // UPKEEP: every constant here is the game's, the 1111-level steps included; re-check on a patch that touches meal levels.
  mealCost: (level) => {
    const step = Math.floor((level + 1e3) / 1111);
    return Math.pow(10, 22 * step) * (10 + (level + level * level)) * Math.pow(1.2 + 0.05 * level, level) * Math.pow(1 + 0.4 * step, level);
  },
  // Lamp wish cost (Holes LampWishCost): floor of an affine part plus an optional power of the level.
  floorPoly: (level, { constant, perLevel, powScale = 0, exponent = 1 }) => Math.floor(constant + perLevel * level + powScale * Math.pow(level, exponent)),
  // Dirty Shovel and Bog Log (GamingStatType ImportItemBonus 1 and 5): a decay curve raised to a power, floored to tenths.
  decayPowTenths: (level, { base = 0, scale, offset, exponent = 1 }) => Math.floor(10 * (base + Math.pow((scale * level) / (offset + level), exponent))) / 10,
  // "1 in N" odds that improve with the level (Royal Stacks, Luck fo' REAL, Rubber Ducky), rounded to a whole
  // number as the game's CommaNotation prints them (N.js:112511).
  inverseLinear: (level, { base, perLevel }) => Math.round(base / (1 + perLevel * level)),
  // A floor plus a decay toward base + scale (Money Back Guarantee's keep %).
  affineDecay: (level, { base, scale, offset }) => base + (scale * level) / (offset + level),
  // An affine bonus with a ceiling (the Bravery cavern study, min(32, 12 + 3L)).
  affineCapped: (level, { base, perLevel, max }) => Math.min(max, base + perLevel * level),
  // Cove upgrade cost (Cglunko_upgCost) before its discounts: scale * (rate^L + L), floored and at least 1 below a million.
  // UPKEEP: 1e6 is the game's floor threshold, as in affinePowFloor.
  scaledPowPlusLevelFloor: (level, { scale, rate }) => {
    const cost = scale * (Math.pow(rate, level) + level);
    return cost < 1e6 ? Math.floor(Math.max(1, cost)) : cost;
  },
  // Palette `#` (GamingStatType PaletteBonus with x5 = 1): a decay toward `scale`, floored to hundredths as the palette tooltip floors it.
  decayFloorHundredths: (level, { scale, offset }) => Math.floor(100 * ((level / (level + offset)) * scale)) / 100
};

const rawValue = (formula, level, args) => {
  const fn = FORMULAS[formula];
  return fn ? fn(level, args || {}) : null;
};

const evaluate = (formula, level, args) => {
  const value = rawValue(formula, level, args);
  return Number.isFinite(value) ? value : null;
};

const roundTwoDecimals = (value) => Math.round(value * 100) / 100;

// Every number the wiki prints. Past a billion the digits stop being readable (costs run to 1e11
// feathers, Feather Restart's multiplier to 1e19), and an overflowed formula reads as infinite
// rather than leaving its placeholder behind.
const formatNumber = (value) => {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  if (Math.abs(value) >= 1e9) return value.toExponential(2).replace('e+', 'e');
  // `|| 0` folds -0, which toLocaleString would print as "-0".
  return (roundTwoDecimals(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
};

// The description with each placeholder filled at `level`. A token with no number behind it is
// left as written rather than replaced with a gap mid-sentence.
export const levelledText = (node, level) => {
  if (!node?.description) return null;
  let text = String(node.description);
  for (const term of node.effect?.terms || []) {
    const value = rawValue(term.formula, level, term.args);
    if (value === null || Number.isNaN(value)) continue;
    text = text.split(term.token).join(formatNumber(value));
  }
  return cleanUnderscore(text);
};

// A node pays in one currency (`cost` is an object) or several at once (an array of them).
const costList = (node) => [].concat(node?.cost || []);

// What buying `level` costs. The game's cost lines read the level the upgrade is at before the
// purchase, so the formula runs at level - 1.
const priceAt = (cost, level) => evaluate(cost.formula, level - 1, cost.args);

const priceToMax = (cost, cap) => {
  if (cap == null) return null;
  let total = 0;
  for (let level = 1; level <= cap; level++) {
    const price = priceAt(cost, level);
    if (price === null) return null;
    total += price;
  }
  return total;
};

const describeCost = (cost, value) => ({ currency: cost.currency, value, label: cost.label, note: cost.note });

export const costsAt = (node, level) => costList(node).map((cost) => describeCost(cost, priceAt(cost, level)));

export const costsToMax = (node) => costList(node).map((cost) => describeCost(cost, priceToMax(cost, node?.effect?.cap ?? null)));

// The first cost only, for callers that know a single currency.
export const costAt = (node, level) => costsAt(node, level)[0]?.value ?? null;

export const costToMax = (node) => costsToMax(node)[0]?.value ?? null;

// A cost is a whole amount below a billion. A value that is not a finite number reads as blank, not "0".
export const formatAmount = (value) => {
  if (!Number.isFinite(value)) return '';
  return formatNumber(Math.abs(value) >= 1e9 ? value : Math.round(value));
};

// Talents cap around 100 by themselves and go far past it with books and bonuses; this guard only
// stops a number that would render as gibberish.
const MAX_LEVEL = 10000;

// Anything that is not a whole number from 1 reads as level 1, so clearing the field to type a new
// number leaves the sentence intact instead of blanking it.
export const readLevel = (value, cap = null) => {
  const level = Math.floor(Number(value));
  if (!Number.isFinite(level) || level < 1) return 1;
  return Math.min(level, cap ?? MAX_LEVEL);
};

// A stamp reads at level one: a real number the game itself would show, rather than a blank.
export const stampEffect = (node) => {
  const { template, func, x1, x2 } = node?.stamp?.effect || {};
  if (!template || !func) return node?.description ? cleanUnderscore(node.description) : null;
  return levelledText({ description: template, effect: { terms: [{ token: '{', formula: 'growth', args: { func, x1, x2 } }] } }, 1);
};

export const cardEffect = (card) => {
  if (!card?.effect) return null;
  return cleanUnderscore(card.effect.replace('{', card.bonus));
};

// One line of what the item's Stats box shows, in the same wording. The weapon-power label is the
// bare "Power" because naming which power needs a parser module plain node cannot load.
export const statsSummary = (stats, maxLength = 150) => {
  if (!stats) return null;
  const parts = [];
  if (stats.Weapon_Power) parts.push(`+${stats.Weapon_Power} Power`);
  if (stats.Speed) parts.push(`${stats.Speed} Speed`);
  if (stats.Reach) parts.push(`${stats.Reach} Reach`);
  for (const stat of ['STR', 'AGI', 'WIS', 'LUK']) {
    if (stats[stat]) parts.push(`+${stats[stat]} ${stat}`);
  }
  if (stats.Defence) parts.push(`+${stats.Defence} Defence`);
  if (stats.UQ1txt && stats.UQ1val) parts.push(cleanUnderscore(`+${stats.UQ1val}${stats.UQ1txt}`));
  if (stats.UQ2txt && stats.UQ2val) parts.push(cleanUnderscore(`+${stats.UQ2val}${stats.UQ2txt}`));
  if (parts.length === 0) return null;
  const line = parts.join(' · ');
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}…` : line;
};
