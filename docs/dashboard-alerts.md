# Dashboard alerts

Read before adding, renaming or changing a dashboard alert or tracker.

- When asked to create a new alert, scan these files for context:
  - `utility/dashboard/baseTrackers.js`
  - `utility/dashboard/trackerStore.js`
  - `components/dashboard/Account.jsx`
  - `components/dashboard/Characters.jsx`
  - `utility/dashboard/account.js`
  - `utility/dashboard/characters.js`
- Saved configs hold only the user's edits (`{ schema: 2, edits }`); defaults come from `baseTrackers`.
  Adding an option or changing a default needs no migration and no version bump.
- Renaming or moving a tracker or option: add `oldPath: newPath` to `RENAMED_PATHS` in `trackerStore.js`.
- `utility/migrations.js` is frozen at version 81 and only converts pre-R1 configs and old exported files.
- When an alert's data key differs from the option that controls it, add it to `alertAliases` in
  `utility/dashboard/alertMeta.js` so the settings link lands on the option.
