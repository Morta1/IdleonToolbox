# Dashboard alert settings R3 (quick edit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking an alert icon on the dashboard opens a small popover with that alert's own setting, "Saved automatically", an Undo snackbar and an "All <tracker> settings" link to the full window; timers get the same; plus the R2 leftovers and the spec's GA events.

**Architecture:** One pure module, `utility/dashboard/quickEdit.js`, turns (config, view model, alert target, item keys, worlds) into a popover model with a `kind`. `AlertQuickEdit.jsx` renders that model with the R2 controls (`NumberField`, `PickerTiles`, `ToggleChips`, `Help`) and calls the same `settingsActions`. The page owns the popover state, the undo snapshot and the link to the full window; alerts reach it through the existing context, now carrying the clicked element and optional `{ items, worlds }`.

**Tech Stack:** Next.js 16 pages router (static export), React 19 + React Compiler, MUI v6, `@mantine/hooks` v7, Vitest (`node` + `jsdom` projects), Playwright on the static export.

**Spec:** `docs/superpowers/specs/2026-10-06-dashboard-alert-settings-design.md` (section 4 Quick edit popover, Analytics, Decisions). **Mockups:** https://claude.ai/artifact/CfkcAvNyvhdQXWNWN7ZqKq (artboard 8 "quick edit cases").

## Global Constraints

- Branch `feat/dashboard-alert-settings`. One commit per task (husky pre-commit runs `npm test`, ~50 s: use a 300000 ms timeout; on an `index.lock` error wait a second and retry). Never push, stash, reset or checkout. Run `git branch --show-current` before committing; it must print `feat/dashboard-alert-settings`.
- Saved format and `utility/dashboard/trackerStore.js` behaviour do not change. Display text comes only from `utility/dashboard/alertMeta.js`, falling back to the key.
- A switch turns a whole alert (tracker) on or off; a checkbox is one option. Same on every surface, popover included. Paired trackers (one switch for the tracker and its only option) keep the R2 rule in `toggleTracker`.
- Every popover change saves at once through the page's `handleConfigChange` (the same path as the full window).
- No `localStorage` in render; first render identical on build and client.
- No `useMemo` / `useCallback` / IIFEs (React Compiler). Comments few, why not what. No em dashes in UI copy, comments or messages. Tooltips only on an InfoIcon, never on plain text.
- Colors: theme tokens only (`primary.main`, `text.secondary`, `action.selected`, `divider`, `background.paper`).
- Touch targets at least 44 px below `sm`. Every icon-only control has an `aria-label`. Clickable alert icons are `role="button"`, `tabIndex={0}`, open on Enter and Space, and carry `aria-haspopup="dialog"`.
- MUI v6 prop names: `inputProps` on Switch/Checkbox, `slotProps.htmlInput` / `slotProps.input` on TextField, `slotProps.paper` on Popover, `PaperProps` on Dialog, `ContentProps` on Snackbar.
- Component tests start with `// @vitest-environment jsdom`, import the polyfills (`'../../polyfills'` or `'../../../polyfills'` by depth), wrap renders in `<ThemeProvider theme={darkTheme}>` (`styles/theme/darkTheme`), and query the render's own `container` or `document.body` (never `screen`: stale under `isolate: false`). Popovers portal to `document.body`.
- GA calls go through `trackSettingsEvent` (Task 1). No query text, character names or values in any event.
- `npx vitest run <files>` and `npx eslint <files>` from the worktree root (`npm run lint` is broken on Next 16). The repo carries pre-existing `react-hooks/set-state-in-effect` and `exhaustive-deps` hits; do not add new ones.

## File Structure

| File | Responsibility |
|---|---|
| Create `utility/dashboard/settingsAnalytics.js` | `trackSettingsEvent`, `resetScope` |
| Modify `utility/dashboard/settingsActions.js` | `runAction` dispatcher shared by the window and the popover |
| Modify `utility/dashboard/settingsModel.js` | Search returns paired trackers as one tracker row |
| Create `utility/dashboard/quickEdit.js` | `matchPickerKey`, `buildQuickEdit`: popover model per alert |
| Modify `components/dashboard/settings/OptionRow.jsx` | Export `Help`, `PickerTiles`, `ToggleChips` |
| Modify `components/dashboard/settings/TrackerCard.jsx` | No "N of M options on" on paired cards |
| Modify `components/dashboard/settings/SearchResults.jsx` | Paired inline trackers render as a card header (switch + number) |
| Create `components/dashboard/settings/AlertQuickEdit.jsx` | The popover |
| Modify `components/common/context/DashboardSettingsProvider.jsx` | `useAlertSettingsProps(configType, target, extra)` |
| Modify `components/common/DashboardSettings.jsx` | `runAction`, reset and search GA events |
| Modify `pages/dashboard.jsx` | Popover state, undo snackbar, opened GA event |
| Modify `components/dashboard/Account.jsx`, `Characters.jsx` | Alerts use the hook; picker alerts pass `items`, Royal Guardian ranks pass `worlds` |
| Modify `components/dashboard/Etc.jsx` | `TimerIcon` with a target on every timer |
| Tests in `__test__/utility/` and `__test__/components/settings/` | See each task |

---

### Task 1: Analytics helper, shared action dispatcher, window GA events

**Files:**
- Create: `utility/dashboard/settingsAnalytics.js`
- Modify: `utility/dashboard/settingsActions.js` (append `runAction`)
- Modify: `components/common/DashboardSettings.jsx`
- Test: `__test__/utility/settings-analytics.test.js`, `__test__/utility/settings-actions.test.js` (append), `__test__/components/settings/dashboard-settings.test.jsx` (append)

**Interfaces:**
- Consumes: `allTrackers`, `searchModel` from `settingsModel`; existing actions in `settingsActions`.
- Produces:
  - `trackSettingsEvent(name: string, params?: object): void` — no-op without `window.gtag`; sends `gtag('event', name, { event_category: 'dashboard', ...params })`.
  - `resetScope(model, prefix: string | null): 'all' | 'section' | 'tracker' | 'option'`
  - `runAction(base, config, name: string, ...args): config` — `'resetPath'` calls `resetPath(base, config, ...args)`, every other name calls that action with `(config, ...args)`.

- [ ] **Step 1: Write the failing tests**

`__test__/utility/settings-analytics.test.js`:

```js
import '../../polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { resolveTrackers } from '@utility/dashboard/trackerStore';
import { buildModel } from '@utility/dashboard/settingsModel';
import { resetScope, trackSettingsEvent } from '@utility/dashboard/settingsAnalytics';

const model = buildModel(resolveTrackers(baseTrackers, {}), baseTrackers, {});

describe('trackSettingsEvent', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('does nothing without gtag', () => {
    expect(() => trackSettingsEvent('alert_settings_opened', { source: 'button' })).not.toThrow();
  });

  it('sends the event under the dashboard category', () => {
    const gtag = vi.fn();
    globalThis.window = { gtag };
    trackSettingsEvent('alert_settings_opened', { source: 'alert' });
    expect(gtag).toHaveBeenCalledWith('event', 'alert_settings_opened', { event_category: 'dashboard', source: 'alert' });
  });
});

describe('resetScope', () => {
  it('names what a reset prefix covers', () => {
    expect(resetScope(model, null)).toBe('all');
    expect(resetScope(model, 'account.World 3')).toBe('section');
    expect(resetScope(model, 'characters')).toBe('section');
    expect(resetScope(model, 'account.World 3.construction')).toBe('tracker');
    expect(resetScope(model, 'account.World 3.construction.materials')).toBe('option');
  });
});
```

