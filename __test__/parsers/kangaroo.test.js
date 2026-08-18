import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import latest from '../fixtures/latest.json';

// Poppy banks elapsed seconds in accountOptions[288] and only converts them to fish while the
// Poppy menu is open in game. Timers built on the raw fish counter froze at a constant value for
// days on end, because the counter never moved while real time passed.
const parseWith = (mutate) => {
  const clone = structuredClone(latest);
  const isString = typeof clone.data.OptLacc === 'string';
  const options = isString ? JSON.parse(clone.data.OptLacc) : clone.data.OptLacc;
  mutate(options);
  clone.data.OptLacc = isString ? JSON.stringify(options) : options;
  const { data, charNames, companion, guildData, serverVars } = clone;
  return parseData(data, charNames, companion, guildData, serverVars).account.kangaroo;
};

describe('getKangaroo banked fish', () => {
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

    // The raw counter is frozen across every upload — this is the bug being guarded against.
    expect(new Set(days.map(({ fish }) => fish)).size).toBe(1);

    // The banked total is not, so the timer counts down instead of sitting at "1 day" forever.
    for (let day = 1; day < days.length; day++) {
      expect(days[day].totalFish).toBeGreaterThan(days[day - 1].totalFish);
      expect(remaining(days[day].totalFish)).toBeLessThan(remaining(days[day - 1].totalFish));
    }
    expect(remaining(days[0].totalFish)).toBeGreaterThan(0);
    expect(remaining(days[1].totalFish)).toBeLessThanOrEqual(0);
  });

  it('banks tar fish the same way', () => {
    const kangaroo = parseWith(() => {});
    expect(kangaroo.pendingTarFish).toBeGreaterThan(0);
    expect(kangaroo.totalTarFishOwned).toBe(kangaroo.tarFishOwned + kangaroo.pendingTarFish);
  });
});
