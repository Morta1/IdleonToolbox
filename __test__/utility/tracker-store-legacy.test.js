import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { migrateConfig } from '@utility/migrations';
import { convertLegacyTrackers, forEachTracker, getTracker, loadTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';

// Options R1 added: a real v81 save does not have them.
const R1_OPTIONS = [['account', 'World 5', 'gaming', 'drops'], ['characters', null, 'cards', 'passiveCards'], ['characters', null, 'alchemy', 'noActivity']];
const trackerOf = (config, type, section, name) => (section ? config[type][section][name] : config[type][name]);
const legacyFrom = (mutate = () => {}) => {
  const legacy = structuredClone(baseTrackers);
  R1_OPTIONS.forEach(([type, section, tracker, name]) => {
    const target = trackerOf(legacy, type, section, tracker);
    target.options = target.options.filter((candidate) => candidate.name !== name);
  });
  mutate(legacy);
  return legacy;
};
const option = (config, section, tracker, name) =>
  config.account[section][tracker].options.find((candidate) => candidate.name === name);

// What the alert code can observe: a tracker that is off hides all of its options.
const effective = (config) => {
  const out = {};
  forEachTracker(baseTrackers, (path, baseTracker, type, section, name) => {
    const tracker = getTracker(config, type, section, name);
    out[path] = Boolean(tracker?.checked);
    if (!tracker?.checked) return;
    baseTracker.options.forEach(({ name: optionName }) => {
      const current = tracker.options?.find((candidate) => candidate?.name === optionName);
      const value = current?.props?.value;
      out[`${path}.${optionName}`] = [
        Boolean(current?.checked),
        typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''),
        JSON.stringify(current?.props?.perWorld ?? null)
      ];
    });
  });
  return out;
};

const roundTrip = (legacy) => {
  const { config, status } = loadTrackers(baseTrackers, legacy);
  expect(status).toBe('converted');
  return config;
};
// Drops and passive cards are new in R1, so the legacy side gets them seeded the same way.
// Pre-R1 semantics: drops followed sprouts, passive cards followed cardSet, noActivity was ungated.
const expected = (legacy) => {
  const config = migrateConfig(baseTrackers, structuredClone(legacy));
  const seeded = [['account', 'World 5', 'gaming', 'drops', 'sprouts'], ['characters', null, 'cards', 'passiveCards', 'cardSet'], ['characters', null, 'alchemy', 'noActivity', null]];
  seeded.forEach(([type, section, tracker, name, from]) => {
    const target = trackerOf(config, type, section, tracker);
    const checked = from ? target.options.find((candidate) => candidate.name === from)?.checked : true;
    target.options = [...target.options.filter((candidate) => candidate.name !== name), { name, checked: Boolean(checked) }];
  });
  return config;
};

