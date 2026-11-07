import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getObols } from '@parsers/obols';
import { FIXTURES } from '../helpers/save-fixtures';

describe('getObols', () => {
  it('returns an empty but complete shape with no save', () => {
    const result = getObols(undefined);
    expect(result).toEqual({ inventory: [], list: [], stats: expect.anything() });
  });

  it('never crashes when charItems is undefined on the character (non-account) path', () => {
    const result = getObols(undefined, false);
    expect(result.list).toEqual([]);
  });
});

describe('getObols fixture regression', () => {
  it.each(FIXTURES)('%s: does not throw and returns the standard shape', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(getObols(data)).toEqual({ inventory: expect.any(Array), list: expect.any(Array), stats: expect.anything() });
  });
});