Append to `__test__/utility/settings-actions.test.js` (reuse the file's existing imports of `baseTrackers`, `resolveTrackers`, `diffTrackers`; add `runAction` to its `settingsActions` import):

```js
describe('runAction', () => {
  it('dispatches by name and gives resetPath the base', () => {
    const config = resolveTrackers(baseTrackers, {});
    const tracker = { configType: 'account', section: 'World 3', name: 'construction', on: true, paired: false };
    const off = runAction(baseTrackers, config, 'toggleOption', tracker, 'materials');
    expect(diffTrackers(baseTrackers, off)).toEqual({ 'account.World 3.construction.materials': { checked: false } });
    const back = runAction(baseTrackers, off, 'resetPath', 'account.World 3.construction');
    expect(diffTrackers(baseTrackers, back)).toEqual({});
  });
});
```

If `account.World 3.construction.materials` is not on by default in `baseTrackers`, the expected diff is `{ checked: true }`; check the base value first and write the assertion to match it.

Append to `__test__/components/settings/dashboard-settings.test.jsx` (add `afterEach`, `vi` to the vitest import):

```jsx
describe('DashboardSettings analytics', () => {
  let gtag;
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => {};
  });
  beforeEach(() => {
    gtag = vi.fn();
    window.gtag = gtag;
  });
  afterEach(() => {
    delete window.gtag;
  });

  it('Reset all sends alert_settings_reset with scope all', () => {
    render(<Harness edits={{ 'timers.World 3.closestSalt': { checked: false } }}/>);
    fireEvent.click(button('Reset all'));
    fireEvent.click([...document.body.querySelectorAll('[role="alertdialog"] button')].find((b) => b.textContent === 'Reset all'));
    expect(gtag).toHaveBeenCalledWith('event', 'alert_settings_reset', expect.objectContaining({ scope: 'all' }));
  });

  it('search sends one debounced event with the result count and no query text', async () => {
    render(<Harness/>);
    const input = document.body.querySelector('input[aria-label="Search alerts"]');
    fireEvent.change(input, { target: { value: 'sal' } });
    fireEvent.change(input, { target: { value: 'salt' } });
    await waitFor(() => expect(gtag).toHaveBeenCalledWith('event', 'alert_settings_search', expect.objectContaining({ results: expect.any(Number) })), { timeout: 2500 });
    const calls = gtag.mock.calls.filter(([, name]) => name === 'alert_settings_search');
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0])).not.toContain('salt');
  });
});
```

The existing file imports `beforeAll` already; add `beforeEach` and `afterEach` to the same import.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __test__/utility/settings-analytics.test.js __test__/utility/settings-actions.test.js __test__/components/settings/dashboard-settings.test.jsx`
Expected: FAIL (module `settingsAnalytics` not found, `runAction` not exported, no gtag calls).

- [ ] **Step 3: Implement**

`utility/dashboard/settingsAnalytics.js`:

```js
import { allTrackers } from './settingsModel';

export const trackSettingsEvent = (name, params = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, { event_category: 'dashboard', ...params });
};

export const resetScope = (model, prefix) => {
  if (!prefix) return 'all';
  if (model.some((tab) => tab.sections.some((section) => section.key === prefix))) return 'section';
  return allTrackers(model).some((tracker) => tracker.path === prefix) ? 'tracker' : 'option';
};
```

Append to `utility/dashboard/settingsActions.js`:

```js
const actions = {
  toggleTracker, toggleOption, setOptionValue, togglePickerItem, setPickerAll, setPerWorld, clearPerWorld, setSectionOn
};

export const runAction = (base, config, name, ...args) => name === 'resetPath'
  ? resetPath(base, config, ...args)
  : actions[name](config, ...args);
```

In `components/common/DashboardSettings.jsx`:

1. Imports: add `useDebouncedValue` from `@mantine/hooks`; `resetScope, trackSettingsEvent` from `@utility/dashboard/settingsAnalytics`. Replace `import * as settingsActions from '@utility/dashboard/settingsActions';` with `import { runAction } from '@utility/dashboard/settingsActions';`.
2. Replace the `run` / `onAction` / `onBulk` block with:

```jsx
  const run = (name, ...args) => {
    if (name === 'resetPath') trackSettingsEvent('alert_settings_reset', { scope: resetScope(model, args[0]) });
    return runAction(baseTrackers, config, name, ...args);
  };
  const onAction = (name, ...args) => onChange(run(name, ...args));
