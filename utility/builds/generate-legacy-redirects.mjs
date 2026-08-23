// One-off generator for data/legacy-build-redirects.json.
//
// The pre-community builds page lived at /tools/builds?c=<class>&b=<index>, where
// `b` indexed into data/builds.json[Class]. Those curated builds were imported into
// the community system, so every old URL has an exact new home at
// /tools/builds/<shortId>-<title>. This script recovers that mapping by matching
// legacy entries to community builds by title (disambiguated by class), and writes
// a static map the landing page uses to redirect old URLs 1:1.
//
// Run: node utility/builds/generate-legacy-redirects.mjs
// Re-run only if data/builds.json changes or imported builds are renamed - shortIds
// (and therefore slugs) are stable.

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { buildToSlug } from './build-pages.mjs';
import { classToSlug } from './class-paths.mjs';
import { BUILD_FETCH_USER_AGENT } from './static-fetch.mjs';

const API_BASE = process.env.NEXT_PUBLIC_BUILDS_URL || 'https://builds.idleontoolbox.workers.dev/api';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const norm = (s) => String(s || '').trim().toLowerCase();

async function fetchAllBuilds() {
  const all = [];
  let cursor = null;
  for (let page = 0; page < 60; page++) {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) params.set('cursor', cursor);
    const response = await fetch(`${API_BASE}/builds?${params}`, {
      headers: { 'User-Agent': BUILD_FETCH_USER_AGENT }
    });
    if (!response.ok) throw new Error(`Builds API returned HTTP ${response.status}`);
    const data = await response.json();
    all.push(...(data?.items || []));
    cursor = data?.nextCursor || null;
    if (!cursor) break;
  }
  return all;
}

const legacy = JSON.parse(await readFile(path.join(root, 'data', 'builds.json'), 'utf8'));
const community = await fetchAllBuilds();

const map = {};
const unmatched = [];

for (const [legacyClass, list] of Object.entries(legacy)) {
  const cParam = legacyClass.toLowerCase();
  const entry = { class: classToSlug(legacyClass), builds: {} };

  list.forEach((legacyBuild, index) => {
    if (!norm(legacyBuild?.title)) return; // placeholder entry - class page is the right target

    const candidates = community.filter((cb) => norm(cb.title) === norm(legacyBuild.title));
    // Duplicate titles exist across classes - the community build's subclass (or base
    // class, for base-class builds) must agree with the legacy class the URL named.
    const hit = candidates.length === 1
      ? candidates[0]
      : candidates.find((cb) => norm(cb.subclass || cb.class) === norm(legacyClass));

    if (hit) {
      entry.builds[index] = buildToSlug(hit);
    } else {
      unmatched.push(`${legacyClass}[${index}] "${legacyBuild.title}" (${candidates.length} title matches)`);
    }
  });

  map[cParam] = entry;
}

await writeFile(
  path.join(root, 'data', 'legacy-build-redirects.json'),
  JSON.stringify(map, null, 2) + '\n'
);

const mapped = Object.values(map).reduce((sum, e) => sum + Object.keys(e.builds).length, 0);
console.log(`Mapped ${mapped} legacy builds across ${Object.keys(map).length} classes.`);
if (unmatched.length) {
  console.log('Unmatched (will fall back to the class page):');
  console.log(unmatched.join('\n'));
}
