import { historyChanges } from '@hooks/useRankHistory';
import { countPast } from '@components/leaderboards/standing';
import { rankPoints } from '@components/leaderboards/RankChart';
import { boardPoints } from '@components/leaderboards/BoardProgress';

// The /player reply now, and the history route's past standing: a board entry there is [rank, value, tied, at the max].
const now = (rank, ranks) => ({
  createdAt: 9, player: { mainChar: 'Me', rank, compositeScore: 500 },
  ranks: Object.fromEntries(Object.entries(ranks).map(([key, r]) => [key, { r, v: 10 }]))
});
const history = (snapshot, extra = {}) => ({ range: null, boardsNow: 3, snapshot: { at: 2, rank: 19, points: 440, boards: 3, ...snapshot }, ...extra });

describe('historyChanges', () => {
  it('lists the boards whose rank moved against the past standing, biggest move first', () => {
    const changes = historyChanges(now(17, { a: 9, b: 41, c: 5, d: 3 }), history({ ranks: { a: [11, 7, 1, 0], b: [40, 10, 1, 0], c: [5, 2, 1, 0] } }, { range: 30 }));
    // c did not move and d was unranked then: neither is listed.
    expect(changes).toMatchObject({
      since: 2, range: 30, rank: 2, pointsFrom: 440,
      boards: [{ metric: 'a', from: 11, to: 9, delta: 2, valueFrom: 7, valueTo: 10 }, { metric: 'b', from: 40, to: 41, delta: -1 }]
    });
  });

  it('leaves points out when the past standing had another number of boards, and has nothing without one', () => {
    expect(historyChanges(now(17, {}), history({ ranks: {}, boards: 2 })).pointsFrom).toBeNull();
    expect(historyChanges(now(17, {}), { range: 7, snapshot: null })).toBeNull();
    expect(historyChanges(now(17, {}), undefined)).toBeNull();
  });
});

describe('countPast', () => {
  it('counts a past standing from its own at-the-max flags', () => {
    expect(countPast({ a: [1, 5, 1, 0], b: [1, 9, 40, 1], c: [20, 1, 1, 0], d: [90, 1, 1, 0], e: [300, 1, 1, 0] })).toEqual({ firsts: 1, top25: 2, top100: 3 });
  });
});

describe('rankPoints', () => {
  it('adds the rank now only when a run later than the last recorded day ranked the player', () => {
    expect(rankPoints([[1, 50], [5, 40]], 9, 38)).toEqual([{ x: 1, y: 50 }, { x: 5, y: 40 }, { x: 9, y: 38 }]);
    expect(rankPoints([[1, 50], [5, 40]], 5, 40)).toHaveLength(2);
    expect(rankPoints(undefined, 9, 38)).toEqual([{ x: 9, y: 38 }]);
    // A board's line carries the value too, and has no point for a player who is not on it now.
    expect(boardPoints([[1, 50, 7]], 9, { r: 48, v: 8 })).toEqual([{ x: 1, y: 50, value: 7 }, { x: 9, y: 48, value: 8 }]);
    expect(boardPoints([[1, 50, 7]], 9, null)).toHaveLength(1);
  });
});
