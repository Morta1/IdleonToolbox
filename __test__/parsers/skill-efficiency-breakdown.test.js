import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMaxDamage } from '@parsers/damage';
import { getMiningEff, getSkillEfficiency } from '@parsers/efficiency';
import { getCookingEff } from '@parsers/world-4/cooking';
import { getLabEfficiency } from '@parsers/world-4/lab';
import { getSpelunkingEfficiency } from '@parsers/world-7/spelunking';
import { evaluateBreakdownNode } from '@parsers/breakdown';

const SKILLS = ['mining', 'chopping', 'fishing', 'catching', 'trapping', 'worship', 'cooking', 'laboratory', 'spelunking'];
// The stand-alone helpers other formulas use must agree with the drawer
const STANDALONE = { mining: getMiningEff, cooking: getCookingEff, laboratory: getLabEfficiency, spelunking: getSpelunkingEfficiency };

describe('skill efficiency breakdowns', () => {
  const { account, characters } = parseFixture(latest);
  const cases = SKILLS.flatMap((skill) => characters.map(({ name }) => [skill, name]));

  // Either base efficiency * multipliers, or (base) + base power * multipliers
  it.each(cases)('%s for %s reproduces the value', (skill, name) => {
    const character = characters.find((entry) => entry.name === name);
    const playerInfo = getMaxDamage(character, characters, account);
    const { value, breakdown } = getSkillEfficiency(skill, character, characters, account, playerInfo);
    const top = (nodeName) => {
      const node = breakdown.tree.find((entry) => entry.name === nodeName);
      return node ? evaluateBreakdownNode(node) : 0;
    };
    const rebuilt = breakdown.tree.some(({ name: nodeName }) => nodeName === 'Base efficiency')
      ? top('Base efficiency') * top('Multipliers')
      : top('Base') + top('Base power') * top('Multipliers');
    expect(rebuilt / value).toBeCloseTo(1, 9);
    if (STANDALONE[skill]) expect(value).toBe(STANDALONE[skill](character, characters, account, playerInfo));
  });
});
