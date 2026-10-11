import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (Bubba upgrade levels, prestiges, charisma, dice and smoked meats match).
const GAME = {
  // Bubbastuff("MeatsliceRate", 0, 0), per second. Smoked meats alone multiply it by 697.99
  // (Bubbastuff("SmokeMeat_Multi")); reading one bonus value for every tier made the toolbox 100x low
  meatslicesPerSecond: 880127763438743,
  // Bubbastuff("UpgCost", i, 0). Minehead opponent 5 (+100%) halves every cost
  costs: [
    112931561872043.23, 6913995407241372, 63145256992165.96, 2.6009345328356713e+146, 785745059592799.1,
    826247995069797.4, 377414332108737.75, 434342711372958.2, 3.578288778291537e+29, 3.46676530495378e+25,
    10464827983835864, 55926964575713.266, 2228126669.2289534, 4051627657738634, 58778714199753335000,
    378498752903074.44, 1563545281540838400, 1428784712771167.2, 27680689525692748, 4287374279312728.5,
    66176896183695496, 1068876083751285400, 18031934278535707000, 317176880107485860000, 5.807787747599786e+21,
    1.1054150839242945e+23, 2.183964302061542e+24, 4.4731296089156735e+25
  ],
  // Bubbastuff("TotUpgBonus", i, 0)
  upgradeBonuses: [
    590, 160, 1138, 146, 323, 85, 1680, 1950, 12, 6, 21, 1600, 1, 32, 2, 162, 2, 12, 52, 50, 0, 2, 0, 500, 10, 8, 0, 8
  ],
  // Bubbastuff("BubbaRoG_Bonuses", i, 0), keyed by the toolbox bonus key
  bonuses: {
    buildRate: 420,
    critterGain: 210,
    soulGain: 210,
    totalDamage: 630,
    allKills: 42,
    expMulti: 168,
    atomCost: 120
  },
  // 1 + MegafleshOwned(0) * TotalQTYofLVs / 100, the first megaflesh's multiplier on the megaflesh screen
  firstMegafleshBonus: '31.34'
};

const SECONDS_PER_MINUTE = 60;
const { account } = parseFixture(latest);
const { bubba } = account;

describe('bubba verified against the live game', () => {
  it('meat slices per minute', () => {
    within(bubba.meatsliceRate, GAME.meatslicesPerSecond * SECONDS_PER_MINUTE);
  });

  it.each(GAME.costs.map((cost, index) => [index, cost]))('upgrade %i cost and bonus', (index, cost) => {
    within(bubba.upgrades[index].cost, cost);
    within(bubba.upgrades[index].bonus, GAME.upgradeBonuses[index]);
  });

  it.each(Object.entries(GAME.bonuses))('%s bonus', (key, bonus) => {
    within(bubba.bonuses[key].bonus, bonus);
  });

  it('first megaflesh multiplier', () => {
    expect(bubba.megaFlesh[0].totalBonus).toBe(GAME.firstMegafleshBonus);
  });
});
