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
const STANDALONE = { mining: getMiningEff, cooking: getCookingEff, laboratory: getLabEfficiency, spelunking: getSpelunkingEfficiency };

describe('skill efficiency stand-alone helpers', () => {
  const { account, characters } = parseFixture(latest);
  const cases = Object.keys(STANDALONE).flatMap((skill) => characters.map(({ name }) => [skill, name]));

  it.each(cases)('%s for %s matches the drawer value', (skill, name) => {
    const character = characters.find((entry) => entry.name === name);
    const playerInfo = getMaxDamage(character, characters, account);
    const { value } = getSkillEfficiency(skill, character, characters, account, playerInfo);
    expect(value).toBe(STANDALONE[skill](character, characters, account, playerInfo));
  });
});
