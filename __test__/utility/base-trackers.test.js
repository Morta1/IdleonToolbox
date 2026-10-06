import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';

describe('baseTrackers', () => {
  it('is importable outside the page and keeps its shape', () => {
    expect(baseTrackers.version).toBe(82);
    expect(Object.keys(baseTrackers.account)).toEqual(
      ['General', 'World 1', 'World 2', 'World 3', 'World 4', 'World 5', 'World 6', 'World 7']);
    expect(baseTrackers.account['World 5'].hole.options.some(({ name }) => name === 'bellRenew')).toBe(true);
    expect(Object.keys(baseTrackers.characters)).toContain('anvil');
  });
});
