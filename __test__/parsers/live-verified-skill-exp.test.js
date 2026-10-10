import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAllSkillsExp, getSkillExpMulti } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { getAllBaseSkillEff } from '@parsers/efficiency';
import { evaluateBreakdownNode } from '@parsers/breakdown';

// ExpMulti(skill) read from the running game on 10 Oct 2026 for IAmTheHunterrr, the active
// character, through the debug server; latest.json is the same account's save from that day.
// SkillStats("AllSkillxpMULTI") was 3.25 for this account.
const GAME_SKILL_EXP = {
  mining: 307.8461293244795,
  smithing: 73.20148544226716,
  chopping: 258.23682193009023,
  fishing: 495.07967594329995,
  alchemy: 343.7048833550782,
  catching: 257.4876622644827,
  trapping: 252.15787413971208,
  worship: 220.59731589003493,
  breeding: 820.4186680847013,
  cooking: 474217.8269521059,
  // Sailing("SailingExpMulti"), Summoning("SummEXPgain"), FarmingStuffs("FarmingEXP"),
  // Divinity("DivPerHr_EXP", player) and WorkbenchStuff("PlayerConExp") without its per-hour base.
  sailing: 12.869566666666667,
  summoning: 2774.485354409277,
  farming: 499942325291.8192,
  divinity: 3408153.8206929043,
  construction: 4948458.848673361
};

describe('skill EXP verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
  const playerInfo = getMaxDamage(hunter, characters, account);

  it.each(Object.entries(GAME_SKILL_EXP))('%s', (skill, value) => {
    expect(getSkillExpMulti(skill, hunter, characters, account, playerInfo).value / value).toBeCloseTo(1, 9);
  });

  // The drawer must add up: the top-level groups combine as each breakdown's formula says.
  it.each(Object.keys(GAME_SKILL_EXP))('%s breakdown reproduces the value', (skill) => {
    const { value, breakdown } = getSkillExpMulti(skill, hunter, characters, account, playerInfo);
    const top = (name) => evaluateBreakdownNode(breakdown.tree.find((node) => node.name === name));
    const term = (name) => breakdown.tree.find((node) => node.name === 'Efficiency').children
      .find((line) => line.name === name).value;
    const productOfAll = () => breakdown.tree.filter((node) => node.combine !== 'list')
      .reduce((total, node) => total * evaluateBreakdownNode(node), 1);
    const rebuild = {
      smithing: () => top('Additive') * top('Multipliers') + top('Added after') / 100,
      cooking: () => top('Multipliers') * (term('Efficiency term (max 1)') + top('Added to the efficiency term') / 100),
      laboratory: () => term('Efficiency term') * productOfAll()
    }[skill] ?? productOfAll;
    expect(rebuild() / value).toBeCloseTo(1, 9);
  });

  it('all skill EXP and all base skill efficiency', () => {
    expect(getAllSkillsExp(hunter, characters, account).value).toBeCloseTo(6373.095124031275, 6);
    expect(getAllBaseSkillEff(hunter, account, characters, playerInfo)).toBeCloseTo(2194.437832300863, 6);
  });
});
