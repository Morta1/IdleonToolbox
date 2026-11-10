import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getObols } from '@parsers/obols';

describe('getObols', () => {
  it('never crashes when charItems is undefined on the character (non-account) path', () => {
    const result = getObols(undefined, false);
    expect(result.list).toEqual([]);
  });
});
