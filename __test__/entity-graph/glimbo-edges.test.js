import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { glimboEdges } from '../../scripts/entity-graph/edges/glimbo.mjs';

const research = [];
research[26] = ['2', '13', '99'];
research[27] = ['Coral3', 'Ladle', 'SilverPen'];
const upgradeVault = [];
upgradeVault[2] = { name: 'Monster_Tax' };
upgradeVault[13] = { name: 'Major_Discount' };

describe('glimboEdges', () => {
  it('links Glimbo to each item he takes, carrying the vault upgrade it raises', () => {
    expect(glimboEdges(research, upgradeVault)).toContainEqual({
      from: 'npc:Glimbo', to: 'item:Coral3', rel: 'buys', meta: { upgrade: 'Monster_Tax' }, source: 'glimbo'
    });
  });

  it('pairs the item and vault lists by position', () => {
    expect(glimboEdges(research, upgradeVault).find((edge) => edge.to === 'item:Ladle')?.meta.upgrade)
      .toBe('Major_Discount');
  });

  it('strips the in-game font glyph from the upgrade name', () => {
    const vault = [];
    vault[2] = { name: 'Go_Go_Secret_Owl_製' };
    expect(glimboEdges(research, vault)[0].meta.upgrade).toBe('Go_Go_Secret_Owl');
  });

  it('skips a trade whose vault index names no upgrade', () => {
    expect(glimboEdges(research, upgradeVault).map((edge) => edge.to)).not.toContain('item:SilverPen');
  });

  it('emits nothing without research data', () => {
    expect(glimboEdges(undefined, upgradeVault)).toEqual([]);
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const research27 = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'research.json'), 'utf-8'))[27];
  const edges = graph.edges.filter((edge) => edge.rel === 'buys');

  // Counted off the game's own list rather than a literal, so a patch adding trades does not break it.
  it('links every Glimbo trade to a real item', () => {
    expect(edges).toHaveLength(research27.length);
    expect(edges.every((edge) => graph.nodes[edge.to]?.kind === 'item' && edge.meta?.upgrade)).toBe(true);
  });
});
