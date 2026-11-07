import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getShops, parseShops } from '@parsers/shops';
import { shops } from '@website-data';
import { FIXTURES } from '../helpers/save-fixtures';

const SHOP_COUNT = Object.keys(shops).length;

describe('getShops', () => {
  it('returns one array per catalog shop, all empty, when the save is missing', () => {
    const result = getShops(undefined);
    expect(result).toHaveLength(SHOP_COUNT);
    expect(result.every((shop) => Array.isArray(shop) && shop.length === 0)).toBe(true);
  });

  it('does not fabricate stock for an individual missing shop (synthetic, unconditional)', () => {
    const shopsRaw = { 0: { 0: 5 } };
    const result = parseShops(shopsRaw);
    expect(result).toHaveLength(SHOP_COUNT);
    expect(result[1]).toEqual([]);
  });
});

describe('getShops fixture regression', () => {
  it.each(FIXTURES)('%s: never throws and always returns one array per catalog shop', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getShops(data);
    expect(result).toHaveLength(SHOP_COUNT);
    expect(result.every((shop) => Array.isArray(shop))).toBe(true);
  });
});
