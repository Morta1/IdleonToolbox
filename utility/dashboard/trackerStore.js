import { migrateConfig } from '@utility/migrations';

export const TRACKERS_SCHEMA = 2;

// Old path -> new path, for when an option or tracker is renamed after R1.
export const RENAMED_PATHS = {};

const CONFIG_TYPES = ['account', 'characters', 'timers'];

// Characters is a flat map of trackers; account and timers group them under sections.
export const isSectioned = (root) => {
  const first = root ? Object.values(root)[0] : null;
  return Boolean(first) && typeof first === 'object' && !('checked' in first);
};

export const forEachTracker = (config, fn) => {
  CONFIG_TYPES.forEach((type) => {
    const root = config?.[type];
    if (!root) return;
    if (isSectioned(root)) {
      Object.entries(root).forEach(([section, trackers]) => {
        Object.entries(trackers || {}).forEach(([name, tracker]) => fn(`${type}.${section}.${name}`, tracker, type, section, name));
      });
    } else {
      Object.entries(root).forEach(([name, tracker]) => fn(`${type}.${name}`, tracker, type, null, name));
    }
  });
};

export const getTracker = (config, type, section, name) =>
  section ? config?.[type]?.[section]?.[name] : config?.[type]?.[name];

const renameEdits = (edits) => Object.fromEntries(Object.entries(edits || {})
  .map(([path, edit]) => [RENAMED_PATHS[path] ?? path, edit]));

const sameScalar = (a, b) => String(a ?? '') === String(b ?? '');

export const resolveTrackers = (base, edits = {}) => {
  const resolved = structuredClone({ account: base.account, characters: base.characters, timers: base.timers });
  const current = renameEdits(edits);
  forEachTracker(resolved, (path, tracker) => {
    const trackerEdit = current[path];
    if (trackerEdit && 'checked' in trackerEdit) tracker.checked = trackerEdit.checked;
    tracker.options?.forEach((option) => {
      const edit = current[`${path}.${option.name}`];
      if (!edit) return;
      if ('checked' in edit) option.checked = edit.checked;
      if ('value' in edit && option.props) {
        if (option.type === 'array') {
          // Only items the game still has: removed ones drop out, new ones keep their default.
          if (edit.value && typeof edit.value === 'object') Object.keys(option.props.value).forEach((key) => {
            if (key in edit.value) option.props.value[key] = edit.value[key];
          });
        } else {
          option.props.value = edit.value;
        }
      }
      if ('perWorld' in edit && option.props) option.props.perWorld = { ...edit.perWorld };
    });
  });
  return { ...resolved, version: base.version };
};

export const diffTrackers = (base, config) => {
  const edits = {};
  forEachTracker(base, (path, baseTracker, type, section, name) => {
    const tracker = getTracker(config, type, section, name);
    if (!tracker) return;
    if (Boolean(tracker.checked) !== Boolean(baseTracker.checked)) edits[path] = { checked: Boolean(tracker.checked) };
    baseTracker.options?.forEach((baseOption) => {
      const option = tracker.options.find((candidate) => candidate?.name === baseOption.name);
      if (!option) return;
      const edit = {};
      if (Boolean(option.checked) !== Boolean(baseOption.checked)) edit.checked = Boolean(option.checked);
      const baseValue = baseOption.props?.value;
      const value = option.props?.value;
      if (baseOption.type === 'array') {
        const changed = Object.keys(baseValue || {})
          .filter((key) => key in (value || {}) && Boolean(value[key]) !== Boolean(baseValue[key]));
        if (changed.length) edit.value = Object.fromEntries(changed.map((key) => [key, Boolean(value[key])]));
      } else if (baseOption.props && value !== undefined && !sameScalar(value, baseValue)) {
        edit.value = value;
      }
      const perWorld = option.props?.perWorld;
      if (baseOption.props?.perWorld && perWorld && Object.keys(perWorld).length) edit.perWorld = { ...perWorld };
      if (Object.keys(edit).length) edits[`${path}.${baseOption.name}`] = edit;
    });
  });
  return edits;
};

export const toStoredTrackers = (base, config) => ({ schema: TRACKERS_SCHEMA, edits: diffTrackers(base, config) });

export const LEGACY_BACKUP_KEY = 'trackers-legacy-backup';

// Options added in R1 that used to ride on another option: a user who had that one off keeps the
// new alert hidden too.
export const SEEDED_OPTIONS = [
  { type: 'account', section: 'World 5', tracker: 'gaming', option: 'drops', from: 'sprouts' },
  { type: 'characters', section: null, tracker: 'cards', option: 'passiveCards', from: 'cardSet' }
];

// Before R1, turning a tracker off also unticked every option and picker item under it, and turning
// it back on set them all to true. So option states under an off tracker were never observable and
// not the user's choices: keep only the switch (plus scalar values and per-world thresholds, which
// the cascade never touched). Re-enabling now gives the defaults.
const dropUnderOffTrackers = (base, migrated, edits) => {
  forEachTracker(base, (path, baseTracker, type, section, name) => {
    if (getTracker(migrated, type, section, name)?.checked !== false) return;
    baseTracker.options?.forEach((option) => {
      const key = `${path}.${option.name}`;
      if (!edits[key]) return;
      delete edits[key].checked;
      if (option.type === 'array') delete edits[key].value;
      if (!Object.keys(edits[key]).length) delete edits[key];
    });
  });
};

// Seeded from the final edits so an option whose edit the cascade removed does not hide the new one.
const seedNewOptions = (edits) => {
  SEEDED_OPTIONS.forEach(({ type, section, tracker, option, from }) => {
    const trackerPath = [type, section, tracker].filter(Boolean).join('.');
    if (edits[`${trackerPath}.${from}`]?.checked === false) edits[`${trackerPath}.${option}`] = { checked: false };
  });
};

export const convertLegacyTrackers = (base, legacy) => {
  const migrated = migrateConfig(base, structuredClone(legacy));
  const edits = diffTrackers(base, migrated);
  dropUnderOffTrackers(base, migrated, edits);
  seedNewOptions(edits);
  return edits;
};

export const loadTrackers = (base, stored) => {
  if (!stored || !Object.keys(stored).length) {
    return { config: resolveTrackers(base, {}), stored: { schema: TRACKERS_SCHEMA, edits: {} }, status: 'empty' };
  }
  if (stored.schema === TRACKERS_SCHEMA) {
    return { config: resolveTrackers(base, stored.edits || {}), stored, status: 'current' };
  }
  try {
    const edits = convertLegacyTrackers(base, stored);
    return {
      config: resolveTrackers(base, edits),
      stored: { schema: TRACKERS_SCHEMA, edits },
      status: 'converted',
      legacy: stored
    };
  } catch (error) {
    // Exactly what the page did before R1, so a conversion bug can never change someone's alerts.
    try {
      const migrated = migrateConfig(base, stored);
      return {
        config: { account: migrated.account, characters: migrated.characters, timers: migrated.timers, version: base.version },
        stored: null,
        status: 'failed',
        error
      };
    } catch {
      return { config: resolveTrackers(base, {}), stored: null, status: 'failed', error };
    }
  }
};
