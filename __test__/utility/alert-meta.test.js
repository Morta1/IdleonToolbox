import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { alertAliases, alertMeta, sectionMeta } from '@utility/dashboard/alertMeta';

const CONFIG_TYPES = ['account', 'characters', 'timers'];

// path -> option names, walked the same way the resolver keys edits.
const trackerPaths = () => CONFIG_TYPES.reduce((res, configType) => {
  const config = baseTrackers[configType];
  if (configType === 'characters') {
    Object.entries(config).forEach(([tracker, data]) => {
      res[`${configType}.${tracker}`] = (data?.options ?? []).map(({ name }) => name);
    });
    return res;
  }
  Object.entries(config).forEach(([section, trackers]) => {
    Object.entries(trackers).forEach(([tracker, data]) => {
      res[`${configType}.${section}.${tracker}`] = (data?.options ?? []).map(({ name }) => name);
    });
  });
  return res;
}, {});

const allStrings = (value) => {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
};

describe('alertMeta', () => {
  const paths = trackerPaths();

  it('covers every tracker with a label', () => {
    Object.keys(paths).forEach((path) => {
      expect(alertMeta[path], path).toBeDefined();
      expect(alertMeta[path].label?.trim(), path).toBeTruthy();
    });
  });

  it('labels every option', () => {
    Object.entries(paths).forEach(([path, options]) => {
      options.forEach((option) => {
        expect(alertMeta[path]?.options?.[option]?.label?.trim(), `${path}.${option}`).toBeTruthy();
      });
    });
  });

  it('has no trackers or options that baseTrackers lacks', () => {
    Object.entries(alertMeta).forEach(([path, meta]) => {
      expect(paths[path], path).toBeDefined();
      Object.keys(meta?.options ?? {}).forEach((option) => {
        expect(paths[path], `${path}.${option}`).toContain(option);
      });
    });
  });

  it('points inline, dependsOn and foldInto at an option of the same tracker', () => {
    Object.entries(alertMeta).forEach(([path, meta]) => {
      if (meta.inline) expect(paths[path], `${path} inline`).toContain(meta.inline);
      Object.entries(meta?.options ?? {}).forEach(([option, { dependsOn, foldInto }]) => {
        if (dependsOn) {
          expect(paths[path], `${path}.${option} dependsOn`).toContain(dependsOn);
          expect(dependsOn).not.toBe(option);
        }
        if (foldInto) {
          expect(paths[path], `${path}.${option} foldInto`).toContain(foldInto);
          expect(foldInto).not.toBe(option);
        }
      });
    });
  });

  it('keys every section that baseTrackers has', () => {
    ['account', 'timers'].forEach((configType) => {
      Object.keys(baseTrackers[configType]).forEach((section) => {
        expect(sectionMeta[`${configType}.${section}`]?.label, `${configType}.${section}`).toBeTruthy();
      });
    });
    Object.keys(sectionMeta).forEach((key) => {
      const [configType, section] = key.split('.');
      expect(baseTrackers[configType]?.[section], key).toBeDefined();
    });
  });

  it('never uses an em dash', () => {
    allStrings({ alertMeta, sectionMeta, alertAliases }).forEach((text) => {
      expect(text.includes('—'), text).toBe(false);
    });
  });
});
