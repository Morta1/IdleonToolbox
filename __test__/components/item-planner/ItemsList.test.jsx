import '../../../polyfills';
import { describe, expect, it } from 'vitest';
import { crafts } from '@website-data';
import { flattenCraftObject } from '@parsers/items';
import { getOwnedEquipCredits, mapItems } from '@components/tools/item-planner/ItemsList';

// Militia_Helm -> Copper_Helmet (Equip, itself crafted from 20 Copper_Ore + 40 Bean_Slices)
// + 15 Iron_Bar + 80 Copper_Ore. Flattened: Copper_Ore 100, Bean_Slices 40, Copper_Helmet 1,
// Iron_Bar 15.
const militiaMaterials = flattenCraftObject(crafts['Militia_Helm']);
const scale = (materials, copies) => materials.map((item) => ({ ...item, itemQuantity: item.itemQuantity * copies }));
const owned = (name, amount, owner = 'Bob') => ({ name, owner, amount });
const names = (categorized) => Object.fromEntries(Object.entries(categorized)
  .map(([subType, items]) => [subType, items.map(({ itemName, itemQuantity, quantityOwned }) => [itemName,
    itemQuantity, quantityOwned])]));

describe('flattened Militia_Helm fixture', () => {
  it('matches the shape the tests below assume', () => {
    expect(militiaMaterials.map(({ itemName, itemQuantity, subType, type }) => [itemName, itemQuantity, subType,
      type])).toEqual([
      ['Copper_Ore', 100, 'ORE', 'Consumable'],
      ['Bean_Slices', 40, 'MONSTER_DROP', 'Quest'],
      ['Copper_Helmet', 1, 'HELMET', 'Equip'],
      ['Iron_Bar', 15, 'BAR', 'Item']
    ]);
  });
});

describe('getOwnedEquipCredits', () => {
  it('credits the sub-materials of an owned equip', () => {
    expect(getOwnedEquipCredits(militiaMaterials, [owned('Copper_Helmet', 1)]))
      .toEqual({ Copper_Ore: 20, Bean_Slices: 40 });
  });

  it('ignores equips you do not own', () => {
    expect(getOwnedEquipCredits(militiaMaterials, [owned('Copper_Ore', 999)])).toEqual({});
  });

  it('caps the credit at the number of copies actually required', () => {
    // 5 spare Copper_Helmets but only 1 is needed -> credit for exactly 1 copy
    expect(getOwnedEquipCredits(militiaMaterials, [owned('Copper_Helmet', 5)]))
      .toEqual({ Copper_Ore: 20, Bean_Slices: 40 });
  });

  it('scales the credit with the number of owned copies', () => {
    expect(getOwnedEquipCredits(scale(militiaMaterials, 3), [owned('Copper_Helmet', 2)]))
      .toEqual({ Copper_Ore: 40, Bean_Slices: 80 });
  });

  it('sums stacks of the same equip across owners', () => {
    expect(getOwnedEquipCredits(scale(militiaMaterials, 2), [owned('Copper_Helmet', 1, 'Bob'),
      owned('Copper_Helmet', 1, 'Storage')])).toEqual({ Copper_Ore: 40, Bean_Slices: 80 });
  });

  it('returns nothing for an equip with no craft recipe', () => {
    expect(getOwnedEquipCredits([{ itemName: 'Not_A_Craft', type: 'Equip', subType: 'HELMET', itemQuantity: 1 }],
      [owned('Not_A_Craft', 1)])).toEqual({});
  });

  it('handles empty and missing input', () => {
    expect(getOwnedEquipCredits([], [])).toEqual({});
    expect(getOwnedEquipCredits(undefined, undefined)).toEqual({});
  });
});

