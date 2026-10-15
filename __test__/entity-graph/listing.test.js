import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { LISTED_KINDS, inListing } from '../../utility/wiki/kinds.mjs';
import { listingEntries } from '../../utility/wiki/listing.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));

describe('listingEntries', () => {
  // The hub counts every kind with inListing; a listing that filtered its rows any other way would show a
  // count its own page does not have.
  it('lists exactly the rows inListing counts, per listed kind', () => {
    const byKind = (idsOf) => Object.fromEntries(LISTED_KINDS.map((kind) => [kind, idsOf(kind)]));
    expect(byKind((kind) => listingEntries(graph, kind).entries.map((entry) => entry.id).sort()))
      .toEqual(byKind((kind) => Object.entries(graph.nodes)
        .filter(([, node]) => node.kind === kind && inListing(node))
        .map(([id]) => id)
        .sort()));
  });
});
