import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within, withLoggedInDivinity, withSkillLevel } from '../helpers/live-verified';
import { getGridBonusAllmulti, getResearch, getResearchGridCanSelect } from '@parsers/world-7/research';
import {
  applyShapeMoves, createResearchScorer, getCoveredNodes, getGridLabel, getInsightExpReq, getLensDrags, getObservationBaseRate, getTurnPresses,
  isInsideDragBounds, optimizeLenses, optimizeShapes, parseShapeCatalog
} from '@parsers/world-7/researchOptimizer';
import { research as researchData } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). "NoDoot" = DNSM.CompanionBon[0] set
// to 0 in try/finally, which is what a logged-in character under divinity 2 sees.
// 2.3.540 moved ArcadeBonus(63) out of the ResearchEXPmulti sum into its own (1 + x / 100) factor. The values
// marked "2.3.540" are the pre-patch live readings times exactly that move (x = 20.0995, the save's arcade 63):
// 1334.951583995417 -> x1.19440700, 1348.8645483483156 and 270914584.9203977 -> x1.19447496.
// 2.3.550 multiplies by KillroyBonuses(5) itself instead of (1 + it / 100); the values marked "2.3.550" are the
// 2.3.540 ones times that move (OptionsListAccount[469] = 8, Killroy 5 = 1.0405063): x1.0297912856104834.
// 2.3.561 adds Research Skill Mastery (RiftSkillBonus,19). The save's total Research LV is 902 (rank 6), so tiers 0-5
// apply: +10 and +15 into the sum, x1.10, +1 min roll, +2 grid points. The values marked "2.3.561" are the 2.3.550
// ones times that move: x1.1075465762576058 (sum factor 36.690365884178384) and live x1.1074683116420627 (37.072244863372205).
const GAME = {
  // ResearchStuff("ResearchEXPmulti"), 2.3.561 (1641.9769985610706 on 2.3.550)
  researchExpMulti: 1818.5660030500533,
  // Lv0[20], the logged-in research level
  researchLevel: 82,
  // ResearchStuff("Grid_Bonus_Allmulti", 0, 0)
  gridAllMulti: 1.06,
  gridAllMultiNoDoot: 1.01,
  // ResearchStuff("Grid_Bonus", 48, 0)
  grid48: 106,
  grid48NoDoot: 101,
  // Read 2026-10-12, logged in as MortasNinth; equinox clouds 0-35 and 37 completed, OptionsListAccount[193] = 0, research level 82.
  // ResearchStuff("MaxRoll" | "RollsPerDay" | "MagnifiersOwned" | "Grid_PTSearned" | "TinyCogsPerDay"): sushi RoG 30, 2, 8, 3 + 13, 40
  maxRoll: 106,
  rollsPerDay: 12,
  magnifiersOwned: 16,
  // 2.3.561 (114 on 2.3.550)
  gridPointsEarned: 116,
  tinyCogsPerDay: 4,
  // Read 2026-10-12, logged in as MortasNinth. ResearchStuff("AFKgainsRatePCT") = 100 * AFKgainrates("Research")
  afkGainsRatePct: 47.791,
  // ResearchStuff("ResearchEXPrateTOT") and ("ResearchEXPmulti") with the live inputs below, 2.3.561
  // (333241167.7603265 and 1659.1841940668237 on 2.3.550)
  researchExpRateTot: 369054033.42915815,
  researchExpMultiLive: 1837.4939181063817,
  // Read 2026-10-13: ResearchStuff("MSA_BonusRewards") = 1 + Grid_Bonus(170) / 100 while OptionsListAccount[501] is 0
  msaBonusRewards: 1.53
};

