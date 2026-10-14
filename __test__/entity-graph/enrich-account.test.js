import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { enrichAccount } from '../../scripts/entity-graph/enrich-account.mjs';
import { mapNodes } from '../../scripts/entity-graph/nodes/maps.mjs';
import { itemNodes } from '../../scripts/entity-graph/nodes/items.mjs';
import { worldNodes } from '../../scripts/entity-graph/nodes/worlds.mjs';
import { mapEdges } from '../../scripts/entity-graph/edges/maps.mjs';
import { spaced } from '../../scripts/entity-graph/registry/text.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

const blank = () => {
  const maps = mapNodes(data.mapNames, data.rawMapNames);
  const items = Object.fromEntries(Object.entries(itemNodes(data.items, data.monsters, data.cards, data.stamps)).filter(([, node]) => node.card));
  return { ...maps, ...items, ...worldNodes(maps) };
};
// The before/after snapshots name exactly which nodes the enrichment touched.
const before = blank();
const snapshot = Object.fromEntries(Object.entries(before).map(([id, node]) => [id, JSON.stringify(node)]));
const nodes = blank();
enrichAccount(nodes, data);
const changed = (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && JSON.stringify(nodes[id]) !== snapshot[id]).sort();
const doors = (id) => nodes[id].fields?.filter((field) => field.label === 'Doors');
const doorLines = (id) => doors(id)?.[0].value;

describe('Breeding Arena on the World 4 page', () => {
  it('touches only world:4, with one field holding a line per arena bonus', () => {
    expect(changed('world:')).toEqual(['world:4']);
    const fields = nodes['world:4'].fields;
    expect(fields.map((field) => field.label)).toEqual(['Breeding Arena']);
    const lines = fields[0].value;
    expect(lines).toHaveLength(data.arenaBonuses.length);
    expect(lines.filter((line, index) => !line.startsWith(`Wave ${data.arenaBonuses[index].wave}:`))).toEqual([]);
  });

  it('reads the bonuses the way the panel prints them', () => {
    const lines = nodes['world:4'].fields[0].value;
    expect(lines[0]).toBe('Wave 2: Unlocks 3rd Mob Battle Slot');
    expect(lines[2]).toBe('Wave 8: 1.20x Total Damage');
    expect(lines[11]).toBe('Wave 100: Can Equip 3rd Large Bubble');
  });
});

describe('card sets on card item pages', () => {
  it('joins every card item to its set by category, and nothing else', () => {
    const cardItems = Object.keys(before).filter((id) => before[id].card).sort();
    expect(cardItems.length).toBeGreaterThan(0);
    expect(changed('item:')).toEqual(cardItems);
    const mismatched = cardItems.filter((id) => nodes[id].card.set.name !== nodes[id].card.category);
    expect(mismatched).toEqual([]);
  });

  it('carries the set name, effect and bonus', () => {
    expect(nodes['item:CardsA0'].card.set).toEqual({ name: 'Blunder_Hills', effect: '{%_EXP_if_below_Lv_50', bonus: 8 });
    expect(nodes['item:CardsZ0'].card.set).toMatchObject({ name: 'Bosses', bonus: 6 });
  });
});

describe('map doors', () => {
  it('lists a kill requirement as the door reads it', () => {
    expect(nodes['map:1'].fields).toEqual([{ label: 'Doors', value: ['To Froggy Fields: 21 kills'] }]);
  });

  it('reads a mining map as a skill level, door 1 following door 0', () => {
    expect(nodes['map:7'].fields).toEqual([{ label: 'Doors', value: ["To The Ol' Straightaway: Mining level 25", 'To The Royal Castle: Mining level 81'] }]);
  });

  it('reads a fishing map as a skill level', () => {
    expect(nodes['map:54'].fields).toEqual([{ label: 'Doors', value: ['To Faraway Piers: Fishing level 15'] }]);
  });

  it('adds the character count to door 0 of a multi-character map only', () => {
    expect(nodes['map:303'].fields).toEqual([{
      label: 'Doors',
      value: ['To Plastic Basin: 10,000,000 kills, and 5 characters must clear this map', 'To Barnacle Curb: 1,500,000 kills']
    }]);
  });

  it('calls a zero requirement always open', () => {
    expect(nodes['map:0'].fields).toEqual([{ label: 'Doors', value: ['To Spore Meadows: Always open'] }]);
  });

  it('leaves out a door past the requirement list, and one into the padding scene', () => {
    expect(nodes['map:2'].fields).toEqual([{ label: 'Doors', value: ['To Valley Of The Beans: 25 kills'] }]);
    expect(nodes['map:11'].fields).toEqual([{ label: 'Doors', value: ['To Slip Slidy Ledges: Mining level 60'] }]);
  });

  it('adds nothing to a map with no readable door', () => {
    expect(nodes['map:3'].fields).toBeUndefined();
    expect(nodes['map:20'].fields).toBeUndefined();
  });

  it('only lists destinations the map already connects to, and never a placeholder', () => {
    const connected = new Set(mapEdges(data).filter((edge) => edge.rel === 'connectsTo').map((edge) => `${edge.from}>${edge.to}`));
    const named = (id) => nodes[id].name;
    const lines = changed('map:').flatMap((id) => doorLines(id).map((line) => [id, line]));
    expect(lines.length).toBeGreaterThan(0);
    const stray = lines.filter(([id, line]) => ![...connected].some((pair) => {
      const [from, to] = pair.split('>');
      return from === id && line.startsWith(`To ${spaced(named(to))}: `);
    }));
    expect(stray).toEqual([]);
    expect(lines.filter(([, line]) => /_|undefined|null|NaN/.test(line))).toEqual([]);
  });
});
