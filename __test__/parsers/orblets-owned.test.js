import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import raw from '../fixtures/multikill-pin.json';
import { calcTotalItemOwned } from '@parsers/storage';

// The Orb drops Orblets on the ground and the pickup handler (ItemPickupInTheFirstPlace) has no
// special case for them, so they land in the active character's InventoryOrder like any other
// item and only reach the Storage Chest when the player deposits them. The game's own balance
// (_ItemsAndStorageOWNED.h.Orblet) is inventory + chest; counting the chest alone read 0 for
// anyone still farming (Discord bug 1547182834463146005).
const CHEST_ORBLETS = 342;

// Deep-copies the pinned save and moves `amount` Orblets out of the chest into one character's
// first free inventory slot; the rest stay in the chest.
const withOrbletsInInventory = (charIndex, amount) => {
  const fixture = JSON.parse(JSON.stringify(raw));
  const data = fixture.data;
  const chestSlot = data.ChestOrder.indexOf('Orblet');
  data.ChestQuantity[chestSlot] -= amount;
  if (data.ChestQuantity[chestSlot] === 0) {
    data.ChestOrder[chestSlot] = 'Blank';
  }
  const inventory = data[`InventoryOrder_${charIndex}`];
  const freeSlot = inventory.indexOf('Blank');
  inventory[freeSlot] = 'Orblet';
  data[`ItemQTY_${charIndex}`][freeSlot] = amount;
  return fixture;
};

describe('royalGuardian.orblets counts chest + character inventories', () => {
  it('reads the chest when that is where the Orblets are', () => {
    const { account } = parseFixture(raw);
    expect(account.royalGuardian.orblets).toBe(CHEST_ORBLETS);
  });

  it('still sees Orblets that were never deposited', () => {
    const { account } = parseFixture(withOrbletsInInventory(0, CHEST_ORBLETS));
    expect(account.royalGuardian.orblets).toBe(CHEST_ORBLETS);
  });

  it('sums a partial deposit with what is left on the character', () => {
    const { account } = parseFixture(withOrbletsInInventory(3, 100));
    expect(account.royalGuardian.orblets).toBe(CHEST_ORBLETS);
  });
});

describe('calcTotalItemOwned', () => {
  const storage = { list: [{ rawName: 'Orblet', amount: 5 }, { rawName: 'Copper', amount: 9 }] };
  const characters = [
    { inventory: [{ rawName: 'Orblet', amount: 2 }] },
    { inventory: [{ rawName: 'Orblet', amount: 3 }, { rawName: 'Orblet', amount: 1 }] },
    { inventory: undefined }
  ];

  it('adds every character inventory to the chest', () => {
    expect(calcTotalItemOwned(storage, characters, 'Orblet')).toBe(11);
  });

  it('tolerates a missing chest or character list', () => {
    expect(calcTotalItemOwned(undefined, characters, 'Orblet')).toBe(6);
    expect(calcTotalItemOwned(storage, undefined, 'Orblet')).toBe(5);
    expect(calcTotalItemOwned(undefined, undefined, 'Orblet')).toBe(0);
  });
});
