import { enrichWorld7 } from '../../../scripts/entity-graph/enrich-world-7.mjs';
import { itemNodes } from '../../../scripts/entity-graph/nodes/items.mjs';
import { npcNodes } from '../../../scripts/entity-graph/nodes/npcs.mjs';
import { stationNodes } from '../../../scripts/entity-graph/nodes/stations.mjs';
import { rebuild } from './rebuild.js';

// Lane L3 of the wiki upkeep extraction (Tasks 6a, 6b, 6c: World 7 Spelunking, Research and Reef).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.

// The Button, Coral Kid, the Dancing Coral items and the Coral Reef: the enrich pass only adds `fields` to the nodes it is handed.
const world7Pages = (input) => {
  const nodes = { ...itemNodes(input.items), ...npcNodes(input.npcRoster), ...stationNodes() };
  enrichWorld7(nodes, input);
  return nodes;
};

export const READERS = {
  bigFishLevelReq: rebuild('advicefish'),
  bigFishBonus: rebuild('advicefish'),
  bigFishCost: rebuild('advicefish'),
  bigFishFirstFree: rebuild('advicefish'),
  superTalentPoints: rebuild('legendtalent'),
  legendTalentPanel: rebuild('legendtalent'),
  observationInsightReq: rebuild('observation'),
  observationExpRate: rebuild('observation'),
  researchGridLabels: rebuild('researchsquare'),
  researchSmartEye: rebuild('researchsquare'),
  spelunkShopCost: rebuild('spelunkupgrade'),
  spelunkShopPanel: rebuild('spelunkupgrade'),
  spelunkSpecialFills: rebuild('spelunkupgrade'),
  spelunkOddsNotes: rebuild('spelunkupgrade'),
  amberDenominator: rebuild('spelunkupgrade'),
  buttonBonuses: world7Pages,
  buttonMultiplier: world7Pages,
  coralKidBonus: world7Pages,
  coralKidCost: world7Pages,
  danceMaxLevel: world7Pages,
  danceShrine: world7Pages,
  dancingCoralCost: world7Pages,
  reefFills: world7Pages
};
export const POINTERS = {};
