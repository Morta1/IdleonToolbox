import { describe, expect, it } from 'vitest';
import { getPetMartRotationDate, getPetMartStats, mergePetMartHistory } from '@utility/petMartHistory';

const NOON_OCT_20 = Date.UTC(2026, 9, 20, 12);
const wiki = (date, plus) => ({ date, shopDay: null, source: 'wiki', base: [], plus: plus.map((index) => ({ index })) });
const live = (date, shopDay, plus) => ({ date, shopDay, source: 'live', base: [], plus: plus.map((index) => ({ index, list: 1, price: 1 })) });

describe('getPetMartRotationDate', () => {
  it.each([
    [Date.UTC(2026, 9, 20, 19, 59), '2026-10-19'],
    [Date.UTC(2026, 9, 20, 20), '2026-10-20']
  ])('files %s under the restock that opened it', (now, date) => {
    expect(getPetMartRotationDate(now)).toBe(date);
  });
});

describe('mergePetMartHistory', () => {
  const petMart = { shopDay: 235, offers: [{ companionIndex: 4, listPrice: 10, price: 8 }], plusOffers: [] };

  it('adds today from the account when the worker has not logged it, replacing a wiki row on that date', () => {
    expect(mergePetMartHistory([wiki('2026-10-19', [7]), live('2026-10-18', 234, [3])], petMart, NOON_OCT_20)).toEqual([
      { date: '2026-10-19', shopDay: 235, source: 'live', base: [{ index: 4, list: 10, price: 8 }], plus: [] },
      live('2026-10-18', 234, [3])
    ]);
  });

  it.each([
    ['the worker already logged that shop day', [live('2026-10-19', 235, [9])]],
    ['the account rotation is older than the log (a demo or an old profile)', [live('2026-10-19', 240, [9]), wiki('2026-10-18', [7])]],
    ['nothing is logged live yet', [wiki('2026-10-19', [7])]]
  ])('leaves the history as is when %s', (_, days) => {
    expect(mergePetMartHistory(days, petMart, NOON_OCT_20)).toEqual(days);
  });
});

describe('getPetMartStats', () => {
  it('takes first sight from any row and the last sale from live rows only', () => {
    const stats = getPetMartStats([live('2026-10-10', 225, [1]), live('2026-09-30', 215, [1]), wiki('2026-08-25', [1, 2])], 'plus');
    expect(Object.fromEntries(stats)).toEqual({
      1: { firstSeen: '2026-08-25', lastSold: '2026-10-10' },
      2: { firstSeen: '2026-08-25', lastSold: null }
    });
  });
});
