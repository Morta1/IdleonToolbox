import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gameNotation } from '@website-data';
import { fillVoteText, formatGame, formatSystem, gameBonusText, minorBonusText, modeFor } from '@utility/gameNotation';
import { repoRelative, sourceFiles } from './helpers/source-files';

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

// Lane A (Numbers board): a page prints a stat in the game's own format by naming the game's key. A key the game
// data does not have prints in Big without a word, so every literal key a component passes must exist. Big itself
// is a mode, ItemCard.Cost's default.
const MODES = new Set(['Big']);
const KEY_USES = [/\bgame=\{?\s*['"]([^'"]+)['"]/g, /\bformatGame\([^,()]+(?:\([^()]*\))?[^,()]*,\s*['"]([^'"]+)['"]/g];

it('names only keys the game data has, wherever a component asks for the game format', () => {
  const unknown = [];
  for (const file of sourceFiles(['components', 'pages'], /\.(jsx|tsx|js)$/)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of KEY_USES) {
      for (const [, key] of source.matchAll(pattern)) {
        if (!MODES.has(key) && !(key in gameNotation)) unknown.push(`${repoRelative(file)}: ${key}`);
      }
    }
  }
  expect(unknown).toEqual([]);
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
    [4.11e6, 'Summoning.GrimoireBonesDropDEC', '4.11M'],
    [123456, 'MenagerieStuff.Cost', '123,456'],
    [1.5e9, 'MenagerieStuff.Cost', '1.5B']
  ])('formatGame(%s, %s) = %s', (value, key, expected) => {
    expect(formatGame(value, key)).toBe(expected);
  });

  it('takes the mode from the value the game switches a pair on', () => {
    expect([formatGame(64154, 'SushiStuff.KnowledgeXP_req', 167000), formatGame(5551, 'SushiStuff.KnowledgeXP_req', 217)])
      .toEqual(['64.2K', '5,551']);
  });

  // Lane B per system: Sailing's keyless amounts in Big at every size; another system, or a multiplier, keeps its kind
  it.each([
    [25000, 'amount', 'Sailing', '25K'],
    [58.38, 'amount', 'Sailing', '58'],
    [25000, 'amount', 'Hole', '25,000'],
    [1.5, 'mult', 'Sailing', '1.50x']
  ])('formatSystem(%s, %s, %s) prints %s', (value, kind, system, text) => {
    expect(formatSystem(value, kind, system)).toBe(text);
  });

  it('fills the game sentences the way the game does', () => {
    expect([fillVoteText('+{% Drop Rate, }x total', 35.24), minorBonusText(12.36, false), minorBonusText(12.36, true)])
      .toEqual(['+35.2% Drop Rate, 1.35x total', '12.3', '13']);
  });

  // Each system's rounding, one row per branch: a stamp's add reads its x1, a bubble's or vial's its x2
  it.each([
    [0.256, { func: 'decay' }, 'stamp', '0.26'],
    [0.54, { func: 'add', x1: 1 }, 'stamp', '0.5'],
    [12.34, { func: 'decay' }, 'stamp', '12.3'],
    [12.34, { func: 'add', x1: 0.5 }, 'stamp', '12.3'],
    [12.5, { func: 'add', x1: 1 }, 'stamp', '13'],
    [150.4, { func: 'decay' }, 'stamp', '150'],
    [1.634, { func: 'decayMulti' }, 'bubble', '1.63'],
    [0.35, { func: 'addDECAY' }, 'bubble', '0.4'],
    [24.94, { func: 'decay' }, 'bubble', '24.9'],
    [30.6, { func: 'decay' }, 'bubble', '31'],
    [5.554, { func: 'decay' }, 'vial', '5.55'],
    [12.34, { func: 'add', x2: 0 }, 'vial', '12.3'],
    [1.634, { func: 'decayMulti' }, 'vial', '2'],
    [150.4, { func: 'add', x2: 0 }, 'vial', '150']
  ])('gameBonusText(%s, %j, %s) = %s', (value, fields, system, expected) => {
    expect(gameBonusText(value, fields, system)).toBe(expected);
  });
});
