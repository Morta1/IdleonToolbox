import fs from 'fs';
import path from 'path';

// Every website-data section by its own key: the small ones ride in shared-data.json, the large
// ones have a file each named after the key. Rows name a section, never a file.
export const loadWebsiteData = (dir) => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, 'shared-data.json'), 'utf-8'));
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json') || file === 'shared-data.json') continue;
    data[file.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  }
  return data;
};

// A table z-processing located in N.js: wikiTables holds the ones only the wiki reads, gameTables the ones a parser reads too.
// An absent table (its locator no longer matches the game) is null and remembered, never thrown: the reader leaves its piece
// out and build.mjs names it once, so a game patch thins a page rather than blocking the deploy (test:analysis fails loudly).
const missing = new Set();
// A piece of a table that is gone while the table itself is present, by the name the build line prints for it.
export const noteMissing = (name) => {
  missing.add(name);
};
export const gameTable = (data, name) => {
  const table = data?.wikiTables?.[name] ?? data?.gameTables?.[name] ?? null;
  if (table === null) noteMissing(name);
  return table;
};
export const missingTables = () => [...missing].sort();
// The one line a build prints for them.
export const missingTablesLine = (names) => `missing gameTables: ${names.join(', ')} (left out of their pages; run npm run test:analysis in z-processing)`;
export const resetMissingTables = () => missing.clear();

// The position listIndexes located for one reader of the game's CustomLists (`entry` names the reader), or null.
// z-processing writes a locator that no longer matches as `{ <entry>: null }`, not as a missing table, and one entry can
// list a whole page family (the armory shelf, the schematics), so a gone entry is named in the build's missing line as
// `listIndexes.<entry>`. A keyed table whose key drops out is not named: it loses a field, not a page family.
export const listIndex = (data, entry) => {
  const indexes = gameTable(data, 'listIndexes');
  if (!indexes) return null;
  const index = indexes[entry] ?? null;
  if (index === null) noteMissing(`listIndexes.${entry}`);
  return index;
};
// That list itself, `offset` picking a list inside a block that starts there (as RANDOlist[82 + event]). `lists` is the
// website-data copy of the block (ninjaExtraInfo, research, randomList...). null when the entry or the list is absent: the
// reader leaves its piece out.
export const listAt = (lists, data, entry, offset = 0) => {
  const index = listIndex(data, entry);
  return index === null ? null : lists?.[index + offset] ?? null;
};
