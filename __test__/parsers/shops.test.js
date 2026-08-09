import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getShops, parseShops } from '@parsers/shops';
import { shops } from '@website-data';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const SHOP_COUNT = Object.keys(shops).length;

describe('getShops', () => {
  it('never crashes with no idleonData', () => {
    expect(() => getShops(undefined)).not.toThrow();
  });

  it('returns one array per catalog shop, all empty, when the save is missing', () => {
    // Classification: `shops[i].items` is a catalog, but "in stock now" (amount) is live/server
    // state that no catalog can supply - unlike prayers/compass, this does NOT fabricate stocked
    // items at amount 0. It only guarantees the correct shop count instead of crashing/collapsing.
    const result = getShops(undefined);
    expect(result).toHaveLength(SHOP_COUNT);
    expect(result.every((shop) => Array.isArray(shop) && shop.length === 0)).toBe(true);
  });

  it('does not fabricate stock for an individual missing shop (synthetic, unconditional)', () => {
    // Shop 0 has real stock, shop 1 is entirely absent from the raw save (e.g. not yet visited).
    const shopsRaw = { 0: { 0: 5 } };
    const result = parseShops(shopsRaw);
    expect(result).toHaveLength(SHOP_COUNT);
    expect(result[1]).toEqual([]);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getShops fixture regression', () => {
  it.each(FIXTURES)('%s: never throws and always returns one array per catalog shop', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getShops(data);
    expect(result).toHaveLength(SHOP_COUNT);
    expect(result.every((shop) => Array.isArray(shop))).toBe(true);
  });
});