```

Keep `showUndo` and `onBulk` as they are (they already call `run`).

3. After the `query` state, add the debounced search event:

```jsx
  // One event per pause in typing, carrying only how many results the query found.
  const [settledQuery] = useDebouncedValue(query.trim(), 1000);
  useEffect(() => {
    if (open && settledQuery) trackSettingsEvent('alert_settings_search', { results: searchModel(model, settledQuery).length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledQuery]);
```

Place this after `model` is defined (it already is, at the top of the component).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __test__/utility/settings-analytics.test.js __test__/utility/settings-actions.test.js __test__/components/settings/dashboard-settings.test.jsx`
Expected: PASS. Then `npx eslint utility/dashboard/settingsAnalytics.js utility/dashboard/settingsActions.js components/common/DashboardSettings.jsx`: no new errors.

- [ ] **Step 5: Commit**

```bash
git add utility/dashboard/settingsAnalytics.js utility/dashboard/settingsActions.js components/common/DashboardSettings.jsx __test__/utility/settings-analytics.test.js __test__/utility/settings-actions.test.js __test__/components/settings/dashboard-settings.test.jsx
git commit -m "Dashboard: GA events for alert settings resets and search"
```

---

### Task 2: R2 leftovers (paired cards and search)

**Files:**
- Modify: `components/dashboard/settings/TrackerCard.jsx`
- Modify: `utility/dashboard/settingsModel.js` (`searchModel`)
- Modify: `components/dashboard/settings/SearchResults.jsx`
- Test: `__test__/components/settings/tracker-card.test.jsx`, `__test__/utility/settings-model.test.js`, `__test__/components/settings/section-nav-search.test.jsx` (append)

**Interfaces:**
- Consumes: tracker flags `paired`, `inline` from `buildModel`.
- Produces: `searchModel` never returns `{ option }` results for a paired tracker; it returns one `{ option: null }` result for it instead.

Background: a paired tracker has one switch for itself and its only option (Library "books", for example). Its card says "1 of 1 options on", which means nothing, and search lists the option as its own row with a checkbox the card never shows.

- [ ] **Step 1: Write the failing tests**

Append to `__test__/components/settings/tracker-card.test.jsx`:

```jsx
  it('paired inline cards do not count options', () => {
    const tracker = trackerFor('account.World 3.library');
    expect(tracker.paired).toBe(true);
    const container = renderIn(<TrackerCard tracker={tracker} expanded={false} onToggleExpanded={() => {}} onAction={() => {}}/>);
    expect(container.textContent).not.toContain('options on');
  });
```

(Put it inside the existing `describe('TrackerCard', ...)` block.)

Append to `__test__/utility/settings-model.test.js`:

```js
describe('searchModel and paired trackers', () => {
  it('an option hit on a paired tracker returns the tracker once', () => {
    const model = modelFor();
    const library = searchModel(model, 'books').filter(({ tracker }) => tracker.path === 'account.World 3.library');
    expect(library).toHaveLength(1);
    expect(library[0].option).toBeNull();
  });
});
```

If the Library books option label in `alertMeta` does not contain "books", search for a word from that label instead; the assertion stays the same.

Append to `__test__/components/settings/section-nav-search.test.jsx`, reusing that file's imports and helpers (add any missing import of `SearchResults`, `searchModel`, `buildModel`, `resolveTrackers`, `diffTrackers`, `baseTrackers`):

```jsx
describe('SearchResults with a paired inline tracker', () => {
  it('shows the switch and the inline number, not a lone checkbox', () => {
    const config = resolveTrackers(baseTrackers, {});
    const model = buildModel(config, baseTrackers, diffTrackers(baseTrackers, config));
    const results = searchModel(model, 'books').filter(({ tracker }) => tracker.path === 'account.World 3.library');
    const container = render(<ThemeProvider theme={darkTheme}>
      <SearchResults results={results} query="books" onAction={() => {}} onShow={() => {}}/>
    </ThemeProvider>).container;
    const library = results[0].tracker;
    expect(container.querySelector(`[aria-label="${library.label} alerts"]`)).toBeTruthy();
    expect(container.querySelector('input[type="number"]')).toBeTruthy();
    expect(container.querySelector('input[type="checkbox"]:not([role="switch"])')).toBeFalsy();
  });
});
```

MUI renders the Switch input as `type="checkbox"` with no `role`; if the last assertion cannot tell the two apart, assert instead that no element has `aria-label` equal to the option's label (`library.options[0].label`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __test__/components/settings/tracker-card.test.jsx __test__/utility/settings-model.test.js __test__/components/settings/section-nav-search.test.jsx`
Expected: FAIL on the three new tests.

- [ ] **Step 3: Implement**

`TrackerCard.jsx`, in `TrackerCard`, replace the caption line:

```jsx
        {!tracker.paired
          ? <Typography variant="caption" color="text.secondary">{tracker.onCount} of {tracker.total} options on</Typography> : null}
```

`settingsModel.js`, in `searchModel`, replace the `tracker.options.forEach` block:

```js
    // A paired tracker's only option has no row of its own anywhere, so a hit on it is a hit on the tracker.
    const trackerListed = () => results.some((result) => result.tracker === tracker && !result.option);
    tracker.options.forEach((option) => {
      if (option.foldInto) return;
      if (!hit(tracker.label, option.label, option.help, option.name)) return;
      if (!tracker.paired) results.push({ tab, section, tracker, option });
      else if (!trackerListed()) results.push({ tab, section, tracker, option: null });
    });
```

`SearchResults.jsx`: import `TrackerCard` (default export) alongside `CompactRow`, and replace the `result.option ? ... : <CompactRow .../>` expression with:

```jsx
            {result.option
              ? <OptionRow option={result.option} tracker={result.tracker} onAction={onAction} {...optionExtras(result.tracker, result.option)}/>
              : result.tracker.inline
                ? <TrackerCard tracker={result.tracker} expanded={false} onToggleExpanded={() => {}} onAction={onAction}/>
                : <CompactRow tracker={result.tracker} onAction={onAction}/>}
```

- [ ] **Step 4: Run tests to verify they pass**

Run the same command. Expected: PASS. Also run `npx vitest run __test__/components/settings` (all settings tests) and `npx eslint` on the three source files.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/settings/TrackerCard.jsx utility/dashboard/settingsModel.js components/dashboard/settings/SearchResults.jsx __test__/components/settings/tracker-card.test.jsx __test__/utility/settings-model.test.js __test__/components/settings/section-nav-search.test.jsx
git commit -m "Dashboard: paired alert cards drop the option count and search shows them as one row"
```

---

### Task 3: Quick edit model

**Files:**
- Create: `utility/dashboard/quickEdit.js`
- Test: `__test__/utility/quick-edit.test.js`

**Interfaces:**
- Consumes: `resolveSettingsTarget(config, configType, target)` → `{ tab, configType, section, trackerName, optionName } | null`; `allTrackers(model)`, `fallbackLabel(name)` from `settingsModel`; `items` from `@website-data` (item display names).
- Produces:
  - `matchPickerKey(option, key): string | null` — the picker key in `option.props.value` that `key` names: exact match first, then a match ignoring case and every character that is not a letter or digit (so `ITS_YOUR_BIRTHDAY!` finds `itsYourBirthday!`, `3` finds `'3'`).
  - `buildQuickEdit(config, model, configType, target, extra = {}): QuickEdit | null` where `extra = { items?: [{ key, label? }], worlds?: number[] }` and

```
QuickEdit = {
  kind: 'tracker' | 'checkbox' | 'threshold' | 'perWorld' | 'picker' | 'pickerItems',
  tracker,            // view-model tracker from buildModel
  option,             // view-model option or null (kind 'tracker': the inline option, if any)
  parent,             // option this one depends on, or null
  dependents,         // options that depend on this one
  folded,             // options folded into this one (rendered with it)
  items,              // [{ key, label, on }] for 'pickerItems', else []
  worlds,             // [{ world, value, overridden }] for 'perWorld', else []
  everyCharacter,     // configType === 'characters'
  trackerSwitch,      // true: the popover's first control is the tracker switch, not the option checkbox
  configType, target  // as passed
}
```

Rules, in order:

1. Unresolvable target, or no tracker: `null` (the page then opens the full window).
2. Option = the resolved option; when none resolved and `extra.items` is non-empty, the tracker's first `type: 'array'` option that `matchPickerKey` accepts for at least one item.
3. `tracker.paired` or no option: kind `'tracker'`, `option` = the tracker's inline option or null.
4. `type: 'array'`: `'pickerItems'` when at least one item matched (deduplicated by matched key, in the given order), else `'picker'`.
5. `type: 'input'`: `'perWorld'` when `option.props.perWorld` exists and `extra.worlds` has at least one world 1-7 (deduplicated, ascending), else `'threshold'`.
6. Otherwise `'checkbox'`.
7. `trackerSwitch` is true for kind `'tracker'` and for every timers target (timer alerts are gated by the tracker alone; `Etc.jsx` never reads a timer option's `checked`).
8. Item label: the given `label`, else the item's display name from `items[key].displayName` with underscores as spaces, else `fallbackLabel(key)`.

- [ ] **Step 1: Write the failing tests**

`__test__/utility/quick-edit.test.js`:

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers } from '@utility/dashboard/trackerStore';
import { allTrackers, buildModel } from '@utility/dashboard/settingsModel';
import { buildQuickEdit, matchPickerKey } from '@utility/dashboard/quickEdit';

const setup = (edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return { config, model: buildModel(config, baseTrackers, diffTrackers(baseTrackers, config)) };
};
const quick = (configType, target, extra, edits) => {
  const { config, model } = setup(edits);
  return buildQuickEdit(config, model, configType, target, extra);
};

describe('matchPickerKey', () => {
  const option = { props: { value: { printerGoBrrr: true, 'itsYourBirthday!': true, 1: true } } };
  it('matches exactly, then ignoring case and punctuation', () => {
    expect(matchPickerKey(option, 'printerGoBrrr')).toBe('printerGoBrrr');
    expect(matchPickerKey(option, 'PRINTER_GO_BRRR')).toBe('printerGoBrrr');
    expect(matchPickerKey(option, 'ITS_YOUR_BIRTHDAY!')).toBe('itsYourBirthday!');
    expect(matchPickerKey(option, 1)).toBe('1');
    expect(matchPickerKey(option, 'nope')).toBeNull();
  });
});

describe('buildQuickEdit', () => {
  it('unknown targets give null', () => {
    expect(quick('account', 'Nowhere.nothing')).toBeNull();
  });

  it('an on/off option is a checkbox', () => {
    const result = quick('account', 'General.etc.keys');
    expect(result.kind).toBe('checkbox');
    expect(result.option.name).toBe('keys');
    expect(result.trackerSwitch).toBe(false);
    expect(result.everyCharacter).toBe(false);
  });

  it('a number option is a threshold', () => {
    const result = quick('account', 'General.etc.miniBosses');
    expect(result.kind).toBe('threshold');
    expect(result.option.name).toBe('miniBosses');
  });

  it('a picker alert with its item key watches that item', () => {
    const result = quick('account', 'World 3.construction.saltDeficit', { items: [{ key: 'Refinery2', label: 'Frigid Soul' }] });
    expect(result.kind).toBe('pickerItems');
    expect(result.option.name).toBe('saltBalance');
    expect(result.items).toEqual([{ key: 'Refinery2', label: 'Frigid Soul', on: true }]);
    expect(result.folded.map(({ name }) => name)).toEqual(['saltBalanceDirection']);
  });

  it('item keys that are not in the picker fall back to the whole picker', () => {
    const result = quick('account', 'World 3.construction.rankUp', { items: [{ key: 'NotASalt' }] });
    expect(result.kind).toBe('picker');
    expect(result.items).toEqual([]);
  });

  it('item labels default to the item display name', () => {
    const result = quick('account', 'World 3.printer.atoms', { items: [{ key: 'Copper' }] });
    expect(result.kind).toBe('pickerItems');
    expect(result.items[0].label).toBe('Copper Ore');
  });

  it('a parent option lists its dependent', () => {
    const result = quick('account', 'World 3.construction.materials', { items: [{ key: 'Refinery1' }] });
    expect(result.dependents.map(({ name }) => name)).toEqual(['matsThreshold']);
  });

  it('a dependent option carries its parent', () => {
    const result = quick('account', 'World 3.construction.matsThreshold');
    expect(result.parent.name).toBe('materials');
  });

  it('character alerts apply to every character and match talent names', () => {
    const result = quick('characters', 'talents.talents', { items: [{ key: 'ITS_YOUR_BIRTHDAY!', label: 'Its Your Birthday!' }] });
    expect(result.kind).toBe('pickerItems');
    expect(result.items[0].key).toBe('itsYourBirthday!');
    expect(result.everyCharacter).toBe(true);
  });

  it('single-alert trackers are the tracker switch', () => {
    const result = quick('characters', 'tools');
    expect(result.kind).toBe('tracker');
    expect(result.trackerSwitch).toBe(true);
    expect(result.option).toBeNull();
  });

  it('a paired inline tracker is the switch plus its number', () => {
    const result = quick('account', 'World 3.library.books');
    expect(result.kind).toBe('tracker');
    expect(result.option.name).toBe('books');
  });

  it('Royal Guardian ranks list the alerted worlds with their overrides', () => {
    const result = quick('account', 'World 7.royalGuardian.tradeRank', { worlds: [5, 3, 3, 0] },
      { 'account.World 7.royalGuardian.tradeRank': { perWorld: { 3: '15' } } });
    expect(result.kind).toBe('perWorld');
    expect(result.worlds).toEqual([
      { world: 3, value: '15', overridden: true },
      { world: 5, value: null, overridden: false }
    ]);
  });

  it('Royal Guardian ranks without worlds are a plain threshold', () => {
    expect(quick('account', 'World 7.royalGuardian.tradeRank').kind).toBe('threshold');
  });

  it('timers use the tracker switch, with a picker item when given', () => {
    expect(quick('timers', 'General.daily').kind).toBe('tracker');
    const salt = quick('timers', 'World 3.closestSalt', { items: [{ key: 'Refinery1' }] });
    expect(salt.kind).toBe('pickerItems');
    expect(salt.option.name).toBe('salts');
    expect(salt.trackerSwitch).toBe(true);
  });

  it('reads live state from the config it is given', () => {
    const result = quick('account', 'General.etc.keys', {}, { 'account.General.etc.keys': { checked: false } });
    expect(result.option.checked).toBe(false);
    const tracker = allTrackers(setup().model).find(({ path }) => path === 'account.General.etc');
    expect(result.tracker.path).toBe(tracker.path);
  });
});
```

Check two facts in the data before running and adjust the literal, not the rule, if they differ: the display name of item `Copper` in `data/website-data.json` (`items.Copper.displayName`, expected `Copper_Ore`), and that the `perWorld` edit shape in the Royal Guardian test matches how R1 stores per-world values (look at an existing per-world test in `__test__/utility/` and use the same shape). `rankUp`'s target alias: `World 3.construction.rankUp` names the `rankUp` option directly.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __test__/utility/quick-edit.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`utility/dashboard/quickEdit.js`:

```js
import { items as itemData } from '@website-data';
import { resolveSettingsTarget } from './settingsTarget';
import { allTrackers, fallbackLabel } from './settingsModel';

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
    trackerSwitch: kind === 'tracker' || configType === 'timers',
    configType,
    target
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __test__/utility/quick-edit.test.js` → PASS. `npx eslint utility/dashboard/quickEdit.js`.

- [ ] **Step 5: Commit**

```bash
git add utility/dashboard/quickEdit.js __test__/utility/quick-edit.test.js
git commit -m "Dashboard: quick edit model for a single alert"
```

---

### Task 4: AlertQuickEdit popover

**Files:**
- Modify: `components/dashboard/settings/OptionRow.jsx` (export `Help`, `PickerTiles`, `ToggleChips`; no behaviour change)
- Create: `components/dashboard/settings/AlertQuickEdit.jsx`
- Test: `__test__/components/settings/alert-quick-edit.test.jsx`

**Interfaces:**
- Consumes: `QuickEdit` from Task 3; `NumberField`, `Help`, `PickerTiles`, `ToggleChips` from `OptionRow`; `optionExtras(tracker, option)` from `settingsModel` (`disabledReason`); `clampValue` from `settingsActions`; `LetterBadge` from `./LetterBadge` (props `label`, `size`, `radius`, `sx`).
- Produces: default export `AlertQuickEdit({ quickEdit, open, anchorPosition, onClose, onAction, onOpenAll })`.
  - `anchorPosition: { top, left }` (page coordinates from the clicked icon; the icon may unmount when its alert stops showing, so the popover never anchors to the element).
  - `onAction(name, ...args)` with the same names and arguments the full window uses (`toggleTracker`, `toggleOption`, `setOptionValue`, `togglePickerItem`, `setPickerAll`, `setPerWorld`, `resetPath`).
  - `onOpenAll()` — the "All <tracker> settings" button.
  - Renders nothing when `quickEdit` is null.

Layout (artboard 8): 340 px wide (`maxWidth: calc(100vw - 32px)`), padding 2. Header: tracker icon (24 px, or `LetterBadge` size 24) and the tracker label as the dialog title (`id` used by `aria-labelledby`). Body by kind, below. Footer, above a divider: "Saved automatically" (caption, `text.secondary`) on the left and a text button "All <tracker label> settings" on the right. Characters add the caption "Applies to every character" above the footer.

Body:

| kind | First control | Then |
|---|---|---|
| tracker | Switch "<tracker> alerts" (`toggleTracker`) | inline option: `NumberField` |
| checkbox | parent checkbox (if any), then the option checkbox | disabled reason, help, dependents |
| threshold | option checkbox | `NumberField` (disabled while the option is off or locked), help, dependents |
| perWorld | option checkbox | "Main value" `NumberField`; one row per world: an overridden world shows a "World N value" field and a "Use main value" button; any other shows a "Set a value for World N only" button that copies the main value into that world |
| picker | option checkbox (tracker switch when `trackerSwitch`) | `PickerTiles` for `props.type === 'img'`, else `ToggleChips`; folded options as `ToggleChips` with their label |
| pickerItems | option checkbox (tracker switch when `trackerSwitch`) | one checkbox per item, labelled "Watch <item label>" (`togglePickerItem`); folded options; dependents |

Dependents render as their own checkbox and, for an input, a `NumberField` disabled while the parent is off. A per-world field keeps a local draft so clearing it while typing does not remove the override; blur with an empty draft removes it (`setPerWorld(..., '')`), blur otherwise clamps.

- [ ] **Step 1: Write the failing test**

`__test__/components/settings/alert-quick-edit.test.jsx`:

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
import { buildModel } from '@utility/dashboard/settingsModel';
import { buildQuickEdit } from '@utility/dashboard/quickEdit';
import AlertQuickEdit from '@components/dashboard/settings/AlertQuickEdit';

const quickFor = (configType, target, extra, edits = {}) => {
  const config = resolveTrackers(baseTrackers, edits);
  return buildQuickEdit(config, buildModel(config, baseTrackers, diffTrackers(baseTrackers, config)), configType, target, extra);
};
const open = (quickEdit, props = {}) => {
  render(<ThemeProvider theme={darkTheme}>
    <AlertQuickEdit quickEdit={quickEdit} open anchorPosition={{ top: 10, left: 10 }} onClose={() => {}}
                    onAction={props.onAction ?? (() => {})} onOpenAll={props.onOpenAll ?? (() => {})}/>
  </ThemeProvider>);
  return document.body.querySelector('[role="dialog"]');
};
const byLabel = (root, label) => root.querySelector(`[aria-label="${label}"]`);

describe('AlertQuickEdit', () => {
  it('a checkbox alert: title, checkbox, saved note and the full settings link', () => {
    const onAction = vi.fn();
    const onOpenAll = vi.fn();
    const quickEdit = quickFor('account', 'General.etc.keys');
    const dialog = open(quickEdit, { onAction, onOpenAll });
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(dialog.textContent).toContain(quickEdit.tracker.label);
    expect(dialog.textContent).toContain('Saved automatically');
    fireEvent.click(byLabel(dialog, quickEdit.option.label));
    expect(onAction).toHaveBeenCalledWith('toggleOption', quickEdit.tracker, 'keys');
    fireEvent.click([...dialog.querySelectorAll('button')].find((b) => b.textContent === `All ${quickEdit.tracker.label} settings`));
    expect(onOpenAll).toHaveBeenCalled();
  });

  it('a threshold alert edits its number', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'General.etc.miniBosses');
    const dialog = open(quickEdit, { onAction });
    fireEvent.change(dialog.querySelector('input[type="number"]'), { target: { value: '5' } });
    expect(onAction).toHaveBeenCalledWith('setOptionValue', quickEdit.tracker, 'miniBosses', '5');
  });

  it('a picker item alert offers Watch <item>', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'World 3.construction.saltDeficit', { items: [{ key: 'Refinery2', label: 'Frigid Soul' }] });
    const dialog = open(quickEdit, { onAction });
    fireEvent.click(byLabel(dialog, 'Watch Frigid Soul'));
    expect(onAction).toHaveBeenCalledWith('togglePickerItem', quickEdit.tracker, 'saltBalance', 'Refinery2');
  });

  it('character alerts say they apply to every character', () => {
    const dialog = open(quickFor('characters', 'talents.talents', { items: [{ key: 'PRINTER_GO_BRRR' }] }));
    expect(dialog.textContent).toContain('Applies to every character');
  });

  it('single-alert trackers show the tracker switch', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('characters', 'tools');
    const dialog = open(quickEdit, { onAction });
    fireEvent.click(byLabel(dialog, `${quickEdit.tracker.label} alerts`));
    expect(onAction).toHaveBeenCalledWith('toggleTracker', quickEdit.tracker);
  });

  it('Royal Guardian: an overridden world edits its own value, others offer one', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'World 7.royalGuardian.tradeRank', { worlds: [3, 5] },
      { 'account.World 7.royalGuardian.tradeRank': { perWorld: { 3: '15' } } });
    const dialog = open(quickEdit, { onAction });
    const world3 = byLabel(dialog, 'World 3 value');
    expect(world3.value).toBe('15');
    fireEvent.change(world3, { target: { value: '16' } });
    expect(onAction).toHaveBeenCalledWith('setPerWorld', quickEdit.tracker, 'tradeRank', 3, '16');
    fireEvent.click([...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Set a value for World 5 only'));
    expect(onAction).toHaveBeenCalledWith('setPerWorld', quickEdit.tracker, 'tradeRank', 5, String(quickEdit.option.props.value));
  });

  it('a per-world field can be cleared while typing without dropping the override', () => {
    const onAction = vi.fn();
    const quickEdit = quickFor('account', 'World 7.royalGuardian.tradeRank', { worlds: [3] },
      { 'account.World 7.royalGuardian.tradeRank': { perWorld: { 3: '15' } } });
    const dialog = open(quickEdit, { onAction });
    const world3 = byLabel(dialog, 'World 3 value');
    fireEvent.change(world3, { target: { value: '' } });
    expect(onAction).not.toHaveBeenCalled();
    fireEvent.blur(world3);
    expect(onAction).toHaveBeenCalledWith('setPerWorld', quickEdit.tracker, 'tradeRank', 3, '');
  });

  it('a parent option shows its dependent, locked while the parent is off', () => {
    const quickEdit = quickFor('account', 'World 3.construction.materials', { items: [{ key: 'Refinery1' }] },
      { 'account.World 3.construction.materials': { checked: false } });
    const dialog = open(quickEdit);
    const dependent = quickEdit.dependents[0];
    expect(dialog.textContent).toContain(dependent.label);
    expect(dialog.querySelector('input[type="number"]').disabled).toBe(true);
  });

  it('timers with a picker item show the tracker switch and Watch <item>', () => {
    const quickEdit = quickFor('timers', 'World 3.closestSalt', { items: [{ key: 'Refinery1', label: 'Redox Salts' }] });
    const dialog = open(quickEdit);
    expect(byLabel(dialog, `${quickEdit.tracker.label} alerts`)).toBeTruthy();
    expect(byLabel(dialog, 'Watch Redox Salts')).toBeTruthy();
  });
});
```

If a default `baseTrackers` value makes an assertion's precondition false (for example `materials` already off, `tools` having an option), fix the edits passed to the test, not the component rule.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __test__/components/settings/alert-quick-edit.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

In `OptionRow.jsx`, change `const Help =`, `const PickerTiles =` and `const ToggleChips =` to `export const ...`. Nothing else.

`components/dashboard/settings/AlertQuickEdit.jsx`:

```jsx
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { prefix } from '@utility/helpers';
import { optionExtras } from '@utility/dashboard/settingsModel';
import { clampValue } from '@utility/dashboard/settingsActions';
import { Help, NumberField, PickerTiles, ToggleChips } from './OptionRow';
import LetterBadge from './LetterBadge';

