# Discord Bot Phase 1 (`/wiki` + `/build`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Idleon Toolbox Discord bot with `/wiki` and `/build`, both with autocomplete, as a Cloudflare Worker over HTTP interactions.

**Architecture:** The site's entity-graph build gains a second output, `data/bot-wiki-index.json`. A new repo, `it-cloudflare-bot`, bundles a copy of that file plus a class list, verifies Discord's Ed25519 signature, answers PING, autocomplete and the two commands with Components V2 messages. `/wiki` answers directly from the bundled index; `/build` defers, calls the builds API and edits the original response.

**Tech Stack:** Cloudflare Workers (TypeScript, Wrangler 4), Vitest 3 with `@cloudflare/vitest-pool-workers`, WebCrypto Ed25519, Discord API v10. Site side: Node ESM scripts, Vitest.

**Spec:** `IdleonToolbox/docs/superpowers/specs/2026-10-01-discord-bot-design.md`

## Global Constraints

- Every link: `utm_source=discord_bot&utm_medium=<command>&utm_content=<target>`; site origin `https://idleontoolbox.com`.
- Funnel rule: no tables, drop chances, recipes or stat blocks in replies; every reply has at least one link button.
- Replies are Components V2 (`flags: 1 << 15` = 32768); errors are ephemeral (`flags: 64`) one-liners.
- Accent colours: wiki `0x7F77DD`, build `0xD85A30`.
- Autocomplete: max 25 choices, choice name max 100 characters.
- `/build` never calls the build detail endpoint (it bumps `viewCount`); build links use `/tools/builds/view?id=<shortId>`.
- Upstream calls time out after 5 seconds.
- No build count in `/build` (decided 2026-10-02).
- One Discord application ("Idleon Toolbox"); commands registered to the test server while developing.
- No commit steps: the user commits when they choose. No em dashes in user-facing copy.

## File Structure

Site (`C:\Dev\idleon\toolbox\IdleonToolbox`):

| File | Responsibility |
|---|---|
| `utility/wiki/kind-labels.mjs` (new) | `KIND_LABELS`, `KIND_PLURALS`, data-free, importable by Node scripts and components |
| `components/wiki/EntityPanel.jsx` (modify) | re-export the two maps from the new module instead of defining them |
| `scripts/entity-graph/bot-index.mjs` (new) | pure `buildBotIndex(nodes, edges)` |
| `scripts/entity-graph/build.mjs` (modify) | call `buildBotIndex`, write `data/bot-wiki-index.json` |
| `__test__/entity-graph/bot-index.test.js` (new) | unit tests on a fixture graph |
| `__test__/bot-wiki-index.test.js` (new) | checks the generated file |

Bot (`C:\Dev\idleon\toolbox\it-cloudflare-bot`, new repo):

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `wrangler.toml`, `vitest.config.ts`, `.gitignore`, `.dev.vars.example` | scaffold |
| `src/index.ts` | Worker entry, routes `POST /interactions` |
| `src/types.ts` | `Env`, interaction and component types |
| `src/verify.ts` | Ed25519 signature check |
| `src/interactions.ts` | dispatch: PING, autocomplete, commands |
| `src/v2.ts` | Components V2 builders, `siteUrl`, `escapeMarkdown` |
| `src/discord.ts` | edit / delete original response, ephemeral follow-up |
| `src/replies.ts` | shared ephemeral error replies |
| `src/wiki.ts` | wiki search, autocomplete choices, `/wiki` message |
| `src/build.ts` | class search, builds API client, `/build` message and handler |
| `src/commands.mjs` | command definitions (shared with the register script) |
| `data/bot-wiki-index.json`, `data/classes.json` | bundled data, refreshed by the sync script |
| `scripts/sync-data.mjs` | copy wiki index and derive class list from the site repo |
| `scripts/register-commands.mjs` | PUT commands to the test server or globally |
| `test/helpers.ts`, `test/*.test.ts` | tests |

---

### Task 1: Shared kind labels module (site)

**Files:**
- Create: `IdleonToolbox/utility/wiki/kind-labels.mjs`
- Modify: `IdleonToolbox/components/wiki/EntityPanel.jsx:24-93` (the two map literals)
- Test: `IdleonToolbox/__test__/entity-graph/kind-labels.test.js`

**Interfaces:**
- Produces: `KIND_LABELS: Record<string, string>`, `KIND_PLURALS: Record<string, string>` exported from `@utility/wiki/kind-labels.mjs`; `EntityPanel.jsx` keeps exporting both names, so its seven importers are unchanged.

- [ ] **Step 1: Write the failing test**

```js
// __test__/entity-graph/kind-labels.test.js
import { describe, expect, it } from 'vitest';
import { KIND_LABELS, KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import * as panel from '@components/wiki/EntityPanel';

describe('kind labels module', () => {
  it('labels every kind the graph emits', () => {
    for (const kind of ['item', 'monster', 'npc', 'quest', 'talent', 'chip', 'jade', 'map', 'spice', 'station']) {
      expect(typeof KIND_LABELS[kind]).toBe('string');
      expect(typeof KIND_PLURALS[kind]).toBe('string');
    }
    expect(KIND_LABELS.chip).toBe('Lab Chip');
    expect(KIND_PLURALS.npc).toBe('NPCs');
  });

  it('EntityPanel re-exports the same objects', () => {
    expect(panel.KIND_LABELS).toBe(KIND_LABELS);
    expect(panel.KIND_PLURALS).toBe(KIND_PLURALS);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (in `IdleonToolbox`): `npx vitest run __test__/entity-graph/kind-labels.test.js`
Expected: FAIL, cannot resolve `@utility/wiki/kind-labels.mjs`.

- [ ] **Step 3: Create the module**

Move the two object literals out of `EntityPanel.jsx` verbatim (lines 24-93 today, including the "NPC pluralises without an s" comment above `KIND_PLURALS`) into `utility/wiki/kind-labels.mjs`:

```js
// Display names per wiki kind. Data-free so Node scripts (the entity-graph build) can import it
// without pulling MUI or React into the build graph.
export const KIND_LABELS = {
  item: 'Item',
  // ...the 32 entries exactly as they were in EntityPanel.jsx
};

