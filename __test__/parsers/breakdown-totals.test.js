import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { collectBreakdowns } from '../helpers/breakdown-totals';
import { breakdownLines } from '../helpers/breakdown-tree';
import { evaluateBreakdown, isDisplayOnlyBreakdown } from '@parsers/breakdown';

// Every breakdown's tree, combined the way its root says, must rebuild the stat it explains. Display-only
// breakdowns (root combine 'list': per-level tables, two values in one drawer, a locked crop) are skipped
// on purpose; everything else is checked against the number the page shows.
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const FIXTURES = fs.readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => [file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8'))]);

const RELATIVE_TOLERANCE = 1e-9;

const matches = (rebuilt, value) => value === 0
  ? Math.abs(rebuilt) < RELATIVE_TOLERANCE
  : Math.abs(rebuilt / value - 1) < RELATIVE_TOLERANCE;

describe.each(FIXTURES)('breakdown totals: %s', (_name, fixture) => {
  const found = collectBreakdowns(fixture);
  const checked = found.filter(({ breakdown }) => !isDisplayOnlyBreakdown(breakdown));
  // A character slot with no class or stats (fourth, fresh) has NaN damage and defence in the formula
  // itself; nan-elimination owns that
  const valued = checked.filter(({ value }) => !Number.isNaN(value));

  it('finds breakdowns to check', () => {
    expect(checked.length).toBeGreaterThan(100);
  });

  it('knows the value of every breakdown it checks', () => {
    const unknown = checked.filter(({ value }) => typeof value !== 'number')
      .map(({ where, breakdown }) => `${where} (${breakdown.statName})`);
    expect(unknown).toEqual([]);
  });

  it('rebuilds every value from its tree', () => {
    const wrong = valued.filter(({ value }) => typeof value === 'number')
      .map(({ where, breakdown, value }) => ({ where, statName: breakdown.statName, value, rebuilt: evaluateBreakdown(breakdown) }))
      .filter(({ value, rebuilt }) => !matches(rebuilt, value))
      .map(({ where, statName, value, rebuilt }) => `${where} (${statName}): ${rebuilt} instead of ${value}`);
    expect(wrong).toEqual([]);
  });

  // Empty character slots carry NaN stats into their lines; nan-elimination owns those as well
  it('has no NaN or infinite lines', () => {
    const bad = valued.filter(({ emptySlot }) => !emptySlot).flatMap(({ where, breakdown }) => breakdownLines(breakdown.tree)
      .filter(({ value }) => typeof value !== 'number' || !Number.isFinite(value))
      .map(({ name, value }) => `${where} > ${name} = ${value}`));
    expect(bad).toEqual([]);
  });
});