const TITLE_ID = 'alert-quick-edit-title';
const ROW = { mr: 0, minHeight: { xs: 44, sm: 'auto' } };

const Check = ({ label, checked, disabled = false, onChange }) => <FormControlLabel
  sx={ROW}
  label={<Typography variant="body2">{label}</Typography>}
  control={<Checkbox size="small" checked={Boolean(checked)} disabled={disabled} onChange={onChange}
                     inputProps={{ 'aria-label': label }}/>}/>;

const OptionCheck = ({ option, tracker, disabled, onAction }) => <Check
  label={option.label} checked={option.checked} disabled={disabled}
  onChange={() => onAction('toggleOption', tracker, option.name)}/>;

const TrackerToggle = ({ tracker, onAction }) => <FormControlLabel
  sx={ROW}
  label={<Typography variant="body2">{tracker.label} alerts</Typography>}
  control={<Switch checked={tracker.on} onChange={() => onAction('toggleTracker', tracker)}
                   inputProps={{ 'aria-label': `${tracker.label} alerts` }}/>}/>;

const WorldRow = ({ row, option, tracker, disabled, onAction }) => {
  const [draft, setDraft] = useState(null);
  if (!row.overridden) {
    return <Button size="small" disabled={disabled} sx={{ alignSelf: 'flex-start', minHeight: { xs: 44, sm: 'auto' } }}
                   onClick={() => onAction('setPerWorld', tracker, option.name, row.world, String(option.props.value))}>
      Set a value for World {row.world} only
    </Button>;
  }
  return <Stack direction="row" alignItems="center" gap={1}>
    <TextField size="small" type="number" label={`World ${row.world} value`} disabled={disabled} sx={{ width: 140 }}
               value={draft ?? row.value}
               slotProps={{
                 inputLabel: { shrink: true },
                 htmlInput: { 'aria-label': `World ${row.world} value`, min: option.props.minValue, max: option.props.maxValue }
               }}
               onChange={(e) => {
                 setDraft(e.target.value);
                 if (e.target.value !== '') onAction('setPerWorld', tracker, option.name, row.world, e.target.value);
               }}
               onBlur={(e) => {
                 setDraft(null);
                 const clamped = e.target.value === '' ? '' : clampValue(option, e.target.value);
                 if (clamped === '' || clamped !== e.target.value) onAction('setPerWorld', tracker, option.name, row.world, clamped);
               }}/>
    <Button size="small" disabled={disabled} sx={{ minHeight: { xs: 44, sm: 'auto' } }}
            onClick={() => onAction('setPerWorld', tracker, option.name, row.world, '')}>
      Use main value
    </Button>
  </Stack>;
};

