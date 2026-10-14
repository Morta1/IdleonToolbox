import { describe, expect, it } from 'vitest';
import { owlData, poppyBonuses, poppyTarBonuses, statues } from '@website-data';
import { costAt, costToMax, formatAmount, FORMULAS, levelledText } from '@utility/wiki/effects.mjs';

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
