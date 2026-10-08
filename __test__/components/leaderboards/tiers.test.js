import { describe, expect, it } from 'vitest';
import { notateNumber } from '@utility/helpers';
import { nextRankText } from '@components/leaderboards/tiers';

const meta = { notation: 'default', maxed: false };

describe('nextRankText', () => {
  it('names leaders', () => {
    expect(nextRankText({ r: 1, v: 87, p: 0.1, t: 1 }, meta)).toBe('Leader');
    expect(nextRankText({ r: 1, v: 1, p: 5.6, t: 146 }, meta)).toBe('Tied leader');
  });

  it('says Maxed at the top of a maxed board', () => {
    expect(nextRankText({ r: 1, v: 612, p: 5.6, t: 146 }, { notation: 'default', maxed: true, top: 612 })).toBe('Maxed');
  });

  it('gives the step to the next tie group in the board notation', () => {
    expect(nextRankText({ r: 170, v: 240, p: 6.5, t: 1, nr: 169, nv: 241 }, meta)).toBe(`+${notateNumber(1)} to reach #169`);
  });

  it('switches to a multiplier for exponential values', () => {
    expect(nextRankText({ r: 4, v: 2e9, p: 0.2, t: 1, nr: 3, nv: 5.2e9 }, meta)).toBe('×2.6 to reach #3');
  });

  it('returns null without an entry', () => {
    expect(nextRankText(undefined, meta)).toBeNull();
  });
});