// The save moved on after latest.json: one more insight level, the lenses shifted one observation over, and
// the tome grew (Thingies("LoreEpiBon", 7, 0)). Read live on 2026-10-12.
const LIVE_RESEARCH_INPUTS = {
  insightLevel35: 6,
  lensSlots: [670, 193, 33, 0, 746, 193, 35, 0, 708, 193, 34, 2, 761, 191, 35, 0, 723, 191, 34, 2, 784, 153, 28, 1, 748, 151,
    27, 2, 799, 151, 28, 1, 722, 204, 34, 2, 760, 163, 27, 2, 710, 151, 26, 0, 722, 163, 26, 1, 798, 164, 28, 1, 760, 204, 35, 0,
    685, 191, 33, 0, 684, 204, 33, 0],
  tomeResearchBonus: 37.610713873172735
};

const data = latest.data ?? latest;
const { account, characters } = parseFixture(latest);

describe('research verified against the live game', () => {
  it.each([
    ['research EXP multi', account.research.researchEXPmulti, GAME.researchExpMulti, 1e-6],
    ['research AFK gains rate', account.research.researchAFKrate, GAME.afkGainsRatePct],
    ['MSA bonus rewards from grid 170', account.research.msaBonusRewards, GAME.msaBonusRewards],
    ['research level reads the logged-in character', account.research.researchLevel, GAME.researchLevel]
  ])('%s', (_, actual, expected, tolerance) => {
    within(actual, expected, tolerance);
  });

  it('observation rolls, magnifiers, grid points and tiny cogs', () => {
    const { maxRoll, rollsPerDay, magnifiersOwned, gridPTSearned, tinyCogsPerDay } = account.research;
    expect({ maxRoll, rollsPerDay, magnifiersOwned, gridPTSearned, tinyCogsPerDay }).toEqual({
      maxRoll: GAME.maxRoll,
      rollsPerDay: GAME.rollsPerDay,
      magnifiersOwned: GAME.magnifiersOwned,
      gridPTSearned: GAME.gridPointsEarned,
      tinyCogsPerDay: GAME.tinyCogsPerDay
    });
  });

  it('research EXP rate, live and while away', () => {
    const live = structuredClone(data);
    const research = JSON.parse(live.Research);
    research[4][35] = LIVE_RESEARCH_INPUTS.insightLevel35;
    LIVE_RESEARCH_INPUTS.lensSlots.forEach((value, index) => {
      research[5][index] = value;
    });
    live.Research = JSON.stringify(research);
    const loreBonuses = account.spelunking.loreBonuses.map((bonus, index) =>
      index === 7 ? { ...bonus, bonus: LIVE_RESEARCH_INPUTS.tomeResearchBonus } : bonus);
    const liveAccount = { ...account, spelunking: { ...account.spelunking, loreBonuses } };
    const { researchEXPmulti, researchEXPrateTOT, researchEXPrateAFK } = getResearch(live, liveAccount, characters,
      latest.serverVars);
    within(researchEXPmulti, GAME.researchExpMultiLive);
    within(researchEXPrateTOT, GAME.researchExpRateTot);
    // game: AFKcode banks t * min(1, AFKgainsRatePCT / 100) seconds, claimed at ResearchEXPrateTOT per hour
    within(researchEXPrateAFK, GAME.researchExpRateTot * Math.min(1, GAME.afkGainsRatePct / 100));
  });

  // Code-derived (the live logged-in character has research 82): AFKcode banks offline time into Research[7][3]
  // only when Lv0[20] > 0, so a logged-in character without research banks nothing
  it('offline research EXP rate is 0 when the logged-in character has no research level', () => {
    const loggedIn = characters.reduce((best, character) => character.afkTime > (best?.afkTime ?? 0) ? character : best, null);
    const withoutResearch = characters.map((character) => character !== loggedIn ? character : withSkillLevel(character, 'research', 0));
    expect(account.research.researchEXPrateAFK).toBeGreaterThan(0);
    expect(getResearch(data, account, withoutResearch, latest.serverVars).researchEXPrateAFK).toBe(0);
  });

  it('Grid_Bonus_Allmulti and grid 48 follow King Doot, which follows the logged-in character', () => {
    const gridLevels = account.research.gridSquares.map(({ level }) => level);
    within(getGridBonusAllmulti(account, { gridLevels, kingDootActive: true }), GAME.gridAllMulti);
    within(getGridBonusAllmulti(account, { gridLevels, kingDootActive: false }), GAME.gridAllMultiNoDoot);
    const grid48 = (research) => research.gridSquares.find(({ index }) => index === 48)?.bonuses?.[0];
    within(grid48(getResearch(data, account, characters)), GAME.grid48);
    within(grid48(getResearch(data, account, withLoggedInDivinity(characters, 1))), GAME.grid48NoDoot);
  });
});

