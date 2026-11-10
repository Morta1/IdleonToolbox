import fs from 'fs';
import path from 'path';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';

// The wiki tests' two big inputs, read once per worker: the node project runs with isolate:false, so every file a
// worker runs shares this module. Both are frozen all the way down, so a test or a builder that writes to one throws
// instead of changing what the next file reads. A test that must write takes freshEntityGraph(), or spreads a copy.
const frozen = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) frozen(value[key]);
  }
  return value;
};

const graphPath = () => path.join(process.cwd(), 'data', 'entity-graph.json');

let data;
let graph;

// Every website-data section by its own key, as the graph build loads it.
export const websiteData = () => {
  data ??= frozen(loadWebsiteData(path.join(process.cwd(), 'data', 'website-data')));
  return data;
};

// The committed entity graph.
export const entityGraph = () => {
  graph ??= frozen(freshEntityGraph());
  return graph;
};

// The committed entity graph as a copy of its own, for a test that changes it.
export function freshEntityGraph() {
  return JSON.parse(fs.readFileSync(graphPath(), 'utf-8'));
}
