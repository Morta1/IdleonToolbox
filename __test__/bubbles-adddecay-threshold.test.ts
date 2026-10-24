import '../polyfills';
import 'core-js/modules/web.structured-clone';
import { describe, expect, it } from 'vitest';
import {
  findAddDecayThresholdLevel,
  getBubbleEffectPercent,
  getBubbleLevelForPercent,
  getMaxBonus
} from '@parsers/world-2/alchemy';
import { growth } from '@utility/helpers';
import { parseData } from '@parsers/index';
import raw from '../data/raw.json';
import latest from './fixtures/latest.json';
import { parseFixture } from './helpers/parsed-fixtures';

// addDECAY is x1 * level up to level 50000, then decays toward a second x1 * 50000,
// so the hard cap is x1 * 100000 and every threshold below 100% has an exact level.
describe('addDECAY threshold level', () => {
  const cases = [
    { x1: 1, threshold: 50, expected: 50000 },
    { x1: 1, threshold: 80, expected: 275000 },
    { x1: 1, threshold: 90, expected: 650000 },
    { x1: 1, threshold: 99, expected: 7400000 },
    { x1: 4, threshold: 90, expected: 650000 }
  ];

  it.each(cases)('x1=$x1 threshold=$threshold', ({ x1, threshold, expected }) => {
    const maxBonus = getMaxBonus('addDECAY', x1);
    const level = findAddDecayThresholdLevel('addDECAY', x1, 0, 1, threshold, maxBonus);

    expect(level).toBeCloseTo(expected, 3);
    expect(growth('addDECAY', level, x1, 0, false) / maxBonus * 100).toBeCloseTo(threshold, 6);
  });

  it('reports the 100% hard cap as unreachable', () => {
    expect(findAddDecayThresholdLevel('addDECAY', 1, 0, 1, 100, getMaxBonus('addDECAY', 1))).toBe(Infinity);
  });

  it('cancels out the prisma multi baked into maxBonus', () => {
    const prismaMulti = 2.5;
    const maxBonus = getMaxBonus('addDECAY', 1) * prismaMulti;

    expect(findAddDecayThresholdLevel('addDECAY', 1, 0, prismaMulti, 90, maxBonus)).toBeCloseTo(650000, 3);
  });

  it('gives every addDECAY bubble a finite target level', () => {
    const { data, charNames, companion, guildData, serverVars } = raw as any;
    const { account }: any = parseData(data, charNames, companion, guildData, serverVars, 0, null);
    const bubbles = Object.values(account?.alchemy?.bubbles ?? {}).flat() as any[];
    const addDecay = bubbles.filter((bubble) => bubble?.func?.toLowerCase() === 'adddecay');

    expect(addDecay.map(({ bubbleName }) => bubbleName))
      .toEqual(expect.arrayContaining(['ROID_RAGIN', 'BIG_MEATY_CLAWS']));

    for (const { func, x1, x2 } of addDecay) {
      const maxBonus = getMaxBonus(func, x1);
      const level = findAddDecayThresholdLevel(func, x1, x2, 1, 90, maxBonus);

      expect(Number.isFinite(level)).toBe(true);
      expect(growth(func, level, x1, x2, false) / maxBonus * 100).toBeCloseTo(90, 6);
    }
  });
});

describe('bubble effect percent', () => {
  const { account } = parseFixture(latest) as any;
  const bubbles = account.alchemy.bubblesFlat;
  const decay = bubbles.find((b: any) => b.func === 'decay');
  const uncapped = bubbles.find((b: any) => b.func === 'bigBase');
  const addDecay = bubbles.find((b: any) => b.func === 'addDECAY');

  it('decay bubble at level x2 is 50%', () => {
    expect(getBubbleEffectPercent(account, decay, decay.x2)).toBeCloseTo(50, 9);
  });

  it('bubbles without a max bonus have no percent', () => {
    expect(getBubbleEffectPercent(account, uncapped)).toBeNull();
    expect(getBubbleLevelForPercent(account, uncapped, 90)).toBeNull();
  });

  it.each([decay, addDecay].flatMap((b: any) => [50, 90, 99].map((p) => [b.func, p, b])))(
    '%s: level for %i%% reaches the percent and one level less does not', (_: any, p: any, b: any) => {
      const lv = getBubbleLevelForPercent(account, b, p) as number;
      expect(Number.isInteger(lv)).toBe(true);
      expect(getBubbleEffectPercent(account, b, lv)).toBeGreaterThanOrEqual(p);
      expect(getBubbleEffectPercent(account, b, lv - 1)).toBeLessThan(p);
    });
});
