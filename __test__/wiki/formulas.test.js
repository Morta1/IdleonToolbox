import { describe, expect, it } from 'vitest';
import '../../polyfills';
import { owlData, poppyBonuses, poppyTarBonuses, statues } from '@website-data';
import { calcUpgradeBonus } from '@parsers/world-4/breeding';
import { getMealLevelCost } from '@parsers/world-4/cooking';
import { costAt, costsAt, costsToMax, costToMax, formatAmount, FORMULAS, levelledText } from '@utility/wiki/effects.mjs';

describe('formula parity with the game', () => {
  // No growth parity case: utility/helpers re-exports this very growth(), so comparing the two is
  // an identity check. growth's own values are pinned by the talent tests (Task 3).
  // "txt" and "_" mark a half with no number; a name growth() has no case for is the same, never 0.
  it.each(['txt', '_', null, 'notACurve'])('has no number for a growth with function %s', (func) => {
    expect(FORMULAS.growth(10, { func, x1: 1, x2: 0 })).toBe(null);
  });

  // Oracle: parsers/world-1/statues.ts multiplies the level by the statue's base bonus before any
  // save-dependent multiplier.
  it('linear matches a statue bonus', () => {
    for (const statue of statues.slice(0, 3)) {
      for (const level of [1, 25, 300]) {
        expect(FORMULAS.linear(level, { perLevel: statue.bonus })).toBe(level * statue.bonus);
      }
    }
  });

  // Oracle: parsers/world-1/owl.ts upgrade cost with no account (every cost reducer at 0).
  it('pow and linearPow match the owl upgrade costs', () => {
    owlData.forEach((upgrade, index) => {
      for (const level of [0, 5, 20]) {
        const game = index === 0
          ? upgrade.x1 * level * Math.pow(Math.max(1.05, upgrade.x2), level)
          : upgrade.x1 * Math.pow(upgrade.x2, level);
        const wiki = index === 0
          ? FORMULAS.linearPow(level, { base: upgrade.x1, rate: Math.max(1.05, upgrade.x2) })
          : FORMULAS.pow(level, { base: upgrade.x1, rate: upgrade.x2 });
        expect(wiki).toBe(game);
      }
    });
  });

  // Oracle: owl.ts bonus3, Feather Cheapener's discount.
  it('diminishingPercent matches the Feather Cheapener discount', () => {
    for (const level of [1, 10, 250]) {
      expect(FORMULAS.diminishingPercent(level, { perLevel: 10 }))
        .toBe(Math.floor(1e4 * (1 - 1 / (1 + 10 * level / 100))) / 100);
    }
  });
});

describe('atom and shrine formulas', () => {
  // Oracle: atomCollider.ts:125-128 (N.js AtomCost) with no discount; the below-a-million floor is
  // the game's, so Hydrogen is whole numbers while Nitrogen's later levels are not.
  it.each([
    ['Hydrogen', 0, 2, { base: 2, perLevel: 1, rate: 1.35 }],
    ['Hydrogen', 9, 163, { base: 2, perLevel: 1, rate: 1.35 }],
    ['Hydrogen', 19, 6288, { base: 2, perLevel: 1, rate: 1.35 }],
    ['Nitrogen', 9, 40978, { base: 1000, perLevel: 500, rate: 1.25 }]
  ])('affinePowFloor prices %s at level %s as %s', (name, level, expected, args) => {
    expect(FORMULAS.affinePowFloor(level, args)).toBe(expected);
  });

  it('affinePowFloor stops flooring at a million', () => {
    const args = { base: 1000, perLevel: 500, rate: 1.25 };
    const cost = FORMULAS.affinePowFloor(30, args);
    expect(cost).toBeGreaterThanOrEqual(1e6);
    expect(cost).toBe((1000 + 500 * 30) * Math.pow(1.25, 30));
  });

  // Oracle: WorkbenchStuff.js "ShrineHrREQ" (Shrines.jsx:19), floored below level 20.
  it.each([
    [0, 0],
    [1, 6],
    [2, 39],
    [3, 87],
    [10, 5053]
  ])('shrineHours at level %s is %s', (level, expected) => {
    expect(FORMULAS.shrineHours(level)).toBe(expected);
  });

  it('shrineHours keeps its fraction from level 20 on', () => {
    const hours = 20 * 19 + 6 * 20 * Math.pow(1.63, 19);
    expect(FORMULAS.shrineHours(20)).toBe(hours);
  });
});

