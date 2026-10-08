import { describe, expect, it } from 'vitest';
import { bestInSection, countStanding, withinReach } from '@components/leaderboards/standing';

const index = { byKey: { logBook: { maxed: true }, mining: { maxed: false }, farming: {}, cooking: {}, bits: {} } };
const ranks = {
  logBook: { r: 1, v: 100, p: 5.6, t: 146 },
  mining: { r: 1, v: 304, p: 0.1, t: 1 },
  farming: { r: 24, v: 900, p: 1, t: 1, nr: 23, nv: 910 },
  cooking: { r: 80, v: 50, p: 3.1, t: 2, nr: 78, nv: 100 },
  bits: { r: 300, v: 1e9, p: 11.5, t: 1, nr: 299, nv: 1.001e9 }
};

describe('countStanding', () => {
  it('counts first places without maxed boards, and top 25 / top 100 by rank', () => {
    expect(countStanding(ranks, index)).toEqual({ firsts: 1, top25: 3, top100: 4 });
    expect(countStanding(undefined, index)).toEqual({ firsts: 0, top25: 0, top100: 0 });
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
