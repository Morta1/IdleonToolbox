// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import GenericUpgradeOptimizer from '@components/account/Misc/class-specific/GenericUpgradeOptimizer';
import theme from '../../styles/theme/theme';

const resourceNames = { 0: 'Purple', 1: 'Brown' };

const buildRow = ({ hoardingPercentChange = 0, grossPercentChange = 1, cost = 1e6 }) => ({
  name: 'Arcanist_Damage_II',
  index: 6,
  level: 10,
  x3: 0,
  x4: 999999,
  cost,
  statChanges: [{
    stat: 'damage',
    change: 1234,
    percentChange: grossPercentChange - hoardingPercentChange,
    grossChange: 1500,
    grossPercentChange,
    hoardingChange: 266,
    hoardingPercentChange
  }]
});

const TACHYONS = { tesseract: { tachyons: [{ name: 'Purple', value: 1e9 }, { name: 'Brown', value: 1e9 }] } };

// calls: the options the optimizer was asked with, one per render.
const renderOptimizer = (rows, { account = TACHYONS, ...props } = {}) => {
  const calls = [];
  const view = render(
    <ThemeProvider theme={theme}>
      <GenericUpgradeOptimizer
        character={{ name: 'Tester' }}
        account={account}
        getOptimizedUpgradesFn={(character, plannedAccount, category, max, options) => {
          calls.push(options);
          return rows;
        }}
        upgradeCategories={{ damage: { name: 'Damage', stats: ['damage'], upgradeIndices: [6] } }}
        resourceNames={resourceNames}
        resourceKey="tesseract.tachyons"
        resourceImagePrefix="Tach"
        upgradeImagePrefix="ArcaneUpg"
        getResourceType={(upgrade) => upgrade.x3}
        tooltipText="test tooltip"
        {...props}
      />
    </ThemeProvider>
  );
  return { ...view, calls };
};

const withReason = (rows, reason) => {
  const list = [...rows];
  list.stoppedReason = reason;
  return list;
};

describe('GenericUpgradeOptimizer empty state', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each([
    ['tells the user to hoard when holding beats every affordable purchase', 'hoarding', 'Build up your stash', 'No viable upgrades found'],
    ['keeps the plain message when there is genuinely nothing to buy', 'no-candidates', 'No viable upgrades found', 'Build up your stash']
  ])('%s', (_, reason, shown, hidden) => {
    const { container } = renderOptimizer(withReason([], reason));
    expect(container.textContent).toContain(shown);
    expect(container.textContent).not.toContain(hidden);
  });

  it('notes the early stop when a partial list came back', () => {
    const { container } = renderOptimizer(withReason([buildRow({ grossPercentChange: 2.1 })], 'hoarding'));
    expect(container.textContent).toContain('Stopping here');
  });
});

describe('GenericUpgradeOptimizer hoarding breakdown', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows gross gain and hoarding loss when spending gives back a hoarding bonus', () => {
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 2.1, hoardingPercentChange: 1.4 })]);
    const text = container.textContent;
    // net stays the headline number
    expect(text).toContain('+0.7%');
    expect(text).toContain('gross +2.1%, hoarding -1.4%, net +0.7%');
    // cost 1e6 at the default 1/hour rebuilds over a century, which is a placeholder rate, not a real one
    expect(text).not.toMatch(/stash back in/);
  });

  it('shows the stash rebuild time when the farming rate makes it plausible', () => {
    // 5 resources at the default 1/hour rebuilds in 5 hours
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 2.1, hoardingPercentChange: 1.4, cost: 5 })]);
    expect(container.textContent).toMatch(/stash back in/);
  });

  it('shows a tiny absolute loss when it still eats a real share of the gain', () => {
    // absolute loss is minute, but it swallows 90% of the gain - the case the old fixed
    // 0.005pp threshold hid from exactly the accounts with the deepest stashes
    const { container } = renderOptimizer([buildRow({ grossPercentChange: 0.001, hoardingPercentChange: 0.0009 })]);
    expect(container.textContent).toContain('gross +0.001%, hoarding -0.0009%, net +0.0001%');
  });

  const withoutHoardingData = () => {
    const row = buildRow({ grossPercentChange: 2.1 });
    delete row.statChanges[0].grossPercentChange;
    delete row.statChanges[0].hoardingPercentChange;
    return row;
  };

  it.each([
    ['hoarding costs nothing', () => buildRow({ grossPercentChange: 2.1, hoardingPercentChange: 0 }), '+2.1%'],
    ['the loss is large in absolute terms but trivial next to the gain', () => buildRow({ grossPercentChange: 100, hoardingPercentChange: 0.5 }), '+99.5%'],
    ['the optimizer reports no hoarding data', withoutHoardingData, '+2.1%']
  ])('stays quiet when %s', (_, row, headline) => {
    const { container } = renderOptimizer([row()]);
    expect(container.textContent).toContain(headline);
    expect(container.textContent).not.toContain('hoarding');
  });
});

