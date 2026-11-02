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
const LEVEL_SCALED_UPGRADES = [30, 40, 52, 58, 65, 66, 67];

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

// Read on 2026-11-02, logged in as MortasNinth: the upgrade panel's "Total bonus", each upgrade's own branch of
// the panel's "}" expression, before CommaNotation
const PANEL_GAME = {
  totalBonus: {
    // SummUpgBonus(46) x SummVictories(5), the red circuit wins
    46: 527475
  },
  // Inputs that moved since the save was exported
  drifted: {
    upgradeLevels: [2920, 535, 0, 476, 817, 458, 1, 30, 1, 10, 517, 2727, 417, 863, 1, 332, 217, 10, 2749, 10, 461, 443,
      30, 932, 3, 1, 20, 2787, 30, 269, 1364, 443, 3, 826, 1, 494, 30, 544, 2281, 100, 1496, 3, 286, 675, 849, 30, 1623, 10,
      40, 644, 357, 332, 248, 687, 1566, 30, 327, 735, 221, 331, 163, 162, 325, 297, 272, 1338, 1598, 1425, 20, 30, 1, 1,
      668, 1128, 276, 7, 83, 336, 16, 30, 1092, 240],
    wonBattles: ['w7a10', 'rift4'],
    // Holes[28], the gambit doublers
    doubled: [60, 75, 65, 68],
    // OptionsListAccount[319]
    highestEndless: 73,
    // MortasNinth's Lv0[18]
    summoningLevel: 178,
    // MortaWiiz's ABSOLUTE_STARDOM before added levels: getbonus2(1, 597, -1) read 189.1
    absoluteStardom: 325
  }
};

const withLivePanelInputs = () => {
  const { upgradeLevels, wonBattles, doubled, highestEndless, summoningLevel, absoluteStardom } = PANEL_GAME.drifted;
  const summon = JSON.parse(latest.data.Summon);
  summon[0] = upgradeLevels;
  summon[1] = [...summon[1], ...wonBattles];
  const holes = JSON.parse(latest.data.Holes);
  holes[28] = [...holes[28], ...doubled];
  const options = [...latest.data.OptLacc];
  options[319] = highestEndless;
  const levels = [...latest.data.Lv0_8];
  levels[18] = summoningLevel;
  const talents = JSON.parse(latest.data.SL_4);
  talents[597] = absoluteStardom;
  return parseFixture({
    ...latest,
    data: {
      ...latest.data,
      Summon: JSON.stringify(summon),
      Holes: JSON.stringify(holes),
      OptLacc: options,
      Lv0_8: levels,
      SL_4: JSON.stringify(talents),
      PTimeAway_8: Number(latest.data.PTimeAway_5) + 1
    }
  });
};
const panelUpgrades = Object.values(withLivePanelInputs().account.summoning.upgrades).flat();

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

  it.each(Object.entries(PANEL_GAME.totalBonus))('the upgrade panel total bonus of upgrade %s', (index, value) => {
    within(panelUpgrades.find(({ originalIndex }) => originalIndex === Number(index)).totalBonus, value);
  });
});

// The upgrade panels round a cost up below 1,000 before printing it and checking it against the essence owned
// (Summoning("UpgCost") is 4.7e-9 for an early upgrade on the live account, which the panel reads as 1).
describe('summoning upgrade costs as the panel reads them', () => {
  it('every cost below 1,000 is a whole number of at least 1', () => {
    const low = allUpgrades.filter(({ totalCost }) => totalCost < 1000).map(({ totalCost }) => totalCost);
    expect(low.length).toBeGreaterThan(0);
    expect(low.every((cost) => Number.isInteger(cost) && cost >= 1)).toBe(true);
  });
});
