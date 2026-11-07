import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMaxDamage } from '@parsers/damage';
import { getMiningEff, getSkillEfficiency } from '@parsers/efficiency';
import { getCookingEff } from '@parsers/world-4/cooking';
import { getLabEfficiency } from '@parsers/world-4/lab';
import { getSpelunkingEfficiency } from '@parsers/world-7/spelunking';

// The stand-alone helpers other formulas use must agree with the drawer (breakdown-totals.test.js
// already rebuilds every skill's efficiency breakdown)
describe('skill efficiency stand-alone helpers', () => {
  const { account, characters } = parseFixture(latest);

  it.each([
    ['mining', getMiningEff],
    ['cooking', getCookingEff],
    ['laboratory', getLabEfficiency],
    ['spelunking', getSpelunkingEfficiency]
  ])('%s matches the drawer value for every character', (skill, standalone) => {
    const perCharacter = (read) => characters.map((character) => read(character, getMaxDamage(character, characters, account)));
    expect(perCharacter((character, playerInfo) => standalone(character, characters, account, playerInfo)))
      .toEqual(perCharacter((character, playerInfo) => getSkillEfficiency(skill, character, characters, account, playerInfo).value));
  });
});
