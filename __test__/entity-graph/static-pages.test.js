import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { hubPaths, hubProps, slugPaths, slugProps } from '../../utility/wiki/static-pages.mjs';
import { LISTED_KINDS, LISTING_SUFFIXES, inListing, listingCounts, systemsWithRows } from '../../utility/wiki/kinds.mjs';
import { entityName } from '../../utility/wiki/names.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const nodes = Object.values(graph.nodes);
const counts = listingCounts(nodes);

// /wiki/<x> is a system page when x is a system slug, else a listing; /wiki/<kind>/<x> is a listing when x is the
// kind's suffix, else an entity. The paths are what decides which pages the export writes.
describe('paths', () => {
  it('serves every system with rows, then every listing that has no suffix, at /wiki/<x>', () => {
    const params = hubPaths().map((path) => path.params.kind);
    expect(params).toEqual([
      ...systemsWithRows(counts).map((system) => system.slug),
      ...LISTED_KINDS.filter((kind) => counts[kind] && !LISTING_SUFFIXES[kind])
    ]);
    expect(new Set(params).size).toBe(params.length);
  });

  it('keeps every entity path and adds the moved listings at /wiki/<kind>/<x>', () => {
    const params = slugPaths().map((path) => path.params);
    const entities = nodes.filter((node) => node.navigable !== false && node.slug).map(({ kind, slug }) => ({ kind, slug }));
    expect(params.slice(0, entities.length)).toEqual(entities);
    expect(params.slice(entities.length)).toEqual([{ kind: 'equinox', slug: 'upgrades' }, { kind: 'rift', slug: 'levels' }]);
  });
});

describe('props', () => {
  it.each([
    ['equinox', 'upgrades'],
    ['rift', 'levels']
  ])('renders the full %s listing at its suffix', (kind, slug) => {
    const { props } = slugProps(kind, slug);
    const ids = Object.entries(graph.nodes)
      .filter(([, node]) => node.kind === kind && inListing(node))
      .sort(([, a], [, b]) => entityName(a).localeCompare(entityName(b)))
      .map(([id]) => id);
    expect([props.page, props.entries.map((entry) => entry.id)]).toEqual(['listing', ids]);
  });

  it.each([
    ['equinox', { page: 'system', kinds: ['equinox', 'dream'] }],
    ['sneaking', { page: 'system', kinds: ['jade', 'ninjaupgrade', 'pristinecharm', 'ninjaitem', 'sneakfloor'] }],
    ['monster', { page: 'listing' }],
    ['system', { notFound: true }]
  ])('serves /wiki/%s', (param, expected) => {
    const { props, notFound } = hubProps(param);
    expect({ page: props?.page, kinds: props?.kinds?.map((row) => row.kind), notFound }).toEqual(expected);
  });

  it('keeps an entity of a moved kind at its own URL', () => {
    const node = nodes.find((other) => other.kind === 'equinox' && inListing(other));
    expect(slugProps('equinox', node.slug).props.page).toBe('entity');
  });
});
