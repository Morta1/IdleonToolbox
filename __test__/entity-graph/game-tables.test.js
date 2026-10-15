import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData, missingTables, resetMissingTables } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import { ROWS } from '../../scripts/entity-graph/registry/index.mjs';
import { enrichWorld3 } from '../../scripts/entity-graph/enrich-world-3.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

const rebuild = (...kinds) => (input) => registryNodes(input, ROWS.filter((row) => kinds.includes(row.kind)));
// A bare node per trap item: the enrich pass only adds `fields` to the nodes it is handed.
const trapItems = (input) => {
  const nodes = {};
  for (const [rawName, item] of Object.entries(input.items)) {
    if (item?.Type === 'TRAP_BOX_SET') nodes[`item:${rawName}`] = { kind: 'item', rawName };
  }
  enrichWorld3(nodes, input);
  return nodes;
};

// Every table the graph build reads, with the output that reads it. A new read needs an entry here.
const READERS = {
  trapTimeUnits: trapItems,
  legendTalentColours: rebuild('legendtalent'),
  legendTalentMaxLevelGroups: rebuild('legendtalent'),
  sushiJoinedIds: rebuild('sushiupgrade'),
  owlBonusPerFeather: rebuild('owl'),
  royalRecruitOrder: rebuild('armoryupgrade'),
  royalRecruitClasses: rebuild('armoryupgrade'),
  mineheadUpgradeTables: rebuild('mineheadupgrade'),
  sneakingMasteryDrops: rebuild('sneakfloor', 'ninjaitem'),
  sneakingSymbolDrop: rebuild('ninjaitem'),
  sneakingHatReroll: rebuild('sneakfloor')
};
// The tables the client constants module carries (Task 2 replaces this with the generator's list).
const CLIENT_TABLES = [];

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
const NUMERIC = /^-?\d+(\.\d+)?$/;
const shift = (value) => {
  if (typeof value === 'number') return 2 * value + 1;
  if (typeof value === 'string') return NUMERIC.test(value) ? String(2 * Number(value) + 1) : `${value}_x`;
  if (Array.isArray(value)) return value.map(shift);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shift(v)]));
  return value;
};
const render = (key, input) => JSON.stringify(READERS[key](input));
const full = Object.fromEntries(KEYS.map((key) => [key, render(key, data)]));

describe('game tables the wiki reads', () => {
  it('has every reader table in the data', () => {
    expect(KEYS.filter((key) => data[homeOf(key)]?.[key] === undefined)).toEqual([]);
  });

  it.each(KEYS)('reads %s', (key) => {
    expect(render(key, withTable(key, shift(data[homeOf(key)][key])))).not.toEqual(full[key]);
  });

  it('reads no table without a reader', () => {
    const roots = ['scripts/entity-graph', 'utility/wiki', 'components/wiki'].map((dir) => path.join(process.cwd(), dir));
    const files = roots.flatMap((root) => fs.readdirSync(root, { recursive: true })
      .filter((file) => /\.(m?js|jsx)$/.test(file))
      .map((file) => path.join(root, file)));
    const READS = [/gameTable\(\s*\w+\s*,\s*'(\w+)'\s*\)/g, /(?:gameTables|wikiTables)\??\.(\w+)/g];
    const names = new Set();
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf-8');
      for (const pattern of READS) for (const match of source.matchAll(pattern)) names.add(match[1]);
    }
    expect([...names].sort()).toEqual([...KEYS, ...CLIENT_TABLES].sort());
  });

  // Owner decisions 4: an absent table leaves its piece out and is reported, never thrown.
  it.each(KEYS)('leaves out what %s fills when it is absent', (key) => {
    resetMissingTables();
    const out = render(key, withTable(key, undefined));
    expect(out).not.toEqual(full[key]);
    expect(missingTables()).toEqual([key]);
    resetMissingTables();
  });
});
