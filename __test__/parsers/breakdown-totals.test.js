import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { collectBreakdowns } from '../helpers/breakdown-totals';
import { allFixtures } from '../helpers/save-fixtures';
import { expectNoBreaks } from '../helpers/sweep';
import { breakdownLines } from '../helpers/breakdown-tree';
import { DEFAULT_ROOT_COMBINE, evaluateBreakdown, isDisplayOnlyBreakdown } from '@parsers/breakdown';
import { computeGains, computeShares } from '@components/common/Breakdown/breakdownInsights';

// Every breakdown's tree, combined the way its root says, must rebuild the stat it explains. Display-only
// breakdowns (root combine 'list': per-level tables, two values in one drawer, a locked crop) are skipped
// on purpose; everything else is checked against the number the page shows.
const FIXTURES = allFixtures();

const RELATIVE_TOLERANCE = 1e-9;

const matches = (rebuilt, value) => value === 0
  ? Math.abs(rebuilt) < RELATIVE_TOLERANCE
  : Math.abs(rebuilt / value - 1) < RELATIVE_TOLERANCE;

const SAVES = FIXTURES.map(([name, fixture]) => {
  const checked = collectBreakdowns(fixture).filter(({ breakdown }) => !isDisplayOnlyBreakdown(breakdown));
  // A character slot with no class or stats (fourth, fresh) has NaN damage and defence in the formula
  // itself; nan-elimination owns that
  return { name, checked, valued: checked.filter(({ value }) => !Number.isNaN(value)) };
});
const everySave = (rule) => expectNoBreaks(SAVES, ({ name }) => name, rule);

describe('breakdown totals, on every save', () => {
  it('finds breakdowns to check', () => {
    everySave(({ checked }) => (checked.length > 100 ? [] : [`only ${checked.length}`]));
  });

  it('knows the value of every breakdown it checks', () => {
    everySave(({ checked }) => checked.filter(({ value }) => typeof value !== 'number')
      .map(({ where, breakdown }) => `${where} (${breakdown.statName})`));
  });

  it('rebuilds every value from its tree', () => {
    everySave(({ valued }) => valued.filter(({ value }) => typeof value === 'number')
      .map(({ where, breakdown, value }) => ({ where, statName: breakdown.statName, value, rebuilt: evaluateBreakdown(breakdown) }))
      .filter(({ value, rebuilt }) => !matches(rebuilt, value))
      .map(({ where, statName, value, rebuilt }) => `${where} (${statName}): ${rebuilt} instead of ${value}`));
  });

  // Empty character slots carry NaN stats into their lines; nan-elimination owns those as well
  it('has no NaN or infinite lines', () => {
    everySave(({ valued }) => valued.filter(({ emptySlot }) => !emptySlot).flatMap(({ where, breakdown }) => breakdownLines(breakdown.tree)
      .filter(({ value }) => typeof value !== 'number' || !Number.isFinite(value))
      .map(({ name, value }) => `${where} > ${name} = ${value}`)));
  });

  // The drawer's share mode splits the total, so the top-level shares add back up to 100%. Where penalties
  // outweigh the bonuses, their sizes do instead, so no share flips sign.
  it('splits every total into shares that add up to 100% and finite gains', () => {
    everySave(({ valued }) => valued.filter(({ emptySlot }) => !emptySlot).flatMap(({ where, breakdown }) => {
      const tree = breakdown.tree.filter(Boolean);
      const combine = breakdown.combine ?? DEFAULT_ROOT_COMBINE;
      const shares = computeShares(tree, combine);
      const top = tree.filter((node) => shares.has(node)).map((node) => shares.get(node));
      const sum = top.reduce((total, share) => total + share, 0);
      const size = top.reduce((total, share) => total + Math.abs(share), 0);
      const gains = [...computeGains(tree, combine).values()];
      return [
        ...(shares.size && Math.abs(sum - 100) > 1e-6 && Math.abs(size - 100) > 1e-6
          ? [`${where} (${breakdown.statName}): shares add up to ${sum}`] : []),
        ...[...shares.values(), ...gains].some((value) => !Number.isFinite(value)) ? [`${where} (${breakdown.statName}): non-finite`] : []
      ];
    }));
  });
});
