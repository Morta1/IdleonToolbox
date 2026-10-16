// The "what does it do" strings the wiki shows, kept free of React, MUI and game data so the
// bot index builder (plain node) can use the exact same wording the pages do. The game's own
// constants come from the generated game-constants.mjs, never from @website-data.
import GAME from './game-constants.mjs';
import { growthCurve } from './growth.mjs';

const cleanUnderscore = (str) => (str ? String(str).replace(/_/g, ' ') : '');

// The curve charmStat and charmStatMulti share, its offsets GAME.ninjaItemStat charm (Ninja ItemStat, Ninja.js:422-464).
const charmCurve = (level, base, scale) => {
  const charm = GAME.ninjaItemStat?.charm;
  if (!charm) return null;
  return Math.min(base + scale * (level / (level + charm.firstOffset)), scale) + Math.min(scale * (level / (level + charm.secondOffset)), scale);
};

// The decimal places a game decimal is rounded back to after binary arithmetic blurs it (zeroDetectionStealth's margin).
const DECIMAL_GRID = 1e9;

// The modes `rounded` accepts: a whitelist, so a mode name from a registry row never reaches Math directly.
const ROUNDING = { round: Math.round, ceil: Math.ceil, floor: Math.floor };

// The game's FormatBonuses (N.js:80504): it picks the digits by the value and the curve, hundredths below 10 for a
// decay, tenths below 1, for `add` with x2 below 1 under 100, or for `decay` below 25, else whole. The thresholds are
// GAME.formatBonuses (the FormatBonuses body).
const formatBonusValue = (value, func, x2) => {
  const below = GAME.formatBonuses;
  if (!below) return null;
  if (typeof value !== 'number') return value;
  if (value < below.decayHundredthsBelow && String(func).includes('decay')) return Math.round(100 * value) / 100;
  if (value < below.tenthsBelow || (func === 'add' && x2 < below.addX2Below && value < below.addTenthsBelow)
    || (value < below.decayTenthsBelow && func === 'decay')) return Math.round(10 * value) / 10;
  return Math.round(value);
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
  // Atom upgrade cost (AtomCost): an affine base times a power, floored below GAME.atomCost.floorBelow as the game
  // floors it (AtomCollider "AtomCost").
  affinePowFloor: (level, { base, perLevel, rate }) => {
    const floor = GAME.atomCost;
    if (!floor) return null;
    const cost = (base + perLevel * level) * Math.pow(rate, level);
    return cost < floor.floorBelow ? Math.floor(cost) : cost;
  },
  // Shrine level-up time (WorkbenchStuff "ShrineHrREQ", GAME.shrineHours) in hours of shrine progress, floored below
  // floorBelow as the game floors it; level 0 is the unplaced shrine and costs nothing.
  shrineHours: (level) => {
    const shrine = GAME.shrineHours;
    if (!shrine) return null;
    const hours = shrine.perLevel * (level - 1) + shrine.scale * level * Math.pow(shrine.rate, level - 1);
    return Math.max(0, level < shrine.floorBelow ? Math.floor(hours) : hours);
  },
  // Shattershell Iteration's chance (Breeding PetUpgBONUS 11, breeding.ts calcUpgradeBonus).
  ceilPow: (level, { scale, exponent }) => Math.ceil(scale * Math.pow(level, exponent)),
  // Meal level-up cost (CookingR "CookingMenuMealCosts", GAME.mealCost), before the companion, achievement and Food
  // Lust discounts. Factors run in the game's order so the result matches it exactly.
  mealCost: (level) => {
    const meal = GAME.mealCost;
    if (!meal) return null;
    const step = Math.floor((level + meal.stepOffset) / meal.stepSize);
    return Math.pow(meal.tierBase, meal.tierExponent * step) * (meal.constant + (level + level * level))
      * Math.pow(meal.base + meal.perLevel * level, level) * Math.pow(1 + meal.tierRate * step, level);
  },
  // Bubble upgrade cost (CauldronStats "CauldronCosts", GAME.bubbleCost) before discounts. The material curve changes
  // past bubble index highAboveIndex and is rounded as the game rounds it. The game's cap applies after the discounts,
  // so the undiscounted curve runs on past it (the cost note says so).
  bubbleMaterialCost: (level, { base, bubbleIndex }) => {
    const bubble = GAME.bubbleCost;
    if (!bubble) return null;
    const [rate, decay, offset] = bubbleIndex > bubble.highAboveIndex
      ? [bubble.highRate, bubble.highDecay, bubble.highOffset]
      : [bubble.lowRate, bubble.lowDecay, bubble.lowOffset];
    return Math.round(base * Math.pow(rate - (decay * level) / (offset + level), level));
  },
  // A liquid rises by one every liquidStep levels.
  bubbleLiquidCost: (level, { base }) => {
    const bubble = GAME.bubbleCost;
    return bubble ? base + Math.floor(level / bubble.liquidStep) : null;
  },
  // The Bits bubbles double per level, never rounded or capped.
  bubbleBitsCost: (level, { base }) => {
    const bubble = GAME.bubbleCost;
    return bubble ? base * Math.pow(bubble.bitsRate, level) : null;
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
  // Cove upgrade cost (Cglunko_upgCost) before its discounts: scale * (rate^L + L), floored and at least `min` below
  // `floorBelow` (GAME.cglunkoUpgradeCost).
  scaledPowPlusLevelFloor: (level, { scale, rate }) => {
    const cove = GAME.cglunkoUpgradeCost;
    if (!cove) return null;
    const cost = scale * (Math.pow(rate, level) + level);
    return cost < cove.floorBelow ? Math.floor(Math.max(cove.min, cost)) : cost;
  },
  // Palette `#` (GamingStatType PaletteBonus with x5 = 1): a decay toward `scale`, floored to hundredths as the palette tooltip floors it.
  decayFloorHundredths: (level, { scale, offset }) => Math.floor(100 * ((level / (level + offset)) * scale)) / 100,
  // Summoning upgrade cost (Summoning UpgCost) as the panel prints it: rounded up below `below` (N.js:109356, 1,000).
  powCeilBelow: (level, { base, rate, below }) => {
    const cost = base * Math.pow(rate, level);
    return cost < below ? Math.ceil(cost) : cost;
  },
  // Farming market cost (FarmingStuffs MarketCostQTY): floored below `below` (1e8).
  powFloorBelow: (level, { base, rate, below }) => {
    const cost = base * Math.pow(rate, level);
    return cost < below ? Math.floor(cost) : cost;
  },
  // The summoning "cost }% less" lines (N.js:109356): diminishingPercent, rounded where that one floors.
  diminishingPercentRounded: (level, { perLevel }) => Math.round(1e4 * (1 - 1 / (1 + (perLevel * level) / 100))) / 100,
  // Exotic market `$` (N.js:108717): the decay bonus rounded up.
  decayCeil: (level, { scale, offset }) => Math.ceil((scale * level) / (level + offset)),
  // Sneaking charm stat (Ninja ItemStat, type 2): two capped decays toward `scale`.
  charmStat: (level, { base, scale }) => charmCurve(level, base, scale),
  charmStatMulti: (level, { base, scale }) => {
    const curve = charmCurve(level, base, scale);
    return curve === null ? null : 1 + curve / 100;
  },
  // Nunchaku and kunai (Ninja ItemStat, type 1, GAME.ninjaItemStat weapon): steep growth, damped past dampFrom and
  // damp2From, then a gentler rate from splitBelow.
  ninjaWeaponStat: (level, { base }) => {
    const w = GAME.ninjaItemStat?.weapon;
    if (!w) return null;
    return level < w.splitBelow
      ? base * Math.pow(w.rate, level) * Math.pow(w.damp, Math.max(0, level - w.dampFrom)) * Math.pow(w.damp2, Math.max(0, level - w.damp2From))
      : base * Math.pow(w.lateRate, w.lateLevels) * Math.pow(w.lateDamp, w.lateDampLevels) * Math.pow(w.lateGrowth, level - w.lateFrom);
  },
  // Gloves (Ninja ItemStat, type 1 subType 0, GAME.ninjaItemStat gloves).
  ninjaGloveStat: (level, { base }) => {
    const gloves = GAME.ninjaItemStat?.gloves;
    return gloves ? gloves.scale * base * ((level + gloves.add) / (level + gloves.offset)) : null;
  },
  // A sneaking floor stat at a Ninja Mastery (changemonsterDEF, N.js:80482-80486): from Mastery 1 the NinjaInfo row
  // becomes factor x base x rate^mastery, the rate being the row's own entry at a fixed floor. `pinned` keeps floor 0 at
  // its base; `chained` is a door past the rate's floor, which the game's in-place loop reaches after rescaling the rate
  // itself. A zero base stays 0 where the power overflows (0 x Infinity would be NaN).
  ninjaMasteryScale: (level, { base, factor, rate, pinned = false, chained = false }) => {
    if (level < 1 || pinned || base === 0) return base;
    const scale = chained ? factor * rate * Math.pow(rate, level) : rate;
    return factor * base * Math.pow(scale, level);
  },
  // The stealth at which DetectionDEC's 1 - stealthScale x stealth / (stealth + difficulty) reaches 0 (N.js:106275,
  // GAME.detectionDec), for the difficulty another formula gives: difficulty / (stealthScale - 1), as sneaking.ts
  // getStealthForDetection writes it. The game's 1.1 is a decimal, and 1.1 - 1 in binary is 0.1 plus 9e-17, so the
  // margin is rounded back to the decimal sneaking.ts divides by (DECIMAL_GRID): the two agree to the bit.
  zeroDetectionStealth: (level, { formula, args }) => {
    const detection = GAME.detectionDec;
    if (!detection) return null;
    const difficulty = FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null;
    const margin = Math.round((detection.stealthScale - 1) * DECIMAL_GRID) / DECIMAL_GRID;
    return typeof difficulty === 'number' ? difficulty / margin : difficulty;
  },
  // Emerald's "$% cheaper" (gemstone bonus as a discount).
  affineDecayCheaper: (level, { base, scale, offset }) => 100 * (1 - 1 / (1 + (base + (scale * level) / (offset + level)) / 100)),
  // The game's NotateNumber(x, "Big") (N.js:68754) floors below 1,000 (GAME.notateNumber small.floorBelow); above
  // that it writes K/M, which the wiki's own notation replaces. Wraps another formula so item panels print what the game prints.
  notateBig: (level, { formula, args }) => {
    const small = GAME.notateNumber?.small;
    if (!small) return null;
    const value = FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null;
    return typeof value === 'number' && value < small.floorBelow ? Math.floor(value) : value;
  },
  // Spelunk ShopUpgCost (GAME.spelunkShopCost): scale x base x (levelOffset + L) x rate^L plus L^2 + perLevel L, rounded
  // up below `below` as the shop prints it (N.js:118794).
  spelunkShopCost: (level, { base, rate, below }) => {
    const shop = GAME.spelunkShopCost;
    if (!shop) return null;
    const cost = shop.scale * base * (shop.levelOffset + level) * Math.pow(rate, level) + level * level + shop.perLevel * level;
    return cost < below ? Math.ceil(cost) : cost;
  },
  // Another formula floored below `below` (Zenith and Orblet market costs floor below 1e6, Thingies.js:70-89).
  floorBelow: (level, { formula, args, below }) => {
    const value = FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null;
    return typeof value === 'number' && value < below ? Math.floor(value) : value;
  },
  // Bubba UpgCost (Bubbastuff.js:47-57): scale x (perLevel x L + base x rate^L).
  linearPlusPow: (level, { scale, perLevel, base, rate }) => scale * (perLevel * level + base * Math.pow(rate, level)),
  // An affine value with a one-off step from level `at` (Minehead Numbahs, N.js:121561).
  affineStep: (level, { base, perLevel, at, step }) => base + perLevel * level + (level >= at ? step : 0),
  // "1 in N" odds rounded up (Minehead Jackpot Time, N.js:121561); inverseLinear rounds.
  inverseLinearCeil: (level, { base, perLevel }) => Math.ceil(base / (1 + perLevel * level)),
  // A value read from a game table by level, clamped to the table (Minehead Multiplier Madness / Awesome Additives / Grid Expansion).
  lookup: (level, { values }) => values[Math.min(Math.max(0, level), values.length - 1)],
  // Another formula rounded to `digits` decimals, for a panel that rounds a value its own way (Advice Fish ceils to
  // hundredths, N.js:218019; the sushi Knowledge `{` goes through CommaNotation, which rounds to a whole number, N.js:122229).
  // A value below `from` passes through unrounded: the Grimoire, Tesseract and Armory panels print `}` as MultiplierInfo
  // below a bonus of 1,000 and as CommaNotation(floor(1 + bonus / 100)) from it (N.js:111973, 118290, 122337), so
  // those rows pass `mode: 'floor', from: 11`.
  rounded: (level, { formula, args, mode = 'round', digits = 0, from = -Infinity }) => {
    const value = FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null;
    if (typeof value !== 'number' || !Object.hasOwn(ROUNDING, mode) || value < from) return value;
    const scale = Math.pow(10, digits);
    return ROUNDING[mode](value * scale) / scale;
  },
  // GrimoireUpgCost (N.js:106375) and ArcaneUpgCost (N.js:107167): scale x (L + (base + L) x rate^L). The rows pass
  // scale = 3 x 1.05^t (or 1.04^t) and rate = x2 + 0.01.
  affinePowPlusLevel: (level, { scale, base, rate }) => scale * (level + (base + level) * Math.pow(rate, level)),
  // A flat price below level `below`, else another formula (Armory ids 46 and 58, N.js:107842).
  flatBelow: (level, { formula, args, below, flat }) => {
    if (level < below) return flat;
    return FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null;
  },
  // The game's NotateNumber(x, "Small") (N.js:68764): hundredths below 1, tenths below 100, floored below 1,000, then
  // K/M with three significant figures, which the wiki replaces with the floored whole number (costs: notateBig). The
  // thresholds are GAME.notateNumber small.
  notateSmall: (level, { formula, args }) => {
    const small = GAME.notateNumber?.small;
    if (!small) return null;
    const value = FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null;
    if (typeof value !== 'number') return value;
    if (value < small.hundredthsBelow) return Math.round(100 * value) / 100;
    if (value < small.tenthsBelow) return Math.round(10 * value) / 10;
    return Math.floor(value);
  },
  // Moon of Sneak (CompassBonus 45, N.js:107131): the linear bonus doubles every `every` levels.
  linearDoubling: (level, { perLevel, every, base = 0 }) => base + perLevel * level * Math.pow(2, Math.floor(level / every)),
  // A curve that starts counting above level `offset` (a Post Office box's second and third bonus): the game grows it at
  // max(0, round(L - offset)), its thresholds stored as 24.9 so the rounding lands on whole levels (postoffice.ts).
  growthAbove: (level, { func, x1, x2, offset }) => growthCurve(func, Math.max(0, Math.round(level - offset)), x1, x2),
  // A base that grows by 1 / divisor of itself per level past `offset`, never below the base (prayersReal: a prayer's
  // bonus and curse). The game rounds it; the rows wrap it in `rounded`.
  scaledPastLevel: (level, { base, offset, divisor }) => base * Math.max(1, 1 + (level - offset) / divisor),
  // An affine price below `below`, then an affine one growing by `growth` per level past `pivot`, capped (WorshipStuff
  // PrayerCost). The rates already hold the prayer's own index term.
  affineThenPow: (level, { scale, below, earlyRate, lateRate, growth, pivot, cap }) => (level < below
    ? Math.round(scale * (1 + earlyRate * level))
    : Math.round(Math.min(cap, scale * (1 + lateRate * level) * Math.pow(growth, level - pivot)))),
  // A linear bonus plus weighted steps past each `at`, optionally times 1 + floor(L / every) / per (Summoning
  // VaultUpgBonus for its two faster upgrades).
  steppedLinear: (level, { perLevel, steps = [], every = 0, per = 1 }) => {
    const sum = perLevel * level + steps.reduce((total, { at, weight }) => total + weight * Math.max(0, level - at), 0);
    return every ? sum * (1 + Math.floor(level / every) / per) : sum;
  },
  // A class family bonus at class level `level`: FamilyBonsuesREAL (N.js:80499) grows the curve at
  // max(0, round(L - offset)), and the value is rounded as FormatBonuses prints it (N.js:80504).
  familyBonus: (level, { func, x1, x2, offset }) => formatBonusValue(
    FORMULAS.growth(Math.max(0, Math.round(level - offset)), { func, x1, x2 }), func, x2),
  // Another formula rounded as FormatBonuses prints it, with the curve name and x2 the rounding reads: the guild
  // panel's `{` and `}` (N.js:85395). `func` may differ from the inner curve's: Bonus GP's `}` is a special1 value
  // rounded by the decay rule.
  formatBonuses: (level, { formula, args, func, x2 }) => formatBonusValue(
    FORMULAS[formula] ? FORMULAS[formula](level, args || {}) : null, func, x2),
  // DungeonCalc("RngUpgCost") (N.js:87603, DungeonCalc.js:118-124): 1 + scale x L^(power + powerRate x L) from
  // GAME.dungeonRngUpgCost; the row passes the rarity scale.
  dungeonRngCost: (level, { scale }) => {
    const cost = GAME.dungeonRngUpgCost;
    if (!cost) return null;
    return Math.floor((1 + cost.scale * Math.pow(level, cost.power + cost.powerRate * level)) * scale);
  },
  // DungeonCalc("PassiveStatCost") and ("PassiveStatCost2") (N.js:87588, 87590, DungeonCalc.js:6-35): the row passes
  // its shop's constants. The rate gains a nudge of nudge x (L - pivot) / (L + pivot) from L = pivot, one more every
  // `every` levels after it.
  dungeonPassiveCost: (level, { base, scale, exponent, rate, pivot, nudge, every }) => Math.floor(base + Math.pow(scale * level, exponent)
    * Math.pow(rate + ((level - pivot) / (level + pivot)) * nudge * Math.floor((level + every - pivot) / every), level))
};

const rawValue = (formula, level, args) => {
  const fn = FORMULAS[formula];
  return fn ? fn(level, args || {}) : null;
};

// An overflowed cost reads as "∞" like an overflowed effect; only a formula that cannot run is no cost.
const evaluate = (formula, level, args) => {
  const value = rawValue(formula, level, args);
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
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

// The game's sentences, each with what ends it: a `.`, `!` or `?` before a space or the text's end, or a line break (`@`).
// A point inside a number ("0.5") ends nothing.
const SENTENCE_END = /(?<=@)|(?<=[.!?])(?=[_ @])/;

// `text` without each sentence that still holds one of `tokens`. A placeholder with no number behind it (its table
// absent on a game patch, its formula unable to run) would print as a raw `$` or `}`, so the sentence holding it goes.
export const dropUnfilled = (text, tokens) => {
  const left = [...new Set(tokens)].filter((token) => text.includes(token));
  if (!left.length) return text;
  return text.split(SENTENCE_END)
    .filter((part) => !left.some((token) => part.includes(token)))
    .join('')
    .replace(/^[_ ]+|[_ ]+$/g, '');
};

// One term's number at `level`, for a page that lays its terms out as a table rather than a sentence. null when it cannot run.
export const termValue = (term, level) => {
  if (!term) return null;
  const value = rawValue(term.formula, level, term.args);
  return value === null || Number.isNaN(value) ? null : value;
};

// The description with each placeholder filled at `level`. A token with no number behind it takes its sentence with it.
export const levelledText = (node, level) => {
  if (!node?.description) return null;
  let text = String(node.description);
  const unfilled = [];
  for (const term of node.effect?.terms || []) {
    const value = rawValue(term.formula, level, term.args);
    if (value === null || Number.isNaN(value)) unfilled.push(term.token);
    else text = text.split(term.token).join(formatNumber(value));
  }
  return cleanUnderscore(dropUnfilled(text, unfilled));
};

// An effect with several bonuses that read apart (a Post Office box's three, a prayer's bonus and curse) lists them as
// labelled `lines`, each filled like the description, which joins them for the bot and the meta description.
export const levelledLines = (node, level) => (node?.effect?.lines || [])
  .map(({ label, text }) => ({ label, text: levelledText({ description: text, effect: node.effect }, level) }))
  .filter(({ text }) => text);

// A node pays in one currency (`cost` is an object) or several at once (an array of them).
const costList = (node) => [].concat(node?.cost || []);

// What buying `level` costs. The game's cost lines read the level the upgrade is at before the
// purchase, so the formula runs at level - 1.
const priceAt = (cost, level) => evaluate(cost.formula, level - 1, cost.args);

// `owned` is the level the player is at, so the sum starts at the level after it.
const priceToMax = (cost, cap, owned = 0) => {
  if (cap == null) return null;
  let total = 0;
  for (let level = owned + 1; level <= cap; level++) {
    const price = priceAt(cost, level);
    if (price === null) return null;
    total += price;
    // Past the overflow every later price is ∞ too, and a 999,999-level loop is 77 ms a node.
    if (!Number.isFinite(total)) return total;
  }
  return total;
};

// `currencyOne` is the optional singular of a plural currency ("Research Point" beside "Research Points").
// `currencyIcon` is art drawn beside a currency the game never names in text (the Armory's kingdom resources).
const describeCost = (cost, value) => ({
  currency: cost.currency,
  ...(cost.currencyOne ? { currencyOne: cost.currencyOne } : {}),
  ...(cost.currencyIcon ? { currencyIcon: cost.currencyIcon } : {}),
  value,
  label: cost.label,
  note: cost.note,
  ...(cost.prefix ? { prefix: cost.prefix } : {})
});

export const costsAt = (node, level) => costList(node).map((cost) => describeCost(cost, priceAt(cost, level)));

export const costsToMax = (node, owned = 0) => costList(node).map((cost) => describeCost(cost, priceToMax(cost, node?.effect?.cap ?? null, owned)));

// The first cost only, for callers that know a single currency.
export const costAt = (node, level) => costsAt(node, level)[0]?.value ?? null;

export const costToMax = (node) => costsToMax(node)[0]?.value ?? null;

// A cost is a whole amount below a billion. A value that is not a number reads as blank, not "0"; an overflow reads as ∞.
export const formatAmount = (value) => {
  if (value === Infinity || value === -Infinity) return formatNumber(value);
  if (!Number.isFinite(value)) return '';
  return formatNumber(Math.abs(value) >= 1e9 ? value : Math.round(value));
};

// The currency word beside `amount`: the singular when the amount prints as exactly 1, so a level
// costs "1 Research Point" while the total to max still reads "40 Research Points".
export const costCurrency = (cost, amount) => (cost?.currencyOne && formatAmount(amount) === '1' ? cost.currencyOne : cost?.currency);

// Talents cap around 100 by themselves and go far past it with books and bonuses; this guard only
// stops a number that would render as gibberish. It also bounds the "No max level" pages: the game has
// no cap there, and a level typed past this reads as this one.
const MAX_LEVEL = 10000;

// Anything that is not a whole number from the first level (1, or the effect's `from`) reads as that
// level, so clearing the field to type a new number leaves the sentence intact instead of blanking it.
export const readLevel = (value, cap = null, from = 1) => {
  const level = Math.floor(Number(value));
  if (!Number.isFinite(level) || level < from) return from;
  return Math.min(level, cap ?? MAX_LEVEL);
};

// The level a page opens its calculator on, and the one the bot and the meta description read.
export const firstLevel = (node) => node?.effect?.from ?? 1;

// The level a page opens on and its one-line summary (listing cell, meta description) reads at: the first level, or the
// max where the effect says so (`summaryAtCap`), for a kind whose bonuses start partway up and read +0 at level 1.
export const summaryLevel = (node) => (node?.effect?.summaryAtCap && node.effect.cap ? node.effect.cap : firstLevel(node));

// A stamp reads at level one: a real number the game itself would show, rather than a blank.
export const stampEffect = (node) => {
  const { template, func, x1, x2 } = node?.stamp?.effect || {};
  if (!template || !func) return node?.description ? cleanUnderscore(node.description) : null;
  return levelledText({ description: template, effect: { terms: [{ token: '{', formula: 'growth', args: { func, x1, x2 } }] } }, 1);
};

const range = (length) => Array.from({ length }, (unused, index) => index);

// A card's tiers: Base (0) up to the cap CardLv returns (GAME.cardLevelTiers), and each tier-up after Base.
export const cardTiers = () => {
  const cap = GAME.cardLevelTiers?.cap;
  return cap ? { bonus: range(cap), requirement: range(cap - 1) } : null;
};

// The base carry capacity a starter bundle adds (MaxCapacity "AllCapBASE", GAME.carryCapacityBase).
export const starterBundleCapacity = () => GAME.carryCapacityBase?.starterBundle ?? null;

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