// Read 2026-11-26 from the owner's live game (Research LV 127, 7 shapes) while moving two shapes by hand: the star
// (shape 5) from (317,84) at 0 degrees to (312,112) at 135, then the diamond (shape 0) from (352,159) at 90 to (318,46)
// at 0. Research[1] (node -> shape) was read before and after each drag. '.' is no shape.
const SHAPE_MOVES = {
  levels: '000000000000000000000000000000030000000000000002421430000000000000031242400000000000003234442340000000000141212210000000000003211433300000000000002441223000000000004443123421000000000004442444000000000000000000000000000000000000000000000000',
  placements: [[352, 159, 90], [239, 98, 0], [418, 144, 0], [321, 213, 0], [188, 168, 0], [317, 84, 0], [148, 240, 5]],
  moves: [{ shape: 5, x: 312, y: 112, rot: 135 }, { shape: 0, x: 318, y: 46, rot: 0 }],
  owners: [
    '...............................................111.5...............111555.............411455522..........44444.00............44444333.............4444333...........66666.333............6666...................................................',
    '...............................................111.5...............111555.............411455522..........44444500............44444333.............4444333...........66666.333............6666...................................................',
    '...............................0...............11105...............111555.............411455522..........44444555............44444333.............4444333...........66666.333............6666...................................................'
  ]
};

describe('research optimizer shape model against the live game', () => {
  const catalog = parseShapeCatalog(researchData[0], researchData[1], researchData[5]);
  const decode = (text) => [...text].map((char) => (char === '.' ? -1 : Number(char)));
  const selectableFor = (gridLevels) => gridLevels.map((_, node) => getResearchGridCanSelect({ gridLevels }, node));

  it('every node the save gives a shape is one that shape covers', () => {
    const saved = typeof data.Research === 'string' ? JSON.parse(data.Research) : data.Research;
    const selectable = selectableFor(saved[0]);
    const misplaced = saved[1].flatMap((shape, node) => {
      if (shape < 0) return [];
      const [x, y, rot] = saved[6].slice(4 * shape, 4 * shape + 3);
      return getCoveredNodes(catalog[shape], { shape, x, y, rot }, selectable).includes(node) ? [] : [[node, shape]];
    });
    expect(misplaced).toEqual([]);
  });

  it('moving shapes one at a time gives the owners the game gave', () => {
    const selectable = selectableFor([...SHAPE_MOVES.levels].map(Number));
    const coverage = SHAPE_MOVES.placements.map(([x, y, rot], shape) => getCoveredNodes(catalog[shape], { shape, x, y, rot }, selectable));
    const moves = SHAPE_MOVES.moves.map((move) => ({ ...move, covered: getCoveredNodes(catalog[move.shape], move, selectable) }));
    const [before, afterStar, afterDiamond] = SHAPE_MOVES.owners.map(decode);
    expect(applyShapeMoves(before, coverage, moves.slice(0, 1))).toEqual(afterStar);
    expect(applyShapeMoves(before, coverage, moves)).toEqual(afterDiamond);
  });

  it.each([
    ['0 to 135 is 27 right presses', 0, 135, { presses: 27, button: 'right' }],
    ['90 to 0 is 18 left presses', 90, 0, { presses: 18, button: 'left' }],
    ['350 to 10 goes on past 360', 350, 10, { presses: 4, button: 'right' }]
  ])('turn buttons: %s', (_, from, to, expected) => {
    expect(getTurnPresses(from, to)).toEqual(expected);
  });

  it('grid labels read like the game tiles', () => {
    expect([91, 31, 50, 110].map((node) => getGridLabel(node))).toEqual(['L8', 'L11', 'K10', 'K7']);
  });
});

