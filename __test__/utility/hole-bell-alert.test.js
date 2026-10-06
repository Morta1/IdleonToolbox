import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getOptions, getWorld5Alerts } from '../../utility/dashboard/account';
import { migrateConfig } from '../../utility/migrations';

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

const readyBell = { exp: 10, expReq: 10 };
const bellAlert = (config, bells = [readyBell]) => {
  const section = config.account['World 5'];
  return getWorld5Alerts(account(bells), section, getOptions(section), [])?.hole?.theBell;
};

describe('hole bell alert', () => {
  it('fires for a ready bell once the option is migrated', () => {
    expect(bellAlert(migrateConfig({ version: 81 }, storedV80(true)))).toBe(true);
  });

  it('stays quiet when no bell is ready', () => {
    expect(bellAlert(migrateConfig({ version: 81 }, storedV80(true)), [{ exp: 1, expReq: 10 }])).toBeUndefined();
  });

  it('migration renames the option in place and keeps it turned off', () => {
    const migrated = migrateConfig({ version: 81 }, storedV80(false));
    const names = migrated.account['World 5'].hole.options.map(({ name }) => name);
    expect(names).toEqual(['bravery', 'theBell', 'theHarp']);
    expect(bellAlert(migrated)).toBeUndefined();
  });

  it('migration is a no-op when run twice', () => {
    const once = migrateConfig({ version: 81 }, storedV80(true));
    const twice = migrateConfig({ version: 81 }, { ...once, version: 80 });
    expect(twice.account['World 5'].hole.options.filter(({ name }) => name === 'theBell')).toHaveLength(1);
  });
});
