import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getAllSkillsExp, getSkillExpMulti, SAILING_EXP_CAP_NOTE } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { getAllBaseSkillEff } from '@parsers/efficiency';
import { evaluateBreakdown } from '@parsers/breakdown';
import { getBestActiveCharacter } from '@parsers/talents';

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
  construction: 4948458.848673361,
  // Read on 11 Oct 2026 against the refreshed latest.json, same character, game caches rebuilt.
  // SkillStats("LaboratoryEXPmulti"); its floored efficiency term was 54 (LaboratoryEXPmulti_DispB).
  laboratory: 221533.92002798445,
  // AllSkillxpMULTI * (1 + GamingStatType("GamingExpPCT") / 100), as GardenETC grants it (pct 6388.53)
  gaming: 210.87730404244707,
  // Ninja("xp", 5, 0) / NinjaInfo[11][floor]: live NinjaInfo is scaled vs website data, so compare per base EXP
  sneaking: 796800693.1582189
};
// The toolbox multiplies sneaking by the floor's base EXP (website data), the first node of its breakdown
const perBaseExp = (skill, { value, breakdown }) => skill === 'sneaking' ? value / breakdown.tree[0].value : value;

describe('skill EXP verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const hunter = characters.find(({ name }) => name === 'IAmTheHunterrr');
  const playerInfo = getMaxDamage(hunter, characters, account);

  it.each(Object.entries(GAME_SKILL_EXP))('%s', (skill, value) => {
    expect(perBaseExp(skill, getSkillExpMulti(skill, hunter, characters, account, playerInfo)) / value).toBeCloseTo(1, 9);
  });

  // The drawer must add up: the top-level groups combine as each breakdown's root says.
  it.each(Object.keys(GAME_SKILL_EXP))('%s breakdown reproduces the value', (skill) => {
    const { value, breakdown } = getSkillExpMulti(skill, hunter, characters, account, playerInfo);
    expect(evaluateBreakdown(breakdown) / value).toBeCloseTo(1, 9);
  });

  // Morojo's ninja wears EXP charms: live Ninja("xp", 9) per base EXP was 44.5237... times every other ninja's
  it('sneaking ninja charm multiplier', () => {
    const morojo = characters.find(({ name }) => name === 'Morojo');
    const { breakdown } = getSkillExpMulti('sneaking', morojo, characters, account, getMaxDamage(morojo, characters, account));
    const charms = breakdown.tree.find(({ name }) => name === 'Multipliers').children.find(({ name }) => name === 'Ninja charms');
    expect(charms.value).toBeCloseTo(35476558423.90475 / GAME_SKILL_EXP.sneaking, 9);
  });

  // Trips grant giveEXP(13, CaptainEXPgain * Math.min(1, SailingExpMulti)): live on 11 Oct 2026 the
  // grant per trip equalled CaptainEXPgain on all 20 boats, so the drawer keeps the tab value and flags the cap.
  it('sailing EXP multi flags the x1 cap the trip grant applies', () => {
    const { value, breakdown } = getSkillExpMulti('sailing', hunter, characters, account, playerInfo);
    expect(value).toBeGreaterThan(1);
    expect(breakdown.tree.find(({ name }) => name === 'Multipliers').note).toBe(SAILING_EXP_CAP_NOTE);
  });

  it('the save was exported with IAmTheHunterrr logged in', () => {
    expect(getBestActiveCharacter(characters)?.name).toBe('IAmTheHunterrr');
  });

  // The logged-in client computes these for every character with its own lookups (Ninja("xp") per
  // ninja, giveEXP handing the rest to everyone), so the viewed character must not change them.
  // Live: every ninja but Morojo's read the same Ninja("xp") per base EXP.
  it.each(['sneaking', 'breeding', 'sailing', 'gaming', 'farming', 'summoning'])('%s EXP multi is the same for every character', (skill) => {
    const others = characters.filter(({ name }) => skill !== 'sneaking' || name !== 'Morojo');
    expect(others.length).toBeGreaterThan(1);
    others.forEach((character) => {
      const multi = getSkillExpMulti(skill, character, characters, account, getMaxDamage(character, characters, account));
      expect(perBaseExp(skill, multi) / GAME_SKILL_EXP[skill], character.name).toBeCloseTo(1, 9);
    });
  });

  it('all skill EXP and all base skill efficiency', () => {
    expect(getAllSkillsExp(hunter, characters, account).value).toBeCloseTo(6373.095124031275, 6);
    expect(getAllBaseSkillEff(hunter, account, characters, playerInfo)).toBeCloseTo(2194.437832300863, 6);
  });
});