const Dependents = ({ quickEdit, onAction }) => quickEdit.dependents.map((dependent) => {
  const locked = !quickEdit.option.checked;
  return <Box key={dependent.name} sx={{ pl: 3 }}>
    <OptionCheck option={dependent} tracker={quickEdit.tracker} disabled={locked} onAction={onAction}/>
    {dependent.type === 'input'
      ? <NumberField option={dependent} tracker={quickEdit.tracker} onAction={onAction} disabled={locked || !dependent.checked}/>
      : null}
    {locked ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      Turn on {quickEdit.option.label} to use this.
    </Typography> : null}
  </Box>;
});

const Folded = ({ quickEdit, onAction, disabled }) => quickEdit.folded.map((folded) => <Box key={folded.name}>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{folded.label}</Typography>
  {folded.type === 'array' ? <ToggleChips option={folded} tracker={quickEdit.tracker} onAction={onAction} disabled={disabled}/> : null}
</Box>);

const Body = ({ quickEdit, onAction }) => {
  const { kind, tracker, option, parent, items, worlds, trackerSwitch } = quickEdit;
  if (kind === 'tracker') {
    return <>
      <TrackerToggle tracker={tracker} onAction={onAction}/>
      {option?.type === 'input' ? <NumberField option={option} tracker={tracker} onAction={onAction} ariaLabel={`${tracker.label} ${option.label}`}/> : null}
    </>;
  }
  const { disabledReason } = optionExtras(tracker, option);
  const locked = Boolean(disabledReason);
  const first = trackerSwitch
    ? <TrackerToggle tracker={tracker} onAction={onAction}/>
    : <OptionCheck option={option} tracker={tracker} disabled={locked} onAction={onAction}/>;
  return <>
    {parent ? <OptionCheck option={parent} tracker={tracker} onAction={onAction}/> : null}
    <Box sx={parent ? { pl: 3 } : undefined}>{first}</Box>
    {disabledReason ? <Typography variant="body2" color="text.secondary">{disabledReason}</Typography> : null}
    {kind === 'threshold' || kind === 'perWorld'
      ? <Stack gap={0.5}>
        {kind === 'perWorld' ? <Typography variant="caption" color="text.secondary">Main value</Typography> : null}
        <NumberField option={option} tracker={tracker} onAction={onAction} disabled={locked || !option.checked}/>
      </Stack> : null}
    {kind === 'perWorld' ? <Stack gap={1}>
      {worlds.map((row) => <WorldRow key={row.world} row={row} option={option} tracker={tracker} onAction={onAction}
                                     disabled={locked || !option.checked}/>)}
    </Stack> : null}
    {kind === 'picker'
      ? option.props?.type === 'img'
        ? <PickerTiles option={option} tracker={tracker} onAction={onAction} disabled={locked}/>
        : <ToggleChips option={option} tracker={tracker} onAction={onAction} disabled={locked}/>
      : null}
    {kind === 'pickerItems' ? items.map((item) => <Check key={item.key} label={`Watch ${item.label}`} checked={item.on} disabled={locked}
                                                         onChange={() => onAction('togglePickerItem', tracker, option.name, item.key)}/>) : null}
    <Folded quickEdit={quickEdit} onAction={onAction} disabled={locked}/>
    <Help text={option.help}/>
    <Dependents quickEdit={quickEdit} onAction={onAction}/>
  </>;
};

