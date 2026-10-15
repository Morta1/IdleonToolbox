import '../../polyfills';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { describe, expect, it, vi } from 'vitest';
import { loadWebsiteData, missingTables, resetMissingTables } from '../../scripts/entity-graph/registry/data.mjs';
import { CLIENT_TABLES, CORE_TABLES, gameConstants, moduleText } from '../../scripts/entity-graph/game-constants.mjs';
import GAME from '../../utility/wiki/game-constants.mjs';
import * as core from './game-tables/core.js';
import * as l1 from './game-tables/l1.js';
import * as l2 from './game-tables/l2.js';
import * as l3 from './game-tables/l3.js';
import * as l4 from './game-tables/l4.js';
import * as l5 from './game-tables/l5.js';
import * as l6 from './game-tables/l6.js';
import * as l7 from './game-tables/l7.js';
import * as l8 from './game-tables/l8.js';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

// Every table the graph build reads, with the output that reads it (READERS), and the fields of a table that point
// into another section (POINTERS), from each file in game-tables/: core, then one per wiki upkeep lane, so lanes never
// edit one file. A new read needs an entry in its lane's file.
const FILES = { core, l1, l2, l3, l4, l5, l6, l7, l8 };
const merged = (map) => {
  const out = {};
  for (const [file, entries] of Object.entries(FILES)) {
    for (const [key, value] of Object.entries(entries[map])) {
      if (key in out) throw new Error(`game-tables/${file}.js: ${map}.${key} is defined twice`);
      out[key] = value;
    }
  }
  return out;
};
const READERS = merged('READERS');
const POINTERS = merged('POINTERS');

const KEYS = Object.keys(READERS);
const homeOf = (key) => (data.wikiTables && key in data.wikiTables ? 'wikiTables' : 'gameTables');
// The data with one table swapped, the rest shared: no reader writes to its input.
const withTable = (key, table) => {
  const home = homeOf(key);
  const tables = { ...data[home] };
  if (table === undefined) delete tables[key];
  else tables[key] = table;
  return { ...data, [home]: tables };
};
// Numbers, numeric strings included, go to 2x + 1; other strings gain a suffix (royalRecruitClasses holds only names).
// A pointer into another website-data section stays put, per table: shifting it would test that section, not this read.
const NUMERIC = /^-?\d+(\.\d+)?$/;
const shift = (value, table) => {
  if (typeof value === 'number') return 2 * value + 1;
  if (typeof value === 'string') return NUMERIC.test(value) ? String(2 * Number(value) + 1) : `${value}_x`;
  if (Array.isArray(value)) return value.map((item) => shift(item, table));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, POINTERS[table]?.includes(k) ? v : shift(v, table)]));
  }
  return value;
};
const render = (key, input) => JSON.stringify(READERS[key](input));
const full = Object.fromEntries(KEYS.map((key) => [key, render(key, data)]));
const nodeIds = (rendered) => Object.keys(JSON.parse(rendered)).sort();

