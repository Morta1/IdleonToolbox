import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within, withLoggedInDivinity } from '../helpers/live-verified';
import { getGridBonusAllmulti, getResearch } from '@parsers/world-7/research';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). "NoDoot" = DNSM.CompanionBon[0] set
// to 0 in try/finally, which is what a logged-in character under divinity 2 sees.
const GAME = {
  // ResearchStuff("ResearchEXPmulti")
  researchExpMulti: 1334.951583995417,
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
  tinyCogsPerDay: 4
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
