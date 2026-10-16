import { enrichWorld3 } from '../../../scripts/entity-graph/enrich-world-3.mjs';
import { rebuild } from './rebuild.js';

// The build-time tables read before the wiki upkeep lanes. Each lane keeps the same two maps for its own tables in
// l1.js..l8.js beside this file; game-tables.test.js merges them all.

// A bare node per trap item: the enrich pass only adds `fields` to the nodes it is handed.
const trapItems = (input) => {
  const nodes = {};
  for (const [rawName, item] of Object.entries(input.items)) {
    if (item?.Type === 'TRAP_BOX_SET') nodes[`item:${rawName}`] = { kind: 'item', rawName };
  }
  enrichWorld3(nodes, input);
  return nodes;
};

// Every table the graph build reads, with the output that reads it.
export const READERS = {
  trapTimeUnits: trapItems,
  legendTalentColours: rebuild('legendtalent'),
  legendTalentMaxLevelGroups: rebuild('legendtalent'),
  sushiJoinedIds: rebuild('sushiupgrade'),
  owlBonusPerFeather: rebuild('owl'),
  royalRecruitOrder: rebuild('armoryupgrade'),
  royalRecruitClasses: rebuild('armoryupgrade'),
  mineheadUpgradeTables: rebuild('mineheadupgrade'),
  sneakingMasteryDrops: rebuild('sneakfloor', 'ninjaitem'),
  sneakingSymbolDrop: rebuild('ninjaitem'),
  sneakingHatReroll: rebuild('sneakfloor'),
  gameLog: rebuild('tome'),
  notateNumber: rebuild('armorset'),
  grimoireUpgradeCost: rebuild('grimoireupgrade'),
  upgradePanelMultiplierPrint: rebuild('grimoireupgrade', 'armoryupgrade'),
  grimoireNotWrithed: rebuild('grimoireupgrade'),
  grimoireLadder: rebuild('grimoireupgrade'),
  classTalentGates: rebuild('grimoireupgrade', 'compassupgrade')
};

// The fields of a table that point into another website-data section: the reads sweep leaves them unshifted, since
// shifting one would test that section, not this read.
export const POINTERS = { legendTalentMaxLevelGroups: ['gridSquare'], grimoireNotWrithed: ['multiplierRow'], grimoireLadder: ['list'] };