describe('levelledText', () => {
  const node = {
    description: 'Gives_{_and_}',
    effect: {
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: 2 } },
        { token: '}', formula: 'growth', args: { func: 'txt', x1: 0, x2: 0 } }
      ]
    }
  };

  it('fills a token and leaves one with no number alone', () => {
    expect(levelledText(node, 5)).toBe('Gives 10 and }');
  });

  it('fills every occurrence and rounds to two decimals', () => {
    const repeated = { description: 'A_{_B_{', effect: { terms: [{ token: '{', formula: 'linear', args: { perLevel: 0.1 } }] } };
    expect(levelledText(repeated, 3)).toBe('A 0.3 B 0.3');
  });

  // Feather Restart is 3 * 3^level: level 40 is a 20-digit number, level 700 overflows a double.
  it.each([
    ['linear', { perLevel: 1234.567 }, 1, 'X 1,234.57'],
    ['linear', { perLevel: 999999999 }, 1, 'X 999,999,999'],
    ['pow', { base: 3, rate: 3 }, 40, 'X 3.65e19'],
    ['pow', { base: 3, rate: 3 }, 700, 'X ∞']
  ])('formats a %s value (%o at level %s) as %s', (formula, args, level, expected) => {
    const big = { description: 'X_{', effect: { terms: [{ token: '{', formula, args }] } };
    expect(levelledText(big, level)).toBe(expected);
  });

  it('leaves a token alone when the formula name is unknown', () => {
    const unknown = { description: 'X_{', effect: { terms: [{ token: '{', formula: 'nope', args: {} }] } };
    expect(levelledText(unknown, 1)).toBe('X {');
  });

  it('reads a description with no effect as plain text', () => {
    expect(levelledText({ description: 'Just_text' }, 1)).toBe('Just text');
  });

  it('has nothing to say without a description', () => {
    expect(levelledText({ effect: node.effect }, 1)).toBe(null);
  });
});

describe('costs', () => {
  const capped = { cost: { formula: 'pow', args: { base: 10, rate: 2 } }, effect: { cap: 3, terms: [] } };

  // The cost of buying a level reads the level the upgrade is at before the purchase.
  it('prices each level from the level below it', () => {
    expect([1, 2, 3].map((level) => costAt(capped, level))).toEqual([10, 20, 40]);
  });

  it('sums every level to the cap', () => {
    expect(costToMax(capped)).toBe(70);
  });

  it('has no total without a cap', () => {
    expect(costToMax({ cost: capped.cost, effect: { cap: null, terms: [] } })).toBe(null);
  });

  it('has no cost without a cost formula', () => {
    expect(costAt({ effect: { cap: 3, terms: [] } }, 1)).toBe(null);
  });

  // Breeding upgrades are paid in a meal and in Dead Cells at once, each on its own curve.
  const twoCosts = {
    cost: [
      { formula: 'pow', args: { base: 10, rate: 2 }, currency: 'Turkey_of_Thank', note: 'No discounts apply.' },
      { formula: 'linearPowFromOne', args: { base: 3, rate: 1 }, currency: 'Dead Cells', label: 'Cells for this level' }
    ],
    effect: { cap: 3, terms: [] }
  };

  it('prices every cost of a level, in order', () => {
    expect(costsAt(twoCosts, 2)).toEqual([
      { currency: 'Turkey_of_Thank', value: 20, label: undefined, note: 'No discounts apply.' },
      { currency: 'Dead Cells', value: 6, label: 'Cells for this level', note: undefined }
    ]);
  });

  it('sums every cost to the cap on its own', () => {
    expect(costsToMax(twoCosts).map(({ currency, value }) => [currency, value]))
      .toEqual([['Turkey_of_Thank', 70], ['Dead Cells', 18]]);
  });

  it('reads a single cost object as a list of one', () => {
    expect([costsAt(capped, 2), costsToMax(capped)]).toEqual([
      [{ currency: undefined, value: 20, label: undefined, note: undefined }],
      [{ currency: undefined, value: 70, label: undefined, note: undefined }]
    ]);
  });

  it('has a total of null for each cost without a cap, and no costs without a cost', () => {
    expect([costsToMax({ ...twoCosts, effect: { cap: null, terms: [] } }).map(({ value }) => value), costsAt({}, 1), costsToMax({})])
      .toEqual([[null, null], [], []]);
  });

  it('keeps an overflowed cost as infinite instead of dropping it', () => {
    expect(costAt({ cost: { formula: 'pow', args: { base: 3, rate: 3 } }, effect: { cap: null, terms: [] } }, 701)).toBe(Infinity);
  });

  // Callers that only know one cost keep reading the first.
  it('keeps costAt and costToMax on the first of several costs', () => {
    expect([costAt(twoCosts, 2), costToMax(twoCosts)]).toEqual([20, 70]);
  });

  it.each([
    [1234.4, '1,234'],
    [2.5e11, '2.50e11'],
    // A value that is not a finite number reads as blank, never as a made-up "0".
    [null, ''],
    [undefined, ''],
    [NaN, ''],
    // An overflow reads as infinite, as it does in an effect sentence.
    [Infinity, '∞'],
    [-Infinity, '-∞']
  ])('formats %s', (value, expected) => {
    expect(formatAmount(value)).toBe(expected);
  });
});