// NPC pluralises without an s on the label itself, so this cannot be derived from KIND_LABELS.
export const KIND_PLURALS = {
  item: 'Items',
  // ...the 32 entries exactly as they were in EntityPanel.jsx
};
```

In `EntityPanel.jsx`, delete both literals and add next to the existing `export { entityName };`:

```js
import { KIND_LABELS, KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';

export { entityName, KIND_LABELS, KIND_PLURALS };
```

(Replace the existing `export { entityName };` line rather than adding a second export statement; keep the import with the other imports at the top.)

- [ ] **Step 4: Run the test and the wiki tests**

Run: `npx vitest run __test__/entity-graph`
Expected: PASS, including every pre-existing wiki test.

---

### Task 2: Bot wiki index in the entity-graph build (site)

**Files:**
- Create: `IdleonToolbox/scripts/entity-graph/bot-index.mjs`
- Modify: `IdleonToolbox/scripts/entity-graph/build.mjs` (after the search index write, line ~381)
- Test: `IdleonToolbox/__test__/entity-graph/bot-index.test.js`, `IdleonToolbox/__test__/bot-wiki-index.test.js`

**Interfaces:**
- Consumes: `KIND_LABELS` (Task 1), `LISTED_KINDS` from `utility/wiki/kinds.mjs`.
- Produces: `buildBotIndex(nodes: Record<string, Node>, edges: Edge[]): BotWikiEntry[]` and the file `data/bot-wiki-index.json`, an array of:

```ts
interface BotWikiEntry {
  id: string;            // "item:FoodG1"
  kind: string;          // "item"
  kindLabel: string;     // "Item"
  label: string;         // "Golden Jam"
  slug: string;          // "golden-jam"
  icon: string | null;   // "/data/FoodG1.png"
  category: string | null;     // "Golden food", null when it repeats the kind label
  description: string | null;  // first sentence, max 200 chars, null for templates
  sources: { label: string; count: number }[];  // "where you get it", fixed order
  obtainedFrom: string | null;
  listed: boolean;       // kind has a /wiki/<kind> listing page
}
```

- [ ] **Step 1: Write the failing unit test**

```js
// __test__/entity-graph/bot-index.test.js
import { describe, expect, it } from 'vitest';
import { buildBotIndex, humaniseCategory, shortDescription } from '../../scripts/entity-graph/bot-index.mjs';

const nodes = {
  'item:FoodG2': { kind: 'item', rawName: 'FoodG2', name: 'Golden_Jam', slug: 'golden-jam', icon: '/data/FoodG2.png', category: 'GOLDEN_FOOD', description: 'Increases your Max Health by 30%. Golden foods are never consumed.' },
  'item:Copper': { kind: 'item', rawName: 'Copper', name: 'Copper_Ore', slug: 'copper-ore', icon: '/data/Copper.png', category: 'ORE', description: 'Smelt_down_2_Ores into 1 Bar.' },
  'item:CopperBar': { kind: 'item', rawName: 'CopperBar', name: 'Copper_Bar', slug: 'copper-bar', icon: null, category: 'Bits' },
  'item:Dungeonite': { kind: 'item', rawName: 'Dungeonite', name: 'Dungeonite', slug: 'dungeonite', icon: null, obtainedFrom: 'Dungeons' },
  'item:Hidden': { kind: 'item', rawName: 'Hidden', name: 'Hidden', slug: 'hidden', navigable: false },
  'monster:chestG': { kind: 'monster', rawName: 'chestG', name: 'Golden_Chest', slug: 'golden-chest', icon: null, category: 'Monster' },
  'quest:Q1': { kind: 'quest', rawName: 'Q1', name: 'Quest_One', slug: 'quest-one' },
  'quest:Q2': { kind: 'quest', rawName: 'Q2', name: 'Quest_Two', slug: 'quest-two' },
  'talent:T1': { kind: 'talent', rawName: 'T1', name: 'Some_Talent', slug: 'some-talent', description: 'Gives {% damage' }
};
const edges = [
  { from: 'monster:chestG', to: 'item:FoodG2', rel: 'drops' },
  { from: 'quest:Q1', to: 'item:FoodG2', rel: 'rewards' },
  { from: 'quest:Q2', to: 'item:FoodG2', rel: 'rewards' },
  { from: 'quest:Q2', to: 'item:FoodG2', rel: 'rewards' },
  { from: 'item:CopperBar', to: 'item:Copper', rel: 'craftedFrom' },
  { from: 'monster:chestG', to: 'item:Copper', rel: 'hosts' }
];

describe('buildBotIndex', () => {
  const index = buildBotIndex(nodes, edges);
  const byId = Object.fromEntries(index.map((entry) => [entry.id, entry]));

  it('skips nodes that are not navigable or have no slug', () => {
    expect(byId['item:Hidden']).toBeUndefined();
  });

  it('builds the Golden Jam entry', () => {
    expect(byId['item:FoodG2']).toEqual({
      id: 'item:FoodG2', kind: 'item', kindLabel: 'Item', label: 'Golden Jam', slug: 'golden-jam',
      icon: '/data/FoodG2.png', category: 'Golden food',
      description: 'Increases your Max Health by 30%.',
      sources: [{ label: 'Dropped by', count: 1 }, { label: 'Reward from', count: 2 }],
      obtainedFrom: null, listed: true
    });
  });

  it('counts craftedFrom on the product side, ignores non-source relations', () => {
    expect(byId['item:CopperBar'].sources).toEqual([{ label: 'Crafted from', count: 1 }]);
    expect(byId['item:Copper'].sources).toEqual([]);
  });

  it('keeps obtainedFrom, drops template descriptions and kind-repeating categories', () => {
    expect(byId['item:Dungeonite'].obtainedFrom).toBe('Dungeons');
    expect(byId['talent:T1'].description).toBeNull();
    expect(byId['monster:chestG'].category).toBeNull();
    expect(byId['quest:Q1'].listed).toBe(false);
  });
});

describe('helpers', () => {
  it('humaniseCategory', () => {
    expect(humaniseCategory('GOLDEN_FOOD')).toBe('Golden food');
    expect(humaniseCategory('Bits')).toBe('Bits');
    expect(humaniseCategory(undefined)).toBeNull();
  });

  it('shortDescription cleans underscores, keeps the first sentence, caps at 200', () => {
    expect(shortDescription('Smelt_down_2_Ores into 1 Bar.')).toBe('Smelt down 2 Ores into 1 Bar.');
    expect(shortDescription('x'.repeat(250))).toBe(`${'x'.repeat(199)}…`);
    expect(shortDescription('Has a {template}')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run __test__/entity-graph/bot-index.test.js`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `bot-index.mjs`**

```js
// scripts/entity-graph/bot-index.mjs
// The Discord bot's copy of the wiki: one entry per navigable node with just enough to answer
// "what is this and where does it come from" without the full graph. Written next to the site's
// search index; the bot repo copies it at deploy time.
import { KIND_LABELS } from '../../utility/wiki/kind-labels.mjs';
import { LISTED_KINDS } from '../../utility/wiki/kinds.mjs';

// Same relations build.mjs uses to decide an item has a source, in the order the wiki shows them.
// `side` is which end of the edge the entry sits on; counts are distinct nodes on the other end.
const SOURCE_RELATIONS = [
  { rel: 'drops', side: 'to', label: 'Dropped by' },
  { rel: 'gathers', side: 'to', label: 'Gathered from' },
  { rel: 'craftedFrom', side: 'from', label: 'Crafted from' },
  { rel: 'refinedFrom', side: 'from', label: 'Refined from' },
  { rel: 'rewards', side: 'to', label: 'Reward from' },
  { rel: 'sells', side: 'to', label: 'Sold by' },
  { rel: 'produces', side: 'to', label: 'Produced at' },
  { rel: 'yields', side: 'to', label: 'Obtained from' },
  { rel: 'harvests', side: 'to', label: 'Caught in' }
];

export const humaniseCategory = (category) => {
  if (!category) return null;
  const spaced = category.replace(/_/g, ' ').trim();
  if (spaced !== spaced.toUpperCase()) return spaced;
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

// The wiki hides template descriptions (a `{` waiting to be filled in); so does the bot.
export const shortDescription = (description) => {
  if (!description || description.includes('{')) return null;
  const clean = description.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  const sentence = clean.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? clean;
  return sentence.length > 200 ? `${sentence.slice(0, 199)}…` : sentence;
};

export const buildBotIndex = (nodes, edges) => {
  const counts = new Map();
  for (const edge of edges) {
    const relation = SOURCE_RELATIONS.find((entry) => entry.rel === edge.rel);
    if (!relation) continue;
    const self = relation.side === 'to' ? edge.to : edge.from;
    const other = relation.side === 'to' ? edge.from : edge.to;
    const key = `${self}|${relation.rel}`;
    if (!counts.has(key)) counts.set(key, new Set());
    counts.get(key).add(other);
  }

  return Object.entries(nodes)
    .filter(([, node]) => node.navigable !== false && node.slug)
    .map(([id, node]) => {
      const kindLabel = KIND_LABELS[node.kind] ?? node.kind;
      const category = humaniseCategory(node.category);
      const isTemplate = node.kind === 'talent' || node.stamp || node.effect;
      return {
        id,
        kind: node.kind,
        kindLabel,
        label: (node.name || node.rawName).replace(/_/g, ' '),
        slug: node.slug,
        icon: node.icon ?? null,
        category: category && category.toLowerCase() !== kindLabel.toLowerCase() ? category : null,
        description: isTemplate ? null : shortDescription(node.description),
        sources: SOURCE_RELATIONS
          .map(({ rel, label }) => ({ label, count: counts.get(`${id}|${rel}`)?.size ?? 0 }))
          .filter(({ count }) => count > 0),
        obtainedFrom: node.obtainedFrom ?? null,
        listed: LISTED_KINDS.includes(node.kind)
      };
    });
};
```

- [ ] **Step 4: Run the unit test**

Run: `npx vitest run __test__/entity-graph/bot-index.test.js`
Expected: PASS.

- [ ] **Step 5: Wire it into `build.mjs`**

Add to the imports at the top of `scripts/entity-graph/build.mjs`:

```js
import { buildBotIndex } from './bot-index.mjs';
```

After the two lines that write and log `wiki-search-index.json` (line ~380-381):

```js
// The Discord bot's index: the search index plus what a one-message answer needs.
const botIndex = buildBotIndex(nodes, edges);
fs.writeFileSync(path.join(dataDir, 'bot-wiki-index.json'), JSON.stringify(botIndex));
console.log(`[entity-graph] bot wiki index: ${botIndex.length} entries`);
```

- [ ] **Step 6: Write the generated-file test**

```js
// __test__/bot-wiki-index.test.js
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const indexPath = path.join(__dirname, '..', 'data', 'bot-wiki-index.json');
const searchPath = path.join(__dirname, '..', 'data', 'wiki-search-index.json');

describe('bot wiki index', () => {
  const entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  it('has one entry per search index entry', () => {
    const search = JSON.parse(fs.readFileSync(searchPath, 'utf-8'));
    expect(entries.length).toBe(search.length);
  });

  it('contains Golden Jam with its sources', () => {
    const jam = entries.find((entry) => entry.id === 'item:FoodG1');
    expect(jam).toMatchObject({ label: 'Golden Jam', kindLabel: 'Item', slug: 'golden-jam', listed: true });
    expect(jam.sources.find((source) => source.label === 'Dropped by')?.count).toBeGreaterThan(0);
  });

  it('stays small enough to bundle', () => {
    expect(fs.statSync(indexPath).size).toBeLessThan(3_000_000);
  });
});
```

- [ ] **Step 7: Regenerate and run**

Run: `npm run build:graph` then `npx vitest run __test__/bot-wiki-index.test.js __test__/wiki-search-index.test.js __test__/entity-graph`
Expected: the build logs `bot wiki index: <n> entries` with the same n as the search index; all tests PASS.

---

### Task 3: Bot repo scaffold, signature check, PING

**Files:**
- Create: `it-cloudflare-bot/package.json`, `tsconfig.json`, `wrangler.toml`, `vitest.config.ts`, `.gitignore`, `.dev.vars.example`, `src/index.ts`, `src/types.ts`, `src/verify.ts`, `src/interactions.ts`, `test/helpers.ts`, `test/verify.test.ts`, `test/interactions.test.ts`

**Interfaces:**
- Produces:
  - `verifyDiscordRequest(publicKeyHex: string, signatureHex: string, timestamp: string, body: string): Promise<boolean>`
  - `handleInteraction(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>` (Tasks 5 and 6 add command branches)
  - `json(body: unknown, init?: ResponseInit): Response`
  - `Env { DISCORD_PUBLIC_KEY: string; DISCORD_APPLICATION_ID: string; SITE_URL: string; BUILDS_API: string }`
  - test helpers `makeKeys()`, `signedRequest(keys, body)`

- [ ] **Step 1: Scaffold files**

`package.json`:

```json
{
  "name": "it-cloudflare-bot",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "npm run sync && wrangler deploy",
    "test": "vitest run",
    "sync": "node scripts/sync-data.mjs",
    "register": "node scripts/register-commands.mjs"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.8.0",
    "@cloudflare/workers-types": "^5.20260817.1",
    "typescript": "^5.6.0",
    "vitest": "^3.0.0",
    "wrangler": "^4.30.0"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowJs": true,
    "resolveJsonModule": true,
    "types": ["@cloudflare/workers-types", "@cloudflare/vitest-pool-workers"]
  },
  "include": ["src", "test", "data"]
}
```

`wrangler.toml` (the application id and public key are not secrets):

```toml
name = "bot"
main = "src/index.ts"
compatibility_date = "2026-08-01"

[vars]
SITE_URL = "https://idleontoolbox.com"
BUILDS_API = "https://builds.idleontoolbox.workers.dev/api"
DISCORD_APPLICATION_ID = "1555351103812673546"
DISCORD_PUBLIC_KEY = "8f6d2508e42ae7187163bd30ae0e5e9bba25c19a62ab885dc6fc410b839539db"

[observability.logs]
enabled = true
```

`vitest.config.ts`:

```ts
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: { bindings: { DISCORD_APPLICATION_ID: 'app1', DISCORD_PUBLIC_KEY: 'replaced-per-test' } }
      }
    }
  }
});
```

`.gitignore`:

```
node_modules
.wrangler
.dev.vars
```

`.dev.vars.example` (used only by `scripts/register-commands.mjs`, never by the Worker):

```
DISCORD_APPLICATION_ID=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
```

Then run `npm install`.

- [ ] **Step 2: Types**

```ts
// src/types.ts
export interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  SITE_URL: string;
  BUILDS_API: string;
}

export const InteractionType = { Ping: 1, Command: 2, Autocomplete: 4 } as const;
export const ResponseType = { Pong: 1, Message: 4, Deferred: 5, Choices: 8 } as const;
export const MessageFlags = { Ephemeral: 64, ComponentsV2: 32768 } as const;

export interface CommandOption {
  name: string;
  type: number;
  value?: string;
  focused?: boolean;
}

export interface Interaction {
  type: number;
  token: string;
  application_id: string;
  data?: { name: string; options?: CommandOption[] };
}

export type Component = Record<string, unknown>;

export interface MessageBody {
  flags?: number;
  content?: string;
  components?: Component[];
}
```

- [ ] **Step 3: Write the failing tests**

```ts
// test/helpers.ts
export const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

export interface Keys { pair: CryptoKeyPair; publicKeyHex: string }

export async function makeKeys(): Promise<Keys> {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const raw = new Uint8Array((await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer);
  return { pair, publicKeyHex: toHex(raw) };
}

export async function signedRequest(keys: Keys, body: unknown): Promise<Request> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const text = JSON.stringify(body);
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', keys.pair.privateKey, new TextEncoder().encode(timestamp + text)));
  return new Request('https://bot.test/interactions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-signature-ed25519': toHex(signature), 'x-signature-timestamp': timestamp },
    body: text
  });
}
```

```ts
// test/verify.test.ts
import { describe, expect, it } from 'vitest';
import { verifyDiscordRequest } from '../src/verify';
import { makeKeys, toHex } from './helpers';

