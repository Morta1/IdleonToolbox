// parsers/parseMaps.ts calls Array.prototype.toSimpleObject at module scope, so the polyfills have
// to be installed before any parser import is evaluated.
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getHighestLevelCharacter } from '@parsers/misc';
import { getTrapsBonuses } from '@parsers/world-3/traps';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import raw from '../../data/raw.json';

/**
 * "NaN" is only one of the shapes bad arithmetic takes, and the gates on this branch only ever
 * looked for that one. A logged-out sweep found five routes rendering a different shape - finite,
 * well-formed, and just as wrong: "Collect Rates: -Infinity%" (traps) and "+-Infinity% coins"
 * (sailing).
 *
 * Both come from the same mistake in two places: reducing an EMPTY list with Math.max/Math.min,
 * which return -Infinity and Infinity respectively rather than failing. A logged-out visitor has no
 * characters, so every character-derived list is empty and every such reduction is wrong.
 *
 * Each test below is paired with a check that the pre-fix expression really did produce a non-finite
 * value on the same input - without that, a guard could be silently unnecessary and these would pass
 * while proving nothing.
 */
describe('Math.max/min over an empty character list', () => {
  describe('getHighestLevelCharacter', () => {
    // The exact expression these functions used before the fix.
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
    // `characters?.map(...)` on an empty list returns [], which is truthy - so the `|| [1]` fallback
    // the parser used could only fire when `characters` was undefined, never when it was empty.
    const preFix = (bonuses) => Math.max(...(bonuses || [1]));

    it('the pre-fix fallback really was unreachable for an empty list', () => {
      expect([]).toBeTruthy();
      expect(preFix([])).toBe(-Infinity);
    });

    it('every rate is finite with no characters', () => {
      const bonuses = getTrapsBonuses({}, []);
      const rates = [bonuses.max.critter, bonuses.max.exp, bonuses.min.critter, bonuses.min.exp];
      for (const rate of rates) expect(Number.isFinite(rate)).toBe(true);
      // 1 is what the original `|| [1]` fallback intended; the page renders it as "100%".
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
    // Maneki Kat and Ashen Urn scale off the highest character level and interpolate the result
    // straight into their description, which is how -Infinity reached the page as text.
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
      // Deathskull leaves `bonus` undefined on an empty parse - it is only assigned inside an
      // `index === 33` branch. That is a separate, pre-existing gap in the empty-account contract
      // (an absent value, not a broken number) and nothing renders it today, so it is excluded here
      // rather than quietly widened into this fix.
      const nonFinite = (account?.sailing?.artifacts ?? [])
        .filter(({ bonus }) => typeof bonus === 'number' && !Number.isFinite(bonus))
        .map(({ name, bonus }) => `${name}: ${bonus}`);
      expect(nonFinite).toEqual([]);
    });
  });
});
