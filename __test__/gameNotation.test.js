import { describe, expect, it } from 'vitest';
import { gameNotation } from '@website-data';
import { formatGame, modeFor } from '@utility/gameNotation';

// The modes notateNumber has an arm for (Big is its default arm), plus Comma for commaNotation. A game update that
// adds a mode (2.3.540 added LargeE) fails here instead of printing that stat in Big without a word.
const PORTED_MODES = ['Big', 'Small', 'MultiplierInfo', 'Whole', 'Micro', 'Smallish', 'Smaller', 'Bigish', 'TinyE', 'LargeE', 'Bits', 'Comma'];
const isRule = (rule) => PORTED_MODES.includes(rule) || (Array.isArray(rule) && rule.length === 3 &&
  PORTED_MODES.includes(rule[0]) && typeof rule[1] === 'number' && PORTED_MODES.includes(rule[2]));

describe('gameNotation', () => {
  it('holds only rules the toolbox can print', () => {
    const entries = Object.entries(gameNotation);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.filter(([, rule]) => !isRule(rule))).toEqual([]);
  });
});

describe('formatGame', () => {
  // The game tests `1e4 < x`, so the threshold itself keeps the first mode.
  it.each([
    ['Small', 5, 'Small'],
    [['MultiplierInfo', 1e4, 'Big'], 23.4, 'MultiplierInfo'],
    [['MultiplierInfo', 1e4, 'Big'], 1e4, 'MultiplierInfo'],
    [['MultiplierInfo', 1e4, 'Big'], 2e4, 'Big']
  ])('modeFor(%j, %s) = %s', (rule, value, expected) => {
    expect(modeFor(rule, value)).toBe(expected);
  });

  it('prints a stat it has no rule for in Big, the most common mode in the game, with the sign drawn outside', () => {
    expect([formatGame(1234, 'Not.AStat'), formatGame(-1234, 'Not.AStat'), formatGame(undefined, 'Not.AStat')])
      .toEqual(['1.24K', '-1.24K', '-']);
  });
});