describe('verifyDiscordRequest', () => {
  it('accepts a valid signature and rejects a tampered body', async () => {
    const keys = await makeKeys();
    const sig = toHex(new Uint8Array(await crypto.subtle.sign('Ed25519', keys.pair.privateKey, new TextEncoder().encode('123{"a":1}'))));
    expect(await verifyDiscordRequest(keys.publicKeyHex, sig, '123', '{"a":1}')).toBe(true);
    expect(await verifyDiscordRequest(keys.publicKeyHex, sig, '123', '{"a":2}')).toBe(false);
  });

  it('rejects malformed hex instead of throwing', async () => {
    const keys = await makeKeys();
    expect(await verifyDiscordRequest(keys.publicKeyHex, 'zz', '1', '{}')).toBe(false);
  });
});
```

```ts
// test/interactions.test.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import worker from '../src/index';
import { makeKeys, signedRequest } from './helpers';

describe('interactions endpoint', () => {
  it('answers PING with PONG', async () => {
    const keys = await makeKeys();
    const ctx = createExecutionContext();
    const res = await worker.fetch(await signedRequest(keys, { type: 1 }), { ...env, DISCORD_PUBLIC_KEY: keys.publicKeyHex }, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ type: 1 });
  });

  it('rejects a bad signature with 401', async () => {
    const keys = await makeKeys();
    const other = await makeKeys();
    const res = await worker.fetch(await signedRequest(other, { type: 1 }), { ...env, DISCORD_PUBLIC_KEY: keys.publicKeyHex }, createExecutionContext());
    expect(res.status).toBe(401);
  });

  it('404s anything but POST /interactions', async () => {
    const res = await worker.fetch(new Request('https://bot.test/'), env, createExecutionContext());
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 4: Run to verify they fail**

Run (in `it-cloudflare-bot`): `npx vitest run`
Expected: FAIL, `../src/verify` and `../src/index` not found.

- [ ] **Step 5: Implement**

```ts
// src/verify.ts
const fromHex = (hex: string): Uint8Array | null => {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
  return new Uint8Array(hex.match(/../g)!.map((byte) => parseInt(byte, 16)));
};

export async function verifyDiscordRequest(publicKeyHex: string, signatureHex: string, timestamp: string, body: string): Promise<boolean> {
  const keyBytes = fromHex(publicKeyHex);
  const signature = fromHex(signatureHex);
  if (!keyBytes || !signature) return false;
  try {
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, signature, new TextEncoder().encode(timestamp + body));
  } catch {
    return false;
  }
}
```

```ts
// src/interactions.ts
import { verifyDiscordRequest } from './verify';
import { InteractionType, ResponseType, type Env, type Interaction } from './types';

export const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json' } });

export async function handleInteraction(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = await request.text();
  const ok = await verifyDiscordRequest(
    env.DISCORD_PUBLIC_KEY,
    request.headers.get('x-signature-ed25519') ?? '',
    request.headers.get('x-signature-timestamp') ?? '',
    body
  );
  if (!ok) return new Response('invalid request signature', { status: 401 });

  const interaction = JSON.parse(body) as Interaction;
  if (interaction.type === InteractionType.Ping) return json({ type: ResponseType.Pong });

  return json({ error: 'unknown interaction' }, { status: 400 });
}
```

```ts
// src/index.ts
import { handleInteraction } from './interactions';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/interactions') return handleInteraction(request, env, ctx);
    return new Response('Not found', { status: 404 });
  }
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 6: Run to verify they pass**

Run: `npx vitest run`
Expected: PASS (5 tests). Also `npx tsc` reports no errors.

---

### Task 4: Components V2 builders, links, Discord REST helpers

**Files:**
- Create: `it-cloudflare-bot/src/v2.ts`, `src/discord.ts`, `src/replies.ts`, `test/v2.test.ts`

**Interfaces:**
- Consumes: `Component`, `MessageBody`, `MessageFlags`, `ResponseType`, `Env` (Task 3).
- Produces:
  - `siteUrl(env: Env, path: string, medium: string, content: string): string`
  - `escapeMarkdown(text: string): string`
  - `container(accent: number, children: Component[]): Component`
  - `text(content: string): Component`, `separator(large?: boolean): Component`
  - `section(content: string, thumbnailUrl: string): Component`
  - `actionRow(buttons: Component[]): Component`, `linkButton(label: string, url: string): Component`
  - `v2Message(components: Component[]): MessageBody`
  - `ephemeral(content: string, button?: { label: string; url: string }): MessageBody`
  - `editOriginal(env: Env, token: string, body: MessageBody): Promise<void>`
  - `replaceWithEphemeral(env: Env, token: string, body: MessageBody): Promise<void>`
  - `UNAVAILABLE: string` (the upstream-failure copy)

- [ ] **Step 1: Write the failing test**

```ts
// test/v2.test.ts
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { actionRow, container, ephemeral, escapeMarkdown, linkButton, section, siteUrl, text, v2Message } from '../src/v2';

describe('v2 builders', () => {
  it('siteUrl appends UTM tags with the right separator', () => {
    expect(siteUrl(env, '/wiki/item/golden-jam', 'wiki', 'button'))
      .toBe('https://idleontoolbox.com/wiki/item/golden-jam?utm_source=discord_bot&utm_medium=wiki&utm_content=button');
    expect(siteUrl(env, '/tools/builds/view?id=abc', 'build', 'build_link'))
      .toBe('https://idleontoolbox.com/tools/builds/view?id=abc&utm_source=discord_bot&utm_medium=build&utm_content=build_link');
  });

  it('escapeMarkdown neutralises link and emphasis syntax', () => {
    expect(escapeMarkdown('[a](b) *c* _d_ ~e~ `f`')).toBe('\\[a\\]\\(b\\) \\*c\\* \\_d\\_ \\~e\\~ \\`f\\`');
  });

  it('builds a container with the V2 flag', () => {
    const message = v2Message([container(0x7f77dd, [section('hi', 'https://x/y.png'), text('t'), actionRow([linkButton('Go', 'https://x')])])]);
    expect(message.flags).toBe(32768);
    expect(message.components?.[0]).toMatchObject({ type: 17, accent_color: 0x7f77dd });
    const [sectionC, textC, rowC] = (message.components?.[0] as { components: Record<string, unknown>[] }).components;
    expect(sectionC).toEqual({ type: 9, components: [{ type: 10, content: 'hi' }], accessory: { type: 11, media: { url: 'https://x/y.png' } } });
    expect(textC).toEqual({ type: 10, content: 't' });
    expect(rowC).toEqual({ type: 1, components: [{ type: 2, style: 5, label: 'Go', url: 'https://x' }] });
  });

  it('ephemeral replies are plain content with an optional button', () => {
    expect(ephemeral('nope')).toEqual({ flags: 64, content: 'nope' });
    expect(ephemeral('nope', { label: 'Search', url: 'https://x' }).components).toEqual([
      { type: 1, components: [{ type: 2, style: 5, label: 'Search', url: 'https://x' }] }
    ]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/v2.test.ts`
Expected: FAIL, `../src/v2` not found.

- [ ] **Step 3: Implement**

```ts
// src/v2.ts
import { MessageFlags, type Component, type Env, type MessageBody } from './types';

export function siteUrl(env: Env, path: string, medium: string, content: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${env.SITE_URL}${path}${separator}utm_source=discord_bot&utm_medium=${medium}&utm_content=${content}`;
}

export const escapeMarkdown = (value: string) => value.replace(/([\\[\]()*_~`|>#-])/g, '\\$1');

export const text = (content: string): Component => ({ type: 10, content });
export const separator = (large = false): Component => ({ type: 14, divider: true, spacing: large ? 2 : 1 });
export const section = (content: string, thumbnailUrl: string): Component => ({
  type: 9,
  components: [text(content)],
  accessory: { type: 11, media: { url: thumbnailUrl } }
});
export const linkButton = (label: string, url: string): Component => ({ type: 2, style: 5, label, url });
export const actionRow = (buttons: Component[]): Component => ({ type: 1, components: buttons });
export const container = (accent: number, children: Component[]): Component => ({ type: 17, accent_color: accent, components: children });

export const v2Message = (components: Component[]): MessageBody => ({ flags: MessageFlags.ComponentsV2, components });

export function ephemeral(content: string, button?: { label: string; url: string }): MessageBody {
  const body: MessageBody = { flags: MessageFlags.Ephemeral, content };
  if (button) body.components = [actionRow([linkButton(button.label, button.url)])];
  return body;
}
```

Note: the escape set includes `-` and `#` so a build title starting with "# " or "- " cannot turn into a heading or list. The test above only checks the common characters.

```ts
// src/discord.ts
import type { Env, MessageBody } from './types';

const API = 'https://discord.com/api/v10';

async function call(url: string, init: RequestInit): Promise<void> {
  const res = await fetch(url, { ...init, headers: { 'content-type': 'application/json' } });
  if (!res.ok) console.error('discord api', init.method, url.replace(/\/webhooks\/\d+\/[^/]+/, '/webhooks/<app>/<token>'), res.status, await res.text());
}

// Interaction webhooks are authorised by the interaction token itself; no bot token needed.
export const editOriginal = (env: Env, token: string, body: MessageBody) =>
  call(`${API}/webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`, { method: 'PATCH', body: JSON.stringify(body) });

// A deferred reply is public; errors must be private, so the placeholder is removed and the
// error sent as an ephemeral follow-up.
export async function replaceWithEphemeral(env: Env, token: string, body: MessageBody): Promise<void> {
  await call(`${API}/webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`, { method: 'DELETE' });
  await call(`${API}/webhooks/${env.DISCORD_APPLICATION_ID}/${token}`, { method: 'POST', body: JSON.stringify(body) });
}
```

```ts
// src/replies.ts
export const UNAVAILABLE = 'Toolbox data is unavailable right now, try again in a few minutes.';
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run test/v2.test.ts`
Expected: PASS.

---

### Task 5: `/wiki` (data sync, search, autocomplete, message)

**Files:**
- Create: `it-cloudflare-bot/scripts/sync-data.mjs`, `src/wiki.ts`, `test/wiki.test.ts`
- Create (generated, tracked): `it-cloudflare-bot/data/bot-wiki-index.json`, `data/classes.json`
- Modify: `it-cloudflare-bot/src/interactions.ts`

**Interfaces:**
- Consumes: `BotWikiEntry` shape (Task 2), builders and `ephemeral`, `siteUrl`, `UNAVAILABLE` (Task 4), `json`, `handleInteraction` (Task 3).
- Produces:
  - `searchWiki(entries: WikiEntry[], query: string, limit?: number): WikiEntry[]`
  - `wikiChoices(query: string, entries?: WikiEntry[]): { name: string; value: string }[]`
  - `resolveWiki(value: string, entries?: WikiEntry[]): WikiEntry | null`
  - `wikiMessage(env: Env, entry: WikiEntry): MessageBody`
  - `handleWiki(env: Env, value: string): Response`
  - `optionValue(interaction: Interaction, name: string): string` and `focusedValue(interaction: Interaction): string` exported from `src/interactions.ts`
  - `data/classes.json`: `{ key: string; name: string; slug: string; index: number }[]` (used in Task 6)

- [ ] **Step 1: Write the sync script and run it**

```js
// scripts/sync-data.mjs
// Copies the site's bot wiki index and derives the class list. Run before every deploy
// (npm run deploy does it). SITE_REPO defaults to the sibling checkout.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = process.env.SITE_REPO ?? path.join(root, '..', 'IdleonToolbox');
const out = path.join(root, 'data');
fs.mkdirSync(out, { recursive: true });

const wikiSource = path.join(site, 'data', 'bot-wiki-index.json');
if (!fs.existsSync(wikiSource)) throw new Error(`${wikiSource} missing: run "npm run build:graph" in the site repo first`);
fs.copyFileSync(wikiSource, path.join(out, 'bot-wiki-index.json'));

const promotions = JSON.parse(fs.readFileSync(path.join(site, 'data', 'website-data', 'classPromotions.json'), 'utf-8'));
const classes = Object.entries(promotions)
  .filter(([, entry]) => entry?.released)
  .map(([key, entry]) => ({
    key,
    name: key.replace(/_/g, ' '),
    slug: key.toLowerCase().replace(/_/g, '-'),
    index: entry.index
  }));
fs.writeFileSync(path.join(out, 'classes.json'), JSON.stringify(classes, null, 2));

console.log(`synced ${JSON.parse(fs.readFileSync(wikiSource, 'utf-8')).length} wiki entries, ${classes.length} classes`);
```

Run: `npm run sync`
Expected: `synced <n> wiki entries, 23 classes`. If `classPromotions.json` is not at that path, find it with `ls ../IdleonToolbox/data/website-data | grep -i class` and fix the path; the file holds `{ "<Class_Key>": { "index": <n>, "released": <bool>, ... } }`.

- [ ] **Step 2: Write the failing tests**

```ts
// test/wiki.test.ts
import { env, createExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import worker from '../src/index';
import { resolveWiki, searchWiki, wikiChoices, wikiMessage, type WikiEntry } from '../src/wiki';
import { makeKeys, signedRequest } from './helpers';

const entry = (over: Partial<WikiEntry>): WikiEntry => ({
  id: 'item:X', kind: 'item', kindLabel: 'Item', label: 'X', slug: 'x', icon: null, category: null,
  description: null, sources: [], obtainedFrom: null, listed: true, ...over
});

const fixture = [
  entry({ id: 'item:FoodG1', label: 'Golden Jam', slug: 'golden-jam' }),
  entry({ id: 'monster:chestG', kind: 'monster', kindLabel: 'Monster', label: 'Golden Chest', slug: 'golden-chest' }),
  entry({ id: 'talent:T', kind: 'talent', kindLabel: 'Talent', label: 'Gold Touch', slug: 'gold-touch' }),
  entry({ id: 'item:Ore', label: 'Pure Golden Ore', slug: 'pure-golden-ore' })
];

describe('searchWiki', () => {
  it('ranks prefix before substring, then items, monsters, rest', () => {
    expect(searchWiki(fixture, 'gold').map((e) => e.id)).toEqual(['item:FoodG1', 'monster:chestG', 'talent:T', 'item:Ore']);
  });

  it('is case-insensitive and empty for a blank query', () => {
    expect(searchWiki(fixture, 'JAM').map((e) => e.id)).toEqual(['item:FoodG1']);
    expect(searchWiki(fixture, '   ')).toEqual([]);
  });

  it('caps the result length', () => {
    expect(searchWiki(fixture, 'g', 2)).toHaveLength(2);
  });
});

describe('choices and resolve', () => {
  it('names choices with the kind label and uses the id as value', () => {
    expect(wikiChoices('golden j', fixture)).toEqual([{ name: 'Golden Jam (Item)', value: 'item:FoodG1' }]);
  });

  it('resolves an exact id, falls back to search for free text, null when nothing matches', () => {
    expect(resolveWiki('item:FoodG1', fixture)?.label).toBe('Golden Jam');
    expect(resolveWiki('golden ch', fixture)?.id).toBe('monster:chestG');
    expect(resolveWiki('zzz', fixture)).toBeNull();
  });
});

describe('wikiMessage', () => {
  it('renders header, sources, button and footer', () => {
    const message = wikiMessage(env, entry({
      id: 'item:FoodG1', label: 'Golden Jam', slug: 'golden-jam', icon: '/data/FoodG1.png', category: 'Golden food',
      description: 'Increases your Max Health by 30%.', sources: [{ label: 'Dropped by', count: 2 }, { label: 'Reward from', count: 7 }]
    }));
    const box = (message.components![0] as { accent_color: number; components: any[] });
    expect(box.accent_color).toBe(0x7f77dd);
    expect(box.components[0].accessory.media.url).toBe('https://idleontoolbox.com/data/FoodG1.png');
    const header = box.components[0].components[0].content as string;
    expect(header).toContain('[Item](https://idleontoolbox.com/wiki/item?utm_source=discord_bot&utm_medium=wiki&utm_content=category)');
    expect(header).toContain('· Golden food');
    expect(header).toContain('## [Golden Jam](https://idleontoolbox.com/wiki/item/golden-jam?utm_source=discord_bot&utm_medium=wiki&utm_content=title)');
    expect(header).toContain('Increases your Max Health by 30%.');
    expect(box.components[2].content).toBe('**Dropped by** 2 · **Reward from** 7');
    expect(box.components[3].components[0]).toMatchObject({ label: 'View on wiki', url: 'https://idleontoolbox.com/wiki/item/golden-jam?utm_source=discord_bot&utm_medium=wiki&utm_content=button' });
    expect(box.components.at(-1).content).toBe('-# Idleon Toolbox wiki');
  });

  it('drops the thumbnail, listing link and sources line when there is nothing to show', () => {
    const message = wikiMessage(env, entry({ kind: 'quest', kindLabel: 'Quest', label: 'Q', slug: 'q', listed: false }));
    const parts = (message.components![0] as { components: any[] }).components;
    expect(parts[0].type).toBe(10);
    expect(parts[0].content.startsWith('-# Quest\n## [Q]')).toBe(true);
    expect(parts.some((part) => part.type === 14)).toBe(false);
  });

  it('shows obtainedFrom when there are no source edges', () => {
    const message = wikiMessage(env, entry({ obtainedFrom: 'Dungeons' }));
    const parts = (message.components![0] as { components: any[] }).components;
    expect(parts.find((part) => part.content === '**Obtained from** Dungeons')).toBeTruthy();
  });
});

describe('/wiki over the endpoint', () => {
  const call = async (body: unknown) => {
    const keys = await makeKeys();
    return worker.fetch(await signedRequest(keys, body), { ...env, DISCORD_PUBLIC_KEY: keys.publicKeyHex }, createExecutionContext());
  };

  it('autocompletes against the bundled index', async () => {
    const res = await call({ type: 4, token: 't', application_id: 'app1', data: { name: 'wiki', options: [{ name: 'name', type: 3, value: 'golden ja', focused: true }] } });
    const body = await res.json() as { type: number; data: { choices: { name: string; value: string }[] } };
    expect(body.type).toBe(8);
    expect(body.data.choices[0]).toEqual({ name: 'Golden Jam (Item)', value: 'item:FoodG1' });
  });

  it('answers the command with a V2 message', async () => {
    const res = await call({ type: 2, token: 't', application_id: 'app1', data: { name: 'wiki', options: [{ name: 'name', type: 3, value: 'item:FoodG1' }] } });
    const body = await res.json() as { type: number; data: { flags: number } };
    expect(body).toMatchObject({ type: 4, data: { flags: 32768 } });
  });

  it('replies ephemerally when nothing matches', async () => {
    const res = await call({ type: 2, token: 't', application_id: 'app1', data: { name: 'wiki', options: [{ name: 'name', type: 3, value: 'qqqqqqqq' }] } });
    expect(await res.json()).toMatchObject({ type: 4, data: { flags: 64, content: "Nothing in the wiki matches 'qqqqqqqq'." } });
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run test/wiki.test.ts`
Expected: FAIL, `../src/wiki` not found.

- [ ] **Step 4: Implement `src/wiki.ts`**

```ts
// src/wiki.ts
import wikiIndex from '../data/bot-wiki-index.json';
import { ResponseType, type Env, type Interaction, type MessageBody } from './types';
import { actionRow, container, ephemeral, escapeMarkdown, linkButton, section, separator, siteUrl, text, v2Message } from './v2';

export interface WikiEntry {
  id: string;
  kind: string;
  kindLabel: string;
  label: string;
  slug: string;
  icon: string | null;
  category: string | null;
  description: string | null;
  sources: { label: string; count: number }[];
  obtainedFrom: string | null;
  listed: boolean;
}

const ACCENT = 0x7f77dd;
const KIND_PRIORITY: Record<string, number> = { item: 0, monster: 1 };
const ENTRIES = wikiIndex as WikiEntry[];
const BY_ID = new Map(ENTRIES.map((entry) => [entry.id, entry]));

export function searchWiki(entries: WikiEntry[], query: string, limit = 25): WikiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { entry: WikiEntry; score: number }[] = [];
  for (const entry of entries) {
    const label = entry.label.toLowerCase();
    const match = label.startsWith(q) ? 0 : label.includes(q) ? 1 : -1;
    if (match < 0) continue;
    scored.push({ entry, score: match * 10 + (KIND_PRIORITY[entry.kind] ?? 2) });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.entry.label.length - b.entry.label.length || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map(({ entry }) => entry);
}

export const wikiChoices = (query: string, entries: WikiEntry[] = ENTRIES) =>
  searchWiki(entries, query).map((entry) => ({ name: `${entry.label} (${entry.kindLabel})`.slice(0, 100), value: entry.id }));

export function resolveWiki(value: string, entries: WikiEntry[] = ENTRIES): WikiEntry | null {
  const exact = entries === ENTRIES ? BY_ID.get(value) : entries.find((entry) => entry.id === value);
  return exact ?? searchWiki(entries, value, 1)[0] ?? null;
}

export function wikiMessage(env: Env, entry: WikiEntry): MessageBody {
  const pageUrl = (content: string) => siteUrl(env, `/wiki/${entry.kind}/${entry.slug}`, 'wiki', content);
  const kindPart = entry.listed ? `[${entry.kindLabel}](${siteUrl(env, `/wiki/${entry.kind}`, 'wiki', 'category')})` : entry.kindLabel;
  const header = [
    `-# ${kindPart}${entry.category ? ` · ${entry.category}` : ''}`,
    `## [${escapeMarkdown(entry.label)}](${pageUrl('title')})`,
    ...(entry.description ? [entry.description] : [])
  ].join('\n');

  const sourcesLine = entry.sources.length
    ? entry.sources.map(({ label, count }) => `**${label}** ${count}`).join(' · ')
    : entry.obtainedFrom ? `**Obtained from** ${entry.obtainedFrom}` : null;

  return v2Message([
    container(ACCENT, [
      entry.icon ? section(header, `${env.SITE_URL}${entry.icon}`) : text(header),
      ...(sourcesLine ? [separator(), text(sourcesLine)] : []),
      actionRow([linkButton('View on wiki', pageUrl('button'))]),
      text('-# Idleon Toolbox wiki')
    ])
  ]);
}

export function handleWiki(env: Env, value: string): Response {
  const entry = resolveWiki(value);
  const body = entry
    ? wikiMessage(env, entry)
    : ephemeral(`Nothing in the wiki matches '${value}'.`, { label: 'Search the wiki', url: siteUrl(env, '/wiki', 'wiki', 'not_found') });
  return Response.json({ type: ResponseType.Message, data: body });
}
```

- [ ] **Step 5: Route `/wiki` in `src/interactions.ts`**

Add the helpers and branches; the full file becomes:

```ts
// src/interactions.ts
import { verifyDiscordRequest } from './verify';
import { InteractionType, ResponseType, type Env, type Interaction } from './types';
import { handleWiki, wikiChoices } from './wiki';

export const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json' } });

export const optionValue = (interaction: Interaction, name: string) =>
  String(interaction.data?.options?.find((option) => option.name === name)?.value ?? '').trim();

export const focusedValue = (interaction: Interaction) =>
  String(interaction.data?.options?.find((option) => option.focused)?.value ?? '');

const choices = (list: { name: string; value: string }[]) => json({ type: ResponseType.Choices, data: { choices: list } });

export async function handleInteraction(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = await request.text();
  const ok = await verifyDiscordRequest(
    env.DISCORD_PUBLIC_KEY,
    request.headers.get('x-signature-ed25519') ?? '',
    request.headers.get('x-signature-timestamp') ?? '',
    body
  );
  if (!ok) return new Response('invalid request signature', { status: 401 });

  const interaction = JSON.parse(body) as Interaction;
  const command = interaction.data?.name;

  if (interaction.type === InteractionType.Ping) return json({ type: ResponseType.Pong });

  if (interaction.type === InteractionType.Autocomplete) {
    if (command === 'wiki') return choices(wikiChoices(focusedValue(interaction)));
    return choices([]);
  }

  if (interaction.type === InteractionType.Command) {
    if (command === 'wiki') return handleWiki(env, optionValue(interaction, 'name'));
  }

  return json({ error: 'unknown interaction' }, { status: 400 });
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `npx vitest run`
Expected: PASS, all files. `npx tsc` clean.

---

### Task 6: `/build`

**Files:**
- Create: `it-cloudflare-bot/src/build.ts`, `test/build.test.ts`
- Modify: `it-cloudflare-bot/src/interactions.ts`

**Interfaces:**
- Consumes: `data/classes.json` (Task 5), builders, `ephemeral`, `siteUrl`, `escapeMarkdown`, `editOriginal`, `replaceWithEphemeral`, `UNAVAILABLE` (Task 4), `optionValue`, `focusedValue`, `json` (Tasks 3, 5).
- Produces:
  - `ClassInfo { key: string; name: string; slug: string; index: number }`
  - `BuildItem { shortId: string; title: string; ownerName: string; likeCount: number }`
  - `classChoices(query: string): { name: string; value: string }[]`
  - `resolveClass(value: string): ClassInfo | null`
  - `fetchTopBuilds(env: Env, classKey: string): Promise<BuildItem[]>`
  - `buildMessage(env: Env, cls: ClassInfo, builds: BuildItem[]): MessageBody`
  - `handleBuild(env: Env, ctx: ExecutionContext, value: string, token: string): Response`

- [ ] **Step 1: Write the failing tests**

```ts
// test/build.test.ts
import { env, createExecutionContext, waitOnExecutionContext, fetchMock } from 'cloudflare:test';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import worker from '../src/index';
import { buildMessage, classChoices, resolveClass } from '../src/build';
import { makeKeys, signedRequest } from './helpers';

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

const db = { key: 'Death_Bringer', name: 'Death Bringer', slug: 'death-bringer', index: 14 };

describe('classes', () => {
  it('autocompletes class names', () => {
    expect(classChoices('death')).toEqual([{ name: 'Death Bringer', value: 'Death_Bringer' }]);
    expect(classChoices('').length).toBe(23);
  });

  it('resolves keys and free text', () => {
    expect(resolveClass('Death_Bringer')).toEqual(db);
    expect(resolveClass('death bringer')?.key).toBe('Death_Bringer');
    expect(resolveClass('nope')).toBeNull();
  });
});

describe('buildMessage', () => {
  it('lists the top builds with escaped titles and both buttons', () => {
    const message = buildMessage(env, db, [
      { shortId: 'abc123', title: 'Fast [AFK] build', ownerName: 'Someone', likeCount: 42 },
      { shortId: 'def456', title: 'Second', ownerName: 'Anonymous', likeCount: 1 }
    ]);
    const box = message.components![0] as { accent_color: number; components: any[] };
    expect(box.accent_color).toBe(0xd85a30);
    expect(box.components[0].accessory.media.url).toBe('https://idleontoolbox.com/data/ClassIcons14.png');
    expect(box.components[0].components[0].content).toBe('## Death Bringer builds\nTop community builds');
    expect(box.components[2].content).toBe([
      '[Fast \\[AFK\\] build](https://idleontoolbox.com/tools/builds/view?id=abc123&utm_source=discord_bot&utm_medium=build&utm_content=build_link) · by Someone · 42 likes',
      '[Second](https://idleontoolbox.com/tools/builds/view?id=def456&utm_source=discord_bot&utm_medium=build&utm_content=build_link) · by Anonymous · 1 like'
    ].join('\n'));
    expect(box.components[3].components.map((b: any) => b.label)).toEqual(['All Death Bringer builds', 'Create a build']);
  });

  it('says so when a class has no builds', () => {
    const box = buildMessage(env, db, []).components![0] as { components: any[] };
    expect(box.components[2].content).toBe('No Death Bringer builds yet');
    expect(box.components[3].components.map((b: any) => b.label)).toEqual(['Create a build']);
  });
});

describe('/build over the endpoint', () => {
  const call = async (body: unknown) => {
    const keys = await makeKeys();
    const ctx = createExecutionContext();
    const res = await worker.fetch(await signedRequest(keys, body), { ...env, DISCORD_PUBLIC_KEY: keys.publicKeyHex }, ctx);
    return { res, ctx };
  };
  const command = (value: string) => ({ type: 2, token: 'tok', application_id: 'app1', data: { name: 'build', options: [{ name: 'class', type: 3, value }] } });

  it('defers, fetches top builds, then edits the original response', async () => {
    fetchMock.get('https://builds.idleontoolbox.workers.dev')
      .intercept({ path: '/api/builds?class=Death_Bringer&sort=top&limit=3' })
      .reply(200, { items: [{ shortId: 'abc123', title: 'T', ownerName: 'O', likeCount: 3 }], nextCursor: null });
    let edited: any = null;
    fetchMock.get('https://discord.com')
      .intercept({ method: 'PATCH', path: '/api/v10/webhooks/app1/tok/messages/@original', body: (b) => { edited = JSON.parse(b); return true; } })
      .reply(200, {});

    const { res, ctx } = await call(command('Death_Bringer'));
    expect(await res.json()).toEqual({ type: 5 });
    await waitOnExecutionContext(ctx);
    expect(edited.flags).toBe(32768);
  });

  it('turns an API failure into an ephemeral follow-up', async () => {
    fetchMock.get('https://builds.idleontoolbox.workers.dev')
      .intercept({ path: '/api/builds?class=Death_Bringer&sort=top&limit=3' })
      .reply(500, 'boom');
    let followUp: any = null;
    fetchMock.get('https://discord.com')
      .intercept({ method: 'DELETE', path: '/api/v10/webhooks/app1/tok/messages/@original' })
      .reply(204, '');
    fetchMock.get('https://discord.com')
      .intercept({ method: 'POST', path: '/api/v10/webhooks/app1/tok', body: (b) => { followUp = JSON.parse(b); return true; } })
      .reply(200, {});

    const { ctx } = await call(command('Death_Bringer'));
    await waitOnExecutionContext(ctx);
    expect(followUp).toEqual({ flags: 64, content: 'Toolbox data is unavailable right now, try again in a few minutes.', allowed_mentions: { parse: [] } });
  });

  it('rejects an unknown class immediately', async () => {
    const { res } = await call(command('nope'));
    expect(await res.json()).toMatchObject({ type: 4, data: { flags: 64, content: "No class matches 'nope'." } });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run test/build.test.ts`
Expected: FAIL, `../src/build` not found.

- [ ] **Step 3: Implement `src/build.ts`**

```ts
// src/build.ts
import classList from '../data/classes.json';
import { editOriginal, replaceWithEphemeral } from './discord';
import { quoteInput, UNAVAILABLE } from './replies';
import { ResponseType, type Env, type Interaction, type MessageBody } from './types';
import { actionRow, container, ephemeral, escapeMarkdown, linkButton, section, separator, siteUrl, text, v2Message } from './v2';

export interface ClassInfo { key: string; name: string; slug: string; index: number }
export interface BuildItem { shortId: string; title: string; ownerName: string; likeCount: number }

const ACCENT = 0xd85a30;
const CLASSES = classList as ClassInfo[];

export function classChoices(query: string) {
  const q = query.trim().toLowerCase();
  return CLASSES
    .filter((cls) => cls.name.toLowerCase().includes(q))
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q)) || a.name.localeCompare(b.name))
    .slice(0, 25)
    .map((cls) => ({ name: cls.name, value: cls.key }));
}

export function resolveClass(value: string): ClassInfo | null {
  const exact = CLASSES.find((cls) => cls.key === value);
  if (exact) return exact;
  const first = classChoices(value)[0];
  return first && value.trim() ? CLASSES.find((cls) => cls.key === first.value) ?? null : null;
}

export async function fetchTopBuilds(env: Env, classKey: string): Promise<BuildItem[]> {
  const res = await fetch(`${env.BUILDS_API}/builds?class=${encodeURIComponent(classKey)}&sort=top&limit=3`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`builds api ${res.status}`);
  const body = await res.json() as { items?: BuildItem[] };
  return body.items ?? [];
}

export function buildMessage(env: Env, cls: ClassInfo, builds: BuildItem[]): MessageBody {
  const lines = builds.length
    ? builds.map((build) => {
        const url = siteUrl(env, `/tools/builds/view?id=${build.shortId}`, 'build', 'build_link');
        const likes = `${build.likeCount} like${build.likeCount === 1 ? '' : 's'}`;
        return `[${escapeMarkdown(build.title)}](${url}) · by ${escapeMarkdown(build.ownerName)} · ${likes}`;
      }).join('\n')
    : `No ${cls.name} builds yet`;
  const create = linkButton('Create a build', siteUrl(env, '/tools/builds/new', 'build', 'create'));
  const buttons = builds.length
    ? [linkButton(`All ${cls.name} builds`, siteUrl(env, `/tools/builds/${cls.slug}`, 'build', 'class_page')), create]
    : [create];

  return v2Message([
    container(ACCENT, [
      section(`## ${cls.name} builds\nTop community builds`, `${env.SITE_URL}/data/ClassIcons${cls.index}.png`),
      separator(),
      text(lines),
      actionRow(buttons),
      text('-# Idleon Toolbox builds')
    ])
  ]);
}

export function handleBuild(env: Env, ctx: ExecutionContext, value: string, token: string): Response {
  const cls = resolveClass(value);
  if (!cls) return Response.json({ type: ResponseType.Message, data: ephemeral(`No class matches '${quoteInput(value)}'.`) });

  ctx.waitUntil((async () => {
    try {
      await editOriginal(env, token, buildMessage(env, cls, await fetchTopBuilds(env, cls.key)));
    } catch (error) {
      console.error('build command', cls.key, error);
      await replaceWithEphemeral(env, token, ephemeral(UNAVAILABLE));
    }
  })());
  return Response.json({ type: ResponseType.Deferred });
}
```
- [ ] **Step 4: Route `/build` in `src/interactions.ts`**

Add the import and two branches:

```ts
import { classChoices, handleBuild } from './build';
```

In the autocomplete block, before `return choices([]);`:

```ts
    if (command === 'build') return choices(classChoices(focusedValue(interaction)));
```

In the command block, after the `wiki` line:

```ts
    if (command === 'build') return handleBuild(env, ctx, optionValue(interaction, 'class'), interaction.token);
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run`
Expected: PASS, all files. `npx tsc` clean.

---

### Task 7: Command definitions and registration script

**Files:**
- Create: `it-cloudflare-bot/src/commands.mjs`, `scripts/register-commands.mjs`, `test/commands.test.ts`

**Interfaces:**
- Produces: `COMMANDS` (array of Discord application command objects), `forGuild(commands)` (strips `integration_types` and `contexts`, which only global commands take).

- [ ] **Step 1: Write the failing test**

```ts
// test/commands.test.ts
import { describe, expect, it } from 'vitest';
import { COMMANDS, forGuild } from '../src/commands.mjs';

describe('commands', () => {
  it('defines /wiki and /build with autocomplete and user install', () => {
    expect(COMMANDS.map((c: any) => c.name)).toEqual(['wiki', 'build']);
    for (const command of COMMANDS as any[]) {
      expect(command.integration_types).toEqual([0, 1]);
      expect(command.contexts).toEqual([0, 1, 2]);
      expect(command.options[0]).toMatchObject({ type: 3, required: true, autocomplete: true, max_length: 100 });
      expect(command.description.length).toBeLessThanOrEqual(100);
    }
  });

  it('forGuild strips global-only fields', () => {
    for (const command of forGuild(COMMANDS) as any[]) {
      expect(command.integration_types).toBeUndefined();
      expect(command.contexts).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/commands.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```js
// src/commands.mjs
// Plain JS so the Node registration script can import it without a build step.
const everywhere = { integration_types: [0, 1], contexts: [0, 1, 2] };

export const COMMANDS = [
  {
    name: 'wiki',
    description: 'Look up an item, monster, talent or anything else in the Idleon Toolbox wiki',
    type: 1,
    ...everywhere,
    options: [{ type: 3, name: 'name', description: 'What to look up', required: true, autocomplete: true, max_length: 100 }]
  },
  {
    name: 'build',
    description: 'Top community builds for a class',
    type: 1,
    ...everywhere,
    options: [{ type: 3, name: 'class', description: 'Class', required: true, autocomplete: true, max_length: 100 }]
  }
];

export const forGuild = (commands) => commands.map(({ integration_types, contexts, ...rest }) => rest);
```

```js
// scripts/register-commands.mjs
// Usage: npm run register            -> the test server in DISCORD_GUILD_ID (instant)
//        npm run register -- --global -> every server and user install (can take a while to show)
// Reads DISCORD_APPLICATION_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID from .dev.vars.
import fs from 'node:fs';
import { COMMANDS, forGuild } from '../src/commands.mjs';

const vars = Object.fromEntries(
  fs.readFileSync(new URL('../.dev.vars', import.meta.url), 'utf-8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()])
);
const isGlobal = process.argv.includes('--global');
const { DISCORD_APPLICATION_ID: app, DISCORD_BOT_TOKEN: token, DISCORD_GUILD_ID: guild } = vars;
if (!app || !token || (!isGlobal && !guild)) throw new Error('Fill DISCORD_APPLICATION_ID, DISCORD_BOT_TOKEN and DISCORD_GUILD_ID in .dev.vars');

const url = isGlobal
  ? `https://discord.com/api/v10/applications/${app}/commands`
  : `https://discord.com/api/v10/applications/${app}/guilds/${guild}/commands`;
const res = await fetch(url, {
  method: 'PUT',
  headers: { Authorization: `Bot ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify(isGlobal ? COMMANDS : forGuild(COMMANDS))
});
console.log(res.status, isGlobal ? 'global' : `guild ${guild}`, await res.text());
if (!res.ok) process.exit(1);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run`
Expected: PASS, all files.

---

### Task 8: Wire to Discord and verify end to end (manual, with the user)

No new code. The user runs the account-bound steps; tokens never go into chat or files other than `.dev.vars`.

- [ ] **Step 1: Fill config.** `wrangler.toml` already carries the Application ID and Public Key (Task 3). Copy `.dev.vars.example` to `.dev.vars` and fill `DISCORD_APPLICATION_ID=1555351103812673546`, `DISCORD_GUILD_ID=630833158744571915` (the side server) and `DISCORD_BOT_TOKEN` (Bot tab → Reset Token; the user pastes it into the file, never in chat).

- [ ] **Step 2: Register test-server commands.**

Run: `npm run register`
Expected: `200 guild <id> [...]` with both commands.

- [ ] **Step 3: Run locally behind a tunnel.**

Run in two terminals: `npm run dev` and `cloudflared tunnel --url http://localhost:8787`
Set the app's Interactions Endpoint URL (General Information) to `<tunnel url>/interactions` and save. Expected: Discord accepts it (our PING handler answered).

- [ ] **Step 4: Smoke test in the side server.**
  - `/wiki` type "golden ja": suggestions show "Golden Jam (Item)"; picking it posts the purple card with icon, "Dropped by" / "Reward from" counts and a working "View on wiki" button carrying UTM tags.
  - `/wiki` free text "zzzz": ephemeral "Nothing in the wiki matches" with a "Search the wiki" button.
  - `/build` type "death": suggestion "Death Bringer"; result shows up to 3 builds with likes, "All Death Bringer builds" and "Create a build".
  - `/build` free text "nope": ephemeral "No class matches 'nope'."
  - Check one reply on a phone.

- [ ] **Step 5: Deploy.**

Run: `npm run deploy` (syncs data first; run `npm run build:graph` in the site repo beforehand if the wiki changed).
Set the Interactions Endpoint URL to `https://bot.<account>.workers.dev/interactions` and save. Repeat Step 4 against the deployed Worker.

- [ ] **Step 6: Launch (when the user decides).** `npm run register -- --global`, then publish the install link (Installation tab) in the Toolbox server and on the site. Remove the guild-scoped copies afterwards with an empty PUT to the guild endpoint so the side server does not show each command twice.

---

## Self-Review Notes

- Spec coverage: funnel rule and UTM (Tasks 4-6), V2 format for `/wiki` and `/build` (5, 6), autocomplete with exact ids and free-text fallback (5, 6), errors as ephemeral replies (4-6), `/build` never touching build detail (6), shared `KIND_LABELS` prerequisite (1), bot wiki index (2), one application and test-server registration (7, 8), user install contexts (7), upstream 5s timeout (6), no build count (6).
- Deferred to later phases on purpose: padded thumbnails (need the resvg renderer that arrives with cards in phase 2; phase 1 uses the site's sprites as-is, which Discord shows at their natural size), per-user cooldown (phase 2, when commands get expensive), application emojis (phase 2).
