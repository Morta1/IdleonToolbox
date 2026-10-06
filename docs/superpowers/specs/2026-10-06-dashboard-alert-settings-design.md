# Dashboard alert settings redesign

**Date:** 2026-10-06
**Status:** Draft for review
**Branch:** `feat/dashboard-alert-settings` (Vercel preview, see the last section)
**Mockups:** https://claude.ai/artifact/CfkcAvNyvhdQXWNWN7ZqKq (11 artboards: Account, Search,
Royal Guardian long text, Characters, Timers, states, quick edit, quick edit cases, 3 mobile)

## Problem

"Configure alerts" (`components/common/DashboardSettings.jsx`) renders `baseTrackers`
(`pages/dashboard.jsx`, v81) as one dialog of nested collapses: tab, section, tracker, options,
and a fourth level for per-world fields. The config holds 98 trackers and 186 options:

| Tab | Sections | Trackers | Options | Trackers with no options |
|---|---|---|---|---|
| account | 8 (General, World 1-7) | 46 | 157 | 1 |
| characters | flat | 16 | 27 | 2 |
| timers | 7 | 36 | 2 | 34 |

Option types: 123 boolean, 40 number inputs (5 with W1-W7 overrides), 9 icon pickers. 59 options
carry helper text, average 94 characters, longest 292.

What goes wrong today:

- Every section starts collapsed and only one tracker can be open at a time.
- The tracker checkbox overwrites every option and picker value (`DashboardSettings.jsx:127-139`),
  so turning an alert off and on loses the user's choices and enables options that are off by
  default.
- No search, no "edited from default" indication, no reset, no counts.
- Helper text is placed three different ways and long text pushes the list down.
- Labels come from `camelToTitleCase` of internal keys.
- On a phone the dialog is not full screen and targets are small.

Two structural problems sit under the UI:

- **The saved config is a full copy of `baseTrackers`**, display text included. Text changes
  never reach existing users without a migration, and every new option needs one (81 so far).
- **Alert paths are hints, not addresses.** `settingsTarget.js` resolves an alert's data key to a
  tracker and option; 20 of the 177 alert targets resolve only to the tracker.

## Goals

1. Find and change any alert setting in a few seconds, on desktop and phone.
2. Changing one thing never silently changes another.
3. Users see what they changed and can undo or reset it.
4. Adding an option, changing a default or rewording a description needs no migration.
5. Change an alert from the dashboard without opening the full editor.

Non-goals: presets ("Minimal", "Everything"), per-character muting, cloud sync of the config,
changing what any alert computes.

## Decisions

| Topic | Decision |
|---|---|
| Container | Keep a dialog: wide on desktop (`maxWidth="lg"`), full screen below `sm`. No new route. |
| Order | Storage first (R1), full editor (R2), quick edit popover (R3). |
| Storage | Save only the values that differ from defaults ("edits"). |
| Display text | A static metadata registry in code, keyed by tracker and option name. |
| Controls | A switch turns a whole alert on or off. A checkbox is one option inside it. Same on every surface. |
| Master switch | Gates the alert only. Options are kept and stay editable while it is off. |
| New picker items | On by default. |
| First week "Edited" tags | One-time note: "N settings differ from today's defaults · Review · Reset all". |
| "Off" filter | Counts alerts whose master switch is off. Partially-off alerts count as On. |
| Counts | Every chip and nav count is alerts, not options. While searching, counts are results. |
| Per-character muting | Out of scope. Character popovers say "Applies to every character". |
| Presets | Out of scope. |

## Design

### 1. Storage (R1)

**Shape.** `localStorage.trackers` becomes:

```js
{
  schema: 2,
  edits: {
    'account.World 3.construction': { checked: false },
    'account.World 3.construction.matsThreshold': { value: 4 },
    'account.World 3.construction.materials': { value: { Refinery6: false } },
    'account.World 7.royalGuardian.tradeRank': { checked: true, perWorld: { 3: 15 } },
    'characters.anvil.unspentPoints': { value: 3 }
  }
}
```

- Key: `<configType>.<section>.<tracker>[.<option>]`; `characters` has no section. Section names
  contain spaces but never dots.
- An edit holds only the fields that differ: `checked`, `value`, `perWorld`. Picker edits hold only
  the item keys that differ.
- No edit for a path means the default from `baseTrackers`.

**Resolver.** `resolveTrackers(baseTrackers, edits)` returns the exact object shape the alert code
reads today (`{ account, characters, timers }` with full trackers and options). `account.js`,
`characters.js`, `useAlerts` and their tests do not change. Edits for paths that no longer exist
are ignored. A rename table (`{ oldPath: newPath }`) covers future renames with one line.

**Writing.** The editor changes the resolved object as today; on save, `diffTrackers(baseTrackers,
resolved)` produces the edits. The handler stops cascading the master switch into options.

**Conversion (one time, on load).**

1. Stored value has a numeric `version` (legacy): run the existing `migrateConfig` chain to v81,
   then `diffTrackers` against v81 defaults, then apply the group B seeding (section 5).
