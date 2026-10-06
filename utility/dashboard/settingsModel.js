import { alertMeta, sectionMeta } from './alertMeta';
import { isSectioned } from './trackerStore';

export const CONFIG_TABS = [
  { configType: 'account', label: 'Account' },
  { configType: 'characters', label: 'Characters' },
  { configType: 'timers', label: 'Timers' }
];

export const FILTERS = ['all', 'on', 'off', 'edited', 'threshold'];

// camelToTitleCase splits on digits, so names carrying one read wrong without an override.
const labelOverrides = { p2wUpgrades: 'P2W Upgrades', killRoy: 'Killroy' };
export const fallbackLabel = (name) => labelOverrides[name] ?? name?.camelToTitleCase();

const isEdited = (edits, path) => Object.keys(edits).some((key) => key === path || key.startsWith(`${path}.`));
const isOnOff = (option) => option.type !== 'input' && option.type !== 'array';

const buildTracker = (configType, section, name, tracker, baseTracker, edits) => {
  const path = [configType, section, name].filter(Boolean).join('.');
  const meta = alertMeta[path] ?? {};
  const options = (tracker.options ?? []).map((option, index) => {
    const optionMeta = meta.options?.[option.name] ?? {};
    const baseOption = baseTracker?.options?.find(({ name: baseName }) => baseName === option.name);
    return {
      ...option,
      index,
      path: `${path}.${option.name}`,
      label: optionMeta.label ?? fallbackLabel(option.name),
      help: optionMeta.help ?? null,
      unit: optionMeta.unit ?? option.props?.endAdornment ?? null,
      group: optionMeta.group ?? null,
      dependsOn: optionMeta.dependsOn ?? null,
      foldInto: optionMeta.foldInto ?? null,
      edited: edits[`${path}.${option.name}`] !== undefined,
      defaultValue: baseOption?.props?.value,
      defaultChecked: Boolean(baseOption?.checked)
    };
  });
  const counted = options.filter((option) => !option.foldInto);
  const compact = options.length === 0 || (options.length === 1 && isOnOff(options[0]));
  // One switch stands for the tracker and its only option, so the option's checkbox (which the
  // alert code gates on) is never shown on its own: a compact row, or a card whose only option
  // is the inline number.
  const paired = options.length === 1 && (compact || meta.inline === options[0].name);
  return {
    configType,
    section,
    name,
    path,
    label: meta.label ?? fallbackLabel(name),
    icon: meta.icon ?? null,
    // Clicker timers name the character that owns them here (Orion, Poppy, Bubba).
    unit: meta.unit ?? null,
    inline: meta.inline ?? null,
    link: meta.link ?? null,
    checked: Boolean(tracker.checked),
    on: Boolean(tracker.checked) && (paired ? Boolean(options[0].checked) : true),
    compact,
    paired,
    options,
    onCount: counted.filter((option) => option.checked).length,
    total: counted.length,
    hasThreshold: options.some((option) => option.type === 'input'),
    edited: isEdited(edits, path)
  };
};

const buildTab = (config, base, configType, edits) => {
  const root = config?.[configType] ?? {};
  const baseRoot = base?.[configType] ?? {};
  const sections = isSectioned(root) ? Object.entries(root) : [[null, root]];
  return sections.map(([section, trackers]) => {
    const key = [configType, section].filter(Boolean).join('.');
    const baseTrackersOfSection = section ? baseRoot[section] : baseRoot;
    const items = Object.entries(trackers ?? {}).map(([name, tracker]) =>
      buildTracker(configType, section, name, tracker, baseTrackersOfSection?.[name], edits));
    return {
      key,
      configType,
      section,
      label: sectionMeta[key]?.label ?? section ?? CONFIG_TABS.find((tab) => tab.configType === configType)?.label,
      icon: sectionMeta[key]?.icon ?? null,
      trackers: items,
      onCount: items.filter((item) => item.on).length,
      total: items.length,
      edited: items.some((item) => item.edited)
    };
  });
};

export const buildModel = (config, base, edits) => CONFIG_TABS.map((tab) => {
  const sections = buildTab(config, base, tab.configType, edits);
  return { ...tab, sections, edited: sections.some((section) => section.edited) };
});

export const allTrackers = (model) => model.flatMap((tab) => tab.sections.flatMap((section) => section.trackers));

export const matchesFilter = (tracker, filter) => {
  if (filter === 'on') return tracker.on;
  if (filter === 'off') return !tracker.on;
  if (filter === 'edited') return tracker.edited;
  if (filter === 'threshold') return tracker.hasThreshold;
  return true;
};

export const searchModel = (model, query) => {
  const words = String(query ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hit = (...texts) => {
    const haystack = texts.filter(Boolean).join(' ').toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
  const results = [];
  model.forEach((tab) => tab.sections.forEach((section) => section.trackers.forEach((tracker) => {
    if (hit(section.label, tracker.label, tracker.name)) results.push({ tab, section, tracker, option: null });
    tracker.options.forEach((option) => {
      if (option.foldInto) return;
      if (hit(tracker.label, option.label, option.help, option.name)) results.push({ tab, section, tracker, option });
    });
  })));
  return results;
};

// What an option row needs from its tracker: the options folded into it, and why it is locked.
export const optionExtras = (tracker, option) => {
  const parent = option.dependsOn ? tracker.options.find(({ name }) => name === option.dependsOn) : null;
  return {
    foldedOptions: tracker.options.filter(({ foldInto }) => foldInto === option.name),
    disabledReason: parent && !parent.checked ? `Turn on ${parent.label} to use this.` : null
  };
};
