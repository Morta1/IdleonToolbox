import { describe, expect, it } from 'vitest';
import '../polyfills';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
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

describe('resolveSettingsTarget aliases', () => {
  const cases = [
    ['World 3.construction.saltDeficit', 'World 3', 'construction', 'saltBalance'],
    ['World 3.construction.saltRankUpRoom', 'World 3', 'construction', 'saltBalance'],
    ['World 3.printer.atoms', 'World 3', 'printer', 'includeResource'],
    ['World 3.traps.overdue', 'World 3', 'traps', 'trapsOverdue'],
    ['World 3.hatRack.missingHats', 'World 3', 'hatRack', 'hatsMissing'],
    ['World 5.hole.motherlodeMaxed', 'World 5', 'hole', 'motherlode'],
    ['World 5.hole.hiveMaxed', 'World 5', 'hole', 'theHive'],
    ['World 5.hole.evertreeMaxed', 'World 5', 'hole', 'evertree'],
    ['World 5.hole.bottomlessTrenchMaxed', 'World 5', 'hole', 'bottomlessTrench'],
    ['World 6.etc.emperorAttempts', 'World 6', 'etc', 'emperor'],
    ['World 7.gallery.missingTrophies', 'World 7', 'gallery', 'trophiesMissing'],
    ['World 7.gallery.missingNametags', 'World 7', 'gallery', 'nametagsMissing'],
    ['World 7.legendTalents.legendPointsLeftToSpend', 'World 7', 'legendTalents', 'pointsLeftToSpend']
  ];
  it.each(cases)('%s lands on its option', (path, section, trackerName, optionName) => {
    expect(resolveSettingsTarget(baseTrackers, 'account', path)).toEqual({
      tab: 0, configType: 'account', section, trackerName, optionName
    });
  });
});
