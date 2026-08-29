import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { recipeUnlocks } from '../../scripts/entity-graph/recipe-unlocks.mjs';

const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
const taskUnlocks = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', 'taskUnlocks.json'), 'utf-8')
);

describe('task board recipe unlocks', () => {
  it('gates a recipe by the world whose board sells it, one-based', () => {
    const gates = recipeUnlocks([
      [[{ rawName: 'TestObj7' }, { rawName: 'EquipmentHats20' }]],
      [[{ rawName: 'TestObj3' }, {}]]
    ]);
    expect(gates.get('TestObj7')).toEqual({ world: 1, position: 1 });
    expect(gates.get('EquipmentHats20')).toEqual({ world: 1, position: 1 });
    expect(gates.get('TestObj3')).toEqual({ world: 2, position: 1 });
  });

  // z-processing keeps the pair at a fixed width, so a selection handing over one recipe carries
  // an empty object in the second slot rather than nothing.
  it('ignores the empty second slot', () => {
    const gates = recipeUnlocks([[[{ rawName: 'Bullet' }, {}]]]);
    expect([...gates.keys()]).toEqual(['Bullet']);
  });

  // 67 of the 256 slots hand over gems instead of a recipe. PremiumGem has dozens of sources and
  // is not an item anybody looks up to find out where it comes from.
  it('drops the gem selections', () => {
    const gates = recipeUnlocks([[[{ rawName: 'PremiumGem', amount: '50' }, { rawName: 'Bullet' }]]]);
    expect(gates.has('PremiumGem')).toBe(false);
    expect(gates.has('Bullet')).toBe(true);
  });

  // The game's own text calls these recipes, and this is what makes that checkable: an unlock that
  // resolved to something uncraftable would mean the column is not what it says it is.
  it('gates only items the graph knows how to craft', () => {
    const gates = recipeUnlocks(taskUnlocks);
    const craftable = new Set(graph.edges.filter((edge) => edge.rel === 'craftedFrom').map((edge) => edge.from));
    const uncraftable = [...gates.keys()].filter((rawName) => !craftable.has(`item:${rawName}`));
    expect(uncraftable).toEqual([]);
    expect(gates.size).toBe(160);
  });

  // The reason the note is worth rendering at all: for these the recipe is the only way in, so a
  // page listing materials and nothing else is telling a reader to craft something they cannot.
  it('leaves most of the gated items with crafting as their only source', () => {
    const gates = recipeUnlocks(taskUnlocks);
    const sourced = new Set(graph.edges
      .filter((edge) => ['drops', 'rewards', 'sells', 'yields'].includes(edge.rel))
      .map((edge) => edge.to));
    const craftOnly = [...gates.keys()].filter((rawName) => !sourced.has(`item:${rawName}`));
    expect(craftOnly.length).toBeGreaterThan(140);
  });

  // The build applies the gate to the item node, and a rawName that stopped matching would drop
  // the note off every page without anything failing.
  it('reaches an item node for every gate', () => {
    const gates = recipeUnlocks(taskUnlocks);
    const missing = [...gates.keys()].filter((rawName) => !graph.nodes[`item:${rawName}`]);
    expect(missing).toEqual([]);
    const annotated = Object.values(graph.nodes).filter((node) => node.recipeUnlock);
    expect(annotated).toHaveLength(gates.size);
    expect(graph.nodes['item:TestObj7'].recipeUnlock).toEqual({ world: 1, position: 1 });
  });
});
