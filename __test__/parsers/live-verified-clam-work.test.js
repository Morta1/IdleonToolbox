import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getClamBonus, getClamCost, getClamLevels, getClamWorkBonus, parseClamWork } from '@parsers/world-7/clamWork';

// Read from the running game on 2026-10-12 through the debug server, logged in as MortasNinth.
// latest.json holds the same clam state (OptionsListAccount 454-465: pearls, the nine levels, worker class 5,
// upgrades unlocked 5).
const GAME = {
  // WorkbenchStuff("MultiKillTOTAL", 0, 0) of the logged-in character, the multikill MULTI-SCALPING reads
  multiKill: 42165,
  // Thingies("ClamBonuses", i, 0)
  bonuses: [38, 11, 39, 1054.125, 324, 400, 0, 0, 0],
  // Thingies("Clam_Cost", i, 0); index 9 is the promotion
  costs: [
    2367.0020094966344, 46064282.66105488, 4607.269540135561, 2653272.1583636967, 641781.0079233249,
    9444623.736566508, 9212853.773584904, 230321344.33962262, 5758033608.490565, 10000000000
  ],
  // Thingies("Clam_PearlUpgReq", i, 0)
  unlockRequirements: [0.8, 20, 500, 12500, 312500, 7812500, 195312500, 4882812500, 122070312500],
  // Thingies("ClamWorkBonus", i, 0)
  compensations: [1, 1, 1, 1, 1, 0, 0, 0, 0],
  pearlValue: 450.10875, // Thingies("ClamPearlValue", 0, 0)
  blackPearlValue: 450, // Thingies("Clam_BlackPearlValue", 0, 0)
  mobs: 13, // Thingies("Clam_Mobs", 0, 0)
  clamHp: 2.43e+23, // Thingies("Clamz_HP", 0, 0)
  promotionChance: 0.07142857142857142, // Thingies("ClamPromochance", 0, 0)
  respawn: 60 // Thingies("Clam_Respawn", 0, 0)
};

const { account } = parseFixture(latest);
const levels = getClamLevels(account);
const view = parseClamWork(account, null, GAME.multiKill);

describe('clam work verified against the live game', () => {
  it.each(GAME.bonuses.map((bonus, index) => [index, bonus]))('upgrade %i bonus', (index, bonus) => {
    within(getClamBonus(levels, index, GAME.multiKill), bonus);
  });

  it.each(GAME.costs.map((cost, index) => [index, cost]))('upgrade %i cost', (index, cost) => {
    within(getClamCost(levels, index, view.workerClass), cost);
  });

  it('promotion cost is the index 9 cost', () => {
    within(view.promotionCost, GAME.costs.at(-1));
  });

  it.each(GAME.unlockRequirements.map((pearls, index) => [index, pearls]))('upgrade %i unlock requirement', (index, pearls) => {
    within(view.upgrades[index].requiredPearls, pearls);
  });

  it('compensations unlocked by worker class', () => {
    expect(GAME.compensations.map((_, index) => getClamWorkBonus(account, index))).toEqual(GAME.compensations);
    expect(view.compensations.map(({ unlocked }) => unlocked)).toEqual(GAME.compensations);
  });

  it.each(['pearlValue', 'blackPearlValue', 'mobs', 'clamHp', 'promotionChance', 'respawn'])('%s', (key) => {
    within(view[key], GAME[key]);
  });
});
