import { describe, expect, it } from 'vitest';
import { highestArcaneMapMulti, outpostInfo } from '../../services/leaderboardMasterclass';

describe('outpostInfo', () => {
  it('counts outposts and takes the best rate', () => {
    expect(outpostInfo([{ resourceRate: 4 }, { resourceRate: 9.5 }, { resourceRate: NaN }]))
      .toEqual({ totalOutposts: 3, highestOutpostResourceRate: 9.5 });
  });

  it('treats a non-finite rate as zero', () => {
    expect(outpostInfo([{ resourceRate: Infinity }])).toEqual({ totalOutposts: 1, highestOutpostResourceRate: 0 });
  });

  it('is zero without a Royal Guardian', () => {
    expect(outpostInfo(undefined)).toEqual({ totalOutposts: 0, highestOutpostResourceRate: 0 });
    expect(outpostInfo([])).toEqual({ totalOutposts: 0, highestOutpostResourceRate: 0 });
  });
});

describe('highestArcaneMapMulti', () => {
  it('returns the best map bonus across characters as a display factor', () => {
    const first = [{ mapBonuses: [{ value: 50 }, { value: 120 }, { value: 0 }] }, { mapBonuses: [{ value: 80 }] }];
    const second = [{ mapBonuses: [{ value: 130 }] }];
    expect(highestArcaneMapMulti([first, second])).toBeCloseTo(2.3);
  });

  it('is zero with no maps', () => {
    expect(highestArcaneMapMulti([])).toBe(0);
    expect(highestArcaneMapMulti([[]])).toBe(0);
    expect(highestArcaneMapMulti([[{ mapBonuses: [{ value: NaN }, { value: 0 }] }]])).toBe(0);
  });
});
