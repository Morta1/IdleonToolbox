---
alwaysApply: true
---

## Dashboard alerts

- When being asked to create a new alert make sure to scan the following files to get the context:
  - @IdleonToolbox/utility/migrations.js
  - @IdleonToolbox/pages/dashboard.jsx
  - @IdleonToolbox/components/dashboard/Account.jsx
  - @IdleonToolbox/components/dashboard/Characters.jsx
  - @IdleonToolbox/utility/dashboard/account.js
  - @IdleonToolbox/utility/dashboard/characters.js
- If the "baseTrackers" object version in dashboard.jsx was already updated in the current changes, don't update it, if it didn't make sure to bump it one version and add the relevant migration.

## New page
- When being asked to create new page, make sure to add it to the correct folder path, when unsure, ask.
- Update the relevant PAGES path at @IdleonToolbox/components/constants.jsx
- In case tabs are being added to the page, make sure to update the tabs array as well.
- Every new page should have an icon, if an icon is not being provided, you can use "/data/ClassIconsNA2.png" as a temporary file.

## Obfuscated code
- When being asked to reformat, validate or restructure an obuscated code, make sure to look at @IdleonToolbox/parsers for more context.
- Always prefer using existing functions.
- Always use readable and maintainable code.
- For more context you can query the @IdleonToolbox/data/website-data.json file - which contains most of the data relevant to the project.
- Few examples of obfuscated function vs existing one:
  - `m._customBlock_Summoning("WinBonus", 27, 0)` -> `getWinnerBonus(account, '<x Amber Gain')`
  - `a.engine.getGameAttribute("OptionsListAccount")[478]` -> `account?.accountOptions?.[478]`
  - `m._customBlock_Summoning2("MeritocBonusz", 17, 0)` -> `getMeritocracyBonus(account, 17)`
  - `a.engine.getGameAttribute("DNSM").h.AlchBubbles.h.M11` -> `getBubbleBonus(account, 'DEEP_DEPTH', false)`

## Testing
When testing add "http://localhost:3001?demo=true" to be able to access all pages without login in

## General

This project uses **React Compiler** (`reactCompiler: true` in `next.config.js`), so manual memoization with `useMemo` and `useCallback` is generally unnecessary. The compiler automatically optimizes component re-renders.

### Multi-pass serialization rule

Some fields produced by `serializeData` depend on values that are computed during the same
serialization step.

For this reason, `serializeData` is intentionally executed multiple times (currently 3 passes).
Each pass may unlock additional derived values for the next one.

By the final pass, all cascading and inter-dependent calculations are considered stabilized, and
code is allowed to rely on values that were produced in earlier passes.