const buildTypedRow = ({ resourceType, cost = 5 }) => ({
  ...buildRow({ cost }),
  x3: resourceType
});

const seedSetting = (key, value) => window.localStorage.setItem(
  `tesseract.tachyons:genericUpgradeOptimizer:${key}`,
  JSON.stringify(value)
);

describe('GenericUpgradeOptimizer split by resource', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('leaves the sequence unsectioned by default', () => {
    const { container } = renderOptimizer([
      buildTypedRow({ resourceType: 0 }),
      buildTypedRow({ resourceType: 1 })
    ]);
    expect(container.textContent).not.toMatch(/upgrades? ·/);
  });

  it('sections the sequence by resource, ordered by first appearance', () => {
    seedSetting('splitByResource', true);
    const { container } = renderOptimizer([
      buildTypedRow({ resourceType: 1 }),
      buildTypedRow({ resourceType: 0 }),
      buildTypedRow({ resourceType: 1 })
    ]);
    const text = container.textContent;
    expect(text).toMatch(/Brown2 upgrades · 10/);
    expect(text).toMatch(/Purple1 upgrade · 5/);
    // Brown is farmed first because the optimizer wants it first
    expect(text.indexOf('Brown')).toBeLessThan(text.indexOf('Purple'));
  });

  it('keeps the real purchase order visible in the numbering', () => {
    seedSetting('splitByResource', true);
    seedSetting('viewMode', 'list');
    const { container } = renderOptimizer([
      buildTypedRow({ resourceType: 1 }),
      buildTypedRow({ resourceType: 0 }),
      buildTypedRow({ resourceType: 1 })
    ]);
    const firstCells = [...container.querySelectorAll('tbody tr')]
      .map(row => row.querySelector('td')?.textContent ?? '');
    expect(firstCells.filter(cell => /^\d+$/.test(cell))).toEqual(['1', '3', '2']);
  });
});

describe('GenericUpgradeOptimizer unlock marker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each([
    [1, 'Unlocks after 1 purchase'],
    [7, 'Unlocks after 7 purchases']
  ])('marks a row still locked in game and says how far off it is: %d', (unlocksAfterStep, text) => {
    const { container } = renderOptimizer([buildRow({}), { ...buildRow({}), lockedNow: true, unlocksAfterStep }]);
    expect(container.textContent).toContain(text);
  });

  it('leaves already unlocked rows unmarked', () => {
    const { container } = renderOptimizer([buildRow({})]);
    expect(container.textContent).not.toContain('Unlocks after');
    expect(container.textContent).not.toContain('Locked now');
  });
});

const buildReductionAccount = ({ bonus, spent }) => ({
  tesseract: { tachyons: [{ name: 'Purple', value: 1e9 }, { name: 'Brown', value: 1e9 }] },
  legendTalents: { talents: [{ originalIndex: 23, bonus }] },
  accountOptions: { 480: spent }
});

describe('GenericUpgradeOptimizer masterclass reductions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  // The game discounts while accountOptions[480] < the talent bonus. The old key was written on first render and never
  // followed the day rolling over. The grant is per day and shared by every masterclass, so a plan spanning days gets it
  // back: capping an override at today's leftovers quotes every later step 5x above what the game charges.
  it.each([
    ['nothing is left of the grant', {}, 12, 0],
    ['the unspent grant while purchases remain', {}, 3, 5],
    ['the live count over the seed the old build froze into storage', { masterClassReduction: 8 }, 12, 0],
    ['the live count over a cleared override', { masterClassReductionOverride: null }, 3, 5],
    ['an explicit override, even past what today has left', { masterClassReductionOverride: 200 }, 12, 200]
  ])('offers %s', (_, stored, spent, expected) => {
    Object.entries(stored).forEach(([key, value]) => seedSetting(key, value));
    const { calls } = renderOptimizer([], { account: buildReductionAccount({ bonus: 8, spent }) });
    expect(calls.at(-1).masterClassReduction).toBe(expected);
  });
});