// Oracles: parsers/world-2/kangaroo.ts with no account (every discount 1). Read the parser lines the
// research cites (docs/superpowers/research/2026-10-14-world-2-wiki-kinds.md sections 1-2) and copy
// each expression verbatim as the `game` value below.
describe('Poppy formulas', () => {
  it('linearPowFromOne matches the Tasty Fishbait cost', () => {
    const { x1, x2 } = poppyBonuses[0];
    for (const level of [0, 1, 9]) {
      const game = x1 * (1 + level) * Math.pow(x2, level);
      expect(FORMULAS.linearPowFromOne(level, { base: x1, rate: x2 })).toBe(game);
    }
  });

  it('powPlusLevel matches the Tar Pit cost', () => {
    poppyTarBonuses.forEach(({ x1, x2 }) => {
      for (const level of [0, 1, 9]) {
        expect(FORMULAS.powPlusLevel(level, { base: x1, rate: x2 })).toBe(level + x1 * Math.pow(x2, level));
      }
    });
  });

  // RooBonus: each level adds the next of seven bonuses in turn.
  it.each([
    [1, 0, 3], [1, 1, 0], [10, 0, 6], [10, 1, 6], [10, 6, 3], [14, 6, 6]
  ])('roundRobin at level %s, bonus %s, base 3 gives %s', (level, offset, expected) => {
    expect(FORMULAS.roundRobin(level, { perStep: 3, offset, period: 7 })).toBe(expected);
  });
});

// Oracles: the exported parser functions, with no account (every discount neutral).
describe('World 4 formulas', () => {
  // breeding.ts calcUpgradeBonus, index 11 (N.js PetUpgBONUS for Shattershell Iteration).
  it.each([[0, 0], [1, 12], [10, 60]])('ceilPow at level %s gives %s, as Shattershell Iteration does', (level, expected) => {
    expect([FORMULAS.ceilPow(level, { scale: 12, exponent: 0.698 }), calcUpgradeBonus({ level }, 11, {})])
      .toEqual([expected, expected]);
  });

  // cooking.ts getMealLevelCost (N.js CookingMenuMealCosts). The level is the meal's level before the purchase.
  it.each([
    [0, '10'],
    [1, '15'],
    [10, '24,191.93'],
    [29, '1.65e15']
  ])('mealCost at level %s is %s, as the game prices it', (level, shown) => {
    const cost = FORMULAS.mealCost(level);
    expect(cost).toBe(getMealLevelCost(level, undefined));
    expect(levelledText({ description: '{', effect: { terms: [{ token: '{', formula: 'mealCost', args: {} }] } }, level)).toBe(shown);
  });

  // The game's 1111-level steps: every factor jumps at level 111.
  it('mealCost follows the game across the first step', () => {
    expect([110, 111, 112].map((level) => FORMULAS.mealCost(level))).toEqual([110, 111, 112].map((level) => getMealLevelCost(level, undefined)));
  });
});