2. Write `{ schema: 2, edits }` to `trackers`; copy the untouched legacy value to
   `trackers-legacy-backup`.
3. Any exception: keep using the legacy value exactly as today, do not write, send GA event
   `dashboard_config_conversion_failed`.

`baseTrackers.version` and `migrations.js` stay for converting legacy configs and imports. New work
after R1 adds no migrations.

**Import / export.** Export writes schema 2. Import accepts schema 2 and legacy files (run through
conversion). Old exported files stay importable permanently.

**Edge cases.**

- Two tabs open across a deploy: an old tab may write the legacy shape back; the next load converts
  it again and the old tab's state wins. No corruption.
- Users whose stored value differs from today's default because a default changed without a
  migration will see "Edited" on settings they never touched. The one-time note covers this.
- New picker items (shop items, salts) start being watched. Today they are missing from old configs.

**Hydration.** The conversion runs where `AppProvider` hydrates storage today, never in render.

### 2. Metadata registry (R1 data, R2 consumer)

`utility/dashboard/alertMeta.js`, plain data, no `@website-data` import:

```js
export const alertMeta = {
  'account.World 3.construction': {
    icon: 'data/ConTower0',
    summary: ({ on, total }) => `${on} of ${total} options on`,
    options: {
      matsThreshold: {
        label: 'Warn ahead of time',
        help: '0 alerts only once the materials are gone.',
        inline: '{value} h before a salt runs out'
      },
      saltBalanceDirection: { foldInto: 'saltBalance', multi: true }
    },
    aliases: { saltDeficit: 'saltBalance', saltRankUpRoom: 'saltBalance' }
  }
};
```

Fields:

| Field | Level | Purpose |
|---|---|---|
| `label` | tracker, option | Plain name. Falls back to `getLabel` (camelCase + overrides). |
| `help` | option | Short description, one line clamped with More/Less. |
| `group` | option | Subheading inside a big tracker (Royal Guardian: Outposts, Units, Rank caps). |
| `dependsOn` | option | Child option, disabled with a hint while the parent is off. |
| `inline` | tracker | Single-threshold trackers show the input on the card row. |
| `summary` | tracker | Collapsed card line. |
| `icon` | section, tracker | Nav and card icon, reused from the alert call sites. |
| `foldInto` | option | Renders inside another option's row. |
| `unit` | option | e.g. "Traders" on rank rows. |
| `aliases` | tracker | Alert data key to option name (group A below). |

`helperText`, `category` and `props.label` stop being read from the saved config. The 186 labels
and help texts are drafted in one pass and reviewed before R2.

### 3. Full editor (R2)

Layout (artboards 1-6, 9a-c):

- **Header:** title, global search ("Search 98 alerts, options and descriptions"), filter chips
  All / On / Off / Edited / Has threshold with counts, Import, Export, Reset all (confirm dialog),
  close.
- **Left nav (288 px):** Account / Characters / Timers segmented control with an edited dot per
  tab; sections with `on/total` and an edited dot; sections with more than 6 trackers list them as
  a scroll-spy. Nav scrolls.
- **Right pane:** one section at a time; header with counts, Turn all off, Reset section; one card
  per tracker.
- **Card:** switch, icon, name, Edited tag, Off tag, summary, Reset, expand. Single-threshold
  trackers show the input inline. Expanded body: one row per option (checkbox, name, help,
  control). Off cards stay expandable with the note "Alerts are off. These options are kept and
  still editable."
- **Edited:** blue tag with dot, "Default N · Reset" beside changed values. No warning colors.
- **Pickers:** 40 px icon tiles, ticked when selected, All / None, `n/total`. Multi-choice values
  that are not exclusive (salt balance direction, cluster farming) render as toggle chips.
- **Per-world rows:** main value, "Per world" (disabled while the row is off), always-visible
  summary ("1 override: W3 15" or "No overrides"), labelled W1-W7 inputs, "Leave blank to use N",
  Clear overrides.
- **Characters tab:** "Hide characters without alerts" display preference at the top (still
  `dashboard-hide-alertless`, not in the config); single-check trackers in a two-column grid;
  trackers with options as cards.
- **Timers tab:** sections as boxes with a two-column switch list and Turn all off; the two timers
  with options show them below the list; Clickers rows show Orion / Poppy / Bubba.
- **Undo:** snackbar (`role="status"`) for Turn all off, section reset, Reset all and import.
- **States:** no search results (with a suggestion), filter empties a section, deep link to an
  alert the filter hides (banner + show anyway), number out of range (field error, value clamped),
  import of a wrong file, import success with Undo.
- **Search:** names, option labels, help text, aliases; flat results grouped by location with
  breadcrumbs and "Show in <section>"; collapsibles do not apply while searching.
- **Deep link:** unchanged behaviour (tab, section, tracker, scroll, 1600 ms tint), now landing on
  the exact option via `aliases`.
- **Mobile:** full-screen; section list, then section detail with back; search as its own screen;
  every target 44 px; switch on the left as on desktop.
