# Plan: Remove `any` From Parser Files

## Context

All 93 parser files are TypeScript with `strict: true` and 0 errors. But they contain **~1,600 `any` annotations** from the JS-to-TS migration — parameter types, callback params, casts, builder objects. We now have auto-generated types with real field definitions (`Account` 95 fields, `Character` 65 fields, `IdleonData` 205 fields, `ServerVars` 71 fields, plus 137 typed `@website-data` exports). Both `Account` and `Character` have `[key: string]: any` index signatures, which means replacing `param: any` with `param: Account` is **mechanically safe** — it cannot introduce type errors.

---

## Wave 1: Function Parameter Signatures (~620 instances)

Zero-risk mechanical replacement. Parallelizable across all files.

### What to replace

| Pattern | Replacement | Count |
|---------|-------------|-------|
| `account: any` | `account: Account` | 320 |
| `character: any` / `char: any` | `character: Character` | 127 |
| `characters: any[]` / `characters: any` | `characters: Character[]` | ~120 |
| `idleonData: any` | `idleonData: IdleonData` | 53 |
| `serverVars: any` | `serverVars: ServerVars` | 22 |

### Exception: raw character data

In these specific functions, `char`/`serializedCharactersData` is the **raw** Firebase data (pre-`initializeCharacter`), NOT a `Character`. Leave as `any`:
- `character.ts`: `getCharacters()` inner callback, `initializeCharacter()` first param
- `alchemy.ts`, `divinity.ts`, `lab.ts`, `summoning.ts`: `serializedCharactersData` param

### Per-file steps

1. Add `import type { Account, Character, IdleonData, ServerVars } from './types'` (only needed types, correct relative path based on depth)
2. Replace parameter annotations per table above
3. Remove redundant `(account as any)` casts where param is now typed

### Execution: 4 parallel agents

- **Agent A**: `misc.ts`, `character.ts`, `damage.ts`, `talents.ts`, `index.ts`, `genericUpgradeOptimizer.ts`, `efficiency.ts`, `family.ts`
- **Agent B**: `world-7/*` (8 files), `world-6/*` (4 files), `clickers/bubba.ts`
- **Agent C**: `world-5/*` + `world-5/caverns/*` (19 files), `world-4/*` (5 files)
- **Agent D**: `world-3/*` (15 files), `world-2/*` (6 files), `world-1/*` (6 files), `class-specific/*` (3 files), `misc/*` (2 files), remaining top-level (`cards.ts`, `dungeons.ts`, `items.ts`, `obols.ts`, `shops.ts`, `quests.ts`, `starSigns.ts`, `parseMaps.ts`, `tasks.ts`)

### Verification
`npx tsc --noEmit` → 0 errors after each agent completes.

---

## Wave 2: Callback & Inline Parameters (~900 instances)

Once Wave 1 is done, TypeScript can infer callback types from properly-typed arrays. Most `: any` on `.map()`, `.filter()`, `.find()`, `.reduce()` callbacks become unnecessary.

### What to remove

| Pattern | Action |
|---------|--------|
| `.map((item: any) => ...)` on typed array | Remove `: any` — TS infers from array |
| `.filter(({ name }: any) => ...)` on typed array | Remove `: any` |
| `.reduce((acc: any, item: any) => ..., 0)` | Remove both `: any` — seed `0` infers `number` |
| `.reduce((acc: any, item: any) => ..., {})` | Replace `{}` with `{} as Record<string, SpecificType>` |
| `(item: any, index: any)` | Remove both — `index` is always `number` |

### Approach

After Wave 1, run `npx tsc --noEmit` with all `: any` removed from callbacks to see which ones TS can infer. For those that cause errors, add back specific types (not `any`).

### Execution: 4 parallel agents (same file batches as Wave 1)

Each agent: strip `: any` from all callback params → run tsc → fix any errors with specific types.

---

## Wave 3: `as any` / `as Record<string, any>` Casts (~246 instances)

### What to fix

| Pattern | Action | Count |
|---------|--------|-------|
| `(account as any)?.field` | Remove cast — `Account` allows it | ~67 |
| `(idleonData as any)?.field` | Remove cast — `IdleonData` allows it | ~16 |
| `(websiteExport as any)[key]` | Check if `.d.json.ts` types handle it; remove if so | ~56 |
| `(arr as any).toSimpleObject()` | Add global type declaration for polyfills | ~8 |
| `(x as string).split()` | Keep — these are legitimate narrowing | ~30 |
| `String(notateNumber(...))` | Keep — return type really is `string \| number` | ~15 |

### Global polyfill declarations

Create `parsers/polyfill-types.d.ts`:
```typescript
declare global {
  interface Array<T> {
    toSimpleObject(val?: boolean): Record<string | number, boolean>;
    toChunks(perChunk: number): T[][];
    toObjectByIndex(): Record<string, T>;
  }
  interface String {
    capitalize(): string;
    camelToTitleCase(): string;
    capitalizeAllWords(): string;
    capitalizeAll(): string;
    firstCharLowerCase(): string;
    toCamelCase(): string;
  }
  interface Date {
    stdTimezoneOffset(): number;
    isDstObserved(): boolean;
  }
}
export {};
```

This eliminates all `as any` casts for prototype methods.

### Execution: 4 parallel agents (same batches)

---

## Wave 4: Builder Objects & Return Types (~125 instances)

### Builder objects (`const x: any = {}`)

| Instance | Fix |
|----------|-----|
| `const character: any = {}` in `initializeCharacter` | `const character = {} as Character` |
| `const accountData: any = {...}` in `serializeData` | `const accountData = {...} as Account` |
| `const obj: any = {}` (accumulators in loops) | `const obj: Record<string, number> = {}` or infer from usage |
| `const arr: any[] = []` | Infer element type from `.push()` calls |

### Return types (25 instances)

For most, simply remove the explicit `: any` return type — let TS infer. For recursive functions, add the real return type.

### Execution: Sequential, 1 agent per major file.

---

## Files to modify

All 91 parser files (excluding `types.ts` and `generated-*.ts`). Plus:
- **Create**: `parsers/polyfill-types.d.ts` (global declarations for prototype methods)
- **No changes** to `parsers/types.ts`, `parsers/generated-types.ts`, `parsers/generated-firebase-types.ts`

---

## Verification

After each wave:
1. `npx tsc --noEmit` → 0 errors
2. After Wave 4: `npx next build` → verify build passes
3. After all waves: `grep -r ": any\|as any" parsers/ --include="*.ts" -c | awk -F: '{sum+=$2} END {print sum}'` → target < 50 (down from 1,600+)
