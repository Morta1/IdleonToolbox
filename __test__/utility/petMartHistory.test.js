import { describe, expect, it } from 'vitest';
import { getPetMartLastSeen, getPetMartRotationDate, mergePetMartHistory } from '@utility/petMartHistory';

const NOON_OCT_20 = Date.UTC(2026, 9, 20, 12);
const live = (date, shopDay, plus, base = []) => ({
  date, shopDay, source: 'live',
  base: base.map((index) => ({ index, list: 1, price: 1 })),
  plus: plus.map((index) => ({ index, list: 1, price: 1 }))
});

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

  it('adds today from the account when the worker has not logged it yet', () => {
    expect(mergePetMartHistory([live('2026-10-18', 234, [3])], petMart, NOON_OCT_20)).toEqual([
      { date: '2026-10-19', shopDay: 235, source: 'live', base: [{ index: 4, list: 10, price: 8 }], plus: [] },
      live('2026-10-18', 234, [3])
    ]);
  });

  it.each([
    ['the worker already logged that shop day', [live('2026-10-19', 235, [9])]],
    ['the account rotation is older than the log (a demo or an old profile)', [live('2026-10-19', 240, [9])]],
    ['nothing is logged yet', []]
  ])('leaves the history as is when %s', (_, days) => {
    expect(mergePetMartHistory(days, petMart, NOON_OCT_20)).toEqual(days);
  });
});

describe('getPetMartLastSeen', () => {
  it('keeps each pet’s latest date, per counter', () => {
    const history = [live('2026-10-10', 225, [1], [2]), live('2026-09-30', 215, [1, 2])];
    expect(Object.fromEntries(getPetMartLastSeen(history, 'plus'))).toEqual({ 1: '2026-10-10', 2: '2026-09-30' });
    expect(Object.fromEntries(getPetMartLastSeen(history, 'base'))).toEqual({ 2: '2026-10-10' });
  });
});
