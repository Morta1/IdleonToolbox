import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { gatherEdges } from '../../scripts/entity-graph/edges/gathering.mjs';
import { ninjaHatEdges, randomEventEdges } from '../../scripts/entity-graph/edges/injected-drops.mjs';
import { talentLibraryEdges } from '../../scripts/entity-graph/edges/talent-library.mjs';
import { typeLabels } from '../../scripts/entity-graph/obtained-from-types.mjs';

const readJson = (name) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', name), 'utf-8'));
const items = readJson('items.json');
const monsters = readJson('monsters.json');
const randomList = readJson('randomList.json');
const sharedData = readJson('shared-data.json');
const compass = readJson('compass.json');

const pairs = (edges) => edges.map((edge) => `${edge.from} -> ${edge.to}`);

describe('gatherEdges', () => {
  const edges = gatherEdges(monsters, items);

  it('hands over the node\'s own item for mining, choppin and catching', () => {
    expect(edges).toContainEqual({ from: 'monster:Copper', to: 'item:Copper', rel: 'gathers', meta: { skill: 'Mining' }, source: 'gathering' });
    expect(pairs(edges)).toEqual(expect.arrayContaining([
      'monster:Tree7 -> item:Tree7',
      'monster:MotherlodeTREE -> item:MotherlodeTREE',
      'monster:Bug15 -> item:Bug15',
      'monster:Marble -> item:Marble'
    ]));
  });

  // Every node of the three skills has a same-named item. If a patch breaks that, a node starts
  // silently giving nothing, which is the case worth hearing about.
  it('finds an item for every mining, choppin and catching node', () => {
    const nodes = Object.entries(monsters)
      .filter(([, monster]) => ['MINING', 'CHOPPIN', 'CATCHING'].includes(monster.AFKtype) && monster.Name !== 'Error');
    expect(nodes.length).toBeGreaterThan(40);
    expect(edges.length).toBe(nodes.length);
  });

  it('never treats a fishing spot as its own fish', () => {
    expect(edges.some((edge) => edge.from === 'monster:FishSmall')).toBe(false);
  });

  it('reads the fish at each depth once FishPools is supplied', () => {
    const fishPools = { FishSmall: [['Fish1', 'Fish2', 'Fish3', 'Fish4']], MotherlodeFISH: [['Fish14', 'Fish14', 'Fish14', 'Fish14']] };
    const fishing = gatherEdges(monsters, items, fishPools).filter((edge) => edge.meta.skill === 'Fishing');
    expect(fishing).toContainEqual({ from: 'monster:FishSmall', to: 'item:Fish2', rel: 'gathers', meta: { skill: 'Fishing', depths: [2] }, source: 'gathering' });
    expect(fishing.filter((edge) => edge.to === 'item:Fish14')).toEqual([
      { from: 'monster:MotherlodeFISH', to: 'item:Fish14', rel: 'gathers', meta: { skill: 'Fishing', depths: [1, 2, 3, 4] }, source: 'gathering' }
    ]);
  });
});

describe('randomEventEdges', () => {
  const edges = randomEventEdges(randomList, monsters);

  it('gives each event boss its own loot list', () => {
    expect(pairs(edges)).toEqual([
      'monster:Meteor -> item:EquipmentHats78',
      'monster:Meteor -> item:EquipmentRingsChat10',
      'monster:rocky -> item:EquipmentToolsHatchet11',
      'monster:iceknight -> item:EquipmentHats79',
      'monster:iceknight -> item:ObolKnight',
      'monster:snakeZ -> item:EquipmentTools13',
      'monster:frogGR -> item:ObolFrog'
    ]);
  });

  it('only names real items', () => {
    expect(edges.every((edge) => items[edge.to.replace('item:', '')])).toBe(true);
  });
});

