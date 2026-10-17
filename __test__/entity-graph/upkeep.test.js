import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { findUpkeep, SHARED_UPKEEP_FILES } from '../../scripts/entity-graph/upkeep.mjs';

describe('findUpkeep', () => {
  const dir = path.join(process.cwd(), 'scripts', 'entity-graph');
  const found = findUpkeep(dir);

  it('lists the marked hand-kept spots, file and line', () => {
    expect(found.map(({ file }) => file)).toEqual(expect.arrayContaining([
      'edges/currency-shops.mjs', 'nodes/catalogs-b.mjs', 'shop-catalog.mjs', ...SHARED_UPKEEP_FILES
    ]));
  });

  // A marker wrapped over several comment lines is printed whole, not cut at its first line break.
  it('carries a marker on through its continuation lines', () => {
    const file = 'registry/world-1/statue.mjs';
    const lines = fs.readFileSync(path.join(dir, file), 'utf-8').split(/\r?\n/);
    const marker = found.find((entry) => entry.file === file);
    // `line` is 1-based, so lines[marker.line] is the line after the marker.
    const lastLine = lines[marker.line].replace(/^\s*\/\/\s*/, '').trim();
    expect(marker.text.endsWith(lastLine)).toBe(true);
  });

  it('never prints a marker that stops mid-sentence', () => {
    expect(found.filter(({ text }) => !/[.!?)]$/.test(text)).map(({ file, line }) => `${file}:${line}`)).toEqual([]);
  });

  it('does not list itself', () => {
    expect(found.some(({ file }) => file === 'upkeep.mjs')).toBe(false);
  });
});
