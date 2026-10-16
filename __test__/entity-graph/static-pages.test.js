import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { entityPageProps, entityPaths, hubPaths, hubProps, slugPaths, slugProps, wikiHomeProps } from '../../utility/wiki/static-pages.mjs';
import {
  LISTED_KINDS, MOVED_KINDS, SYSTEMS, entityPath, inListing, listingCounts, listingHref, systemOf, systemsWithRows
} from '../../utility/wiki/kinds.mjs';
import { entityName } from '../../utility/wiki/names.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const searchIndex = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'wiki-search-index.json'), 'utf-8'));
const nodes = Object.values(graph.nodes);
const counts = listingCounts(nodes);

const urlOf = ({ params }) => `/wiki/${[params.kind, params.slug, params.entity].filter(Boolean).join('/')}`;
const hubUrls = hubPaths().map(urlOf);
const slugUrls = slugPaths().map(urlOf);
const entityUrls = entityPaths().map(urlOf);
const allUrls = [...hubUrls, ...slugUrls, ...entityUrls];

// Which page a URL turns out to be, read off the props its route would build.
const pageAt = (url) => {
  const parts = url.split('/').slice(2);
  if (parts.length === 1) return hubProps(...parts);
  if (parts.length === 2) return slugProps(...parts);
  return entityPageProps(...parts);
};

// The moved kinds' pages that shipped at /wiki/<kind>/<slug>, each still served by a redirect.
const movedNodes = nodes.filter((node) => MOVED_KINDS.includes(node.kind) && node.navigable !== false && node.slug);

// The three routes split the URLs between them, so the paths are what decides which pages the export writes.
describe('paths', () => {
  it('writes each URL once across the three routes', () => {
    expect(new Set(allUrls).size).toBe(allUrls.length);
  });

  it('serves every system with rows, every loose listing, then the old listings of moved kinds, at /wiki/<x>', () => {
    expect(hubUrls).toEqual([
      ...systemsWithRows(counts).map((system) => `/wiki/${system.slug}`),
      ...LISTED_KINDS.filter((kind) => counts[kind] && !systemOf(kind)).map(listingHref),
      ...['chip', 'jewel', 'god', 'artifact', 'superbit', 'jade', 'achievement', 'starsign', 'postbox'].map((kind) => `/wiki/${kind}`)
    ]);
    // The rail links every system, so a system that lost its page would be a dead anchor on every wiki page.
    expect(hubUrls).toEqual(expect.arrayContaining(SYSTEMS.map((system) => `/wiki/${system.slug}`)));
  });

  // The search index is written by the graph build, not by this module, so it is an independent record of every entity.
  it('reaches every entity exactly once, at its own URL', () => {
    const pages = allUrls.filter((url) => pageAt(url).props?.page === 'entity');
    expect(pages.sort()).toEqual(searchIndex.map(({ kind, slug }) => entityPath(kind, slug)).sort());
  });

  it('puts every listing with rows at its listing URL, and nothing else on the listing route', () => {
    const listings = allUrls.filter((url) => pageAt(url).props?.page === 'listing');
    expect(listings.sort()).toEqual(LISTED_KINDS.filter((kind) => counts[kind]).map(listingHref).sort());
  });

  it('keeps a redirect for exactly the old URLs of the moved kinds', () => {
    const redirects = allUrls.filter((url) => pageAt(url).props?.page === 'redirect');
    expect(redirects.sort()).toEqual([
      ...MOVED_KINDS.filter((kind) => kind !== 'equinox').map((kind) => `/wiki/${kind}`),
      ...movedNodes.map((node) => `/wiki/${node.kind}/${node.slug}`)
    ].sort());
    expect(new Set(movedNodes.map((node) => node.kind))).toEqual(new Set(MOVED_KINDS));
  });
});

// The rail renders only its open groups, so /wiki's tiles are the one exported page linking every category; they are
// drawn from these counts at build time.
describe('the wiki home', () => {
  it('counts every listing at build time, the same rows each listing page shows', () => {
    expect(wikiHomeProps().props.counts).toEqual(listingCounts(searchIndex));
  });
});

describe('props', () => {
  it.each([
    ['equinox', 'upgrades', 'equinox'],
    ['rift', 'levels', 'rift'],
    ['sneaking', 'pristine-charms', 'pristinecharm']
  ])('renders the full listing at /wiki/%s/%s', (system, segment, kind) => {
    const { props } = slugProps(system, segment);
    const ids = Object.entries(graph.nodes)
      .filter(([, node]) => node.kind === kind && inListing(node))
      .sort(([, a], [, b]) => entityName(a).localeCompare(entityName(b)))
      .map(([id]) => id);
    expect([props.page, props.kind, props.entries.map((entry) => entry.id)]).toEqual(['listing', kind, ids]);
  });

  it.each([
    ['equinox', { page: 'system', kinds: ['equinox', 'dream'] }],
    ['sneaking', { page: 'system', kinds: ['jade', 'ninjaupgrade', 'pristinecharm', 'ninjaitem', 'sneakfloor'] }],
    ['monster', { page: 'listing' }],
    ['compass-upgrades', { page: 'listing' }],
    ['compassupgrade', { notFound: true }],
    ['god', { page: 'redirect' }],
    ['starsign', { page: 'redirect' }],
    ['sneakfloor', { notFound: true }],
    ['system', { notFound: true }]
  ])('serves /wiki/%s', (param, expected) => {
    const { props, notFound } = hubProps(param);
    expect({ page: props?.page, kinds: props?.kinds?.map((row) => row.kind), notFound }).toEqual(expected);
  });

  it('serves an entity of a system kind under its system, and nowhere else', () => {
    const node = nodes.find((other) => other.kind === 'sneakfloor' && inListing(other));
    const { props } = entityPageProps('sneaking', 'floors', node.slug);
    expect([props.page, props.slice.node.slug]).toEqual(['entity', node.slug]);
    expect(entityPageProps('sneaking', 'items', node.slug)).toEqual({ notFound: true });
    expect(slugProps('sneakfloor', node.slug)).toEqual({ notFound: true });
  });

  // Each redirect carries the new page's title and description, so a preview of the old link still names the page.
  it.each([
    ['an old entity URL', () => {
      const node = nodes.find((other) => other.kind === 'god' && inListing(other));
      return { props: slugProps('god', node.slug).props, to: entityPath('god', node.slug), title: `${entityName(node)} | Idleon Toolbox` };
    }],
    ['an old entity URL whose kind shares its system\'s slug', () => {
      const node = nodes.find((other) => other.kind === 'equinox' && inListing(other));
      return { props: slugProps('equinox', node.slug).props, to: entityPath('equinox', node.slug), title: `${entityName(node)} | Idleon Toolbox` };
    }],
    ['an old listing', () => ({ props: hubProps('chip').props, to: '/wiki/laboratory/chips', title: 'Lab Chips | Idleon Toolbox' })]
  ])('points %s at its new URL', (unused, read) => {
    const { props, to, title } = read();
    expect(props).toMatchObject({ page: 'redirect', to, seoCanonical: to, seoTitle: title });
    expect(props.seoDescription).toBeTruthy();
  });
});
