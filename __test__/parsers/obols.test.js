import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getObols } from '@parsers/obols';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getObols', () => {
  it('returns an empty but complete shape with no save', () => {
    const result = getObols(undefined);
    expect(result).toEqual({ inventory: [], list: [], stats: expect.anything() });
  });

  it('never crashes when charItems is undefined on the character (non-account) path', () => {
    // Regression: obolsMapping derives from `obolsRaw?.map(...)`, which is undefined when there is
    // no save at all, so createObolsWithUpgrades used to call `.reduce` on `undefined` and crash.
    // `account = false` exercises the character-level branch (different raw-key reads and the
    // `calculateWeirdObolIndex` remapping) rather than repeating the default `account = true` path
    // the previous test already covers.
    const result = getObols(undefined, false);
    expect(result.list).toEqual([]);
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getObols fixture regression', () => {
  it.each(FIXTURES)('%s: does not throw and returns the standard shape', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getObols(data);
    expect(result).toHaveProperty('inventory');
    expect(result).toHaveProperty('list');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.list)).toBe(true);
  });
});