const AlertQuickEdit = ({ quickEdit, open, anchorPosition, onClose, onAction, onOpenAll }) => {
  if (!quickEdit) return null;
  const { tracker, everyCharacter } = quickEdit;
  return <Popover open={open} onClose={onClose} anchorReference="anchorPosition" anchorPosition={anchorPosition}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      role: 'dialog', 'aria-labelledby': TITLE_ID,
                      sx: { width: 340, maxWidth: 'calc(100vw - 32px)', p: 2 }
                    }
                  }}>
    <Stack gap={1.25}>
      <Stack direction="row" alignItems="center" gap={1}>
        {tracker.icon
          ? <img src={`${prefix}${tracker.icon}.png`} alt="" width={24} height={24} style={{ objectFit: 'contain' }}/>
          : <LetterBadge label={tracker.label} size={24} radius={1}/>}
        <Typography id={TITLE_ID} variant="subtitle1" component="h2" fontWeight={500}>{tracker.label}</Typography>
      </Stack>
      <Body quickEdit={quickEdit} onAction={onAction}/>
      {everyCharacter ? <Typography variant="caption" color="text.secondary">Applies to every character</Typography> : null}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}
             sx={{ borderTop: 1, borderColor: 'divider', pt: 1 }}>
        <Typography variant="caption" color="text.secondary">Saved automatically</Typography>
        <Button size="small" sx={{ minHeight: { xs: 44, sm: 'auto' } }} onClick={onOpenAll}>All {tracker.label} settings</Button>
      </Stack>
    </Stack>
  </Popover>;
};

export default AlertQuickEdit;
```

Check `LetterBadge`'s real prop names in `components/dashboard/settings/LetterBadge.jsx` before using it and match them.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __test__/components/settings/alert-quick-edit.test.jsx __test__/components/settings/option-row.test.jsx` → PASS. `npx eslint components/dashboard/settings/AlertQuickEdit.jsx components/dashboard/settings/OptionRow.jsx`.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/settings/AlertQuickEdit.jsx components/dashboard/settings/OptionRow.jsx __test__/components/settings/alert-quick-edit.test.jsx
git commit -m "Dashboard: quick edit popover for a single alert"
```

---

### Task 5: Wire the popover into the dashboard

**Files:**
- Modify: `components/common/context/DashboardSettingsProvider.jsx`
- Modify: `pages/dashboard.jsx`
- Modify: `components/dashboard/Account.jsx` (the `Alert` component only)
- Modify: `components/dashboard/Characters.jsx` (the `Alert` component only)
- Test: `__test__/components/settings/quick-edit-wiring.test.jsx`

**Interfaces:**
- Consumes: `buildQuickEdit` (Task 3), `AlertQuickEdit` (Task 4), `runAction`, `trackSettingsEvent` (Task 1), `buildModel` from `settingsModel`, `diffTrackers` from `trackerStore`.
- Produces:
  - Provider prop `onOpenAlert(element: HTMLElement, configType, target, extra)` replacing `onOpenSettings`.
  - `useAlertSettingsProps(configType, target, extra?)` → `{}` without a target, else `{ role: 'button', tabIndex: 0, 'aria-haspopup': 'dialog', onClick, onKeyDown }`. Both handlers call `event.stopPropagation()` (timer rows navigate on click) and `onOpenAlert(event.currentTarget, configType, target, extra)`; `onKeyDown` only for Enter and Space, with `preventDefault`.
  - `useOpenDashboardSettings` is removed (its two callers move to the hook).
  - Account and Characters `Alert` accept `items` and `worlds` props and pass `{ items, worlds }` as `extra` (Task 6 fills them in).

Page behaviour (`pages/dashboard.jsx`):

- `handleOpenAlert(element, configType, target, extra = {})`: build the quick edit from the current config; when it is `null`, fall back to `handleOpenSettings(configType, target, 'alert')`. Otherwise store `{ id, configType, target, extra, anchorPosition, snapshot: config }`, where `anchorPosition` is `{ top: rect.bottom + 4, left: rect.left }` from `element.getBoundingClientRect()` and `id` increments per opening.
- The popover model is rebuilt from the live config on every render, so a change shows at once.
- `handleQuickAction(name, ...args)`: `handleConfigChange(runAction(baseTrackers, config, name, ...args))`; show the undo snackbar `"<tracker label> settings changed"` with Undo, keyed by the popover's `id` (one snackbar per opening, not one per keystroke); `trackSettingsEvent('alert_quick_edit_changed', { kind })`.
- Undo restores the snapshot taken when the popover opened, closes the popover and hides the snackbar. The snackbar ignores clickaway (same rule as the window), auto-hides after 6000 ms, `ContentProps={{ role: 'status' }}`.
- "All <tracker> settings": close the popover, then `handleOpenSettings(configType, target, 'alert')`.
- `handleOpenSettings(configType, path, source)` sends `alert_settings_opened` with `{ source }`; the "Configure alerts" button sends `source: 'button'`, the defaults note's Review sends `source: 'note'`.

- [ ] **Step 1: Write the failing test**

`__test__/components/settings/quick-edit-wiring.test.jsx` tests the provider hook with a fake alert and a page-like harness, so it does not need the whole dashboard:

```jsx
// @vitest-environment jsdom
import '../../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { DashboardSettingsProvider, useAlertSettingsProps } from '@components/common/context/DashboardSettingsProvider';

const FakeAlert = ({ target, extra, onRowClick }) => {
  const props = useAlertSettingsProps('account', target, extra);
  return <div onClick={onRowClick}><span data-testid="icon" {...props}>icon</span></div>;
};

describe('useAlertSettingsProps', () => {
  it('without a target the icon is not interactive', () => {
    const onOpenAlert = vi.fn();
    const { container } = render(<DashboardSettingsProvider onOpenAlert={onOpenAlert}><FakeAlert/></DashboardSettingsProvider>);
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('role')).toBeNull();
    fireEvent.click(icon);
    expect(onOpenAlert).not.toHaveBeenCalled();
  });

  it('click and Enter open the quick edit with the element and extras, without bubbling', () => {
    const onOpenAlert = vi.fn();
    const onRowClick = vi.fn();
    const extra = { items: [{ key: 'Refinery1' }] };
    const { container } = render(<DashboardSettingsProvider onOpenAlert={onOpenAlert}>
      <FakeAlert target="World 3.construction.materials" extra={extra} onRowClick={onRowClick}/>
    </DashboardSettingsProvider>);
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon.getAttribute('role')).toBe('button');
    expect(icon.getAttribute('tabindex')).toBe('0');
    expect(icon.getAttribute('aria-haspopup')).toBe('dialog');
    fireEvent.click(icon);
    expect(onOpenAlert).toHaveBeenCalledWith(icon, 'account', 'World 3.construction.materials', extra);
    expect(onRowClick).not.toHaveBeenCalled();
    fireEvent.keyDown(icon, { key: 'Enter' });
    fireEvent.keyDown(icon, { key: ' ' });
    fireEvent.keyDown(icon, { key: 'a' });
    expect(onOpenAlert).toHaveBeenCalledTimes(3);
  });
});
```

Also add a page-level test in the same file that renders `pages/dashboard.jsx` only if it can be rendered in jsdom without network (it reads `AppContext`); if it cannot be done in under ~40 lines of setup, skip it and rely on Task 7's browser check. Report which you did.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __test__/components/settings/quick-edit-wiring.test.jsx`
Expected: FAIL (`useAlertSettingsProps` not exported).

- [ ] **Step 3: Implement**

`components/common/context/DashboardSettingsProvider.jsx` (whole file):

```jsx
import React, { createContext, useContext } from 'react';

/**
 * Lets a dashboard alert open its quick edit popover.
 *
 * The alert icons are rendered at ~200 call sites nested deep inside a few big JSX trees, so a
 * callback prop would have to be threaded through every one of them. The context keeps each call
 * site to a `target` prop (plus `items` / `worlds` where the alert needs them).
 */
const DashboardSettingsContext = createContext(() => { });

export const DashboardSettingsProvider = ({ onOpenAlert, children }) => {
  return <DashboardSettingsContext.Provider value={onOpenAlert}>
    {children}
  </DashboardSettingsContext.Provider>;
};

/**
 * Props that make an alert icon open its quick edit. `target` is a dot path naming the alert
 * (see utility/dashboard/settingsTarget); `extra` is `{ items, worlds }` for alerts about one picker
 * item or some Royal Guardian worlds.
 */
export const useAlertSettingsProps = (configType, target, extra) => {
  const openAlert = useContext(DashboardSettingsContext);
  if (!target) return {};
  // Timer rows navigate on click, so the icon keeps its click to itself.
  const fire = (event) => {
    event.stopPropagation();
    openAlert(event.currentTarget, configType, target, extra);
  };
  return {
    role: 'button',
    tabIndex: 0,
    'aria-haspopup': 'dialog',
    onClick: fire,
    onKeyDown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      fire(event);
    }
  };
};

export default DashboardSettingsProvider;
```

