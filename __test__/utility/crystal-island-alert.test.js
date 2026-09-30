import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getCrystalIslandAlertTitle, getWorld2Alerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';
import { getCrystalIslandMobs, getIslands } from '../../parsers/world-2/islands';

const fields = { islands: { checked: true } };
const options = (value = 13, checked = true) => ({
  islands: { crystalIsland: { name: 'crystalIsland', checked, props: { value } } }
});

// Island letters start at '_', so Crystal (index 2) is 'b'.
const account = ({ unclaimedDays = 0, unlockedIslands = 'b' } = {}) => {
  const accountOptions = [];
  accountOptions[169] = unlockedIslands;
  accountOptions[171] = unclaimedDays;
  const acc = { accountOptions, finishedWorlds: { World1: true } };
  acc.islands = getIslands(acc, []);
  return acc;
};

const crystalAlert = (acc, opts = options()) => getWorld2Alerts(acc, fields, opts, [])?.islands?.crystalIsland;

describe('crystal island mobs', () => {
  it('matches the game spawn curve, including the drop at the 14 day cap', () => {
    expect([0, 1, 5, 13, 14].map(getCrystalIslandMobs)).toEqual([0, 3, 11, 27, 15]);
  });

  it('exposes the unclaimed days on the Crystal island entry', () => {
    const crystal = account({ unclaimedDays: 13 }).islands.list.find(({ name }) => name === 'Crystal');
    expect(crystal).toMatchObject({ unclaimedDays: 13, maxDays: 14, mobsWaiting: 27, unlocked: true });
  });
});

describe('crystal island alert', () => {
  it('fires once the unclaimed days reach the threshold', () => {
    expect(crystalAlert(account({ unclaimedDays: 13 }))).toMatchObject({ unclaimedDays: 13, mobsWaiting: 27 });
    expect(crystalAlert(account({ unclaimedDays: 14 }))).toMatchObject({ unclaimedDays: 14, mobsWaiting: 15 });
  });

  it('stays quiet below the threshold, when locked, or when turned off', () => {
    expect(crystalAlert(account({ unclaimedDays: 12 }))).toBeUndefined();
    expect(crystalAlert(account({ unclaimedDays: 14, unlockedIslands: '_a' }))).toBeUndefined();
    expect(crystalAlert(account({ unclaimedDays: 14 }), options(13, false))).toBeUndefined();
  });

  it('respects a custom threshold', () => {
    expect(crystalAlert(account({ unclaimedDays: 5 }), options(5))).toBeDefined();
  });
});

describe('crystal island alert title', () => {
  it('leads with the action, and says when it caps tomorrow or is capped', () => {
    expect(getCrystalIslandAlertTitle({ unclaimedDays: 13, maxDays: 14, mobsWaiting: 27 }))
      .toBe('Visit Crystal Island: 27 giant crystal mobs waiting, it caps tomorrow');
    expect(getCrystalIslandAlertTitle({ unclaimedDays: 5, maxDays: 14, mobsWaiting: 11 }))
      .toBe('Visit Crystal Island: 11 giant crystal mobs waiting, 5/14 days');
    expect(getCrystalIslandAlertTitle({ unclaimedDays: 14, maxDays: 14, mobsWaiting: 15 }))
      .toBe('Crystal Island is capped: visit it, extra days are lost (only 15 mobs spawn at the cap)');
  });
});

describe('crystal island migration', () => {
  it('adds the option to an existing islands group once', () => {
    const stored = { version: 76, account: { 'World 2': { islands: { checked: true, options: [{ name: 'garbageUpgrade', checked: true }] } } } };
    const migrated = migrateConfig({ version: 77 }, stored);
    const names = migrated.account['World 2'].islands.options.map(({ name }) => name);
    expect(names).toEqual(['garbageUpgrade', 'crystalIsland']);
    expect(migrated.account['World 2'].islands.options[1].props.value).toBe(13);
  });
});
