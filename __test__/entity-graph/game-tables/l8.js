import { skullCatalog } from '../../../scripts/entity-graph/shop-catalog.mjs';
import { bubbleNodes } from '../../../scripts/entity-graph/nodes/alchemy.mjs';
import { arcadeNodes } from '../../../scripts/entity-graph/nodes/catalogs-a.mjs';
import { artifactNodes, godNodes } from '../../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { vaultNodes } from '../../../scripts/entity-graph/nodes/vault.mjs';
import { beanstalkEdges } from '../../../scripts/entity-graph/edges/beanstalk.mjs';
import { containerEdges } from '../../../scripts/entity-graph/edges/containers.mjs';
import { talentLibraryEdges } from '../../../scripts/entity-graph/edges/talent-library.mjs';
import { glimboEdges } from '../../../scripts/entity-graph/edges/glimbo.mjs';
import { vaultEdges } from '../../../scripts/entity-graph/edges/vault.mjs';
import { ninjaHatEdges, randomEventEdges } from '../../../scripts/entity-graph/edges/injected-drops.mjs';
import { rebuild } from './rebuild.js';

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
  talentLibraryBooks: (input) => ({ edges: talentLibraryEdges(input.towers, input.items, input) }),
  // The kinds whose pages survive a missing list. The armory, jar, schematic, sneak floor, advice fish, jelly, Minehead
  // opponent, tunnel and sushi shop pages are listed by one of these lists, so without it they have no entries at all.
  listIndexes: (input) => ({
    ...rebuild('compassupgrade', 'cavern', 'coveupgrade', 'majik', 'landrank', 'ninjaitem', 'sticker', 'legendtalent', 'mineheadupgrade', 'sushi')(input),
    edges: [
      ...beanstalkEdges(input.ninjaExtraInfo, input),
      ...glimboEdges(input.research, input.upgradeVault, input),
      ...vaultEdges(input.research, input.upgradeVault, input),
      ...randomEventEdges(input.randomList, input.monsters, input),
      ...ninjaHatEdges(input.randomList, input.ninjaEquipment, input.items, input.monsters, input)
    ]
  })
};
export const POINTERS = { artifactFormText: ['artifact'], gemPouchPools: ['pool'] };
