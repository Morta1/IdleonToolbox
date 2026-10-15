import { skullCatalog } from '../../../scripts/entity-graph/shop-catalog.mjs';
import { bubbleNodes } from '../../../scripts/entity-graph/nodes/alchemy.mjs';
import { arcadeNodes } from '../../../scripts/entity-graph/nodes/catalogs-a.mjs';
import { artifactNodes, godNodes } from '../../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { vaultNodes } from '../../../scripts/entity-graph/nodes/vault.mjs';
import { beanstalkEdges } from '../../../scripts/entity-graph/edges/beanstalk.mjs';
import { containerEdges } from '../../../scripts/entity-graph/edges/containers.mjs';
import { talentLibraryEdges } from '../../../scripts/entity-graph/edges/talent-library.mjs';

// Lane L8 of the wiki upkeep extraction (Tasks 12a, 12b, 13a, 13b: node builders and list indexes).
// Its build-time tables, in the same two maps as core.js. A reader is `rebuild(...kinds)` from ./rebuild.js, or a
// function of the website-data input. The test compares readers by their keys, so a catalog or an edge list rides
// under one fixed key.
export const READERS = {
  killroyBonusCurves: (input) => ({ skull: skullCatalog(input.killRoySkullShop, input.items, input) }),
  cauldronTitles: (input) => bubbleNodes(input.cauldrons, input),
  arcadeMaxLevel: (input) => arcadeNodes(input.arcadeShop, input),
  krukBubblesDaily: (input) => godNodes(input.gods, input),
  artifactFormText: (input) => artifactNodes(input.artifacts, input.islands, input),
  vaultRowFills: (input) => vaultNodes(input.upgradeVault, input),
  beanstalkRanks: (input) => ({ edges: beanstalkEdges(input.ninjaExtraInfo, input) }),
  gemPouchPools: (input) => ({ edges: containerEdges(input.randomList, input) }),
  talentLibraryBooks: (input) => ({ edges: talentLibraryEdges(input.towers, input.items, input) })
};
export const POINTERS = { artifactFormText: ['artifact'], gemPouchPools: ['pool'] };
