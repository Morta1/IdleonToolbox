import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { DESCRIPTORS, getDescriptor } from '@utility/goals/registry';
import { pageIcon, totalsDescriptor } from '@utility/goals/registry/totals';
import { GOAL_ROUTES } from '@utility/goals/routes';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { countOwnedLogBooks } from '@parsers/world-5/gaming';
import { getTotalTachyonsCollected } from '@parsers/class-specific/tesseract';
import { countRealObstructions } from '@parsers/world-7/jellyOperator';

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

it.each(TOTALS.map((d) => [d.system, d]))('%s: label is "<page> totals" and the route is the page', (system, d) => {
  expect(d.label).toMatch(/^\S.* totals$/);
  expect(GOAL_ROUTES[system]).toBe(d.route);
  expect(pageIcon(d.route)).toBeTruthy();
});

// Each row: the page's own header expression, on the latest fixture. [value, max] (max null when the page shows none).
const { account } = parseFixture(latest);
const real = (n) => (n > 0 ? n : null);
const research = account.research;
const spelunking = account.spelunking;
const sushi = account.sushiStation;
const hole = account.hole;
const gallery = account.gallery;
const jelly = account.jellyOperator;
const PAGE_VALUES = [
  ['researchTotals', 'level', research.researchLevel ?? 0, null],
  ['researchTotals', 'observations', research.totalOccurrencesFound ?? 0, real(research.occurrencesToBeFound)],
  ['researchTotals', 'gridPoints', research.gridPTSpent ?? 0, real(research.gridPTSearned)],
  ['researchTotals', 'lenses', research.magnifiersOwned ?? 0, null],
  ['spelunkingTotals', 'power', spelunking.power.value, null],
  ['spelunkingTotals', 'discoveries', spelunking.discoveriesCount, real(spelunking.maxDiscoveries)],
  ['spelunkingTotals', 'grandDiscoveries', spelunking.totalGrandDiscoveries, null],
  ['spelunkingTotals', 'upgradeLevels', spelunking.saveTotals?.upgradeLevels ?? 0, null],
  ['sushiTotals', 'uniqueSushi', sushi.uniqueSushi ?? 0, null],
  ['sushiTotals', 'upgradeLevels', sushi.saveTotals?.upgradeLevels ?? 0, null],
  ['sushiTotals', 'knowledgeLevels', sushi.saveTotals?.knowledgeLevels ?? 0, null],
  ['sushiTotals', 'perfectos', sushi.saveTotals?.perfectos ?? 0, null],
  ['compassTotals', 'levels', account.compass.totalUpgradeLevels, null],
  ['compassTotals', 'dust', account.compass.totalDustsCollected || 0, null],
  ['tesseractTotals', 'levels', account.tesseract.totalUpgradeLevels, null],
  ['tesseractTotals', 'tachyons', getTotalTachyonsCollected(account), null],
  ['grimoireTotals', 'levels', account.grimoire.totalUpgradeLevels, null],
  ['grimoireTotals', 'bones', account.grimoire.totalBonesCollected || 0, null],
  ['vaultTotals', 'levels', account.upgradeVault.totalUpgradeLevels, null],
  ['slabTotals', 'looted', account.looty.lootedItems, real(account.looty.totalItems)],
  ['slabTotals', 'missing', account.looty.missingItems, null],
  ['slabTotals', 'greenstacks', account.looty.greenstackableStackedCount, real(account.looty.greenstackableCount)],
  ['gamingTotals', 'crowns', account.gaming.ratKing?.crownsCount ?? 0, real(account.gaming.logBook?.length ?? 0)],
  ['gamingTotals', 'logBook', countOwnedLogBooks(account.gaming.logBook), real(account.gaming.logBook?.length ?? 0)],
  ['holeTotals', 'opalsInvested', getHoleLeaderboardTotals(hole).opalsInvested, null],
  ['holeTotals', 'caverns', hole.unlockedCaverns, null],
  ['holeTotals', 'layers', getHoleLeaderboardTotals(hole).layersDestroyed, null],
  ['galleryTotals', 'podiums', gallery.podiumsOwned || 0, null],
  ['galleryTotals', 'lv2Podiums', gallery.lv2PodiumsOwned || 0, null],
  ['galleryTotals', 'lv3Podiums', gallery.lv3PodiumsOwned || 0, null],
  ['galleryTotals', 'lv4Podiums', gallery.lv4PodiumsOwned || 0, null],
  ['jellyTotals', 'obstructions', jelly.obstructionsDefeated ?? 0, real(countRealObstructions(jelly.obstructions))],
  ['jellyTotals', 'cellTypes', jelly.unitsOwned ?? 0, real(jelly.cells?.length ?? 0)],
  ['jellyTotals', 'cellLevels', jelly.cellLevelTotal ?? 0, null],
  ['jellyTotals', 'upgradeLevels', jelly.upgradeLevelTotal ?? 0, null],
  ['jellyTotals', 'slots', jelly.slotsOwned ?? 0, null],
  ['buttonTotals', 'presses', account.button.totalPresses || 0, null]
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

  it('the table covers every totals entry', () => {
    const covered = PAGE_VALUES.map(([system, key]) => `${system}:${key}`).toSorted();
    const listed = TOTALS.flatMap((d) => d.list(parseFixture(latest)).map((row) => `${d.system}:${d.key(row)}`)).toSorted();
    expect(listed).toEqual(covered);
  });
});
