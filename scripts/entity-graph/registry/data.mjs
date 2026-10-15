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
export const gameTable = (data, name) => {
  const table = data?.wikiTables?.[name] ?? data?.gameTables?.[name] ?? null;
  if (table === null) missing.add(name);
  return table;
};
export const missingTables = () => [...missing].sort();
export const resetMissingTables = () => missing.clear();
