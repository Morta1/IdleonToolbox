import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import latest from '../fixtures/latest.json';

const parseWith = (mutate) => {
  const clone = structuredClone(latest);
  const isString = typeof clone.data.OptLacc === 'string';
  const options = isString ? JSON.parse(clone.data.OptLacc) : clone.data.OptLacc;
  mutate(options);
  clone.data.OptLacc = isString ? JSON.stringify(options) : options;
  const { data, charNames, companion, guildData, serverVars } = clone;
  return parseData(data, charNames, companion, guildData, serverVars).account.islands;
};

// The game drops Math.ceil(Math.min(100, drops)) trash per collection, so a long absence can
// never yield more than 100 no matter how large the reset counter grows.
describe('trashPerDaysAfk', () => {
  it('caps a huge reset counter at 100', () => {
    const islands = parseWith((o) => { o[160] = 2228; o[163] = 10; });
    expect(islands.trashPerDaysAfk).toBe(100);
  });

  it('is 0 with no unclaimed days', () => {
    const islands = parseWith((o) => { o[160] = 0; });
    expect(islands.trashPerDaysAfk).toBe(0);
  });

  it('matches the game formula below the cap', () => {
    const islands = parseWith((o) => { o[160] = 5; o[163] = 0; });
    // base = 5.25, floor(1.01 + .5 + .05 + 0) = 1 -> round(3 * 5.25 * 1) = 16
    expect(islands.trashPerDaysAfk).toBe(16);
  });
});