describe('ninjaHatEdges', () => {
  const edges = ninjaHatEdges(randomList, sharedData.ninjaEquipment, items, monsters);

  // The unlock text is the claim the edges rest on; if the upgrade is renamed or removed, so is it.
  it('rests on the Jade Emporium upgrade that unlocks the drops', () => {
    expect(sharedData.jadeUpgrades.some((upgrade) => upgrade.name === 'Mob_Cosplay_Craze')).toBe(true);
  });

  it('pairs all fifteen castle hats with a World 6 monster', () => {
    expect(edges).toHaveLength(15);
    expect(edges.every((edge) => /^monster:w6/.test(edge.from))).toBe(true);
    expect(pairs(edges)).toEqual(expect.arrayContaining([
      'monster:w6a1 -> item:EquipmentHats90',
      'monster:w6a1 -> item:EquipmentHats91',
      'monster:w6a2 -> item:EquipmentHats104'
    ]));
  });

  // The code picks the hat by arithmetic and this picks it by name: they must agree.
  it('reaches the same hats as the game\'s EquipmentHats 90 + index', () => {
    const byOrder = randomList[98].map((mob, index) => `monster:${mob} -> item:EquipmentHats${90 + index}`);
    expect(pairs(edges)).toEqual(byOrder);
  });
});

describe('talentLibraryEdges', () => {
  it('has the library hand out the four class books and not the special one', () => {
    const edges = talentLibraryEdges(sharedData.towers, items);
    expect(pairs(edges)).toEqual([
      'building:Talent_Book_Library -> item:TalentBook2',
      'building:Talent_Book_Library -> item:TalentBook3',
      'building:Talent_Book_Library -> item:TalentBook4',
      'building:Talent_Book_Library -> item:TalentBook5'
    ]);
    expect(edges.every((edge) => edge.rel === 'yields')).toBe(true);
  });

  it('says nothing once the building is gone', () => {
    expect(talentLibraryEdges({}, items)).toEqual([]);
  });
});

describe('typeLabels', () => {
  const labels = typeLabels(items, { mapNames: sharedData.mapNames, compass });

  it('reads the dungeon gear off its DUNGEON craft level', () => {
    expect(labels.get('DungEquipmentRings0')).toBe('Dungeon');
    expect(labels.get('FoodHealth3d')).toBe('Dungeon');
    expect(labels.get('Cash')).toBe('Dungeon');
    expect(labels.get('DungEnhancer2')).toBe('Dungeon');
    expect([...labels].filter(([, label]) => label === 'Dungeon').length).toBeGreaterThan(30);
  });

  it('does not call the dungeon key a dungeon drop', () => {
    expect(labels.has('Quest45')).toBe(false);
  });

  it('labels event boxes, candles and letters', () => {
    expect(labels.get('Quest109')).toBe('Event');
    expect(labels.get('Quest114')).toBe('Event');
    expect(labels.get('Quest39')).toBe('Event');
  });

  it('labels replica trophies the way replica nametags already are', () => {
    expect(labels.get('TrophyReplica1')).toBe('Spelunking');
  });

  it('labels the marbles of real worlds and skips the placeholder', () => {
    expect(labels.get('RGshard0')).toBe('Royal Guardian');
    expect(labels.get('RGshard6')).toBe('Royal Guardian');
    expect(labels.has('RGshard7')).toBe(false);
  });


  it('labels the Tempest gear its Compass upgrades unlock', () => {
    expect(labels.get('EquipmentBowsTempest0')).toBe('Compass');
    expect(labels.get('EquipmentRingsTempest8')).toBe('Compass');
    expect(labels.get('StoneTempestR2')).toBe('Compass');
  });

  it('drops a Tempest label once its upgrade is gone', () => {
    const withoutRings = Object.fromEntries(Object.entries(compass).filter(([, upgrade]) => upgrade?.name !== 'Ring_Drop'));
    const without = typeLabels(items, { mapNames: sharedData.mapNames, compass: withoutRings });
    expect(without.has('EquipmentRingsTempest0')).toBe(false);
    expect(without.get('EquipmentBowsTempest0')).toBe('Compass');
  });
});
