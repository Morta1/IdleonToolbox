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
