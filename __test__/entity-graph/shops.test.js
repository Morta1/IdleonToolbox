import { describe, it, expect } from 'vitest';
import { shopNodes } from '../../scripts/entity-graph/nodes/shops.mjs';
import { shopEdges } from '../../scripts/entity-graph/edges/shops.mjs';
import { shops } from './fixture.mjs';

describe('shop nodes', () => {
  it('keys shops by their numeric index and names them after their town', () => {
    const nodes = shopNodes(shops, { 0: 'Blunder_Hills' });
    expect(nodes['shop:0']).toEqual({
      kind: 'shop', rawName: '0', name: 'Blunder_Hills', icon: null, category: 'World 1'
    });
  });

  // A shop's town name matches a map name exactly, and a map's world is its index in blocks of
  // fifty. Without it the nine shops carry no category and the listing cannot band them.
  it('derives the world from the town the shop sits in', () => {
    const nodes = shopNodes(
      { 0: { name: 'Blunder_Hills' }, 1: { name: 'YumYum_Grotto' }, 2: { name: 'Shimmerfin_Grove' } },
      { 0: 'Blunder_Hills', 50: 'YumYum_Grotto', 300: 'Shimmerfin_Grove' }
    );
    expect(nodes['shop:0'].category).toBe('World 1');
    expect(nodes['shop:1'].category).toBe('World 2');
    expect(nodes['shop:2'].category).toBe('World 7');
  });

  it('leaves the category null when the town matches no map', () => {
    expect(shopNodes({ 0: { name: 'Nowhere' } }, { 0: 'Blunder_Hills' })['shop:0'].category).toBeNull();
  });

  it('falls back to the index rather than rendering an unnamed shop', () => {
    const nodes = shopNodes({ 9: { items: [] } }, {});
    expect(nodes['shop:9'].name).toBe('Shop 9');
  });

  it('returns nothing when there are no shops', () => {
    expect(shopNodes(undefined)).toEqual({});
  });
});

describe('shop edges', () => {
  it('emits shop -> item sells edges', () => {
    const edges = shopEdges(shops).filter((edge) => edge.rel === 'sells');
    expect(edges).toContainEqual({
      from: 'shop:0', to: 'item:CraftMat1', rel: 'sells', meta: {}, source: 'shops'
    });
    expect(edges).toHaveLength(2);
  });

  it('skips rows carrying no rawName', () => {
    expect(shopEdges({ 0: { items: [{ name: 'Mystery' }] } })).toEqual([]);
  });

  // The shop's own display name is the town, so it matches a map name with no mapping table.
  it('puts the shop on the map it is named after', () => {
    const edges = shopEdges(shops, { 0: 'Blunder_Hills', 1: 'Spore_Meadows' });
    expect(edges).toContainEqual({
      from: 'map:0', to: 'shop:0', rel: 'hasShop', meta: {}, source: 'shops'
    });
  });

  it('leaves a shop off the map when no map carries its name', () => {
    const edges = shopEdges(shops, { 1: 'Spore_Meadows' });
    expect(edges.filter((edge) => edge.rel === 'hasShop')).toEqual([]);
  });
});
