# Dashboard alert settings R1 (storage) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save only the dashboard alert settings a user changed, convert existing saved configs once, and add three missing alert options, with no visible change to the settings dialog.

**Architecture:** A new pure module `utility/dashboard/trackerStore.js` turns `{ schema: 2, edits }` plus `baseTrackers` into the exact full config the alert code reads today (`resolveTrackers`), and back (`diffTrackers`). Legacy configs run through the existing migration chain once and are diffed into edits. The dashboard page loads through `loadTrackers` and writes through `toStoredTrackers`; the alert builders do not change shape.

**Tech Stack:** Next.js 16 pages router (static export), React 19 with React Compiler, MUI, Vitest (node project, `isolate: false`).

**Spec:** `docs/superpowers/specs/2026-10-06-dashboard-alert-settings-design.md` (sections 1, 2 "aliases" only, 5, Rollout R1, Testing)

## Global Constraints

- Branch: `feat/dashboard-alert-settings`. Do not commit; the user decides when to commit. Stop after each task's verification and report.
- Saved shape: `{ schema: 2, edits: { '<configType>.<section>.<tracker>[.<option>]': { checked?, value?, perWorld? } } }`; `characters` paths have no section.
- `baseTrackers.version` stays 81. No new entries in `utility/migrations.js`.
- Legacy backup key: `trackers-legacy-backup`. Written once, never overwritten.
- GA event on conversion failure: `dashboard_config_conversion_failed`.
- No `localStorage` reads or writes during render; use `writeStored` / `removeStored` from `components/common/context/AppProvider.jsx` inside effects or handlers.
- No `useMemo` / `useCallback` (React Compiler), no IIFEs.
- Comments: few, why not what. No em dashes in UI copy, comments or patch notes.
- Tests that touch `baseTrackers` must `import '../../polyfills'` first (it defines `Array.prototype.toSimpleObject`).
- Run tests with `npx vitest run <file>` from `IdleonToolbox/`.

## File Structure

| File | Responsibility |
|---|---|
| Create `utility/dashboard/baseTrackers.js` | The default config, moved out of the page so tests can import it |
| Modify `pages/dashboard.jsx` | Imports `baseTrackers`; loads, converts, saves, imports through `trackerStore` |
| Create `utility/dashboard/trackerStore.js` | `resolveTrackers`, `diffTrackers`, `convertLegacyTrackers`, `loadTrackers`, `toStoredTrackers`, constants |
| Create `utility/dashboard/applySettingChange.js` | The dialog's config mutation, extracted so it can be tested; no tracker-to-option cascade |
| Modify `components/common/DashboardSettings.jsx` | Uses `applySettingChange`; accepts schema 2 imports; exports the stored shape |
| Create `utility/dashboard/alertMeta.js` | `alertAliases`: alert data key to option name |
| Modify `utility/dashboard/settingsTarget.js` | Resolves option names through `alertAliases` |
| Modify `utility/dashboard/account.js` | Gaming drops gated by its own `drops` option |
| Modify `utility/dashboard/characters.js` | `passiveCards` and `noActivity` gated by their own options |
| Modify `pages/settings.jsx` | Clearing "Dashboard config" also clears the legacy backup |
| Modify `CLAUDE.md` | Dashboard alert rules after R1 |
| Tests in `__test__/utility/` and `__test__/settingsTarget.test.js` | See each task |

---

### Task 1: Move `baseTrackers` into its own module

**Files:**
- Create: `utility/dashboard/baseTrackers.js`
- Modify: `pages/dashboard.jsx:1-989`
- Test: `__test__/utility/base-trackers.test.js`

**Interfaces:**
- Produces: `export const baseTrackers` (same object, `version: 81`), default export not used.

- [ ] **Step 1: Write the failing test**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';