const buildDiscountRow = (overrides) => ({ ...buildRow({}), ...overrides });

describe('GenericUpgradeOptimizer discount marker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it.each([[true], [false]])('marks only the rows the daily allowance actually paid for: %s', (hadReduction) => {
    const { container } = renderOptimizer([buildDiscountRow({ hadReduction })]);
    expect(container.textContent.includes('-80%')).toBe(hadReduction);
  });

  it('counts how many steps of a grouped row were discounted', () => {
    seedSetting('groupMode', 'Upgrade');
    const { container } = renderOptimizer([
      buildDiscountRow({ hadReduction: true, level: 10 }),
      buildDiscountRow({ hadReduction: true, level: 11 }),
      buildDiscountRow({ hadReduction: false, level: 12 })
    ]);
    expect(container.textContent).toContain('-80% on 2/3');
  });
});

describe('GenericUpgradeOptimizer game order', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const namedRow = (name, index, level) => ({ ...buildRow({}), name, index, level });
  const rowNames = (container) => [...container.querySelectorAll('tbody tr.row')]
    .map((row) => row.querySelector('td.name').textContent.replace(/x[\d,]+$/, ''));

  it('lists one row per upgrade in in-game position, not purchase order', () => {
    seedSetting('groupMode', 'Game order');
    seedSetting('viewMode', 'list');
    const { container } = renderOptimizer([
      namedRow('Late_Upgrade', 30, 10),
      namedRow('Early_Upgrade', 2, 5),
      namedRow('Late_Upgrade', 30, 11),
      namedRow('Middle_Upgrade', 12, 1)
    ]);
    expect(rowNames(container)).toEqual(['Early Upgrade', 'Middle Upgrade', 'Late Upgrade']);
    expect(container.textContent).toContain('Lv 9 → 11');
  });

  it('leaves Summary in purchase order', () => {
    seedSetting('groupMode', 'Summary');
    seedSetting('viewMode', 'list');
    const { container } = renderOptimizer([
      namedRow('Late_Upgrade', 30, 10),
      namedRow('Early_Upgrade', 2, 5)
    ]);
    expect(rowNames(container)).toEqual(['Late Upgrade', 'Early Upgrade']);
  });

  it.each([
    ['Upgrade', ['Late_Upgrade', 'Late_Upgrade', 'Early_Upgrade']],
    ['Summary', ['Late_Upgrade', 'Early_Upgrade', 'Late_Upgrade']]
  ])('a %s card counts its steps instead of listing their places', (group, names) => {
    seedSetting('groupMode', group);
    const { container } = renderOptimizer(names.map((name, step) => namedRow(name, 1, 10 + step)));
    expect(container.textContent).toContain('x2');
    expect(container.textContent).not.toMatch(/#1 to #/);
  });
});

const renderWithAutoRph = (autoResourcePerHour) => renderOptimizer([], { autoResourcePerHour });

describe('GenericUpgradeOptimizer auto resource per hour', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('prices upgrades off the computed rates and hides the manual dialog', () => {
    const { calls, container } = renderWithAutoRph({ 0: 2500, 1: 500 });

    expect(calls.at(-1).resourcePerHour).toEqual({ 0: 2500, 1: 500 });
    expect(container.textContent).not.toContain('Set RPH');
  });

  it('keeps the manual rates when the user picks the manual method', () => {
    seedSetting('optimizationMethod', 'rph');
    seedSetting('resourcePerHour', { 0: 7, 1: 9 });
    const { calls, container } = renderWithAutoRph({ 0: 2500, 1: 500 });

    expect(calls.at(-1).resourcePerHour).toEqual({ 0: 7, 1: 9 });
    expect(container.textContent).toContain('Set RPH');
  });

  it('falls back to manual for an optimizer that has no computed rates', () => {
    seedSetting('optimizationMethod', 'rph-auto');
    seedSetting('resourcePerHour', { 0: 7, 1: 9 });
    const { calls, container } = renderWithAutoRph(null);

    expect(calls.at(-1).resourcePerHour).toEqual({ 0: 7, 1: 9 });
    expect(container.textContent).toContain('Set RPH');
  });
});
