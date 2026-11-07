import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getHighestLevelCharacter } from '@parsers/misc';
import { getTrapsBonuses } from '@parsers/world-3/traps';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

describe('Math.max/min over an empty character list', () => {
  describe('getHighestLevelCharacter', () => {
    it.each([
      ['no characters', [], 0],
      ['a missing character list', undefined, 0],
      ['a real character list', [{ level: 12 }, { level: 87 }, { level: 40 }], 87],
      ['a character with no level, read as level 0', [{ level: undefined }, { level: 5 }], 5]
    ])('%s', (_label, characters, expected) => {
      expect(getHighestLevelCharacter(characters)).toBe(expected);
    });
  });

  describe('getTrapsBonuses', () => {
    it.each([
      ['no characters', []],
      ['a missing character list', undefined]
    ])('every rate is 1 with %s', (_label, characters) => {
      const { max, min } = getTrapsBonuses({}, characters);
      expect([max.critter, max.exp, min.critter, min.exp]).toEqual([1, 1, 1, 1]);
    });

    it('still reduces a real character list to its max and min', () => {
      const { account, characters } = parseFixture(raw);
      const { perCharacter, max, min } = getTrapsBonuses(account, characters);
      expect(perCharacter).toHaveLength(characters.length);
      const rates = (key) => perCharacter.map((rate) => rate[key]);
      expect([max.critter, max.exp, min.critter, min.exp])
        .toEqual([Math.max(...rates('critter')), Math.max(...rates('exp')), Math.min(...rates('critter')), Math.min(...rates('exp'))]);
    });
  });

  describe('the sailing artifacts that read getHighestLevelCharacter', () => {
    it('renders no non-finite bonus in any artifact description on an empty parse', () => {
      const { account } = parseEmpty();
      const artifacts = account?.sailing?.artifacts ?? [];
      expect(artifacts.length).toBeGreaterThan(0);
      const bad = artifacts
        .filter(({ description }) => /Infinity|NaN/.test(description ?? ''))
        .map(({ name, description }) => `${name}: ${description}`);
      expect(bad).toEqual([]);
    });
  });
});
