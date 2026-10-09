import { items as itemData } from '@website-data';
import { resolveSettingsTarget } from './settingsTarget';
import { allTrackers, fallbackLabel } from './settingsModel';
import { alertMeta } from './alertMeta';
import { sessionQuery } from '@utility/nav-query';

const WORLDS = [1, 2, 3, 4, 5, 6, 7];
const loose = (key) => String(key ?? '').replace(/[^a-z0-9]/gi, '').toLowerCase();

export const matchPickerKey = (option, key) => {
  const keys = Object.keys(option?.props?.value ?? {});
  if (keys.includes(String(key))) return String(key);
  return keys.find((candidate) => loose(candidate) === loose(key)) ?? null;
};

const itemLabel = (key, label) => label
  ?? itemData?.[key]?.displayName?.replace(/_/g, ' ')
  ?? fallbackLabel(key);

// The in-game name of a picker item, for tiles that only show its icon.
export const pickerItemLabel = (key) => itemLabel(key);

// What an alert icon is about, for its accessible name: the same title its quick edit shows, plus
// the item when the alert is about a single one. Reads the meta only, so it is cheap per icon.
export const alertLabel = (config, configType, target, { items = [] } = {}) => {
  const resolved = resolveSettingsTarget(config, configType, target);
  if (!resolved?.trackerName) return null;
  const meta = alertMeta[[configType, resolved.section, resolved.trackerName].filter(Boolean).join('.')] ?? {};
  const label = resolved.optionName
    ? meta.options?.[resolved.optionName]?.label ?? fallbackLabel(resolved.optionName)
    : meta.label ?? fallbackLabel(resolved.trackerName);
  return items.length === 1 ? `${label}: ${itemLabel(items[0].key, items[0].label)}` : label;
};

// Where an alert's page lives: the tracker's page with the option's own page merged over it, so an
// option usually only names its tab. Null when neither names a pathname.
export const alertPage = (config, configType, target) => {
  const resolved = resolveSettingsTarget(config, configType, target);
  if (!resolved?.trackerName) return null;
  const meta = alertMeta[[configType, resolved.section, resolved.trackerName].filter(Boolean).join('.')] ?? {};
  const page = { ...meta.page, ...meta.options?.[resolved.optionName]?.page };
  if (!page.pathname) return null;
  return { pathname: page.pathname, query: page.query ?? {}, label: page.label ?? meta.label ?? fallbackLabel(resolved.trackerName) };
};

// `query` is the current route's, so a demo or profile session survives the hop.
export const pageHref = (page, query) => {
  const params = new URLSearchParams({ ...sessionQuery(query), ...page.query }).toString();
  return params ? `${page.pathname}?${params}` : page.pathname;
};

const watchedItems = (option, items) => items.reduce((res, { key, label }) => {
  const match = matchPickerKey(option, key);
  if (!match || res.some((item) => item.key === match)) return res;
  return [...res, { key: match, label: itemLabel(match, label), on: Boolean(option.props.value[match]) }];
}, []);

const worldRows = (option, worlds) => {
  const perWorld = option.props.perWorld ?? {};
  return WORLDS.filter((world) => worlds.includes(world)).map((world) => {
    const overridden = perWorld[world] != null && perWorld[world] !== '';
    return { world, value: overridden ? perWorld[world] : null, overridden };
  });
};

const kindOf = (tracker, option, watched, rows) => {
  if (tracker.paired || !option) return 'tracker';
  if (option.type === 'array') return watched.length ? 'pickerItems' : 'picker';
  if (option.type === 'input') return option.props?.perWorld && rows.length ? 'perWorld' : 'threshold';
  return 'checkbox';
};

export const buildQuickEdit = (config, model, configType, target, { items = [], worlds = [] } = {}) => {
  const resolved = resolveSettingsTarget(config, configType, target);
  if (!resolved?.trackerName) return null;
  const path = [configType, resolved.section, resolved.trackerName].filter(Boolean).join('.');
  const tracker = allTrackers(model).find((candidate) => candidate.path === path);
  if (!tracker) return null;

  const named = tracker.options.find(({ name }) => name === resolved.optionName) ?? null;
  // Timer targets name only the tracker, so a timer that passes an item finds its picker that way.
  const option = named ?? (items.length
    ? tracker.options.find((candidate) => candidate.type === 'array' && items.some(({ key }) => matchPickerKey(candidate, key)))
    ?? null
    : null);
  const watched = option?.type === 'array' ? watchedItems(option, items) : [];
  const rows = option?.type === 'input' && option.props?.perWorld ? worldRows(option, worlds) : [];
  const kind = kindOf(tracker, option, watched, rows);
  const shown = kind === 'tracker'
    ? tracker.options.find(({ name }) => name === tracker.inline) ?? null
    : option;

  return {
    kind,
    tracker,
    option: shown,
    parent: shown?.dependsOn ? tracker.options.find(({ name }) => name === shown.dependsOn) ?? null : null,
    dependents: shown ? tracker.options.filter(({ dependsOn }) => dependsOn === shown.name) : [],
    folded: shown ? tracker.options.filter(({ foldInto }) => foldInto === shown.name) : [],
    items: kind === 'pickerItems' ? watched : [],
    worlds: kind === 'perWorld' ? rows : [],
    everyCharacter: configType === 'characters',
    // A timer's switch is its only control, except an input option keeps its own checkbox.
    trackerSwitch: kind === 'tracker' || (configType === 'timers' && option?.type !== 'input'),
    page: alertPage(config, configType, target),
    configType,
    target
  };
};
