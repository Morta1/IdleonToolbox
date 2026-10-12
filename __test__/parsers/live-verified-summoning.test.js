import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getLoggedInSkillLevel } from '@parsers/misc';
import { evaluateBreakdownNode, findBreakdownNode } from '@parsers/breakdown';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches).
const GAME = {
  // Lv0[18], the logged-in summoning level
  summoningLevel: 146
};
// Summoning upgrades the game scales by Lv0[18]
const LEVEL_SCALED_UPGRADES = [30, 40, 46, 52, 58, 65, 66, 67];

// Read on 2026-10-12, logged in as MortasNinth (Lv0[18] 166)
const ESSENCE_GAME = {
  // Summoning("SummRockEssGen", t, 0) for t 0..7, white to teal, per hour
  essencePerHour: [6.23894855284018e+23, 9.434036885501615e+22, 1.591302734559201e+23, 5.501203777516101e+22,
    7.914995057569067e+22, 3.0906088254619994e+23, 2.8585716904444523e+21, 7197258399014981000],
  // DNSM.SumAllEss, the multiplier every colour shares
  allEssence: 2612295142064.837,
  // Summoning("SummVictories", t, 0): t 0 is every career win, endless included
  victories: [168, 15, 11, 14, 13, 13, 14, 9],
  // Inputs that moved since the save was exported: CauldronInfo[1][26] (quicc ESSENCE_BOOST),
  // CauldronInfo[2][29] (ESSENCE_CHAPTER) and Holes[15] (monument levels: the essence one, and the one in
  // the gambit points multiplier)
  drifted: {
    quiccEssenceBoost: 1673,
    essenceChapter: 1665,
    monumentLevels: [12210, 12497, 13266, 13412, 13060, 12439, 12524, 12146, 0, 0, 12864, 12062, 0, 12658, 12031, 12179, 0, 0,
      0, 0, 0, 11605, 0, 11618, 11620, 11607, 11619, 11607]
  }
};

const { account, characters } = parseFixture(latest);
const allUpgrades = Object.values(account.summoning.upgrades).flat();

const withLiveInputs = () => {
  const cauldrons = structuredClone(latest.data.CauldronInfo);
  cauldrons[1][26] = ESSENCE_GAME.drifted.quiccEssenceBoost;
  cauldrons[2][29] = ESSENCE_GAME.drifted.essenceChapter;
  const holes = JSON.parse(latest.data.Holes);
  ESSENCE_GAME.drifted.monumentLevels.forEach((level, index) => {
    holes[15][index] = level;
  });
  // A newer PTimeAway stamp makes MortasNinth the logged-in character
  return parseFixture({
    ...latest,
    data: {
      ...latest.data,
      CauldronInfo: cauldrons,
      Holes: JSON.stringify(holes),
      PTimeAway_8: Number(latest.data.PTimeAway_5) + 1
    }
  });
};
const asMortasNinth = withLiveInputs();
const essenceGain = asMortasNinth.account.summoning.essenceGain;

describe('summoning verified against the live game', () => {
  it('upgrades scaled by Lv0[18] use the logged-in summoning level', () => {
    expect(getLoggedInSkillLevel(characters, 'summoning')).toBe(GAME.summoningLevel);
    LEVEL_SCALED_UPGRADES.forEach((originalIndex) => {
      const upgrade = allUpgrades.find((u) => u?.originalIndex === originalIndex);
      within(upgrade.totalBonus || 0, (upgrade.value || 0) * GAME.summoningLevel);
    });
  });

  it('career wins per essence colour', () => {
    const { careerWins, totalWins } = asMortasNinth.account.summoning;
    expect([totalWins, ...Object.values(careerWins).slice(1)]).toEqual(ESSENCE_GAME.victories);
  });

  it('the all essence multiplier', () => {
    within(evaluateBreakdownNode(findBreakdownNode(essenceGain[0].breakdown.tree, 'All essence bonuses')),
      ESSENCE_GAME.allEssence);
  });

  it.each(ESSENCE_GAME.essencePerHour.map((value, index) => [index, value]))('essence per hour of colour %i', (index, value) => {
    within(essenceGain[index].value, value);
  });
});
