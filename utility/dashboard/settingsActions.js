import { diffTrackers, resolveTrackers } from './trackerStore';

const trackerIn = (config, { configType, section, name }) =>
  section ? config[configType][section][name] : config[configType][name];

const withTracker = (config, tracker, update) => {
  const next = structuredClone(config);
  update(trackerIn(next, tracker));
  return next;
};

const withOption = (config, tracker, optionName, update) => withTracker(config, tracker, (ref) => {
  update(ref.options.find(({ name }) => name === optionName));
});

export const toggleTracker = (config, tracker) => withTracker(config, tracker, (ref) => {
  // A paired tracker shows one switch for itself and its only option, so turning it on must
  // switch both; turning it off only gates the tracker, like every other switch.
  if (tracker.paired && ref.options?.length === 1 && !tracker.on) {
    ref.checked = true;
    ref.options[0].checked = true;
  } else {
    ref.checked = !tracker.on;
  }
});

export const toggleOption = (config, tracker, optionName) =>
  withOption(config, tracker, optionName, (option) => { option.checked = !option.checked; });

export const setOptionValue = (config, tracker, optionName, value) =>
  withOption(config, tracker, optionName, (option) => { option.props.value = value; });

export const clampValue = (option, value) => {
  if (value === '' || Number.isNaN(Number(value))) return value;
  const { minValue, maxValue } = option?.props ?? {};
  let number = Number(value);
  if (minValue !== undefined) number = Math.max(minValue, number);
  if (maxValue !== undefined) number = Math.min(maxValue, number);
  // String(number) also normalises what a number field lets through, like "1e3" or "05".
  return String(number);
};

export const togglePickerItem = (config, tracker, optionName, key) =>
  withOption(config, tracker, optionName, (option) => { option.props.value[key] = !option.props.value[key]; });

export const setPickerAll = (config, tracker, optionName, on) =>
  withOption(config, tracker, optionName, (option) => {
    Object.keys(option.props.value).forEach((key) => { option.props.value[key] = on; });
  });

export const setPerWorld = (config, tracker, optionName, world, value) =>
  withOption(config, tracker, optionName, (option) => {
    option.props.perWorld = { ...(option.props.perWorld ?? {}) };
    if (value === '') delete option.props.perWorld[world];
    else option.props.perWorld[world] = value;
  });

export const clearPerWorld = (config, tracker, optionName) =>
  withOption(config, tracker, optionName, (option) => { option.props.perWorld = {}; });

export const setSectionOn = (config, section, on) => {
  const next = structuredClone(config);
  section.trackers.forEach((tracker) => {
    const ref = trackerIn(next, tracker);
    ref.checked = on;
    // Same rule as toggleTracker: a paired tracker only reads as on when its single option is on too.
    if (on && tracker.paired && ref.options?.length === 1) ref.options[0].checked = true;
  });
  return next;
};

export const resetPath = (base, config, prefix) => {
  if (!prefix) return resolveTrackers(base, {});
  const kept = Object.fromEntries(Object.entries(diffTrackers(base, config))
    .filter(([key]) => key !== prefix && !key.startsWith(`${prefix}.`)));
  return resolveTrackers(base, kept);
};

const actions = {
  toggleTracker, toggleOption, setOptionValue, togglePickerItem, setPickerAll, setPerWorld, clearPerWorld, setSectionOn
};

export const runAction = (base, config, name, ...args) => name === 'resetPath'
  ? resetPath(base, config, ...args)
  : actions[name](config, ...args);
