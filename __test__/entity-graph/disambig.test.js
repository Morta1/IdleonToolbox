import fs from 'fs';
import path from 'path';
import { beforeAll, describe, expect, it } from 'vitest';
import { disambiguate, gemShopNames } from '../../scripts/entity-graph/disambig.mjs';
import { entityName } from '../../utility/wiki/names.mjs';

const readData = (...parts) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', ...parts), 'utf-8'));
const labelOf = (node) => (Object.hasOwn(node, 'disambig') ? node.disambig : null);

describe('disambiguate on the real graph', () => {
  let nodes;
  beforeAll(() => {
    const graph = readData('entity-graph.json');
    nodes = graph.nodes;
    disambiguate(nodes, graph.edges, gemShopNames(readData('website-data', 'gemShop.json')));
  });

  it('labels the same-name pages each rule was written for', () => {
    const ids = [
      'mineheadopponent:MineheadOpp20', 'mineheadopponent:MineheadOpp21',
      'item:EquipmentShoes10', 'item:DungEquipmentShoes1',
      'item:FoodHealth1', 'item:FoodHealth1d',
      'quest:Poigu3', 'quest:Muhmuguh3',
      'summoningupgrade:SummonUpg25', 'summoningupgrade:SummonUpg34'
    ];
    expect(ids.map((id) => [id, labelOf(nodes[id])])).toEqual([
      ['mineheadopponent:MineheadOpp20', '#21'], ['mineheadopponent:MineheadOpp21', '#22'],
      ['item:EquipmentShoes10', null], ['item:DungEquipmentShoes1', 'Dungeon'],
      ['item:FoodHealth1', 'Health Food'], ['item:FoodHealth1d', 'Dungeon Food'],
      ['quest:Poigu3', 'from Poigu'], ['quest:Muhmuguh3', 'from Muhmuguh'],
      ['summoningupgrade:SummonUpg25', 'Essence: Yellow'], ['summoningupgrade:SummonUpg34', 'Essence: Blue']
    ]);
  });

  // The contract: a game update that adds a same-name pair no rule can separate fails here.
  it('leaves no two navigable pages of one kind with the same name and label', () => {
    const seen = new Map();
    const clashes = [];
    for (const [id, node] of Object.entries(nodes)) {
      if (node.navigable === false || !node.slug) continue;
      const key = `${node.kind}|${entityName(node)}|${labelOf(node) ?? ''}`;
      if (seen.has(key)) clashes.push([seen.get(key), id]);
      else seen.set(key, id);
    }
    expect(clashes).toEqual([]);
  });

  it('labels only the members of a same-name group', () => {
    expect(labelOf(nodes['item:Copper'])).toBe(null);
  });
});

