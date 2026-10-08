# Dashboard alert settings R2 (settings window) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the nested-collapse "Configure alerts" dialog with the redesigned window from the mockups: section menu, alert cards, search, filters, Edited tags, resets with Undo, empty and error states, full-screen mobile layout.

**Architecture:** Two pure modules carry all logic: `settingsModel.js` turns the resolved config, `baseTrackers` and the user's edits into a view model (labels from `alertMeta`, counts, Edited flags, filters, search), and `settingsActions.js` returns a new config for every user action. React components under `components/dashboard/settings/` only render the model and call actions; `DashboardSettings.jsx` stays the entry the page imports. Saving is unchanged from R1: the page diffs the config into edits.

**Tech Stack:** Next.js 16 pages router (static export), React 19 + React Compiler, MUI v6, `@mantine/hooks`, Vitest (`node` + `jsdom` projects), Playwright on the static export.

**Spec:** `docs/superpowers/specs/2026-10-06-dashboard-alert-settings-design.md` (sections 2-3, Decisions). **Mockups:** https://claude.ai/artifact/CfkcAvNyvhdQXWNWN7ZqKq

## Global Constraints

- Branch `feat/dashboard-alert-settings`. One commit per task (husky pre-commit runs `npm test`, ~50 s: use a 300000 ms timeout; on an `index.lock` error wait a second and retry). Never push, stash, reset or checkout.
- Saved format and `utility/dashboard/trackerStore.js` behaviour do not change. Display text comes only from `utility/dashboard/alertMeta.js` (`alertMeta`, `sectionMeta`, written in R2a), falling back to the camelCase key.
- A switch turns a whole alert (tracker) on or off; a checkbox is one option. The tracker switch never changes its options. Exception, compact rows only: a tracker with exactly one on/off option shows one switch; turning it on sets both the tracker and the option on, turning it off sets only the tracker off.
- Edited means the path has an entry in `diffTrackers(baseTrackers, config)`. Counts on chips and in the menu count alerts (trackers). While searching, counts are results.
- No `localStorage` in render; `useMediaQuery` without `noSsr`; first render identical on build and client.
- No `useMemo` / `useCallback` / IIFEs (React Compiler). Comments few, why not what. No em dashes in UI copy, comments or messages. Tooltips only on an InfoIcon, never on plain text.
- Colors: theme tokens only (`primary.main`, `text.secondary`, `action.selected`, `divider`, `background.paper`); the Edited tag uses `primary`, never `warning`.
- Touch targets at least 44 px below `sm`. Every icon-only button has an `aria-label`; picker tiles and toggle chips use `aria-pressed`; More/Less and expand buttons use `aria-expanded`.
- MUI v6 prop names: `inputProps` on Switch/Checkbox, `slotProps.htmlInput` / `slotProps.input` on TextField, `PaperProps` on Dialog, `ContentProps` on Snackbar. Switches carry no `aria-pressed` (their checked state is the ARIA state).
- Component tests start with `// @vitest-environment jsdom`, import `'../../polyfills'`, wrap renders in `<ThemeProvider theme={darkTheme}>` (`styles/theme/darkTheme`), and query the render's own `container` (not `screen`: stale under `isolate: false`).
- `npx vitest run <files>` and `npx eslint <files>` from `IdleonToolbox/` (`npm run lint` is broken on Next 16).

## File Structure

| File | Responsibility |
|---|---|
| Modify `utility/dashboard/trackerStore.js` | Export `isSectioned` (shared with the model) |
| Create `utility/dashboard/settingsModel.js` | View model: labels, counts, Edited, compact rows, filters, search |
| Create `utility/dashboard/settingsActions.js` | Pure config updates for every control, bulk actions and resets |
| Create `components/dashboard/settings/EditedTag.jsx` | Edited and Off tags, edited dot |
| Create `components/dashboard/settings/OptionRow.jsx` | One option: checkbox, number, picker tiles, toggle chips, per-world, More/Less |
| Create `components/dashboard/settings/TrackerCard.jsx` | Alert card and compact row |
| Create `components/dashboard/settings/SectionPane.jsx` | One section: header actions, compact grid, cards, empty state |
| Create `components/dashboard/settings/SettingsNav.jsx` | Tabs, sections, long-section tracker links |
| Create `components/dashboard/settings/SearchResults.jsx` | Flat results with breadcrumbs, no-results state |
| Create `components/dashboard/settings/useHighlightTarget.js` | Scroll-to and fade tint (moved from DashboardSettings.jsx) |
| Rewrite `components/common/DashboardSettings.jsx` | Window shell: header, chips, layout, undo, reset-all confirm, import errors, deep link |
| Modify `components/common/DownloadButton.jsx` | `onInvalidFile` callback |
| Modify `pages/dashboard.jsx` | One-time defaults note |
| Delete `utility/dashboard/applySettingChange.js` and its test | Replaced by `settingsActions.js` |
| Tests in `__test__/utility/` and `__test__/components/settings/` | See each task |

---

### Task 1: View model

**Files:**
- Modify: `utility/dashboard/trackerStore.js` (export `isSectioned`)
- Create: `utility/dashboard/settingsModel.js`
- Test: `__test__/utility/settings-model.test.js`

**Interfaces:**
- Consumes: `baseTrackers`; `resolveTrackers`, `diffTrackers`, `isSectioned` from `trackerStore`; `alertMeta`, `sectionMeta` from `alertMeta`.
- Produces:
  - `CONFIG_TABS = [{ configType: 'account', label: 'Account' }, { configType: 'characters', label: 'Characters' }, { configType: 'timers', label: 'Timers' }]`
  - `FILTERS = ['all', 'on', 'off', 'edited', 'threshold']`
  - `fallbackLabel(name) => string`
  - `buildModel(config, base, edits) => Tab[]` where `Tab = { configType, label, edited, sections: Section[] }`, `Section = { key, configType, section, label, icon, trackers: Tracker[], onCount, total, edited }`, `Tracker = { configType, section, name, path, label, icon, unit, inline, checked, on, compact, options: Option[], onCount, total, hasThreshold, edited }`, `Option = { ...configOption, index, path, label, help, unit, group, dependsOn, foldInto, edited, defaultValue, defaultChecked }`
  - `matchesFilter(tracker, filter) => boolean`
  - `allTrackers(model) => Tracker[]`
  - `searchModel(model, query) => Result[]`, `Result = { tab, section, tracker, option | null }`

- [ ] **Step 1: Write the failing tests**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel, matchesFilter, searchModel } from '@utility/dashboard/settingsModel';

const modelFor = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
};
const tracker = (model, path) => allTrackers(model).find((candidate) => candidate.path === path);

describe('buildModel', () => {
  it('has the three tabs and every tracker once', () => {
    const model = modelFor();
    expect(model.map(({ configType }) => configType)).toEqual(['account', 'characters', 'timers']);
    expect(allTrackers(model)).toHaveLength(98);
    expect(model[1].sections).toHaveLength(1);
  });

  it('labels from alertMeta, never the raw key for a known tracker', () => {
    const construction = tracker(modelFor(), 'account.World 3.construction');
    expect(construction.label).toBeTruthy();
    expect(construction.options.every(({ label }) => label && !/[A-Z][a-z]+[A-Z]/.test(label))).toBe(true);
  });

  it('marks edited paths and keeps the default next to the value', () => {
    const model = modelFor({ 'account.World 3.construction.matsThreshold': { value: 4 } });
    const construction = tracker(model, 'account.World 3.construction');
    const option = construction.options.find(({ name }) => name === 'matsThreshold');
    expect(construction.edited).toBe(true);
    expect(option.edited).toBe(true);
    expect(option.defaultValue).toBe(0);
    expect(model[0].edited).toBe(true);
    expect(model[0].sections.find(({ section }) => section === 'World 3').edited).toBe(true);
    expect(model[1].edited).toBe(false);
  });

  it('counts options without folded ones and alerts per section', () => {
    const model = modelFor({ 'account.World 3.library': { checked: false } });
    const world3 = model[0].sections.find(({ section }) => section === 'World 3');
    expect(world3.onCount).toBe(world3.total - 1);
    const construction = tracker(model, 'account.World 3.construction');
    expect(construction.total).toBe(construction.options.filter(({ foldInto }) => !foldInto).length);
  });

  it('makes single on/off option trackers compact and reads them as on only when both are on', () => {
    const off = tracker(modelFor({ 'characters.bags.unmaxedBags': { checked: false } }), 'characters.bags');
    expect(off.compact).toBe(true);
    expect(off.checked).toBe(true);
    expect(off.on).toBe(false);
    expect(tracker(modelFor(), 'timers.General.daily').compact).toBe(true);
    expect(tracker(modelFor(), 'account.World 3.library').compact).toBe(false);
  });
});

describe('matchesFilter', () => {
  it('filters by on, off, edited and threshold', () => {
    const model = modelFor({ 'account.World 3.traps': { checked: false }, 'account.World 3.library.books': { value: 30 } });
    const traps = tracker(model, 'account.World 3.traps');
    const library = tracker(model, 'account.World 3.library');
    expect(matchesFilter(traps, 'off')).toBe(true);
    expect(matchesFilter(traps, 'on')).toBe(false);
    expect(matchesFilter(library, 'edited')).toBe(true);
    expect(matchesFilter(library, 'threshold')).toBe(true);
    expect(matchesFilter(traps, 'all')).toBe(true);
  });
});