describe('baseTrackers', () => {
  it('is importable outside the page and keeps its shape', () => {
    expect(baseTrackers.version).toBe(81);
    expect(Object.keys(baseTrackers.account)).toEqual(
      ['General', 'World 1', 'World 2', 'World 3', 'World 4', 'World 5', 'World 6', 'World 7']);
    expect(baseTrackers.account['World 5'].hole.options.some(({ name }) => name === 'theBell')).toBe(true);
    expect(Object.keys(baseTrackers.characters)).toContain('anvil');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run __test__/utility/base-trackers.test.js`
Expected: FAIL, "Failed to resolve import @utility/dashboard/baseTrackers"

- [ ] **Step 3: Move the object**

Create `utility/dashboard/baseTrackers.js` with the imports the object needs and the object itself, cut verbatim from `pages/dashboard.jsx` lines 21-989:

```js
import { getRawShopItems } from '@parsers/shops';
import { getRawRefinerySalts } from '@parsers/misc';
import { getPrinterExclusions } from '@parsers/world-3/printer';
import { getCrystalCountdownSkills } from '@parsers/talents';
import { MINE_CURRENCY_UPGRADE_INDICES } from '@parsers/world-7/minehead';

export const baseTrackers = {
  version: 81,
  // ...the rest of the object exactly as it is in pages/dashboard.jsx today
};
```

In `pages/dashboard.jsx`: delete the `const baseTrackers = {...}` block, delete the five parser imports it used (`getRawShopItems`, `getRawRefinerySalts`, `getPrinterExclusions`, `getCrystalCountdownSkills`, `MINE_CURRENCY_UPGRADE_INDICES`), and add:

```js
import { baseTrackers } from '@utility/dashboard/baseTrackers';
```

- [ ] **Step 4: Run the test and the dashboard suites**

Run: `npx vitest run __test__/utility/base-trackers.test.js __test__/utility __test__/settingsTarget.test.js`
Expected: PASS

- [ ] **Step 5: Lint the page**

Run: `npx eslint pages/dashboard.jsx utility/dashboard/baseTrackers.js`
Expected: no errors (no unused imports left behind).

---

### Task 2: `resolveTrackers` and `diffTrackers`

**Files:**
- Create: `utility/dashboard/trackerStore.js`
- Test: `__test__/utility/tracker-store.test.js`

**Interfaces:**
- Consumes: `baseTrackers` (Task 1).
- Produces:
  - `TRACKERS_SCHEMA = 2`
  - `RENAMED_PATHS` (object, empty for now)
  - `resolveTrackers(base, edits = {}) => { account, characters, timers, version }`
  - `diffTrackers(base, config) => edits`
  - `toStoredTrackers(base, config) => { schema: 2, edits }`
  - internal helpers `forEachTracker`, `getTracker` (exported for Task 3)

- [ ] **Step 1: Write the failing tests**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { diffTrackers, resolveTrackers, toStoredTrackers } from '@utility/dashboard/trackerStore';

const optionOf = (config, section, tracker, name) =>
  config.account[section][tracker].options.find((option) => option.name === name);

describe('resolveTrackers', () => {
  it('returns the defaults when there are no edits, without sharing objects with base', () => {
    const resolved = resolveTrackers(baseTrackers, {});
    expect(resolved.account).toEqual(baseTrackers.account);
    expect(resolved.characters).toEqual(baseTrackers.characters);
    expect(resolved.timers).toEqual(baseTrackers.timers);
    expect(resolved.version).toBe(81);
    resolved.account['World 1'].stamps.checked = false;
    expect(baseTrackers.account['World 1'].stamps.checked).toBe(true);
  });

  it('applies tracker, option, value, picker and perWorld edits', () => {
    const salts = Object.keys(optionOf(baseTrackers, 'World 3', 'construction', 'materials').props.value);
    const resolved = resolveTrackers(baseTrackers, {
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.gildedStamps': { checked: false },
      'account.World 1.stamps.affordableStampLevels': { value: '30' },
      [`account.World 3.construction.materials`]: { value: { [salts[0]]: false } },
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } },
      'characters.anvil.unspentPoints': { value: 3 }
    });
    expect(resolved.account['World 1'].stamps.checked).toBe(false);
    expect(optionOf(resolved, 'World 1', 'stamps', 'gildedStamps').checked).toBe(false);
    expect(optionOf(resolved, 'World 1', 'stamps', 'affordableStampLevels').props.value).toBe('30');
    const materials = optionOf(resolved, 'World 3', 'construction', 'materials').props.value;
    expect(materials[salts[0]]).toBe(false);
    expect(materials[salts[1]]).toBe(true);
    const trade = optionOf(resolved, 'World 7', 'royalGuardian', 'tradeRank');
    expect(trade.checked).toBe(true);
    expect(trade.props.perWorld).toEqual({ 3: '15' });
    expect(resolved.characters.anvil.options.find(({ name }) => name === 'unspentPoints').props.value).toBe(3);
  });

  it('ignores edits for paths and picker items that no longer exist', () => {
    const resolved = resolveTrackers(baseTrackers, {
      'account.World 1.goneTracker': { checked: false },
      'account.World 1.stamps.goneOption': { checked: false },
      'account.World 3.construction.materials': { value: { NotASalt: false } }
    });
    expect(resolved.account['World 1'].goneTracker).toBeUndefined();
    expect(optionOf(resolved, 'World 3', 'construction', 'materials').props.value.NotASalt).toBeUndefined();
  });
});

describe('diffTrackers', () => {
  it('is empty for the defaults', () => {
    expect(diffTrackers(baseTrackers, resolveTrackers(baseTrackers, {}))).toEqual({});
  });

  it('round-trips every kind of edit', () => {
    const salts = Object.keys(optionOf(baseTrackers, 'World 3', 'construction', 'materials').props.value);
    const edits = {
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.affordableStampLevels': { value: '30' },
      'account.World 3.construction.materials': { value: { [salts[0]]: false } },
      'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: '15' } },
      'characters.anvil.unspentPoints': { value: 3 },
      'timers.General.daily': { checked: false }
    };
    expect(diffTrackers(baseTrackers, resolveTrackers(baseTrackers, edits))).toEqual(edits);
  });

  it('treats a number typed as text as unchanged when it equals the default', () => {
    const resolved = resolveTrackers(baseTrackers, {});
    optionOf(resolved, 'World 1', 'stamps', 'affordableStampLevels').props.value = '25';
    expect(diffTrackers(baseTrackers, resolved)).toEqual({});
  });

  it('finds options by name, not position', () => {
    const resolved = resolveTrackers(baseTrackers, {});
    resolved.account['World 1'].stamps.options.reverse();
    optionOf(resolved, 'World 1', 'stamps', 'gildedStamps').checked = false;
    expect(diffTrackers(baseTrackers, resolved)).toEqual({ 'account.World 1.stamps.gildedStamps': { checked: false } });
  });

  it('wraps the diff in the stored shape', () => {
    expect(toStoredTrackers(baseTrackers, resolveTrackers(baseTrackers, {}))).toEqual({ schema: 2, edits: {} });
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/utility/tracker-store.test.js`
Expected: FAIL, "Failed to resolve import @utility/dashboard/trackerStore"

- [ ] **Step 3: Implement**

```js
export const TRACKERS_SCHEMA = 2;

// Old path -> new path, for when an option or tracker is renamed after R1.
export const RENAMED_PATHS = {};

const CONFIG_TYPES = ['account', 'characters', 'timers'];

// Characters is a flat map of trackers; account and timers group them under sections.
const isSectioned = (root) => {
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
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run __test__/utility/tracker-store.test.js`
Expected: PASS (8 tests)

---

### Task 3: Own options for gaming drops, passive cards and alchemy activity

**Files:**
- Modify: `utility/dashboard/baseTrackers.js` (gaming in `World 5`, `characters.cards`, `characters.alchemy`)
- Modify: `utility/dashboard/account.js:1081-1088`
- Modify: `utility/dashboard/characters.js:110-124`, `:344-386`
- Test: `__test__/utility/own-option-alerts.test.js`

**Interfaces:**
- Produces: option names `drops` (`account.World 5.gaming`), `passiveCards` (`characters.cards`), `noActivity` (`characters.alchemy`). Names equal the alert data keys, so `settingsTarget` resolves them exactly.

- [ ] **Step 1: Write the failing tests**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getWorld5Alerts } from '@utility/dashboard/account';
import { alchemyAlerts, cardsAlert } from '@utility/dashboard/characters';
import { baseTrackers } from '@utility/dashboard/baseTrackers';

const gamingAccount = {
  finishedWorlds: { World4: true },
  gaming: { unlocked: true, availableSprouts: 0, availableDrops: 10, sproutsCapacity: 5, imports: [] }
};
const gamingDrops = (options) => getWorld5Alerts(gamingAccount, { gaming: { checked: true } }, { gaming: options }, [])?.gaming?.drops;

const passiveCharacter = { cards: { equippedCards: [{ effect: '+5% Damage (Passive)' }] } };
const idleAccount = { alchemy: { activities: { 0: { activity: -1 } } } };

describe('alerts that get their own option', () => {
  it('declares the three options on by default', () => {
    expect(baseTrackers.account['World 5'].gaming.options.find(({ name }) => name === 'drops')?.checked).toBe(true);
    expect(baseTrackers.characters.cards.options.find(({ name }) => name === 'passiveCards')?.checked).toBe(true);
    expect(baseTrackers.characters.alchemy.options.find(({ name }) => name === 'noActivity')?.checked).toBe(true);
  });

  it('gaming drops follow the drops option, not sprouts', () => {
    expect(gamingDrops({ sprouts: { checked: false }, drops: { checked: true } })).toBe(10);
    expect(gamingDrops({ sprouts: { checked: true }, drops: { checked: false } })).toBeUndefined();
  });

  it('passive cards follow their own option, not card set', () => {
    expect(cardsAlert({}, [], passiveCharacter, null, { cards: { cardSet: { checked: false }, passiveCards: { checked: true } } })?.passiveCards).toBe(true);
    expect(cardsAlert({}, [], passiveCharacter, null, { cards: { cardSet: { checked: false }, passiveCards: { checked: false } } })?.passiveCards).toBeUndefined();
  });

  it('no alchemy activity can be turned off', () => {
    expect(alchemyAlerts(idleAccount, [], { playerId: 0 }, null, { alchemy: { noActivity: { checked: true } } })?.noActivity).toBe(true);
    expect(alchemyAlerts(idleAccount, [], { playerId: 0 }, null, { alchemy: { noActivity: { checked: false } } })?.noActivity).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/utility/own-option-alerts.test.js`
Expected: FAIL on all four.

- [ ] **Step 3: Add the options to `baseTrackers`**

In `World 5.gaming.options`, directly after `{ name: 'sprouts', checked: true },`:

```js
          { name: 'drops', checked: true },
```

Replace `cards` and `alchemy` in `characters`:

```js
    cards: { checked: true, options: [{ name: 'cardSet', checked: true }, { name: 'passiveCards', checked: true }] },
```

```js
    alchemy: { checked: true, options: [{ name: 'missingBubbles', checked: true }, { name: 'noActivity', checked: true }] },
```

- [ ] **Step 4: Gate the alerts**

`utility/dashboard/account.js`, gaming block:

```js
    const { shovel, sprouts, squirrel, drops } = options?.gaming || {};
    if (sprouts?.checked && account?.gaming?.availableSprouts >= account?.gaming?.sproutsCapacity) {
      gaming.sprouts = account?.gaming?.availableSprouts;
    }
    if (drops?.checked && account?.gaming?.availableDrops >= account?.gaming?.sproutsCapacity) {
      gaming.drops = account?.gaming?.availableDrops;
    }
```

`utility/dashboard/characters.js`, `alchemyAlerts`:

```js
  if (options?.alchemy?.noActivity?.checked && account?.alchemy?.activities?.[character?.playerId]?.activity === -1) {
    alerts.noActivity = true;
  }
```

`utility/dashboard/characters.js`, `cardsAlert`: cut the three `hasPassiveCardsEquipped` lines out of the `if (options?.cards?.cardSet?.checked) { ... }` block and put them after it, gated:

```js
  if (options?.cards?.passiveCards?.checked) {
    const hasPassiveCardsEquipped = character?.cards?.equippedCards?.filter(({ effect }) => effect?.includes('(Passive)') || effect?.includes('(P)'));
    if (hasPassiveCardsEquipped?.length > 0) {
      alerts.passiveCards = true;
    }
  }
  return alerts;
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run __test__/utility/own-option-alerts.test.js __test__/utility __test__/components/CharactersBagAlert.test.jsx`
Expected: PASS

---

### Task 4: Legacy conversion and `loadTrackers`

**Files:**
- Modify: `utility/dashboard/trackerStore.js`
- Test: `__test__/utility/tracker-store-legacy.test.js`

**Interfaces:**
- Consumes: `migrateConfig(base, userConfig)` from `@utility/migrations`; Task 2 helpers; Task 3 option names.
- Produces:
  - `LEGACY_BACKUP_KEY = 'trackers-legacy-backup'`
  - `SEEDED_OPTIONS` (array)
  - `convertLegacyTrackers(base, legacy) => edits`
  - `loadTrackers(base, stored) => { config, stored, status, legacy?, error? }`, `status` one of `'empty' | 'current' | 'converted' | 'failed'`; `stored` is `null` when `status === 'failed'`.

- [ ] **Step 1: Write the failing tests**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { migrateConfig } from '@utility/migrations';
import { convertLegacyTrackers, forEachTracker, getTracker, loadTrackers } from '@utility/dashboard/trackerStore';

const legacyFrom = (mutate = () => {}) => {
  const legacy = structuredClone(baseTrackers);
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
const expected = (legacy) => migrateConfig(baseTrackers, structuredClone(legacy));

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

  it('drops the option unticks the old tracker switch cascaded', () => {
    const legacy = legacyFrom((config) => {
      const library = config.account['World 3'].library;
      library.checked = false;
      library.options.forEach((libraryOption) => { libraryOption.checked = false; });
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({ 'account.World 3.library': { checked: false } });
  });

  it('keeps option edits under an off tracker when they were not a cascade', () => {
    const legacy = legacyFrom((config) => {
      config.account['World 1'].stamps.checked = false;
      option(config, 'World 1', 'stamps', 'gildedStamps').checked = false;
    });
    expect(convertLegacyTrackers(baseTrackers, legacy)).toEqual({
      'account.World 1.stamps': { checked: false },
      'account.World 1.stamps.gildedStamps': { checked: false }
    });
  });

  it('runs older configs through the migration chain first', () => {
    const legacy = legacyFrom((config) => {
      config.version = 78;
      config.account['World 5'].sailing.options = config.account['World 5'].sailing.options
        .filter(({ name }) => name !== 'alwaysAlertEnderCaptains');
      option(config, 'World 5', 'hole', 'theBell').name = 'theWell';
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
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/utility/tracker-store-legacy.test.js`
Expected: FAIL, "convertLegacyTrackers is not exported"

- [ ] **Step 3: Implement** (append to `trackerStore.js`, add the import at the top)

```js
import { migrateConfig } from '@utility/migrations';

export const LEGACY_BACKUP_KEY = 'trackers-legacy-backup';

// Options added in R1 that used to ride on another option: a user who had that one off keeps the
// new alert hidden too.
export const SEEDED_OPTIONS = [
  { type: 'account', section: 'World 5', tracker: 'gaming', option: 'drops', from: 'sprouts' },
  { type: 'characters', section: null, tracker: 'cards', option: 'passiveCards', from: 'cardSet' }
];

const pickerAllOff = (option) => option.type !== 'array'
  || Object.values(option.props?.value || {}).every((value) => !value);

// Before R1 turning a tracker off also unticked every option and picker item under it. Those were
// not the user's choices, so a tracker that is off with everything under it off keeps only the
// switch, and turning it back on restores the defaults as it did before.
const dropCascade = (base, migrated, edits) => {
  forEachTracker(base, (path, baseTracker, type, section, name) => {
    const tracker = getTracker(migrated, type, section, name);
    if (!tracker || tracker.checked !== false || !tracker.options?.length) return;
    const allOff = tracker.options.every((option) => !option?.checked && pickerAllOff(option));
    if (!allOff) return;
    baseTracker.options.forEach((option) => {
      const key = `${path}.${option.name}`;
      if (!edits[key]) return;
      delete edits[key].checked;
      if (option.type === 'array') delete edits[key].value;
      if (!Object.keys(edits[key]).length) delete edits[key];
    });
  });
};

const seedNewOptions = (migrated, edits) => {
  SEEDED_OPTIONS.forEach(({ type, section, tracker, option, from }) => {
    const parent = getTracker(migrated, type, section, tracker)?.options?.find(({ name }) => name === from);
    if (parent && !parent.checked) {
      edits[[type, section, tracker, option].filter(Boolean).join('.')] = { checked: false };
    }
  });
};

export const convertLegacyTrackers = (base, legacy) => {
  const migrated = migrateConfig(base, structuredClone(legacy));
  const edits = diffTrackers(base, migrated);
  dropCascade(base, migrated, edits);
  seedNewOptions(migrated, edits);
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
    const migrated = migrateConfig(base, stored);
    return {
      config: { account: migrated.account, characters: migrated.characters, timers: migrated.timers, version: base.version },
      stored: null,
      status: 'failed',
      error
    };
  }
};
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run __test__/utility/tracker-store-legacy.test.js __test__/utility/tracker-store.test.js`
Expected: PASS

---

### Task 5: Alert aliases for exact settings links

**Files:**
- Create: `utility/dashboard/alertMeta.js`
- Modify: `utility/dashboard/settingsTarget.js:36-44`
- Test: `__test__/settingsTarget.test.js` (add cases)

**Interfaces:**
- Produces: `export const alertAliases = { '<configType>.<section>.<tracker>': { <alertKey>: <optionName> } }`. R2 extends this file with labels; R1 only needs aliases.

- [ ] **Step 1: Add the failing tests** to `__test__/settingsTarget.test.js`

```js
import '../polyfills';
import { baseTrackers } from '@utility/dashboard/baseTrackers';

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
```

The file's first import line stays `import { describe, expect, it } from 'vitest';`; add the two imports above below it.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run __test__/settingsTarget.test.js`
Expected: the 13 new cases FAIL with `optionName: null`; the existing cases PASS.

- [ ] **Step 3: Create `utility/dashboard/alertMeta.js`**

```js
// Alert data keys that differ from the option controlling them. resolveSettingsTarget reads the
// key off the alert, so without this the settings link lands on the tracker, not the option.
export const alertAliases = {
  'account.World 3.construction': { saltDeficit: 'saltBalance', saltRankUpRoom: 'saltBalance' },
  'account.World 3.printer': { atoms: 'includeResource' },
  'account.World 3.traps': { overdue: 'trapsOverdue' },
  'account.World 3.hatRack': { missingHats: 'hatsMissing' },
  'account.World 5.hole': {
    motherlodeMaxed: 'motherlode',
    hiveMaxed: 'theHive',
    evertreeMaxed: 'evertree',
    bottomlessTrenchMaxed: 'bottomlessTrench'
  },
  'account.World 6.etc': { emperorAttempts: 'emperor' },
  'account.World 7.gallery': { missingTrophies: 'trophiesMissing', missingNametags: 'nametagsMissing' },
  'account.World 7.legendTalents': { legendPointsLeftToSpend: 'pointsLeftToSpend' }
};
```

- [ ] **Step 4: Use it in `settingsTarget.js`**

Add `import { alertAliases } from './alertMeta';` at the top, and replace the `optionNames` / `optionName` lines with:

```js
  const optionNames = tracker?.options?.map((option) => option?.name) ?? [];
  const aliases = alertAliases[[configType, section, trackerName].filter(Boolean).join('.')] ?? {};
  const optionName = [rest[1], rest[0]]
    .map((name) => aliases[name] ?? name)
    .find((name) => name && optionNames.includes(name)) ?? null;
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run __test__/settingsTarget.test.js`
Expected: PASS (existing + 13)

---

### Task 6: Wire the page and the dialog to the new storage

**Files:**
- Create: `utility/dashboard/applySettingChange.js`
- Modify: `components/common/DashboardSettings.jsx:108-152`, `:159-170`
- Modify: `pages/dashboard.jsx` (the `Dashboard` component)
- Test: `__test__/utility/apply-setting-change.test.js`

**Interfaces:**
- Consumes: `loadTrackers`, `toStoredTrackers`, `LEGACY_BACKUP_KEY` (Tasks 2, 4); `writeStored` from `@components/common/context/AppProvider`.
- Produces: `applySettingChange(config, e, configType, option, trackerName, section) => newConfig` (same arguments the dialog's `handleSettingChange` takes today); new `DashboardSettings` prop `exportConfig`.

- [ ] **Step 1: Write the failing test**

```js
import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { resolveTrackers } from '@utility/dashboard/trackerStore';
import { applySettingChange } from '@utility/dashboard/applySettingChange';

const stamps = (config) => config.account['World 1'].stamps;

describe('applySettingChange', () => {
  it('turning a tracker off keeps its options as they are', () => {
    const config = resolveTrackers(baseTrackers, {});
    const before = structuredClone(stamps(config).options);
    const next = applySettingChange(config, { target: { name: 'stamps' } }, 'account', null, null, 'World 1');
    expect(stamps(next).checked).toBe(false);
    expect(stamps(next).options).toEqual(before);
    expect(stamps(config).checked).toBe(true);
  });

  it('toggles one option by index', () => {
    const config = resolveTrackers(baseTrackers, {});
    const index = stamps(config).options.findIndex(({ name }) => name === 'gildedStamps');
    const next = applySettingChange(config, { target: { name: 'gildedStamps' } }, 'account',
      { name: 'gildedStamps', optionIndex: index }, 'stamps', 'World 1');
    expect(stamps(next).options[index].checked).toBe(false);
  });

  it('sets an input value', () => {
    const config = resolveTrackers(baseTrackers, {});
    const index = stamps(config).options.findIndex(({ name }) => name === 'affordableStampLevels');
    const next = applySettingChange(config, { target: { value: '40' } }, 'account',
      { name: 'affordableStampLevels', type: 'input', inputVal: true, optionIndex: index }, 'stamps', 'World 1');
    expect(stamps(next).options[index].props.value).toBe('40');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run __test__/utility/apply-setting-change.test.js`
Expected: FAIL, "Failed to resolve import @utility/dashboard/applySettingChange"

- [ ] **Step 3: Extract the mutation** into `utility/dashboard/applySettingChange.js`

Body is today's `handleSettingChange` from `DashboardSettings.jsx:108-141` with two changes: it returns the config instead of calling `onChange`, and the last branch no longer cascades.

```js
export const applySettingChange = (config, e, configType, option, trackerName, section) => {
  const tempConfig = structuredClone(config);
  const nameClicked = e?.target?.name;
  const sectionRef = section ? tempConfig[configType][section] : tempConfig[configType];

  if (option?.type === 'array') {
    const optionRef = sectionRef[trackerName || option?.name].options[option?.optionIndex];
    optionRef.props.value[nameClicked] = !optionRef.props.value[nameClicked];
  } else if (option?.type === 'input' && option?.worldKey) {
    const optionProps = sectionRef[trackerName].options[option?.optionIndex].props;
    // An empty field drops the override, so that world follows the main value again.
    if (option.worldKey === 'reset') optionProps.perWorld = {};
    else if (e?.target?.value === '') delete optionProps.perWorld[option.worldKey];
    else optionProps.perWorld[option.worldKey] = e?.target?.value;
  } else if (option?.type === 'input' && option?.inputVal) {
    sectionRef[trackerName].options[option?.optionIndex].props.value = e?.target?.value;
  } else if (option) {
    const optionRef = sectionRef[trackerName].options[option?.optionIndex];
    optionRef.checked = !optionRef.checked;
  } else {
    // The switch only gates the tracker: its options keep the user's choices.
    const tracker = sectionRef[nameClicked];
    tracker.checked = !tracker.checked;
  }
  return tempConfig;
};
```

In `DashboardSettings.jsx`:

```js
import { applySettingChange } from '@utility/dashboard/applySettingChange';
```

```js
  const handleSettingChange = (e, configType, option, trackerName, section) => {
    onChange(applySettingChange(config, e, configType, option, trackerName, section));
  }
```

Accept `exportConfig` in the props list and export it:

```js
    handleDownload(exportConfig ?? config, 'it-dashboard-config');
```

Accept schema 2 imports in the `FileUploadButton` handler:

```js
            if (data?.schema === 2 || (data?.account && data?.characters)) {
```

- [ ] **Step 4: Wire the page** (`pages/dashboard.jsx`, inside `Dashboard`)

Imports:

```js
import { useEffect } from 'react';
import { loadTrackers, LEGACY_BACKUP_KEY, toStoredTrackers } from '@utility/dashboard/trackerStore';
import { writeStored } from '@components/common/context/AppProvider';
```

(`useEffect` joins the existing `React, { useContext, useState }` import; drop the now unused `migrateConfig` import.)

Replace the `config` state and the three handlers:

```js
  const [initialLoad] = useState(() => loadTrackers(baseTrackers, state?.trackers));
  const [config, setConfig] = useState(initialLoad.config);
  // Set when the stored config could not be converted: keep saving it the pre-R1 way.
  const [legacyMode, setLegacyMode] = useState(initialLoad.status === 'failed');

  useEffect(() => {
    if (initialLoad.status === 'converted') {
      if (!readLocalStorageValue({ key: LEGACY_BACKUP_KEY })) writeStored(LEGACY_BACKUP_KEY, initialLoad.legacy);
      dispatch({ type: 'trackers', data: initialLoad.stored });
    } else if (initialLoad.status === 'failed' && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'dashboard_config_conversion_failed', {
        event_category: 'dashboard',
        event_label: String(initialLoad.error?.message ?? '').slice(0, 100)
      });
    }
    // Runs once: initialLoad never changes after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfigChange = (updatedConfig) => {
    setConfig(updatedConfig);
    dispatch({ type: 'trackers', data: legacyMode ? updatedConfig : toStoredTrackers(baseTrackers, updatedConfig) });
  }

  const handleFileUpload = (data) => {
    const result = loadTrackers(baseTrackers, data);
    setConfig(result.config);
    setLegacyMode(result.status === 'failed');
    dispatch({ type: 'trackers', data: result.stored ?? result.config });
  }
```

Add `readLocalStorageValue` to the existing `@mantine/hooks` import. Pass the stored shape to the dialog:

```jsx
    <DashboardSettings onFileUpload={handleFileUpload} onChange={handleConfigChange} open={open}
                       onClose={handleCloseSettings} config={config} target={settingsTarget}
                       exportConfig={legacyMode ? config : toStoredTrackers(baseTrackers, config)}
                       hideAlertless={hideAlertless} onHideAlertlessChange={handleHideAlertless}/>
```

- [ ] **Step 5: Run the tests and lint**

Run: `npx vitest run __test__/utility/apply-setting-change.test.js __test__/utility __test__/settingsTarget.test.js __test__/components`
Expected: PASS

Run: `npx eslint pages/dashboard.jsx components/common/DashboardSettings.jsx utility/dashboard`
Expected: no errors.

---

### Task 7: Clear the backup with the config, and update the alert rules in CLAUDE.md

**Files:**
- Modify: `pages/settings.jsx:236-238`
- Modify: `CLAUDE.md` ("Dashboard alerts" section)

- [ ] **Step 1: Clear the backup together with the config**

```js
      } else {
        localStorage.removeItem(storageKey);
        if (storageKey === 'trackers') localStorage.removeItem('trackers-legacy-backup');
      }
```

- [ ] **Step 2: Replace the "Dashboard alerts" section of `CLAUDE.md`**

```markdown
## Dashboard alerts

- When asked to create a new alert, scan these files for context:
  - @IdleonToolbox/utility/dashboard/baseTrackers.js
  - @IdleonToolbox/utility/dashboard/trackerStore.js
  - @IdleonToolbox/components/dashboard/Account.jsx
  - @IdleonToolbox/components/dashboard/Characters.jsx
  - @IdleonToolbox/utility/dashboard/account.js
  - @IdleonToolbox/utility/dashboard/characters.js
- Saved configs hold only the user's edits (`{ schema: 2, edits }`); defaults come from `baseTrackers`.
  Adding an option or changing a default needs no migration and no version bump.
- Renaming or moving a tracker or option: add `oldPath: newPath` to `RENAMED_PATHS` in `trackerStore.js`.
- `utility/migrations.js` is frozen at version 81 and only converts pre-R1 configs and old exported files.
- When an alert's data key differs from the option that controls it, add it to `alertAliases` in
  `utility/dashboard/alertMeta.js` so the settings link lands on the option.
```

- [ ] **Step 3: Run the full suite** (the pre-commit hook runs the same)

Run: `npm test`
Expected: all test files pass.

---

### Task 8: Verify in the browser and propose the patch note

- [ ] **Step 1: Convert a real legacy config**

With the dev server on `http://localhost:3001` (Browser pane, `?demo=true`), in the page console:

```js
const t = JSON.parse(localStorage.getItem('trackers') || 'null');
({ schema: t?.schema, version: t?.version })
```

If it shows `schema: 2` already, restore a legacy config first: `localStorage.setItem('trackers', localStorage.getItem('trackers-legacy-backup'))`, or set a copy of `baseTrackers` with `version: 81` and one option unticked. Reload `/dashboard?demo=true`.

Expected after reload: `trackers` is `{ schema: 2, edits: {...} }` containing the unticked option, `trackers-legacy-backup` holds the old object, no console errors, the dashboard shows the same alert rows as before.

- [ ] **Step 2: Edit, export, import**

Open "Configure alerts", untick one option, close, reload: the option stays unticked and `trackers.edits` has its path. Untick a tracker, reopen it: its options are unchanged. Export, then import the exported file and a pre-R1 exported file: both load, no console errors.

- [ ] **Step 3: Static export checks**

Run: `npm run test:e2e -- e2e/hydration.spec.js`
Expected: PASS (no React #418/#423/#425).

- [ ] **Step 4: Propose the patch note** (ask before adding it)

Proposed text for `data/patch-notes.js` (no apostrophes): "Dashboard: new options to turn off Gaming drops, passive card and no alchemy activity alerts on their own, and the settings link now opens the exact option for more alerts".

- [ ] **Step 5: Report** what passed, the diff summary, and wait for the user to commit and push the branch (the Vercel preview builds from it).

---

## Not in R1 (moved to R2)

- The one-time "N settings differ from today's defaults" note: there are no "Edited" tags in R1 to explain, so it ships with them in R2.
- Labels, help text, groups and the rest of `alertMeta.js`.