describe('research optimizer scoring', () => {
  const input = account.research.optimizer;

  it('scores the save as the parser does: EXP multi, EXP rate and Insight rate', () => {
    const scorer = createResearchScorer(input);
    within(scorer.expMulti(input.owners, input.insightLevels), account.research.researchEXPmulti, 1e-9);
    within(scorer.expRate(input.owners, input.lensSlots), account.research.researchEXPrateTOT, 1e-9);
    const insight = account.research.observations.reduce((sum, { realInsightExpRate }) => sum + (realInsightExpRate ?? 0), 0);
    within(scorer.insightRate(input.owners, input.lensSlots), insight, 1e-9);
  });

  it('a one-move plan stays inside the drag box and scores what it claims', () => {
    const fixed = { ...input, canRotate: false };
    const { now, plans: [plan] } = optimizeShapes(fixed, { maxMoves: 1, beamWidth: 1 });
    const scorer = createResearchScorer(fixed);
    expect(plan.ratio).toBeGreaterThanOrEqual(1);
    within(plan.ratio, scorer.expRate(plan.owners, fixed.lensSlots) / now, 1e-12);
    expect(plan.steps.every(({ shape, to }) => isInsideDragBounds(scorer.catalog[shape], to))).toBe(true);
  });
});

// Read 2026-11-26 from the owner's live game: ResearchStuff("ObservationInsightExpREQ", i) at the save's Insight level,
// and ResearchStuff("ResearchEXPrateObj", 42) with 4 glasses there, Insight LV 8, Grid_Bonus(93) 19.08 and
// 5 kaleidoscopes next to it at Kalei_MultiBase 0.9742.
const LENS_GAME = {
  insightReq35At10: 245350.41222923566,
  insightReq0At13: 2900.51752397418,
  expRateObservation42: 595591.935244616
};

describe('research optimizer lenses', () => {
  const input = account.research.optimizer;

  it('Insight cost and an observation EXP rate match the game', () => {
    within(getInsightExpReq(35, 10), LENS_GAME.insightReq35At10, 1e-12);
    within(getInsightExpReq(0, 13), LENS_GAME.insightReq0At13, 1e-12);
    within(4 * getObservationBaseRate(42) * (1 + (19.08 * 8) / 100) * (1 + 5 * 0.9742), LENS_GAME.expRateObservation42, 1e-12);
  });

  it('drags onto a full observation wait until a lens has left it', () => {
    const from = [{ observation: 0, type: 0 }, { observation: 1, type: 1 }, { observation: 1, type: 1 }];
    const to = [{ observation: 1, type: 0 }, { observation: 1, type: 1 }, { observation: 2, type: 1 }];
    expect(getLensDrags(from, to, 2)).toEqual([
      { type: 1, from: 1, to: 2, count: 1 },
      { type: 0, from: 0, to: 1, count: 1 }
    ]);
  });

  it('a plan for today never costs EXP, keeps the per-observation cap and its drags rebuild it', () => {
    const plan = optimizeLenses(input, { restarts: 4 });
    expect(plan.ratioToday).toBeGreaterThanOrEqual(1);
    const counts = (slots) => slots.reduce((map, { observation, type }) => ({ ...map, [`${observation}:${type}`]: (map[`${observation}:${type}`] ?? 0) + 1 }), {});
    const perObservation = Object.values(plan.slots.reduce((map, { observation }) => ({ ...map, [observation]: (map[observation] ?? 0) + 1 }), {}));
    expect(Math.max(...perObservation)).toBeLessThanOrEqual(input.lensCap);
    const rebuilt = input.lensSlots.filter(({ observation }) => observation >= 0).map((slot) => ({ ...slot }));
    for (const { type, from, to, count } of plan.drags) {
      for (let n = 0; n < count; n++) rebuilt.find((slot) => slot.type === type && slot.observation === from).observation = to;
    }
    expect(counts(rebuilt)).toEqual(counts(plan.slots));
  });
});