// Oracles: the parser helpers for these are unexported, so the values are pinned by hand against the
// game lines (docs/superpowers/research/2026-10-14-world-5-wiki-kinds.md sections 1, 2, 6, 8, 9, 11, 15).
describe('World 5 formulas', () => {
  // Holes.js:797 LampWishCost (the-lamp.ts:57 getWishCost): wish 0, wish 2, then a plain affine wish.
  it.each([
    [0, { constant: 1, perLevel: 2, powScale: 1, exponent: 2 }, 1],
    [1, { constant: 1, perLevel: 2, powScale: 1, exponent: 2 }, 4],
    [9, { constant: 1, perLevel: 2, powScale: 1, exponent: 2 }, 100],
    [10, { constant: 1, perLevel: 2, powScale: 1, exponent: 2 }, 121],
    [9, { constant: 1, perLevel: 2, powScale: 1, exponent: 1.7 }, 60],
    [9, { constant: 2, perLevel: 0.5 }, 6]
  ])('floorPoly at level %s with %o costs %s wishes', (level, args, expected) => {
    expect(FORMULAS.floorPoly(level, args)).toBe(expected);
  });

  // GamingStatType.js:462-481 ImportItemBonus (gaming.ts:479 calcImportBonus): Dirty Shovel (1) and Bog Log (5).
  it.each([
    [1, { base: 1, scale: 60, offset: 250, exponent: 1.7 }, 1],
    [10, { base: 1, scale: 60, offset: 250, exponent: 1.7 }, 5.1],
    [100, { base: 1, scale: 60, offset: 250, exponent: 1.7 }, 126.2],
    [1, { scale: 60, offset: 100 }, 0.5],
    [10, { scale: 60, offset: 100 }, 5.4],
    [100, { scale: 60, offset: 100 }, 30]
  ])('decayPowTenths at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.decayPowTenths(level, args)).toBe(expected);
  });

  // the-fountain.ts:80-92: Rubber Ducky's 1 in 3 / (1 + 5L/100), Royal Stacks' 1 in 300 / (1 + L/100), rounded as CommaNotation prints it (N.js:112511).
  it('inverseLinear at level 100 with Royal Stacks gives 1 in 150', () => {
    expect(FORMULAS.inverseLinear(100, { base: 300, perLevel: 0.01 })).toBe(150);
  });

  // the-fountain.ts:75-78: Money Back Guarantee keeps 100 * (0.1 + 0.5L / (100 + L)) percent.
  it.each([
    [1, 10.495],
    [10, 14.545]
  ])('affineDecay at level %s gives %s', (level, expected) => {
    expect(FORMULAS.affineDecay(level, { base: 10, scale: 50, offset: 100 })).toBeCloseTo(expected, 3);
  });

  // Holes2.js:498-515 Cglunko_upgCost: Opal Find ({ 1, 7.5 }) and Slop Drop ({ 5, 1.35 }), before discounts.
  it.each([
    [0, { scale: 1, rate: 7.5 }, 1],
    [1, { scale: 1, rate: 7.5 }, 8],
    [1, { scale: 5, rate: 1.35 }, 11]
  ])('scaledPowPlusLevelFloor at level %s with %o costs %s', (level, args, expected) => {
    expect(FORMULAS.scaledPowPlusLevelFloor(level, args)).toBe(expected);
  });

  // Past a million the game stops flooring.
  it('scaledPowPlusLevelFloor keeps the fraction past a million', () => {
    expect(FORMULAS.scaledPowPlusLevelFloor(9, { scale: 1, rate: 7.5 })).toBeCloseTo(75084695.28, 2);
  });
});

