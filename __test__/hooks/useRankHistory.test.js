import { nextHistory, rankChanges } from '@hooks/useRankHistory';

const reply = (createdAt, rank, ranks, mainChar = 'Me') => ({
  createdAt, player: { mainChar, rank }, ranks: Object.fromEntries(Object.entries(ranks).map(([k, r]) => [k, { r, v: 10 }]))
});

describe('nextHistory', () => {
  it('keeps "since your last visit" across a session and moves it only on a new visit', () => {
    let stored = nextHistory(null, reply(1, 20, { a: 12, b: 40 }), true);
    expect(stored.prev).toBeNull();
    // Same run again (a refresh): nothing to write
    expect(nextHistory(stored, reply(1, 20, { a: 12, b: 40 }), false)).toBeNull();
    // Next run in the same session: cur follows, prev stays
    stored = nextHistory(stored, reply(2, 19, { a: 11, b: 40 }), false);
    expect(stored.prev).toBeNull();
    // A new visit days later: the old cur becomes prev
    stored = nextHistory(stored, reply(3, 17, { a: 9, b: 41 }), true);
    expect(rankChanges(stored)).toMatchObject({ since: 2, rank: 2, boards: [{ metric: 'a', from: 11, to: 9, delta: 2 }, { metric: 'b', from: 40, to: 41, delta: -1 }] });
    // A later run in that visit keeps the same baseline
    stored = nextHistory(stored, reply(4, 16, { a: 8, b: 41 }), false);
    expect(rankChanges(stored).since).toBe(2);
    // Another name (Anon# id vs main character) starts over
    expect(nextHistory(stored, reply(5, 16, { a: 8 }, 'Anon#1'), true)).toMatchObject({ name: 'Anon#1', prev: null });
  });
});
