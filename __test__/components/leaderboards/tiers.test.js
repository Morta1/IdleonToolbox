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

  it('shows the gap, not x1, when a large value is nearly tied', () => {
    expect(nextRankText({ r: 299, v: 1e9, p: 11.5, t: 1, nr: 298, nv: 1.001e9 }, meta)).toBe(`+${notateNumber(1e6)} to reach #298`);
  });

  it('returns null without an entry', () => {
    expect(nextRankText(undefined, meta)).toBeNull();
  });
});

describe('nextRankText small steps', () => {
  it('never shows a positive step as +0', () => {
    expect(nextRankText({ r: 9, v: 100.3, p: 1, t: 1, nr: 8, nv: 100.7 }, meta)).toBe('+0.4 to reach #8');
    expect(nextRankText({ r: 9, v: 10, p: 1, t: 1, nr: 8, nv: 10.04 }, meta)).toBe('+0.04 to reach #8');
  });

  it('keeps the points unit on a fractional points gap', () => {
    expect(nextRankText({ r: 91, v: 15313, p: 3.5, t: 1, nr: 90, nv: 15314.8 }, { notation: 'points' })).toBe('+1.8 pts to reach #90');
  });
});