describe('searchModel', () => {
  it('finds options by words in their label or help, across tabs', () => {
    const results = searchModel(modelFor(), 'salt');
    const where = results.map(({ tab, tracker: found }) => `${tab.configType}:${found.name}`);
    expect(where).toContain('account:construction');
    expect(where).toContain('timers:closestSalt');
  });

  it('needs every word to match and ignores case and extra spaces', () => {
    expect(searchModel(modelFor(), '  ROYAL   guardian ').length).toBeGreaterThan(0);
    expect(searchModel(modelFor(), 'royal zzzz')).toEqual([]);
    expect(searchModel(modelFor(), '   ')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/utility/settings-model.test.js`
Expected: FAIL, "Failed to resolve import @utility/dashboard/settingsModel"

- [ ] **Step 3: Export `isSectioned` from `trackerStore.js`**

Change `const isSectioned = (root) => {` to `export const isSectioned = (root) => {`.

- [ ] **Step 4: Write `utility/dashboard/settingsModel.js`**

```js
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
    checked: Boolean(tracker.checked),
    on: Boolean(tracker.checked) && (options.length === 1 && compact ? Boolean(options[0].checked) : true),
    compact,
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
```

- [ ] **Step 5: Run the tests and lint**

Run: `npx vitest run __test__/utility/settings-model.test.js __test__/utility/tracker-store.test.js`
Expected: PASS
Run: `npx eslint utility/dashboard/settingsModel.js utility/dashboard/trackerStore.js`

- [ ] **Step 6: Commit**

```bash
git add utility/dashboard/settingsModel.js utility/dashboard/trackerStore.js __test__/utility/settings-model.test.js
git commit -m "Dashboard: view model for the alert settings window"
```

---

### Task 2: Actions

**Files:**
- Create: `utility/dashboard/settingsActions.js`
- Test: `__test__/utility/settings-actions.test.js`

**Interfaces:**
- Consumes: Task 1 `Tracker` objects (`configType`, `section`, `name`, `compact`, `on`, `options`); `resolveTrackers`, `diffTrackers`.
- Produces (every function returns a new config, never mutates its input):
  - `toggleTracker(config, tracker)`
  - `toggleOption(config, tracker, optionName)`
  - `setOptionValue(config, tracker, optionName, value)`
  - `clampValue(option, value) => value` (string in, string out; `''` stays `''`)
  - `togglePickerItem(config, tracker, optionName, key)`
  - `setPickerAll(config, tracker, optionName, on)`
  - `setPerWorld(config, tracker, optionName, world, value)` (`''` removes the override)
  - `clearPerWorld(config, tracker, optionName)`
  - `setSectionOn(config, section, on)`
  - `resetPath(base, config, prefix)` (`prefix` = tracker path, option path, section key, or `null` for everything)

- [ ] **Step 1: Write the failing tests**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import {
  clampValue, clearPerWorld, resetPath, setOptionValue, setPerWorld, setPickerAll, setSectionOn,
  toggleOption, togglePickerItem, toggleTracker
} from '@utility/dashboard/settingsActions';

const setup = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  const model = buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
  const find = (path) => allTrackers(model).find((candidate) => candidate.path === path);
  return { config, model, find };
};
const edits = (config) => diffTrackers(baseTrackers, config);

describe('settingsActions', () => {
  it('toggleTracker gates the alert and leaves its options alone', () => {
    const { config, find } = setup({ 'account.World 1.stamps.gildedStamps': { checked: false } });
    const next = toggleTracker(config, find('account.World 1.stamps'));
    expect(edits(next)).toEqual({
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.gildedStamps': { checked: false }
    });
    expect(config.account['World 1'].stamps.checked).toBe(true);
  });

  it('a compact row turns both the tracker and its one option on', () => {
    const { config, find } = setup({ 'characters.bags.unmaxedBags': { checked: false } });
    const next = toggleTracker(config, find('characters.bags'));
    expect(edits(next)).toEqual({});
    const off = toggleTracker(next, setup().find('characters.bags'));
    expect(edits(off)).toEqual({ 'characters.bags': { checked: false } });
  });

  it('options, values, pickers and per-world overrides', () => {
    const { config, find } = setup();
    const stamps = find('account.World 1.stamps');
    expect(edits(toggleOption(config, stamps, 'gildedStamps'))).toEqual({ 'account.World 1.stamps.gildedStamps': { checked: false } });
    expect(edits(setOptionValue(config, stamps, 'affordableStampLevels', '40'))).toEqual({ 'account.World 1.stamps.affordableStampLevels': { value: '40' } });

    const construction = find('account.World 3.construction');
    const salt = Object.keys(construction.options.find(({ name }) => name === 'materials').props.value)[0];
    expect(edits(togglePickerItem(config, construction, 'materials', salt))['account.World 3.construction.materials']).toEqual({ value: { [salt]: false } });
    const none = setPickerAll(config, construction, 'materials', false);
    expect(Object.values(none.account['World 3'].construction.options.find(({ name }) => name === 'materials').props.value).every((v) => v === false)).toBe(true);

    const rg = find('account.World 7.royalGuardian');
    const withOverride = setPerWorld(config, rg, 'tradeRank', 3, '15');
    expect(edits(withOverride)['account.World 7.royalGuardian.tradeRank']).toEqual({ perWorld: { 3: '15' } });
    expect(edits(setPerWorld(withOverride, rg, 'tradeRank', 3, ''))).toEqual({});
    expect(edits(clearPerWorld(withOverride, rg, 'tradeRank'))).toEqual({});
  });

  it('clampValue keeps a number inside its option range', () => {
    const { find } = setup();
    const food = find('account.World 3.equinox').options.find(({ name }) => name === 'foodLust');
    expect(clampValue(food, '20')).toBe('14');
    expect(clampValue(food, '0')).toBe('1');
    expect(clampValue(food, '7')).toBe('7');
    expect(clampValue(food, '')).toBe('');
    expect(clampValue(food, 'abc')).toBe('abc');
  });

  it('setSectionOn switches every alert of a section', () => {
    const { config, model } = setup();
    const world3 = model[0].sections.find(({ section }) => section === 'World 3');
    const next = setSectionOn(config, world3, false);
    expect(Object.values(next.account['World 3']).every(({ checked }) => checked === false)).toBe(true);
    expect(next.account['World 2'].alchemy.checked).toBe(true);
  });

  it('resetPath clears edits under a prefix only', () => {
    const { config } = setup({
      'account.World 3.library.books': { value: 30 },
      'account.World 3.traps': { checked: false },
      'account.World 1.stamps': { checked: false }
    });
    expect(edits(resetPath(baseTrackers, config, 'account.World 3.library.books'))).toEqual({
      'account.World 3.traps': { checked: false },
      'account.World 1.stamps': { checked: false }
    });
    expect(edits(resetPath(baseTrackers, config, 'account.World 3'))).toEqual({ 'account.World 1.stamps': { checked: false } });
    expect(edits(resetPath(baseTrackers, config, null))).toEqual({});
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/utility/settings-actions.test.js`
Expected: FAIL, "Failed to resolve import @utility/dashboard/settingsActions"

- [ ] **Step 3: Write `utility/dashboard/settingsActions.js`**

```js
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
  // A compact row shows one switch for the tracker and its only option, so turning it on must
  // switch both; turning it off only gates the tracker, like every other switch.
  if (tracker.compact && ref.options?.length === 1 && !tracker.on) {
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
  return number === Number(value) ? value : String(number);
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
  section.trackers.forEach((tracker) => { trackerIn(next, tracker).checked = on; });
  return next;
};

export const resetPath = (base, config, prefix) => {
  if (!prefix) return resolveTrackers(base, {});
  const kept = Object.fromEntries(Object.entries(diffTrackers(base, config))
    .filter(([key]) => key !== prefix && !key.startsWith(`${prefix}.`)));
  return resolveTrackers(base, kept);
};
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run __test__/utility/settings-actions.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add utility/dashboard/settingsActions.js __test__/utility/settings-actions.test.js
git commit -m "Dashboard: pure actions for the alert settings window"
```

---

### Task 3: Small pieces: tags, highlight hook, upload errors

**Files:**
- Create: `components/dashboard/settings/EditedTag.jsx`
- Create: `components/dashboard/settings/useHighlightTarget.js`
- Modify: `components/common/DownloadButton.jsx`
- Test: `__test__/components/settings/edited-tag.test.jsx`

**Interfaces:**
- Produces: `EditedTag` (default), `OffTag`, `EditedDot` (named exports; `EditedDot` renders hidden text "has edits"); `useHighlightTarget(active) => [ref, highlighted]` (same behaviour as the hook in today's `DashboardSettings.jsx`, `HIGHLIGHT_DURATION = 1600`); `FileUploadButton` new optional prop `onInvalidFile(fileName)`, called when the file is not JSON.

- [ ] **Step 1: Write the failing test**

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import EditedTag, { EditedDot, OffTag } from '@components/dashboard/settings/EditedTag';

const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>);

describe('settings tags', () => {
  it('Edited and Off tags render their words', () => {
    const { container } = renderIn(<><EditedTag/><OffTag/><OffTag kept/></>);
    expect(container.textContent).toContain('Edited');
    expect(container.textContent).toContain('Off');
    expect(container.textContent).toContain('Off: settings kept');
  });

  it('the edited dot carries text for screen readers', () => {
    const { container } = renderIn(<EditedDot/>);
    expect(container.textContent).toBe('has edits');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run __test__/components/settings/edited-tag.test.jsx`
Expected: FAIL, "Failed to resolve import"

- [ ] **Step 3: Write the pieces**

`components/dashboard/settings/EditedTag.jsx`:

```jsx
import React from 'react';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';

const tagSx = {
  display: 'inline-flex', alignItems: 'center', gap: 0.75, ml: 1, px: 0.875, py: 0.25,
  borderRadius: 1, fontSize: 11, fontWeight: 500, lineHeight: 1.4, verticalAlign: 2
};

export const EditedDot = () => <Box component="span" sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }}>
  <Box component="span" sx={visuallyHidden}>has edits</Box>
</Box>;

export const OffTag = ({ kept }) => <Box component="span" sx={{ ...tagSx, color: 'text.primary', bgcolor: 'action.hover' }}>
  {kept ? 'Off: settings kept' : 'Off'}
</Box>;

const EditedTag = () => <Box component="span" sx={{ ...tagSx, color: 'primary.light', bgcolor: 'action.selected' }}>
  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }}/>
  Edited
</Box>;

export default EditedTag;
```

`EditedDot`'s hidden text sits inside the dot, so its `textContent` is exactly "has edits".

`components/dashboard/settings/useHighlightTarget.js` (moved verbatim from `DashboardSettings.jsx`):

```js
import { useEffect, useRef, useState } from 'react';

// How long the setting an alert pointed at stays tinted after the window opens on it.
export const HIGHLIGHT_DURATION = 1600;

// Scrolls the row a dashboard alert asked for into view and fades its tint out again.
export const useHighlightTarget = (active) => {
  const ref = useRef(null);
  const [highlighted, setHighlighted] = useState(active);

  useEffect(() => {
    if (!active || !ref.current) return;
    ref.current.scrollIntoView({ block: 'center' });
    const timeout = setTimeout(() => setHighlighted(false), HIGHLIGHT_DURATION);
    return () => clearTimeout(timeout);
  }, [active]);

  return [ref, highlighted];
};
```

`components/common/DownloadButton.jsx`: accept `onInvalidFile` and call it with the file name when parsing fails:

```jsx
const FileUploadButton = ({ children, onFileUpload, onInvalidFile }) => {
```

```js
        const parsed = tryToParse(e.target.result);
        if (typeof parsed !== 'string') {
          onFileUpload?.(parsed, selectedFile.name);
        } else {
          onInvalidFile?.(selectedFile.name);
        }
        fileInputRef.current.value = '';
```

- [ ] **Step 4: Run the test and lint**

Run: `npx vitest run __test__/components/settings/edited-tag.test.jsx`
Expected: PASS
Run: `npx eslint components/dashboard/settings components/common/DownloadButton.jsx`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/settings components/common/DownloadButton.jsx __test__/components/settings/edited-tag.test.jsx
git commit -m "Dashboard: settings tags, highlight hook and import file errors"
```

---

### Task 4: Option row

**Files:**
- Create: `components/dashboard/settings/OptionRow.jsx`
- Test: `__test__/components/settings/option-row.test.jsx`

**Interfaces:**
- Consumes: Task 1 `Option`, `Tracker`; Task 2 actions; Task 3 `EditedTag`, `useHighlightTarget`.
- Produces: `OptionRow` (default) with props `{ option, tracker, foldedOptions = [], disabledReason = null, highlight = false, onAction }`, where `onAction(actionName, ...args)` is supplied by the dialog and calls `settingsActions[actionName](config, ...args)`. Option kinds: on/off (checkbox), `input` (checkbox + number with unit, "Default N · Reset" when edited, clamp on blur, error text when out of range), `input` with `props.perWorld` (adds "Per world" disclosure with W1-W7 labelled inputs and a summary), `array` with `props.type === 'img'` (icon tiles with All/None and `n/total`), other `array` (toggle chips, multi-select). Help text clamps to one line with More/Less when longer than 90 characters.

- [ ] **Step 1: Write the failing tests**

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import OptionRow from '@components/dashboard/settings/OptionRow';

const trackerFor = (path, edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return allTrackers(buildModel(config, baseTrackers, diffTrackers(baseTrackers, config))).find((t) => t.path === path);
};
const renderRow = (tracker, optionName, extra = {}) => {
  const onAction = vi.fn();
  const option = tracker.options.find(({ name }) => name === optionName);
  const { container } = render(<ThemeProvider theme={darkTheme}>
    <OptionRow option={option} tracker={tracker} onAction={onAction} {...extra}/>
  </ThemeProvider>);
  return { container, onAction };
};

describe('OptionRow', () => {
  it('an on/off option is a labelled checkbox', () => {
    const tracker = trackerFor('account.World 1.stamps');
    const { container, onAction } = renderRow(tracker, 'gildedStamps');
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    expect(onAction).toHaveBeenCalledWith('toggleOption', tracker, 'gildedStamps');
  });

  it('an edited number shows its default and resets', () => {
    const tracker = trackerFor('account.World 3.library', { 'account.World 3.library.books': { value: 30 } });
    const { container, onAction } = renderRow(tracker, 'books');
    expect(container.textContent).toContain('Edited');
    expect(container.textContent).toContain('Default 20');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Reset'));
    expect(onAction).toHaveBeenCalledWith('resetPath', 'account.World 3.library.books');
  });

  it('clamps a number on blur and flags it while out of range', () => {
    const tracker = trackerFor('account.World 3.equinox', { 'account.World 3.equinox.foodLust': { value: '20' } });
    const { container, onAction } = renderRow(tracker, 'foodLust');
    expect(container.textContent).toContain('Allowed 1 to 14');
    fireEvent.blur(container.querySelector('input[type="number"]'));
    expect(onAction).toHaveBeenCalledWith('setOptionValue', tracker, 'foodLust', '14');
  });

  it('picker tiles are pressed buttons with All and None', () => {
    const tracker = trackerFor('account.World 3.construction');
    const { container, onAction } = renderRow(tracker, 'materials');
    const tiles = container.querySelectorAll('button[aria-pressed]');
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles[0].getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(tiles[0]);
    expect(onAction).toHaveBeenCalledWith('togglePickerItem', tracker, 'materials', expect.any(String));
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'None'));
    expect(onAction).toHaveBeenCalledWith('setPickerAll', tracker, 'materials', false);
  });

  it('non-image arrays are independent toggle chips', () => {
    const tracker = trackerFor('account.World 3.construction');
    const { container } = renderRow(tracker, 'saltBalanceDirection');
    const chips = [...container.querySelectorAll('button[aria-pressed]')];
    expect(chips.map((chip) => chip.textContent)).toEqual(['At or past its limit', 'Below its limit']);
  });

  it('per-world rows summarise overrides and open labelled inputs', () => {
    const tracker = trackerFor('account.World 7.royalGuardian', {
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } }
    });
    const { container } = renderRow(tracker, 'tradeRank');
    expect(container.textContent).toContain('1 override: W3 15');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Per world'));
    expect(container.querySelector('input[aria-label="World 3 value"]').value).toBe('15');
  });

  it('long help clamps with More and a dependent option explains why it is disabled', () => {
    const tracker = trackerFor('account.World 7.royalGuardian');
    const { container } = renderRow(tracker, 'overkillBeforeReset', { disabledReason: 'Turn on More Workers than needed to use this.' });
    const more = [...container.querySelectorAll('button')].find((b) => b.textContent === 'More');
    expect(more?.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).toContain('Turn on More Workers than needed to use this.');
    expect(container.querySelector('input[type="checkbox"]').disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/components/settings/option-row.test.jsx`
Expected: FAIL, "Failed to resolve import"

- [ ] **Step 3: Write `components/dashboard/settings/OptionRow.jsx`**

```jsx
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CheckIcon from '@mui/icons-material/Check';
import { prefix } from '@utility/helpers';
import { clampValue } from '@utility/dashboard/settingsActions';
import EditedTag, { EditedDot } from './EditedTag';
import { useHighlightTarget } from './useHighlightTarget';

const HELP_CLAMP = 90;
const WORLDS = [1, 2, 3, 4, 5, 6, 7];

const Help = ({ text }) => {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > HELP_CLAMP;
  return <Box>
    <Typography variant="body2" color="text.secondary" sx={long && !open
      ? { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
      : undefined}>{text}</Typography>
    {long ? <Button size="small" sx={{ p: 0, minWidth: 0 }} aria-expanded={open} onClick={() => setOpen(!open)}>
      {open ? 'Less' : 'More'}
    </Button> : null}
  </Box>;
};

const outOfRange = (option) => {
  const value = option.props?.value;
  if (value === '' || value === undefined || Number.isNaN(Number(value))) return false;
  const { minValue, maxValue } = option.props;
  return (minValue !== undefined && Number(value) < minValue) || (maxValue !== undefined && Number(value) > maxValue);
};

const rangeText = ({ minValue, maxValue }) => {
  if (minValue !== undefined && maxValue !== undefined) return `Allowed ${minValue} to ${maxValue}`;
  if (minValue !== undefined) return `At least ${minValue}`;
  return maxValue !== undefined ? `At most ${maxValue}` : '';
};

export const NumberField = ({ option, tracker, onAction, ariaLabel }) => {
  const error = outOfRange(option);
  return <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
    <TextField
      size="small"
      type="number"
      value={option.props.value ?? ''}
      error={error}
      sx={{ width: 120 }}
      slotProps={{
        htmlInput: { 'aria-label': ariaLabel ?? option.label, min: option.props.minValue, max: option.props.maxValue },
        input: { endAdornment: option.unit ? <InputAdornment position="end">{option.unit}</InputAdornment> : null }
      }}
      onChange={(e) => onAction('setOptionValue', tracker, option.name, e.target.value)}
      onBlur={(e) => {
        const clamped = clampValue(option, e.target.value);
        if (clamped !== e.target.value) onAction('setOptionValue', tracker, option.name, clamped);
      }}/>
    {option.edited ? <Stack direction="row" alignItems="center" gap={0.75}>
      <EditedDot/>
      <Typography variant="caption" color="text.secondary">Default {String(option.defaultValue)} ·</Typography>
      <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => onAction('resetPath', option.path)}>Reset</Button>
    </Stack> : null}
    {error ? <Typography variant="caption" color="error" role="alert">{rangeText(option.props)}</Typography> : null}
  </Stack>;
};

const PickerTiles = ({ option, tracker, onAction }) => {
  const entries = Object.entries(option.props.value ?? {});
  const onCount = entries.filter(([, on]) => on).length;
  return <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
    {entries.map(([key, on]) => <ButtonBase key={key} aria-label={key.camelToTitleCase?.() ?? key} aria-pressed={on}
                                            onClick={() => onAction('togglePickerItem', tracker, option.name, key)}
                                            sx={{
                                              width: 44, height: 44, borderRadius: 2, position: 'relative',
                                              border: 1, borderColor: on ? 'primary.main' : 'divider',
                                              bgcolor: on ? 'action.selected' : 'transparent'
                                            }}>
      <img src={`${prefix}data/${key}.png`} alt="" width={28} height={28}
           style={{ objectFit: 'contain', opacity: on ? 1 : 0.3, filter: on ? 'none' : 'grayscale(1)' }}/>
      {on ? <Box component="span" sx={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckIcon sx={{ fontSize: 10, color: 'background.default' }}/>
      </Box> : null}
    </ButtonBase>)}
    <Typography variant="caption" color="text.secondary">{onCount}/{entries.length}</Typography>
    <Button size="small" sx={{ minWidth: 0 }} onClick={() => onAction('setPickerAll', tracker, option.name, true)}>All</Button>
    <Button size="small" sx={{ minWidth: 0 }} onClick={() => onAction('setPickerAll', tracker, option.name, false)}>None</Button>
  </Stack>;
};

const ToggleChips = ({ option, tracker, onAction }) => <Stack direction="row" gap={1} flexWrap="wrap">
  {Object.entries(option.props.value ?? {}).map(([key, on]) => <Button key={key} size="small" aria-pressed={on}
                                                                       variant={on ? 'contained' : 'outlined'}
                                                                       color={on ? 'primary' : 'inherit'}
                                                                       startIcon={on ? <CheckIcon/> : null}
                                                                       sx={{ textTransform: 'none', minHeight: 32 }}
                                                                       onClick={() => onAction('togglePickerItem', tracker, option.name, key)}>
    {key.camelToTitleCase && /^[a-z]/.test(key) ? key.camelToTitleCase() : key}
  </Button>)}
</Stack>;

const PerWorld = ({ option, tracker, onAction, disabled }) => {
  const [open, setOpen] = useState(false);
  const perWorld = option.props.perWorld ?? {};
  const overrides = WORLDS.filter((world) => perWorld[world] != null && perWorld[world] !== '');
  return <Box sx={{ mt: 1 }}>
    <Stack direction="row" alignItems="center" gap={1.5}>
      <Button size="small" sx={{ p: 0, minWidth: 0 }} disabled={disabled} aria-expanded={open} onClick={() => setOpen(!open)}>Per world</Button>
      <Typography variant="caption" color="text.secondary">
        {overrides.length ? `${overrides.length} override${overrides.length > 1 ? 's' : ''}: ${overrides.map((w) => `W${w} ${perWorld[w]}`).join(', ')}` : 'No overrides'}
      </Typography>
    </Stack>
    {open && !disabled ? <Box sx={{ mt: 1 }}>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {WORLDS.map((world) => <TextField key={world} size="small" type="number" label={`W${world}`}
                                          value={perWorld[world] ?? ''} placeholder={String(option.props.value)}
                                          sx={{ width: 64 }}
                                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-label': `World ${world} value` } }}
                                          onChange={(e) => onAction('setPerWorld', tracker, option.name, world, e.target.value)}/>)}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Leave a world blank to use {String(option.props.value)} · <Button size="small" sx={{ p: 0, minWidth: 0 }} onClick={() => onAction('clearPerWorld', tracker, option.name)}>Clear overrides</Button>
      </Typography>
    </Box> : null}
  </Box>;
};

const OptionRow = ({ option, tracker, foldedOptions = [], disabledReason = null, highlight = false, onAction }) => {
  const [rowRef, highlighted] = useHighlightTarget(highlight);
  const disabled = Boolean(disabledReason);
  const isPicker = option.type === 'array';
  return <Box ref={rowRef} sx={{
    display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', columnGap: 1, py: 1,
    borderBottom: 1, borderColor: 'divider', borderRadius: 1,
    transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'transparent'
  }}>
    <Checkbox size="small" checked={Boolean(option.checked)} disabled={disabled} sx={{ p: 0.5, alignSelf: 'start' }}
              inputProps={{ 'aria-label': option.label }}
              onChange={() => onAction('toggleOption', tracker, option.name)}/>
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={2} rowGap={1}>
        <Typography variant="body2" fontWeight={500}>
          {option.label}{option.edited && option.type !== 'input' ? <EditedTag/> : null}
        </Typography>
        {option.type === 'input' ? <Box sx={{ ml: { sm: 'auto' } }}><NumberField option={option} tracker={tracker} onAction={onAction}/></Box> : null}
      </Stack>
      {disabledReason ? <Typography variant="body2" color="text.secondary">{disabledReason}</Typography> : null}
      <Help text={option.help}/>
      {isPicker ? <Box sx={{ mt: 1 }}>
        {option.props?.type === 'img'
          ? <PickerTiles option={option} tracker={tracker} onAction={onAction}/>
          : <ToggleChips option={option} tracker={tracker} onAction={onAction}/>}
      </Box> : null}
      {option.type === 'input' && option.props?.perWorld
        ? <PerWorld option={option} tracker={tracker} onAction={onAction} disabled={!option.checked}/> : null}
      {foldedOptions.map((folded) => <Box key={folded.name} sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{folded.label}</Typography>
        {folded.type === 'array'
          ? <ToggleChips option={folded} tracker={tracker} onAction={onAction}/>
          : <Help text={folded.help}/>}
        <Help text={folded.type === 'array' ? folded.help : null}/>
      </Box>)}
    </Box>
  </Box>;
};

export default OptionRow;
```

- [ ] **Step 4: Run the tests and lint**

Run: `npx vitest run __test__/components/settings/option-row.test.jsx`
Expected: PASS (7 tests). The More test needs `overkillBeforeReset` help longer than 90 characters; if R2a shortened it, switch the test to another option whose `help` is longer than 90 and say so. If a test fails because the R2a labels differ from the strings asserted here (`'At or past its limit'` comes from the picker keys, so it should not), report it rather than editing alertMeta.
Run: `npx eslint components/dashboard/settings/OptionRow.jsx`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/settings/OptionRow.jsx __test__/components/settings/option-row.test.jsx
git commit -m "Dashboard: option row for the alert settings window"
```

---

### Task 5: Alert card and compact row

**Files:**
- Create: `components/dashboard/settings/TrackerCard.jsx`
- Test: `__test__/components/settings/tracker-card.test.jsx`

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: `TrackerCard` (default) `{ tracker, expanded, onToggleExpanded, highlightOption = null, highlight = false, onAction }` and named `CompactRow` `{ tracker, highlight = false, onAction }`. The card header: switch (`aria-label` "<label> alerts", `aria-pressed`), icon, name with Edited / Off tags ("Off: settings kept" when it has options), summary `n of m options on`, inline number when `tracker.inline`, Reset when edited (`onAction('resetPath', tracker.path)`), expand button (`aria-expanded`). Body: off note when off, options grouped by `group` under subheadings, `foldInto` options rendered inside their target row, `dependsOn` children disabled with a reason while the parent is unchecked.

- [ ] **Step 1: Write the failing tests**

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import TrackerCard, { CompactRow } from '@components/dashboard/settings/TrackerCard';

const trackerFor = (path, edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return allTrackers(buildModel(config, baseTrackers, diffTrackers(baseTrackers, config))).find((t) => t.path === path);
};
const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>).container;

describe('TrackerCard', () => {
  it('collapsed: switch, summary and expand', () => {
    const onAction = vi.fn();
    const onToggleExpanded = vi.fn();
    const tracker = trackerFor('account.World 3.construction');
    const container = renderIn(<TrackerCard tracker={tracker} expanded={false} onToggleExpanded={onToggleExpanded} onAction={onAction}/>);
    expect(container.textContent).toContain(`${tracker.onCount} of ${tracker.total} options on`);
    fireEvent.click(container.querySelector(`[aria-label="${tracker.label} alerts"]`));
    expect(onAction).toHaveBeenCalledWith('toggleTracker', tracker);
    fireEvent.click(container.querySelector('[aria-expanded="false"]'));
    expect(onToggleExpanded).toHaveBeenCalled();
  });

  it('off with options: tag, note and still editable options', () => {
    const tracker = trackerFor('account.World 3.construction', { 'account.World 3.construction': { checked: false } });
    const container = renderIn(<TrackerCard tracker={tracker} expanded onToggleExpanded={() => {}} onAction={() => {}}/>);
    expect(container.textContent).toContain('Off: settings kept');
    expect(container.textContent).toContain('These options are kept and still editable');
    expect([...container.querySelectorAll('input[type="checkbox"]')].some((input) => !input.disabled)).toBe(true);
  });

  it('edited cards show the tag and a Reset for the whole alert', () => {
    const onAction = vi.fn();
    const tracker = trackerFor('account.World 3.library', { 'account.World 3.library.books': { value: 30 } });
    const container = renderIn(<TrackerCard tracker={tracker} expanded={false} onToggleExpanded={() => {}} onAction={onAction}/>);
    expect(container.textContent).toContain('Edited');
    // The inline number has its own Reset; the card-level one comes last in the header.
    fireEvent.click([...container.querySelectorAll('button')].filter((b) => b.textContent === 'Reset').at(-1));
    expect(onAction).toHaveBeenCalledWith('resetPath', 'account.World 3.library');
  });

  it('groups Royal Guardian options and disables a dependent while its parent is off', () => {
    const tracker = trackerFor('account.World 7.royalGuardian', { 'account.World 7.royalGuardian.overkillWorkers': { checked: false } });
    const container = renderIn(<TrackerCard tracker={tracker} expanded onToggleExpanded={() => {}} onAction={() => {}}/>);
    const groups = tracker.options.map(({ group }) => group).filter(Boolean);
    groups.forEach((group) => expect(container.textContent.toUpperCase()).toContain(group.toUpperCase()));
    const child = container.querySelector(`input[aria-label="${tracker.options.find(({ name }) => name === 'overkillBeforeReset').label}"]`);
    expect(child.disabled).toBe(true);
  });
});

describe('CompactRow', () => {
  it('one switch for a single-option alert', () => {
    const onAction = vi.fn();
    const tracker = trackerFor('characters.bags');
    const container = renderIn(<CompactRow tracker={tracker} onAction={onAction}/>);
    const toggle = container.querySelector(`[aria-label="${tracker.label} alerts"]`);
    expect(toggle.checked).toBe(true);
    fireEvent.click(toggle);
    expect(onAction).toHaveBeenCalledWith('toggleTracker', tracker);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/components/settings/tracker-card.test.jsx`
Expected: FAIL, "Failed to resolve import"

- [ ] **Step 3: Write `components/dashboard/settings/TrackerCard.jsx`**

```jsx
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { prefix } from '@utility/helpers';
import EditedTag, { OffTag } from './EditedTag';
import OptionRow, { NumberField } from './OptionRow';
import { useHighlightTarget } from './useHighlightTarget';

const TrackerIcon = ({ tracker }) => tracker.icon
  ? <img src={`${prefix}${tracker.icon}.png`} alt="" width={28} height={28} style={{ objectFit: 'contain', opacity: tracker.on ? 1 : 0.4 }}/>
  : <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'action.hover', flexShrink: 0, opacity: tracker.on ? 1 : 0.4 }}/>;

const TrackerSwitch = ({ tracker, onAction }) => <Switch
  checked={tracker.on}
  onChange={() => onAction('toggleTracker', tracker)}
  inputProps={{ 'aria-label': `${tracker.label} alerts` }}
  sx={{ flexShrink: 0 }}/>;

export const CompactRow = ({ tracker, highlight = false, onAction }) => {
  const [ref, highlighted] = useHighlightTarget(highlight);
  return <Paper ref={ref} variant="outlined" sx={{
    display: 'flex', alignItems: 'center', gap: 1.5, px: 1, minHeight: 52,
    transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'background.paper'
  }}>
    <TrackerSwitch tracker={tracker} onAction={onAction}/>
    <TrackerIcon tracker={tracker}/>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="body2" fontWeight={500}>
        {tracker.label}{tracker.edited ? <EditedTag/> : null}{!tracker.on ? <OffTag/> : null}
      </Typography>
      {tracker.options[0] || tracker.unit
        ? <Typography variant="caption" color="text.secondary">{tracker.options[0]?.label ?? tracker.unit}</Typography> : null}
    </Box>
  </Paper>;
};

const OptionList = ({ tracker, highlightOption, onAction }) => {
  const byName = Object.fromEntries(tracker.options.map((option) => [option.name, option]));
  const unfolded = tracker.options.filter((option) => !option.foldInto);
  // Groups are not contiguous in the saved option order (Royal Guardian lists two Outposts
  // options after the rank caps), so ungrouped options come first, then each group in the
  // order it first appears.
  const groupOrder = [...new Set(unfolded.map(({ group }) => group).filter(Boolean))];
  const visible = [
    ...unfolded.filter(({ group }) => !group),
    ...groupOrder.flatMap((group) => unfolded.filter((option) => option.group === group))
  ];
  let lastGroup = null;
  return visible.map((option) => {
    const heading = option.group && option.group !== lastGroup ? option.group : null;
    if (option.group) lastGroup = option.group;
    const parent = option.dependsOn ? byName[option.dependsOn] : null;
    const disabledReason = parent && !parent.checked ? `Turn on ${parent.label} to use this.` : null;
    return <React.Fragment key={option.name}>
      {heading ? <Typography variant="overline" color="text.secondary" component="div" sx={{ mt: 2 }}>{heading}</Typography> : null}
      <OptionRow option={option} tracker={tracker} onAction={onAction}
                 foldedOptions={tracker.options.filter(({ foldInto }) => foldInto === option.name)}
                 disabledReason={disabledReason}
                 highlight={highlightOption === option.name}/>
    </React.Fragment>;
  });
};

const TrackerCard = ({ tracker, expanded, onToggleExpanded, highlightOption = null, highlight = false, onAction }) => {
  const [ref, highlighted] = useHighlightTarget(highlight && !highlightOption);
  const inline = tracker.inline ? tracker.options.find(({ name }) => name === tracker.inline) : null;
  return <Paper ref={ref} variant="outlined" sx={{ transition: 'background-color .4s', bgcolor: highlighted ? 'action.selected' : 'background.paper' }}>
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 1, py: 1, minHeight: 56, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
      <TrackerSwitch tracker={tracker} onAction={onAction}/>
      <TrackerIcon tracker={tracker}/>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body1" fontWeight={500}>
          {tracker.label}{tracker.edited ? <EditedTag/> : null}{!tracker.on ? <OffTag kept={tracker.options.length > 0}/> : null}
        </Typography>
        <Typography variant="caption" color="text.secondary">{tracker.onCount} of {tracker.total} options on</Typography>
      </Box>
      {inline ? <NumberField option={inline} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${inline.label}`}/> : null}
      {tracker.edited ? <Button size="small" onClick={() => onAction('resetPath', tracker.path)}>Reset</Button> : null}
      {tracker.options.length > (inline ? 1 : 0)
        ? <IconButton aria-label={`${expanded ? 'Hide' : 'Show'} ${tracker.label} options`} aria-expanded={expanded}
                      onClick={onToggleExpanded} sx={{ width: 44, height: 44 }}>
          {expanded ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
        </IconButton> : null}
    </Stack>
    {expanded ? <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: 2, pl: { sm: 8 }, borderTop: 1, borderColor: 'divider' }}>
      {!tracker.on ? <Typography variant="body2" sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: 'action.hover' }}>
        {tracker.label} alerts are off. These options are kept and still editable: they apply when you turn it back on.
      </Typography> : null}
      <OptionList tracker={tracker} highlightOption={highlightOption} onAction={onAction}/>
    </Box> : null}
  </Paper>;
};

export default TrackerCard;
```

- [ ] **Step 4: Run the tests and lint**

Run: `npx vitest run __test__/components/settings/tracker-card.test.jsx __test__/components/settings/option-row.test.jsx`
Expected: PASS
Run: `npx eslint components/dashboard/settings/TrackerCard.jsx`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/settings/TrackerCard.jsx __test__/components/settings/tracker-card.test.jsx
git commit -m "Dashboard: alert card and compact row"
```

---

### Task 6: Section pane, navigation and search results

**Files:**
- Create: `components/dashboard/settings/SectionPane.jsx`
- Create: `components/dashboard/settings/SettingsNav.jsx`
- Create: `components/dashboard/settings/SearchResults.jsx`
- Test: `__test__/components/settings/section-nav-search.test.jsx`

**Interfaces:**
- Consumes: Tasks 1-5.
- Produces:
  - `SectionPane` `{ section, filter, expanded, onToggleExpanded(path), target, onAction, onBulk(label, actionName, ...args), onShowAll, extraTop = null }`: header (label, `n alerts · m on`, Turn all off / Turn all on, Reset <label> when edited), compact rows in a two-column grid, then cards; trackers filtered by `filter`; when the filter leaves nothing, an empty state with "Show all alerts".
  - `SettingsNav` `{ model, tabIndex, onTabChange(index), sectionKey, onSectionChange(key), onTrackerJump(path) }`: segmented tabs with edited dots; section list with `on/total` and edited dot; for the selected section with more than 6 trackers, a list of tracker links that call `onTrackerJump`.
  - `SearchResults` `{ results, query, onAction, onShow(result) }`: results grouped by `tab · section`, each a row with breadcrumb, label, Edited tag, the option's control (OptionRow for an option result, CompactRow for a tracker result) and "Show in <section>"; with no results, "No alerts match "<query>"" plus "Searched names, options and descriptions in all three tabs."

- [ ] **Step 1: Write the failing tests**

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { buildModel, searchModel } from '@utility/dashboard/settingsModel';
import SectionPane from '@components/dashboard/settings/SectionPane';
import SettingsNav from '@components/dashboard/settings/SettingsNav';
import SearchResults from '@components/dashboard/settings/SearchResults';

const modelFor = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
};
const renderIn = (node) => render(<ThemeProvider theme={darkTheme}>{node}</ThemeProvider>).container;
const world3 = (model) => model[0].sections.find(({ section }) => section === 'World 3');

describe('SectionPane', () => {
  it('lists the section, counts and bulk actions', () => {
    const onBulk = vi.fn();
    const section = world3(modelFor());
    const container = renderIn(<SectionPane section={section} filter="all" expanded={{}} onToggleExpanded={() => {}} onAction={() => {}} onBulk={onBulk} onShowAll={() => {}}/>);
    expect(container.textContent).toContain(`${section.total} alerts · ${section.onCount} on`);
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Turn all off'));
    expect(onBulk).toHaveBeenCalledWith(`${section.label} alerts turned off`, 'setSectionOn', section, false);
  });

  it('shows an empty state when the filter hides every alert', () => {
    const onShowAll = vi.fn();
    const container = renderIn(<SectionPane section={world3(modelFor())} filter="off" expanded={{}} onToggleExpanded={() => {}} onAction={() => {}} onBulk={() => {}} onShowAll={onShowAll}/>);
    expect(container.textContent).toContain('alert is on');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Show all alerts'));
    expect(onShowAll).toHaveBeenCalled();
  });
});

describe('SettingsNav', () => {
  it('marks edited tabs and sections and switches section', () => {
    const onSectionChange = vi.fn();
    const model = modelFor({ 'account.World 3.library.books': { value: 30 } });
    const container = renderIn(<SettingsNav model={model} tabIndex={0} onTabChange={() => {}} sectionKey="account.General" onSectionChange={onSectionChange} onTrackerJump={() => {}}/>);
    expect(container.textContent).toContain('has edits');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent.startsWith(world3(model).label)));
    expect(onSectionChange).toHaveBeenCalledWith('account.World 3');
  });
});

describe('SearchResults', () => {
  it('groups results and offers Show in section', () => {
    const onShow = vi.fn();
    const model = modelFor();
    const results = searchModel(model, 'salt');
    const container = renderIn(<SearchResults results={results} query="salt" onAction={() => {}} onShow={onShow}/>);
    expect(container.textContent).toContain('Account · World 3');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent.startsWith('Show in')));
    expect(onShow).toHaveBeenCalledWith(results[0]);
  });

  it('says so when nothing matches', () => {
    const container = renderIn(<SearchResults results={[]} query="bubbel" onAction={() => {}} onShow={() => {}}/>);
    expect(container.textContent).toContain('No alerts match "bubbel"');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/components/settings/section-nav-search.test.jsx`
Expected: FAIL, "Failed to resolve import"

- [ ] **Step 3: Write `SectionPane.jsx`**

```jsx
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { matchesFilter } from '@utility/dashboard/settingsModel';
import TrackerCard, { CompactRow } from './TrackerCard';

const SectionPane = ({ section, filter, expanded, onToggleExpanded, target, onAction, onBulk, onShowAll, extraTop = null }) => {
  const visible = section.trackers.filter((tracker) => matchesFilter(tracker, filter) || tracker.path === target?.path);
  const compact = visible.filter(({ compact: isCompact }) => isCompact);
  const cards = visible.filter(({ compact: isCompact }) => !isCompact);
  const allOff = section.onCount === 0;
  return <Stack gap={1.25}>
    <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
      <Box>
        <Typography variant="h6" component="h2">{section.label}</Typography>
        <Typography variant="body2" color="text.secondary">{section.total} alerts · {section.onCount} on</Typography>
      </Box>
      <Stack direction="row" gap={0.5} sx={{ ml: 'auto' }}>
        <Button size="small" color="inherit"
                onClick={() => onBulk(`${section.label} alerts turned ${allOff ? 'on' : 'off'}`, 'setSectionOn', section, allOff)}>
          {allOff ? 'Turn all on' : 'Turn all off'}
        </Button>
        {section.edited ? <Button size="small" color="inherit"
                                  onClick={() => onBulk(`${section.label} reset to defaults`, 'resetPath', section.key)}>
          Reset {section.label}
        </Button> : null}
      </Stack>
    </Stack>
    {extraTop}
    {!visible.length ? <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
      <Typography fontWeight={500}>{filter === 'off' ? `Every ${section.label} alert is on` : `No ${section.label} alerts match this filter`}</Typography>
      <Button sx={{ mt: 1.5 }} variant="outlined" onClick={onShowAll}>Show all alerts</Button>
    </Paper> : null}
    {compact.length ? <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
      {compact.map((tracker) => <CompactRow key={tracker.path} tracker={tracker} onAction={onAction}
                                            highlight={target?.path === tracker.path}/>)}
    </Box> : null}
    {cards.map((tracker) => <TrackerCard key={tracker.path} tracker={tracker} onAction={onAction}
                                         expanded={Boolean(expanded[tracker.path])}
                                         onToggleExpanded={() => onToggleExpanded(tracker.path)}
                                         highlight={target?.path === tracker.path}
                                         highlightOption={target?.path === tracker.path ? target.optionName : null}/>)}
  </Stack>;
};

export default SectionPane;
```

The empty-state copy uses "alert is on" for the Off filter so the test above matches ("Every World 3 alert is on").

- [ ] **Step 4: Write `SettingsNav.jsx`**

```jsx
import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { prefix } from '@utility/helpers';
import { EditedDot } from './EditedTag';

const LONG_SECTION = 6;

const SettingsNav = ({ model, tabIndex, onTabChange, sectionKey, onSectionChange, onTrackerJump }) => {
  const tab = model[tabIndex];
  return <Stack gap={1.5}>
    <ToggleButtonGroup exclusive fullWidth size="small" value={tabIndex}
                       onChange={(e, value) => value !== null && onTabChange(value)}>
      {model.map((item, index) => <ToggleButton key={item.configType} value={index} sx={{ gap: 0.75, textTransform: 'none' }}>
        {item.label}{item.edited ? <EditedDot/> : null}
      </ToggleButton>)}
    </ToggleButtonGroup>
    {tab.sections.length > 1 ? <Stack component="nav" aria-label={`${tab.label} sections`} gap={0.25}>
      {tab.sections.map((section) => {
        const selected = section.key === sectionKey;
        return <React.Fragment key={section.key}>
          <ButtonBase onClick={() => onSectionChange(section.key)} aria-current={selected ? 'true' : undefined}
                      sx={{ justifyContent: 'flex-start', gap: 1.25, px: 1.25, minHeight: { xs: 52, sm: 38 }, borderRadius: 1.5, bgcolor: selected ? 'action.selected' : 'transparent' }}>
            {section.icon
              ? <img src={`${prefix}${section.icon}.png`} alt="" width={22} height={22} style={{ objectFit: 'contain' }}/>
              : <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: 'action.hover' }}/>}
            <Typography variant="body2" sx={{ flex: 1, textAlign: 'left' }}>{section.label}</Typography>
            {section.edited ? <EditedDot/> : null}
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{section.onCount}/{section.total}</Typography>
          </ButtonBase>
          {selected && section.trackers.length > LONG_SECTION ? section.trackers.map((tracker) =>
            <ButtonBase key={tracker.path} onClick={() => onTrackerJump(tracker.path)}
                        sx={{ justifyContent: 'flex-start', gap: 1, pl: 5.5, pr: 1.25, minHeight: { xs: 44, sm: 28 }, borderRadius: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'left' }}>{tracker.label}</Typography>
              {tracker.edited ? <EditedDot/> : null}
            </ButtonBase>) : null}
        </React.Fragment>;
      })}
    </Stack> : null}
  </Stack>;
};

export default SettingsNav;
```

- [ ] **Step 5: Write `SearchResults.jsx`**

```jsx
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OptionRow from './OptionRow';
import { CompactRow } from './TrackerCard';

const groupKey = ({ tab, section }) => [tab.label, section.section ? section.label : null].filter(Boolean).join(' · ');

const SearchResults = ({ results, query, onAction, onShow }) => {
  if (!results.length) {
    return <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography fontWeight={500}>No alerts match "{query}"</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        Searched names, options and descriptions in all three tabs.
      </Typography>
    </Box>;
  }
  const groups = results.reduce((acc, result) => {
    const key = groupKey(result);
    (acc[key] ??= []).push(result);
    return acc;
  }, {});
  return <Stack gap={1.25}>
    {Object.entries(groups).map(([key, items]) => <Stack key={key} gap={1}>
      <Typography variant="overline" color="text.secondary">{key}</Typography>
      {items.map((result) => <Paper key={result.option?.path ?? result.tracker.path} variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" gap={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">{key} › {result.tracker.label}</Typography>
            {result.option
              ? <OptionRow option={result.option} tracker={result.tracker} onAction={onAction}/>
              : <CompactRow tracker={result.tracker} onAction={onAction}/>}
          </Box>
          <Button size="small" sx={{ whiteSpace: 'nowrap' }} onClick={() => onShow(result)}>
            Show in {result.section.label}
          </Button>
        </Stack>
      </Paper>)}
    </Stack>)}
  </Stack>;
};

export default SearchResults;
```

- [ ] **Step 6: Run the tests and lint**

Run: `npx vitest run __test__/components/settings`
Expected: PASS
Run: `npx eslint components/dashboard/settings`

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/settings __test__/components/settings/section-nav-search.test.jsx
git commit -m "Dashboard: section pane, settings menu and search results"
```

---

### Task 7: The window shell

**Files:**
- Rewrite: `components/common/DashboardSettings.jsx`
- Test: `__test__/components/settings/dashboard-settings.test.jsx`

**Interfaces:**
- Consumes: Tasks 1-6; `baseTrackers`; `diffTrackers`; `resolveSettingsTarget`; `FileUploadButton` with `onInvalidFile`; `handleDownload`.
- Produces: same default export and props as today (`open, onClose, config, onChange, onFileUpload, exportConfig, target, hideAlertless, onHideAlertlessChange`), plus optional `initialFilter` (`'all'` default; the page passes `'edited'` from the defaults note).

Behaviour:
- Desktop (`sm` and up): `Dialog fullWidth maxWidth="lg"`, height 90vh; header row (title, search field, Import, Export, Reset all, close), filter chips row with counts and the caption "Every count is alerts, not options" (while searching: "While searching, counts are results"); body = 288 px `SettingsNav` + `SectionPane` or `SearchResults`.
- Mobile (below `sm`): `fullScreen`; the menu fills the screen; choosing a section shows it with a back button; search shows results full screen.
- `onAction(name, ...args)`: `resetPath` calls `settingsActions.resetPath(baseTrackers, config, ...args)`, every other name calls `settingsActions[name](config, ...args)`; then `onChange(next)`.
- `onBulk(label, name, ...args)` does the same and shows an Undo snackbar (`role="status"`, 6 s) holding the previous config; Undo calls `onChange(previous)`. Single option changes do not get a snackbar.
- Reset all opens a confirm dialog ("Reset every alert to default?" / "This turns all 98 alerts back to their default and clears your N edits. Export first if you want a copy."); confirming calls `onBulk('All alerts reset to defaults', 'resetPath', null)`.
- Import: valid file goes to `onFileUpload` and shows an Undo snackbar ("Imported <n> alerts, <m> edited from default"); a non-JSON file or one without `schema === 2` or `account`+`characters` shows an inline error "<file> isn't an alert config. Nothing was changed."
- Deep link (`target` set when opened): select its tab and section, clear search, set filter to `all`, expand its tracker, highlight its option (or tracker).
- Characters tab: `hideAlertless` switch row at the top of the pane ("Hide characters without alerts", caption "Saved in this browser, not in your exported config").

- [ ] **Step 1: Write the failing tests**

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import DashboardSettings from '@components/common/DashboardSettings';

let latest;
const Harness = ({ target = null, edits = {} }) => {
  const [config, setConfig] = useState(resolveTrackers(baseTrackers, edits));
  latest = config;
  return <ThemeProvider theme={darkTheme}>
    <DashboardSettings open onClose={() => {}} config={config} onChange={setConfig} onFileUpload={() => {}}
                       target={target} hideAlertless={false} onHideAlertlessChange={() => {}}/>
  </ThemeProvider>;
};
const edits = () => diffTrackers(baseTrackers, latest);
const button = (text) => [...document.body.querySelectorAll('button')].find((b) => b.textContent === text);

describe('DashboardSettings window', () => {
  it('opens on the first section with counts on the chips', () => {
    render(<Harness/>);
    expect(document.body.textContent).toContain('Configure alerts');
    expect(document.body.textContent).toContain('Every count is alerts, not options');
    expect(document.body.textContent).toContain('All 98');
  });

  it('Turn all off is undoable', async () => {
    render(<Harness/>);
    fireEvent.click(button('Turn all off'));
    expect(Object.keys(edits()).length).toBeGreaterThan(0);
    await waitFor(() => expect(button('Undo')).toBeTruthy());
    fireEvent.click(button('Undo'));
    expect(edits()).toEqual({});
  });

  it('Reset all asks first', () => {
    render(<Harness edits={{ 'account.World 1.stamps': { checked: false } }}/>);
    fireEvent.click(button('Reset all'));
    expect(document.body.textContent).toContain('Reset every alert to default?');
    fireEvent.click([...document.body.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === 'Reset all'));
    expect(edits()).toEqual({});
  });

  it('search shows results across tabs', () => {
    render(<Harness/>);
    fireEvent.change(document.body.querySelector('input[aria-label="Search alerts"]'), { target: { value: 'salt' } });
    expect(document.body.textContent).toContain('While searching, counts are results');
    expect(document.body.textContent).toContain('Timers · World 3');
  });

  it('a deep link opens the section with the alert expanded', () => {
    render(<Harness target={{ configType: 'account', path: 'World 7.royalGuardian.tradeRank' }}/>);
    expect(document.body.querySelector('[aria-expanded="true"]')).toBeTruthy();
    expect(document.body.textContent).toContain('Per world');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/components/settings/dashboard-settings.test.jsx`
Expected: FAIL (old dialog: no "Configure alerts" title, no "Turn all off")

- [ ] **Step 3: Rewrite `components/common/DashboardSettings.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconFileExport } from '@tabler/icons-react';
import { handleDownload } from '@utility/helpers';
import FileUploadButton from '@components/common/DownloadButton';
import { resolveSettingsTarget } from '@utility/dashboard/settingsTarget';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel, FILTERS, matchesFilter, searchModel } from '@utility/dashboard/settingsModel';
import * as settingsActions from '@utility/dashboard/settingsActions';
import SettingsNav from '@components/dashboard/settings/SettingsNav';
import SectionPane from '@components/dashboard/settings/SectionPane';
import SearchResults from '@components/dashboard/settings/SearchResults';

const FILTER_LABELS = { all: 'All', on: 'On', off: 'Off', edited: 'Edited', threshold: 'Has threshold' };

const DashboardSettings = ({
  open, onClose, config, onChange, onFileUpload, exportConfig, target,
  hideAlertless, onHideAlertlessChange, initialFilter = 'all'
}) => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const edits = diffTrackers(baseTrackers, config);
  const model = buildModel(config, baseTrackers, edits);
  const [tabIndex, setTabIndex] = useState(0);
  const [sectionKey, setSectionKey] = useState(model[0].sections[0].key);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [highlight, setHighlight] = useState(null);
  const [undo, setUndo] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState(null);

  // The dialog stays mounted while closed, so every opening re-points it: at the alert that
  // opened it, or back to the first section.
  useEffect(() => {
    if (!open) return;
    const resolved = resolveSettingsTarget(config, target?.configType, target?.path);
    setQuery('');
    setImportError(null);
    if (resolved) {
      const tab = model[resolved.tab];
      const section = tab.sections.find((item) => item.section === resolved.section) ?? tab.sections[0];
      const path = [resolved.configType, resolved.section, resolved.trackerName].filter(Boolean).join('.');
      setTabIndex(resolved.tab);
      setSectionKey(section.key);
      setFilter('all');
      setMobileDetail(true);
      setExpanded(resolved.trackerName ? { [path]: true } : {});
      setHighlight(resolved.trackerName ? { path, optionName: resolved.optionName } : null);
    } else {
      setFilter(initialFilter);
      setMobileDetail(false);
      setHighlight(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target]);

  const run = (name, ...args) => name === 'resetPath'
    ? settingsActions.resetPath(baseTrackers, config, ...args)
    : settingsActions[name](config, ...args);
  const onAction = (name, ...args) => onChange(run(name, ...args));
  const onBulk = (label, name, ...args) => {
    setUndo({ label, previous: config });
    onChange(run(name, ...args));
  };

  const tab = model[tabIndex];
  const section = tab.sections.find((item) => item.key === sectionKey) ?? tab.sections[0];
  const results = searchModel(model, query);
  const counting = query ? results.map(({ tracker }) => tracker) : allTrackers(model);
  const countFor = (key) => counting.filter((tracker) => matchesFilter(tracker, key)).length;

  const changeTab = (index) => {
    setTabIndex(index);
    setSectionKey(model[index].sections[0].key);
    setMobileDetail(model[index].sections.length === 1);
  };
  const changeSection = (key) => {
    setSectionKey(key);
    setMobileDetail(true);
  };
  const jumpTo = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: true }));
    setHighlight({ path, optionName: null });
  };
  const showResult = ({ tab: resultTab, section: resultSection, tracker, option }) => {
    setQuery('');
    setTabIndex(model.indexOf(resultTab));
    setSectionKey(resultSection.key);
    setMobileDetail(true);
    setExpanded((prev) => ({ ...prev, [tracker.path]: true }));
    setHighlight({ path: tracker.path, optionName: option?.name ?? null });
  };

  const handleExport = () => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_exported', { event_category: 'engagement', event_label: 'dashboard', value: 1 });
    }
    handleDownload(exportConfig ?? config, 'it-dashboard-config');
  };
  const handleImport = (data, fileName = 'That file') => {
    if (!(data?.schema === 2 || (data?.account && data?.characters))) {
      setImportError(`${fileName} isn't an alert config. Nothing was changed. Pick a file made with Export.`);
      return;
    }
    setImportError(null);
    setUndo({ label: 'Alert settings imported', previous: config });
    onFileUpload(data);
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_imported', { event_category: 'engagement', event_label: 'dashboard', value: 1 });
    }
  };

  const search = <TextField
    size="small" fullWidth value={query} placeholder={`Search ${allTrackers(model).length} alerts, options and descriptions`}
    onChange={(e) => setQuery(e.target.value)}
    slotProps={{
      htmlInput: { 'aria-label': 'Search alerts' },
      input: {
        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>,
        endAdornment: query ? <IconButton aria-label="Clear search" size="small" onClick={() => setQuery('')}><CloseIcon fontSize="small"/></IconButton> : null
      }
    }}/>;

  const chips = <Stack direction="row" gap={1} alignItems="center" sx={{ overflowX: 'auto', pb: 0.5 }}>
    {FILTERS.map((key) => <Chip key={key} label={`${FILTER_LABELS[key]} ${countFor(key)}`}
                                color={filter === key ? 'primary' : 'default'} variant={filter === key ? 'filled' : 'outlined'}
                                onClick={() => setFilter(key)} sx={{ minHeight: { xs: 44, sm: 32 } }}/>)}
    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 1 }}>
      {query ? 'While searching, counts are results' : 'Every count is alerts, not options'}
    </Typography>
  </Stack>;

  const hideAlertlessRow = tab.configType === 'characters' ? <Stack direction="row" alignItems="center" gap={1.5}
                                                                    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1 }}>
    <Switch checked={Boolean(hideAlertless)} onChange={(e) => onHideAlertlessChange(e.target.checked)}
            inputProps={{ 'aria-label': 'Hide characters without alerts' }}/>
    <Box>
      <Typography variant="body2" fontWeight={500}>Hide characters without alerts</Typography>
      <Typography variant="caption" color="text.secondary">Saved in this browser, not in your exported config</Typography>
    </Box>
  </Stack> : null;

  const pane = query
    ? <SearchResults results={results.filter(({ tracker }) => matchesFilter(tracker, filter))} query={query} onAction={onAction} onShow={showResult}/>
    : <SectionPane section={section} filter={filter} expanded={expanded}
                   onToggleExpanded={(path) => setExpanded((prev) => ({ ...prev, [path]: !prev[path] }))}
                   target={highlight} onAction={onAction} onBulk={onBulk} onShowAll={() => setFilter('all')}
                   extraTop={hideAlertlessRow}/>;

  const nav = <SettingsNav model={model} tabIndex={tabIndex} onTabChange={changeTab} sectionKey={section.key}
                           onSectionChange={changeSection} onTrackerJump={jumpTo}/>;

  return <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" fullScreen={isSm}
            PaperProps={{ sx: { height: { sm: '90vh' } } }}>
      <DialogTitle component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" gap={2}>
          {isSm && mobileDetail && !query
            ? <IconButton aria-label="Back to sections" onClick={() => setMobileDetail(false)}><ArrowBackIcon/></IconButton> : null}
          <Typography variant="h6" component="h1" sx={{ whiteSpace: 'nowrap' }}>Configure alerts</Typography>
          {!isSm ? <Box sx={{ flex: 1, maxWidth: 520 }}>{search}</Box> : null}
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ ml: 'auto' }}>
            <FileUploadButton onFileUpload={handleImport}
                              onInvalidFile={(fileName) => setImportError(`${fileName} isn't an alert config. Nothing was changed. Pick a file made with Export.`)}>
              Import
            </FileUploadButton>
            {isSm ? <IconButton aria-label="Export" onClick={handleExport}><IconFileExport size={18}/></IconButton>
              : <Button onClick={handleExport} startIcon={<IconFileExport size={18}/>} size="small">Export</Button>}
            {!isSm ? <Button size="small" color="inherit" onClick={() => setConfirmReset(true)}>Reset all</Button> : null}
            <IconButton aria-label="Close" onClick={onClose}><CloseIcon/></IconButton>
          </Stack>
        </Stack>
        {isSm ? search : null}
        {chips}
        {importError ? <Alert severity="error" onClose={() => setImportError(null)}>{importError}</Alert> : null}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {isSm
          ? <Box sx={{ p: 1.5, width: '100%', overflowY: 'auto' }}>{query || mobileDetail ? pane : nav}</Box>
          : <>
            <Box sx={{ width: 288, flexShrink: 0, borderRight: 1, borderColor: 'divider', p: 1.5, overflowY: 'auto' }}>{nav}</Box>
            <Box sx={{ flex: 1, minWidth: 0, p: 2.5, overflowY: 'auto' }}>{pane}</Box>
          </>}
      </DialogContent>
    </Dialog>
    <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} PaperProps={{ role: 'alertdialog' }}>
      <DialogTitle>Reset every alert to default?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This turns all {allTrackers(model).length} alerts back to their default and clears your {Object.keys(edits).length} edits. Export first if you want a copy.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
        <Button variant="contained" onClick={() => {
          setConfirmReset(false);
          onBulk('All alerts reset to defaults', 'resetPath', null);
        }}>Reset all</Button>
      </DialogActions>
    </Dialog>
    <Snackbar open={Boolean(undo)} autoHideDuration={6000} onClose={() => setUndo(null)} message={undo?.label}
              ContentProps={{ role: 'status' }}
              action={<Button color="primary" size="small" onClick={() => {
                onChange(undo.previous);
                setUndo(null);
              }}>Undo</Button>}/>
  </>;
};

export default DashboardSettings;
```

Mobile Reset all lives in the section actions; the confirm dialog is reachable on desktop from the header. The `Undo` button text is "Undo" (the test looks it up by that text).

- [ ] **Step 4: Run the tests and lint**

Run: `npx vitest run __test__/components/settings`
Expected: PASS
Run: `npx eslint components/common/DashboardSettings.jsx components/dashboard/settings`

- [ ] **Step 5: Commit**

```bash
git add components/common/DashboardSettings.jsx __test__/components/settings/dashboard-settings.test.jsx
git commit -m "Dashboard: new Configure alerts window"
```

---

### Task 8: Page wiring, defaults note, cleanup

**Files:**
- Modify: `pages/dashboard.jsx`
- Delete: `utility/dashboard/applySettingChange.js`, `__test__/utility/apply-setting-change.test.js`
- Test: `__test__/components/settings/defaults-note.test.jsx`

**Interfaces:**
- Consumes: `DashboardSettings` `initialFilter` prop; `diffTrackers`.
- Produces: `DefaultsNote` (named export from `pages/dashboard.jsx` is not allowed in a Next page, so create `components/dashboard/settings/DefaultsNote.jsx`) with props `{ count, onReview, onDismiss }`: an MUI `Alert` "<count> of your alert settings differ from the defaults." with buttons "Review" and "Dismiss".

- [ ] **Step 1: Write the failing test**

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../../styles/theme/darkTheme';
import DefaultsNote from '@components/dashboard/settings/DefaultsNote';

describe('DefaultsNote', () => {
  it('states the count and offers Review and Dismiss', () => {
    const onReview = vi.fn();
    const onDismiss = vi.fn();
    const { container } = render(<ThemeProvider theme={darkTheme}><DefaultsNote count={3} onReview={onReview} onDismiss={onDismiss}/></ThemeProvider>);
    expect(container.textContent).toContain('3 of your alert settings differ from the defaults.');
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Review'));
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Dismiss'));
    expect(onReview).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run __test__/components/settings/defaults-note.test.jsx`
Expected: FAIL, "Failed to resolve import"

- [ ] **Step 3: Write `components/dashboard/settings/DefaultsNote.jsx`**

```jsx
import React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

const DefaultsNote = ({ count, onReview, onDismiss }) => <Alert
  severity="info" sx={{ mb: 2 }}
  action={<>
    <Button color="inherit" size="small" onClick={onReview}>Review</Button>
    <Button color="inherit" size="small" onClick={onDismiss}>Dismiss</Button>
  </>}>
  {count} of your alert settings differ from the defaults.
</Alert>;

export default DefaultsNote;
```

- [ ] **Step 4: Wire the page** (`pages/dashboard.jsx`)

```js
import DefaultsNote from '@components/dashboard/settings/DefaultsNote';
import { diffTrackers, LEGACY_BACKUP_KEY, loadTrackers, toStoredTrackers } from '@utility/dashboard/trackerStore';
```

Inside `Dashboard`, next to the other `useLocalStorage` call (mantine reads storage in an effect, so the first render stays the same as the export):

```js
  const [defaultsNoteDismissed, setDefaultsNoteDismissed] = useLocalStorage({
    key: 'dashboard-defaults-note-dismissed',
    defaultValue: false
  });
  const [initialFilter, setInitialFilter] = useState('all');
  // Counted once on load: edits made in the window afterwards must not make the note appear.
  const [editCount] = useState(() => Object.keys(diffTrackers(baseTrackers, initialLoad.config)).length);
```

Above the filters row in the JSX:

```jsx
      {!defaultsNoteDismissed && editCount > 0 ? <DefaultsNote count={editCount}
                                                               onReview={() => {
                                                                 setInitialFilter('edited');
                                                                 setSettingsTarget(null);
                                                                 setOpen(true);
                                                               }}
                                                               onDismiss={() => setDefaultsNoteDismissed(true)}/> : null}
```

Pass `initialFilter={initialFilter}` to `<DashboardSettings>`, and in `handleCloseSettings` add `setInitialFilter('all');`.

- [ ] **Step 5: Delete the replaced files**

```bash
git rm utility/dashboard/applySettingChange.js __test__/utility/apply-setting-change.test.js
```

Confirm nothing else imports it: `git grep -n applySettingChange` must print nothing.

- [ ] **Step 6: Run the dashboard suites and lint**

Run: `npx vitest run __test__/components/settings __test__/utility __test__/settingsTarget.test.js`
Expected: PASS
Run: `npx eslint pages/dashboard.jsx components/dashboard/settings components/common/DashboardSettings.jsx`

- [ ] **Step 7: Commit**

```bash
git add pages/dashboard.jsx components/dashboard/settings/DefaultsNote.jsx __test__/components/settings/defaults-note.test.jsx
git commit -m "Dashboard: defaults note and wiring for the new alert settings window"
```

---

### Task 9: Verify on the static export

- [ ] **Step 1: Build** (foreground, `timeout 600000`; `.env.local` points the builds API at a local worker, so use the production one):

```bash
export NEXT_PUBLIC_BUILDS_URL="$(grep '^NEXT_PUBLIC_BUILDS_URL=' .env.production | cut -d= -f2-)"
npm run build
```

Never stage `public/sitemap.xml` or `data/graph-stats.json`; restore them with `git checkout -- public/sitemap.xml data/graph-stats.json` when done.

- [ ] **Step 2: Temporary Playwright spec** `e2e/smoke-zz-settings-window.spec.js` (matches `testMatch` `smoke-*.spec.js`; delete it after the run):

```js
import { test, expect } from '@playwright/test';
import { waitForRender } from './wait-helpers.js';

const open = async (page) => {
  await page.goto('/dashboard?demo=true');
  await page.getByRole('button', { name: 'Configure alerts' }).waitFor({ timeout: 60_000 });
  await waitForRender(page);
  await page.getByRole('button', { name: 'Configure alerts' }).click();
  await page.getByRole('dialog').waitFor();
};

test('desktop: search, edit, undo, reset all', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const dialog = page.getByRole('dialog').first();
  await dialog.getByLabel('Search alerts').fill('salt');
  await expect(dialog.getByText('While searching, counts are results')).toBeVisible();
  await dialog.getByLabel('Search alerts').fill('');
  await dialog.getByRole('button', { name: 'Turn all off' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  const edits = await page.evaluate(() => JSON.parse(localStorage.getItem('trackers'))?.edits ?? {});
  expect(Object.keys(edits).some((key) => key.startsWith('account.General'))).toBe(false);
  await page.screenshot({ path: 'test-results/settings-desktop.png' });
  expect(errors).toEqual([]);
});

test('mobile: menu then section', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const dialog = page.getByRole('dialog').first();
  await dialog.getByRole('button', { name: /World 3/ }).click();
  await expect(dialog.getByLabel('Back to sections')).toBeVisible();
  await page.screenshot({ path: 'test-results/settings-mobile.png' });
});
```

Run (foreground, `timeout 580000`): `npx playwright test e2e/smoke-zz-settings-window.spec.js e2e/hydration.spec.js --reporter=line`
Expected: all pass. Read both screenshots and compare them with the mockup boards 1 and 9b; report visible differences.

- [ ] **Step 3: Clean up and report**

Delete the temporary spec, restore the build by-products, run `git status`, and report results and screenshots. Do not commit anything in this task. Propose a patch note to the user (ask before adding it).

---

## Not in R2 (deliberate)

- Scroll-spy highlighting in the menu: tracker links jump and highlight instead.
- The Timers tab uses the same section menu and compact grid as the others instead of all sections on one page.
- A deep link to an alert the current filter hides resets the filter to All instead of showing a banner.
- The quick-edit popover (R3).
