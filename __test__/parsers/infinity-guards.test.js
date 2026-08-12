import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getHighestLevelCharacter } from '@parsers/misc';
import { getTrapsBonuses } from '@parsers/world-3/traps';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

describe('Math.max/min over an empty character list', () => {
  describe('getHighestLevelCharacter', () => {
    const preFix = (characters) => Math.max(...characters.map(({ level }) => level ?? 0));

    it('the pre-fix expression really did return -Infinity with no characters', () => {
      expect(preFix([])).toBe(-Infinity);
    });

    it('returns 0, not -Infinity, with no characters', () => {
      expect(getHighestLevelCharacter([])).toBe(0);
    });

    it('returns 0 when the character list is missing entirely', () => {
      expect(getHighestLevelCharacter(undefined)).toBe(0);
    });

    it('is unchanged for a real character list', () => {
      const characters = [{ level: 12 }, { level: 87 }, { level: 40 }];
      expect(getHighestLevelCharacter(characters)).toBe(87);
      expect(getHighestLevelCharacter(characters)).toBe(preFix(characters));
    });

    it('treats a character with no level as level 0 rather than skipping the list', () => {
      expect(getHighestLevelCharacter([{ level: undefined }, { level: 5 }])).toBe(5);
    });
  });

  describe('getTrapsBonuses', () => {
    const preFix = (bonuses) => Math.max(...(bonuses || [1]));

    it('the pre-fix fallback really was unreachable for an empty list', () => {
      expect([]).toBeTruthy();
      expect(preFix([])).toBe(-Infinity);
    });

    it('every rate is finite with no characters', () => {
      const bonuses = getTrapsBonuses({}, []);
      const rates = [bonuses.max.critter, bonuses.max.exp, bonuses.min.critter, bonuses.min.exp];
      for (const rate of rates) expect(Number.isFinite(rate)).toBe(true);
      expect(rates).toEqual([1, 1, 1, 1]);
    });

    it('every rate is finite when the character list is missing entirely', () => {
      const bonuses = getTrapsBonuses({}, undefined);
      expect(Number.isFinite(bonuses.max.critter)).toBe(true);
      expect(Number.isFinite(bonuses.min.exp)).toBe(true);
    });

    it('still reduces a real character list to its max and min', () => {
      const { account, characters } = parseFixture(raw);
      const bonuses = getTrapsBonuses(account, characters);
      expect(characters.length).toBeGreaterThan(1);
      expect(bonuses.max.critter).toBeGreaterThanOrEqual(bonuses.min.critter);
      expect(bonuses.max.exp).toBeGreaterThanOrEqual(bonuses.min.exp);
      for (const rate of [bonuses.max.critter, bonuses.max.exp, bonuses.min.critter, bonuses.min.exp]) {
        expect(Number.isFinite(rate)).toBe(true);
      }
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

    it('no artifact bonus is a non-finite number on an empty parse', () => {
      const { account } = parseEmpty();
      const nonFinite = (account?.sailing?.artifacts ?? [])
        .filter(({ bonus }) => typeof bonus === 'number' && !Number.isFinite(bonus))
        .map(({ name, bonus }) => `${name}: ${bonus}`);
      expect(nonFinite).toEqual([]);
    });
  });
});
