import { enrichWorld4 } from '../../../scripts/entity-graph/enrich-world-4.mjs';
import { jewelNodes, mealNodes, spiceNodes } from '../../../scripts/entity-graph/nodes/systems.mjs';
import { rebuild } from './rebuild.js';

// Lane L4 of the wiki upkeep extraction (Tasks 7a, 7b, 7c: Worlds 3 and 4).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.

// The bare meal, spice, jewel and monster nodes the World 4 enrich pass extends, then extended.
const world4 = (input) => {
  const nodes = { ...mealNodes(input.cookingMenu), ...spiceNodes(input.spiceNames), ...jewelNodes(input.jewels) };
  for (const rawName of Object.keys(input.monsters)) nodes[`monster:${rawName}`] = { kind: 'monster', rawName };
  enrichWorld4(nodes, input);
  return nodes;
};

export const READERS = {
  atomMaxLevel: rebuild('atom'),
  dreamLock: rebuild('dream'),
  worshipMapType: rebuild('totem'),
  worshipExpRewards: rebuild('totem'),
  labJewelBoosts: rebuild('labbonus'),
  labJadeBonuses: rebuild('labbonus'),
  petUpgradeBonus: rebuild('petupgrade'),
  petUpgradeMaxLevel: rebuild('petupgrade'),
  riftBonusStep: rebuild('riftbonus'),
  riftMobHP: rebuild('rift'),
  tomeLevelReq: rebuild('tome'),
  tomePct: rebuild('tome'),
  tomeBars: rebuild('tome'),
  mealMaxLevel: world4,
  territoryId: world4,
  shinyLevels: world4,
  tesseractJewels: world4
};

export const POINTERS = {
  atomMaxLevel: ['isotopeDiscovery', 'atomicPotential'],
  dreamLock: ['unlockSquare'],
  labJadeBonuses: ['firstUpgrade'],
  petUpgradeBonus: ['achievement'],
  mealMaxLevel: ['artifact']
};
