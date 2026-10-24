import { describe, expect, it } from 'vitest';
import { getDailyResetAt, hoursUntilDailyReset } from '@utility/helpers';

// timeAway.ShopRestock is a countdown in seconds captured when the save was taken, and
// timeAway.GlobalTime is when that happened - so the live answer has to net the two off.
const at = (hoursAgoSaved, restockHours) => ({
  timeAway: { GlobalTime: Date.now() / 1000 - hoursAgoSaved * 3600, ShopRestock: restockHours * 3600 }
});

describe('hoursUntilDailyReset', () => {
  it('reads the countdown straight off a fresh save', () => {
    expect(hoursUntilDailyReset(at(0, 5))).toBeCloseTo(5, 3);
  });

  it('takes the elapsed time back off a stale save', () => {
    // Saved 2h ago with 5h on the clock: 3h left, not 5. Reading it raw would push every
    // deadline later than it really is, which is the direction that gives wrong advice.
    expect(hoursUntilDailyReset(at(2, 5))).toBeCloseTo(3, 3);
  });

  it('returns null once the save outlived the reset it was counting down to', () => {
    expect(hoursUntilDailyReset(at(6, 5))).toBe(null);
    expect(hoursUntilDailyReset(at(5, 5))).toBe(null);
  });

  it('returns null rather than NaN when the save carries no timings', () => {
    expect(hoursUntilDailyReset(undefined)).toBe(null);
    expect(hoursUntilDailyReset({})).toBe(null);
    expect(hoursUntilDailyReset({ timeAway: {} })).toBe(null);
    expect(hoursUntilDailyReset({ timeAway: { ShopRestock: 3600 } })).toBe(null);
  });
});

describe('getDailyResetAt', () => {
  it('anchors on the save time, so fetching the same save later keeps the same reset', () => {
    const save = { timeAway: { GlobalTime: 1000, ShopRestock: 5 * 3600 } };
    expect(getDailyResetAt(save, 0)).toBe(getDailyResetAt(save, 9 * 36e5));
    expect(getDailyResetAt(save)).toBe((1000 + 5 * 3600) * 1000);
    expect(getDailyResetAt({ timeAway: { ShopRestock: 60 } }, 500)).toBe(60500);
  });
});
