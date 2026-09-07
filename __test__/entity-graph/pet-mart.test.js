import { describe, it, expect } from 'vitest';
import { bundleNodes } from '../../scripts/entity-graph/nodes/bundles.mjs';
import { petMartEdges } from '../../scripts/entity-graph/edges/pets.mjs';

// The Pet Mart packs are the one bundle family whose whole record is in the game data, so none of
// this may fall back to the hand-written tables the other bundles need.
const bundleInfo = {
  bun_a: { price: 19.99 },
  bin_q: { name: 'GLOWING_PACK', price: 26.99, gems: 5300, petCrystals: 2500, companionIndex: 148, evolving: true },
  bin_g: { name: 'SUPADUPA_BUBBA', price: 64.99, gems: 12500, petCrystals: 7200, companionIndex: 58, evolving: true }
};
const companions = [];
companions[148] = { rawName: 'w7b8', name: 'Glowfish' };
companions[58] = { rawName: 'bubbab', name: 'Bubba_Supreme' };

describe('pet mart packs', () => {
  it('builds a node from the game data, with no entry in the hand-written bundle table', () => {
    const nodes = bundleNodes({ bundles: {} }, bundleInfo, {}, {}, companions);

    expect(nodes['bundle:bin_q']).toEqual({
      kind: 'bundle',
      rawName: 'bin_q',
      name: 'Glowing Pack',
      icon: '/afk_targets/Glowfish.png',
      // The listing bands on this: the Pet Mart is a different shop from the gem shop the other
      // bundles are sold through.
      category: 'Pet Mart',
      petMart: true,
      // The listing has no edges to read, so the pet's name travels on the pack itself.
      petName: 'Glowfish',
      price: 26.99,
      gems: 5300,
      petCrystals: 2500
    });
  });

  it('carries pet crystals, which no other bundle has', () => {
    const nodes = bundleNodes({ bundles: {} }, bundleInfo, {}, {}, companions);
    expect(nodes['bundle:bin_q'].petCrystals).toBe(2500);
    expect(nodes['bundle:bun_a']).toBeUndefined(); // no contents and no pet, so no node
  });

  it('links a pack to the pet it grants through the companion index', () => {
    const petNodes = { 'pet:w7b8': {}, 'pet:bubbab': {} };
    expect(petMartEdges(bundleInfo, companions, petNodes)).toEqual([
      { from: 'bundle:bin_q', to: 'pet:w7b8', rel: 'yields', meta: {}, source: 'pets' },
      { from: 'bundle:bin_g', to: 'pet:bubbab', rel: 'yields', meta: {}, source: 'pets' }
    ]);
  });

  // Four of the packs sell a pet the game still flags unreleased or has not put in a companion
  // group, so petNodes builds nothing for it. The pack keeps its page and simply lists no pet,
  // rather than the graph carrying an edge to a node that does not exist.
  it('drops the edge when the granted pet has no node', () => {
    expect(petMartEdges(bundleInfo, companions, { 'pet:w7b8': {} })).toEqual([
      { from: 'bundle:bin_q', to: 'pet:w7b8', rel: 'yields', meta: {}, source: 'pets' }
    ]);
  });

  it('titles a pack from the game name without a lookup table', () => {
    const nodes = bundleNodes({ bundles: {} }, bundleInfo, {}, {}, companions);
    expect(nodes['bundle:bin_g'].name).toBe('Supadupa Bubba');
  });
});
