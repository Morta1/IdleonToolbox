import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMaxDamage } from '@parsers/damage';
import { getMiningEff, getSkillEfficiency } from '@parsers/efficiency';
import { getCookingEff } from '@parsers/world-4/cooking';
import { getLabEfficiency } from '@parsers/world-4/lab';
import { getSpelunkingEfficiency } from '@parsers/world-7/spelunking';
import { evaluateBreakdown } from '@parsers/breakdown';

const SKILLS = ['mining', 'chopping', 'fishing', 'catching', 'trapping', 'worship', 'cooking', 'laboratory', 'spelunking'];
// The stand-alone helpers other formulas use must agree with the drawer
const STANDALONE = { mining: getMiningEff, cooking: getCookingEff, laboratory: getLabEfficiency, spelunking: getSpelunkingEfficiency };

describe('skill efficiency breakdowns', () => {
  const { account, characters } = parseFixture(latest);
  const cases = SKILLS.flatMap((skill) => characters.map(({ name }) => [skill, name]));

  // Either base efficiency * multipliers, or base + base power * multipliers (a sum at the root)
  it.each(cases)('%s for %s reproduces the value', (skill, name) => {
    const character = characters.find((entry) => entry.name === name);
    const playerInfo = getMaxDamage(character, characters, account);
    const { value, breakdown } = getSkillEfficiency(skill, character, characters, account, playerInfo);
    expect(evaluateBreakdown(breakdown) / value).toBeCloseTo(1, 9);
    if (STANDALONE[skill]) expect(value).toBe(STANDALONE[skill](character, characters, account, playerInfo));
  });
});
