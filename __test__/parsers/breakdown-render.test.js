import '../../polyfills';
import { describe, it } from 'vitest';
import { parseFixture } from '../helpers/parsed-fixtures';
import { allFixtures } from '../helpers/save-fixtures';
import { expectNoBreaks } from '../helpers/sweep';
import { notateNumber } from '@utility/helpers';
import { evaluateBreakdownNode, formatBreakdownValue, getBreakdownNodeUnit, isBreakdownGroup } from '@parsers/breakdown';

// nan-elimination.test.js walks parsed values and asks "is this NaN?". That misses a whole class of
// bug: a breakdown source whose `value` is a STRING is a perfectly valid string right up until
// Breakdown.tsx puts it through notateNumber and renders NaN. e2e/no-nan.spec.js would catch it,
// but only on pages a logged-out visitor can reach, and breakdowns need character data.
//
// So this gate renders every breakdown source the way the component does and checks the result.
const FIXTURES = allFixtures();

// Mirrors Breakdown.tsx: `source.formatted ?? notateNumber(source.value, valueNotation)`, with
// MultiplierInfo as the component's default notation.
const renderSource = (source) => String(source?.formatted ?? notateNumber(source?.value, 'MultiplierInfo'));

const isLegacyBreakdown = (node) => node
  && typeof node === 'object'
  && Array.isArray(node.categories)
  && node.categories.every((category) => category && Array.isArray(category.sources));

const isTreeBreakdown = (node) => node
  && typeof node === 'object'
  && typeof node.statName === 'string'
  && Array.isArray(node.tree);

const isBreakdown = (node) => isLegacyBreakdown(node) || isTreeBreakdown(node);

// Mirrors breakdownView.ts: a line shows `formatted`, else its unit's format, else the notation;
// a group that combines shows its evaluated value
const renderTreeNode = (node) => {
  if (isBreakdownGroup(node)) {
    return node.combine === 'list' ? '' : formatBreakdownValue(evaluateBreakdownNode(node), getBreakdownNodeUnit(node));
  }
  if (node?.formatted) return String(node.formatted);
  return node?.unit ? formatBreakdownValue(node.value, node.unit) : renderSource(node);
};

const treeRows = (nodes, trail) => (nodes ?? []).filter(Boolean).flatMap((node) => [
  { where: `${trail} > ${node?.name}`, rendered: renderTreeNode(node) },
  ...(isBreakdownGroup(node) ? treeRows(node.children, `${trail} > ${node.name}`) : [])
]);

const breakdownRows = (breakdown, trail) => isTreeBreakdown(breakdown)
  ? treeRows(breakdown.tree, `${trail} > ${breakdown.statName}`)
  : breakdown.categories.flatMap((category) => (category.sources ?? []).map((source) => ({
    where: `${trail} > ${breakdown.statName ?? '?'} > ${category.name} > ${source?.name}`,
    rendered: renderSource(source)
  })));

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

describe('breakdowns as the drawer renders them', () => {
  it('every source renders to a real number, on every save', () => {
    expectNoBreaks(FIXTURES, ([name]) => name, ([, fixture]) => {
      const { account, characters } = parseFixture(fixture);
      const breakdowns = [
        ...findBreakdowns(account, 'account'),
        ...characters.flatMap((character, index) => findBreakdowns(character, `characters[${index}]`))
      ];
      // A fixture with no breakdowns at all would pass vacuously and hide a regression in the walker.
      if (!breakdowns.length) return ['no breakdowns found'];
      return breakdowns.flatMap(({ trail, breakdown }) => breakdownRows(breakdown, trail)
        .filter(({ rendered }) => /NaN|undefined/.test(rendered))
        .map(({ where, rendered }) => `${where} = ${rendered}`));
    });
  });
});
