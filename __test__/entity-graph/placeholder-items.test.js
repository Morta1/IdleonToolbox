import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { isPlaceholderItem, itemNodes } from '../../scripts/entity-graph/nodes/items.mjs';

// randomList is positional: only index 17, the game's not-findable roster, matters here.
const rosterOf = (rawNames) => Object.assign([], { 17: rawNames });

describe('placeholder items', () => {
  const items = {
    TestObj1: { displayName: 'Wooden_Spear', Type: 'SPEAR' },
    TestObj2: { displayName: 'Steel_Spear', Type: 'SPEAR' },
    CraftMat15: { displayName: 'Filler', Type: 'MATERIAL' },
    CraftMat3: { displayName: 'Filler', Type: 'MATERIAL' },
    EquipmentHats33: { displayName: 'Paper_Bag', Type: 'PREMIUM_HELMET' }
  };
  const nodes = itemNodes(items, {}, {}, {}, new Map(), rosterOf(['TestObj2', 'CraftMat15', 'EquipmentHats33']));

  it('hides a TestObj the game leaves off The Slab', () => {
    expect(nodes['item:TestObj2'].navigable).toBe(false);
  });

  // TestObj1 is the real Wooden Spear: craftable and on The Slab, so the prefix alone proves nothing.
  it('keeps a TestObj the game counts as findable', () => {
    expect(nodes['item:TestObj1']).not.toHaveProperty('navigable');
  });

  it('hides a never-filled-in name on the not-findable roster', () => {
    expect(nodes['item:CraftMat15'].navigable).toBe(false);
  });

  it('needs both signals: a placeholder name outside the roster stays', () => {
    expect(nodes['item:CraftMat3']).not.toHaveProperty('navigable');
  });

  // The roster also holds legacy and premium items people really own.
  it('keeps a real item that merely sits on the roster', () => {
    expect(nodes['item:EquipmentHats33']).not.toHaveProperty('navigable');
  });

  it('hides nothing when no roster is passed', () => {
    const bare = itemNodes(items);
    expect(Object.values(bare).filter((node) => node.navigable === false).map((node) => node.rawName)).toEqual(['COIN']);
  });

  it('decides from roster membership, not the rawName alone', () => {
    expect(isPlaceholderItem('TestObj2', items.TestObj2, new Set(['TestObj2']))).toBe(true);
    expect(isPlaceholderItem('TestObj2', items.TestObj2, new Set())).toBe(false);
  });
});

describe('proxy cost items', () => {
  const template = { displayName: 'Strung_Jewels', Type: 'SAIL_TREASURE', desc_line1: 'Sail_Treasure', sellPrice: 1 };
  const nodes = itemNodes({
    SailTr1: template,
    W6item0: { ...template, displayName: 'Error_Item' },
    W6item1: template,
    W6item6: template,
    W7item2: template,
    Quest66: { displayName: 'Strung_Jewels', Type: 'LAB_ADDITION' }
  });

  it('names each proxy for the count it stands in for, not the copied template', () => {
    expect(nodes['item:SailTr1'].name).toBe('Sailing_Treasure_1');
    expect(nodes['item:W6item0'].name).toBe('Jade_Coins');
    expect(nodes['item:W6item1'].name).toBe('Farming_Crop_4');
    expect(nodes['item:W6item6'].name).toBe('White_Essence');
    expect(nodes['item:W7item2'].name).toBe('Spelunking_Resource_2');
  });

  it('gives a proxy no page, the bubble sprite, and no template description', () => {
    expect(nodes['item:SailTr1']).toMatchObject({ navigable: false, icon: '/data/SailTr1_x1.png', description: null });
  });

  it('leaves the real Strung Jewels alone', () => {
    expect(nodes['item:Quest66'].name).toBe('Strung_Jewels');
    expect(nodes['item:Quest66']).not.toHaveProperty('navigable');
  });
});

describe('against the shipped game data', () => {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'website-data', name), 'utf-8'));
  const items = read('items.json');
  const nodes = itemNodes(items, read('monsters.json'), read('cards.json'), read('stamps.json'), new Map(), read('randomList.json'));
  const hidden = (rawName) => nodes[`item:${rawName}`]?.navigable === false;

  it('keeps the TestObj items that are craftable and on The Slab', () => {
    for (const rawName of ['TestObj1', 'TestObj3', 'TestObj7', 'TestObj13']) expect(hidden(rawName), rawName).toBe(false);
  });

  it('hides the TestObj items with no source and no use', () => {
    for (const rawName of ['TestObj2', 'TestObj4', 'TestObj5', 'TestObj8', 'TestObj9', 'TestObj10', 'TestObj14', 'TestObj15', 'TestObj16']) {
      expect(hidden(rawName), rawName).toBe(true);
    }
  });

  it('leaves no visible item under a copied proxy name', () => {
    const visibleStrung = Object.values(nodes).filter((node) => node.name === 'Strung_Jewels' && node.navigable !== false && node.category === 'SAIL_TREASURE');
    expect(visibleStrung).toEqual([]);
  });
});
