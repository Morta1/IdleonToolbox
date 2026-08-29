import '../../polyfills';
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { notateNumber } from '@utility/helpers';

// nan-elimination.test.js walks parsed values and asks "is this NaN?". That misses a whole class of
// bug: a breakdown source whose `value` is a STRING is a perfectly valid string right up until
// Breakdown.tsx puts it through notateNumber and renders NaN. e2e/no-nan.spec.js would catch it,
// but only on pages a logged-out visitor can reach, and breakdowns need character data.
//
// So this gate renders every breakdown source the way the component does and checks the result.
const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const FIXTURES = fs.readdirSync(FIXTURES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => [file.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, file), 'utf-8'))]);

// Mirrors Breakdown.tsx: `source.formatted ?? notateNumber(source.value, valueNotation)`, with
// MultiplierInfo as the component's default notation.
const renderSource = (source) => String(source?.formatted ?? notateNumber(source?.value, 'MultiplierInfo'));

const isBreakdown = (node) => node
  && typeof node === 'object'
  && Array.isArray(node.categories)
  && node.categories.every((category) => category && Array.isArray(category.sources));

// Breakdowns hang off characters and account at varying depths, so find them rather than listing
// every known one - a new breakdown is covered the day it is added.
const findBreakdowns = (node, trail = '', found = [], seen = new WeakSet()) => {
  if (!node || typeof node !== 'object') return found;
  if (seen.has(node)) return found;
  seen.add(node);
  if (isBreakdown(node)) found.push({ trail, breakdown: node });
  for (const [key, child] of Object.entries(node)) {
    findBreakdowns(child, trail ? `${trail}.${key}` : key, found, seen);
  }
  return found;
};

describe('every breakdown source renders to a real number', () => {
  it.each(FIXTURES)('%s', (_name, fixture) => {
    const { account, characters } = parseFixture(fixture);
    const breakdowns = [
      ...findBreakdowns(account, 'account'),
      ...characters.flatMap((character, index) => findBreakdowns(character, `characters[${index}]`))
    ];

    // A fixture with no breakdowns at all would pass vacuously and hide a regression in the walker.
    expect(breakdowns.length).toBeGreaterThan(0);

    const offenders = breakdowns.flatMap(({ trail, breakdown }) => breakdown.categories
      .flatMap((category) => (category.sources ?? []).map((source) => ({
        where: `${trail} > ${breakdown.statName ?? '?'} > ${category.name} > ${source?.name}`,
        rendered: renderSource(source)
      })))
      .filter(({ rendered }) => /NaN|undefined/.test(rendered))
      .map(({ where, rendered }) => `${where} = ${rendered}`));

    expect(offenders).toEqual([]);
  });
});
