import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { within } from '../helpers/live-verified';
import { getAtomBonus, getAtomColliderThreshold } from '@parsers/world-3/atomCollider';

// Read from the running game on 12 Oct 2026 through the debug server, logged in as MortasNinth.
// latest.json is that account's save (Atoms, OptionsListAccount[134] = 860 days, and the Divinity[39]
// particles match). DNSM.AtomBonCalc1/2 (wizard levels over 50, Lv 30+ meals) read 181 and 74.
const GAME = {
  // AtomCollider("AtomBonuses", i, 0): Hydrogen is capped at 90, Carbon is 2 x wizard levels over 50,
  // Fluoride is the cooking speed multiplier itself
  bonuses: [90, 70, 70, 490, 140, 362, 1050, 140, 113036885261168030, 70, 350, 70, 70, 70, 70, 0],
  // AtomCollider("AtomCost", i, 0): floored only below 1e6
  costs: [6906148544.290332, 7.220040343167103e+69, 318110893.434272, 1130498011.5946841, 1362747430426.7073,
    23992339393.65201, 15795851260.18454, 18317458431.492535, 25182322555.07602, 28441737547.522312,
    7.262379099087804e+25, 29875694761358250000, 202576062343588740, 25621559097995.926, 105567807136799760, 108300],
  maxLevel: 70,
  atomsAvailable: 16,
  // AtomCollider("AtomThreshold") with OptionsListAccount[133] = 4
  threshold: 1050000000
};

const { account } = parseFixture(latest);
const { atoms } = account.atoms;

describe('atom collider verified against the live game', () => {
  it.each(GAME.bonuses.map((value, index) => [atoms[index].name, index, value]))('%s bonus', (name, index, value) => {
    within(getAtomBonus(account, name), value);
  });

  it('stamp reducer is the Hydrogen bonus', () => {
    expect(account.atoms.stampReducer).toBe(GAME.bonuses[0]);
  });

  it.each(GAME.costs.map((value, index) => [atoms[index].name, index, value]))('%s upgrade cost', (name, index, value) => {
    within(atoms[index].cost, value);
  });

  it('max level, atoms available and collider threshold', () => {
    atoms.forEach(({ maxLevel }) => expect(maxLevel).toBe(GAME.maxLevel));
    expect(account.atoms.totalAtomsAvailable).toBe(GAME.atomsAvailable);
    expect(getAtomColliderThreshold(account.accountOptions[133])).toBe(GAME.threshold);
  });
});
