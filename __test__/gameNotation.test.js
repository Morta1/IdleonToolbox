import { describe, expect, it } from 'vitest';
import { gameNotation } from '@website-data';
import { fillVoteText, formatGame, minorBonusText, modeFor } from '@utility/gameNotation';

// The modes notateNumber has an arm for (Big is its default arm), plus Comma for commaNotation. A game update that
// adds a mode (2.3.540 added LargeE) fails here instead of printing that stat in Big without a word. Floor, Tenths,
// Round and Ceil are z-processing's names for the game's plain arithmetic fills.
const PORTED_MODES = ['Big', 'Small', 'MultiplierInfo', 'Whole', 'Micro', 'Smallish', 'Smaller', 'Bigish', 'TinyE', 'LargeE', 'Bits', 'Comma',
  'Floor', 'Tenths', 'Round', 'Ceil'];
const isRule = (rule) => PORTED_MODES.includes(rule) || (Array.isArray(rule) && rule.length % 2 === 1 &&
  rule.every((part, index) => (index % 2 === 0 ? PORTED_MODES.includes(part) : typeof part === 'number')));

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

  // Rules Task 0's regeneration added: plain arithmetic, a switch in a switch.
  it.each([
    [1256.09, 'ArcaneType.Arcane_AttackSpdPCT', '1256'],
    [156.78, 'Windwalker.Compass_CRITPCT', '156.7'],
    [12.5, 'Summoning.GrimoireBonesDropDEC', '12.50'],
    [12345, 'Summoning.GrimoireBonesDropDEC', '12,345'],
    [4.11e6, 'Summoning.GrimoireBonesDropDEC', '4.11M']
  ])('formatGame(%s, %s) = %s', (value, key, expected) => {
    expect(formatGame(value, key)).toBe(expected);
  });

  it('fills the game sentences the way the game does', () => {
    expect([fillVoteText('+{% Drop Rate, }x total', 35.24), minorBonusText(12.36, false), minorBonusText(12.36, true)])
      .toEqual(['+35.2% Drop Rate, 1.35x total', '12.3', '13']);
  });
});