describe('disambiguate rules', () => {
  const run = (members, edges = [], gemNames = new Map(), extra = {}) => {
    const nodes = { ...extra };
    for (const [id, fields] of members) nodes[id] = { slug: id, ...fields };
    disambiguate(nodes, edges, gemNames);
    return members.map(([id]) => [id, labelOf(nodes[id])]);
  };
  const item = (name, fields) => ({ kind: 'item', name, category: 'SHOES', ...fields });

  // Each group fails every earlier rule, so the table pins the order as well as each label.
  it.each([
    ['R1 dungeon copy', [
      ['item:EquipmentShoes10', item('Flap_Flops', { rawName: 'EquipmentShoes10' })],
      ['item:DungEquipmentShoes1', item('Flap_Flops', { rawName: 'DungEquipmentShoes1' })]
    ], {}, [null, 'Dungeon']],
    ['R2 category', [
      ['item:FoodHealth1', item('Nomwich', { rawName: 'FoodHealth1', category: 'HEALTH_FOOD' })],
      ['item:FoodHealth1d', item('Nomwich', { rawName: 'FoodHealth1d', category: 'DUNGEON_FOOD' })]
    ], {}, ['Health Food', 'Dungeon Food']],
    ['R3 quest giver', [
      ['quest:Poigu3', { kind: 'quest', rawName: 'Poigu3', name: 'Learn' }],
      ['quest:Muhmuguh3', { kind: 'quest', rawName: 'Muhmuguh3', name: 'Learn' }]
    ], {
      edges: [{ from: 'npc:Poigu', to: 'quest:Poigu3', rel: 'gives' }, { from: 'npc:Muhmuguh', to: 'quest:Muhmuguh3', rel: 'gives' }],
      extra: { 'npc:Poigu': { kind: 'npc', rawName: 'Poigu', name: 'Poigu' }, 'npc:Muhmuguh': { kind: 'npc', rawName: 'Muhmuguh', name: 'Muhmuguh' } }
    }, ['from Poigu', 'from Muhmuguh']],
    ['R4 bestiary section', [
      ['monster:luckEvent2', { kind: 'monster', rawName: 'luckEvent2', name: 'Potluck', category: 'Monster', section: 'Events' }],
      ['monster:PotG', { kind: 'monster', rawName: 'PotG', name: 'Potluck', category: 'Monster' }]
    ], {}, ['Events', null]],
    ['R5 short field', [
      ['summoningupgrade:SummonUpg25', { kind: 'summoningupgrade', rawName: 'SummonUpg25', name: 'Another_Slot', category: 'World 6', order: 25, fields: [{ label: 'Essence', value: 'Yellow' }] }],
      ['summoningupgrade:SummonUpg34', { kind: 'summoningupgrade', rawName: 'SummonUpg34', name: 'Another_Slot', category: 'World 6', order: 34, fields: [{ label: 'Essence', value: 'Blue' }] }]
    ], {}, ['Essence: Yellow', 'Essence: Blue']],
    // A long sentence and a number are both passed over as labels.
    ['R6 game order', [
      ['mineheadopponent:MineheadOpp20', { kind: 'mineheadopponent', rawName: 'MineheadOpp20', name: 'Brainhead', category: 'World 7', order: 20, fields: [{ label: 'Presented as', value: 'Your twenty first opponent' }, { label: 'HP', value: '2.19e10' }] }],
      ['mineheadopponent:MineheadOpp21', { kind: 'mineheadopponent', rawName: 'MineheadOpp21', name: 'Brainhead', category: 'World 7', order: 21, fields: [{ label: 'Presented as', value: 'Your twenty second opponent' }, { label: 'HP', value: '4.37e10' }] }]
    ], {}, ['#21', '#22']],
    ['R7 gem shop name', [
      ['item:GemQ1', item('Infinite_Forge', { rawName: 'GemQ1', category: 'ERROR' })],
      ['item:GemQ2', item('Infinite_Forge', { rawName: 'GemQ2', category: 'ERROR' })]
    ], { gemNames: new Map([['GemQ1', 'CRYSTAL_3D_PRINTER'], ['GemQ2', 'MORE_SAMPLE_SPACES']]) }, ['Crystal 3D Printer', 'More Sample Spaces']],
    ['R8 first differing stat', [
      ['monster:w7b1', { kind: 'monster', rawName: 'w7b1', name: 'Trench_Fish', category: 'Fish', stats: { attack: 600000, health: 5 } }],
      ['monster:MotherlodeFISH', { kind: 'monster', rawName: 'MotherlodeFISH', name: 'Trench_Fish', category: 'Fish', stats: { attack: 6, health: 5 } }],
      ['monster:Fish14', { kind: 'monster', rawName: 'Fish14', name: 'Trench_Fish', category: 'Fish', stats: { attack: 1000, health: 5 } }]
    ], {}, ['Attack 600,000', 'Attack 6', 'Attack 1,000']],
    ['R8 first differing stat, a two-word key', [
      ['item:DungWeaponPunchE1', item('Eclectic_Ordeal_I', { rawName: 'DungWeaponPunchE1', stats: { lvReqToEquip: 2, Weapon_Power: 32 } })],
      ['item:DungWeaponPunchF1', item('Eclectic_Ordeal_I', { rawName: 'DungWeaponPunchF1', stats: { lvReqToEquip: 2, Weapon_Power: 42 } })]
    ], {}, ['Weapon Power 32', 'Weapon Power 42']],
    // As written: Spice0 is 0-based, and no offset is applied.
    ['R9 rawName number', [
      ['item:Spice0', item('Spice', { rawName: 'Spice0', category: 'SPICE' })],
      ['item:Spice6', item('Spice', { rawName: 'Spice6', category: 'SPICE' })]
    ], {}, ['#0', '#6']],
    ['R10 category plus number', [
      ['item:Trophy24', item('Nine_Dart_Finish', { rawName: 'Trophy24', category: 'TROPHY' })],
      ['item:TrophyReplica24', item('Nine_Dart_Finish', { rawName: 'TrophyReplica24', category: 'REPLICA_TROPHY' })],
      ['item:TrophyReplica25', item('Nine_Dart_Finish', { rawName: 'TrophyReplica25', category: 'REPLICA_TROPHY' })]
    ], {}, ['Trophy', 'Replica Trophy #24', 'Replica Trophy #25']]
  ])('%s', (unused, members, { edges, gemNames, extra } = {}, expected) => {
    expect(run(members, edges, gemNames, extra)).toEqual(members.map(([id], at) => [id, expected[at]]));
  });

  it('labels nothing in a group no rule separates, and reports it', () => {
    const nodes = {
      'item:A': { kind: 'item', rawName: 'A', name: 'Same', category: 'X', slug: 'a' },
      'item:B': { kind: 'item', rawName: 'B', name: 'Same', category: 'X', slug: 'b' }
    };
    expect(disambiguate(nodes, [], new Map()).unresolved).toEqual([['item:A', 'item:B']]);
    expect([labelOf(nodes['item:A']), labelOf(nodes['item:B'])]).toEqual([null, null]);
  });

  // The committed graph already carries labels once regenerated; a rebuild must not keep a stale one.
  it('clears a label left over from an earlier pass', () => {
    const nodes = { 'item:A': { kind: 'item', rawName: 'A', name: 'Alone', slug: 'a', disambig: '#1' } };
    disambiguate(nodes, [], new Map());
    expect(labelOf(nodes['item:A'])).toBe(null);
  });
});
