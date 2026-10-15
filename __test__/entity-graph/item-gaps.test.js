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
  const edges = randomEventEdges(randomList, monsters, { wikiTables: readJson('wikiTables.json') });

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
  const edges = ninjaHatEdges(randomList, sharedData.ninjaEquipment, items, monsters, { wikiTables: readJson('wikiTables.json') });

  // The code picks the hat by arithmetic and this picks it by name: they must agree.
  it('reaches the same hats as the game\'s EquipmentHats 90 + index', () => {
    const byOrder = randomList[98].map((mob, index) => `monster:${mob} -> item:EquipmentHats${90 + index}`);
    expect(pairs(edges)).toEqual(byOrder);
  });
});

describe('talentLibraryEdges', () => {
  it('has the library hand out the four class books and not the special one', () => {
    const edges = talentLibraryEdges(sharedData.towers, items, { wikiTables: readJson('wikiTables.json') });
    expect(pairs(edges)).toEqual([
      'building:Talent_Book_Library -> item:TalentBook2',
      'building:Talent_Book_Library -> item:TalentBook3',
      'building:Talent_Book_Library -> item:TalentBook4',
      'building:Talent_Book_Library -> item:TalentBook5'
    ]);
    expect(edges.every((edge) => edge.rel === 'yields')).toBe(true);
  });

  it('says nothing once the building is gone', () => {
    expect(talentLibraryEdges({}, items, { wikiTables: readJson('wikiTables.json') })).toEqual([]);
  });
});

describe('typeLabels', () => {
  const options = { mapNames: sharedData.mapNames };
  const withoutRings = Object.fromEntries(Object.entries(compass).filter(([, upgrade]) => upgrade?.name !== 'Ring_Drop'));
  const labelSets = {
    full: typeLabels(items, { ...options, compass }),
    // A Tempest label rests on its Compass upgrade, so it goes when the upgrade does.
    withoutRingDrop: typeLabels(items, { ...options, compass: withoutRings })
  };

  it.each([
    // Dungeon gear is read off its DUNGEON craft level; the dungeon key is not a dungeon drop.
    ['full', 'DungEquipmentRings0', 'Dungeon'],
    ['full', 'FoodHealth3d', 'Dungeon'],
    ['full', 'Cash', 'Dungeon'],
    ['full', 'DungEnhancer2', 'Dungeon'],
    ['full', 'Quest45', undefined],
    // Event boxes, candles and letters.
    ['full', 'Quest109', 'Event'],
    ['full', 'Quest114', 'Event'],
    ['full', 'Quest39', 'Event'],
    // Replica trophies, the way replica nametags already are.
    ['full', 'TrophyReplica1', 'Spelunking'],
    // The marbles of real worlds, skipping the placeholder.
    ['full', 'RGshard0', 'Royal Guardian'],
    ['full', 'RGshard6', 'Royal Guardian'],
    ['full', 'RGshard7', undefined],
    ['full', 'EquipmentBowsTempest0', 'Compass'],
    ['full', 'EquipmentRingsTempest8', 'Compass'],
    ['full', 'StoneTempestR2', 'Compass'],
    ['withoutRingDrop', 'EquipmentRingsTempest0', undefined],
    ['withoutRingDrop', 'EquipmentBowsTempest0', 'Compass']
  ])('%s: labels %s as %s', (set, rawName, label) => {
    expect(labelSets[set].get(rawName)).toBe(label);
  });
});
