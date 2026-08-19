import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { tryToParse } from '@utility/helpers';
import latest from '../fixtures/latest.json';

// A raw Jars entry is [typeIndex, tierExponent, x, y, roll]; the exponent is what the game
// raises 10 to when the jar breaks, so a tier N jar is worth 10^(N-1) tier 1 jars.
const rawJars = tryToParse(latest.data.Jars) || [];

const parse = () => {
  const { data, charNames, companion, guildData, serverVars } = structuredClone(latest);
  return parseData(data, charNames, companion, guildData, serverVars).account.hole.caverns.theJars;
};

const parseEmpty = () => {
  const clone = structuredClone(latest);
  clone.data.Jars = '[]';
  const { data, charNames, companion, guildData, serverVars } = clone;
  return parseData(data, charNames, companion, guildData, serverVars).account.hole.caverns.theJars;
};

describe('the jars inventory', () => {
  it('returns an entry per jar type when no jars are held', () => {
    const { jarInventory, totalJarQuantity } = parseEmpty();
    expect(jarInventory).toHaveLength(10);
    expect(jarInventory.every(({ total, quantity, tiers }) => total === 0 && quantity === 0 && tiers.length === 0))
      .toBe(true);
    expect(totalJarQuantity).toBe(0);
  });

  it('counts every held jar exactly once', () => {
    const { jarInventory, totalJars } = parse();
    expect(rawJars.length).toBeGreaterThan(0);
    expect(totalJars).toBe(rawJars.length);
    expect(jarInventory.reduce((sum, { total }) => sum + total, 0)).toBe(rawJars.length);
  });

  it('buckets jars by type and 1-based tier', () => {
    const expected = {};
    rawJars.forEach(([type, exponent]) => {
      const key = `${type}-${exponent + 1}`;
      expected[key] = (expected[key] ?? 0) + 1;
    });
    const actual = {};
    parse().jarInventory.forEach(({ tiers }, type) => tiers.forEach(({ tier, count }) => {
      actual[`${type}-${tier}`] = count;
    }));
    expect(actual).toEqual(expected);
  });

  it('converts each tier to its tier 1 equivalent quantity', () => {
    const expected = rawJars.reduce((sum, [, exponent]) => sum + Math.pow(10, exponent), 0);
    const { jarInventory, totalJarQuantity } = parse();
    expect(totalJarQuantity).toBe(expected);
    expect(jarInventory.reduce((sum, { quantity }) => sum + quantity, 0)).toBe(expected);
  });

  it('exposes the same inventory on each jar card, tiers sorted ascending', () => {
    const { jars, jarInventory } = parse();
    jars.forEach(({ owned }, index) => {
      expect(owned).toBe(jarInventory[index]);
      expect(owned.tiers).toEqual([...owned.tiers].sort((a, b) => a.tier - b.tier));
    });
  });
});
