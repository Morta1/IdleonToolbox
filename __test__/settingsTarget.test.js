import { describe, expect, it } from 'vitest';
import { resolveSettingsTarget } from '@utility/dashboard/settingsTarget';

// Shaped like baseTrackers in pages/dashboard.jsx: account is grouped into sections, characters is
// a flat list of trackers.
const config = {
  account: {
    General: {
      guild: { checked: true, options: [{ name: 'daily' }, { name: 'weekly' }] },
      etc: { checked: true, options: [{ name: 'gemsFromBosses' }, { name: 'familyObols' }] }
    },
    'World 1': {
      stamps: { checked: true, options: [{ name: 'gildedStamps' }] }
    }
  },
  characters: {
    talents: {
      checked: true,
      options: [{ name: 'talents' }, { name: 'unmaxedTalents' }]
    },
    tools: { checked: true, options: [] }
  }
};

describe('resolveSettingsTarget', () => {
  it('resolves a section, tracker and option from an account path', () => {
    expect(resolveSettingsTarget(config, 'account', 'World 1.stamps.gildedStamps')).toEqual({
      tab: 0, configType: 'account', section: 'World 1', trackerName: 'stamps', optionName: 'gildedStamps'
    });
  });

  it('finds the tracker owning an option the alert data flattened up a level', () => {
    expect(resolveSettingsTarget(config, 'account', 'General.gemsFromBosses')).toEqual({
      tab: 0, configType: 'account', section: 'General', trackerName: 'etc', optionName: 'gemsFromBosses'
    });
  });

  it('falls back to the tracker when the path tail is not one of its options', () => {
    expect(resolveSettingsTarget(config, 'account', 'General.guild.somethingElse')).toEqual({
      tab: 0, configType: 'account', section: 'General', trackerName: 'guild', optionName: null
    });
  });

  it('resolves a flat characters path with no section', () => {
    expect(resolveSettingsTarget(config, 'characters', 'tools')).toEqual({
      tab: 1, configType: 'characters', section: null, trackerName: 'tools', optionName: null
    });
  });

  it('prefers the deeper path segment when a tracker carries an option of its own name', () => {
    expect(resolveSettingsTarget(config, 'characters', 'talents.unmaxedTalents')?.optionName)
      .toBe('unmaxedTalents');
    expect(resolveSettingsTarget(config, 'characters', 'talents.talents')?.optionName).toBe('talents');
  });

  it('returns null without a config or a target', () => {
    expect(resolveSettingsTarget(config, 'account', undefined)).toBe(null);
    expect(resolveSettingsTarget(undefined, 'account', 'General.guild.daily')).toBe(null);
  });
});