describe('World 6 formulas', () => {
  // Summoning.js:981-997 UpgCost, printed through N.js:109356, which rounds up below 1,000 only.
  it.each([
    [0, { base: 10, rate: 1.12, below: 1000 }, 10],
    [1, { base: 10, rate: 1.12, below: 1000 }, 12],
    [9, { base: 10, rate: 1.12, below: 1000 }, 28]
  ])('powCeilBelow at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.powCeilBelow(level, args)).toBe(expected);
  });

  it('powCeilBelow keeps the fraction above the threshold', () => {
    expect(FORMULAS.powCeilBelow(9, { base: 2e9, rate: 1.42, below: 1000 })).toBeCloseTo(46948864735.69, 2);
  });

  // FarmingStuffs.js:214-237 MarketCostQTY: floored below 1e8.
  it.each([
    [0, { base: 2, rate: 2, below: 1e8 }, 2],
    [9, { base: 2, rate: 2, below: 1e8 }, 1024],
    [9, { base: 2, rate: 1.13, below: 1e8 }, 6]
  ])('powFloorBelow at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.powFloorBelow(level, args)).toBe(expected);
  });

  // N.js:109356: the summoning "% less" lines round where diminishingPercent floors; level 11 is where they part.
  it.each([
    [1, 0.99, 0.99],
    [10, 9.09, 9.09],
    [11, 9.91, 9.9]
  ])('diminishingPercentRounded at level %s gives %s (floored: %s)', (level, rounded, floored) => {
    expect(FORMULAS.diminishingPercentRounded(level, { perLevel: 1 })).toBe(rounded);
    expect(FORMULAS.diminishingPercent(level, { perLevel: 1 })).toBe(floored);
  });

  // N.js:108717: the exotic market bonus, rounded up.
  it.each([
    [0, 0],
    [1, 1],
    [1000, 3]
  ])('decayCeil at level %s gives %s', (level, expected) => {
    expect(FORMULAS.decayCeil(level, { scale: 5, offset: 1000 })).toBe(expected);
  });

  // Ninja.js:422-464 ItemStat, charms (type 2).
  it.each([
    [0, 8],
    [1, 8.2693],
    [1e4, 24.9266]
  ])('charmStat at level %s gives %s', (level, expected) => {
    expect(FORMULAS.charmStat(level, { base: 8, scale: 13 })).toBeCloseTo(expected, 4);
  });

  it('charmStatMulti turns the charm stat into a multiplier', () => {
    expect(FORMULAS.charmStatMulti(1, { base: 20, scale: 1000 })).toBeCloseTo(1.4072, 4);
  });

  // Ninja.js:422-464 ItemStat, nunchaku and kunai (type 1); 110/111 is the branch seam.
  it.each([
    [1, 12.3],
    [110, 6356193044.04],
    [111, 6761107965.72]
  ])('ninjaWeaponStat at level %s gives %s', (level, expected) => {
    expect(FORMULAS.ninjaWeaponStat(level, { base: 10 })).toBeCloseTo(expected, 2);
  });

  // Ninja.js:422-464 ItemStat, gloves (type 1 subType 0).
  it.each([
    [1, 13.41],
    [100, 39.29]
  ])('ninjaGloveStat at level %s gives %s', (level, expected) => {
    expect(FORMULAS.ninjaGloveStat(level, { base: 5 })).toBeCloseTo(expected, 2);
  });

  // Ninja.js:9-21 gemstone bonus as a discount (sneaking.ts getGemstoneBonus is module-private, so the values stand as pins).
  it.each([
    [1, 3.3793],
    [1e7, 96.155]
  ])('affineDecayCheaper at level %s gives %s', (level, expected) => {
    expect(FORMULAS.affineDecayCheaper(level, { base: 1, scale: 2500, offset: 1000 })).toBeCloseTo(expected, 4);
  });

  // N.js:68754 NotateNumber(x, "Big") floors below 1,000 only.
  it.each([
    [3, 10],
    [300, 1050]
  ])('notateBig at level %s gives %s', (level, expected) => {
    expect(FORMULAS.notateBig(level, { formula: 'linear', args: { perLevel: 3.5 } })).toBe(expected);
  });
});

