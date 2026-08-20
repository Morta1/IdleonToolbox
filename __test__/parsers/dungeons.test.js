import '../../polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calcHappyHours, getDungeons } from '@parsers/dungeons';
import { liveCount } from '@parsers/catalog';
import { dungeonCreditShop, dungeonStats, dungeonFlurboStats } from '@website-data';
import { tryToParse } from '@utility/helpers';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

describe('getDungeons', () => {
  it('returns every live rngItem/insideUpgrade/flurbo upgrade when the save is missing', () => {
    const result = getDungeons(undefined, undefined);
    expect(result.rngItems).toHaveLength(liveCount(dungeonCreditShop));
    expect(result.insideUpgrades).toHaveLength(liveCount(dungeonStats));
    expect(result.upgrades).toHaveLength(liveCount(dungeonFlurboStats));
    expect(result.rngItems.every((u) => u.level === 0)).toBe(true);
    expect(result.insideUpgrades.every((u) => u.level === 0)).toBe(true);
    expect(result.upgrades.every((u) => u.level === 0)).toBe(true);
  });

  it('never crashes with no idleonData/accountOptions', () => {
    expect(() => getDungeons(undefined, undefined)).not.toThrow();
  });

  it('carries catalog fields through', () => {
    const result = getDungeons(undefined, undefined);
    expect(result.rngItems[0].name).toBe('Helping_Heart');
    expect(result.insideUpgrades[0].effect).toBe('Max_HP');
    expect(result.upgrades[0].effect).toBe('Weapon_Power');
  });

  it('applies save levels at the right indexes (synthetic, unconditional)', () => {
    const dungUpg = [[5, 3, 0], [5, 3, 0], [], [], [], [5, 3, 0]];
    const idleonData = { DungUpg: JSON.stringify(dungUpg) };
    const result = getDungeons(idleonData, []);
    expect(result.rngItems[0].level).toBe(5);
    expect(result.rngItems[1].level).toBe(3);
    expect(result.insideUpgrades[0].level).toBe(5);
    expect(result.insideUpgrades[1].level).toBe(3);
    expect(result.upgrades[0].level).toBe(5);
    expect(result.upgrades[1].level).toBe(3);
    expect(result.rngItems).toHaveLength(liveCount(dungeonCreditShop));
    expect(result.insideUpgrades).toHaveLength(liveCount(dungeonStats));
    expect(result.upgrades).toHaveLength(liveCount(dungeonFlurboStats));
  });
});

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

describe('getDungeons fixture regression', () => {
  it.each(FIXTURES)('%s: levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const dungeonUpgrades = tryToParse(data?.DungUpg);
    const result = getDungeons(data, data?.OptLacc ? tryToParse(data.OptLacc) : []);

    dungeonUpgrades?.[0]?.forEach((level, index) => {
      if (index >= result.rngItems.length) return;
      expect(result.rngItems[index].level).toBe(level);
    });
    dungeonUpgrades?.[1]?.forEach((level, index) => {
      if (index >= result.insideUpgrades.length) return;
      expect(result.insideUpgrades[index].level).toBe(level);
    });
    dungeonUpgrades?.[5]?.forEach((level, index) => {
      if (index >= result.upgrades.length) return;
      expect(result.upgrades[index].level).toBe(level);
    });
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of save', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getDungeons(data, []);
    expect(result.rngItems).toHaveLength(liveCount(dungeonCreditShop));
    expect(result.insideUpgrades).toHaveLength(liveCount(dungeonStats));
    expect(result.upgrades).toHaveLength(liveCount(dungeonFlurboStats));
  });

  it.each(FIXTURES)('%s: never throws', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    expect(() => getDungeons(data, [])).not.toThrow();
  });
});

// The game selects the next happy hour with `GlobalTime - 604800 * floor(GlobalTime / 604800)`,
// so the anchor is Thursday 00:00 UTC and the result must not depend on the browser's timezone.
const SECONDS_IN_WEEK = 604800;
const SECONDS_IN_HOUR = 3600;
// Real HappyHours server var: seconds-of-week each happy hour ends on.
const HAPPY_HOURS = latest.serverVars.HappyHours;

