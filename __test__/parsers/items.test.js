import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { findItemInInventory, findQuantityOwned } from '@parsers/items';

describe('findItemInInventory', () => {
  it('sums multiple stacks of the same item held by the same owner', () => {
    const items = [
      { name: 'Copper_Ore', owner: 'Storage', amount: 60e6 },
      { name: 'Copper_Ore', owner: 'Storage', amount: 1049e6 }
    ];
    expect(findItemInInventory(items, 'Copper_Ore')).toEqual({ Storage: { amount: 1109e6 } });
  });

  it('keeps stacks separated per owner', () => {
    const items = [
      { name: 'Copper_Ore', owner: 'Storage', amount: 100 },
      { name: 'Copper_Ore', owner: 'Bob', amount: 50 },
      { name: 'Copper_Ore', owner: 'Bob', amount: 25 }
    ];
    expect(findItemInInventory(items, 'Copper_Ore')).toEqual({
      Storage: { amount: 100 },
      Bob: { amount: 75 }
    });
  });

  it('counts stacks without an amount as one', () => {
    const items = [
      { name: 'Sword', owner: 'Bob' },
      { name: 'Sword', owner: 'Bob' }
    ];
    expect(findItemInInventory(items, 'Sword')).toEqual({ Bob: { amount: 2 } });
  });
});

describe('findQuantityOwned', () => {
  it('totals every stack across all owners', () => {
    const items = [
      { name: 'Copper_Ore', owner: 'Storage', amount: 60e6 },
      { name: 'Copper_Ore', owner: 'Storage', amount: 1049e6 },
      { name: 'Copper_Ore', owner: 'Bob', amount: 5 }
    ];
    expect(findQuantityOwned(items, 'Copper_Ore')).toEqual({
      amount: 1109e6 + 5,
      owner: ['Storage', 'Bob']
    });
  });
});
