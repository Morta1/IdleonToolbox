import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import {
  getLegendTalentBonus,
  getSuperTalentLeftToSpend,
  getTotalSuperTalentPoints
} from '@parsers/world-7/legendTalents';
import { liveEntries } from '@parsers/catalog';
import { legendTalents } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Spelunk[18] matches). Lists are indexed by legend talent.
const GAME = {
  // Thingies("LegendPTS_bonus", i, 0)
  bonuses: [
    30, 2500, 200, 40, 80, 60, 50, 50, 200, 6, 125, 60, 300, 1, 100, 150, 200, 5, 6, 225,
    225, 75, 25, 32, 20, 1500, 600, 50, 30, 60, 75, 600, 900, 225, 100, 1, 15, 300, 1, 1
  ],
  // Thingies("LegendTalent_MaxLV", i, 0): the Legendary Fever grid squares included
  maxLevels: [
    2, 5, 4, 4, 2, 6, 3, 5, 3, 3, 5, 4, 3, 5, 1, 2, 3, 2, 3, 3,
    5, 5, 1, 4, 1, 3, 3, 4, 2, 3, 3, 4, 1, 3, 3, 1, 5, 1, 1, 1
  ],
  // Thingies("LegendPTS_owned" / "LegendPTS_spent")
  pointsOwned: 102,
  pointsSpent: 102,
  // Thingies("SuperTalentPTS_totaltospend" / "SuperTalentPTS_lefttospend") for the logged-in character
  superTalentTotal: 9,
  superTalentLeft: 9,
  // The "$" each description fills in: Thingies("SuperTalentPTS_LVgiven") (Zenith Market 5 included,
  // the description left it out), WorkbenchStuff("TotalGildedBoostio"), Thingies("GuaranteedCrystalMobs")
  descriptionValues: {
    33: '43.88x',
    37: '_308_',
    39: '+121_LV'
  }
};

const { account, characters } = parseFixture(latest);
const loggedIn = characters.find(({ name }) => name === 'IAmTheHunterrr');
const talentsByIndex = Object.fromEntries(account.legendTalents.talents.map((talent) => [talent.originalIndex, talent]));

describe('legend talents verified against the live game', () => {
  it.each(liveEntries(legendTalents).map(({ index }) => [index]))('talent %i: bonus and max level', (index) => {
    expect(getLegendTalentBonus(account, index)).toBe(GAME.bonuses[index]);
    expect(talentsByIndex[index].maxLevel).toBe(GAME.maxLevels[index]);
  });

  it('points owned and spent', () => {
    expect(account.legendTalents.pointsOwned.value).toBe(GAME.pointsOwned);
    expect(account.legendTalents.pointsSpent).toBe(GAME.pointsSpent);
  });

  it('super talent points of the logged-in character', () => {
    expect(getTotalSuperTalentPoints(loggedIn.level, account)).toBe(GAME.superTalentTotal);
    expect(getSuperTalentLeftToSpend(loggedIn.level, loggedIn.playerId, loggedIn.selectedTalentPreset ?? 0, account))
      .toBe(GAME.superTalentLeft);
  });

  it.each(Object.entries(GAME.descriptionValues))('talent %s description', (index, value) => {
    const { description } = talentsByIndex[index];
    expect(description).toContain(value);
    expect(description).not.toMatch(/[{}$]/);
  });
});
