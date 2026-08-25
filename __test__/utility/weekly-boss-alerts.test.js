import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld2Alerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';

const fields = { weeklyBosses: { checked: true } };
const options = (daily = true, trophy = true) => ({
  weeklyBosses: { daily: { name: 'daily', checked: daily }, trophy: { name: 'trophy', checked: trophy } }
});

// 190 is the daily raid reset flag, 189 is the highest skull tier beaten this week.
const account = (dailyDone, bestSkulls) => ({
  finishedWorlds: { World1: true },
  accountOptions: { 189: bestSkulls, 190: dailyDone ? 1 : 0 }
});

const weeklyBosses = (acc, opts = options()) => getWorld2Alerts(acc, fields, opts, [])?.weeklyBosses;

describe('weekly boss alerts', () => {
  it('flags the daily fight when the raid has not been reset today', () => {
    expect(weeklyBosses(account(false, 3))?.daily).toBe(true);
  });

  it('does not flag the daily fight once the raid was reset today', () => {
    expect(weeklyBosses(account(true, 3))?.daily).toBeUndefined();
  });

  it('flags trophies with the weekly skull progress while below 5 skulls', () => {
    expect(weeklyBosses(account(true, 3))?.trophy).toEqual({ bestSkulls: 3, maxSkulls: 5 });
  });

  it('flags trophies at 0 skulls', () => {
    expect(weeklyBosses(account(true, 0))?.trophy).toEqual({ bestSkulls: 0, maxSkulls: 5 });
  });

  it('stops flagging trophies once 5 skulls are beaten this week', () => {
    expect(weeklyBosses(account(false, 5))?.trophy).toBeUndefined();
  });

  it('drops the alert entirely when 5 skulls are beaten and the daily is done', () => {
    expect(weeklyBosses(account(true, 5))).toBeUndefined();
  });

  it('respects each option separately', () => {
    expect(weeklyBosses(account(false, 0), options(false, true))?.daily).toBeUndefined();
    expect(weeklyBosses(account(false, 0), options(false, true))?.trophy).toBeDefined();
    expect(weeklyBosses(account(false, 0), options(true, false))?.trophy).toBeUndefined();
    expect(weeklyBosses(account(false, 0), options(true, false))?.daily).toBe(true);
  });

  it('treats a missing skull value as zero', () => {
    expect(weeklyBosses({ finishedWorlds: { World1: true }, accountOptions: { 190: 1 } })?.trophy).toEqual({ bestSkulls: 0, maxSkulls: 5 });
  });
});

describe('weekly boss tracker migration', () => {
  const baseTrackers = { version: 69 };

  it('backfills the daily and trophy options on a stored config', () => {
    const stored = { version: 68, account: { 'World 2': { weeklyBosses: { checked: true, options: [] } } } };
    const migrated = migrateConfig(baseTrackers, stored);
    expect(migrated.version).toBe(69);
    expect(migrated.account['World 2'].weeklyBosses.options.map(({ name }) => name)).toEqual(['daily', 'trophy']);
    expect(migrated.account['World 2'].weeklyBosses.options.every(({ checked }) => checked)).toBe(true);
  });

  it('keeps the tracker unchecked state and does not duplicate existing options', () => {
    const stored = {
      version: 68,
      account: { 'World 2': { weeklyBosses: { checked: false, options: [{ name: 'daily', checked: false }] } } }
    };
    const migrated = migrateConfig(baseTrackers, stored);
    expect(migrated.account['World 2'].weeklyBosses.checked).toBe(false);
    expect(migrated.account['World 2'].weeklyBosses.options.map(({ name }) => name)).toEqual(['daily', 'trophy']);
    expect(migrated.account['World 2'].weeklyBosses.options[0].checked).toBe(false);
  });
});
