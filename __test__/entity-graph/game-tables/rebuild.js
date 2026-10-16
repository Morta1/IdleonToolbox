import { registryNodes } from '../../../scripts/entity-graph/registry/build.mjs';
import { ROWS } from '../../../scripts/entity-graph/registry/index.mjs';

// A reader for game-tables.test.js: the registry nodes of the given kinds, built from a website-data input.
export const rebuild = (...kinds) => (input) => registryNodes(input, ROWS.filter((row) => kinds.includes(row.kind)));
