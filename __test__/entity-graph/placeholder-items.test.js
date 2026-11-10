import { describe, it, expect } from 'vitest';
import { isPlaceholderCard, isPlaceholderItem, itemNodes } from '../../scripts/entity-graph/nodes/items.mjs';
import { websiteData } from '../helpers/wiki-data.js';

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

  // TestObj1 is the real Wooden Spear: craftable and on The Slab, so the prefix alone proves nothing. A Filler name needs
  // the roster too (CraftMat3 stays), and the roster also holds legacy and premium items people really own (EquipmentHats33).
  it('hides a placeholder TestObj or Filler name on the not-findable roster, and nothing else', () => {
    expect(Object.values(nodes).filter((node) => node.navigable === false).map((node) => node.rawName).sort())
      .toEqual(['COIN', 'CraftMat15', 'TestObj2']);
    expect(Object.values(nodes).filter((node) => node.navigable !== false && node.navigable !== undefined)).toEqual([]);
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

// The game writes FILLER into a name it has not finished, and GemP14 is a dead copy of GemP10.
// Neither needs the not-findable roster to tell.
describe('unreleased items off the roster', () => {
  const nodes = itemNodes({
    Spelunking6: { displayName: "Chapter_Seven_'FILLER'", Type: 'SPELUNKY_PAGE' },
    GemP14: { displayName: 'Marvelous_Obol_Stack', Type: 'OBOL_STACK' },
    GemP10: { displayName: 'Marvelous_Obol_Stack', Type: 'OBOL_STACK' },
    Refiller: { displayName: 'Refiller', Type: 'MATERIAL' }
  });

  it('hides them, and only them', () => {
    expect(Object.values(nodes).filter((node) => node.navigable === false).map((node) => node.rawName))
      .toEqual(['COIN', 'Spelunking6', 'GemP14']);
  });
});

describe('placeholder cards', () => {
  const monsters = { frogBIG: { Name: 'Gigafrog' } };
  const cards = { frogBIG: { cardIndex: 'A9', effect: '+{%_Card_Drop_Chance', bonus: 5 } };
  const items = {
    CardsA9: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'frogBIG' },
    CardsD12: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: '_' },
    CardsC13: { displayName: 'DONTFILL', Type: 'CARD', desc_line1: 'CopperBar' },
    CopperBar: { displayName: 'Copper_Bar', Type: 'BAR' }
  };

  it('flags a card whose source names nothing', () => {
    expect(isPlaceholderCard('CardsD12', items.CardsD12, items, monsters)).toBe(true);
    expect(isPlaceholderCard('CardsC13', items.CardsC13, items, monsters)).toBe(false);
  });

  // CardsC13 names a real bar, but the card table has no row for it: no bonus, no slot in the book.
  it('hides a card the card table has no row for, and the one whose source names nothing', () => {
    const nodes = itemNodes(items, monsters, cards);
    expect(Object.values(nodes).filter((node) => node.navigable === false).map((node) => node.rawName))
      .toEqual(['COIN', 'CardsD12', 'CardsC13']);
  });

  it('says nothing about a card table it was not given', () => {
    expect(itemNodes({ CardsC13: items.CardsC13, CopperBar: items.CopperBar }, monsters)['item:CardsC13']).not.toHaveProperty('navigable');
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
  const { items, monsters, cards, stamps, randomList } = websiteData();
  const nodes = itemNodes(items, monsters, cards, stamps, new Map(), randomList);

  it('leaves no visible item under a copied proxy name', () => {
    const visibleStrung = Object.values(nodes).filter((node) => node.name === 'Strung_Jewels' && node.navigable !== false && node.category === 'SAIL_TREASURE');
    expect(visibleStrung).toEqual([]);
  });
});