// What the game itself would answer: the first entry whose end is still ahead of us this week.
const gameNextHappyHourEnd = (nowInSeconds) => {
  const secondOfWeek = nowInSeconds - SECONDS_IN_WEEK * Math.floor(nowInSeconds / SECONDS_IN_WEEK);
  return HAPPY_HOURS.find((time) => secondOfWeek < time);
};

describe('calcHappyHours', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const at = (iso) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    return Math.floor(new Date(iso).getTime() / 1000);
  };

  it('returns nothing for a missing server var instead of throwing', () => {
    expect(() => calcHappyHours(undefined)).not.toThrow();
    expect(calcHappyHours(undefined)).toBeUndefined();
    expect(calcHappyHours([])).toEqual([]);
  });

  // 2026-08-20 is a Thursday. The old code took an early return here that skipped the
  // local-to-UTC correction the other branches applied, so every Thursday the timers were out
  // by the viewer's UTC offset - the two hours originally reported from UTC+2.
  it('anchors to Thursday 00:00 UTC on a Thursday', () => {
    const now = at('2026-08-20T13:46:36Z');
    const weekStart = Date.UTC(2026, 7, 20) / 1000;
    const [next] = calcHappyHours(HAPPY_HOURS);
    expect(next).toBe((weekStart + gameNextHappyHourEnd(now) - SECONDS_IN_HOUR) * 1000);
  });

  it('anchors to the preceding Thursday on any other day', () => {
    const now = at('2026-08-24T09:00:00Z'); // Monday
    const weekStart = Date.UTC(2026, 7, 20) / 1000;
    const [next] = calcHappyHours(HAPPY_HOURS);
    expect(next).toBe((weekStart + gameNextHappyHourEnd(now) - SECONDS_IN_HOUR) * 1000);
  });

  it('returns only happy hours that are still ahead, in order', () => {
    at('2026-08-20T13:46:36Z');
    const result = calcHappyHours(HAPPY_HOURS);
    const now = Date.now();
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((time) => time > now)).toBe(true);
    expect([...result].sort((a, b) => a - b)).toEqual(result);
  });

  // Past the last happy hour of the week the function re-anchors to next Thursday. That fallback
  // used to return seconds while the happy path returned milliseconds, so the dashboard tile got
  // a 1970 timestamp and showed its "Go claim!" placeholder until the week rolled over.
  it('rolls over to next week in milliseconds once the week is spent', () => {
    at('2026-08-26T22:00:00Z'); // after the last entry (601100s) of the week
    const nextWeekStart = Date.UTC(2026, 7, 27) / 1000;
    const result = calcHappyHours(HAPPY_HOURS);
    expect(result).toHaveLength(HAPPY_HOURS.length);
    expect(result[0]).toBe((nextWeekStart + HAPPY_HOURS[0] - SECONDS_IN_HOUR) * 1000);
    expect(result.every((time) => time > Date.now())).toBe(true);
  });

  // Auckland and Los_Angeles are deliberately on the far side of the date line from UTC: at this
  // instant their local calendar day is not even the same day as the UTC one, which is what broke
  // the old startOfToday()/previousThursday() anchor.
  it('gives the same answer regardless of the viewer timezone', () => {
    const instant = '2026-08-20T13:46:36Z';
    const weekStart = Date.UTC(2026, 7, 20) / 1000;
    const expected = HAPPY_HOURS
      .map((time) => (weekStart + time - SECONDS_IN_HOUR) * 1000)
      .filter((time) => time > new Date(instant).getTime());

    const original = process.env.TZ;
    const offsets = new Set();
    try {
      for (const timeZone of ['UTC', 'Europe/Berlin', 'Pacific/Auckland', 'America/Los_Angeles']) {
        process.env.TZ = timeZone;
        at(instant);
        offsets.add(new Date().getTimezoneOffset());
        expect(calcHappyHours(HAPPY_HOURS)).toEqual(expected);
        vi.useRealTimers();
      }
    } finally {
      process.env.TZ = original;
    }
    // Guards the test itself: if process.env.TZ stopped taking effect every case would be UTC and
    // the assertions above would pass without proving anything.
    expect(offsets.size).toBeGreaterThan(1);
  });
});