describe('legacy conversion', () => {
  it('an untouched v81 config converts to no edits', () => {
    expect(convertLegacyTrackers(baseTrackers, legacyFrom())).toEqual({});
  });

  it('keeps every kind of user change', () => {
    const legacy = legacyFrom((config) => {
      option(config, 'World 1', 'stamps', 'gildedStamps').checked = false;
      option(config, 'World 1', 'stamps', 'affordableStampLevels').props.value = '30';
      const materials = option(config, 'World 3', 'construction', 'materials').props.value;
      materials[Object.keys(materials)[0]] = false;
      const trade = option(config, 'World 7', 'royalGuardian', 'tradeRank');
      trade.checked = true;
      trade.props.perWorld = { 3: '15' };
      config.timers.General.daily.checked = false;
    });
    expect(effective(roundTrip(legacy))).toEqual(effective(expected(legacy)));
  });

  it('keeps scalar values and per-world thresholds under an off tracker', () => {
    const legacy = legacyFrom((config) => {
      config.account['World 1'].stamps.checked = false;
      option(config, 'World 1', 'stamps', 'affordableStampLevels').props.value = '30';
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.affordableStampLevels': { value: '30' }
    });
  });

  it('round trips an off tracker with some options unticked at v81', () => {
    const legacy = legacyFrom((config) => {
      config.account['World 1'].stamps.checked = false;
      option(config, 'World 1', 'stamps', 'gildedStamps').checked = false;
    });
    expect(effective(roundTrip(legacy))).toEqual(effective(expected(legacy)));
  });

  it('round trips an off tracker in an older config', () => {
    const legacy = legacyFrom((config) => {
      config.version = 78;
      config.account['World 5'].sailing.options = config.account['World 5'].sailing.options
        .filter(({ name }) => name !== 'alwaysAlertEnderCaptains');
      config.account['World 3'].library.checked = false;
      option(config, 'World 3', 'library', config.account['World 3'].library.options[0].name).checked = false;
    });
    expect(effective(roundTrip(legacy))).toEqual(effective(expected(legacy)));
  });

  it('a cascaded gaming tracker gets no drops edit', () => {
    const legacy = legacyFrom((config) => {
      const gaming = config.account['World 5'].gaming;
      gaming.checked = false;
      gaming.options.forEach((gamingOption) => { gamingOption.checked = false; });
    });
    const edits = convertLegacyTrackers(baseTrackers, legacy);
    expect(edits).toEqual({ 'account.World 5.gaming': { checked: false } });
    expect(effective(roundTrip(legacy))).toEqual(effective(expected(legacy)));
  });

  it('gaming on with sprouts off hides drops too', () => {
    const legacy = legacyFrom((config) => {
      option(config, 'World 5', 'gaming', 'sprouts').checked = false;
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)['account.World 5.gaming.drops']).toEqual({ checked: false });
    expect(effective(roundTrip(legacy))).toEqual(effective(expected(legacy)));
  });

  it('drops the option unticks the old tracker switch cascaded', () => {
    const legacy = legacyFrom((config) => {
      const library = config.account['World 3'].library;
      library.checked = false;
      library.options.forEach((libraryOption) => { libraryOption.checked = false; });
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({ 'account.World 3.library': { checked: false } });
  });

  it('drops option edits under an off tracker, they were never observable', () => {
    const legacy = legacyFrom((config) => {
      config.account['World 1'].stamps.checked = false;
      option(config, 'World 1', 'stamps', 'gildedStamps').checked = false;
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({ 'account.World 1.stamps': { checked: false } });
  });

  it('runs older configs through the migration chain first', () => {
    const legacy = legacyFrom((config) => {
      config.version = 78;
      config.account['World 5'].sailing.options = config.account['World 5'].sailing.options
        .filter(({ name }) => name !== 'alwaysAlertEnderCaptains');
      // Before v79 the four bell options (v82) were one option, then named theWell.
      const hole = config.account['World 5'].hole;
      const firstBell = hole.options.findIndex(({ name }) => name.startsWith('bell'));
      hole.options = hole.options.filter(({ name }) => !name.startsWith('bell'));
      hole.options.splice(firstBell, 0, { name: 'theWell', checked: true });
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({});
  });

  it('seeds the new options from the option they depended on', () => {
    const legacy = legacyFrom((config) => {
      option(config, 'World 5', 'gaming', 'sprouts').checked = false;
      config.characters.cards.options.find(({ name }) => name === 'cardSet').checked = false;
    });
    const edits = convertLegacyTrackers(baseTrackers, legacy);
    expect(edits['account.World 5.gaming.drops']).toEqual({ checked: false });
    expect(edits['characters.cards.passiveCards']).toEqual({ checked: false });
  });

  it('ignores trackers and options the defaults no longer have', () => {
    const legacy = legacyFrom((config) => {
      config.account['World 1'].goneTracker = { checked: false, options: [] };
      config.account['World 1'].stamps.options.push({ name: 'goneOption', checked: false });
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({});
  });
});

describe('loadTrackers', () => {
  it('uses the defaults when nothing is stored', () => {
    const result = loadTrackers(baseTrackers, undefined);
    expect(result.status).toBe('empty');
    expect(result.stored).toEqual({ schema: 2, edits: {} });
  });

  it('reads schema 2 as is', () => {
    const stored = { schema: 2, edits: { 'account.World 1.stamps': { checked: false } } };
    const result = loadTrackers(baseTrackers, stored);
    expect(result.status).toBe('current');
    expect(result.stored).toBe(stored);
    expect(result.config.account['World 1'].stamps.checked).toBe(false);
  });

  it('converts a legacy config and hands back the original for the backup', () => {
    const legacy = legacyFrom();
    const result = loadTrackers(baseTrackers, legacy);
    expect(result.status).toBe('converted');
    expect(result.legacy).toBe(legacy);
    expect(result.stored).toEqual({ schema: 2, edits: {} });
  });

  it('falls back to the legacy config when conversion throws', () => {
    const broken = { version: 81, account: { 'World 1': { stamps: { checked: true, options: 5 } } } };
    const result = loadTrackers(baseTrackers, broken);
    expect(result.status).toBe('failed');
    expect(result.stored).toBeNull();
    expect(result.config.account).toBe(broken.account);
  });

  it('returns the defaults when the legacy fallback throws as well', () => {
    const result = loadTrackers(baseTrackers, { version: 1 });
    expect(result.status).toBe('failed');
    expect(result.stored).toBeNull();
    expect(result.config).toEqual(resolveTrackers(baseTrackers, {}));
  });
});