`components/dashboard/Account.jsx`, `Alert` component:

- Import `useAlertSettingsProps` instead of `useOpenDashboardSettings`.
- Add `items` and `worlds` to the destructured props.
- Replace `const openSettings = useOpenDashboardSettings();` with
  `const settingsProps = useAlertSettingsProps('account', target, items || worlds ? { items, worlds } : undefined);`
- On the outer `Stack`: remove the `onClick` prop, spread `{...settingsProps}`, add `aria-label={target ? (typeof title === 'string' ? title : 'Alert settings') : undefined}`, and add a focus ring to `sx`: `'&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', borderRadius: 1 }`. Keep the existing `cursor: 'pointer'` rule.

`components/dashboard/Characters.jsx`, `Alert` component: the same changes with `'characters'`; its `Stack` is the outer element.

`pages/dashboard.jsx`:

1. Imports: `Snackbar` from `@mui/material/Snackbar`; `buildModel` from `@utility/dashboard/settingsModel`; `runAction` from `@utility/dashboard/settingsActions`; `buildQuickEdit` from `@utility/dashboard/quickEdit`; `trackSettingsEvent` from `@utility/dashboard/settingsAnalytics`; `AlertQuickEdit` from `@components/dashboard/settings/AlertQuickEdit`.
2. State after `settingsTarget`:

```jsx
  // The alert whose popover is open: its target, the extras its call site passed, where it was
  // clicked, and the config at that moment (what Undo goes back to).
  const [quickEdit, setQuickEdit] = useState(null);
  const [quickUndo, setQuickUndo] = useState(null);
  const [quickEditCount, setQuickEditCount] = useState(0);
```

3. Replace `handleOpenSettings` and add the quick edit handlers:

```jsx
  const handleOpenSettings = (configType, path, source) => {
    trackSettingsEvent('alert_settings_opened', { source });
    setSettingsTarget(configType ? { configType, path } : null);
    setOpen(true);
  };

  const quickEditFor = (current, configType, target, extra) =>
    buildQuickEdit(current, buildModel(current, baseTrackers, diffTrackers(baseTrackers, current)), configType, target, extra);

  const handleOpenAlert = (element, configType, target, extra = {}) => {
    if (!quickEditFor(config, configType, target, extra)) {
      handleOpenSettings(configType, target, 'alert');
      return;
    }
    const rect = element.getBoundingClientRect();
    setQuickUndo(null);
    setQuickEditCount((count) => count + 1);
    setQuickEdit({
      id: quickEditCount + 1, configType, target, extra,
      anchorPosition: { top: rect.bottom + 4, left: rect.left },
      snapshot: config
    });
  };

  const quickModel = quickEdit ? quickEditFor(config, quickEdit.configType, quickEdit.target, quickEdit.extra) : null;

  const handleQuickAction = (name, ...args) => {
    handleConfigChange(runAction(baseTrackers, config, name, ...args));
    setQuickUndo({ id: quickEdit.id, label: `${quickModel.tracker.label} settings changed`, previous: quickEdit.snapshot });
    trackSettingsEvent('alert_quick_edit_changed', { kind: quickModel.kind });
  };
```

`handleConfigChange` is declared below `handleOpenSettings` in the file today; move it above `handleQuickAction` if the linter complains about use before definition (function expressions in the component body are only called later, so it works either way).

4. The settings button and the defaults note call `handleOpenSettings(null, null, 'button')` and, for Review, `setInitialFilter('edited'); handleOpenSettings(null, null, 'note');` instead of setting state inline.
5. `<DashboardSettingsProvider onOpenAlert={handleOpenAlert}>`.
6. After `<DashboardSettings .../>`:

```jsx
    <AlertQuickEdit quickEdit={quickModel} open={Boolean(quickModel)} anchorPosition={quickEdit?.anchorPosition}
                    onClose={() => setQuickEdit(null)} onAction={handleQuickAction}
                    onOpenAll={() => {
                      setQuickEdit(null);
                      handleOpenSettings(quickEdit.configType, quickEdit.target, 'alert');
                    }}/>
    {quickUndo ? <Snackbar key={quickUndo.id} open autoHideDuration={6000} message={quickUndo.label}
                           ContentProps={{ role: 'status' }}
                           onClose={(e, reason) => {
                             if (reason !== 'clickaway') setQuickUndo(null);
                           }}
                           action={<Button color="primary" size="small" onClick={() => {
                             handleConfigChange(quickUndo.previous);
                             setQuickUndo(null);
                             setQuickEdit(null);
                           }}>Undo</Button>}/> : null}
```

The undo snapshot is a full config; `handleConfigChange` already turns it into edits.

- [ ] **Step 4: Run tests**