describe('game tables the wiki reads', () => {
  it('has every reader table in the data', () => {
    expect(KEYS.filter((key) => data[homeOf(key)]?.[key] === undefined)).toEqual([]);
  });

  it.each(KEYS)('reads %s', (key) => {
    expect(render(key, withTable(key, shift(data[homeOf(key)][key], key)))).not.toEqual(full[key]);
  });

  it('reads no table without a reader', () => {
    const roots = ['scripts/entity-graph', 'utility/wiki', 'components/wiki'].map((dir) => path.join(process.cwd(), dir));
    const files = roots.flatMap((root) => fs.readdirSync(root, { recursive: true })
      .filter((file) => /\.(m?js|jsx)$/.test(file))
      .map((file) => path.join(root, file)));
    // A read names its table literally, so a name held in a variable cannot slip past: every gameTable( call and every
    // bracket access must be one of the literal forms. data.mjs holds the one sanctioned lookup by variable.
    const LITERAL_CALL = /gameTable\(\s*[\w.?]+\s*,\s*['"`](\w+)['"`]\s*\)/g;
    const LITERAL_BRACKET = /(?:gameTables|wikiTables)\??\.?\[\s*['"`](\w+)['"`]\s*\]/g;
    const DOT = /(?:gameTables|wikiTables)\??\.(\w+)/g;
    const ANY_CALL = /\bgameTable\(/g;
    const ANY_BRACKET = /(?:gameTables|wikiTables)\??\.?\[/g;
    const names = new Set();
    const dynamic = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      const literal = (pattern) => [...source.matchAll(pattern)].map((match) => match[1]);
      const calls = literal(LITERAL_CALL);
      const brackets = literal(LITERAL_BRACKET);
      for (const name of [...calls, ...brackets, ...literal(DOT)]) names.add(name);
      const sanctioned = path.basename(file) === 'data.mjs';
      if ((source.match(ANY_CALL) || []).length !== calls.length) dynamic.push(`${path.relative(process.cwd(), file)}: gameTable(`);
      if (!sanctioned && (source.match(ANY_BRACKET) || []).length !== brackets.length) dynamic.push(`${path.relative(process.cwd(), file)}: [ ]`);
    }
    expect({ names: [...names].sort(), dynamic }).toEqual({ names: [...new Set([...KEYS, ...CLIENT_TABLES])].sort(), dynamic: [] });
  });

  // Owner decisions 4: an absent table leaves its piece out and is reported, never thrown.
  it.each(KEYS)('leaves out what %s fills when it is absent', (key) => {
    resetMissingTables();
    const out = render(key, withTable(key, undefined));
    expect(out).not.toEqual(full[key]);
    // Only the piece goes: every node is still built.
    expect(nodeIds(out)).toEqual(nodeIds(full[key]));
    expect(missingTables()).toEqual([key]);
    resetMissingTables();
  });
});

describe('the client constants module', () => {
  // Byte for byte (line endings aside): a hand edit that keeps the values still fails.
  it('the committed client constants are what the generator writes', () => {
    const committed = fs.readFileSync(path.join(process.cwd(), 'utility', 'wiki', 'game-constants.mjs'), 'utf-8').split('\r\n').join('\n');
    expect([committed, GAME]).toEqual([moduleText(gameConstants(data)), gameConstants(data)]);
  });

  // Run as a script it always writes, also when reached through a junction or symlink (where argv[1] and the module's
  // own URL name different paths): a deploy that skipped it would build on a stale module without a word.
  it('writes the module when run through a link to its folder', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'game-constants-'));
    try {
      const link = path.join(dir, 'entity-graph');
      fs.symlinkSync(path.join(process.cwd(), 'scripts', 'entity-graph'), link, 'junction');
      const out = path.join(dir, 'out.mjs');
      execFileSync(process.execPath, [path.join(link, 'game-constants.mjs'), '--out', out], { stdio: 'pipe' });
      expect(fs.readFileSync(out, 'utf-8')).toBe(moduleText(gameConstants(data)));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  // Owner decisions 6 holds for a deploy too: npm run build regenerates the module (and stops on a missing core table)
  // before the graph build, as build:graph does.
  it('runs the generator before the graph build in build:graph and in the deploy build', () => {
    const { scripts } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
    const order = (script) => ['game-constants.mjs', 'entity-graph/build.mjs'].map((step) => scripts[script].indexOf(step));
    expect([order('build:graph'), order('prebuild')].map(([generator, graph]) => generator >= 0 && generator < graph)).toEqual([true, true]);
  });

  // Owner decisions 4 and 6: an absent client table is left out of the module and named; the number formatting
  // tables are the exception, and stop the build instead.
  it.each(CLIENT_TABLES.filter((key) => !CORE_TABLES.includes(key)))('leaves %s out of the module when it is absent', (key) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(Object.keys(gameConstants(withTable(key, undefined)))).toEqual(CLIENT_TABLES.filter((name) => name !== key));
      expect(warn.mock.calls).toEqual([[`missing gameTables: ${key} (left out of their pages; run npm run test:analysis in z-processing)`]]);
    } finally {
      warn.mockRestore();
      resetMissingTables();
    }
  });

  it.each(CORE_TABLES)('stops the build when %s is absent', (key) => {
    try {
      expect(() => gameConstants(withTable(key, undefined))).toThrow(`missing gameTables: ${key}`);
    } finally {
      resetMissingTables();
    }
  });
});