describe('World 7 formulas', () => {
  // Spelunk.js:234-268 ShopUpgCost, printed through N.js:118794, which rounds up below 1e5 only.
  // spelunking.ts:860-880 keeps the cost inside an unexported function, so the values stand as pins.
  it.each([
    [0, { base: 0.07, rate: 1.5, below: 1e5 }, 1],
    [1, { base: 0.07, rate: 1.5, below: 1e5 }, 7],
    [9, { base: 0.07, rate: 1.5, below: 1e5 }, 139],
    [1, { base: 0.4 * Math.pow(9.5, 5) * 6.3, rate: 7.2, below: 1e5 }, expect.closeTo(3860863.36575, 4)]
  ])('spelunkShopCost at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.spelunkShopCost(level, args)).toEqual(expected);
  });

  // Thingies.js:70-91 ZenithMarketCost and the Orblet Market cost: floored below 1e6.
  it.each([
    [0, { formula: 'powPlusLevel', args: { base: 1, rate: 1.14 }, below: 1e6 }, 1],
    [1, { formula: 'powPlusLevel', args: { base: 1, rate: 1.14 }, below: 1e6 }, 2],
    [9, { formula: 'powPlusLevel', args: { base: 1, rate: 1.14 }, below: 1e6 }, 12],
    [200, { formula: 'powPlusLevel', args: { base: 1, rate: 1.14 }, below: 1e6 }, expect.closeTo(240419819995.2477, 2)],
    [1, { formula: 'powPlusLevel', args: { base: 2, rate: 50 }, below: 1e6 }, 101],
    [1, { formula: 'nope' }, null]
  ])('floorBelow at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.floorBelow(level, args)).toEqual(expected);
  });

  // Bubbastuff.js:47-57 UpgCost (bubba.ts:140-160 keeps it unexported).
  it.each([
    [0, { scale: 1, perLevel: 1, base: 1, rate: 1.07 }, 1],
    [1, { scale: 1, perLevel: 1, base: 1, rate: 1.07 }, 2.07],
    [9, { scale: 1, perLevel: 1, base: 1, rate: 1.07 }, 10.8385],
    [0, { scale: 1.6, perLevel: 81, base: Math.pow(2.4 + 8 / 3.65, 8), rate: 125 }, 316205.3265]
  ])('linearPlusPow at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.linearPlusPow(level, args)).toBeCloseTo(expected, 4);
  });

  // N.js:121561 Minehead Numbahs: one extra step from level `at`.
  it.each([
    [1, 2],
    [8, 9],
    [9, 11],
    [17, 19]
  ])('affineStep at level %s gives %s', (level, expected) => {
    expect(FORMULAS.affineStep(level, { base: 1, perLevel: 1, at: 9, step: 1 })).toBe(expected);
  });

  // N.js:121561 Minehead Jackpot Time "1 in $" rounds up; at level 1 inverseLinear rounds the same 99.0099 down.
  it.each([
    ['inverseLinearCeil', 1, 100],
    ['inverseLinearCeil', 100, 50],
    ['inverseLinear', 1, 99]
  ])('%s at level %s gives %s', (formula, level, expected) => {
    expect(FORMULAS[formula](level, { base: 100, perLevel: 0.01 })).toBe(expected);
  });

  // N.js:121561 the two Minehead tables: a value per level, clamped to the table at both ends.
  it.each([
    [0, 1],
    [1, 1.2],
    [5, 1.4],
    [-1, 1]
  ])('lookup at level %s gives %s', (level, expected) => {
    expect(FORMULAS.lookup(level, { values: [1, 1.2, 1.4] })).toBe(expected);
  });

  // Advice Fish prints `{` as ceil(100 b) / 100 (N.js:218019); the sushi Knowledge `{` goes through CommaNotation,
  // which rounds to a whole number (N.js:122229).
  it.each([
    [3, { formula: 'growth', args: { func: 'decay', x1: 10, x2: 100 }, mode: 'ceil', digits: 2 }, 0.3],
    [1, { formula: 'linear', args: { perLevel: 2.5 } }, 3],
    [1, { formula: 'linear', args: { perLevel: 0.15 }, mode: 'floor', digits: 1 }, 0.1],
    // An inherited key is not a rounding mode: the value passes through unrounded.
    [1, { formula: 'linear', args: { perLevel: 2.5 }, mode: 'toString' }, 2.5],
    [1, { formula: 'nope' }, null],
    // Sacrifice of Harvest (N.js:111973): `}` is MultiplierInfo below a bonus of 1,000, floored from it.
    [199, { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.05 }, mode: 'floor', from: 11 }, expect.closeTo(10.95, 9)],
    [201, { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.05 }, mode: 'floor', from: 11 }, 11],
    [199, { formula: 'growth', args: { func: 'bigBase', x1: 1, x2: 0.05 }, mode: 'floor' }, 10]
  ])('rounded at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.rounded(level, args)).toEqual(expected);
  });
});

