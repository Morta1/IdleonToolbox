import { describe, it, expect } from 'vitest';
import * as data from '@website-data';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data', 'website-data');
const APP_DIRS = ['parsers', 'components', 'utility', 'hooks', 'pages', 'services', 'firebase'];
const WHOLE_MODULE_IMPORT = /import\s*\*\s*as\s+\w+\s+from\s*['"]@website-data['"]|import\(\s*['"]@website-data['"]\s*\)/;
const sourceFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(full);
  return /\.(js|jsx|ts|tsx|mjs)$/.test(entry.name) ? [full] : [];
});

describe('website-data barrel', () => {
  // 158 keys come from z-processing (26 in their own file, 132 inside shared-data.json);
  // itemsArray is derived in the barrel. A missing name is a build break for whichever
  // importing file needed it.
  it('exports 164 names', () => {
    // 2.3.531 added jellyUpgrades; spiceNames moved here from a hand-kept frontend copy;
    // gameTables holds the lists parsers used to copy from the game code by hand;
    // upgradeHelp / upgradeHelpPlaceholders hold the (?) help text of upgrade panels;
    // mapMulticharReq holds the characters each multi-character door needs;
    // wikiTables holds the tables only the wiki graph build reads, in their own file so no page bundles them.
    expect(Object.keys(data)).toHaveLength(164);
  });

  it('keeps wiki-only tables in their own file', () => {
    const shared = JSON.parse(readFileSync(path.join(DATA_DIR, 'shared-data.json'), 'utf-8'));
    expect(Object.hasOwn(shared, 'wikiTables')).toBe(false);
    expect(readFileSync(path.join(DATA_DIR, 'index.js'), 'utf-8').split(/\r?\n/))
      .toContain("export { default as wikiTables } from './wikiTables.json';");
    const gameNames = Object.keys(data.gameTables);
    expect(Object.keys(data.wikiTables).filter((name) => gameNames.includes(name))).toEqual([]);
  });

  // Importing wikiTables from app code would bundle it onto that page; only scripts/ (the graph build) may read it.
  // A whole-module import bundles it without naming it: `import * as X from '@website-data'` or
  // `import('@website-data')` cannot be tree-shaken (firebase's getGuilds did the latter until 2026-10-15).
  it('no app module names wikiTables or imports website-data whole', () => {
    const hits = APP_DIRS.flatMap((dir) => sourceFiles(path.join(ROOT, dir)))
      .filter((file) => /\bwikiTables\b/.test(readFileSync(file, 'utf-8')) || WHOLE_MODULE_IMPORT.test(readFileSync(file, 'utf-8')))
      .map((file) => path.relative(ROOT, file));
    expect(hits).toEqual([]);
  });

  it('has no empty export', () => {
    const empty = Object.entries(data).filter(([, v]) =>
      v === null || v === undefined
      || (Array.isArray(v) && v.length === 0)
      || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0));
    expect(empty.map(([k]) => k)).toEqual([]);
  });

  // Exists so four parsers can read one number per monster without importing the 2.08MB
  // monsterDrops table, which parsers/character.ts otherwise dragged onto 210 of 252 pages.
  // Asserted against monsterDrops rather than hardcoded, so it survives every regeneration.
  it('derives monsterCoinQuantity consistently with monsterDrops', () => {
    const names = Object.keys(data.monsterCoinQuantity);
    expect(names.length).toBe(Object.keys(data.monsterDrops).length);
    for (const name of names) {
      const coin = data.monsterDrops[name].find((drop) => drop.rawName === 'COIN');
      expect(data.monsterCoinQuantity[name]).toBe(coin.quantity);
    }
  });

  it('derives itemsArray from items', () => {
    expect(data.itemsArray).toEqual(Object.values(data.items));
  });

  // A bare Object.values would alias the two; today they come from separate parses, and
  // hatRack.ts-style code that mutates a copy would start corrupting items.
  it('gives itemsArray its own objects rather than aliasing items', () => {
    const first = Object.keys(data.items)[0];
    expect(data.itemsArray[0]).not.toBe(data.items[first]);
    expect(data.itemsArray[0]).toEqual(data.items[first]);
  });

  // Regression guard: commit 5921946 spread keychain stats into the items literal only, leaving
  // 25 keychains at 0 in itemsArray for ~16 months. The itemsArray toEqual above catches any
  // drift from items; this pins that items itself zeroes only EquipmentKeychain25-28 (genuinely
  // no stat data), so a regeneration cannot silently re-zero the rest.
  it('leaves exactly four keychains legitimately zeroed', () => {
    const zeroed = data.itemsArray
      .filter((x) => /^EquipmentKeychain\d+$/.test(x.rawName))
      .filter((x) => x.UQ1txt === 0 && x.UQ1val === 0)
      .map((x) => x.rawName);
    expect(zeroed).toEqual([
      'EquipmentKeychain25', 'EquipmentKeychain26', 'EquipmentKeychain27', 'EquipmentKeychain28'
    ]);
  });
});
