import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { buildingNodes, chipNodes, enrichShrines, jewelNodes, mealNodes, prayerNodes, spiceNodes } from '../../scripts/entity-graph/nodes/systems.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { costAt, levelledText } from '../../utility/wiki/effects.mjs';
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

  it('reads a jewel with the game line break as a sentence break and drops the player-total readout', () => {
    const odd = [
      { index: 5, name: 'Emerald_Pyramite', bonus: 1, effect: 'Meal_cooking_is_}%_faster_for_every_25_total_upgrade_levels._@_Total_Bonus:_{%_speed', requirements: [] },
      { index: 6, name: 'Two_Lines', bonus: 25, effect: 'Gives_+25%_Line_Width._@_Also_gives_+}%_Breeding_EXP.', requirements: [] }
    ];
    const built = jewelNodes(odd);
    expect(built['jewel:ConsoleJwl5'].description).toBe('Meal_cooking_is_1%_faster_for_every_25_total_upgrade_levels.');
    expect(built['jewel:ConsoleJwl6'].description).toBe('Gives_+25%_Line_Width._Also_gives_+25%_Breeding_EXP.');
  });

  it('describes a prayer at level one, curse included', () => {
    expect(prayerNodes(prayers)['prayer:Prayer0'].description)
      .toBe('Level 1: +30%_Class_EXP. Curse: +250%_Max_HP_for_all_monsters.');
  });

  it('cuts a building description before its live bonus readout', () => {
    expect(buildingNodes(towers)['building:Salt_Lick'].description).toBe('Spend_salts!');
  });
});

describe('shrine buildings', () => {
  const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
  const plain = buildingNodes(data.towers);
  const nodes = structuredClone(plain);
  enrichShrines(nodes, data.towers, data.shrines);
  const shrineIds = Object.values(data.shrines).map((shrine) => `building:${shrine.shrineName}`);

  it('words the cost as the time to reach a level, not a price', () => {
    expect(nodes['building:Woodular_Shrine'].cost).toMatchObject({
      label: 'Time to reach this level',
      note: 'Before shrine level-up speed bonuses.'
    });
  });

  it('enriches exactly the building behind each shrine', () => {
    const changed = Object.keys(nodes).filter((id) => JSON.stringify(nodes[id]) !== JSON.stringify(plain[id]));
    expect(changed.sort()).toEqual([...shrineIds].sort());
  });

  // Oracles: Shrine(i) in N.js, (level - 1) * bonusPerLevel + baseBonus with no passive card.
  it.each([
    ['Woodular_Shrine', 1, '+12%'],
    ['Woodular_Shrine', 10, '+39%'],
    ['Crescent_Shrine', 5, '+80%'],
    ['Primordial_Shrine', 10, '+1.9%']
  ])('%s at level %s reads %s', (name, level, expected) => {
    expect(levelledText(nodes[`building:${name}`], level)).toContain(expected);
  });

  // Oracle: ShrineHrREQ in WorkbenchStuff.js, floored below level 20.
  it.each([[2, 6], [3, 39], [4, 87], [11, 5053]])('level %s costs %s hours of shrine progress', (level, hours) => {
    expect(costAt(nodes['building:Woodular_Shrine'], level)).toBe(hours);
    expect(nodes['building:Woodular_Shrine'].cost.currency).toBe('hours of shrine progress');
  });

  it('keeps the building text, spaced, in a field of its own', () => {
    expect(shrineIds.map((id) => nodes[id].fields)).toEqual(shrineIds.map((id) => [{
      label: 'About this building',
      value: plain[id].description.replace(/_/g, ' ')
    }]));
    expect(nodes['building:Crescent_Shrine'].fields[0].value).not.toMatch(/_/);
  });

  it('renders the calculator and leaves the rest of the node alone', () => {
    const woodular = nodes['building:Woodular_Shrine'];
    expect(woodular.registry).toBe(true);
    expect(woodular.kind).toBe('building');
    expect(woodular.icon).toBe(plain['building:Woodular_Shrine'].icon);
    expect(woodular.effect.levelLabel).toBe('Shrine level');
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

  // Only the jewels whose game text carries a line break or a readout may differ from the plain base-value fill.
  it('keeps every jewel without a line break exactly as the plain base-value fill, and no jewel shows an @', () => {
    const shared = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
    const built = jewelNodes(shared.jewels);
    const plain = (jewel) => String(jewel.effect).replace(/[{}]/g, jewel.bonus);
    const changed = shared.jewels.filter((jewel) => built[`jewel:ConsoleJwl${jewel.index}`].description !== plain(jewel));
    expect(changed.map((jewel) => jewel.effect).filter((effect) => !effect.includes('@'))).toEqual([]);
    expect(changed.length).toBeGreaterThan(0);
    expect(Object.values(built).filter((node) => node.description.includes('@'))).toEqual([]);
    expect(built['jewel:ConsoleJwl14'].description).toBe('Meal_cooking_is_1%_faster_for_every_25_total_upgrade_levels_across_all_kitchens.');
  });

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