describe('Classes formulas', () => {
  // GrimoireUpgCost (N.js:106375) and ArcaneUpgCost (N.js:107167); getGrimoireTotalUpgradeCost (grimoire.ts:244)
  // is the parity oracle the row tests use.
  it.each([
    [0, { scale: 3, base: 8, rate: 1.11 }, 24],
    [1, { scale: 3, base: 8, rate: 1.11 }, expect.closeTo(32.97, 9)],
    [9, { scale: 3, base: 8, rate: 1.11 }, expect.closeTo(157.4598831437116, 6)],
    [1, { scale: 3, base: 8, rate: 1.09 }, expect.closeTo(32.43, 9)]
  ])('affinePowPlusLevel at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.affinePowPlusLevel(level, args)).toEqual(expected);
  });

  // Royal Talent Points I, slot 1 (N.js:107842): a flat 2 below level 3, then 25 x 1.24 x 8 x 0.2 x 1.13^L.
  it.each([
    [0, { below: 3, flat: 2, formula: 'pow', args: { base: 49.6, rate: 1.13 } }, 2],
    [2, { below: 3, flat: 2, formula: 'pow', args: { base: 49.6, rate: 1.13 } }, 2],
    [3, { below: 3, flat: 2, formula: 'pow', args: { base: 49.6, rate: 1.13 } }, expect.closeTo(71.5676912, 6)],
    [1, { below: 0, formula: 'nope' }, null]
  ])('flatBelow at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.flatBelow(level, args)).toEqual(expected);
  });

  // The compass `{` below a bonus per level of 0.9 (N.js:118270): NotateNumber(x, "Small").
  it.each([
    [1, { formula: 'linear', args: { perLevel: 0.02 } }, 0.02],
    [51, { formula: 'linear', args: { perLevel: 0.02 } }, 1],
    [1, { formula: 'growth', args: { func: 'decay', x1: 100, x2: 100 } }, 0.99],
    [10, { formula: 'growth', args: { func: 'decay', x1: 100, x2: 100 } }, 9.1],
    [501, { formula: 'linear', args: { perLevel: 0.2 } }, 100],
    [5001, { formula: 'linear', args: { perLevel: 0.2 } }, expect.closeTo(1000.2, 9)],
    [1, { formula: 'nope' }, null]
  ])('notateSmall at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.notateSmall(level, args)).toEqual(expected);
  });

  // Moon of Sneak (CompassBonus 45, N.js:107131).
  it.each([
    [1, 1.01],
    [49, 1.49],
    [50, 2],
    [100, 5]
  ])('linearDoubling at level %s gives %s', (level, expected) => {
    expect(FORMULAS.linearDoubling(level, { base: 1, perLevel: 0.01, every: 50 })).toBeCloseTo(expected, 9);
  });

  // FamilyBonsuesREAL and FormatBonuses (N.js:80499-80504); getFamilyBonusBonus (parsers/family.ts:6-9) gives the
  // raw values these round.
  it.each([
    [100, { func: 'decay', x1: 20, x2: 180, offset: 69 }, 2.94],
    [500, { func: 'decay', x1: 20, x2: 180, offset: 69 }, 14.1],
    [100, { func: 'intervalAdd', x1: 1, x2: 5, offset: 9 }, 19],
    [500, { func: 'decayMulti', x1: 1.4, x2: 800, offset: 129 }, 1.44],
    [10, { func: 'decayMulti', x1: 1.4, x2: 800, offset: 129 }, 1],
    // Raw 20.62: a decay below 25 keeps tenths.
    [500, { func: 'decay', x1: 25, x2: 100, offset: 29 }, 20.6]
  ])('familyBonus at level %s with %o gives %s', (level, args, expected) => {
    expect(FORMULAS.familyBonus(level, args)).toBe(expected);
  });
});