describe('mapItems - show missing items', () => {
  it('keeps materials you are still short on when an intermediate equip is owned', () => {
    // The reported bug: with "Include Equipped Items" on, owning the intermediate Copper_Helmet
    // wiped Copper_Ore and Bean_Slices out of the missing list entirely.
    expect(names(mapItems(militiaMaterials, '0', [owned('Copper_Helmet', 1)]))).toEqual({
      ORE: [['Copper_Ore', 80, 0]],
      BAR: [['Iron_Bar', 15, 0]]
    });
  });

  it('shows every material at full cost when nothing is owned', () => {
    expect(names(mapItems(militiaMaterials, '0', []))).toEqual({
      ORE: [['Copper_Ore', 100, 0]],
      MONSTER_DROP: [['Bean_Slices', 40, 0]],
      HELMET: [['Copper_Helmet', 1, 0]],
      BAR: [['Iron_Bar', 15, 0]]
    });
  });

  it('produces the same list whether the equip is counted as equipped or not, minus its own cost', () => {
    // "Include Equipped Items" off -> the helmet is missing too, and nothing is credited.
    const withoutEquipped = names(mapItems(militiaMaterials, '0', []));
    const withEquipped = names(mapItems(militiaMaterials, '0', [owned('Copper_Helmet', 1)]));
    // Every category still present in the "off" view stays reachable in the "on" view unless it
    // is genuinely fully covered.
    expect(withoutEquipped.ORE).toBeDefined();
    expect(withEquipped.ORE).toBeDefined();
    expect(withEquipped.BAR).toEqual(withoutEquipped.BAR);
  });

  it('hides a material once the credit covers it fully', () => {
    const result = mapItems(militiaMaterials, '0', [owned('Copper_Helmet', 1)]);
    expect(result.MONSTER_DROP).toBeUndefined();
  });

  it('hides an item you already own enough of', () => {
    const result = mapItems(militiaMaterials, '0', [owned('Iron_Bar', 15)]);
    expect(result.BAR).toBeUndefined();
  });

  it('shows partial ownership as owned/required', () => {
    expect(names(mapItems(militiaMaterials, '0', [owned('Iron_Bar', 5)])).BAR).toEqual([['Iron_Bar', 15, 5]]);
  });

  it('shows a partially owned equip as owned/required instead of 0/remaining', () => {
    expect(names(mapItems(scale(militiaMaterials, 3), '0', [owned('Copper_Helmet', 1)])).HELMET)
      .toEqual([['Copper_Helmet', 3, 1]]);
  });

  it('reduces requirements proportionally for multi-copy crafts', () => {
    // 3 Militia_Helms wanted, 1 Copper_Helmet in hand -> one copy's worth of mats comes off.
    expect(names(mapItems(scale(militiaMaterials, 3), '0', [owned('Copper_Helmet', 1)]))).toEqual({
      ORE: [['Copper_Ore', 280, 0]],
      MONSTER_DROP: [['Bean_Slices', 80, 0]],
      HELMET: [['Copper_Helmet', 3, 1]],
      BAR: [['Iron_Bar', 45, 0]]
    });
  });

  it('does not depend on where the equip sits in the list', () => {
    const reordered = [...militiaMaterials].reverse();
    const inventory = [owned('Copper_Helmet', 1)];
    const fromReordered = names(mapItems(reordered, '0', inventory));
    const fromOriginal = names(mapItems(militiaMaterials, '0', inventory));
    expect(fromReordered).toEqual(fromOriginal);
  });

  it('composes credits down a chain of owned equips', () => {
    // Need 2 Militia_Helms; own 1 finished Militia_Helm and 1 spare Copper_Helmet.
    const list = [...scale(militiaMaterials, 2),
      { ...crafts['Militia_Helm'], itemQuantity: 2, materials: undefined }];
    const result = names(mapItems(list, '0', [owned('Militia_Helm', 1), owned('Copper_Helmet', 1)]));
    // One helm left to build: its Copper_Helmet is covered by the spare, leaving 80 direct ore
    // and 15 iron bars.
    expect(result.ORE).toEqual([['Copper_Ore', 80, 0]]);
    expect(result.BAR).toEqual([['Iron_Bar', 15, 0]]);
    expect(result.MONSTER_DROP).toBeUndefined();
    expect(result.HELMET).toEqual([['Militia_Helm', 2, 1]]);
  });

  it('never drops an item it does not fully cover', () => {
    const inventory = [owned('Copper_Helmet', 1)];
    const credits = getOwnedEquipCredits(militiaMaterials, inventory);
    const result = mapItems(militiaMaterials, '0', inventory);
    const shown = Object.values(result).flat().map(({ itemName }) => itemName);
    militiaMaterials.forEach(({ itemName, itemQuantity }) => {
      const stillNeeded = itemQuantity - (credits[itemName] ?? 0) -
        (itemName === 'Copper_Helmet' ? 1 : 0);
      if (stillNeeded > 0) expect(shown).toContain(itemName);
    });
  });

  it('reads flurbos off the account instead of the inventory', () => {
    const list = [{ itemName: 'Dungeon_Credits_Flurbo_Edition', subType: 'CURRENCY', type: 'Item', itemQuantity: 100 }];
    expect(names(mapItems(list, '0', [], { dungeons: { flurbos: 40 } })).CURRENCY)
      .toEqual([['Dungeon_Credits_Flurbo_Edition', 100, 40]]);
    expect(mapItems(list, '0', [], { dungeons: { flurbos: 100 } }).CURRENCY).toBeUndefined();
    expect(names(mapItems(list, '0', [], undefined)).CURRENCY)
      .toEqual([['Dungeon_Credits_Flurbo_Edition', 100, 0]]);
  });
});

describe('mapItems - show all items', () => {
  it('lists everything at full quantity, credits included or not', () => {
    const all = names(mapItems(militiaMaterials, '1', [owned('Copper_Helmet', 1)]));
    expect(all).toEqual({
      ORE: [['Copper_Ore', 100, 0]],
      MONSTER_DROP: [['Bean_Slices', 40, 0]],
      HELMET: [['Copper_Helmet', 1, 1]],
      BAR: [['Iron_Bar', 15, 0]]
    });
  });

  it('keeps items you already own', () => {
    const all = mapItems(militiaMaterials, '1', [owned('Iron_Bar', 999)]);
    expect(all.BAR).toHaveLength(1);
  });

  it('reads flurbos off the account', () => {
    const list = [{ itemName: 'Dungeon_Credits_Flurbo_Edition', subType: 'CURRENCY', type: 'Item', itemQuantity: 100 }];
    expect(names(mapItems(list, '1', [], { dungeons: { flurbos: 7 } })).CURRENCY)
      .toEqual([['Dungeon_Credits_Flurbo_Edition', 100, 7]]);
  });
});

describe('mapItems - edge cases', () => {
  it('returns an empty map for an unknown display mode', () => {
    expect(mapItems(militiaMaterials, '2', [])).toEqual({});
  });

  it('returns an empty map for empty or missing lists', () => {
    expect(mapItems([], '0', [])).toEqual({});
    expect(mapItems(undefined, '0', [])).toEqual({});
    expect(mapItems(undefined, '1', undefined, undefined)).toEqual({});
  });

  it('never emits a null or undefined category value', () => {
    ['0', '1'].forEach((display) => {
      Object.values(mapItems(militiaMaterials, display, [owned('Copper_Helmet', 1)]))
        .forEach((items) => expect(Array.isArray(items)).toBe(true));
    });
  });
});
