import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { getExoticMarketReturnWeeks, rollExoticMarketWeek } from '@parsers/world-6/farming';

describe('exotic market return weeks', () => {
  const account = { timeAway: { GlobalTime: 1_789_000_000 } };
  const currentWeek = Math.floor(account.timeAway.GlobalTime / 604_800);

  it('rolls 8 distinct indices in range per week', () => {
    const indices = rollExoticMarketWeek(currentWeek);
    expect(indices).toHaveLength(8);
    expect(new Set(indices).size).toBe(8);
    indices.forEach((i) => {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThanOrEqual(59);
    });
  });

  it('finds the next week an upgrade reappears, strictly after the given offset', () => {
    const returnsIn = getExoticMarketReturnWeeks(account, 104);
    const schedule = Array.from({ length: 105 }, (_, offset) => rollExoticMarketWeek(currentWeek + offset));

    for (let upgradeIndex = 0; upgradeIndex < 60; upgradeIndex++) {
      for (const afterOffset of [0, 3]) {
        const expected = schedule.findIndex((indices, offset) => offset > afterOffset && indices.includes(upgradeIndex));
        const result = returnsIn(upgradeIndex, afterOffset);
        if (expected === -1) expect(result).toBeNull();
        else expect(result).toBe(expected - afterOffset);
      }
    }
  });

  it('returns null when the upgrade is not in the lookahead window', () => {
    const returnsIn = getExoticMarketReturnWeeks(account, 0);
    expect(returnsIn(0, 0)).toBeNull();
  });

  it('returns null for every upgrade without GlobalTime', () => {
    const returnsIn = getExoticMarketReturnWeeks({}, 10);
    expect(returnsIn(5, 0)).toBeNull();
  });
});
