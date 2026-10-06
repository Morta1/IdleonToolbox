import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getOptions, getWorld5Alerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';
import { getBellReadyUses } from '../../parsers/world-5/caverns/the-bell';

const base = { version: 82 };

const storedV80 = (checked) => ({
  version: 80,
  account: {
    'World 5': {
      hole: {
        checked: true,
        options: [{ name: 'bravery', checked: true }, { name: 'theWell', checked }, { name: 'theHarp', checked: true }]
      }
    }
  }
});

const account = (bells) => ({
  finishedWorlds: { World4: true },
  hole: { caverns: { theWell: { sediments: [] }, theBell: { bells } } }
});

const bells = (uses = {}) => ['ring', 'ping', 'clean', 'renew'].map((name) => ({ name, readyUses: uses[name] ?? 0 }));

const bellAlert = (config, bellList) => {
  const section = config.account['World 5'];
  return getWorld5Alerts(account(bellList), section, getOptions(section), [])?.hole?.bells;
};

const setThreshold = (config, name, value) => {
  config.account['World 5'].hole.options.find((option) => option.name === name).props.value = value;
  return config;
};

describe('hole bell alert', () => {
  it('alerts once per ready bell type', () => {
    expect(bellAlert(migrateConfig(base, storedV80(true)), bells({ ring: 1, renew: 12 }))).toEqual([
      { name: 'ring', readyUses: 1, index: 0 },
      { name: 'renew', readyUses: 12, index: 3 }
    ]);
  });

  it('stays quiet when no bell is ready', () => {
    expect(bellAlert(migrateConfig(base, storedV80(true)), bells())).toBeUndefined();
  });

  it('respects each bell threshold', () => {
    const config = setThreshold(migrateConfig(base, storedV80(true)), 'bellRenew', 20);
    expect(bellAlert(config, bells({ renew: 12 }))).toBeUndefined();
    expect(bellAlert(config, bells({ renew: 20 }))).toEqual([{ name: 'renew', readyUses: 20, index: 3 }]);
  });

  it('migration swaps the single bell option for one per type, in place, keeping it off', () => {
    const migrated = migrateConfig(base, storedV80(false));
    const options = migrated.account['World 5'].hole.options;
    expect(options.map(({ name }) => name)).toEqual(['bravery', 'bellRing', 'bellPing', 'bellClean', 'bellRenew', 'theHarp']);
    expect(options.filter(({ name }) => name.startsWith('bell')).every(({ checked, props }) => !checked && props.value === 1)).toBe(true);
    expect(bellAlert(migrated, bells({ ring: 3 }))).toBeUndefined();
  });

  it('migration is a no-op when run twice', () => {
    const once = migrateConfig(base, storedV80(true));
    const twice = migrateConfig(base, { ...once, version: 81 });
    expect(twice.account['World 5'].hole.options.filter(({ name }) => name === 'bellRing')).toHaveLength(1);
  });
});

describe('bell ready uses', () => {
  // bellRelated = [ringExp, rings, pingExp, pings, cleanExp, methods, renewExp, renews]
  it('ring req grows with each use, so banked exp buys fewer uses', () => {
    // reqs at 0, 1, 2 rings: 5, 8.4, 12.13
    expect(getBellReadyUses({ bellRelated: [14, 0] }, 0)).toBe(2);
    expect(getBellReadyUses({ bellRelated: [4, 0] }, 0)).toBe(0);
  });

  it('renew req is flat', () => {
    expect(getBellReadyUses({ bellRelated: [0, 0, 0, 0, 0, 0, 260, 4] }, 3)).toBe(10);
  });

  it('clean is priced at the current req', () => {
    expect(getBellReadyUses({ bellRelated: [0, 0, 0, 0, 950, 2, 0, 0] }, 2)).toBe(1);
  });
});
