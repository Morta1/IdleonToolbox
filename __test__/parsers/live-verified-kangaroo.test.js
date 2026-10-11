import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getKangarooBonus } from '@parsers/world-2/kangaroo';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount 267-305 upgrade, tar and reset levels match).
const GAME = {
  // Summoning("RooCatchFishQTY", 0, 0) and Summoning("RooCatchREQ", 0, 0) (seconds per catch). Gambit bonus 8 sits
  // in the catch, and the live gambit points ran a monument level ahead of the save, so it is 7e-6 above the save's
  fishPerCatch: 29151121372.139927,
  catchSeconds: 3.8461538461538463,
  gambitDriftTolerance: 1e-5,
  // Summoning("RooCatchRate_S", 0, 0): shiny progress per second
  shinyProgressPerSecond: 19713.3092,
  // Summoning("RooCatchREQ_T", 0, 0): seconds per tartar fish
  tarSeconds: 0.955566172957477,
  // Summoning("RooTarOwned", 0, 0)
  tarUnlocked: 8,
  // Summoning("RooCost", i, 0)
  costs: [
    14059785.050819304, 2188309030.2479963, 405417933264.64294, 5.0389584842150766e+35, 929008.6550896614,
    4865.093412395519, 636220848161.9182, 298228.52257589914, 580945.5821242292, 130023114.71732904,
    21688635.06597122, 4.122014852130847e+55
  ],
  // Summoning("RooCost_T", i, 0)
  tarCosts: [1, 1, 1, 4, 2, 3, 2, 5],
  // Summoning("RooRESETbon", i, 0), as the reset screen rounds them
  resetBonuses: [437.84, 212.68, 94.9, 5.2, 119.6],
  // Summoning("RooBonuses", i, 0), keyed by the toolbox bonus name
  bonuses: {
    'Fishing Eff': 2425.5,
    'Defence': 2425.5,
    'Fishing XP': 4042.5,
    'Accuracy': 1617,
    'Total DMG': 1470,
    'AFK Gains': 367.5,
    'Cash': 2205
  }
};

const SECONDS_PER_MINUTE = 60;
const { account } = parseFixture(latest);
const { kangaroo } = account;

describe('kangaroo verified against the live game', () => {
  it('fish per minute', () => {
    within(kangaroo.fishRate, GAME.fishPerCatch * SECONDS_PER_MINUTE / GAME.catchSeconds, GAME.gambitDriftTolerance);
  });

  it('shiny progress per minute', () => {
    within(kangaroo.shinyRate, GAME.shinyProgressPerSecond * SECONDS_PER_MINUTE);
  });

  it('tartar fish timer and unlocked tar upgrades', () => {
    within(kangaroo.tarFishRate, GAME.tarSeconds);
    expect(kangaroo.tarUpgrades.filter(({ unlocked }) => unlocked)).toHaveLength(GAME.tarUnlocked);
  });

  it.each(GAME.costs.map((cost, index) => [index, cost]))('upgrade %i cost', (index, cost) => {
    within(kangaroo.upgrades[index].cost, cost);
  });

  it.each(GAME.tarCosts.map((cost, index) => [index, cost]))('tar upgrade %i cost', (index, cost) => {
    within(kangaroo.tarUpgrades[index].cost, cost);
  });

  it('reset bonuses', () => {
    expect(kangaroo.resetBonuses.map(({ desc }) => Number(desc.match(/[\d.]+(?=x)/)[0]))).toEqual(GAME.resetBonuses);
  });

  it.each(Object.entries(GAME.bonuses))('%s bonus', (name, bonus) => {
    within(getKangarooBonus(kangaroo.bonuses, name), bonus);
  });
});
