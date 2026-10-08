import { describe, expect, it } from 'vitest';
import { bestInSection, countAtMax, countStanding, medianRank, topPercentLabel, withinReach } from '@components/leaderboards/standing';

const index = { byKey: { logBook: { maxed: true, top: 100 }, mining: { maxed: false }, farming: {}, cooking: {}, bits: {} } };
const ranks = {
  logBook: { r: 1, v: 100, p: 5.6, t: 146 },
  mining: { r: 1, v: 304, p: 0.1, t: 1 },
  farming: { r: 24, v: 900, p: 1, t: 1, nr: 23, nv: 910 },
  cooking: { r: 80, v: 50, p: 3.1, t: 2, nr: 78, nv: 100 },
  bits: { r: 300, v: 1e9, p: 11.5, t: 1, nr: 299, nv: 1.001e9 }
};

describe('countStanding', () => {
  it('counts first places without maxed boards, and top 25 / top 100 by rank', () => {
    expect(countStanding(ranks, index)).toEqual({ firsts: 1, top25: 2, top100: 3 });
    expect(countStanding(undefined, index)).toEqual({ firsts: 0, top25: 0, top100: 0 });
  });

  it('counts a maxed board by rank while the player is still short of the max', () => {
    const short = { logBook: { r: 12, v: 90, p: 1, t: 1 } };
    expect(countStanding(short, index)).toEqual({ firsts: 0, top25: 1, top100: 1 });
  });
});

describe('withinReach', () => {
  it('orders by the relative step to the next rank, skipping rank 1 and maxed boards', () => {
    expect(withinReach(ranks, index).map((e) => e.key)).toEqual(['bits', 'farming', 'cooking']);
    expect(withinReach(ranks, index, 1)[0]).toMatchObject({ key: 'bits', nr: 299 });
  });
});

describe('bestInSection', () => {
  it('picks the lowest top percent, then rank', () => {
    expect(bestInSection(['farming', 'cooking', 'smithing'], ranks)).toMatchObject({ key: 'farming', r: 24 });
    expect(bestInSection(['smithing'], ranks)).toBeNull();
  });
});

describe('countAtMax', () => {
  const maxedIndex = { byKey: { logBook: { maxed: true, top: 100 }, shiny: { maxed: true, top: 1360 }, mining: { maxed: false, top: 304 } } };

  it('counts only maxed boards where the player holds the max', () => {
    const mine = { logBook: { v: 100 }, shiny: { v: 1300 }, mining: { v: 304 } };
    expect(countAtMax(['logBook', 'shiny', 'mining'], mine, maxedIndex)).toBe(1);
    expect(countAtMax(['logBook', 'shiny'], undefined, maxedIndex)).toBe(0);
  });
});

describe('medianRank', () => {
  const r = (...ranksList) => Object.fromEntries(ranksList.map((rank, i) => [`k${i}`, { r: rank }]));
  const keys = ['k0', 'k1', 'k2', 'k3', 'missing'];

  it('takes the middle rank of the boards the player has', () => {
    expect(medianRank(keys, r(30, 5, 100))).toBe(30);
  });

  it('averages the two middle ranks of an even count, rounded', () => {
    expect(medianRank(keys, r(5, 8, 20, 100))).toBe(14);
    expect(medianRank(keys, r(1, 2))).toBe(2);
  });

  it('is null without any board', () => {
    expect(medianRank(keys, undefined)).toBeNull();
    expect(medianRank(keys, {})).toBeNull();
  });
});

describe('topPercentLabel', () => {
  it('shows the upper half only', () => {
    expect(topPercentLabel(3.5)).toBe('top 3.5%');
    expect(topPercentLabel(50)).toBe('top 50%');
    expect(topPercentLabel(50.1)).toBeNull();
    expect(topPercentLabel(undefined)).toBeNull();
  });
});
