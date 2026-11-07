import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getIslands } from '@parsers/world-2/islands';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';

const islandsWith = (overrides) => {
  const { account, characters } = parseFixture(latest);
  return getIslands({ ...account, accountOptions: Object.assign([...account.accountOptions], overrides) }, characters);
};

// The game drops Math.ceil(Math.min(100, drops)) trash per collection, so a long absence can
// never yield more than 100 no matter how large the reset counter grows.
describe('trashPerDaysAfk', () => {
  it.each([
    ['caps a huge reset counter at 100', { 160: 2228, 163: 10 }, 100],
    ['is 0 with no unclaimed days', { 160: 0 }, 0],
    // base = 5.25, floor(1.01 + .5 + .05 + 0) = 1 -> round(3 * 5.25 * 1) = 16
    ['matches the game formula below the cap', { 160: 5, 163: 0 }, 16]
  ])('%s', (_label, overrides, expected) => {
    expect(islandsWith(overrides).trashPerDaysAfk).toBe(expected);
  });
});