Run: `npx vitest run __test__/components/settings __test__/components/RoyalGuardianAlertList.test.jsx __test__/components/CharactersBagAlert.test.jsx` → PASS. `npx eslint components/common/context/DashboardSettingsProvider.jsx pages/dashboard.jsx components/dashboard/Account.jsx components/dashboard/Characters.jsx`: no new errors. `grep -rn useOpenDashboardSettings components pages` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add components/common/context/DashboardSettingsProvider.jsx pages/dashboard.jsx components/dashboard/Account.jsx components/dashboard/Characters.jsx __test__/components/settings/quick-edit-wiring.test.jsx
git commit -m "Dashboard: clicking an alert opens its quick edit"
```

---

### Task 6: Picker item keys and Royal Guardian worlds at the alert call sites

**Files:**
- Modify: `components/dashboard/Account.jsx` (call sites only)
- Modify: `components/dashboard/Characters.jsx` (call sites only)
- Test: `__test__/utility/quick-edit.test.js` (append: every key shape used below resolves)

**Interfaces:**
- Consumes: `Alert` props `items: [{ key, label? }]` and `worlds: number[]` (Task 5); `matchPickerKey` rules (Task 3: exact, then loose).
- Produces: nothing new.

Add the props at these call sites (locate by the `target` string; line numbers drift). `label` can be left out where the item's display name is right (Task 3 falls back to `items[key].displayName`).

| File | target | Prop to add |
|---|---|---|
| Account | `General.etc.arcanistDailyDrops` | `items={[{ key: type, label: \`Arcanist ${type}\` }]}` |
| Account | `General.shops.items` | `items={shop.map(({ rawName }) => ({ key: rawName }))}` |
| Account | `World 2.postOffice.dailyShipments` | `items={[{ key: index + 1, label: \`shipment #${index + 1}\` }]}` |
| Account | `World 3.construction.materials` | `items={[{ key: rawName }]}` |
| Account | `World 3.construction.rankUp` | `items={[{ key: rawName, label: cleanUnderscore(saltName) }]}` |
| Account | `World 3.construction.saltDeficit` | `items={[{ key: rawName, label: cleanUnderscore(saltName) }]}` |
| Account | `World 3.construction.saltRankUpRoom` | `items={[{ key: rawName, label: cleanUnderscore(saltName) }]}` |
| Account | `World 3.printer.atoms` | `items={[{ key: rawName, label: cleanUnderscore(name) }]}` |
| Account | `World 7.minehead.currencyUpgrades` | `items={[{ key: \`MineUpg${upgrade?.index}\`, label: cleanUnderscore(upgrade?.name) }]}` |
| Account | `World 7.sushiStation.shakerUses` | `items={[{ key: iconMap[shaker.name], label: \`${shaker.name} Shaker\` }]}` |
| Account | `` `World 7.royalGuardian.${option}` `` (the `RG_RANK_ALERTS` map) | `worlds={alerts?.['World 7']?.royalGuardian?.[option]?.outposts?.map(({ world }) => world)}` |
| Characters | `talents.talents` | `items={[{ key: name, label: cleanUnderscore(pascalCase(name)) }]}` |
| Characters | `crystalCountdown` | `items={[{ key: icon, label: cleanUnderscore(pascalCase(name)) }]}` |

Not given items, on purpose (their popover shows the whole picker): `World 7.zenithMarket.clusterFarming` (On/Off is a mode, not an item), `equipment.emptyGearSlots` (one alert lists several slots by label), `classSpecific.betterRing` (its values are ring stats).

- [ ] **Step 1: Write the failing test**

Append to `__test__/utility/quick-edit.test.js`:

```js
describe('call site key shapes', () => {
  const cases = [
    ['account', 'General.etc.arcanistDailyDrops', 'weapon'],
    ['account', 'General.shops.items', 'CraftMat3'],
    ['account', 'World 2.postOffice.dailyShipments', 3],
    ['account', 'World 3.construction.materials', 'Refinery1'],
    ['account', 'World 3.construction.rankUp', 'Refinery1'],
    ['account', 'World 3.construction.saltDeficit', 'Refinery1'],
    ['account', 'World 3.construction.saltRankUpRoom', 'Refinery1'],
    ['account', 'World 3.printer.atoms', 'Copper'],
    ['account', 'World 7.minehead.currencyUpgrades', 'MineUpg5'],
    ['account', 'World 7.sushiStation.shakerUses', 'SushiUpg17'],
    ['characters', 'talents.talents', 'PRINTER_GO_BRRR'],
    ['characters', 'crystalCountdown', 'ClassIcons42'],
    ['timers', 'World 3.closestSalt', 'Refinery1'],
    ['timers', 'World 5.villagers', 'explore']
  ];
  it.each(cases)('%s %s resolves item %s', (configType, target, key) => {
    expect(quick(configType, target, { items: [{ key }] }).kind).toBe('pickerItems');
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run __test__/utility/quick-edit.test.js`
Expected: PASS for every row except any whose target or key shape does not resolve. A failing row is a real mismatch: fix it in `quickEdit.js` (Task 3 rules) or in the alias table in `utility/dashboard/alertMeta.js`, not by changing the key the call site will pass. If every row passes already, the test is the guard for the call sites; continue.

- [ ] **Step 3: Add the props at the call sites**

Edit the rows of the table above. Check each destructured name exists in that `.map` callback (`saltName` in `rankUp`, `name` in `printer.atoms`, `iconMap` in the shaker map); add it to the destructuring where it is missing. `cleanUnderscore` and `pascalCase` are already imported in both files.

- [ ] **Step 4: Run tests**

Run: `npx vitest run __test__/utility/quick-edit.test.js __test__/components/RoyalGuardianAlertList.test.jsx __test__/components/CharactersBagAlert.test.jsx` → PASS. `npx eslint components/dashboard/Account.jsx components/dashboard/Characters.jsx`.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/Account.jsx components/dashboard/Characters.jsx __test__/utility/quick-edit.test.js
git commit -m "Dashboard: picker alerts pass their item and Royal Guardian ranks their worlds"
```

---

### Task 7: Timer targets

**Files:**
- Modify: `components/dashboard/Etc.jsx`
- Test: `__test__/components/TimerQuickEdit.test.jsx`

**Interfaces:**
- Consumes: `useAlertSettingsProps` (Task 5).
- Produces: `TimerIcon({ src, target, items })` inside `Etc.jsx`; `TimerCard` and `MonumentCard` take `target` and `items` props and render their icon through `TimerIcon`.

Rule: every icon that `Etc.jsx` renders for a timer tracker becomes a `TimerIcon` whose `target` is the tracker path from the guard around it, without the config type. `trackers?.General?.daily?.checked && <TimerCard ...>` gets `target="General.daily"`; `trackers?.['World 5']?.villagers?.checked` gets `target="World 5.villagers"`. This covers every `TimerCard`, every `MonumentCard`, the "A long time" branches of the Clickers timers, the random event and sailing trade rows, and the miniboss rows. The Library timer renders the `Library` component and has no icon of its own: leave it.

Timers with a picker pass their item: closest salt `items={[{ key: closestSalt?.icon }]}`, each villager `items={[{ key: VILLAGER_KEYS[index], label: villager?.name }]}`.

The icon click opens the quick edit and does not navigate (the hook stops propagation); clicking the rest of the row still navigates as today.

- [ ] **Step 1: Write the failing test**

`__test__/components/TimerQuickEdit.test.jsx` (model it on `__test__/components/ClickersLongTimers.test.jsx`, which already renders `Etc` with a mocked router):

```jsx
// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import darkTheme from '../../styles/theme/darkTheme';
import { DashboardSettingsProvider } from '@components/common/context/DashboardSettingsProvider';

const push = vi.fn();
vi.mock('next/router', () => ({ useRouter: () => ({ push, query: {}, asPath: '/' }) }));

const Etc = (await import('@components/dashboard/Etc')).default;

const trackers = { General: { daily: { checked: true, options: [] }, weekly: { checked: true, options: [] } } };

describe('timer icons', () => {
  it('open the quick edit with the timer target and do not navigate', () => {
    const onOpenAlert = vi.fn();
    const { container } = render(<ThemeProvider theme={darkTheme}>
      <DashboardSettingsProvider onOpenAlert={onOpenAlert}>
        <Etc characters={[]} account={{ finishedWorlds: {} }} trackers={trackers} lastUpdated={Date.now()}/>
      </DashboardSettingsProvider>
    </ThemeProvider>);
    const icons = [...container.querySelectorAll('[role="button"][aria-haspopup="dialog"]')];
    expect(icons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(icons[0]);
    expect(onOpenAlert).toHaveBeenCalledWith(icons[0], 'timers', 'General.daily', undefined);
    expect(push).not.toHaveBeenCalled();
  });
});
```

If `Etc` needs more of `account` to render the General section without throwing, copy the minimal shape from `ClickersLongTimers.test.jsx`. If `extra` is `{ items: undefined }` rather than `undefined` for timers without items, assert `expect.anything()` for that argument is wrong; instead make `TimerIcon` pass `items ? { items } : undefined` so the assertion holds.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __test__/components/TimerQuickEdit.test.jsx`
Expected: FAIL (no `role="button"` icons).

- [ ] **Step 3: Implement**

In `Etc.jsx`, import `Box` from `@mui/material` (add it to the existing `@mui/material` import) and `useAlertSettingsProps` from `@components/common/context/DashboardSettingsProvider`. Add below `IconImg`:

```jsx
const TimerIcon = ({ src, target, items }) => {
  const settingsProps = useAlertSettingsProps('timers', target, items ? { items } : undefined);
  return <Box component="span" {...settingsProps} aria-label={target ? 'Timer settings' : undefined}
              sx={{
                display: 'inline-flex', borderRadius: 1, cursor: target ? 'pointer' : 'inherit',
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' }
              }}>
    <IconImg src={src} alt=""/>
  </Box>;
};
```

In `TimerCard` and `MonumentCard`: add `target` and `items` to the props and replace `<IconImg src={`${prefix}${icon}`} alt=""/>` with `<TimerIcon src={`${prefix}${icon}`} target={target} items={items}/>`. Then add `target` (and `items` where the table above says) at every call site, and replace the bare `IconImg` uses in the Clickers "A long time" branches, the random event and trade rows and the miniboss rows with `TimerIcon` and the matching target.

- [ ] **Step 4: Run tests**

Run: `npx vitest run __test__/components/TimerQuickEdit.test.jsx __test__/components/ClickersLongTimers.test.jsx __test__/components/Timer.test.jsx` → PASS. `npx eslint components/dashboard/Etc.jsx`. Count: `grep -c "target=" components/dashboard/Etc.jsx` should be at least the number of timer trackers that render an icon (35 of the 36; Library is the exception).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/Etc.jsx __test__/components/TimerQuickEdit.test.jsx
git commit -m "Dashboard: timer icons open their quick edit"
```

---

### Task 8 (controller): Verify on the static export

Not dispatched; the controller runs it after the final review.

- [ ] Build: `export NEXT_PUBLIC_BUILDS_URL="$(grep '^NEXT_PUBLIC_BUILDS_URL=' .env.production | cut -d= -f2-)"; npm run build` (timeout 600000). Afterwards `git checkout -- public/sitemap.xml data/graph-stats.json`.
- [ ] Serve `out/` on port 3002 and open `/dashboard?demo=true` with Playwright at 1280x900 and 375x812. For each kind (checkbox, threshold, picker item, character, single-alert tracker, Royal Guardian ranks if the demo has one, timer): click the icon, screenshot the popover, change the setting, check the alert updates and the Undo snackbar restores it. Open "All <tracker> settings" and check it lands on the alert. Keyboard: Tab to an alert icon, Enter opens the popover, Escape closes it.
- [ ] `npx playwright test e2e/hydration.spec.js` stays green.
