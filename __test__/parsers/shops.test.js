import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseShops } from '@parsers/shops';
import { shops } from '@website-data';

describe('parseShops', () => {
  it('does not fabricate stock for an individual missing shop (synthetic, unconditional)', () => {
    const shopsRaw = { 0: { 0: 5 } };
    const result = parseShops(shopsRaw);
    expect(result).toHaveLength(Object.keys(shops).length);
    expect(result[1]).toEqual([]);
  });
});
