import { describe, expect, it } from 'vitest';
import { dataAge, getSavedAt } from '@components/common/NavBar/DataAge';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 10, 9, 12);

describe('dataAge, the bar\'s line under the name', () => {
  it.each([
    [-5000, 'just now'],
    [59 * 1000, 'just now'],
    [MINUTE, '1 min ago'],
    [HOUR - 1, '59 min ago'],
    [HOUR, '1 h ago'],
    [DAY, '1 day ago'],
    [2 * DAY, '2 days ago'],
    [7 * DAY, '1 week ago'],
    [30 * DAY - 1, '4 weeks ago'],
    [30 * DAY, '1 month ago'],
    [365 * DAY, '1 year ago']
  ])('data %i ms old reads "%s"', (age, expected) => {
    expect(dataAge(NOW - age, NOW)).toBe(expected);
  });

  it.each([
    ['Firestore\'s commit time', { savedAt: 1787217365000, account: { timeAway: { GlobalTime: 1787217361.5 } }, lastUpdated: NOW }, 1787217365000],
    ['the game\'s save time without one', { account: { timeAway: { GlobalTime: 1787217361.5 } }, lastUpdated: NOW }, 1787217361500],
    ['the toolbox\'s receive time without one', { account: { timeAway: {} }, lastUpdated: NOW }, NOW]
  ])('reads its age off %s', (_, state, expected) => {
    expect(getSavedAt(state)).toBe(expected);
  });
});
