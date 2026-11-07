import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getStorage } from '@parsers/storage';
import { liveCount } from '@parsers/catalog';
import { invStorage } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { FIXTURES } from '../helpers/save-fixtures';

describe('getStorage', () => {
  it('returns every live storage chest and an empty inventory when the save is missing', () => {
    const result = getStorage(undefined, 'storage', {});
    expect(result.list).toEqual([]);
    expect(result.storageChests).toHaveLength(liveCount(Object.values(invStorage)));
    expect(result.storageChests.every((c) => c.amount === 0 && c.unlocked === false)).toBe(true);
    expect(getStorage(undefined, 'storage', undefined).storageChests).toHaveLength(liveCount(Object.values(invStorage)));
  });

  it('applies save quantities at the right index (synthetic, unconditional)', () => {
    const idleonData = { ChestOrder: ['Copper', 'Iron', 'Blank'], ChestQuantity: [100, 200, 0] };
    const result = getStorage(idleonData, 'storage', {});
    expect(result.list).toHaveLength(2); // 'Blank' is dropped
    expect(result.list[0].amount).toBe(100);
    expect(result.list[1].amount).toBe(200);
  });
});

describe('getStorage fixture regression', () => {
  it.each(FIXTURES)('%s: inventory quantities read from the save, beside the full chest catalog', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const chestOrderRaw = tryToParse(data?.ChestOrder);
    const chestQuantityRaw = tryToParse(data?.ChestQuantity);
    const result = getStorage(data, 'storage', {});

    expect(result.storageChests).toHaveLength(liveCount(Object.values(invStorage)));
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
