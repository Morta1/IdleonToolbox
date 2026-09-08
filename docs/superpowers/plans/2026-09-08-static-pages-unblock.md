# Static Pages Unblock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Static pages paint their real UI from the exported HTML before any JS runs, and load only the JS they need; data pages keep today's loader behaviour.

**Architecture:** Three phases on one branch. Phase 1 moves firebase and the game-data barrel out of the JS that static pages load (lazy `import()`, an `authHint` localStorage key, pure card math split out of `parsers/cards.ts`). Phase 2 makes the first render identical on the build machine and the client (constant initial `AppProvider` state with a storage-hydration action, no `noSsr` media queries, three known mismatches fixed, a `useHydrated` hook). Phase 3 gives wiki listings real anchors, then deletes `WaitForRouter`, `PreHydrationLoader` and `CrawlLinks`.

**Tech Stack:** Next 16.2.11 pages router with `output: 'export'`, React 19.2, MUI 6.4, React Compiler, vitest (`isolate: false`, jsdom per-file), Playwright against `npx serve out` on port 3002.

**Spec:** `docs/superpowers/specs/2026-09-08-static-pages-unblock-design.md`

## Global Constraints

- Work on branch `feat/static-pages-unblock` cut from `main`, in a git worktree (create it with `superpowers:using-git-worktrees`). The main checkout has uncommitted user changes in `data/patch-notes.js`, `pages/account/world-5/slab.jsx`, `parsers/parseMaps.ts`: never stage them, never touch them. After creating the worktree: `cp <main checkout>/.env.local <worktree>/.env.local` and `npm ci` inside the worktree.
- No commits. The user commits when they decide to. Tasks end at "tests pass".
- `next build` needs the builds worker reachable. `.env.local` points `NEXT_PUBLIC_BUILDS_URL` at a local Wrangler worker, so build with (Git Bash) `NEXT_PUBLIC_BUILDS_URL=https://builds.idleontoolbox.workers.dev/api npm run build`. The build exports ~4,800 pages; run it in the background with a 10-minute timeout.
- Playwright: a new spec runs only once it is named in `playwright.config.js` `testMatch`. Run one spec with `npx playwright test e2e/<name>.spec.js` (the config starts `serve` on 3002 itself; `out/` must exist).
- vitest: `npx vitest run <file>` for one file, `npm test` for all. Component tests need `// @vitest-environment jsdom` and `import '../../polyfills';` as their first two lines.
- No `useMemo`, no IIFEs (React Compiler is on). No em dashes anywhere, in code comments or copy: use a colon. Tooltips only via the project's `Tooltip` component hanging off an `InfoIcon`.
- `data/page-seo.js` and `data/website-data/**` are generated: do not edit.
- Comments explain why, in prose, matching the style already in the touched files.
- The in-app Browser pane cannot load this app. Browser checks go through Playwright (the e2e specs) or the Playwright MCP against `npx serve out`.

---

## Phase 1: lazy-load what static pages never use

### Task 1: Firebase behind a memoised dynamic import

**Files:**
- Create: `firebase/lazy.js`
- Modify: `components/common/context/AppProvider.jsx:2` (import), `:211-237` (`logout`), `:265` (`handleProfile`), `:341-355` (`handleUnauthenticatedUser`), `:433`, `:465`, `:471` (auth poll)
- Modify: `components/common/Logins/EmailLogin.jsx:4`, `:33`
- Modify: `firebase/index.js:196-198` (stale comment)
- Modify: `playwright.config.js:7` (testMatch)
- Create: `e2e/chunk-audit.spec.js`
- Test: `__test__/firebase-lazy.test.js`

**Interfaces:**
- Produces: `loadFirebase(): Promise<typeof import('firebase/index')>` and `firebaseRequested(): boolean` from `firebase/lazy.js`. Task 2 uses both.

- [ ] **Step 1: Write the failing source-guard test**

`__test__/firebase-lazy.test.js`:

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// firebase/index.js initialises auth, database and firestore at module top: ~700 KB of JS. A
// static import anywhere in the every-page tree puts it back into the chunk shared by all 4,800
// exported pages. Only firebase/lazy.js may import it; everyone else awaits loadFirebase().
const EVERY_PAGE_FILES = [
  'components/common/context/AppProvider.jsx',
  'components/common/Logins/EmailLogin.jsx',
  'components/common/NavBar/index.jsx',
  'components/common/NavBar/LoginDialog.jsx',
  'pages/_app.jsx'
];