- **Accessibility:** real buttons and inputs, `aria-pressed` on tiles and chips, `aria-expanded`
  on More and expand, hidden text for edited dots, contrast at least 4.5:1 for text and 3:1 for
  the off switch track.

### 4. Quick edit popover (R3)

Clicking an alert icon opens a popover with that alert's own setting, "All <tracker> settings",
and "Saved automatically". Changes show an Undo snackbar. Variants (artboard 8):

| Kind | Count | Popover |
|---|---|---|
| On/off option | 106 | Checkbox |
| Threshold | 38 | Checkbox + number |
| One item of a picker | 12 | "Watch <item>" + the picker. Needs the alert to pass the item key. |
| Character alert | 31 | As above + "Applies to every character" |
| Single-alert tracker (Tools, Divinity Style) | 2 | The tracker switch |
| Royal Guardian ranks | 5 | Edits the value that applies to that outpost; "World N value" when it has an override, else the main value with "Set a value for World N only" |
| Option with a dependent | 1 | Parent and child |
| Timers | 36 | Switch (+ picker). Needs a target on each `TimerCard`. |

### 5. Alert changes that come with R1

Of the 20 targets that resolve only to a tracker:

- **Group A, 13 aliases** (no behaviour change): `saltDeficit`, `saltRankUpRoom` to `saltBalance`;
  `printer.atoms` to `includeResource`; `traps.overdue` to `trapsOverdue`; `hatRack.missingHats`
  to `hatsMissing`; Hole `motherlodeMaxed`, `hiveMaxed`, `evertreeMaxed`, `bottomlessTrenchMaxed`
  to `motherlode`, `theHive`, `evertree`, `bottomlessTrench`; `etc.emperorAttempts` to `emperor`;
  `gallery.missingTrophies`, `missingNametags` to `trophiesMissing`, `nametagsMissing`;
  `legendTalents.legendPointsLeftToSpend` to `pointsLeftToSpend`.
- **Group B, 2 new options** seeded from the option they depend on today: Gaming "Drops ready"
  (today gated by `sprouts`, `account.js:1086`) and "Passive cards equipped" (today inside the
  `cardSet` check, `characters.js:375`). Seeding means a user who had the parent off keeps the
  alert hidden.
- **Group C, 1 new option:** Alchemy "No alchemy activity" (today ungated, `characters.js:122`),
  default on.
- **Fine as is:** Tools, Divinity Style, Crystal Countdown, The Bell (fixed in `62ee5397e2`).

## Rollout

| Release | Contents | User-visible |
|---|---|---|
| R1 | Storage, resolver, conversion, backup, import/export, groups A-C, metadata file (labels unused yet) | Three new options; one-time note if their settings differ from defaults |
| R2 | Full editor | New dialog |
| R3 | Quick edit popover, picker item keys, timer targets | Popover on alert click |
| Later | Remove `trackers-legacy-backup` | None |

Each release gets a patch note. Before R2, export the artboards as images and ask a few Discord
users to find and change a setting.

## Testing

- **Round trip:** for legacy configs at every version 1-81 (built by running the chain from a
  minimal v1 config) plus hand-made edge cases, `resolveTrackers(base, convert(legacy))` deep-equals
  `migrateConfig(base, legacy)` apart from the intended group B/C additions.
- **Existing alert tests** stay unchanged and green.
- **New:** resolver (defaults, edits, removed paths, renames, new picker items), diff, conversion
  failure fallback, import of both formats, group B seeding, alias resolution in
  `settingsTarget`, master switch no longer cascading.
- **R2:** component tests for card states, search, filters, undo; `e2e/hydration.spec.js` must stay
  clean (no storage reads in render, no `noSsr`).
- Browser verification on the Vercel preview with `?demo=true`.

## Analytics

`dashboard_config_conversion_failed`, `alert_settings_opened` (`source`: button, alert),
`alert_quick_edit_changed`, `alert_settings_reset` (`scope`: option, tracker, section, all),
`alert_settings_search` (debounced, no query text).

## Risks

| Risk | Mitigation |
|---|---|
| Conversion bug changes someone's alerts | Round-trip test, legacy backup, fail-closed fallback |
| "Edited" surprise after conversion | One-time note with Reset all |
| New picker items create unexpected alerts | One click to untick; mentioned in the R1 patch note |
| 186 labels drift from the game | Labels live in one file, fall back to the key name |

## Preview deploys on Vercel

The Vercel project points at `Morta1/IdleonToolbox` (repo root, Next.js preset; the static export
needs no extra settings). In **Settings > Git > Ignored Build Step**, choose "Custom" and use:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "feat/dashboard-alert-settings" ]; then exit 1; else exit 0; fi
```

Vercel builds when the command exits 1 and skips when it exits 0, so only this branch deploys and
`main` keeps shipping through GitHub Pages only. Firebase sign-in on the preview domain needs that
domain in Firebase Auth's authorised domains; `?demo=true` works without it.
