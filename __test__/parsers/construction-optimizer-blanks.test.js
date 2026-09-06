import '../../polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { optimizeArrayWithSwaps } from '@parsers/world-3/construction';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';

// A budgeted search scores a whole list of swaps at once, so one that drags an empty inventory slot
// onto the board can ride along with good swaps and still win on the total. The synthetic board in
// construction-optimizer.test.js never triggers it - it takes a real board, a wide budget, and this
// particular seed, which is exactly why the guard needs pinning here rather than left to chance.
const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// No character cap: emptying a slot to meet one is deliberate, so leaving it out keeps this about
// the search alone.
const run = () => {
  const { account, characters } = parseFixture(latest);
  const construction = account?.construction;
  return optimizeArrayWithSwaps(structuredClone(construction?.board ?? []), {
    stat: 'totalBuildRate',
    characters: characters?.map(({ name, constructionExpPerHour }) => ({ name, constructionExpPerHour })),
    spareCogs: structuredClone(construction?.spareCogs ?? []),
    multipliers: construction?.boardMultipliers,
    maxSwaps: 40,
    maxIterations: 60000
  });
};

beforeEach(() => vi.spyOn(Math, 'random').mockImplementation(seededRandom(5)));
afterEach(() => vi.restoreAllMocks());

describe('budgeted search on a real board', () => {
  it('leaves no slot emptier than it found it', () => {
    const { account } = parseFixture(latest);
    const before = (account?.construction?.board ?? []).filter(({ cog }) => !cog || cog.name === 'Blank').length;
    const after = run().board.filter(({ cog }) => !cog || cog.name === 'Blank').length;

    expect(after).toBeLessThanOrEqual(before);
  });

  it('never lists a move that brings a blank in from the inventory', () => {
    expect(run().moves.filter(({ fromSlot, name }) => fromSlot === null && name === 'Blank')).toEqual([]);
  });
});
