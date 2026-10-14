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

  // Callers that only know one cost keep reading the first.
  it('keeps costAt and costToMax on the first of several costs', () => {
    expect([costAt(twoCosts, 2), costToMax(twoCosts)]).toEqual([20, 70]);
  });

  it.each([
    [1234.4, '1,234'],
    [2.5e11, '2.50e11']
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
