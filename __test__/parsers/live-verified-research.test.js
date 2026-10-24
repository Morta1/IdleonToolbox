import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within, withLoggedInDivinity } from '../helpers/live-verified';
import { getGridBonusAllmulti, getResearch } from '@parsers/world-7/research';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). "NoDoot" = DNSM.CompanionBon[0] set
// to 0 in try/finally, which is what a logged-in character under divinity 2 sees.
// 2.3.540 moved ArcadeBonus(63) out of the ResearchEXPmulti sum into its own (1 + x / 100) factor. The values
// marked "2.3.540" are the pre-patch live readings times exactly that move (x = 20.0995, the save's arcade 63):
// 1334.951583995417 -> x1.19440700, 1348.8645483483156 and 270914584.9203977 -> x1.19447496.
// 2.3.550 multiplies by KillroyBonuses(5) itself instead of (1 + it / 100); the values marked "2.3.550" are the
// 2.3.540 ones times that move (OptionsListAccount[469] = 8, Killroy 5 = 1.0405063): x1.0297912856104834.
const GAME = {
  // ResearchStuff("ResearchEXPmulti"), 2.3.550 (1594.4755228606055 on 2.3.540)
  researchExpMulti: 1641.9769985610706,
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
  gridPointsEarned: 114,
  tinyCogsPerDay: 4,
  // Read 2026-10-12, logged in as MortasNinth. ResearchStuff("AFKgainsRatePCT") = 100 * AFKgainrates("Research")
  afkGainsRatePct: 47.791,
  // ResearchStuff("ResearchEXPrateTOT") and ("ResearchEXPmulti") with the live inputs below, 2.3.550
  // (323600687.26234525 and 1611.184923829708 on 2.3.540)
  researchExpRateTot: 333241167.7603265,
  researchExpMultiLive: 1659.1841940668237,
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
  it('research EXP multi', () => {
    within(account.research.researchEXPmulti, GAME.researchExpMulti, 1e-6);
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

  it('research AFK gains rate', () => {
    within(account.research.researchAFKrate, GAME.afkGainsRatePct);
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
    const withoutResearch = characters.map((character) => character !== loggedIn ? character : {
      ...character,
      skillsInfo: { ...character.skillsInfo, research: { ...character.skillsInfo.research, level: 0 } }
    });
    expect(account.research.researchEXPrateAFK).toBeGreaterThan(0);
    expect(getResearch(data, account, withoutResearch, latest.serverVars).researchEXPrateAFK).toBe(0);
  });

  it('MSA bonus rewards from grid 170', () => {
    within(account.research.msaBonusRewards, GAME.msaBonusRewards);
  });

  it('research level reads the logged-in character', () => {
    expect(account.research.researchLevel).toBe(GAME.researchLevel);
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
