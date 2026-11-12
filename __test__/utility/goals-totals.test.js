import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { expectNoBreaks } from '../helpers/sweep';
import { DESCRIPTORS, getDescriptor } from '@utility/goals/registry';
import { pageIcon, totalsDescriptor } from '@utility/goals/registry/totals';
import { GOAL_ROUTES } from '@utility/goals/routes';
import { worldsArray } from '@utility/helpers';

const TOTALS = DESCRIPTORS.filter((d) => d.totals);

describe('totalsDescriptor', () => {
  const route = '/account/world-7/research';
  const d = totalsDescriptor({
    system: 'stubTotals',
    label: 'Stub totals',
    route,
    entries: [
      { key: 'a', name: 'With max', icon: 'data/Opal', value: () => 3, max: () => 10 },
      { key: 'b', name: 'No max', value: () => undefined, max: () => 0 }
    ]
  });

  it('lists one row per entry with its value and a real max', () => {
    const rows = d.list({ account: {} });
    expect(rows.map(d.key)).toEqual(['a', 'b']);
    expect(rows.map(d.name)).toEqual(['With max', 'No max']);
    expect(rows.map((row) => d.metrics.value.value(row))).toEqual([3, 0]);
    expect(rows.map((row) => d.metrics.value.max(row))).toEqual([10, null]);
  });

  it('an entry without its own icon shows the page icon', () => {
    const rows = d.list({ account: {} });
    expect(d.icon(rows[0])).toBe('data/Opal');
    expect(d.icon(rows[1])).toBe('data/ClassIcons61');
    expect(pageIcon(route)).toBe('data/ClassIcons61');
  });

  it('takes single entries only, named after the page', () => {
    expect(d.entryOnly).toBe(true);
    expect(d.totals).toBe(true);
    expect(d.scope).toBe('account');
  });
});

it('every totals descriptor is labelled "<page> totals", with the route of that page', () => {
  expectNoBreaks(TOTALS, ({ system }) => system, ({ system, label, route }) => [
    ...(/^\S.* totals$/.test(label) ? [] : [`label ${label}`]),
    ...(GOAL_ROUTES[system] === route ? [] : [`GOAL_ROUTES says ${GOAL_ROUTES[system]}, not ${route}`]),
    ...(pageIcon(route) ? [] : [`no page icon for ${route}`])
  ]);
});

// Totals a descriptor works out itself, on the latest fixture: a sum read off the save, or the page's own header count
// worked out here a second way. [value, max] (max null when the page shows none). An entry that only reads one parsed
// field has no row: the finite-value sweep in goals-registry.test.js covers it.
const { account } = parseFixture(latest);
const real = (n) => (n > 0 ? n : null);
// the Achievements page header: 70 slots per world, fillers left out, worlds with none hidden
const achievementWorlds = worldsArray.map((_, worldIndex) => {
  const shown = account.achievements.slice(worldIndex * 70, worldIndex * 70 + 70)
    .filter(({ name, visualIndex }) => visualIndex !== -1 && !name?.includes('FILLER'));
  return { key: `world${worldIndex + 1}`, completed: shown.filter(({ completed }) => completed).length, total: shown.length };
});
const achievementOracle = [...achievementWorlds, {
  key: 'total',
  completed: achievementWorlds.reduce((sum, { completed }) => sum + completed, 0),
  total: achievementWorlds.reduce((sum, { total }) => sum + total, 0)
}];
const PAGE_VALUES = [
  ['armoryTotals', 'statueLevels', 44, null],
  ['gamingTotals', 'paletteLevels', 444, null],
  ['farmingTotals', 'dayMarketLevels', 1308, null],
  ['farmingTotals', 'nightMarketLevels', 789, null],
  ['sigilTotals', 'levels', 102, null],
  ['vialTotals', 'levels', 855, null],
  ['equinoxTotals', 'upgradeLevels', 94, null],
  ['sailingTotals', 'boatLevels', 7119, null],
  ...achievementOracle.map(({ key, completed, total }) => ['achievementTotals', key, completed, real(total)]),
  ...worldsArray.map((_, world) => {
    // the Tasks page header for that world tab: the 8 permanent tasks, not the daily slot
    const worldTasks = account.tasksDescriptions?.[world]?.slice(0, 8) ?? [];
    const counted = worldTasks.filter(({ name }) => name !== 'Undisclosed_Task');
    return ['taskTotals', `world${world + 1}`, counted.reduce((sum, { level }) => sum + level, 0), real(counted.reduce((sum, { maxLevel }) => sum + maxLevel, 0))];
  })
];

describe('totals equal the page header on the latest fixture', () => {
  it.each(PAGE_VALUES)('%s %s', (system, key, value, max) => {
    const d = getDescriptor(system);
    const ctx = parseFixture(latest);
    const row = d.list(ctx).find((r) => d.key(r) === key);
    expect(row).toBeDefined();
    expect(d.metrics.value.value(row, ctx)).toBe(value);
    expect(d.metrics.value.max(row, ctx)).toBe(max);
  });

  it('the table covers every achievement and task total', () => {
    const covered = PAGE_VALUES.map(([system, key]) => `${system}:${key}`).filter((id) => /^(achievement|task)Totals:/.test(id)).toSorted();
    const listed = ['achievementTotals', 'taskTotals'].flatMap((system) => getDescriptor(system).list(parseFixture(latest))
      .map((row) => `${system}:${getDescriptor(system).key(row)}`)).toSorted();
    expect(listed).toEqual(covered);
  });
});
