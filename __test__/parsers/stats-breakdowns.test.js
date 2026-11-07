import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { allFixtures } from '../helpers/save-fixtures';
import { expectNoBreaks } from '../helpers/sweep';
import { breakdownLines } from '../helpers/breakdown-tree';
import { evaluateBreakdown } from '@parsers/breakdown';
import { getRespawnRate } from '@parsers/character';

// The checks breakdown-totals.test.js does not make: respawn's divide root and its "Not fighting"
// short-circuit, and talent added levels matching the breakdown's own totalValue.
const FIXTURES = allFixtures();

const expectRebuilt = (rebuilt, value) => {
  // A character slot with no class or stats (fourth, fresh) has NaN damage and defence in the
  // formula itself; nan-elimination owns that, the tree can only mirror it
  if (Number.isNaN(value)) return;
  expect(Number.isFinite(rebuilt)).toBe(true);
  if (value === 0) expect(rebuilt).toBeCloseTo(0, 9);
  else expect(rebuilt / value).toBeCloseTo(1, 9);
};

const expectRenderable = (breakdown, value) => {
  if (Number.isNaN(value)) return;
  const bad = breakdownLines(breakdown.tree)
    .filter(({ value }) => typeof value !== 'number' || Number.isNaN(value))
    .map(({ name, value }) => `${name} = ${value}`);
  expect(bad).toEqual([]);
};

describe('stats breakdowns, on every character of every save', () => {
  const everyCharacter = FIXTURES.flatMap(([save, fixture]) => {
    const { account, characters } = parseFixture(fixture);
    return characters.map((character) => ({ save, account, character }));
  });
  const nameOf = ({ save, character }) => `${save} ${character.name}`;

  it('respawn rate', () => {
    expectNoBreaks(everyCharacter, nameOf, ({ account, character }) => {
      const { respawnRate, breakdown } = getRespawnRate(character, account);
      if (breakdown.tree[0].name === 'Not fighting') {
        expect(respawnRate).toBe(0);
        return [];
      }
      expect(breakdown.combine).toBe('divide');
      expectRebuilt(evaluateBreakdown(breakdown), respawnRate);
      expectRenderable(breakdown);
      return [];
    });
  });

  it('talent added levels', () => {
    expectNoBreaks(everyCharacter, nameOf, ({ character }) => {
      // Empty slots: no talents, so no added levels at all
      if (!character.addedLevelsBreakdown) {
        expect(character.addedLevels).toBeUndefined();
        return [];
      }
      expectRebuilt(evaluateBreakdown(character.addedLevelsBreakdown), character.addedLevels);
      expect(character.addedLevelsBreakdown.totalValue).toBe(character.addedLevels);
      expectRenderable(character.addedLevelsBreakdown);
      if (character.talentPreset?.addedLevelsBreakdown) {
        expectRebuilt(evaluateBreakdown(character.talentPreset.addedLevelsBreakdown), character.talentPreset.addedLevels);
      }
      return [];
    });
  });
});
