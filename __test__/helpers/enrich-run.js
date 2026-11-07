import fs from 'node:fs';
import path from 'node:path';
import { fieldLinkFailures } from '../../utility/wiki/field-links.mjs';

// Runs an enrichment on a fresh blank(), beside an untouched `before`: comparing the two names exactly the nodes it touched.
export const enrichRun = (blank, enrich) => {
  const before = blank();
  const snapshot = Object.fromEntries(Object.entries(before).map(([id, node]) => [id, JSON.stringify(node)]));
  const nodes = blank();
  enrich(nodes);
  const touched = (id) => JSON.stringify(nodes[id]) !== snapshot[id];
  return {
    before,
    nodes,
    changed: (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && touched(id)).sort(),
    // The registry sweep never sees an enriched node's links, so they are swept against the committed graph's pages.
    linkFailures: () => {
      const known = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8')).nodes;
      return fieldLinkFailures(Object.keys(nodes).filter(touched).map((id) => nodes[id]), known);
    }
  };
};
