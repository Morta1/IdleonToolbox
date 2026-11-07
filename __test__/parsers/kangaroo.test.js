import '../../polyfills';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getKangaroo } from '@parsers/world-2/kangaroo';
import { parseFixture } from '../helpers/parsed-fixtures';
import latest from '../fixtures/latest.json';

// Poppy banks elapsed seconds in accountOptions[288] and only converts them to fish while the
// Poppy menu is open in game. Timers built on the raw fish counter froze at a constant value for
// days on end, because the counter never moved while real time passed.
const parseWith = (mutate) => {
  const { account } = parseFixture(latest);
  const options = [...account.accountOptions];
  mutate(options);
  return getKangaroo(null, { ...account, accountOptions: options });
};

describe('getKangaroo banked fish', () => {
  // fishRate runs through getShinyMulti, which grows with wall-clock time. Without a frozen clock
  // the breakpoint assertions below drift between runs.
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
  });
  afterAll(() => vi.useRealTimers());

  it('adds the banked catch timer on top of the raw fish counter', () => {
    const kangaroo = parseWith(() => {});
    expect(kangaroo.pendingFish).toBeGreaterThan(0);
    expect(kangaroo.totalFish).toBe(kangaroo.fish + kangaroo.pendingFish);
  });

  it('reports no pending fish when the bank is empty', () => {
    const kangaroo = parseWith((options) => {
      options[288] = 0;
    });
    expect(kangaroo.pendingFish).toBe(0);
    expect(kangaroo.totalFish).toBe(kangaroo.fish);
  });

  it('grows the fish total as real time banks up, so the reset timer keeps ticking', () => {
    // One upload per day for a player who never opens the Poppy menu: fish stays put, the bank grows.
    const baseline = parseWith((options) => {
      options[288] = 0;
    });
    const cost = baseline.upgrades[6].cost;
    const remaining = (fish) => (cost - fish) / baseline.fishRate * 60 * 1000;

    // Park the account one day short of a Fisheroo Reset.
    const startingFish = cost - baseline.fishRate * 1440;
    const days = [0, 1, 2, 3].map((day) => parseWith((options) => {
      options[267] = startingFish;
      options[288] = 86400 * day;
    }));

    // The raw counter is frozen across every upload - this is the bug being guarded against.
    expect(new Set(days.map(({ fish }) => fish)).size).toBe(1);

    // The banked total is not, so the timer counts down instead of sitting at "1 day" forever.
    for (let day = 1; day < days.length; day++) {
      expect(days[day].totalFish).toBeGreaterThan(days[day - 1].totalFish);
      expect(remaining(days[day].totalFish)).toBeLessThan(remaining(days[day - 1].totalFish));
    }
    expect(remaining(days[0].totalFish)).toBeGreaterThan(0);
    // One day of banking lands the timer on zero; allow a part-per-billion of that day for the
    // float residue of dividing ~1e12-magnitude fish counts.
    const oneDayMs = 1440 * 60 * 1000;
    expect(remaining(days[1].totalFish)).toBeLessThanOrEqual(oneDayMs * 1e-9);
  });

  it('banks tar fish the same way', () => {
    const kangaroo = parseWith(() => {});
    expect(kangaroo.pendingTarFish).toBeGreaterThan(0);
    expect(kangaroo.totalTarFishOwned).toBe(kangaroo.tarFishOwned + kangaroo.pendingTarFish);
  });
});
