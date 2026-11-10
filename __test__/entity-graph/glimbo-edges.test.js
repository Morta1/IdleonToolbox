import { describe, it, expect } from 'vitest';
import { glimboEdges } from '../../scripts/entity-graph/edges/glimbo.mjs';
import { websiteData, entityGraph } from '../helpers/wiki-data.js';

const data = websiteData();

const research = [];
research[26] = ['2', '13', '99'];
research[27] = ['Coral3', 'Ladle', 'SilverPen'];
const upgradeVault = [];
upgradeVault[2] = { name: 'Monster_Tax' };
upgradeVault[13] = { name: 'Major_Discount' };

describe('glimboEdges', () => {
  // The item and vault lists pair by position. SilverPen's trade names vault index 99, which is no
  // upgrade, so it is skipped.
  it('links Glimbo to each item he takes, carrying the vault upgrade it raises', () => {
    expect(glimboEdges(research, upgradeVault, data)).toEqual([
      { from: 'npc:Glimbo', to: 'item:Coral3', rel: 'buys', meta: { upgrade: 'Monster_Tax' }, source: 'glimbo' },
      { from: 'npc:Glimbo', to: 'item:Ladle', rel: 'buys', meta: { upgrade: 'Major_Discount' }, source: 'glimbo' }
    ]);
  });

  it('strips the in-game font glyph from the upgrade name', () => {
    const vault = [];
    vault[2] = { name: 'Go_Go_Secret_Owl_製' };
    expect(glimboEdges(research, vault, data)[0].meta.upgrade).toBe('Go_Go_Secret_Owl');
  });

  it('emits nothing without research data', () => {
    expect(glimboEdges(undefined, upgradeVault, data)).toEqual([]);
  });
});

describe('the built graph', () => {
  const graph = entityGraph();
  const research27 = websiteData().research[27];
  const edges = graph.edges.filter((edge) => edge.rel === 'buys');

  // Counted off the game's own list rather than a literal, so a patch adding trades does not break it.
  it('links every Glimbo trade to a real item', () => {
    expect(edges).toHaveLength(research27.length);
    expect(edges.every((edge) => graph.nodes[edge.to]?.kind === 'item' && edge.meta?.upgrade)).toBe(true);
  });
});
