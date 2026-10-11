import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getOwlBonus } from '@parsers/world-1/owl';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount 254-264 upgrade levels, megafeathers and shiny feathers match).
const GAME = {
  // Summoning("OwlFeatherRate", 0, 0). Gambit bonus 8 sits in it, and the live gambit points ran a monument level
  // ahead of the save (Holes[15][27] 11507 vs 11407), so the rate is 7e-6 above the save's
  featherRate: 26001909422408790,
  gambitDriftTolerance: 1e-5,
  // Summoning("OwlCost", i, 0)
  costs: [
    942111851451566.8, 99697497165919100000, 537363061422587.9, 2333978017394009.5, 451377978060.017,
    1381241973268386.8, 15483932202641686, 2484780035384887, 8.407287840041568e+59
  ],
  // Summoning("OwlBonuses", i, 0), keyed by the toolbox bonus name
  bonuses: {
    'Class XP': 2205,
    'Base DMG': 4410,
    'Total DMG': 882,
    'Skill XP': 1176,
    'Drop Rate': 294,
    'All Stats': 588
  },
  // DNSM.OwlBonusAll: the megafeather boost to every bonus, in percent
  bonusAll: 2000
};

const { account } = parseFixture(latest);
const { owl } = account;

describe('owl verified against the live game', () => {
  it('feather rate', () => {
    within(owl.featherRate, GAME.featherRate, GAME.gambitDriftTolerance);
  });

  it.each(GAME.costs.map((cost, index) => [index, cost]))('upgrade %i cost', (index, cost) => {
    within(owl.upgrades[index].cost, cost);
  });

  it.each(Object.entries(GAME.bonuses))('%s bonus', (name, bonus) => {
    within(getOwlBonus(owl.bonuses, name), bonus);
  });

  it('megafeather boost to every bonus', () => {
    expect(owl.megaFeathers.at(-1).totalBonus).toBe(1 + GAME.bonusAll / 100);
  });
});
