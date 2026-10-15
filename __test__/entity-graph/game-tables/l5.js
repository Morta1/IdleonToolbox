import fs from 'fs';
import path from 'path';
import { enrichWorld5 } from '../../../scripts/entity-graph/enrich-world-5.mjs';
import { godNodes } from '../../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { rebuild } from './rebuild.js';

// Lane L5 of the wiki upkeep extraction (Tasks 8a, 8b, 8c: World 5).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input.

// The god pages the blessing enrichment fills.
const blessings = (input) => {
  const nodes = godNodes(input.gods);
  enrichWorld5(nodes, input);
  return nodes;
};

// The two spare BRUH caverns given a study, so they are built and the cavern cap decides their Explorer level.
const pastTheCap = (input) => {
  const holesInfo = [...input.holesInfo];
  holesInfo[69] = holesInfo[68].map((name, t) => holesInfo[69][t] || 'Spare');
  return rebuild('cavern')({ ...input, holesInfo });
};

// The creation order cut at the committed schematic limit, so the one past it is a placeholder with or without the
// table (without it, nothing is known to be past the limit).
const { max: SCHEMATIC_LIMIT } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'wikiTables.json'), 'utf-8')).schematicsAvailable;
const offered = (input) => {
  const holesInfo = [...input.holesInfo];
  holesInfo[40] = holesInfo[40].slice(0, SCHEMATIC_LIMIT);
  return rebuild('schematic')({ ...input, holesInfo });
};

export const READERS = {
  studyBolaiaBonuses: rebuild('cavern'),
  studyReqForBolaia: rebuild('cavern'),
  cavernsOwned: pastTheCap,
  cglunkoUpgradeCost: rebuild('coveupgrade'),
  fountainBonuses: rebuild('fountainupgrade'),
  fountainSpaces: rebuild('fountainupgrade'),
  fountainStack: rebuild('fountainupgrade'),
  fountainUnlock: rebuild('fountainupgrade'),
  fountainCost: rebuild('fountainupgrade'),
  schematicsAvailable: offered,
  holesBuildCost: rebuild('schematic'),
  divinityStyleLevelReq: rebuild('divstyle'),
  importItemBonus: rebuild('gamingimport'),
  importItemCost: rebuild('gamingimport'),
  boxCost: rebuild('gamingimport'),
  paletteBonus: rebuild('palette'),
  paletteLevelUpChance: rebuild('palette'),
  cosmoForge: rebuild('majik'),
  lampWishCost: rebuild('lampwish'),
  lampBonuses: rebuild('lampwish'),
  lampInfiniteResources: rebuild('lampwish'),
  blessingMaxLevel: blessings,
  blessBonus: blessings,
  blessingCurrency: blessings
};

export const POINTERS = {
  studyBolaiaBonuses: ['cavern'],
  fountainBonuses: ['water', 'slot'],
  fountainSpaces: ['water', 'slot'],
  fountainStack: ['water', 'slot'],
  fountainUnlock: ['water', 'slots'],
  paletteBonus: ['doublers'],
  cosmoForge: ['tree', 'slot'],
  lampWishCost: ['wish'],
  lampInfiniteResources: ['wish'],
  blessBonus: ['nobisect']
};