describe('firebase stays out of the every-page bundle', () => {
  for (const file of EVERY_PAGE_FILES) {
    it(`${file} has no static firebase import`, () => {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      const staticImports = source.split('\n')
        .filter((line) => /^import .* from ['"].*firebase(\/index)?['"]/.test(line));
      expect(staticImports).toEqual([]);
    });
  }

  it('firebase/lazy.js memoises a single dynamic import', () => {
    const source = readFileSync(path.join(process.cwd(), 'firebase/lazy.js'), 'utf8');
    expect(source).toMatch(/import\('\.\/index'\)/);
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run __test__/firebase-lazy.test.js`
Expected: FAIL. `AppProvider.jsx` and `EmailLogin.jsx` each list one static import; `firebase/lazy.js` does not exist.

- [ ] **Step 3: Create `firebase/lazy.js`**

```js
// The only place allowed to import firebase/index.js. That module runs getAuth, getDatabase and
// getFirestore at module top, so a static import from anything _app renders puts ~700 KB into
// the chunk every exported page loads. One memoised promise: the first caller pays for the
// download, later callers share it, and a rejected load is retried by the next call.
let pending = null;

export const loadFirebase = () => {
  if (!pending) {
    pending = import('./index').catch((err) => {
      pending = null;
      throw err;
    });
  }
  return pending;
};

// Whether anyone has asked for firebase this session. logout() uses it to skip signing out of a
// SDK that was never loaded, which is every anonymous visitor.
export const firebaseRequested = () => pending !== null;
```

- [ ] **Step 4: Rewire `AppProvider.jsx`**

Replace line 2:

```js
import { checkUserStatus, signInWithCustom, signInWithToken, subscribe, userSignOut } from '../../../firebase';
```

with:

```js
import { firebaseRequested, loadFirebase } from '../../../firebase/lazy';
```

In `logout` (starts `const logout = async (manualImport, data) => {`), replace the bare `userSignOut();` line with:

```js
    // Firebase loads on demand, so an anonymous visitor has nothing to sign out of. And never
    // throw here: handleUnauthenticatedUser's catch calls this, and an error before
    // dispatch(LOGOUT) and loadEmptyAccount would leave isLoading false with no account, which
    // every data page shows as an endless "Loading account data...".
    if (firebaseRequested()) {
      try {
        const { userSignOut } = await loadFirebase();
        userSignOut();
      } catch (err) {
        console.warn('Sign-out skipped:', err);
      }
    }
```

In `handleProfile`, replace `const user = await checkUserStatus();` with:

```js
        const { checkUserStatus } = await loadFirebase();
        const user = await checkUserStatus();
```

In `handleUnauthenticatedUser`, insert as the first line inside `try {`:

```js
        const { checkUserStatus, subscribe } = await loadFirebase();
```

In the `useInterval` auth poll: before `const userData = await signInWithCustom(...)` insert `const { signInWithCustom } = await loadFirebase();`; before `const userData = await signInWithToken(id_token, state?.loginType);` insert `const { signInWithToken } = await loadFirebase();`; before `const unsub = await subscribe(uid, accessToken || id_token?.id_token, handleCloudUpdate);` insert `const { subscribe } = await loadFirebase();`.

- [ ] **Step 5: Rewire `EmailLogin.jsx`**

Replace line 4 `import { signInWithEmailPassword } from '../../../firebase';` with `import { loadFirebase } from '../../../firebase/lazy';`. Replace line 33 `data = await signInWithEmailPassword({ email, password });` with:

```js
        const { signInWithEmailPassword } = await loadFirebase();
        data = await signInWithEmailPassword({ email, password });
```

- [ ] **Step 6: Fix the stale comment in `firebase/index.js:196-198`**

Replace the two comment lines with:

```js
    // Loaded lazily so website-data and the parsers graph ride with this call, not with the
    // firebase module (which AppProvider itself now loads on demand).
```

- [ ] **Step 7: Run the guard test and the full suite**

Run: `npx vitest run __test__/firebase-lazy.test.js && npm test`
Expected: PASS, all files.

- [ ] **Step 8: Add the chunk-audit e2e spec (firebase half)**

`e2e/chunk-audit.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

// Asserts on the JS a page actually references, fetched the way a browser would. Chunk names
// are hashed, so a chunk is recognised by a string it must contain, not by its filename.
const FIREBASE_MARKER = '@firebase/';
const ITEMS_MARKER = '"displayName":"Copper_Ore"';

const scriptsOf = (html) => [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);

const firstWikiEntityRoute = () => {
  const dir = path.join(process.cwd(), 'out', 'wiki', 'monster');
  const file = readdirSync(dir).find((f) => f.endsWith('.html'));
  return `/wiki/monster/${file.replace(/\.html$/, '')}`;
};

const referencedScripts = async (request, route) => {
  const html = await (await request.get(route)).text();
  const sources = scriptsOf(html);
  expect(sources.length, `${route} references no scripts`).toBeGreaterThan(0);
  return Promise.all(sources.map(async (src) => ({ src, body: await (await request.get(src)).text() })));
};

const offenders = (scripts, marker) => scripts.filter(({ body }) => body.includes(marker)).map(({ src }) => src);

test('the home page references no firebase chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, '/');
  expect(offenders(scripts, FIREBASE_MARKER)).toEqual([]);
});

test('a wiki entity page references no firebase chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, firstWikiEntityRoute());
  expect(offenders(scripts, FIREBASE_MARKER)).toEqual([]);
});
```

Add `'chunk-audit.spec.js'` to the `testMatch` array in `playwright.config.js`.

- [ ] **Step 9: Build and run the spec**

Run (background, 10 min): `NEXT_PUBLIC_BUILDS_URL=https://builds.idleontoolbox.workers.dev/api npm run build`
Then: `npx playwright test e2e/chunk-audit.spec.js`
Expected: both tests PASS. If the home page still references firebase, `grep -rn "from '.*firebase'" components/common pages/_app.jsx` finds the remaining static edge.

### Task 2: `authHint` so known-anonymous visitors skip firebase

**Files:**
- Create: `utility/auth-hint.js`
- Modify: `components/common/context/AppProvider.jsx` (`logout`, `handleProfile`, `handleUnauthenticatedUser`, auth poll)
- Modify: `e2e/chunk-audit.spec.js` (runtime tests)
- Test: `__test__/utility/auth-hint.test.js`

**Interfaces:**
- Consumes: `loadFirebase`, `firebaseRequested` from Task 1.
- Produces: `readAuthHint(): 'yes' | 'no' | null`, `writeAuthHint(value: 'yes' | 'no'): void`, `AUTH_HINT_KEY = 'authHint'`.

- [ ] **Step 1: Write the failing helper test**

`__test__/utility/auth-hint.test.js`:

```js
// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_HINT_KEY, readAuthHint, writeAuthHint } from '@utility/auth-hint';

describe('auth hint', () => {
  beforeEach(() => localStorage.clear());

  it('is absent until written', () => {
    expect(readAuthHint()).toBeNull();
  });

  it('round-trips yes and no under the documented key', () => {
    writeAuthHint('yes');
    expect(readAuthHint()).toBe('yes');
    writeAuthHint('no');
    expect(localStorage.getItem(AUTH_HINT_KEY)).toBe('no');
  });

  it('treats blocked storage as absent rather than throwing', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readAuthHint()).toBeNull();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run __test__/utility/auth-hint.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `utility/auth-hint.js`**

```js
// Whether the last visit ended with a firebase session. 'no' lets AppProvider skip loading the
// firebase SDK (~700 KB) for a returning anonymous visitor; absent means undecided, so firebase
// is asked, which also covers everyone who signed in before this key existed. It is a hint,
// never an authority: 'no' is only written after firebase itself reported no user or on an
// explicit logout, and every login path writes 'yes' before the next page load.
export const AUTH_HINT_KEY = 'authHint';

// Storage access throws in some contexts (blocked site data, some private windows). A hint that
// cannot be read is the same as absent: ask firebase.
export const readAuthHint = () => {
  try {
    return localStorage.getItem(AUTH_HINT_KEY);
  } catch {
    return null;
  }
};

export const writeAuthHint = (value) => {
  try {
    localStorage.setItem(AUTH_HINT_KEY, value);
  } catch {
    // The next visit asks firebase again, which is the safe default.
  }
};
```

- [ ] **Step 4: Run the helper test**

Run: `npx vitest run __test__/utility/auth-hint.test.js`
Expected: PASS.

- [ ] **Step 5: Wire the hint into `AppProvider.jsx`**

Add `import { readAuthHint, writeAuthHint } from '@utility/auth-hint';` next to the other `@utility` imports.

Replace the whole `handleUnauthenticatedUser` with:

```js
    const handleUnauthenticatedUser = async () => {
      try {
        // 'no' is only ever written after firebase itself reported no session, or on logout, so
        // a visitor carrying it has nothing to restore and skips the SDK download entirely.
        // Absent is undecided: ask firebase, which also covers everyone signed in before the
        // hint existed.
        if (readAuthHint() === 'no') {
          await loadEmptyAccount();
          return;
        }
        const { checkUserStatus, subscribe } = await loadFirebase();
        const user = await checkUserStatus();
        if (!user) writeAuthHint('no');
        if (!state?.account && user) {
          const unsub = await subscribe(user?.uid, user?.accessToken, handleCloudUpdate);
          unsubscribeRef.current = unsub;
          writeAuthHint('yes');
        } else {
          await loadEmptyAccount();
        }
      } catch (error) {
        console.error(error);
        dispatch({ type: ACTION_TYPES.SET_LOADING, data: false });
        logout();
      }
    };
```

In `handleProfile`, replace the two lines added in Task 1 with:

```js
        // Skip only on an explicit 'no'. An absent hint on a profile link is a signed-in user's
        // first visit since the hint shipped, and treating that as anonymous would show them
        // "Login" with no way back to their own account.
        const user = readAuthHint() === 'no' ? null : await (await loadFirebase()).checkUserStatus();
```

In the auth poll, directly after `unsubscribeRef.current = unsub;` (the line following the `subscribe` call), add `writeAuthHint('yes');`.

In `logout`, directly after `dispatch({ type: ACTION_TYPES.LOGOUT });`, add `writeAuthHint('no');`.

- [ ] **Step 6: Run the unit suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Add the runtime tests to `e2e/chunk-audit.spec.js`**

Append:

```js
const loadedScriptUrls = (page) => page.evaluate(() =>
  performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.endsWith('.js')));

const loadedScripts = async (page, request) => {
  const urls = await loadedScriptUrls(page);
  return Promise.all(urls.map(async (url) => ({ src: url, body: await (await request.get(url)).text() })));
};

test.describe('firebase loads only when a session might exist', () => {
  test('a visitor whose last visit had no session never downloads firebase', async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem('authHint', 'no'));
    await page.goto('/');
    await waitForRender(page);
    // Give a wrongly-triggered dynamic import time to show up before reading the resource list.
    await page.waitForTimeout(1500);
    expect(offenders(await loadedScripts(page, request), FIREBASE_MARKER)).toEqual([]);
  });

  test('an undecided visitor downloads firebase once and is then marked as having no session', async ({ page, request }) => {
    await page.goto('/');
    await waitForRender(page);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('authHint'))).toBe('no');
    expect(offenders(await loadedScripts(page, request), FIREBASE_MARKER).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 8: Rebuild and run the spec**

Run (background): `NEXT_PUBLIC_BUILDS_URL=https://builds.idleontoolbox.workers.dev/api npm run build`
Then: `npx playwright test e2e/chunk-audit.spec.js e2e/logged-out.spec.js`
Expected: all PASS. `logged-out.spec.js` proves the anonymous flow still lands on an empty account.

### Task 3: Card math out of `parsers/cards.ts`

**Files:**
- Create: `parsers/cardMath.ts`
- Modify: `parsers/cards.ts:46-52`, `:144-147` (move), `:1` area (import + re-export)
- Modify: `components/wiki/CardBonus.jsx:4`, `components/common/styles.jsx:6`
- Modify: `e2e/chunk-audit.spec.js` (items assertion)
- Test: `__test__/parsers/cardMath.test.js`

**Interfaces:**
- Produces: `calculateAmountToNextLevel(perTier, stars, amountOfCards): number`, `calcCardBonus(card): number` from `parsers/cardMath.ts`; `parsers/cards.ts` re-exports both under the same names.

- [ ] **Step 1: Write the failing test**

`__test__/parsers/cardMath.test.js`:

```js
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { calcCardBonus, calculateAmountToNextLevel } from '@parsers/cardMath';
import * as cards from '@parsers/cards';

describe('card math', () => {
  it('is the same function cards.ts exports, so account-side importers are unchanged', () => {
    expect(cards.calculateAmountToNextLevel).toBe(calculateAmountToNextLevel);
    expect(cards.calcCardBonus).toBe(calcCardBonus);
  });

  it('caps at seven stars and returns the count that must be exceeded', () => {
    expect(calculateAmountToNextLevel(5, 7, 0)).toBe(0);
    expect(calculateAmountToNextLevel(5, 0, 0)).toBe(6);
    expect(calculateAmountToNextLevel(5, 1, 3)).toBe(18);
  });

  it('multiplies the bonus by the star count and the chip and legend boosts', () => {
    expect(calcCardBonus(null)).toBe(0);
    expect(calcCardBonus({ bonus: 2 })).toBe(0);
    expect(calcCardBonus({ bonus: 2, stars: 3 })).toBe(8);
    expect(calcCardBonus({ bonus: 2, stars: 3, chipBoost: 2, legendBonus: 1.5 })).toBe(24);
  });

  // The wiki page graph must not reach @website-data: parsers/cards.ts imports it, and the
  // barrel's side effects pin 1.65 MB of JSON onto every wiki page that does.
  it('keeps the wiki consumers off parsers/cards and off the data barrel', () => {
    for (const file of ['parsers/cardMath.ts', 'components/wiki/CardBonus.jsx', 'components/common/styles.jsx']) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source, file).not.toMatch(/from ['"]@?parsers\/cards['"]/);
      expect(source, file).not.toMatch(/@website-data/);
    }
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run __test__/parsers/cardMath.test.js`
Expected: FAIL, `@parsers/cardMath` not found.

- [ ] **Step 3: Create `parsers/cardMath.ts`**

```ts
// Pure card arithmetic with no data imports. The wiki renders card tiers and bonuses on static
// pages whose data arrives through getStaticProps; importing these two from cards.ts pulled
// @website-data, and through the barrel's side effects 1.65 MB of items and shared data, onto
// every wiki page. cards.ts re-exports both, so account-side importers are unaffected.

export const calculateAmountToNextLevel = (perTier: number, stars: number, amountOfCards: number): number => {
  return stars >= 7 ? 0 : Math.ceil(perTier
    * Math.pow((stars + 1)
      + (Math.floor((stars + 1) / 4)
        + (16 * Math.floor((stars + 1) / 5)
          + 100 * Math.floor((stars + 1) / 6))), 2) - amountOfCards) + 1;
};

export const calcCardBonus = (card: any): number => {
  if (!card) return 0;
  return (card?.bonus * ((card?.stars ?? -1) + 1)) * (card?.chipBoost ?? 1) * (card?.legendBonus ?? 1);
};
```

- [ ] **Step 4: Move the two definitions out of `parsers/cards.ts`**

Delete the `calculateAmountToNextLevel` definition (`:46-52`) and the `calcCardBonus` definition (`:144-147`). Add after the existing imports:

```ts
import { calcCardBonus, calculateAmountToNextLevel } from './cardMath';

// Re-exported so the 30+ account-side importers keep their import path. Wiki components import
// cardMath directly: this file's @website-data import is what they must not reach.
export { calcCardBonus, calculateAmountToNextLevel };
```

Both functions are used inside `cards.ts` (`parseCards`, `getEquippedCardBonus`, `getTotalCardBonusById`); the import above keeps those call sites working.

- [ ] **Step 5: Repoint the two wiki consumers**

`components/wiki/CardBonus.jsx:4`: `import { calculateAmountToNextLevel } from '@parsers/cardMath';`
`components/common/styles.jsx:6`: `import { calcCardBonus } from 'parsers/cardMath';`

- [ ] **Step 6: Run the test, then the suite**

Run: `npx vitest run __test__/parsers/cardMath.test.js && npm test`
Expected: PASS. The parser tests exercising cards (`__test__/parsers/**`) stay green because the re-export keeps identity.

- [ ] **Step 7: Extend `e2e/chunk-audit.spec.js`**

Add after the existing wiki test:

```js
test('a wiki entity page references no game-data items chunk', async ({ request }) => {
  const scripts = await referencedScripts(request, firstWikiEntityRoute());
  expect(offenders(scripts, ITEMS_MARKER)).toEqual([]);
});
```

- [ ] **Step 8: Rebuild and run the spec**

Run (background): `NEXT_PUBLIC_BUILDS_URL=https://builds.idleontoolbox.workers.dev/api npm run build`
Then: `npx playwright test e2e/chunk-audit.spec.js`
Expected: PASS. If the items marker is still referenced, trace with `grep -rln "@website-data\|parsers/cards'" components/wiki components/common` for a consumer the spec did not list.

- [ ] **Step 9: Record phase 1 numbers**

Run (Git Bash, from the worktree root):

```bash
for r in index.html wiki/monster/$(ls out/wiki/monster | head -1); do t=0; for c in $(grep -o '/_next/static/chunks/[^"]*\.js' "out/$r"); do t=$((t + $(stat -c %s "out$c"))); done; echo "$r: $((t/1024)) KB JS"; done
```

Note both numbers under "Results" at the bottom of this plan. Baseline before this plan: home ~1,700 KB, wiki entity ~3,800 KB.

---

## Phase 2: deterministic first render

### Task 4: Constant initial `AppProvider` state with storage hydration

**Files:**
- Modify: `components/common/context/AppProvider.jsx:15-30` (ACTION_TYPES), `:31-70` (reducer), `:84-114` (`init`), `:122` (`useReducer`), `:239` (init effect head), `:376` (init effect deps), `:378-418` (persist effect)
- Modify: `components/common/NavBar/AppDrawer/CharactersDrawer.jsx:37-53`
- Test: `__test__/components/AppProviderState.test.jsx`

**Interfaces:**
- Produces: named exports `ACTION_TYPES`, `appReducer`, `readStoredState`, `DEFAULT_STATE` from `AppProvider.jsx` (default export and `AppContext` unchanged). New action `ACTION_TYPES.HYDRATE_STORAGE = 'hydrateStorage'`. New state flag `storageHydrated: boolean`.

- [ ] **Step 1: Write the failing test**

`__test__/components/AppProviderState.test.jsx`:

```jsx
// @vitest-environment jsdom
import '../../polyfills';
import React, { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { act, render } from '@testing-library/react';

// isReady false keeps the init effect (and with it firebase) out of the picture: this file is
// about the first render and the storage merge, nothing else.
vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: false, query: {}, pathname: '/wiki', push: vi.fn(), replace: vi.fn() })
}));

const { default: AppProvider, AppContext, ACTION_TYPES, DEFAULT_STATE, appReducer, readStoredState } =
  await import('@components/common/context/AppProvider');

const Probe = () => {
  const { state } = useContext(AppContext);
  return <span data-testid="probe">{JSON.stringify({
    isLoading: state.isLoading,
    hydrated: state.storageHydrated,
    filters: state.filters ?? null,
    pinned: state.pinnedPages
  })}</span>;
};

describe('reducer', () => {
  it('HYDRATE_STORAGE merges stored values and flags hydration', () => {
    const next = appReducer(
      { isLoading: true, storageHydrated: false },
      { type: ACTION_TYPES.HYDRATE_STORAGE, data: { filters: { a: true } } }
    );
    expect(next).toEqual({ isLoading: true, storageHydrated: true, filters: { a: true } });
  });

  it('LOGOUT keeps storageHydrated so preferences still persist afterwards', () => {
    const next = appReducer(
      { storageHydrated: true, account: {}, filters: { a: true } },
      { type: ACTION_TYPES.LOGOUT }
    );
    expect(next.storageHydrated).toBe(true);
    expect(next.account).toBeUndefined();
    expect(next.filters).toEqual({ a: true });
  });
});

describe('readStoredState', () => {
  beforeEach(() => localStorage.clear());

  it('defaults pinnedPages and skips keys that do not parse', () => {
    localStorage.setItem('filters', JSON.stringify({ a: true }));
    localStorage.setItem('planner', '{not json');
    expect(readStoredState()).toEqual({ filters: { a: true }, pinnedPages: [] });
  });
});

describe('first render', () => {
  beforeEach(() => localStorage.clear());

  it('starts from DEFAULT_STATE on the server even when storage has values', () => {
    localStorage.setItem('filters', JSON.stringify({ a: true }));
    const html = renderToString(<AppProvider><Probe/></AppProvider>);
    expect(html).toContain('&quot;isLoading&quot;:true');
    expect(html).toContain('&quot;hydrated&quot;:false');
    expect(html).toContain('&quot;filters&quot;:null');
    expect(DEFAULT_STATE.storageHydrated).toBe(false);
  });

  it('merges storage in an effect after the first client render', async () => {
    localStorage.setItem('filters', JSON.stringify({ a: true }));
    const { getByTestId } = render(<AppProvider><Probe/></AppProvider>);
    await act(async () => {});
    const probe = JSON.parse(getByTestId('probe').textContent);
    expect(probe.hydrated).toBe(true);
    expect(probe.filters).toEqual({ a: true });
    expect(probe.isLoading).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run __test__/components/AppProviderState.test.jsx`
Expected: FAIL, `ACTION_TYPES`/`appReducer`/`readStoredState`/`DEFAULT_STATE` are not exported.

- [ ] **Step 3: Export the reducer pieces and add the action**

Change `const ACTION_TYPES = {` to `export const ACTION_TYPES = {` and add `HYDRATE_STORAGE: 'hydrateStorage',` after `SETTINGS: 'settings'` (keep a trailing comma consistent with the file).

Change `function appReducer(state, action) {` to `export function appReducer(state, action) {`.

In the handler map add:

```js
    // localStorage is merged in an effect, never during render, so the build and the first
    // client render start from the same constant. This is the merge.
    [ACTION_TYPES.HYDRATE_STORAGE]: () => ({ ...state, ...action.data, storageHydrated: true }),
```

In the `LOGOUT` handler's returned object add `storageHydrated: state.storageHydrated,` next to `signedIn: false`. Update that handler's comment: the whitelist now also carries the hydration flag because dropping it would make the persist effect skip every write after a logout.

- [ ] **Step 4: Replace `init()` with `DEFAULT_STATE` and `readStoredState()`**

Delete the `function init() { ... }` block (`:84-114`). In its place:

```js
// Identical on the build machine and on the client. Anything that only the client can know
// (localStorage) is merged by HYDRATE_STORAGE in an effect. storageHydrated is what the init and
// persist effects wait for.
export const DEFAULT_STATE = {
  showRankOneOnly: false,
  showUnmaxedBoxesOnly: false,
  isLoading: true,
  pinnedPages: [],
  storageHydrated: false
};

// Runs only inside an effect: reading storage during render would make the first client
// render differ from the export, which React reports as a hydration mismatch and answers by
// re-rendering the whole page client-side.
export const readStoredState = () => {
  const loadedState = STORAGE_KEYS.reduce((state, key) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        state[key] = JSON.parse(value);
      }
    } catch (err) {
      console.warn(`Failed to parse ${key} from localStorage:`, err);
    }
    return state;
  }, {});

  if (!loadedState.pinnedPages) {
    loadedState.pinnedPages = [];
  }

  return loadedState;
};
```

Change `const [state, dispatch] = useReducer(appReducer, {}, init);` to `const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);`. Delete `const isInitializedRef = useRef(false);`.

- [ ] **Step 5: Add the hydration effect and gate the init effect on it**

Immediately before the `useEffect(() => { if (!router.isReady) return; const handleProfile = ...` block, add:

```js
  // Declared before the init effect on purpose: React runs mount effects in order, and init
  // reads state that may have come from storage.
  useEffect(() => {
    dispatch({ type: ACTION_TYPES.HYDRATE_STORAGE, data: readStoredState() });
  }, []);
```

Change the init effect's first line to `if (!router.isReady || !state.storageHydrated) return;` and its deps from `[router.isReady]` to `[router.isReady, state.storageHydrated]`.

- [ ] **Step 6: Key the persist effect off the flag**

Replace:

```js
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }
```

with:

```js
    // Nothing to persist until storage has been merged in: before that, every value here is
    // DEFAULT_STATE, and writing it would wipe what the visitor saved.
    if (!state.storageHydrated) return;
```

- [ ] **Step 7: Keep `CharactersDrawer` chips in sync with hydrated filters**

In `components/common/NavBar/AppDrawer/CharactersDrawer.jsx`, the drawer used to mount after storage had been read; now it mounts on the first render with `state.filters` undefined and gets the stored filters one render later. Extend the existing sync-source block (`:46-53`) to:

```js
  // Re-sync the local checkbox and chip state whenever the saved selection, the saved filters or
  // the character roster changes (a newly created 11th character, or storage landing one render
  // after mount): React's recommended "adjust state during render" pattern.
  const [syncSource, setSyncSource] = useState({
    displayed: state?.displayedCharacters,
    length: state?.characters?.length,
    filters: state?.filters
  });
  if (syncSource.displayed !== state?.displayedCharacters
    || syncSource.length !== state?.characters?.length
    || syncSource.filters !== state?.filters) {
    setSyncSource({ displayed: state?.displayedCharacters, length: state?.characters?.length, filters: state?.filters });
    setChecked(reconcileDisplayedCharacters(state?.displayedCharacters, state?.characters?.length));
    if (state?.filters) setSelectedChips(state.filters);
  }
```

- [ ] **Step 8: Run the test and the suite**

Run: `npx vitest run __test__/components/AppProviderState.test.jsx && npm test`
Expected: PASS. `__test__/components/PinnedPages.test.jsx` and `nav-query-forwarding.test.jsx` import or mock this module and must stay green.

### Task 5: Remove every `noSsr` media query

**Files:**
- Modify: `components/common/NavBar/index.jsx:12,33`
- Modify: `components/common/NavBar/AppDrawer/index.jsx:25,59`
- Modify: `pages/index.jsx:61-62,98-101,131`
- Modify (mechanical): `hooks/useSidebarAd.js:9`; `components/common/NavBar/NavItemsList.jsx:21`; `components/common/NavBar/LoginDialog.jsx:25`; `components/common/QuickSearch.jsx:32-34`; `components/common/favorites/PinnedPages.jsx:36`; `components/common/Ads/GoogleAdUnit.jsx:35,36,68,108`; `components/common/DownloadButton.jsx:10`; `components/common/DashboardSettings.jsx:94`; `components/common/Tabber.jsx:23`; `components/account/Misc/Constellations.jsx:21`; `components/account/Misc/StarSigns.jsx:12`; `components/account/Worlds/World4/Breeding/Territory.jsx:14`; `components/account/Worlds/World4/LabRotation.jsx:27`; `components/account/Worlds/World6/Farming/ExoticMarketRotation.jsx:25`; `components/characters/Bags.jsx:8`; `components/statistics/BarVisualization.jsx:26`; `components/tools/active-calculator/common.jsx:7`; `pages/statistics.jsx:25-26`; `pages/leaderboards.jsx:33`; `pages/account/world-1/forge.jsx:18`; `pages/account/world-2/bubbles.jsx:58`; `pages/account/world-3/refinery.jsx:44`; `pages/tools/material-tracker.jsx:42`
- Test: `__test__/no-nossr.test.js`

**Interfaces:** none.

- [ ] **Step 1: Write the failing guard test**

`__test__/no-nossr.test.js`:

```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// useMediaQuery's noSsr option renders the real match on the first client render while the
// build rendered `false`: a hydration mismatch on every viewport where the query is true. With
// no router gate in _app, one mismatch anywhere makes React throw the server DOM away and
// re-render the whole page. Without the option MUI returns `false` on both sides and the real
// value one render later, which is a frame of the narrow layout, not a mismatch.
const ROOTS = ['components', 'pages', 'hooks'];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
};

describe('no noSsr media queries', () => {
  it('finds none under components/, pages/ and hooks/', () => {
    const hits = ROOTS.flatMap((root) => walk(path.join(process.cwd(), root)))
      .filter((file) => readFileSync(file, 'utf8').includes('noSsr'))
      .map((file) => path.relative(process.cwd(), file).replace(/\\/g, '/'));
    expect(hits).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it, expect 26 files listed**

Run: `npx vitest run __test__/no-nossr.test.js`
Expected: FAIL with the 26 file paths.

- [ ] **Step 3: Delete the dead query in `NavBar/index.jsx`**

Remove line 33 (`const isXs = useMediaQuery(...)`, never read) and drop `useMediaQuery` from the `@mui/material` import on line 12.

- [ ] **Step 4: CSS toggle for the drawer brand text**

In `components/common/NavBar/AppDrawer/index.jsx` remove line 25 (`const isXs = ...`) and the `useMediaQuery` import if nothing else in the file uses it. Replace `<span>{isXs ? 'IT' : 'Idleon Toolbox'}</span>` with:

```jsx
        {/* Two spans toggled by CSS rather than one span fed by a media query: the export and
            the first client render must agree, and CSS needs no JS to be right. */}
        <Box component={'span'} sx={{ display: { xs: 'none', sm: 'inline' } }}>Idleon Toolbox</Box>
        <Box component={'span'} sx={{ display: { xs: 'inline', sm: 'none' } }}>IT</Box>
```

(`Box` is already imported in that file.)

- [ ] **Step 5: CSS breakpoints for the home hero**

In `pages/index.jsx` remove lines 61-62 (`breakpoint`, `breakpointLg`). Add near the top of the file, after the imports:

```js
// The hero's own breakpoints, not the theme's: the two-column layout needs 1246px, and the
// extra top margin only helps on very wide screens. Media keys in sx keep the export and the
// first client render identical; a useMediaQuery here rendered `false` at build and the real
// value on the client, which is a hydration mismatch on every phone.
const WIDE = '@media (min-width: 1246px)';
const ULTRA_WIDE = '@media (min-width: 1921px)';
```

Replace:

```jsx
      <Stack mt={breakpointLg ? 5 : breakpoint ? 1 : 1} direction={'row'} flexWrap={'wrap'}
             sx={{ textAlign: breakpoint ? 'center' : 'inherit' }}
             gap={breakpoint ? 6 : 2}>
        <Stack sx={{ width: breakpoint ? '100%' : '50%' }}>
```

with:

```jsx
      <Stack direction={'row'} flexWrap={'wrap'}
             sx={{
               mt: 1, textAlign: 'center', gap: 6,
               [WIDE]: { textAlign: 'inherit', gap: 2 },
               [ULTRA_WIDE]: { mt: 5 }
             }}>
        <Stack sx={{ width: '100%', [WIDE]: { width: '50%' } }}>
```

Replace `<Box sx={{ width: breakpoint ? '100%' : 550, aspectRatio: '1200 / 674', position: 'relative' }}>` with `<Box sx={{ width: '100%', [WIDE]: { width: 550 }, aspectRatio: '1200 / 674', position: 'relative' }}>`.

Then `grep -n "breakpoint" pages/index.jsx` must print nothing; if it does, convert that usage the same way. Drop `useMediaQuery` from the `@mui/material` import if it is now unused.

- [ ] **Step 6: Mechanical removal everywhere else**

Every remaining site has the exact form `, { noSsr: true })`. Run (Git Bash, worktree root):

```bash
grep -rl "noSsr" components pages hooks | xargs sed -i 's/, { noSsr: true })/)/g'
```

Then `grep -rn "noSsr" components pages hooks` must print nothing.

- [ ] **Step 7: Run the guard test and the suite**

Run: `npx vitest run __test__/no-nossr.test.js && npm test`
Expected: PASS. `__test__/components/Tabber.test.jsx` and `QuickSearch.test.jsx` render components touched here and must stay green.

### Task 6: The three known mismatches and `useHydrated`

**Files:**
- Create: `hooks/useHydrated.js`
- Modify: `pages/index.jsx:1,60` (random hero order)
- Modify: `pages/leaderboards.jsx:51-54`
- Modify: `components/tools/builds/BuildDetail.jsx:31,115-124`
- Test: `__test__/hooks/useHydrated.test.jsx`

**Interfaces:**
- Produces: `useHydrated(): boolean` default export from `hooks/useHydrated.js`. Task 9 and future timezone/locale-dependent renders use it.

- [ ] **Step 1: Write the failing hook test**

`__test__/hooks/useHydrated.test.jsx`:

```jsx
// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render } from '@testing-library/react';
import useHydrated from '@hooks/useHydrated';

const Probe = () => <span>{String(useHydrated())}</span>;

describe('useHydrated', () => {
  it('is false in the export', () => {
    expect(renderToString(<Probe/>)).toContain('false');
  });

  it('is true once rendered on the client', () => {
    const { container } = render(<Probe/>);
    expect(container.textContent).toBe('true');
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run __test__/hooks/useHydrated.test.jsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Create `hooks/useHydrated.js`**

```js
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// false during the build and during hydration, true from the first post-hydration render. For
// anything the build machine cannot know about the visitor (timezone, locale, storage): render
// nothing until this is true, and React never sees a mismatch. Cheaper than a state-plus-effect
// pair, and it is the pattern React documents for exactly this.
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export default useHydrated;
```

- [ ] **Step 4: Run the hook test**

Run: `npx vitest run __test__/hooks/useHydrated.test.jsx`
Expected: PASS.

- [ ] **Step 5: Deterministic first hero image in `pages/index.jsx`**

Add `useEffect` to the React import on line 1. Replace `const [indexes] = useState(() => getRandomNumbersArray(6, 6));` with:

```js
  // Slot 0 is the image both the export and the first client render show, so it must not be
  // random: React compares it during hydration. Only the rotation order behind it is shuffled,
  // in an effect, once that comparison is over.
  const [indexes, setIndexes] = useState([0, 1, 2, 3, 4, 5]);
  useEffect(() => {
    setIndexes([0, ...getRandomNumbersArray(5, 5).map((n) => n + 1)]);
  }, []);
```

- [ ] **Step 6: Read the leaderboard toggle in an effect**

In `pages/leaderboards.jsx` replace lines 51-54 with:

```js
  // Read in an effect, not in the initialiser: the export renders with `true`, and a first
  // client render that read storage would disagree with it for anyone who switched it off.
  const [showAnonymous, setShowAnonymous] = useState(true);
  useEffect(() => {
    setShowAnonymous(localStorage.getItem('leaderboard:showAnonymous') !== 'false');
  }, []);
```

Ensure `useEffect` is in the file's React import.

- [ ] **Step 7: Timestamps after hydration in `BuildDetail.jsx`**

Add `import useHydrated from '@hooks/useHydrated';`. After `const formatDate = useFormatDate();` (line 31, before the `if (!build) return null;` early return so hook order is stable) add:

```js
  // The dates are formatted in the visitor's timezone, which the build machine does not share.
  // They join the page after hydration; the export carries the build without them.
  const hydrated = useHydrated();
```

Change `{createdMs && (` to `{hydrated && createdMs && (` and `{wasUpdated && <>` to `{hydrated && wasUpdated && <>`.

- [ ] **Step 8: Run the suite**

Run: `npm test`
Expected: PASS. `__test__/components/BuildView.test.jsx` renders on the client, where `useHydrated` is true, so any "Created" assertion still holds.

### Task 7: Hydration e2e gate

**Files:**
- Create: `e2e/hydration.spec.js`
- Modify: `playwright.config.js:7` (testMatch)

**Interfaces:** none. This spec passes trivially while the gate exists; Task 9 relies on it.

- [ ] **Step 1: Write the spec**

`e2e/hydration.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { waitForRender } from './wait-helpers';

// React reports a hydration mismatch as a console error (minified #418/#423/#425) and answers it
// by re-rendering the whole root client-side, which is exactly the cost the static export is
// meant to avoid. One sample per page kind, at three widths, in a timezone and locale the build
// machine does not have, in the states the export cannot know about: anonymous, demo data,
// stored preferences.

const WIDTHS = [1280, 1500, 390];
const HYDRATION_ERROR = /#418|#423|#425|hydrat/i;

const firstWikiEntityRoute = () => {
  try {
    const dir = path.join(process.cwd(), 'out', 'wiki', 'monster');
    const file = readdirSync(dir).find((f) => f.endsWith('.html'));
    return `/wiki/monster/${file.replace(/\.html$/, '')}`;
  } catch {
    return '/wiki';
  }
};

const SAMPLES = [
  { route: '/' },
  { route: '/leaderboards', seed: { 'leaderboard:showAnonymous': 'false' } },
  { route: '/tools/builds' },
  { route: '/tools/builds/wizard' },
  { route: '/wiki' },
  { route: '/wiki/monster' },
  { route: firstWikiEntityRoute() },
  { route: '/patch-notes' },
  { route: '/account/world-1/stamps?demo=true' },
  {
    route: '/characters?demo=true',
    seed: {
      filters: JSON.stringify({ Inventory: true }),
      pinnedPages: JSON.stringify([{ href: '/account/world-1/stamps', label: 'Stamps' }])
    }
  }
];

for (const width of WIDTHS) {
  for (const { route, seed } of SAMPLES) {
    test(`${route} hydrates without a mismatch at ${width}px`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        timezoneId: 'Asia/Jerusalem',
        locale: 'de-DE'
      });
      const page = await context.newPage();
      if (seed) {
        await page.addInitScript((values) => {
          for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
        }, seed);
      }
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(route);
      await waitForRender(page);

      expect(errors.filter((text) => HYDRATION_ERROR.test(text))).toEqual([]);
      await context.close();
    });
  }
}
```

Add `'hydration.spec.js'` to `testMatch` in `playwright.config.js`.

- [ ] **Step 2: Build and run it**

Run (background): `NEXT_PUBLIC_BUILDS_URL=https://builds.idleontoolbox.workers.dev/api npm run build`
Then: `npx playwright test e2e/hydration.spec.js`
Expected: 30 tests PASS. Then run the phase gate: `npx playwright test e2e/static-head.spec.js e2e/logged-out.spec.js e2e/logged-out-nav.spec.js e2e/chunk-audit.spec.js` and expect PASS.

---

## Phase 3: remove the gate

### Task 8: Real anchors in wiki listings

**Files:**
- Modify: `components/wiki/EntityList.jsx:1-2` (imports), `:68` (Band signature), `:107-148` (rows), `:150-160` (collapsed link), `:163` (EntityList signature), `:279` (Band usage)
- Modify: `pages/wiki/[kind]/index.jsx:26-33` (pass `hrefFor`)
- Test: `__test__/components/WikiEntityList.test.jsx`

**Interfaces:**
- Produces: `EntityList` accepts `hrefFor(id) => string | null`, same contract as `EntityPanel`'s existing prop. Task 9 depends on this so `CrawlLinks` can go.

- [ ] **Step 1: Write the failing test**

`__test__/components/WikiEntityList.test.jsx`:

```jsx
// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { fireEvent, render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import EntityList from '@components/wiki/EntityList';
import darkTheme from '../../styles/theme/darkTheme';

// A kind listing is how a crawler reaches every entity of that kind. The rows used to be
// buttons, with the anchors supplied separately by CrawlLinks above the router gate; now the
// rows are the anchors, including the ones a collapsed band keeps out of view.

const makeIndex = (count) => {
  const byId = {};
  const searchList = [];
  for (let i = 0; i < count; i++) {
    const id = `npc:n${i}`;
    const label = `Npc ${String(i).padStart(3, '0')}`;
    byId[id] = { kind: 'npc', rawName: `n${i}`, name: label.replace(' ', '_'), slug: `npc-${i}`, icon: null, category: 'NPC' };
    searchList.push({ id, kind: 'npc', label });
  }
  return { byId, searchList };
};

const renderList = (count, method) => {
  const index = makeIndex(count);
  const onNavigate = vi.fn();
  const ui = <ThemeProvider theme={darkTheme}>
    <EntityList
      index={index}
      kind={'npc'}
      onNavigate={onNavigate}
      onBack={() => {}}
      hrefFor={(id) => `/wiki/npc/${index.byId[id].slug}`}
    />
  </ThemeProvider>;
  return { onNavigate, output: method(ui) };
};

describe('EntityList anchors', () => {
  it('ships one real link per entity in the export, hidden rows included', () => {
    const { output: html } = renderList(150, renderToString);
    const hrefs = [...html.matchAll(/href="(\/wiki\/npc\/npc-\d+)"/g)].map((m) => m[1]);
    expect(new Set(hrefs).size).toBe(150);
  });

  // Queries come from this render's result, never from `screen`: with isolate:false the
  // testing-library module is shared between files and `screen` is bound to the first jsdom's body.
  it('routes a plain click through the app and leaves modified clicks to the browser', () => {
    const { onNavigate, output } = renderList(3, render);
    const link = output.getByRole('link', { name: 'Npc 001' });
    expect(link.getAttribute('href')).toBe('/wiki/npc/npc-1');
    fireEvent.click(link, { ctrlKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith('npc:n1');
  });
});
```

- [ ] **Step 2: Run it, expect failure**

Run: `npx vitest run __test__/components/WikiEntityList.test.jsx`
Expected: FAIL. No `href` attributes are rendered (rows are buttons), and `getByRole('link')` finds nothing.

- [ ] **Step 3: Add the shared click handler and link props to `EntityList.jsx`**

After the `BAND_COLOURS` constant add:

```js
// The rows are real anchors so the exported HTML carries every link, and so middle-click,
// copy-link and modified clicks all behave. A plain click still goes through the router, which
// keeps the session query (demo, profile) on the URL.
const linkProps = (hrefFor, id) => {
  const href = hrefFor?.(id);
  return href ? { href } : { component: 'button', type: 'button' };
};

const navigateOnPlainClick = (onNavigate, id) => (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  onNavigate(id);
};
```

- [ ] **Step 4: Thread `hrefFor` through `Band` and the rows**

Change the Band signature to `const Band = ({ band, colour, index, onNavigate, hrefFor, banner }) => {`.

Banner card: replace

```jsx
      {rows.map((entry) => (banner ? <Stack
        key={entry.id}
        component={'button'}
        type={'button'}
        onClick={() => onNavigate(entry.id)}
```

with

```jsx
      {rows.map((entry) => (banner ? <Stack
        key={entry.id}
        component={hrefFor?.(entry.id) ? 'a' : 'button'}
        {...(hrefFor?.(entry.id) ? { href: hrefFor(entry.id) } : { type: 'button' })}
        onClick={navigateOnPlainClick(onNavigate, entry.id)}
```

and add `textDecoration: 'none',` to that Stack's `sx` (an anchor underlines by default; the card must not).

Text row: replace

```jsx
        <Link
          component={'button'}
          type={'button'}
          variant={'body2'}
          underline={'hover'}
          textAlign={'left'}
          onClick={() => onNavigate(entry.id)}
        >
```

with

```jsx
        <Link
          {...linkProps(hrefFor, entry.id)}
          variant={'body2'}
          underline={'hover'}
          textAlign={'left'}
          onClick={navigateOnPlainClick(onNavigate, entry.id)}
        >
```

- [ ] **Step 5: Emit the collapsed rows as hidden anchors**

Directly after the closing `</Box>` of the rows grid (before the `{hidden > 0 ? <Link ... Show {hidden...} more` block) add:

```jsx
    {/* The rows a collapsed band hides still have to reach the export: this listing is the only
        path a crawler has to them. Text-only anchors, no icons, so a 2,400-row category does not
        request 2,400 images for a block nobody sees. Removed once the band expands. */}
    {hidden > 0 ? <Box component={'nav'} aria-hidden sx={{ display: 'none' }}>
      {band.entries.slice(rows.length).map((entry) => {
        const href = hrefFor?.(entry.id);
        return href ? <a key={entry.id} href={href}>{entry.label}</a> : null;
      })}
    </Box> : null}
```

- [ ] **Step 6: Accept and pass the prop**

Change `const EntityList = ({ index, kind, onNavigate, onBack }) => {` to `const EntityList = ({ index, kind, onNavigate, onBack, hrefFor }) => {` and add `hrefFor={hrefFor}` to the `<Band` element at `:279`.

In `pages/wiki/[kind]/index.jsx` add to the `<EntityList` element:

```jsx
        hrefFor={(id) => {
          const node = index.byId[id];
          return node?.slug ? `/wiki/${node.kind}/${node.slug}` : null;
        }}
```

- [ ] **Step 7: Run the test and the suite**

Run: `npx vitest run __test__/components/WikiEntityList.test.jsx && npm test`
Expected: PASS. `WikiEntityPanel.test.jsx` and `wiki-search-index.test.js` must stay green.

### Task 9: Delete the gate

**Files:**
- Modify: `pages/_app.jsx:12-14` (imports), `:90-97` (Head comment), `:190-200` and `:260` (gate elements)
- Delete: `components/common/WaitForRouter.jsx`, `components/common/PreHydrationLoader.jsx`, `components/common/CrawlLinks.jsx`, `__test__/components/CrawlLinks.test.jsx`, `__test__/components/PreHydrationLoader.test.jsx`
- Modify: `pages/wiki/[kind]/index.jsx:96-97`, `pages/wiki/[kind]/[slug].jsx:60-70,74-75`, `pages/wiki/changelog.jsx:84-89`, `pages/tools/builds/[slug].jsx:88-120`, `utility/builds/build-pages.mjs:57` (crawl links)
- Modify (comments only): `pages/_document.jsx:11`, `components/common/PageTitle.jsx:19-22`, `components/common/context/PageLoadingProvider.jsx:30-31`, `pages/tools/builds/view.jsx:24-26`, `components/tools/builds/BuildCard.jsx:29`, `utility/seo-head.mjs:5`, `utility/generate-page-seo.mjs:3`
- Modify: `e2e/static-head.spec.js` (og:title + robots counts), `CLAUDE.md:110-149`

**Interfaces:**
- Consumes: Task 8 (`EntityList` anchors), Task 7 (`hydration.spec.js`).

- [ ] **Step 1: Remove the gate from `_app.jsx`**

Delete the three imports (`WaitForRouter`, `CrawlLinks`, `PreHydrationLoader`). Delete the `<CrawlLinks .../>` element and its comment, the `<PreHydrationLoader/>` element and its comment, and the `<WaitForRouter>` / `</WaitForRouter>` pair (keep everything between them, dedent by one level).

Replace the `<Head>` comment block that begins `{/* Nothing below <WaitForRouter> renders during the static export` with:

```jsx
        {/* Title, description and canonical are declared here as well as in each page's
            <NextSeo>: a data page renders DataLoadingWrapper's loader at build time, so its
            NextSeo never runs during the export, and during hydration the title used to blank
            for a second before NextSeo restored it. next/head dedupes the two copies by key, and
            NextSeo's wins once it renders.

            The description has to live in next/head rather than _document: a tag _document
            writes is outside next/head's control, so it cannot be deduped against NextSeo's
            copy - every page carried two, and _document's froze at the landing page and went
            stale on every client-side navigation after it. */}
```

- [ ] **Step 2: Delete the components and their tests**

```bash
rm components/common/WaitForRouter.jsx components/common/PreHydrationLoader.jsx components/common/CrawlLinks.jsx __test__/components/CrawlLinks.test.jsx __test__/components/PreHydrationLoader.test.jsx
```

- [ ] **Step 3: Drop the crawl-link props**

- `pages/wiki/[kind]/index.jsx`: delete the `crawlLinks` and `crawlHeading` keys from the returned `props`.
- `pages/wiki/[kind]/[slug].jsx`: delete the `crawlLinks` computation (the block beginning with the comment `// Nothing below <WaitForRouter> reaches the export, so this list is the only trace`) and the two keys from `props`.
- `pages/wiki/changelog.jsx`: delete the `crawlLinks` and `crawlHeading` keys and the comment above them.
- `pages/tools/builds/[slug].jsx`: delete both `crawlLinks` keys (`:91`, `:117`) with their comments, and any `crawlHeading` key. Then `grep -n "crawl" utility/builds/build-pages.mjs pages/tools/builds/*.jsx`: if a helper in `build-pages.mjs` is now unused, delete it and its comment at `:57`.
- `grep -rn "crawlLinks\|crawlHeading\|CrawlLinks\|PreHydrationLoader\|WaitForRouter" --include=*.js --include=*.jsx --include=*.mjs --include=*.md components pages hooks utility __test__ e2e CLAUDE.md` must list only comments you rewrite in the next step, and `CLAUDE.md`.

- [ ] **Step 4: Rewrite the gate-era comments**

Each comment names the gate as the reason a page's own markup never reached the export. Rewrite each so it is true now:

- `pages/_document.jsx:11`: the head tags come from `_app`'s `<Head>` so they can be deduped against NextSeo; say that, without the gate.
- `components/common/PageTitle.jsx:19-22` (above `PAGE_H1_SX`): replace with `// One size for the page h1 wherever it is drawn, in NavBar or by a page with its own heading.`
- `components/common/context/PageLoadingProvider.jsx:30-31`: replace the second sentence with `React 19 does not warn about useLayoutEffect during a server render, and the initial state is false on both sides, so there is no mismatch.`
- `pages/tools/builds/view.jsx:24-26`: the page's NextSeo cannot know the `?id=` at build, which is why the OVERRIDES fallback exists; remove the gate as the reason.
- `components/tools/builds/BuildCard.jsx:29`: the hub renders every build as a `next/link` anchor, which is what a crawler reads now; remove the CrawlLinks reference.
- `utility/seo-head.mjs:5` and `utility/generate-page-seo.mjs:3`: `PAGE_SEO` exists because data pages render a loader at build (their NextSeo never runs) and because the title must not blank during hydration; remove the gate as the reason.
- `firebase/index.js`, `EntityList.jsx`: already accurate after Tasks 1 and 8.

- [ ] **Step 5: Count og:title and robots in `e2e/static-head.spec.js`**

In the first `test.describe('static export ships crawlable head tags'` test, after the description count, add:

```js
      // og:title and robots gained a build-time writer when the router gate went: DefaultSeo and
      // the page's NextSeo both render in the export now, and next/head must collapse them.
      const ogTitles = (html.match(/<meta property="og:title"/g) || []).length;
      expect(ogTitles, `${route} must have exactly one og:title`).toBe(1);
      const robots = (html.match(/<meta name="robots"/g) || []).length;
      expect(robots, `${route} must have exactly one robots tag`).toBe(1);
```

In the `head tags are not duplicated after hydration on ${route}` test add:

```js
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
```

- [ ] **Step 6: Update `CLAUDE.md`**

In "Page titles and descriptions", replace `all come from `_app`'s `<Head>`, above the `<WaitForRouter>` gate — nothing below it runs at build time.` with `all come from `_app`'s `<Head>` as well as each page's `<NextSeo>`: a data page renders a loader at build, so its NextSeo never runs in the export, and the title must not blank during hydration.`

In "Static export gotchas", replace the two bullets **Nothing below `<WaitForRouter>` reaches the export** and **The pre-hydration shell is a spinner only** with:

```markdown
- **Everything renders at build time.** There is no router gate: the export is the real page,
  with `AppProvider` at `DEFAULT_STATE` (`isLoading: true`, no account, storage not yet merged).
  Data pages therefore export `DataLoadingWrapper`'s loader; static pages export their body.
  A page that throws under `DEFAULT_STATE` fails `next build`, which is the intended alarm.
- **The first render must be identical on the build machine and the client.** No `localStorage`,
  `typeof window`, `Date`, `Math.random` or timezone/locale formatting in render or in a
  `useState` initialiser; read those in an effect, or gate the markup on `useHydrated()`
  (`hooks/useHydrated.js`). No `useMediaQuery(..., { noSsr: true })`: `__test__/no-nossr.test.js`
  fails on any. One mismatch anywhere makes React discard the server DOM for the whole page.
  `e2e/hydration.spec.js` is the gate: sample routes, three widths, foreign timezone and locale,
  seeded storage, zero React #418/#423/#425.
- **Links must be real anchors to reach a crawler.** A `<Link component="button">` ships no
  `href`. Wiki listings render anchors for every row, including the ones a collapsed band hides.
- **Firebase and game data load on demand.** `firebase/lazy.js` is the only importer of
  `firebase/index.js`; `authHint` in localStorage lets a known-anonymous visitor skip it. Pure
  helpers the wiki needs live in data-free modules (`parsers/cardMath.ts`, `parsers/powerTypes.ts`),
  never next to a `@website-data` import. `e2e/chunk-audit.spec.js` is the gate.
```

- [ ] **Step 7: Unit suite and lint**

Run: `npm test && npm run lint`
Expected: PASS, clean.

- [ ] **Step 8: Build, then the full e2e gate**

Run (background): `NEXT_PUBLIC_BUILDS_URL=https://builds.idleontoolbox.workers.dev/api npm run build`
Expected: the build succeeds with no prerender error. If a page fails to prerender, the error names it; fix the component to tolerate `DEFAULT_STATE` (optional chaining on `state.account`/`state.characters`), never by reintroducing a gate.

Then: `npm run test:e2e:nobuild`
Expected: PASS across every spec, including `hydration.spec.js` (now meaningful), `static-head.spec.js` with the new counts, `builds-static-pages.spec.js`, `chunk-audit.spec.js`.

- [ ] **Step 9: Confirm the export carries body text and record sizes**

```bash
f=out/wiki/monster/$(ls out/wiki/monster | head -1); echo "$f"; grep -c "<h1\|<h2\|<table" "$f"; du -sb out | cut -f1; stat -c %s out/index.html "$f"
for r in index.html wiki/monster/$(ls out/wiki/monster | head -1); do t=0; for c in $(grep -o '/_next/static/chunks/[^"]*\.js' "out/$r"); do t=$((t + $(stat -c %s "out$c"))); done; echo "$r: $((t/1024)) KB JS"; done
```

Expected: the wiki entity page has headings and a table in its raw HTML. Record total `out/` bytes, the two HTML sizes and the two JS totals under "Results" below, next to the phase 1 numbers.

- [ ] **Step 10: Real-browser check of what e2e cannot cover**

With `npx serve out -l 3002` running, use the Playwright MCP (not the in-app Browser pane) to load `/?profile=<any public profile name>` with `localStorage.authHint` absent and confirm the page shows the profile and no hydration error in the console. Signed-in verification needs the user's credentials: note it as pending for the user in the final report.

---

## Results

Filled in by the executor.

| measure | baseline (2026-09-08, before) | after phase 1 | after phase 3 |
|---|---|---|---|
| JS referenced by `/` | ~1,700 KB | | |
| JS referenced by one wiki entity page | ~3,800 KB | | |
| `out/index.html` bytes | 6,282 | | |
| wiki entity HTML bytes | ~10,000 | | |
| total `out/` bytes | | | |
| pages with body text in export | 0 | 0 | |
