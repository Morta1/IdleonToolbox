import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getStorage } from '@parsers/storage';
import { liveCount } from '@parsers/catalog';
import { invStorage } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getStorage', () => {
  it('never crashes with no idleonData/account', () => {
    expect(() => getStorage(undefined, 'storage', undefined)).not.toThrow();
  });

  it('returns an empty inventory list (pure user state) when the save is missing', () => {
    const result = getStorage(undefined, 'storage', {});
    expect(result.list).toEqual([]);
  });

  it('returns every live storage chest (catalog-backed) when the save is missing', () => {
    const result = getStorage(undefined, 'storage', {});
    expect(result.storageChests).toHaveLength(liveCount(Object.values(invStorage)));
    expect(result.storageChests.every((c) => c.amount === 0 && c.unlocked === false)).toBe(true);
  });

  it('applies save quantities at the right index (synthetic, unconditional)', () => {
    const idleonData = { ChestOrder: ['Copper', 'Iron', 'Blank'], ChestQuantity: [100, 200, 0] };
    const result = getStorage(idleonData, 'storage', {});
    expect(result.list).toHaveLength(2); // 'Blank' is dropped
    expect(result.list[0].amount).toBe(100);
    expect(result.list[1].amount).toBe(200);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getStorage fixture regression', () => {
  it.each(FIXTURES)('%s: never throws and always returns the full storage-chest catalog', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getStorage(data, 'storage', {});
    expect(result.storageChests).toHaveLength(liveCount(Object.values(invStorage)));
  });

  it.each(FIXTURES)('%s: inventory quantities the save covers are unchanged', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const chestOrderRaw = tryToParse(data?.ChestOrder);
    const chestQuantityRaw = tryToParse(data?.ChestQuantity);
    const result = getStorage(data, 'storage', {});

    // getInventoryList drops Blank/LockedInvSpace slots, so the surviving list isn't index-aligned
    // with the raw arrays - rebuild the same filtered/positional pairing here instead.
    const expectedPairs = (chestOrderRaw ?? [])
      .map((itemName, index) => ({ itemName, amount: parseInt(chestQuantityRaw?.[index]) }))
      .filter(({ itemName }) => itemName !== 'LockedInvSpace' && itemName !== 'Blank');

    expect(result.list).toHaveLength(expectedPairs.length);
    expectedPairs.forEach(({ itemName, amount }, index) => {
      expect(result.list[index].rawName).toBe(itemName);
      expect(result.list[index].amount).toBe(amount);
    });
  });
});
