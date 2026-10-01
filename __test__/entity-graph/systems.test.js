import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { buildingNodes, chipNodes, jewelNodes, mealNodes, prayerNodes, spiceNodes } from '../../scripts/entity-graph/nodes/systems.mjs';
import { buildingEdges, labEdges, prayerEdges } from '../../scripts/entity-graph/edges/systems.mjs';
import { beanstalkEdges } from '../../scripts/entity-graph/edges/beanstalk.mjs';

const chips = [{
  index: 0, rawName: 'ConsoleChip0', name: 'Grounded_Nanochip', bonus: '+{%_Total_Defence', baseVal: 10,
  requirements: [
    { rawName: 'Copper', name: 'Copper_Ore', amount: 20000 },
    { rawName: 'CookingM0', name: 'Turkey_of_Thank', amount: 100 },
    { rawName: 'CookingSpice0', name: 'Grasslands', amount: 100 }
  ]
}];
const jewels = [{
  index: 0, name: 'Amethyst_Rhinestone', bonus: 1.5, effect: 'Meal_cooking_is_}x_faster.',
  requirements: [{ rawName: 'Quest66', name: 'Strung_Jewels', amount: 5 }]
}];
const prayers = [{
  name: 'Big_Brain_Time', effect: '+{%_Class_EXP', curse: '+{%_Max_HP_for_all_monsters', x1: 30, x2: 250,
  prayerIndex: 0, soul: 'Soul1', costMulti: 100
}];
const towers = {
  Salt_Lick: { index: 3, desc: 'Spend_salts!_@_Current_Bonuses:_@_$', itemReq: [{ rawName: 'Refinery2', amount: 20 }] }
};
const saltLicks = [{ rawName: 'Refinery1', baseCost: 5 }, { rawName: 'Refinery1', baseCost: 10 }, { rawName: 'Refinery2', baseCost: 5 }];

describe('system nodes', () => {
  it('fills a chip bonus at its base value', () => {
    expect(chipNodes(chips)['chip:ConsoleChip0'].description).toBe('+10%_Total_Defence');
  });

  it('gives each meal a page keyed by its menu index', () => {
    const meals = mealNodes([{ name: 'Turkey_of_Thank', effect: '+{%_Total_Damage', baseStat: 2 }]);
    expect(meals['meal:CookingM0']).toMatchObject({ name: 'Turkey_of_Thank', description: 'Level 1: +2%_Total_Damage' });
  });

  it('names each spice after its area', () => {
    expect(spiceNodes(['Grasslands'])['spice:CookingSpice0'].name).toBe('Grasslands Spice');
  });

  it('fills a jewel effect at its base value', () => {
    expect(jewelNodes(jewels)['jewel:ConsoleJwl0'].description).toBe('Meal_cooking_is_1.5x_faster.');
  });

  it('describes a prayer at level one, curse included', () => {
    expect(prayerNodes(prayers)['prayer:Prayer0'].description)
      .toBe('Level 1: +30%_Class_EXP. Curse: +250%_Max_HP_for_all_monsters.');
  });

  it('cuts a building description before its live bonus readout', () => {
    expect(buildingNodes(towers)['building:Salt_Lick'].description).toBe('Spend_salts!');
  });
});

describe('system edges', () => {
  it('links a chip to its item, meal and spice costs', () => {
    expect(labEdges(chips, jewels).filter((edge) => edge.from === 'chip:ConsoleChip0').map((edge) => [edge.to, edge.meta]))
      .toEqual([
        ['item:Copper', { quantity: 20000 }],
        ['meal:CookingM0', { quantity: 100 }],
        ['spice:CookingSpice0', { quantity: 100 }]
      ]);
  });

  it('levels a prayer with its soul, at the level-one cost', () => {
    expect(prayerEdges(prayers)).toEqual([{
      from: 'prayer:Prayer0', to: 'item:Soul1', rel: 'upgradedWith', meta: { baseCost: 100 }, source: 'systems'
    }]);
  });

  // Refinery2 is already the building's own costed material, so its Salt Lick upgrades add no row.
  it('links each Salt Lick salt once, without a second row for the building material', () => {
    const lick = buildingEdges(towers, saltLicks).filter((edge) => edge.from === 'building:Salt_Lick');
    expect(lick.map((edge) => [edge.to, edge.meta])).toEqual([
      ['item:Refinery2', { baseCost: 20 }],
      ['item:Refinery1', {}]
    ]);
  });

  it('reads the beanstalk foods out of the interleaved coordinate list', () => {
    expect(beanstalkEdges({ 29: ['41', '6', 'FoodG1', '12', '-2', 'FoodG2'] }).map((edge) => edge.to))
      .toEqual(['item:FoodG1', 'item:FoodG2']);
  });
});

describe('the built graph', () => {
  const graph = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'entity-graph.json'), 'utf-8'));
  const count = (kind) => Object.values(graph.nodes).filter((node) => node.kind === kind).length;

  it('has a page for every chip, jewel, prayer and building', () => {
    expect(count('chip')).toBeGreaterThan(20);
    expect(count('jewel')).toBeGreaterThan(20);
    expect(count('prayer')).toBeGreaterThan(20);
    expect(count('building')).toBeGreaterThan(20);
  });

  it('links every one of them to at least one item', () => {
    const linked = new Set(graph.edges.map((edge) => edge.from));
    const orphans = Object.entries(graph.nodes)
      .filter(([id, node]) => ['chip', 'jewel', 'prayer', 'building'].includes(node.kind) && !linked.has(id))
      .map(([id]) => id);
    expect(orphans).toEqual([]);
  });
});
