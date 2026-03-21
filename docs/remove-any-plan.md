# Plan: Remove `any` From Parser Files — COMPLETED

## Summary

All 4 waves executed across 91 parser files. Starting from **~1,892 `any` annotations**, we eliminated bare `any` from function parameters, callbacks, casts, and variable declarations. The remaining `any` occurrences are inside `Record<string, any>` (structured dynamic objects) and intentional exceptions for raw Firebase data.

| Metric | Before | After |
|--------|--------|-------|
| `generated-firebase-types.ts` `any` | 157 | 17 |
| `npx tsc --noEmit` | 0 errors | 0 errors |
| `npx next build` | passes | passes |

### What was done
- **Wave 0**: Fixed type generator to emit `number[][]`, `string[][]`, `(string \| number)[][]` instead of `any[][]`
- **Wave 1**: Replaced ~620 function parameter `any` with `Account`, `Character`, `IdleonData`, `ServerVars`
- **Wave 2**: Removed ~345 callback `: any` annotations, letting TS infer from typed arrays
- **Wave 3**: Removed ~180 `as any` casts; created `polyfill-types.d.ts` for prototype extensions
- **Wave 4**: Replaced builder objects, return types, and variable declarations with specific types

### What remains (intentional)
- `Record<string, any>` — genuinely dynamic objects (Firebase data, game config)
- `any` on `serializedCharactersData` / `updatedCharactersData` params — partially-built data during multi-pass serialization
- `any` on `char` param in `initializeCharacter` — raw Firebase character data
- `any[]` on a few raw data arrays where element types are mixed/unknowable
- `[key: string]: any` index signatures on `Account`, `Character`, `IdleonData`, etc. — intentional catch-alls

### Files created
- `parsers/polyfill-types.d.ts` — global type declarations for `Array.toSimpleObject()`, `Array.toChunks()`, `String.capitalize()`, etc.

### Files modified
- `z-processing/typeGenerator.js` — fixed `inferFirebaseType` to recurse into nested arrays
- `parsers/generated-firebase-types.ts` — regenerated with improved types
- All 91 parser `.ts` files (excluding `types.ts` and `generated-*.ts`)

---

## Archived Plan Details

### Wave 0: Fix Type Generator (DONE)

Fixed `inferFirebaseType` in `z-processing/typeGenerator.js` to recurse into nested arrays instead of emitting `any[][]`. Regenerated `generated-firebase-types.ts`.

- `any` in `generated-firebase-types.ts`: **157 → 17** (140 eliminated)
- Remaining 17: 5 `[key: string]: any` index signatures (intentional), 10 `BuffsActive_N` (empty arrays in fixture), 1 `SailChests` (empty), 1 `leaderboard` (empty)
- Fields now correctly typed: `Cooking: number[][]`, `Breeding: number[][]`, `Pets: (number | string)[][]`, `CauldronBubbles: string[][]`, `Tess: string[][]`, etc.

### Wave 1: Function Parameter Signatures (DONE)

Replaced `account: any` → `Account`, `character: any` → `Character`, `idleonData: any` → `IdleonData`, `serverVars: any` → `ServerVars` across all parser functions. Added/extended type imports. Fixed ~348 surfaced type errors with `Number()`, `?? 0`, and type narrowing.

Exceptions preserved: `initializeCharacter(char: any)`, `serializedCharactersData: any` in alchemy/divinity/lab/summoning.

### Wave 2: Callback & Inline Parameters (DONE)

Removed `: any` from `.map()`, `.filter()`, `.find()`, `.reduce()`, `.forEach()`, `.sort()` callbacks. Where TS couldn't infer, added specific types (not `any`). Fixed ~120 follow-up errors.

### Wave 3: `as any` Casts + Polyfills (DONE)

Removed `(account as any)?.field` casts (Account has index sig), `(idleonData as any)?.field` casts, polyfill method casts. Created `parsers/polyfill-types.d.ts`. Narrowed `as any` to `as Record<string, ...>` where full removal wasn't possible.

### Wave 4: Builder Objects & Return Types (DONE)

Replaced `const character: any = {}` → `{} as Character`, `const obj: any = {}` → `Record<string, number>`, return type `: any` → `: number`, `any[]` → specific element types. 4 parallel agents across all 91 files.
