// Lane L6 of the wiki upkeep extraction (Tasks 9a, 9b, 10a, 10b: World 6).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.
import { enrichWorld6 } from '../../../scripts/entity-graph/enrich-world-6.mjs';
import { jadeNodes } from '../../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { monsterNodes } from '../../../scripts/entity-graph/nodes/monsters.mjs';
import { rebuild } from './rebuild.js';

// The Jade Emporium and Emperor nodes the World 6 enrich pass adds its fields to.
const enriched = (input) => {
  const nodes = { ...jadeNodes(input.jadeUpgrades), ...monsterNodes(input.monsters, input.mapNames) };
  enrichWorld6(nodes, input);
  return nodes;
};
// The market cost reads feed both the market pages and the Emperor's per-win price line.
const marketAndEmperor = (input) => ({ ...rebuild('marketupgrade')(input), ...enriched(input) });

export const READERS = {
  exoticBonus: rebuild('exoticupgrade'),
  exoticLevelQty: rebuild('exoticupgrade'),
  landRankUpgradeBonus: rebuild('landrank'),
  landRank5thColumnMax: rebuild('landrank'),
  marketMaxLevel: rebuild('marketupgrade'),
  marketCostQty: marketAndEmperor,
  marketCostType: rebuild('marketupgrade'),
  medalSeedLoreBoss: rebuild('seed'),
  farmingStickersSquare: rebuild('sticker'),
  summonWinScale: rebuild('summoningbattle'),
  summonPanel: rebuild('summoningupgrade'),
  summonTealLoreBoss: rebuild('summoningupgrade'),
  boss6HP: enriched,
  emperorCheaper: enriched,
  emporiumCost: enriched,
  emporiumRowsAhead: enriched,
  ninjaMasteryGates: rebuild('ninjaupgrade'),
  jadeUpgradeCost: rebuild('ninjaupgrade'),
  sneakingPristineDrop: rebuild('pristinecharm'),
  sneakingFloorRows: rebuild('sneakfloor'),
  sneakingFloorRescale: rebuild('sneakfloor'),
  gemstoneBonus: rebuild('ninjaitem')
};

// Section indexes: the Day 'N' Nite research square (a shifted index names no square) and the prerequisite rows
// the Ninja Mastery gates link to.
export const POINTERS = {
  marketMaxLevel: ['dayNNiteSquare'],
  ninjaMasteryGates: ['prerequisite']
};
